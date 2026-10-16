# 02 — Functional Requirements and Business Rules

## Confirmed

**The five fundamental operations.**

1. Create a chain for an animal, including its initial record.
2. Append records to an existing chain.
3. List registered chains / animals.
4. Consult an animal's full history.
5. Append a terminal record that closes its chain.

**A closed chain accepts no further ordinary milestones.** The policy for post-closure
rectification is defined explicitly below.

**Record types in the initial scope.** Initial registration/identification, weighing,
vaccination, deworming, feeding, movement, sale, slaughterhouse delivery, death, and "other
milestone" with a bounded description.

**Every record must carry:** a unique identifier; the animal it belongs to; type and schema
version; the date and time of the declared fact; the date and time of incorporation into the
registry; the author or verifiable identifier of whoever loaded it; the milestone's specific
data; sequence and reference to the previous record; content hash and Stellar operation
references; and a terminal-record indicator where applicable.

**Chain order is the order of incorporation.** A fact loaded late may carry an earlier
`occurred_at`, but it must never be inserted by rewriting the chain.

**A sale does not close the animal's life.** The MVP's possible closures are **death** and
**slaughterhouse delivery**. Slaughterhouse delivery represents the end of tracking within
this scope and does **not** demonstrate slaughter.

**Confirmed records are never edited or deleted.** Errors are corrected by a new record that
references the original and explains the rectification, preserving both.

**Web platform must include:** authentication for write operations; an animal list with search
by identifier and basic filters; fast identification and access to an animal by QR; animal
creation with its first record; simple loading of new milestones; explicit chain closure with
confirmation; a public animal history requiring no login; display of hashes and Stellar
references; and clear states for pending, confirmed and failed records.

**The interface is in Spanish and usable from a phone.** Prioritize few steps to find an animal
and to load a milestone. (Note: the *interface* is Spanish; *this documentation* is English by
decision.)

**Multi-person work on the same animals** must be possible. Full management of invitations,
assignments and permissions is out of MVP scope, but the relationships and basic authorization
controls must exist so it can be added later without rebuilding the model. Preloaded users and
memberships may be used for the demo.

**"Editing" means** administering operational data or preparing loads. It never means modifying
a milestone already confirmed on blockchain.

## Proposed

### R1 — Chain lifecycle

- **R1.1** Creating an animal creates its chain and writes exactly **one** record at `seq 1`, of
  type `registration`, which carries the identifier snapshot **and the baseline diet**.
- **R1.2** `seq` is assigned **by the contract**, not by the application. The application's value
  is a hint; a mismatch is a rejected transaction, not a silent correction.
- **R1.3** Each record references the previous one by `prev_hash`, which must equal the chain
  header's `last_hash` at submission time. This is the ordering guarantee and the concurrency
  control in one mechanism.
- **R1.4** One animal has at most **one open chain**. Uniqueness is enforced on *one active
  official identifier per animal* and *one open chain per active official identifier* — never on
  the animal row itself, so identifier replacement does not require a new animal.
- **R1.5** Closure is explicit and requires a typed confirmation in the UI. Only `death` and
  `slaughterhouse_delivery` are terminal types.

### R2 — Post-closure rectification policy

- **R2.1** Once a chain is closed, the contract accepts **only** records of type
  `rectification`. Every other type is rejected at the contract level, not merely hidden in the
  UI.
- **R2.2** A `rectification` must reference a prior `record_id` and carry a bounded reason.
- **R2.3** A `rectification` may **never** clear the closed flag and may never itself be
  terminal. Closure is irreversible.
- **R2.4** Rectification does not remove or amend the original record. Both are preserved and
  both are displayed; the public history shows the original with a visible "rectified by…"
  marker and the rectification with a "rectifies…" marker.
- **R2.5** Rectification is available on open chains too, for the same reason.

### R3 — Identification

- **R3.1** The animal's primary identity is an opaque, internal, stable ULID. It is what the
  chain is keyed on and it never changes.
- **R3.2** The official SENASA individual identifier is a **versioned attribute**: an append-only
  list of `(identifier, assigned_at, replaced_at, reason)`. A lost or replaced device produces a
  new identifier row — not a new animal, and not a broken chain.
