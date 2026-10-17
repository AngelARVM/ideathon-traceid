# 05 — Data Model and Record Schemas

## Confirmed

The model must distinguish: the organization or scope that owns the records; users and
memberships; establishments; lots or groupings of animals; animals; and records with their
authors. An animal may change lot without losing its identity or its history.

Each animal must have a stable internal identifier and an official individual identifier, taking
the current SENASA system for bovines in Argentina as reference. Identifiers are kept as text,
including leading zeros. The animal identifier must not be confused with the establishment
identifier. The model must support later incorporation of RFID/SENASA integrations and allow
identification changes or replacements **without creating another animal and without losing
history**.

Each record type has its own fields and validations. Every record carries: unique identifier;
animal; type and schema version; date-time of the declared fact; date-time of incorporation;
author; type-specific data; sequence and reference to the previous record; content hash and
network operation references (Hedera since ADR-0003; the brief says Stellar); and a terminal
indicator where applicable.

**Public vs. private:** reading the traceability history is public. Credentials, authentication
data, personal contacts and other private administrative information must not be published on
blockchain. Which fields are public and which stay in PostgreSQL must be explicit. No sensitive
information in free fields by default.

A canonical serialization and hash algorithm must be defined, including exactly which fields are
hashed. Circular dependencies — such as including the transaction hash inside the content that
produces that transaction — must be avoided. Data reconstructible from the contract must be
distinguished from transaction metadata that may need an index or historical access.

## Proposed

### The governing rule for public vs. private

> **The payload *is* the public surface.** If a field is in the hashed payload, it goes
> on-chain and must be assumed permanent, immutable and world-readable.

Stated as one rule rather than a per-field table because it is far easier to apply correctly.
Its corollaries:

**Never in a payload, PostgreSQL only:** user emails, password hashes, sessions; personal contact
details of any kind; organization billing or administrative data; establishment street addresses
and geo-coordinates; internal notes; anything resembling a price.

**Where a record must name a place or a party:** carry an **opaque id plus a short public
label** — `establishment_id` + `"Est. La Esperanza"` — never the full record. The public history
stays readable without publishing an address book.

### Relational model (PostgreSQL)

```
organizations ──┬── memberships ──── users
                ├── establishments ──── lots
                └── animals ──┬── animal_identifiers   (append-only)
                              ├── animal_lot_history   (append-only)
                              └── records ──── outbox
```

**`organizations`** — `id` (ULID), `name`, `created_at`. The scope that owns records.

**`users`** — `id`, `email` (unique), `display_name`, `email_verified`, `image`, `created_at`,
`updated_at`. Never on-chain. Shaped for Better Auth (ADR-0001): the argon2 password hash lives in
**`accounts.password`** (provider `credential`), and Better Auth also owns `sessions`, `accounts`
and `verifications`. None of the four ever reaches a payload.

**`memberships`** — `id`, `org_id`, `user_id`, `role` (`owner` | `admin` | `operator` |
`professional`), `created_at`. Unique on `(org_id, user_id)`. Seeded for the demo; invitation
flows out of scope. `role` exists and is checked even though assignment flows do not exist.

**`establishments`** — `id`, `org_id`, `name`, `public_label`, `official_code` (nullable, text —
**the establishment's** code, never an animal's), private fields (`address`, `lat`, `lon`,
`notes`). Only `id` and `public_label` may enter a payload.

**`lots`** — `id`, `org_id`, `establishment_id`, `name`, `public_label`, `active`.

**`animals`** — `id` (**ULID, opaque, immutable, the chain key**), `org_id`, `species`
(`bovine`, fixed in the MVP but modelled for expansion), `birth_date` (nullable),
`current_lot_id` (nullable, denormalized convenience), `chain_status` (`open` | `closed`,
mirror of the contract), `record_count` (mirror), `last_content_hash` (mirror),
`created_at`.

> The three mirror columns exist for list rendering and reconciliation only. The public history
> never reads them.

**`animal_identifiers`** — append-only identifier history, the mechanism that lets a tag be
replaced without creating a new animal:

| Column | Notes |
|---|---|
| `id` | ULID |
| `animal_id` | FK |
| `identifier` | **`text`**, leading zeros preserved, never numeric |
| `identifier_kind` | `senasa_cii` \| `senasa_printed` \| `internal_tag` \| `unknown_format` |
| `detected_format` | What the lenient validator recognized (document 02, R3.4) |
| `assigned_at` | — |
| `replaced_at` | `NULL` = active |
| `replacement_reason` | nullable, bounded text |

