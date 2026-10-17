# 10 — Risks, Assumptions and Open Decisions

## Confirmed

Confirmed requirements must be separated from proposed decisions and from pending questions.
Where a contradiction or a decision that substantially changes scope is found, it must be
flagged with a concrete option proposed — **a central requirement must never be silently
substituted with a simpler implementation**.

## Proposed

### The flagged substitution: Hedera instead of Stellar

The brief names **Stellar Testnet** as a required technology. The project moved to **Hedera
Testnet** (ADR-0003). Per this document's own rule, this is recorded as an explicit substitution
of a confirmed requirement, not a silent one:

- **What is substituted:** the network and contract platform only. Every business rule, the
  full-payload-on-chain requirement, the five contract-enforced invariants and the "read the
  history from the network, not from PostgreSQL" boundary are kept.
- **Why:** Soroban's rent and archival model forced a TTL keeper, a restoration runbook and an
  untestable archived-read state onto an "immutable history". Hedera contract storage does not
  expire today, and the mirror node serves full history for free.
- **Why not HCS alone:** it cannot *prevent* invalid appends, only record them (ADR-0003).
- **Concrete option if the substitution is not accepted:** revert S3 to the Soroban crate in git
  history; documents 01–10 return to their Stellar wording. Tracked as O31.

### The one contradiction in the brief, and how it was resolved

The brief requires the public history to be read **directly from the network** and explicitly
rejects "hash on-chain, content in PostgreSQL". It also mandates **Testnet**, which is
periodically wiped by network resets (on Hedera, roughly quarterly).

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

### What the deployer can and cannot do

Required by the brief's contract-update-policy clause. The contract is **non-upgradeable** and has
**no admin role**: no proxy, and it is created without a Hedera admin key.

| The deployer **can** | The deployer **cannot** |
|---|---|
| Deploy an entirely **new** contract, with a new ID and a new writer set | Modify the content of any record |
| — | Delete or reorder any record |
| — | Change the writer set of the deployed contract |
| — | Replace or delete the deployed contract's code (no admin key) |
| — | Re-open a closed chain |
| — | Make the application read the old contract after a redeploy without changing `.env` |

The immutability promise is therefore as strong as a deployed contract can make it. Its real
limit is not the deployer but the custodial writer key, below.

### Accepted risks

