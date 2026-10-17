# 06 — Hedera Contract and Integration

> **Network changed:** the brief specifies Stellar/Soroban. The project moved to Hedera
> (ADR-0003). This document replaces the former "Stellar Contract and Integration"; the Soroban
> design it superseded is in git history.

## Confirmed

Each animal has a **logical chain of records inside the network**; no independent blockchain is
created per animal. **Hedera Testnet** only; Mainnet is out of scope.

The history detail must obtain records **directly from the network**. Storing only a hash
on-chain with the content in PostgreSQL does not satisfy this requirement. Reconstruction of an
animal's whole life must not depend exclusively on recent events.

The chosen solution must be justified and its **costs, limits and data-retention behaviour**
documented. (The brief's TTL/archival/restoration clause applied to Soroban; on Hedera its
answer is "contract storage does not expire", stated with its caveats below.)

The contract must prevent overwriting records, appending without authorization, and continuing a
closed chain, per the defined policy. Hiding those actions in the interface is not sufficient.

Record creation happens on-chain through a contract; reading the public history goes through the
**mirror node** (ADR-0003).

## Proposed

### Why a smart contract and not HCS alone

Hedera Consensus Service topics are append-only and a `submitKey` restricts who can publish, but
HCS executes no logic. A message with a stale `prev_hash`, or an ordinary milestone after
closure, would be **published** and could only be ignored by readers. That violates the
"must prevent" requirement above. The Smart Contract Service (EVM) can reject those writes,
exactly as the Soroban contract did. Full comparison in ADR-0003.

### Verified platform facts

| Fact | Value | Consequence |
|---|---|---|
| Standard transaction size | ≈ **6 KiB** total (body + signatures) | Payload cap set to **4,096 bytes** so a `ContractExecuteTransaction` with ABI overhead fits |
| Jumbo `EthereumTransaction` (HIP-1086) | callData up to 128 KB | Not used; noted as the escape hatch if the cap must grow |
| Gas per transaction | ≤ **15,000,000** | A new storage slot costs 22,100 gas; a 4,096-byte payload is ~129 slots ≈ 2.9 M gas, inside the limit |
| Unused gas | refunded | Gas limit can be set from the mirror's estimate plus a margin without overpaying |
| Contract rent / storage expiry | **not enabled** by the Hedera Council | No TTL policy needed today; risk carried in document 10 (R3) |
| Mirror `POST /api/v1/contracts/call` | free read-only EVM simulation against mirror state | Public history reads cost nothing and need no account |
| Mirror log search by topic | requires a timestamp range ≤ 7 days | Reason the payload lives in storage, not only in events |
| Testnet reset | roughly quarterly; mirror keeps old data ~2 weeks after | Same recovery strategy as before: deterministic re-seed |

These must be re-checked at S3; network settings can change.

### Storage layout: one slot group per record

```solidity
struct ChainHeader {
    uint32  count;       // records so far; next seq = count + 1
    bytes32 lastHash;    // contentHash of the head record
    bool    closed;
    uint64  createdAt;   // block.timestamp of createChain
}

struct StoredRecord {
    uint32  seq;
    bytes32 contentHash;
    bytes32 prevHash;
    bytes   payload;     // canonical JSON bytes — opaque to the contract
    Kind    kind;        // Ordinary | Terminal | Rectification (discriminant only)
    bytes16 author;      // author_id, informational, mirrors the payload
    uint64  recordedAt;  // block.timestamp
    uint64  blockNumber;
}

mapping(bytes16 => ChainHeader)                       headers;   // animalId -> header
mapping(bytes16 => mapping(uint32 => StoredRecord))   records;   // (animalId, seq) -> record
mapping(address => bool)                              isWriter;  // fixed at construction
address[]                                             writerList;
```

**Why one record per `(animalId, seq)`** rather than an array per animal: the same reasons as
before. An append writes one new record and updates one small header — constant cost, no
rewrite of history, and paginated reads become plain `seq` ranges.

**Why the payload is in storage and not only in an event:** reconstructing a life from logs
would need a seven-day-bounded query per record and a stored timestamp per record to aim it.
Storage gives one paginated `getRecords` call. Events are still emitted for indexers.

`animalId` is the ULID's 128-bit value as `bytes16`, big-endian — the encoding the S2 codec
already produces. `author` uses the same encoding.

