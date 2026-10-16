# 06 — Stellar Contract and Integration

## Confirmed

Each animal has a **logical chain of records inside Stellar**; no independent blockchain is
created per animal. Stellar **Testnet** only; Mainnet is out of scope.

The history detail must obtain records **directly from Stellar**. Storing only a hash on Stellar
with the content in PostgreSQL does not satisfy this requirement. Reconstruction of an animal's
whole life must not depend exclusively on recent RPC events.

A Soroban contract with **structured persistent records and paginated access** is to be
evaluated as the initial proposal; the chosen solution must be justified and its **costs,
limits, TTL, archival and restoration** documented.

The contract must prevent overwriting records, appending without authorization, and continuing a
closed chain, per the defined policy. Hiding those actions in the interface is not sufficient.

If Soroban is used, its contract and tooling are incorporated into the technical design.

## Proposed

### Verified platform facts

These numbers drive every decision below and were verified against Stellar documentation:

| Limit | Value |
|---|---|
| Serialized contract-data **ledger key** | ≤ **250 bytes** |
| Serialized contract-data **ledger entry** | ≤ **64 KiB** |
| Maximum entry TTL (`max_entry_ttl`) | ≈ **180 days**; no extension may exceed it |
| On expiry | `persistent` and `instance` entries are **archived** (recoverable by paid restore); `temporary` entries are **deleted permanently** |
| Entries touched per transaction | ≤ **200** |
| Bytes written per transaction | ≤ **132,096** |

Two consequences follow immediately: persistent storage requires an active TTL-maintenance
policy, and heavily archived state cannot necessarily be restored in a single transaction.

### Storage layout: one entry per record

```rust
// Keys
enum DataKey {
    Header(BytesN<16>),              // animal_id -> ChainHeader
    Record(BytesN<16>, u32),         // (animal_id, seq) -> StoredRecord
    Admin,                           // instance storage
    Writers,                         // instance storage: authorized writer set
}

struct ChainHeader {
    count: u32,                      // records so far; next seq = count + 1
    last_hash: BytesN<32>,           // content_hash of the head record
    closed: bool,
    created_at: u64,                 // ledger timestamp
}

struct StoredRecord {
    seq: u32,
    content_hash: BytesN<32>,
    prev_hash: BytesN<32>,
    payload: Bytes,                  // the canonical JSON bytes — opaque to the contract
    kind: RecordKind,                // Ordinary | Terminal | Rectification (discriminant only)
    author: BytesN<16>,              // author_id, informational, mirrors the payload
    recorded_ledger: u64,
}
```

**Why one entry per record** rather than one entry per animal holding a `Vec<Record>`:

- A per-animal vector would have to fit the animal's **entire life in 64 KiB**, and a long-lived
  animal would eventually be unable to append at all — the chain would brick itself.
- Every append to a vector **rewrites and re-charges the whole vector**, so cost grows
  quadratically with history length.
- Per-record entries make append a constant-cost operation: write one new entry, update one tiny
  header. No size cliff, no rewrite of history.
- Paginated reads become plain `seq` ranges, which is exactly the "paginated access" the brief
  asks for.

The alternative of chunked pages (N records per entry) was rejected as added complexity with no
benefit at MVP scale.

`animal_id` is a 16-byte ULID precisely so that `Record(animal_id, seq)` stays far below the
250-byte key ceiling. A payload must stay under 64 KiB minus the struct's fixed fields; with the
field caps in document 05, a realistic record is on the order of a few hundred bytes, so the
headroom is roughly two orders of magnitude.

### Contract interface

```rust
fn init(env, admin: Address, writers: Vec<Address>)

fn create_chain(
    env, animal_id: BytesN<16>, content_hash: BytesN<32>,
    payload: Bytes, author: BytesN<16>,
) -> u32                              // returns seq, always 1

fn append_record(
    env, animal_id: BytesN<16>, expected_prev_hash: BytesN<32>,
    content_hash: BytesN<32>, payload: Bytes,
    kind: RecordKind, author: BytesN<16>,
) -> u32                              // returns the assigned seq

fn close_chain(                       // terminal record + close, atomically
    env, animal_id: BytesN<16>, expected_prev_hash: BytesN<32>,
    content_hash: BytesN<32>, payload: Bytes, author: BytesN<16>,
) -> u32

fn get_header(env, animal_id: BytesN<16>) -> ChainHeader
fn get_record(env, animal_id: BytesN<16>, seq: u32) -> StoredRecord
fn get_records(env, animal_id: BytesN<16>, from_seq: u32, limit: u32)
    -> Vec<StoredRecord>              // paginated; limit is capped internally

fn extend_ttl(env, animal_id: BytesN<16>, from_seq: u32, limit: u32)
```

`get_*` are read-only simulations — the public history page calls them via RPC simulation and
pays nothing.

### The five enforced invariants

The contract is **type-blind** (document 04, D9) and enforces only structure:

1. **Sequence authority.** `append_record` reads the header and assigns `seq = count + 1`. The
   application never chooses `seq`.