| # | Risk | Consequence | Why accepted | Mitigation |
|---|---|---|---|---|
| R1 | **Custodial signing** — one platform key signs everything | The network attests only that *the platform* submitted a record. A dishonest operator could write any `author_id` | An MVP cannot carry wallet onboarding for field users | Author identity disclosed as a platform claim in the UI's limitations panel; the contract takes a writer set at construction, so per-org keys mean a redeploy, not a rewrite (document 04, D7) |
| R2 | **Testnet reset wipes history** (≈ quarterly on Hedera) | The verified history disappears; the demo must be rebuilt | Mainnet is out of scope | Deterministic `seed:chain`; UI banner; documented recovery (document 07, §10); resets are announced in advance |
| R3 | **Hedera may enable contract rent** | Storage would acquire a recurring per-slot cost (announced ≈ $0.02 per slot per year) and an expiry if unpaid; a 4 KiB payload is ~129 slots | Not enabled today; the threshold and rate are announced, not active | Watch Hedera announcements; a funded auto-renew account; fallback design with payloads in events (ADR-0003, option C) |
| R4 | **Non-upgradeable contract** | A contract bug means a fresh deploy, a new contract id and a re-seed | Chosen deliberately for the stronger promise | Contract kept minimal and type-blind; invariant tests in S3 before any integration |
| R5 | **Type-blind contract** | The contract cannot reject a semantically invalid record. A nonsense weight is immutably recorded as nonsense | The alternative freezes the record vocabulary forever | Validation in Zod; `schema_version` in the hashed payload; integrity unaffected |
| R6 | **Full payload on-chain** | Record size carries direct gas cost; **4,096 bytes** per payload is a hard ceiling (Hedera ~6 KiB transaction limit) | The brief's central requirement | One record per `(animalId, seq)` (no array rewrite); field caps; largest realistic record well under 2 KiB; jumbo transactions (HIP-1086) as the escape hatch |
| R7 | **Truthfulness is unverified** | A producer can anchor a false fact permanently and the platform will display it as verified-integrity | No sensor or official cross-check is in scope | The three-claims table (document 01) stated in product copy, not only in docs |
| R8 | **QR encodes the host** | Moving domains invalidates printed QR codes | Acceptable for an MVP | Documented; the internal ULID (not the tag number) is the stable part of the URL |
| R9 | **Lenient identifier validation** | Malformed or duplicate-looking identifiers can be stored | A strict regex built on an ambiguous regulation would reject real ear tags | `detected_format` recorded; non-blocking warning badge; tightenable once an authoritative format is confirmed |
| R10 | **PostgreSQL mirror columns can drift from the chain** | The operator list could show stale `seq` / status while the chain has moved on | The columns exist for search performance | `reconcile` settles from the chain; the public history never reads those columns (not to be confused with the Hedera mirror *node*) |
| R11 | **No first verifier identified** | The core commercial hypothesis is untested | Validation is out of MVP scope | Named as the project's largest unknown (document 01, Pending) |
| R12 | **The mirror node is a trust point** | The public history trusts that the mirror reports contract state faithfully; the public Testnet mirror is run by Hedera, not by consensus | The brief asks for reads from the network, and a mirror is the network's read path; running consensus-node queries from the public page would cost fees per read | `HEDERA_MIRROR_URL` configurable so another mirror can cross-check; the evidence screen shows which mirror served the data; stated in the limitations panel |
| R13 | **Mirror lag** | A record can be on consensus but not yet on the mirror for a few seconds | Inherent to the mirror architecture | `confirmed` requires mirror visibility, not only the receipt; otherwise the row stays `submitted` for `reconcile` |
| R14 | **The network substitution is not yet confirmed** by the brief's owner | If rejected, S3 onward reverts to Stellar | Decided by the team (ADR-0003) | Soroban crate kept in git history; O31 |

### Assumptions

1. **Node ≥ 20, npm as the package manager** (the repo carries `package-lock.json`).
2. **Next.js 16.4.2 as pinned**, with App Router, Server Components and Server Actions; note that
   `middleware.ts` is now `proxy.ts` in Next.js 16.
3. **Hedera platform facts as verified** (document 06): ~6 KiB standard transaction, 15 M gas per
   transaction, contract rent not enabled, mirror `contracts/call` free, topic-filtered log search
   bounded to seven days, quarterly Testnet resets. Network settings can change; re-check at S3.
4. **One organization, seeded, for the demo.** Multi-organization behaviour is modelled and
   authorization-checked but not exercised at scale.
5. **Species fixed to `bovine`**, modelled for expansion.
6. **Demo passwords are not secrets.** The seed is expected to refuse non-local databases without
   an explicit override.
7. **Spanish UI, English documentation.**
8. **No paid service and no API key** anywhere in the project. The Testnet mirror node and the
   Hashio relay are public and unauthenticated; the Developer Portal account is free.

### Open decisions — consolidated

These are the Pending items from every document, gathered. **None may be resolved silently during
implementation.** Each must be raised and decided.

**Blocking before S1** — resolved.

- ~~O1 — Auth library~~ and ~~O2 — version~~: Better Auth `1.7.x`. See
  `docs/adr/0001-better-auth.md`.

**Blocking before S3**

- **O3 — Tool versions**: Foundry, `solc`, `@hashgraph/sdk`. To be pinned by actually building.
  *(document 07)* (The Soroban pins are superseded by ADR-0003.)
- ~~O4 — 16-byte key ↔ ULID encoding~~ — resolved in S2: the TypeScript codec produces the
  ULID's big-endian 128-bit value, used unchanged as Solidity `bytes16`.
- **O31 — Confirm the Hedera substitution** with the brief's owner (ADR-0003, R14).
- **O32 — `msg.sender` of an ECDSA operator** through `ContractExecuteTransaction` (EVM alias vs.
  long-zero address) — determines the address passed to the constructor. *(document 06)*

