# 08 — Staged Implementation Plan

## Confirmed

Documentation must be divided into **small stages**, coherent and actionable, without
unnecessarily expanding MVP scope. Deployment is manual. The listed out-of-scope items must not
become MVP dependencies.

**Status (2026-10-16):** S1 and S2 implemented. S3 built a Soroban contract, then the network
changed to **Hedera** (ADR-0003) before that contract was deployed, so **S3 is reopened**: the
contract is rewritten in Solidity with the same invariants (`contracts/traceid/`, Foundry, all
Soroban tests ported and passing; the S2 follow-ups done), and its Testnet deploy and
measurements are still outstanding (documents 06 and 07 carry the measurement Pendings). The earlier UI prototype lives in `prototype/` as visual reference only —
it runs on mock data and is excluded from the build.

S2 shipped one thing earlier than planned: the TypeScript ULID ↔ 16-byte codec (`bytes16` on
Hedera), which document 06 assigned to S4. It is pure and cheap to test, and bringing it forward means the real
submitter has nothing left to invent.

## Proposed

Seven stages. Each one is **independently demoable** — it ends with something a person can be
shown — and each lists its exit criteria explicitly so "done" is not a judgement call.

### The network change (ADR-0003) and what it touches

Only stages S3 onward change. S1 and S2 — the database, auth, domain model, canonical hashing,
outbox lifecycle and operator UI — are network-agnostic and stand as built, apart from two small
follow-ups assigned to S3 below (the payload cap and module names). The business rules of
documents 02 and 05 are unchanged; the contract enforces the same five invariants. What changes
is the contract's language and tooling, how writes are signed and submitted, and that reads go
through the mirror node. TTL maintenance disappears from S3 and S6.

### The load-bearing sequencing decision: S2 before S3

The domain model is built and validated against a real UI **with no blockchain at all**, and the
contract comes afterwards. Rationale: the chain is the expensive, slow-to-change half of this
system, and a non-upgradeable contract (document 04, D8) makes a late data-model change
catastrophic — it means a redeploy and a re-seed. Settling the payload shape against a working UI
first is worth the risk.

**The risk being accepted:** S3 may reveal a constraint that forces a late change to the payload
shape. This is mitigated, not eliminated, by pinning the canonical serialization and the full
hashed field set in document 05 **before either stage starts**, and by the payload-size headroom
calculation in document 06 (4,096-byte cap on Hedera, against records of a few hundred bytes).

### The outbox threads through S2–S4

Per the design session, the outbox is introduced early and completed late:

- **S2** creates the `outbox` table and a **stub drainer** that confirms rows without any chain.
  The entire `pending → submitted → confirmed → failed` lifecycle, its UI states, and
  idempotency are exercised before any contract exists.
- **S3** builds the contract the drainer will eventually target.
- **S4** replaces the stub with the real submitter, and the lifecycle code it drives is already
  proven.

This is why a chain integration that normally lands as one risky step lands as three small ones.

---

### S1 — Foundation

**Goal:** a running app with a database, migrations, seeded users and working login.

- `docker-compose.yml` with PostgreSQL + named volume + healthcheck.
- Prisma ORM + migrations; `db:migrate` script. *(Changed from Drizzle: ADR-0002.)*
- Schema: `organizations`, `users`, `memberships`, `establishments`, `lots` (document 05).
- Auth: seeded per-user accounts, argon2 hashes, server-side sessions, `requireMembership`
  helper. *Resolved: Better Auth (ADR-0001).*
- `db:seed` for orgs, users, memberships, establishments, lots.
- `.env.example` committed; `.env.local` git-ignored.
- Spanish app shell, mobile-first layout, environment banner.
- Biome passing; TypeScript strict.

**Exit:** `docker compose up -d && npm run db:migrate && npm run db:seed && npm run dev`, then
log in as `owner@demo.local` and see an empty animal list. Logged-out access to `/animals`
redirects to `/login`.

**Demo:** "the app runs, the database runs, three users with distinct roles can log in."

---

### S2 — Domain and records, PostgreSQL only

**Goal:** the entire product works, with no blockchain whatsoever.

- Schema: `animals`, `animal_identifiers` (with both partial unique indexes),
  `animal_lot_history`, `records`, `outbox`.
- Zod schemas for all eleven record types, `schema_version: 1` (document 05).
- Lenient SENASA identifier normalization + `detected_format`, with the non-blocking
  "format not recognized" badge.
- Canonical serialization and `content_hash` implemented and **unit-tested** — sorted keys,
  no floats, UTC `Z`, omitted nulls. This is the highest-value test suite in the project.
- `/animals`, `/animals/new` (with baseline diet in `registration`), `/animals/<id>`,
  `/animals/<id>/records/new`, `/animals/<id>/close`.
