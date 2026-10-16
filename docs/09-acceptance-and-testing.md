# 09 — Acceptance Criteria and Test Strategy

## Confirmed

**Minimum acceptance journey.** It must be possible to create an animal, record several
milestones, find them on Stellar, consult its history publicly, verify its integrity, close its
chain, and confirm it accepts no new ordinary milestones.

**Tests must also cover:** duplication, permissions, concurrency, retries, synchronization
failures, and rectification.

## Proposed

### Test layers

| Layer | Scope | Tool |
|---|---|---|
| Contract unit tests | The five structural invariants, each asserting a **rejection** | Rust `#[test]` with `soroban-sdk` test utils |
| Canonical-hash unit tests | Serialization determinism — the highest-value suite in the project | JS test runner *(not chosen; document 08, Pending)* |
| Schema unit tests | Per-type Zod schemas, bounds, identifier normalization | same |
| Integration tests | Write path, idempotency, authorization, reconciliation, against a real test database | same + a disposable PostgreSQL |
| Manual walkthrough | The end-to-end acceptance journey, including the explorer check | Documented script, run at S7 |

Deliberately **not** proposed: end-to-end browser automation. At MVP scale it would cost more
than the manual walkthrough and catch less than the adversarial cases below.

### A1 — The happy path (the brief's minimum journey)

Run as a documented manual script at the end of S7, in this order:

1. Log in as `owner@demo.local`.
2. Create an animal with an official identifier and a baseline diet → `registration` at `seq 1`
   reaches `confirmed`.
3. Append a `weighing`, a `vaccination`, a `movement` and a `feeding` (diet change) → each
   reaches `confirmed` with consecutive `seq` and intact `prev_hash` linkage.
4. **Find them on Stellar independently of the app:**
   `stellar contract invoke … -- get_records --animal_id <id> --from_seq 1 --limit 10`
   returns every record, and each `tx_hash` resolves on stellar.expert.
5. Open `/a/<animal_id>` in a logged-out browser → full history renders.
6. Verification shows ✅ *Verificado*: every `content_hash` recomputed and matched, linkage
   intact.
7. Close the chain with `death`, confirming by typing the identifier.
8. Confirm the chain refuses new ordinary milestones — **and that the refusal comes from the
   contract**, verified by invoking `append_record` directly from the CLI, not just by observing
   that the UI hides the button.

Step 8's CLI check is what distinguishes this from a UI that merely looks correct.

### A2 — The eight adversarial cases

Each is named with the failure it must produce. A case that "passes" by doing nothing is a
failed test.

| # | Case | Required outcome |
|---|---|---|
| 1 | **Duplicate chain** — create a second animal with an identifier that is already active in the organization | Rejected by the partial unique index with a usable Spanish error; if forced past the app, `create_chain` rejects because the header exists |
| 2 | **Cross-organization write** — a user whose membership is in org B appends to an animal owned by org A | `requireMembership` rejects server-side; rejected even if the request is crafted directly against the Server Action |
| 3 | **Concurrent append** — two sessions append to the same animal simultaneously | One succeeds; the other fails the `prev_hash` check, is **recomputed** for the new `seq` and retried; final chain is linear with no fork, no gap and no duplicate |
| 4 | **Double submit** — the same `record_id` / `Idempotency-Key` posted twice | Exactly **one** chain write; the second returns the existing row. Verified by counting entries on-chain, not by trusting the HTTP response |
| 5 | **Chain confirmed, database update failed** — kill the process between submission and settlement, then run `reconcile` | The row settles from the **chain**, with the correct `seq` and `tx_hash`. No duplicate submission, no orphan |
| 6 | **Post-closure behaviour** — on a closed chain, attempt an ordinary milestone, then a rectification | Ordinary milestone **rejected by the contract**; rectification accepted, cannot re-open the chain, cannot be terminal; both original and rectification visible with their markers |
| 7 | **Tampered PostgreSQL** — manually `UPDATE` a `canonical_payload` or `data` row for a confirmed record, then load the public history | Public history shows ⚠️ **integrity failure** with the offending `seq` — because it read the chain. If it shows ✅, the architecture has silently degraded and the project's central claim is false |
| 8 | **Stellar unreachable** — point `STELLAR_RPC_URL` at a dead host and load the public history | ⛔ *No se pudo verificar*. **No** record content presented as verified; no silent fall-back to cached data |

**Cases 7 and 8 are the project's actual proof.** They are the only tests that catch the system
quietly becoming "a database with a hash column" — the exact failure the brief forbids. They
should be run at every stage after S5, not only at S7.

### A3 — Contract invariant tests (Rust, S3)

One test per invariant, each asserting a panic:

- Overwrite an existing `(animal_id, seq)` → rejected.
- Append with a stale `expected_prev_hash` → rejected.
- Append from an address outside the `Writers` set → rejected.
- `create_chain` when the header already exists → rejected.
- Ordinary or terminal `kind` on a closed chain → rejected.
- `Rectification` attempting to clear `closed` or to be terminal → rejected.
- `close_chain` on an already-closed chain → rejected.

Plus a positive path: create → append ×N → paginated read returns exactly what was written, in
order.

### A4 — Canonical serialization tests (S2)

Determinism is the foundation of every verification claim, so these are explicit:

- Key order in the input object does not change `content_hash`.
- Omitted optional vs. explicit `null` produce the **same** payload (nulls are omitted).
- A decimal quantity never reaches the hash as a float.
- Timestamps normalize to UTC `Z` regardless of input offset.
- Non-ASCII content (`ñ`, accents) hashes stably across platforms.
- `recorded_at` is **not** re-stamped on retry: the same logical record retried produces an
  identical `content_hash`.
- `tx_hash` and `ledger` changing do **not** change `content_hash` (no circular dependency).
- Recomputing the hash from the bytes the contract returned matches the stored `content_hash`.

### A5 — Business-rule tests (S2)

- An animal with a replaced identifier is findable by its **old** number.
- Replacing an identifier preserves `animal_id`, the chain and every record.
- Diet history = `registration.initial_diet` **then** `feeding` deltas; an animal with zero
  `feeding` records still reports a diet.
- A back-dated `occurred_at` appends at the chain's end and does not reorder anything.
- `sale` does not close the chain.
- Only `death` and `slaughterhouse_delivery` are terminal.
- A lot change preserves identity and history.
- Free-text fields reject over-length input; `sale` has no price field to populate.

### Definition of done for the MVP

All of: A1 passes as written, including the CLI checks at steps 4 and 8; all eight A2 cases
produce their required outcome; A3 and A4 suites green; the demo is reproducible from nothing on
a clean machine (document 08, S7 exit); and documents 06 and 07 contain the **measured** numbers
from S3 rather than placeholders.

## Pending

- **JS test runner** not chosen (document 08, Pending).
- **How concurrency case 3 is actually driven.** Two real browser sessions is manual and flaky;
  two parallel Server Action calls is deterministic but tests one layer lower. Not decided.
- **Whether case 5 can be automated** — it needs a process kill at a precise point. A fault
  injection hook in the drainer would make it testable but adds a test-only code path into the
  write path.
- **No performance or load criteria exist.** Acceptable for an ideathon MVP, but it means there is
  no defined answer to "how many animals before the list or the public page becomes unusable".
- **Archived-entry test.** Case 8 covers an unreachable RPC, but a genuinely archived persistent
  entry cannot be produced on demand within a demo timeframe (TTL ≈180 days), so the
  archived-read path will ship **untested** unless it can be simulated.