**Must be measured in S3, then written back into documents 06 and 07**

- **O5** Per-record gas and HBAR cost on Testnet.
- **O6** Append latency, submission → receipt → visible on the mirror — determines the
  `pending → confirmed` UI mechanism and the drainer's mirror-poll bound. *(documents 03, 06)*
- **O7** Safe `MAX_PAGE` for `getRecords` through mirror `contracts/call` (20 provisional).

**Design questions still open**

- **O8 — May the public route read PostgreSQL for display labels at all?** Current proposal
  embeds public labels in the on-chain payload to avoid it. Affects S5's module boundary.
  *(documents 03, 05, 08)*
- ~~O9 — Drainer execution model~~ — resolved in S2: manual `npm run outbox:drain` plus the
  "Procesar cola" button. *(document 04)*
- **O10 — Retry bounds and backoff** for `prev_hash` contention and network or mirror errors; what makes a
  failure terminal. *(document 04)*
- **O11 — Rectification authority**: original author only, `admin` only, or any member.
  *(document 02)*
- **O12 — Can a rectification be rectified?** Currently legal and unbounded in depth.
  *(document 02)*
- **O13 — Exact set of "basic filters"** for the animal list. *(document 02)*
- ~~O14 — Whether the writer set is amendable~~ — resolved in S3: fixed at construction, kept on
  Hedera. *(document 06)*
- **O15 — Whether lot membership should be on-chain.** Currently only a label inside
  `registration`; a buyer might expect lot movements to be verifiable. *(document 05)*
- **O16 — Whether `birth_date` belongs in the hashed payload**, given that correcting a hashed
  field requires a rectification. *(document 05)*
- **O17 — Structured `dose`** (`{ value, unit }`) vs. the current free string. *(document 05)*
- **O18 — Movement across organizations** has no defined authorization effect; informational only
  in the MVP. *(document 02)*
- ~~O19 — JS test runner~~ — resolved: `node:test` via `tsx`. *(document 08)*
- **O20 — How concurrency case 3 is driven**, and whether case 5 can be automated without a
  test-only hook in the write path. *(document 09)*
- **O21 — Whether `db:reset` should also redeploy the contract.** Convenient, but a command that
  silently deploys is easy to run by accident. *(document 07)*
- **O22 — Live-update mechanism and the exact Spanish microcopy** for the three verification
  states and the limitations panel — the wording carries the project's honesty burden.
  *(document 03)*
- ~~O23 — Restoration runbook~~ — removed by ADR-0003: Hedera contract storage does not expire.
- **O24 — A stop line.** If S3's measurements show cost or latency to be unacceptable, no fallback
  is agreed. The honest options would be shrinking the payload or moving it to events
  (ADR-0003, option C). *(document 08)*
- **O33 — Tooling**: Foundry vs. Hardhat; `viem` vs. `ethers` for ABI encoding; `forge create`
  through Hashio vs. an `@hashgraph/sdk` deploy script. *(documents 06, 07)*
- **O34 — Mirror cross-check**: whether the public page should query a second mirror, or only
  document that `HEDERA_MIRROR_URL` can point elsewhere. *(document 06, R12)*

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
- ~~O27 — Whether transaction metadata needs an index~~ — resolved by ADR-0003: the mirror node
  keeps contract results for the network's life. *(documents 04, 05)*

**Project-level unknowns**

- **O28 — Which market or buyer would accept this as evidence.** The access-to-markets and
  price-differential hypotheses are untested, and no first verifier has been identified.
  *(document 01)*
- **O29 — Stage ownership and calendar.** Nothing is estimated in time, and the ideathon deadline
  is unknown to this documentation. *(document 08)*
- **O30 — The producer-facing wording of "resistant to later modification"**, given R2, R3 and
  R12.
  *(document 01)*

## Pending

This entire document is the Pending register. When an item is resolved, move the decision into
the owning document's **Proposed** section with its rationale, and strike it here — do not leave
it recorded in two places.