- Search across active **and historical** identifiers.
- Write path: Server Action → validate → `requireMembership` → build payload → hash →
  **insert `records` + `outbox` in one transaction** → respond.
- Idempotency via client-generated `record_id` and the unique constraint.
- **Stub drainer** that moves outbox rows to `confirmed` with a fake `seq`/`prev_hash` chain
  computed locally, so linkage logic is exercised.
- Record-state UI: `pending` / `submitted` / `confirmed` / `failed`, always visible.

**Exit:** create an animal, append several milestone types, close the chain, see ordinary
milestones refused afterwards and rectification offered — all without a single chain call.
Canonical-hash tests green.

**Demo:** "the whole product, minus the proof."

---

### S3 — The Hedera contract, in isolation *(reopened by ADR-0003)*

**Goal:** a deployed, tested contract on Hedera Testnet. No application integration yet.

- Replace the Soroban crate in `contracts/traceid/` with a **Foundry project**: `src/TraceId.sol`,
  `test/TraceId.t.sol`, `foundry.toml` with `solc` pinned. The Soroban code stays in git history.
- Storage layout, interface, errors and events from document 06. The five structural invariants
  implemented; `sha256(payload) == contentHash` checked; payload 1..=4,096 bytes; writer set
  fixed in the constructor; no admin, no proxy, no TTL code.
- Foundry tests, one or more per invariant, each asserting the **revert with its custom error**:
  overwrite refused, wrong `prevHash` refused, non-writer refused, ordinary milestone on a closed
  chain refused, `createChain` on an existing header refused, terminal via append refused,
  closing twice refused, rectification unable to re-open or be terminal, empty writer set
  refused. Port the existing Rust test list one-for-one so no case is lost.
- Create the Testnet operator account (ECDSA) and deploy with the writer set; confirm on HashScan
  that the contract has **no admin key**.
- **Measure and record**: per-record gas and HBAR at realistic and maximum payload size; latency
  submission → receipt and receipt → visible on the mirror; a safe `MAX_PAGE` for `getRecords`
  through mirror `contracts/call`; the `msg.sender` address an ECDSA operator presents
  (document 06, Pending).
- Follow-ups in the S2 code: `MAX_PAYLOAD_BYTES` 8,192 → **4,096** and `MAX_PAGE` to the measured
  value in `src/lib/stellar/contract-limits.ts`; rename `src/lib/stellar/` to `src/lib/chain/`;
  update the environment banner copy. The ULID ↔ 16-byte codec is reused unchanged as `bytes16`.
- Pin the real tool versions in document 07.

**Exit:** with `cast` and `curl` against the mirror alone — create a chain, append records, read
them back paginated, close the chain, and watch each invariant revert with the right error.
Measurements written into documents 06 and 07.

**Demo:** "the rules are enforced by the contract, provable from a terminal with the app
switched off."

---

### S4 — Real write path

**Goal:** records written by the app land on-chain.

- `@hashgraph/sdk` integration, server-side only; an ABI coder (`viem` or `ethers`) for call
  encoding and mirror decoding.
- Replace the stub drainer with the real submitter: read the header via mirror `contracts/call`
  → compute payload for `seq = count + 1` → estimate gas → `ContractExecuteTransaction` signed with
  `HEDERA_OPERATOR_KEY` → await receipt → poll the mirror until `getRecord(animalId, seq)` returns
  it (bounded) → settle `records` + `outbox`.
- `PrevHashMismatch` handling: on revert, re-read the header, **recompute** the payload for the
  new `seq` (never patch it — `seq` and `prev_hash` are hashed fields), retry with bounded
  backoff. A receipt without mirror visibility inside the bound leaves the row `submitted` for
  `reconcile`.
- Prisma migration: add `tx_id` and `consensus_timestamp` to `records`, drop `ledger`; keep
  `tx_hash` for the mirror's EVM-style hash. Persist them; never hash them.
- HashScan links in the operator UI.
- `recorded_at` fixed once before submission and never re-stamped on retry — with a test.

**Exit:** the section-9 verification walkthrough in document 07 passes: a record created in the
UI is readable via `cast call` / mirror `contracts/call` and visible on HashScan.

**Demo:** "a milestone loaded on a phone, found on a public blockchain explorer."

---

### S5 — Public history, live verification and QR

**Goal:** the verifier's journey, reading only the chain.

- `/a/<animal_id>` server-rendered, **no PostgreSQL record payloads in its data path** — enforced
  as a module boundary, not a convention (document 03).
- Paginated `getRecords` through mirror `contracts/call`; recompute every `content_hash`; walk
  the `prev_hash` linkage.
- Three verification states, never ambiguous: ✅ verified / ⚠️ integrity failure / ⛔ could not
  verify. The last one must never degrade into a cached render.