### Contract interface

```solidity
constructor(address[] memory writers)                // reverts NoWriters if empty

function createChain(bytes16 animalId, bytes32 contentHash,
                     bytes calldata payload, bytes16 author) external returns (uint32); // always 1

function appendRecord(bytes16 animalId, bytes32 expectedPrevHash, bytes32 contentHash,
                      bytes calldata payload, Kind kind, bytes16 author)
                      external returns (uint32);       // assigned seq

function closeChain(bytes16 animalId, bytes32 expectedPrevHash, bytes32 contentHash,
                    bytes calldata payload, bytes16 author)
                    external returns (uint32);         // terminal record + close, atomically

function getHeader(bytes16 animalId)  external view returns (ChainHeader memory);
function getRecord(bytes16 animalId, uint32 seq) external view returns (StoredRecord memory);
function getRecords(bytes16 animalId, uint32 fromSeq, uint32 limit)
                    external view returns (StoredRecord[] memory); // limit capped internally
function writers() external view returns (address[] memory);
```

Carried over unchanged from the Soroban implementation (S3), now as Solidity:

| Rule | Behaviour |
|---|---|
| Writer set | Passed to the constructor; **fixed forever**, no setter. Rotating a key means a new contract and a re-seed |
| Caller | `msg.sender` must be in `isWriter` (the Soroban `writer` argument and `require_auth()` collapse into the transaction signature) |
| Terminal via append | `appendRecord` rejects `Kind.Terminal` (`TerminalViaAppend`); terminal records only come through `closeChain` |
| Hash check | `contentHash == sha256(payload)` (EVM precompile), else `HashMismatch` |
| Payload size | 1..=**4,096** bytes, else `InvalidPayload` |
| First record | `createChain` writes seq 1 with `prevHash = bytes32(0)` and kind `Ordinary` |
| Pagination | `getRecords` returns `min(limit, MAX_PAGE)` records; `fromSeq == count + 1` returns an empty page and signals the end |

Dropped, because they existed only for Soroban: `admin`, `extend_ttl`, and every TTL bump.

Errors (Solidity custom errors, same names and order as before so the UI messages carry over):
`NotWriter`, `ChainExists`, `ChainNotFound`, `PrevHashMismatch`, `RecordExists`, `ChainClosed`,
`TerminalViaAppend`, `HashMismatch`, `InvalidPayload`, `RecordNotFound`, `InvalidLimit`,
`NoWriters`.

Events: `RecordAppended(bytes16 indexed animalId, uint32 indexed seq, bytes32 contentHash,
Kind kind)` on every write and `ChainTerminated(bytes16 indexed animalId, uint32 seq)` on close (not `ChainClosed`: Solidity
forbids an event sharing a name with the `ChainClosed` error, and the error name is the one the
app maps). A
convenience for indexers and explorers; verification reads storage and never depends on them.

### The five enforced invariants

Unchanged in substance — the contract is **type-blind** (document 04, D9):

1. **Sequence authority.** `appendRecord` reads the header and assigns `seq = count + 1`. The
   application never chooses `seq`.
2. **Hash linkage.** `expectedPrevHash` must equal `header.lastHash`, else revert. This is the
   ordering guarantee and the concurrency control.
3. **No overwrite.** `records[animalId][seq]` must be empty. `createChain` reverts if the header
   exists — the on-chain half of duplicate-chain prevention.
4. **Authorization.** `msg.sender` must be in the writer set fixed at construction.
5. **Closed-chain policy.** If `header.closed`, every `kind` except `Rectification` is rejected. A
   `Rectification` never clears `closed` and is never `Terminal`. `closeChain` reverts on an
   already-closed chain.

**What the contract cannot do, stated plainly:** it cannot reject a semantically invalid record.
A nonsense weight is immutably recorded as nonsense.

### Non-upgradeable, and what that costs

No proxy, no `delegatecall`, no self-destruct path, and the contract is created **without a
Hedera admin key** — so neither `ContractUpdateTransaction` nor `ContractDeleteTransaction` can
touch it. No one, including the project, can change the rules after deployment. A contract bug
means deploying a fresh contract and re-seeding, with a new `HEDERA_CONTRACT_ID`.

There is no admin role in the contract at all. Document 10 carries the "what the deployer can and
cannot do" table.

### Data retention (replaces "TTL, archival and restoration")