Constraints: a partial unique index enforcing **one active identifier per animal**
(`WHERE replaced_at IS NULL`), and a partial unique index enforcing **one active identifier
value per organization**, which is what prevents duplicate chains (document 04, D11). Search
queries this table across **all** rows, including replaced ones (document 02, R3.5).

**`animal_lot_history`** — `id`, `animal_id`, `lot_id`, `moved_at`, `moved_by`. Append-only, so
lot changes never mutate identity or history.

**`records`** — the read model and submission state:

| Column | Notes |
|---|---|
| `record_id` | ULID, **client-generated**, `UNIQUE` — the idempotency key |
| `animal_id`, `org_id`, `author_id` | FKs |
| `type` | enum, see below |
| `schema_version` | integer, currently `1` |
| `occurred_at` | timestamptz — when the fact happened |
| `recorded_at` | timestamptz — **server-fixed before submission, never re-stamped on retry** |
| `terminal` | boolean |
| `rectifies_record_id` | nullable FK, self-referential |
| `data` | `jsonb`, the type-specific object |
| `canonical_payload` | `text`, the exact bytes that were hashed — kept verbatim so verification is reproducible |
| `content_hash` | `bytea`/hex, `sha256` of `canonical_payload` |
| `seq` | nullable until the contract assigns it |
| `prev_hash` | nullable until submission |
| `status` | `pending` \| `submitted` \| `confirmed` \| `failed` |
| `tx_id` | nullable, Hedera transaction ID `0.0.<payer>@<seconds>.<nanos>` — **never hashed** |
| `tx_hash` | nullable, EVM-style transaction hash reported by the mirror — **never hashed** |
| `consensus_timestamp` | nullable, text `<seconds>.<nanos>` — **never hashed**. Replaces `ledger` (S4 migration) |
| `created_at` | — |

**`outbox`** — `id`, `record_id` (unique, the dedupe key), `attempts`, `last_error`,
`next_attempt_at`, `submitted_at`, `settled_at`, `status`. Written in the same transaction as the
`records` row (document 04, D3).

### Canonical serialization

```
content_hash = sha256( canonical_json( payload ) )
```

`canonical_json` is defined as:

- UTF-8, no BOM.
- Object keys sorted lexicographically by Unicode code point, at every level.
- No insignificant whitespace.
- **No floating-point numbers anywhere.** Integers only; any decimal quantity is either an
  integer in a base unit (grams) or a decimal **string**. A `72.5` that serializes differently
  across two runtimes would silently break verification forever.
- Timestamps as RFC 3339 in **UTC** with a `Z` suffix, second precision.
- `null` fields are **omitted**, not serialized as `null`, so an absent optional field has one
  representation rather than two.
- Byte values (hashes) as lowercase hex strings.

**Hashed fields — exactly these:**

```
record_id, animal_id, org_id, type, schema_version,
occurred_at, recorded_at, author_id, seq, prev_hash, terminal,
data
+ rectifies_record_id, reason   (rectification only)
```

**Explicitly excluded from the hash:** `tx_id`, `tx_hash`, `consensus_timestamp`, and any
PostgreSQL-side status. This
is what avoids the circular dependency the brief warns about — a transaction hash cannot be
inside the content that produces that transaction.

**Size cap:** the canonical payload must be **1..=4,096 bytes** (UTF-8), enforced by the server
before enqueueing and again by the contract (document 06). With the field caps below, the largest
realistic record is well under 2 KiB even with multi-byte characters.

Two consequences to hold on to:

1. `recorded_at` is inside the hash, so it must be **fixed by the server once, before
   submission, and never re-stamped on retry** — otherwise the same logical record hashes
   differently on each attempt.
2. `seq` and `prev_hash` are inside the hash, and the contract assigns `seq`. The application
   therefore reads the chain header, computes the payload for `seq = count + 1`, and submits; if
   the contract's view has advanced, the transaction is rejected and the payload is **recomputed**
   for the new `seq` (document 04, D5), not patched.

### Reconstructible vs. metadata

| Data | Source | If unavailable |
|---|---|---|
| Record payload, `content_hash`, `seq`, `prev_hash`, `terminal`, closed flag | **Contract storage**, read through the mirror node's `contracts/call` — reconstructible for the animal's whole life, paginated by `seq` | Verification fails loudly |
| `tx_id`, `tx_hash`, consensus timestamp, HashScan link | Transaction metadata, from the receipt at submission time, mirrored in PostgreSQL, re-readable from the mirror's contract results | Displayed labelled as unverified metadata |