- `/a/<animal_id>/records/<seq>` evidence screen: canonical payload as hashed, `content_hash`,
  `prev_hash`, transaction ID and hash, network, contract ID, consensus timestamp, mirror URL,
  HashScan link, side-by-side hash comparison.
- Always-visible limitations panel: integrity and ordering verifiable; author identity is a
  platform claim; truthfulness unverified.
- QR generation encoding `https://<host>/a/<animal_id>`; printable view.

**Exit:** scan a QR on a phone with no session and reach a verified history. Point
`HEDERA_MIRROR_URL` at a bad URL and confirm the page says "no se pudo verificar" and shows no history as
verified.

**Demo:** "a buyer scans an ear tag and verifies the animal's life, with no account."

---

### S6 — Closure, rectification, and the operational scripts

**Goal:** the lifecycle's edges, and the jobs that keep it honest.

- `closeChain` wired end to end with the typed-confirmation UI and the explicit warnings
  (irreversible; slaughterhouse delivery does **not** demonstrate slaughter).
- Rectification: available on open and closed chains; "rectifica #N" / "rectificado por #N"
  markers in both the operator and public views; both records always preserved and displayed.
- `reconcile` script — settles non-`confirmed` rows by reading the contract through the mirror,
  recovering missing transaction metadata from the mirror's contract results; marks rows the
  chain does not know as `failed`, re-submittable under a **new** `seq`.
- *(Removed by ADR-0003: the `ttl:extend` script and the archived-entry read state. Hedera
  contract storage does not expire.)*

**Exit:** kill the process between submission and settlement, run `reconcile`, and watch the row
settle correctly from the chain. Close a chain, attempt an ordinary milestone and have the
**contract** refuse it, then rectify successfully.

**Demo:** "it survives being interrupted, and the chain is what decides what happened."

---

### S7 — Seed, docs and the acceptance walkthrough

**Goal:** a demo that can be rebuilt from nothing, and documentation that matches reality.

- `seed:chain` — deterministic fixtures written to **both** PostgreSQL and the contract: several
  animals with varied histories, one closed by `death`, one closed by `slaughterhouse_delivery`,
  one with a rectification, one with a replaced identifier, one with a diet change.
- Post-reset recovery procedure executed for real, end to end, and corrected in document 07.
- Update documents 06 and 07 with the measured numbers from S3.
- Run the full acceptance matrix (document 09) and record results.
- Move resolved Pending items out of document 10; add anything new that surfaced.

**Exit:** on a clean machine — `docker compose up`, migrate, seed, deploy, `seed:chain` — the
demo is fully reproducible, and the acceptance walkthrough passes as written.

**Demo:** the complete minimum acceptance journey from the brief: create an animal, record
several milestones, find them on Hedera (HashScan and the mirror), consult the history publicly, verify integrity, close
the chain, confirm it refuses new ordinary milestones.

---

### What is deliberately *not* in any stage

Mainnet; NFTs, tokens, payments; SENASA or RFID integration; sensors or hardware; invitation and
permission-assignment flows; automated permission transfer on sale; other species or countries;
native mobile apps; CI/CD or deployment automation; an offline write queue; HCS topics; a
self-hosted mirror node.

If any of these appears to be required to finish a stage, that is a scope error — record it in
document 10 rather than implementing it.

## Pending

- **Whether S3 should precede S2** if the team's appetite for contract risk is lower than the
  appetite for data-model rework. The chosen order is argued above but is a genuine trade-off.
- **Stage ownership and calendar.** Nothing here is estimated in time, and the ideathon's actual
  deadline is unknown to this document.
- **Whether S5's public route may read PostgreSQL for display labels at all** (document 03,
  Pending) — affects S5's module boundary.
- **Integration tests against a test database.** The JS test runner is settled: **`node:test`
  run through `tsx`** (`npm test`), chosen because it adds no dependency and the suites that
  matter — canonical serialization, the ULID codec, the identifier validator and the contract
  invariants on the stub writer — are all pure. What is still missing is the test *database*:
  the write path and the drainer were verified end to end by hand against a real PostgreSQL,
  not by an automated suite. The obstacle is that authorization lives inside the write path, so
  a test needs a real session; the honest options are a seam for the actor or a session fixture,
  and neither is decided.
- **A stop line.** If S3's measurements show per-record cost or latency to be unacceptable, there
  is no agreed fallback. The honest options would be reducing payload size, or moving the payload
  from storage to events (ADR-0003, option C) — the latter reopens document 06's read path.
- **Confirmation of the network change** with the brief's owner (ADR-0003). If Stellar is
  mandatory after all, S3 reverts to the Soroban crate in git history and the rest of this plan
  returns to its previous Stellar wording.