- **Contract storage does not expire today.** Hedera has not enabled contract rent. There is no
  keeper script, no restoration runbook and no archived-read state.
- **If rent is enabled in future**, Hedera's announced model charges per storage slot per year
  with an auto-renew account and a grace period before deletion. The contract would need a
  funded auto-renew account, and the fallback design (header in storage, payload in events read
  from the mirror) becomes relevant. Tracked as R3 in document 10.
- **The mirror node keeps the full history** of contract results for the network's life, so
  `tx_id`, consensus timestamp and the transaction's effects remain queryable — the old
  "transaction metadata aged out of RPC retention" problem (former O27) no longer applies on
  Testnet between resets.

### Testnet resets

Hedera Testnet resets roughly once a quarter, announced in advance. A reset erases accounts,
contracts and state; the old mirror data stays queryable for about two weeks. Recovery is by
**re-running the deterministic seed** against a freshly deployed contract (document 07). Anything
typed live during a demo is lost. The UI's environment banner says so.

### Integration from Next.js

- **`@hashgraph/sdk`** for writes: `ContractExecuteTransaction` with the ABI-encoded call,
  signed by the operator account (`HEDERA_OPERATOR_ID` / `HEDERA_OPERATOR_KEY`), submitted and
  awaited for its **receipt** (consensus). The key is never imported into client code.
- **Gas** is set from `POST /api/v1/contracts/call` with `"estimate": true`, plus a margin;
  unused gas is refunded.
- **Reads** — public history, `reconcile`, and the drainer's header read — use the mirror REST
  API with `fetch`: `POST /api/v1/contracts/call` with `data` = the ABI-encoded `getHeader` /
  `getRecords` call, decoded with an ABI coder (`viem` or `ethers`, chosen in S4). Hard timeout;
  on timeout or error the page renders "could not verify".
- **Settling a write:** the receipt proves consensus; the drainer then polls the mirror
  (`getRecord(animalId, seq)`, bounded) until the record is readable, and only then marks the row
  `confirmed`. This keeps R5's meaning — "on-chain and read back successfully" — despite mirror
  lag.
- **Transaction metadata** stored in PostgreSQL: the Hedera transaction ID
  (`0.0.<payer>@<seconds>.<nanos>`), the consensus timestamp, and the EVM-style transaction hash
  the mirror reports. Explorer links point to HashScan.
- **Verification on read:** recompute `sha256(canonical_json(payload))` from the bytes the
  contract returned and compare to `contentHash`; walk the chain checking each `prevHash` against
  the previous `contentHash`. Both must pass for ✅.

### What carries over from the Soroban implementation

| Kept as-is | Changed | Removed |
|---|---|---|
| Five invariants, error set, `kind` discriminant, payload opacity, hash check, fixed writer set, pagination semantics, ULID → 16-byte key | Language (Rust → Solidity), caller model (`msg.sender`), payload cap (8,192 → 4,096), timestamps (`recorded_ledger` → `recordedAt` + `blockNumber`) | `admin`, `extend_ttl`, TTL bumps, archival handling |

## Pending

- **Measured per-record cost on Testnet** (gas and HBAR, at a realistic and at a maximum-size
  payload). Required before any claim about the cost of a 20-record animal.
- **Measured append latency**: submission → receipt, and receipt → visible on the mirror. Sets
  the `pending → confirmed` UI mechanism (document 03, Pending) and the drainer's mirror-poll
  bound.
- **`MAX_PAGE` for `getRecords`.** Must keep a page of maximum-size payloads inside the mirror
  simulation's gas and response limits. **20** provisionally (50 × 4 KiB would approach the
  15 M gas ceiling in `SLOAD`s alone); confirm with maximum-size payloads.
- **`msg.sender` for an ECDSA operator account** calling through `ContractExecuteTransaction`:
  confirm in S3 whether it is the account's EVM alias or its long-zero address, and pass that
  address to the constructor.
- **Tooling:** Foundry vs. Hardhat for compile and tests (Foundry proposed, document 07), and the
  ABI library for the app (`viem` vs. `ethers`).
- **Mirror trust.** Whether the public page should offer a second mirror for cross-checking, or
  only document that `HEDERA_MIRROR_URL` can point elsewhere.
- **Confirmation of the network change** with the brief's owner (ADR-0003).
