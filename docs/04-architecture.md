# 04 — Architecture and Technical Decisions

## Confirmed

**Required technologies:** Next.js with TypeScript; PostgreSQL; Docker Compose to run PostgreSQL
locally; Stellar Testnet; manual deployment for now. If Soroban is used, its contract and
tooling are part of the technical design.

**PostgreSQL may serve search, indexes and operational function, but must not be the only
source of the content presented as verified history.** Storing only a hash on Stellar with the
content in PostgreSQL does **not** satisfy the requirement. The history detail must obtain
records directly from Stellar. Reconstructing an animal's whole life must not depend
exclusively on recent RPC events.

**Must be documented:** the responsibilities of PostgreSQL and Stellar; the flow from load to
confirmation; validations and authorization in both the application and the contract;
prevention of duplicate chains for the same identifier; idempotency and double-submit
protection; concurrency when two users append to the same animal; retries and reconciliation if
Stellar confirms but the PostgreSQL update fails; key management and server-side-only signing if
custody is used; and the contract update policy and its effect on the immutability promise.

**The contract must prevent** overwriting records, appending without authorization, and
continuing a closed chain, per the defined policy. Hiding those actions in the interface is not
sufficient.

**Current repository state (verified):** bare `create-next-app` — Next.js `16.4.2`, React
`19.3.0`, TypeScript `^5`, Biome `2.4.2`, with only `src/app/{layout,page}.tsx` and CSS. No
PostgreSQL client, ORM, migration tool, auth library, Docker Compose file, Stellar/Soroban SDK
or Rust toolchain is present. Every dependency below is a greenfield addition.

## Proposed

### Component overview

```
  Phone / browser
        │
        ├── /animals/*  (authenticated, Server Components + Server Actions)
        │        │
        │        ├─► PostgreSQL ── read model, search, operational state
        │        └─► outbox table ── queued chain writes
        │
        └── /a/<id>     (public, Server Components)
                 │
                 └─► Soroban RPC ──► contract ── THE source of verified history

  Outbox drainer (manual script / dev loop)
        │
        └─► sign with custodial key ─► submit tx ─► Soroban RPC
                 │
                 └─► settle outbox row + records row in PostgreSQL

  reconcile script ─► reads contract ─► settles stuck outbox rows
  ttl:extend script ─► extends persistent-entry TTL
```

### D1 — Division of responsibility

| Concern | PostgreSQL | Soroban contract |
|---|---|---|
| Users, credentials, sessions | **Sole owner** | Never |
| Organizations, memberships, establishments, lots | **Sole owner** | Never |
| Animal rows, identifier history | Owner (operational) | Only the opaque `animal_id` appears on-chain |
| Record payloads | Mirror, for search and operations | **Source of truth for verified history** |
| Sequence, hash linkage, closed flag | Mirror | **Authoritative** |
| Submission state (`pending`…`failed`), outbox | **Sole owner** | Never |
| Transaction metadata (`tx_hash`, ledger) | Stored for convenience and explorer links | Not stored on-chain (would be circular) |

The rule that makes the brief's requirement hold: **the public history route has no code path to
PostgreSQL record payloads.** It is not a convention — it is a module boundary (document 03).

### D2 — Full payload on-chain

The full public payload of each record is stored in the contract's persistent storage
(not just a hash), so the history is reconstructible from the contract alone. Storage layout,
limits and costs are in document 06. The accepted consequence is that record size and field
growth carry a direct on-chain cost and a hard 64 KiB per-entry ceiling.

### D3 — The outbox pattern

Chain writes never happen inline with the HTTP request. The write path is:

1. **Server Action** validates input (Zod), checks `requireMembership`, builds the canonical
   payload, computes `content_hash`, and in **one PostgreSQL transaction** inserts the `records`
   row (`status = 'pending'`) **and** an `outbox` row.