The brief's constraint that the history must not depend on recent events is satisfied because
reconstruction reads contract **storage**, never an event stream.

### Record types and per-type schemas (`schema_version: 1`)

One Zod schema per type. Deliberately minimal — the MVP is not the place to model every field a
veterinarian might want.

| Type | `data` fields | Terminal |
|---|---|---|
| `registration` | `{ identifier, identifier_kind, establishment_id, establishment_label, lot_label?, initial_diet: string(<=200), birth_date? }` | no |
| `weighing` | `{ weight_g: int, method?: "scale" \| "estimated" }` | no |
| `vaccination` | `{ product: string(<=120), dose: string(<=40), batch?: string(<=60), route?: "sc" \| "im" \| "iv" \| "oral" \| "other" }` | no |
| `deworming` | same shape as `vaccination` | no |
| `feeding` | `{ diet: string(<=200), change_reason?: string(<=200), effective_from?: date }` | no |
| `movement` | `{ from_establishment_id?, from_label?, to_establishment_id?, to_label?, transport_doc?: string(<=60) }` | no |
| `sale` | `{ buyer_label?: string(<=120), document_ref?: string(<=60) }` — **no price field** | no |
| `slaughterhouse_delivery` | `{ establishment_label: string(<=120) }` | **yes** |
| `death` | `{ cause?: "disease" \| "accident" \| "predation" \| "unknown" \| "other", notes?: string(<=280) }` | **yes** |
| `other` | `{ title: string(<=80), description: string(<=280) }` | no |
| `rectification` | `{ rectifies_record_id, reason: string(<=280) }` | **never** |

Rules that apply across all types:

- **No monetary amounts anywhere** (document 02, R8.1). A price on a public permanent chain is
  commercially sensitive and irreversible. `sale` deliberately records only a buyer label and a
  document reference.
- **Free text is length-capped** and every free-text field carries a visible "no ingrese datos
  personales" hint.
- **Weights are integer grams.** A UI showing kilograms converts at the boundary.
- **`registration` carries the baseline diet** (document 02, R4.1), so every animal always has a
  declared diet. `feeding` records are **diet changes only**, which means any diet-history view
  must read `registration.initial_diet` first and then the `feeding` deltas — reading `feeding`
  alone would wrongly suggest the animal was never fed.

### Schema evolution

`schema_version` is per record and stored inside the hashed payload. Because the contract is
type-blind and non-upgradeable (document 04, D9/D8), adding a type or a field in the future
requires **no** contract change: a new Zod schema and a bumped `schema_version` suffice. Readers
must render unknown future versions defensively rather than failing — a record written at
version 2 must still display at a sensible minimum when read by version-1 code.

### Extension points, designed in but not implemented

- **RFID / SENASA integration:** `animal_identifiers.identifier_kind` already distinguishes
  device classes; adding `rfid_epc` is a new enum value, not a model change.
- **Per-organization signing:** nothing in the payload assumes a single signer; `org_id` is
  already a hashed field.
- **Other species:** `animals.species` exists and is carried, fixed to `bovine` in the MVP.
- **Collaborator management:** `memberships.role` exists and is enforced; only the assignment UI
  is missing.

## Pending

- **The authoritative SENASA format.** The regulations do not agree on a single shape: the
  electronic CII is 15 digits (country `032` + 2-digit species + individual number), while printed
  caravana numbering appears as 9 or 10 digits in two blocks, and Res. 530/2025 phases in
  mandatory identification through 2026. Validation is lenient by decision (document 02, R3.4)
  **until one authoritative resolution is identified**; the specific resolutions are cited in
  document 10 so the rule can be tightened against a real source.
- **Species code within the CII** for bovines — the 2-digit value is referenced by the
  regulations but was not confirmed to a specific number.
- **Whether `animals.birth_date` belongs in the payload at all** — it is arguably public and
  useful, but it is also an attribute that gets corrected, and correcting a hashed field requires
  a rectification record.
- **Whether lot membership should appear on-chain.** Currently only a `lot_label` inside
  `registration`; lot changes are PostgreSQL-only history. A buyer might reasonably expect lot
  movements to be verifiable.
- **Unit handling for `dose`.** Kept as a free string (`"5 ml"`) rather than a structured
  `{ value, unit }`, which is lenient but unanalysable later.
