# 03 — User Flows and Screens

## Confirmed

The interface is **in Spanish** and **usable from a phone**. Priority: few steps to find an
animal, and few steps to load a milestone.

Required screens/capabilities: authentication for writes; animal list with identifier search and
basic filters; fast identification and access by QR; animal creation with first record; simple
milestone loading; explicit chain closure with confirmation; public animal history without
login; display of hashes and Stellar references; clear states for pending, confirmed and failed
records.

## Proposed

### Route inventory

Eight routes, mobile-first. Spanish UI labels are given alongside each.

| Route | Auth | Purpose |
|---|---|---|
| `/login` | — | Credentials sign-in ("Ingresar") |
| `/animals` | required | List, search, filters ("Animales") |
| `/animals/new` | required | Create animal + `registration` record ("Nuevo animal") |
| `/animals/<id>` | required | Operational view: history, states, actions ("Detalle") |
| `/animals/<id>/records/new` | required | Type picker, then type-specific form ("Nuevo hito") |
| `/animals/<id>/close` | required | Explicit closure with typed confirmation ("Cerrar cadena") |
| `/a/<animal_id>` | **none** | Public verified history ("Historial público") |
| `/a/<animal_id>/records/<seq>` | **none** | Single-record verification detail |

### The load-bearing decision: two separate data paths

The private operational view (`/animals/<id>`) and the public verified view (`/a/<animal_id>`)
are **separate routes with separate data access layers**:

- `/animals/<id>` may read PostgreSQL for speed, and shows `pending` / `submitted` / `failed`
  records that do not exist on-chain yet.
- `/a/<animal_id>` reads **only** the Soroban contract. It has no code path to the PostgreSQL
  record payloads at all.

This is deliberate and must not be "simplified" into one route with a toggle. A single route
serving both audiences is exactly how cached database content ends up rendered as verified
history — the failure mode the whole architecture exists to prevent. The public route is
allowed to read PostgreSQL for one thing only: resolving `animal_id` to display-level labels
that are already public (and even that is optional; see Pending).

### Flow A — Find an animal (target: ≤2 taps or 1 scan)

1. **Scan path.** Phone camera scans the ear-tag QR → opens `https://<host>/a/<animal_id>`
   directly. No login, no search. This is the fastest path and the one a buyer uses.
2. **Search path.** `/animals` opens with the search field focused. Typing digits matches
   against active **and historical** official identifiers (R3.5) and the internal id. Results
   appear as a list of cards showing identifier, lot, status (open/closed), and last milestone.
3. Tapping a result opens `/animals/<id>`.

Filters are collapsed by default so they never cost the common case a tap.

### Flow B — Create an animal (target: one screen, one submit)

`/animals/new` is a single form producing **one** chain write:

- Official identifier (text, leading zeros preserved, lenient validation with a visible
  "format not recognized" badge rather than a blocking error).
- Establishment, lot (selects, seeded).
- `occurred_at` of the initial identification (defaults to today, editable backwards).
- **Baseline diet** — required, because it is a field of the `registration` payload (R4.1).
- Optional notes (capped, with the no-personal-data hint).

On submit: the animal row, the `registration` record and the outbox row are written in one
PostgreSQL transaction; the UI navigates to `/animals/<id>` where the record appears as
`pending` and transitions to `confirmed` without a manual refresh.

### Flow C — Load a milestone (target: ≤3 taps to the form)

From `/animals/<id>`, a prominent "Nuevo hito" action opens
`/animals/<id>/records/new`:

1. **Type picker** — large touch targets, ordered by expected frequency: weighing, vaccination,
   deworming, movement, feeding (diet change), sale, other, slaughterhouse delivery, death. The
   two terminal types are visually separated and carry a warning, because choosing one is
   irreversible.
2. **Type-specific form** — only the fields for that type (document 05), with `occurred_at`
   defaulting to now and editable backwards. A back-dated fact is explicitly allowed and shows a
   note explaining it will be appended at the end of the chain, not inserted (Confirmed: chain
   order is order of incorporation).
3. **Submit** → `pending` → `confirmed`.

If the chain is closed, this route is unreachable and the detail view explains why, offering
"Rectificar" instead.

### Flow D — Close a chain

`/animals/<id>/close` requires: choosing the terminal type (`death` or
`slaughterhouse_delivery`), its type-specific fields, and **typing the animal's official
identifier** to confirm. The screen states plainly, before confirmation:

- The chain will accept no further ordinary milestones, permanently.
- Closure cannot be undone.
- Only rectifications remain possible.
- For slaughterhouse delivery: this records the end of tracking in this platform and **does not
  demonstrate slaughter**.

### Flow E — Public verification (the verifier's journey)

`/a/<animal_id>` is server-rendered and reads the contract live:

- **Header** — official identifier(s) including replaced ones, species, chain status
  (open/closed), record count, and a prominent environment banner: *"Datos anclados en Stellar
  Testnet, un entorno de demostración sujeto a reinicios."*
- **Verification summary** — one of three states, never ambiguous:
  - ✅ *Verificado* — every record read from the contract and every content hash recomputed and
    matched, linkage intact.
  - ⚠️ *Falla de integridad* — a record's recomputed hash or `prev_hash` linkage does not match.
    Shown loudly, with the offending `seq`.
  - ⛔ *No se pudo verificar* — the contract or RPC was unreachable. **No history content is
    presented as verified.** This state never silently degrades into a cached render.
- **Timeline** — one card per record in `seq` order: type, `occurred_at`, `recorded_at`, public
  content, and a per-record verification badge. Rectified records carry a "rectificado por #N"
  marker; rectifications carry "rectifica #N".
- **Limitations panel**, always visible, not collapsed: integrity and ordering are verifiable;
  author identity is a platform claim because a single custodial key signs all writes; the
  truthfulness of the declared fact is not verified by anyone.

`/a/<animal_id>/records/<seq>` is the evidence screen for one record: the full canonical payload
as it was hashed, `content_hash`, `prev_hash`, `tx_hash`, network passphrase/name, contract id,
ledger sequence, explorer link, and the recomputed-hash comparison result shown as a
side-by-side.

### Mobile and offline posture

- Thumb-reachable primary actions; inputs typed `numeric` where appropriate so the phone shows a
  number pad for identifiers and weights.
- **No offline write queue.** If the device has no connectivity, submission fails with a clear
  message. An offline-first queue is out of scope and would create a second source of ordering
  truth.
- The QR is a platform access path and does **not** replace the official device.

## Pending

- **Whether the public route may read PostgreSQL for labels at all.** Resolving an establishment
  label from the database would make the public page partially database-backed, which risks the
  guarantee above; embedding the label in the on-chain payload (document 05's approach) avoids
  it but duplicates data. Current proposal embeds labels on-chain and keeps the public route's
  database access limited to resolving nothing more than the animal's existence.
- **Live update mechanism for `pending` → `confirmed`.** Polling, streaming, or a manual refresh
  button. Polling is the assumed default but has not been decided.
- **Exact Spanish microcopy** for the three verification states and the limitations panel. The
  wording carries the project's honesty burden and deserves a review pass with a producer.
- **Whether the animal list needs pagination in the MVP.** Depends on the seeded fixture size.