2. The transaction commits. The user gets a response immediately; the record shows as `pending`.
3. The **drainer** picks up outbox rows, signs with the custodial key, submits to Soroban, and on
   confirmation settles both the outbox row and the `records` row (`status = 'confirmed'`, plus
   `seq`, `tx_hash`, `ledger` as returned).

Why the outbox rather than submitting inline:

- A crash between "chain write succeeded" and "database update succeeded" leaves a durable row
  describing the intent, so reconciliation always has something to settle. Inline submission can
  lose that intent entirely.
- The user-facing latency of a ledger confirmation is removed from the request.
- The drainer is a single writer, which serializes submissions per animal naturally and keeps the
  `prev_hash` contention window small.

Staging consequence (document 08): the outbox is introduced in **S2 with a stub drainer that
confirms rows without any chain**, so the whole `pending → confirmed` lifecycle and its UI are
exercised before Soroban exists. S3 builds the contract; S4 replaces the stub with the real
submitter.

### D4 — Idempotency and double-submit

- The client generates `record_id` (ULID) and sends it as an `Idempotency-Key`.
- `records.record_id` carries a unique constraint; re-posting the same key returns the existing
  row instead of enqueuing a second chain write.
- The outbox row's dedupe key is the same `record_id`, so a drainer restart cannot double-submit.
- **Second, independent guard at the contract level:** the `(animal_id, seq)` entry must be empty
  and the submitted `prev_hash` must match the header. A duplicate submission is rejected on-chain
  even if every application-level guard fails.

Two independent guards, because the application-level one alone cannot survive a crash between
submit and persist.

### D5 — Concurrency: two users, one animal

No application-level locking. The contract assigns `seq = count + 1` and requires the submitted
`prev_hash` to equal the header's `last_hash`. Therefore:

- The first append wins and advances the header.
- The second fails the `prev_hash` check and its transaction is rejected.
- The drainer re-reads the header and retries the rejected outbox row against the new head
  (bounded retries with backoff).

The chain cannot fork, and no ordering decision is made outside the contract. This is also why
`seq` is contract-assigned (document 02, R1.2) rather than reserved in PostgreSQL.

### D6 — Reconciliation: chain confirmed, database update failed

The chain — never PostgreSQL — decides what happened.

The `reconcile` script walks every non-`confirmed` `records` row whose outbox row was submitted,
reads the contract's animal header and the `(animal_id, seq)` entry, and settles the row from
what it finds. A row the chain does not know about after its submission window is marked
`failed` and may be re-submitted under a **new** `seq` (document 02, R5.2). Accepted consequence:
a record can exist on-chain while showing `pending` locally until reconciliation runs, so the
operator UI must say "pending confirmation" and never hide it.

### D7 — Custodial signing and key management

A **single custodial Stellar account** signs every write (the MVP choice). What this means, stated
plainly because the brief requires it:

- The network attests that **the TraceID platform** submitted a record. It does not attest who
  authored it.
- `author_id` and `org_id` are fields **inside** the hashed payload, so they are tamper-evident
  (changing them changes `content_hash`) but they are **not** network-attested. A dishonest
  platform operator could write any `author_id`.
- Trust placed in the platform: that it authenticated the author correctly and recorded the
  author faithfully. That trust is not reducible by anything on-chain in this design.

Key handling: the secret key lives only in a server-side environment variable, is never imported
into client code, and signing happens exclusively in the drainer. The contract's authorization
check is written against a **configurable set of authorized writer addresses** rather than a
hard-coded one, so moving to one custodial account per organization later is a configuration
change rather than a rewrite.

### D8 — Contract update policy vs. the immutability promise

The contract is **non-upgradeable**. There is no admin code-replacement path. Consequences, all
accepted deliberately:

- The immutability promise is as strong as a deployed contract's logic can make it: no one,
  including the project, can change the rules after deployment.
- A contract bug means **deploying a fresh contract and re-seeding**, with a new contract id in
  `.env`. Records anchored to the old contract remain in the ledger's history but are no longer
  part of the live chain the application reads.
