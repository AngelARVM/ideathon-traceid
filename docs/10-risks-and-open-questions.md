# 10 — Risks, Assumptions and Open Decisions

## Confirmed

Confirmed requirements must be separated from proposed decisions and from pending questions.
Where a contradiction or a decision that substantially changes scope is found, it must be
flagged with a concrete option proposed — **a central requirement must never be silently
substituted with a simpler implementation**.

## Proposed

### The one contradiction in the brief, and how it was resolved

The brief requires the public history to be read **directly from Stellar** and explicitly
rejects "hash on-chain, content in PostgreSQL". It also mandates **Testnet**, whose persistent
storage is rent-bearing, archivable after ≈180 days, and periodically wiped by network resets.

> **The verifiable source of truth was placed in the one environment guaranteed to be erased.**

This is a real tension, not a misreading. It was resolved rather than papered over:

- The central requirement is **honoured literally** — the full public payload lives in contract
  storage, and the public history route has no code path to PostgreSQL record payloads
  (documents 04, 06).
- The ephemerality is **disclosed, not hidden** — an environment banner in the UI, an explicit
  statement in the setup document, and a deterministic seed that rebuilds the demo in both
  PostgreSQL and a fresh contract after a reset (document 07).
- **What cannot be recovered is stated plainly:** anything typed live during a demo is lost on
  reset; only seeded fixtures come back.

No simpler substitution was made. If the project later needs genuine durability, that is a
Mainnet decision, which is explicitly out of scope.

### What the admin key can and cannot do

Required by the brief's contract-update-policy clause. The contract is **non-upgradeable**.

| The admin **can** | The admin **cannot** |
|---|---|
| Extend the TTL of persistent entries | Modify the content of any record |
| (Optionally) amend the authorized writer set | Delete or reorder any record |
| Deploy an entirely **new** contract, with a new id | Replace the deployed contract's code |
| — | Re-open a closed chain |
| — | Make the application read the old contract after a redeploy without changing `.env` |

The immutability promise is therefore as strong as a deployed contract can make it. Its real
limit is not the admin key but the custodial writer key, below.

### Accepted risks

| # | Risk | Consequence | Why accepted | Mitigation |
|---|---|---|---|---|
| R1 | **Custodial signing** — one platform key signs everything | The network attests only that *the platform* submitted a record. A dishonest operator could write any `author_id` | An MVP cannot carry wallet onboarding for field users | Author identity disclosed as a platform claim in the UI's limitations panel; contract's writer set is configurable so per-org keys are a config change (document 04, D7) |
| R2 | **Testnet reset wipes history** | The verified history disappears; the demo must be rebuilt | Mainnet is out of scope | Deterministic `seed:chain`; UI banner; documented recovery (document 07, §10) |
| R3 | **TTL ≈180 days / archival** | An unmaintained chain becomes unreadable until paid restoration; restoring a long chain may need several transactions (200-entry, 132 KB caps) | Automated keepers are outside manual-deployment scope | Bump-on-access in every write path; manual `ttl:extend`; archived reads surface as "could not verify", never as missing data |
| R4 | **Non-upgradeable contract** | A contract bug means a fresh deploy, a new contract id and a re-seed | Chosen deliberately for the stronger promise | Contract kept minimal and type-blind; invariant tests in S3 before any integration |
| R5 | **Type-blind contract** | The contract cannot reject a semantically invalid record. A nonsense weight is immutably recorded as nonsense | The alternative freezes the record vocabulary forever | Validation in Zod; `schema_version` in the hashed payload; integrity unaffected |
| R6 | **Full payload on-chain** | Record size and field growth carry direct on-chain cost; 64 KiB per entry is a hard ceiling | The brief's central requirement | One entry per record (no vector rewrite); field caps; ~2 orders of magnitude of headroom |
| R7 | **Truthfulness is unverified** | A producer can anchor a false fact permanently and the platform will display it as verified-integrity | No sensor or official cross-check is in scope | The three-claims table (document 01) stated in product copy, not only in docs |
| R8 | **QR encodes the host** | Moving domains invalidates printed QR codes | Acceptable for an MVP | Documented; the internal ULID (not the tag number) is the stable part of the URL |
| R9 | **Lenient identifier validation** | Malformed or duplicate-looking identifiers can be stored | A strict regex built on an ambiguous regulation would reject real ear tags | `detected_format` recorded; non-blocking warning badge; tightenable once an authoritative format is confirmed |
| R10 | **PostgreSQL mirror can drift from the chain** | The operator list could show stale `seq` / status while the chain has moved on | Mirrors exist for search performance | `reconcile` settles from the chain; the public history never reads the mirror |
| R11 | **No first verifier identified** | The core commercial hypothesis is untested | Validation is out of MVP scope | Named as the project's largest unknown (document 01, Pending) |
| R12 | **Archived-read path may ship untested** | A code path that only triggers after ≈180 days cannot be exercised in a demo timeframe | No practical alternative | Flagged in document 09, Pending |

### Assumptions

1. **Node ≥ 20, npm as the package manager** (the repo carries `package-lock.json`).
2. **Next.js 16.4.2 as pinned**, with App Router, Server Components and Server Actions; note that
   `middleware.ts` is now `proxy.ts` in Next.js 16.
3. **Soroban platform limits as verified**: 250-byte keys, 64 KiB entries, ≈180-day max TTL,
   200 entries / 132,096 bytes per transaction. These are network-defined settings and could
   change; they must be re-checked at S3.