2. **Hash linkage.** `expected_prev_hash` must equal `header.last_hash`, else panic. This is the
   ordering guarantee and the concurrency control.
3. **No overwrite.** `Record(animal_id, seq)` must not already exist. `create_chain` fails if the
   header exists — which is the on-chain half of duplicate-chain prevention.
4. **Authorization.** `env.current_contract_address()` aside, the caller must
   `require_auth()` and be a member of the `Writers` set. The set is **configurable at init**, so
   moving from one custodial key to one key per organization later is a configuration change, not
   a rewrite.
5. **Closed-chain policy.** If `header.closed`, every `kind` except `Rectification` is rejected.
   A `Rectification` may never clear `closed` and may never be `Terminal`. `close_chain` fails on
   an already-closed chain.

`kind` is a small explicit discriminant passed **alongside** the opaque payload, so the contract
never parses JSON. The application must keep it consistent with the payload's `type`; a mismatch
is detectable by anyone who recomputes the hash and reads the payload, which is the same
tamper-evidence that covers every other field.

**What the contract cannot do, stated plainly:** it cannot reject a semantically invalid record.
A nonsense weight is immutably recorded as nonsense. It validates that the chain is well-formed,
never that the world is as described.

### Non-upgradeable, and what that costs

There is no code-replacement path (document 04, D8). No one, including the project, can change
the rules after deployment — which is the strongest form of the immutability promise available.
The price: **a contract bug means deploying a fresh contract and re-seeding**, with a new
`CONTRACT_ID` in `.env`. Records anchored to the old contract remain in the ledger's history but
leave the live chain the application reads. This is why the contract is kept this small.

The `Admin` address therefore has a deliberately tiny surface: it can extend TTLs and (optionally)
amend the `Writers` set. It **cannot** modify, delete or reorder a record, and it cannot replace
the code. Document 10 carries this as an explicit "what the admin key can and cannot do" table.

### TTL, archival and restoration

**Policy: bump-on-access plus a manual keeper script.**

- Every `create_chain` / `append_record` / `close_chain` extends the TTL of the header and of the
  entries it touches to the maximum allowed (`max_entry_ttl`, ≈180 days).
- `extend_ttl(animal_id, from_seq, limit)` lets a keeper walk an animal's records in pages,
  respecting the 200-entry / 132,096-byte per-transaction limits.
- A documented script, `npm run ttl:extend`, walks every animal and extends everything. It is run
  manually, consistent with the brief's "manual deployment for now".

**Archival is a real limitation, documented rather than solved.** If an entry's TTL lapses, the
entry is archived and the contract cannot read it until someone pays to restore it. For a chain
with many records, restoration may need **several transactions** because of the 200-entry and
132 KB per-transaction caps. The public history must surface an archived read as **"no se pudo
verificar"** (document 03) rather than as missing data — an archived record is not a deleted
record, but it is not verifiable in that moment either.

An automated cron keeper was rejected as outside the manual-deployment scope; ignoring TTL
entirely was rejected because it would make the documentation dishonest — an "immutable public
history" that quietly becomes unreadable within six months is a claim that would have to be
retracted.

### Testnet resets

Testnet is a demonstration environment subject to resets and offers no permanent preservation of
history. On reset, the contract and all its state are gone. Recovery is by **re-running the
deterministic seed**, which writes fixtures to both PostgreSQL and a freshly deployed contract
(document 07). Anything a user typed live during a demo is permanently lost — only seeded
fixtures come back. This is stated in the UI's environment banner, not just in the docs.

### Integration from Next.js

- `@stellar/stellar-sdk` for transaction building, simulation and submission.
- **Writes** happen only in the outbox drainer, server-side, signing with
  `STELLAR_SECRET_KEY`. The secret is never imported into client code and never reaches the
  browser bundle.
- **Reads** for the public history are RPC **simulations** of `get_records`, paginated by `seq`,
  with a hard timeout. On timeout or error the page renders the "could not verify" state.
- Verification on read: recompute `sha256(canonical_json(payload))` from the bytes the contract
  returned and compare to the returned `content_hash`; then walk the chain checking each
  `prev_hash` against the previous record's `content_hash`. Both checks must pass for the
  ✅ state.

## Pending

- **Measured per-record rent cost on Testnet.** Only S3 can produce a real number. Required
  before any claim about the cost of a 20-record animal.
- **Measured append latency** (submission to confirmation), which determines whether the
  `pending → confirmed` UI needs polling, streaming or a refresh button (document 03, Pending).
- **Whether `Writers` should be amendable by the admin after init.** Amendable is operationally
  convenient; fixed-at-init is a stronger promise. Not decided.
- **Restoration runbook.** The mechanics of restoring an archived chain across multiple
  transactions are understood in principle but not written as a tested procedure.
- **Internal cap for `get_records` `limit`.** Must stay inside the read resource limits of a
  single simulation; the value needs measurement.
- **`BytesN<16>` vs. `String` for `animal_id`.** A 16-byte ULID keeps keys small, but the
  application's ULID is a 26-character string; the encode/decode boundary must be exact and
  tested, or keys will silently diverge between writer and reader.