- Therefore the contract must be kept deliberately small, and it must know nothing about record
  *types* — see D9.

### D9 — A type-blind contract

Because the contract is frozen forever, it treats the record payload as **opaque**: it stores
`content_hash` plus the serialized canonical payload as bytes, and enforces only structural
invariants:

1. Sequence assignment and monotonicity.
2. `prev_hash` linkage.
3. No overwrite of an existing `(animal_id, seq)` entry.
4. Caller is in the authorized writer set.
5. Closed-chain policy: once closed, only `rectification` is admissible, and it cannot re-open
   or be terminal.

All per-type field validation lives in TypeScript (Zod) and in `schema_version`. This is the only
combination that does not paint the project into a corner: the frozen contract enforces exactly
the invariants that make the chain trustworthy, while the record vocabulary stays evolvable. The
integrity guarantee is unaffected, because `content_hash` covers the full payload either way.

The honest cost: the contract cannot reject a semantically invalid record, only a structurally
invalid one. A record with a nonsense weight is immutably recorded as nonsense.

*Note on invariant 5:* enforcing "only `rectification` after closure" requires the contract to
distinguish that one type. It is passed as a small explicit flag/discriminant argument alongside
the opaque payload, so the contract never parses the payload itself. The application must set it
consistently with the payload's `type`; a mismatch is detectable by anyone recomputing the hash.

### D10 — Validation layers

| Layer | Validates |
|---|---|
| Client form | Shape and required fields, for UX only — never trusted |
| Server Action (Zod) | Full per-type schema, bounds, lenient identifier normalization, no floats |
| `requireMembership` | Organization ownership and role, on every write path |
| Database constraints | Unique `record_id`; one active identifier per animal; one open chain per active identifier |
| **Contract** | The five structural invariants in D9 |

### D11 — Duplicate chain prevention

- Database: a partial unique index on the active official identifier, and a check that a second
  open chain cannot be created for an identifier that already has one.
- Contract: `create_chain` fails if the animal's header entry already exists.

Both are required: the database rule is the usable error message, the contract rule is the
guarantee.

### D12 — Stack additions (greenfield, to be installed in S1)

| Need | Proposed | Note |
|---|---|---|
| ORM + migrations | Prisma `7.10.x` + `@prisma/adapter-pg` | Decided in S1, see ADR-0002. `partialIndexes` preview feature for the partial unique indexes |
| PostgreSQL driver | `pg` | — |
| Validation | Zod | Per-type record schemas |
| Auth | Better Auth `1.7.x` + Prisma adapter | Decided in S1, see ADR-0001. Middleware is now `proxy.ts` |
| Password hashing | argon2 | — |
| Ids | ULID | Sortable, opaque, short enough for the 250-byte key limit |
| Stellar | `@stellar/stellar-sdk` | RPC + transaction building |
| Contract | Rust + `soroban-sdk`, Stellar CLI | New `contracts/` directory |
| Local PostgreSQL | Docker Compose | Per the brief |

No paid service, no API key that the provider does not actually require.

## Pending

- ~~Auth library choice and version~~ — resolved in S1: Better Auth, see `docs/adr/0001-better-auth.md`.
- **Drainer execution model.** A manually run script, a dev-mode interval loop, or a long-running
  worker. "Manual deployment" argues for a script plus a dev loop; nothing is decided, and the
  demo's smoothness depends on it.
- **Retry bounds and backoff** for `prev_hash` contention and RPC errors (attempt count, delay,
  and what makes a failure terminal).
- **Measured per-record rent cost on Testnet** — only S3 can produce a real number.
- **Whether `tx_hash` and ledger metadata require an index or historical access** for records
  whose transactions have aged out of RPC retention. The payloads are reconstructible from
  contract storage, but transaction metadata may not be; the fallback is to display the
  stored-in-PostgreSQL value clearly labelled as unverified metadata.