- **R3.3** Identifiers are stored as `text` with leading zeros preserved. Never numeric.
- **R3.4** Validation is **lenient and documented**: accept 9–16 digits with separators
  normalized away, and *warn without blocking* when the value does not match the 15-digit CII
  shape (country `032` + 2-digit species + individual number). The detected format is recorded
  alongside the value. A strict regex built on an ambiguous regulation would reject real ear
  tags during a demo.
- **R3.5** Search by identifier must match **historical** identifiers as well as the active one,
  because the number on a replaced tag is the number someone will type.
- **R3.6** The animal identifier must never be confused with the establishment identifier.

### R4 — Feeding and diet history

- **R4.1** The **baseline diet is a field inside the `registration` payload**. Every animal
  therefore always has a declared diet, with no extra record and no atomicity problem at
  creation.
- **R4.2** `feeding` records represent **diet changes only**. A `feeding` record means "the diet
  changed to this".
- **R4.3** Consequently, a diet history query reads `registration.initial_diet` **first** and
  then the `feeding` deltas in sequence. Reading the `feeding` records alone would wrongly
  suggest an animal was never fed. This special case is mandatory wherever diet is displayed.

### R5 — Record states

Every record is in exactly one state, and the state is always visible:

| State | Meaning | Public history shows |
|---|---|---|
| `pending` | Accepted by the app, queued in the outbox, not yet submitted | Not shown as verified history |
| `submitted` | Transaction sent, awaiting confirmation | Not shown as verified history |
| `confirmed` | On-chain and read back successfully | Shown, with its verification result |
| `failed` | Submission definitively failed | Not shown publicly; visible to operators for retry |

- **R5.1** A record may be on-chain while still showing `pending` locally until reconciliation
  runs. The operator UI must say "pending confirmation" — never hide it, and never present it as
  confirmed.
- **R5.2** A `failed` record may be re-submitted, and it receives a **new** `seq`. The failed
  attempt is not reused.

### R6 — Authorization (basic, extensible)

- **R6.1** Writes require an authenticated session. Reads of the public history require none.
- **R6.2** Every write path passes through a single server-side helper (`requireMembership`)
  that checks the user's membership in the organization that owns the animal.
- **R6.3** Roles exist in the model (`owner`, `admin`, `operator`, `professional`) and are
  checked, but invitation and assignment flows are out of scope — memberships are seeded.
- **R6.4** Authorization is enforced server-side and, for structural invariants, in the
  contract. UI affordances are never the enforcement point.

### R7 — Public history

- **R7.1** The public history reads records **from the contract**, live, on every request.
- **R7.2** If Stellar is unreachable, the UI states that it **could not verify** the history. It
  must never present cached data as freshly verified.
- **R7.3** Each milestone displays or allows consulting: the public content recorded, the content
  hash, the previous record's hash, the transaction hash, the network and contract, a ledger
  reference and explorer link where available, and the integrity verification result.

### R8 — Content restrictions

- **R8.1** No monetary amounts in any record payload. A price on a public, permanent chain is
  commercially sensitive and irreversible.
- **R8.2** Free-text fields are length-capped and carry an explicit "do not enter personal data"
  hint. No sensitive information in free fields by default.

## Pending

- **Rectification authority.** Who may rectify — only the original author, any organization
  member with `admin`, or any member? The MVP seeds a single organization, so the question does
  not block implementation, but the chosen rule shapes the future collaborator model.
- **Whether a rectification can itself be rectified.** Currently permitted implicitly (nothing
  forbids it), with no depth limit. A chain of rectifications pointing at each other is legal and
  may be confusing to display.
- **Filters in the animal list.** "Basic filters" is confirmed; the exact set (status, lot,
  establishment, type of last milestone, date range) is not.
- **Movement semantics across organizations.** A `movement` record naming a destination
  establishment belonging to another organization has no defined effect on authorization — and
  automated permission transfer on sale is explicitly out of scope. The record is informational
  only in the MVP.