4. **One organization, seeded, for the demo.** Multi-organization behaviour is modelled and
   authorization-checked but not exercised at scale.
5. **Species fixed to `bovine`**, modelled for expansion.
6. **Demo passwords are not secrets.** The seed is expected to refuse non-local databases without
   an explicit override.
7. **Spanish UI, English documentation.**
8. **No paid service and no API key** anywhere in the project. Testnet RPC and Friendbot are
   public and unauthenticated.

### Open decisions — consolidated

These are the Pending items from every document, gathered. **None may be resolved silently during
implementation.** Each must be raised and decided.

**Blocking before S1** — resolved.

- ~~O1 — Auth library~~ and ~~O2 — version~~: Better Auth `1.7.x`. See
  `docs/adr/0001-better-auth.md`.

**Blocking before S3**

- **O3 — Tool versions**: Rust toolchain, `soroban-sdk`, Stellar CLI, wasm target. To be pinned by
  actually building. *(document 07)*
- **O4 — `BytesN<16>` ↔ ULID encoding.** The 26-character application ULID and the 16-byte
  contract key must map exactly, or writer and reader will silently use different keys.
  *(document 06)*

**Must be measured in S3, then written back into documents 06 and 07**

- **O5** Per-record rent cost on Testnet.
- **O6** Append latency, submission to confirmation — determines the `pending → confirmed` UI
  mechanism (polling, streaming, or a refresh button). *(documents 03, 06)*
- **O7** Safe internal cap for `get_records`, inside single-simulation read limits.

**Design questions still open**

- **O8 — May the public route read PostgreSQL for display labels at all?** Current proposal
  embeds public labels in the on-chain payload to avoid it. Affects S5's module boundary.
  *(documents 03, 05, 08)*
- **O9 — Drainer execution model**: manual script, dev-mode loop, or worker. *(documents 04, 07)*
- **O10 — Retry bounds and backoff** for `prev_hash` contention and RPC errors; what makes a
  failure terminal. *(document 04)*
- **O11 — Rectification authority**: original author only, `admin` only, or any member.
  *(document 02)*
- **O12 — Can a rectification be rectified?** Currently legal and unbounded in depth.
  *(document 02)*
- **O13 — Exact set of "basic filters"** for the animal list. *(document 02)*
- **O14 — Whether `Writers` is amendable after `init`** — convenience vs. a stronger promise.
  *(document 06)*
- **O15 — Whether lot membership should be on-chain.** Currently only a label inside
  `registration`; a buyer might expect lot movements to be verifiable. *(document 05)*
- **O16 — Whether `birth_date` belongs in the hashed payload**, given that correcting a hashed
  field requires a rectification. *(document 05)*
- **O17 — Structured `dose`** (`{ value, unit }`) vs. the current free string. *(document 05)*
- **O18 — Movement across organizations** has no defined authorization effect; informational only
  in the MVP. *(document 02)*
- **O19 — JS test runner.** *(documents 08, 09)*
- **O20 — How concurrency case 3 is driven**, and whether case 5 can be automated without a
  test-only hook in the write path. *(document 09)*
- **O21 — Whether `db:reset` should also redeploy the contract.** Convenient, but a command that
  silently deploys is easy to run by accident. *(document 07)*
- **O22 — Live-update mechanism and the exact Spanish microcopy** for the three verification
  states and the limitations panel — the wording carries the project's honesty burden.
  *(document 03)*
- **O23 — Restoration runbook** for archived chains across multiple transactions: understood in
  principle, not written as a tested procedure. *(document 06)*
- **O24 — A stop line.** If S3's measurements show cost or latency to be unacceptable, no fallback
  is agreed. The honest options would be shrinking the payload or revisiting
  full-payload-on-chain — the latter reopens document 04's central decision. *(document 08)*

**External facts still unconfirmed**

- **O25 — The authoritative SENASA individual-identifier format.** The regulations do not agree:
  the electronic **CII is 15 digits** (country `032` + 2-digit species + individual number), while
  printed caravana numbering appears as **9 or 10 digits in two blocks**, and Res. 530/2025 phases
  in mandatory identification through 2026. Validation stays lenient until one authoritative
  resolution is identified. Sources:
  [Res. 530/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/328620/20250721) ·
  [Res. 1698/2019](https://www.argentina.gob.ar/normativa/nacional/norma-333206/texto) ·
  [Res. 257 anexo](https://servicios.infoleg.gob.ar/infolegInternet/anexos/270000-274999/274630/res257.pdf)
  *(documents 02, 05)*
- **O26 — The 2-digit species code for bovines** within the CII. *(document 05)*
- **O27 — Whether `tx_hash` and ledger metadata need an index** for transactions aged out of RPC
  retention. Payloads are reconstructible from contract storage; transaction metadata may not be.
  Fallback: display the PostgreSQL value clearly labelled as unverified metadata. *(documents 04, 05)*

**Project-level unknowns**

- **O28 — Which market or buyer would accept this as evidence.** The access-to-markets and
  price-differential hypotheses are untested, and no first verifier has been identified.
  *(document 01)*
- **O29 — Stage ownership and calendar.** Nothing is estimated in time, and the ideathon deadline
  is unknown to this documentation. *(document 08)*
- **O30 — The producer-facing wording of "resistant to later modification"**, given R2 and R3.
  *(document 01)*

## Pending

This entire document is the Pending register. When an item is resolved, move the decision into
the owning document's **Proposed** section with its rationale, and strike it here — do not leave
it recorded in two places.
