# 07 — Local Setup, Credentials and Manual Deployment

## Confirmed

**All prerequisites must be explained step by step, assuming no prior experience with Stellar.**

Must be documented: compatible tool versions; local installation and execution; Docker Compose,
PostgreSQL connection, migrations and demo data; Stellar Testnet account and key creation; test
funding via Friendbot; RPC, network identifier and other required endpoints; contract
compilation, deployment and initialization; obtaining and configuring the contract identifier;
authentication configuration; manual application startup and deployment; verification of a real
operation on Testnet; and recovery of the demo after a Testnet reset.

**For every environment variable, account, credential, API key or URL, state:** what it is for;
whether it is required or optional; how to obtain it; whether it is public or secret; where to
configure it; and a safe example without real secrets.

**Do not invent paid-service dependencies or API keys the provider does not require.** Include
official links and an `.env.example` in the implementation plan.

**Testnet is a demonstration environment subject to resets and offers no permanent preservation
of history.**

## Proposed

> **Status:** this is the plan for setup, written before implementation. Commands marked
> *(to be verified)* depend on code or tooling that does not exist yet and must be confirmed
> during the stage that creates them (document 08).

### 0 — What you need installed

| Tool | Version | Why | Where |
|---|---|---|---|
| Node.js | ≥ 20 LTS | Next.js 16 runtime | [nodejs.org](https://nodejs.org) |
| npm | bundled with Node | The repo has `package-lock.json`, so npm is the package manager | — |
| Docker + Docker Compose | current stable | Runs PostgreSQL locally | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Rust toolchain | stable ≥ 1.84 (verified with 1.99.1) | Compiles the Soroban contract | [rustup.rs](https://rustup.rs) |
| `wasm32v1-none` Rust target | matching toolchain | The only Wasm target Soroban accepts | `rustup target add wasm32v1-none` |
| `soroban-sdk` | 29.0.1 (pinned in `contracts/traceid/Cargo.toml`) | Contract SDK; its major version must match the network protocol (Testnet: 29) | crates.io |
| Stellar CLI | **≥ 25.2.0** (`soroban-sdk` 29 refuses to build a contract without it) | Builds, deploys and invokes the contract | [developers.stellar.org](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup) |

> **Windows without Visual Studio:** use the GNU toolchain, which needs no MSVC Build Tools:
> `rustup toolchain install stable-x86_64-pc-windows-gnu`, then
> `rustup default stable-x86_64-pc-windows-gnu`. Contract tests: `cd contracts/traceid && cargo test`.

No account on any paid service is required. There is **no API key** anywhere in this project:
Stellar Testnet RPC and Friendbot are public and unauthenticated.

### 1 — Clone and install

```bash
npm install
```

### 2 — Start PostgreSQL

A `docker-compose.yml` at the repository root *(created in S1)* defines a single `postgres`
service with a named volume and the database `traceid`.

```bash
docker compose up -d
docker compose ps          # expect postgres "healthy"
```

To reset the database completely: `docker compose down -v` (destroys the volume).

### 3 — Configure environment

```bash
cp .env.example .env.local
```

Then fill in the values per the table in the next section. `.env.local` is git-ignored and must
never be committed.

### 4 — Migrate and seed

```bash
npm run db:migrate         # applies SQL migrations        (to be verified, S1)
npm run db:seed            # orgs, users, memberships, establishments, lots (S1)
```

The seed prints the demo logins. They are intentionally trivial and are **not** secrets — see
the authentication section.

### 5 — Create a Stellar Testnet account

A Stellar account is a keypair: a **public key** starting with `G…` (safe to share, it is an
address) and a **secret key** starting with `S…` (**never** share, never commit, never put in
client code).

```bash
stellar keys generate --global traceid-writer --network testnet
stellar keys address traceid-writer      # prints the G… public key
```

The `--network testnet` flag funds the account automatically via Friendbot. To fund manually, or
to re-fund after a reset:

```bash
curl "https://friendbot.stellar.org/?addr=<YOUR_G_PUBLIC_KEY>"
```

Friendbot is a free Testnet faucet. Testnet XLM has no monetary value and exists only to pay
transaction fees in a test environment.

To read the secret key for the `.env` file:

```bash
stellar keys show traceid-writer         # prints the S… secret key — handle carefully
```

### 6 — Network endpoints

These are public, documented values — not credentials:

| Setting | Testnet value |
|---|---|
| RPC URL | `https://soroban-testnet.stellar.org` |
| Network passphrase | `Test SDF Network ; September 2015` |
| Friendbot | `https://friendbot.stellar.org` |
| Explorer | `https://stellar.expert/explorer/testnet` |

The network passphrase must match the network exactly; a mismatch produces signature errors that
look like authorization failures.

### 7 — Build, deploy and initialize the contract

From `contracts/traceid/`:

```bash
cargo test                 # 21 tests, one or more per invariant
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/traceid.wasm \
  --source-account traceid-writer \
  --network testnet \
  -- \
  --admin <G_PUBLIC_KEY> \
  --writers '["<G_PUBLIC_KEY>"]'
```

The contract has no separate `init`. Its constructor runs atomically inside the deploy with the
arguments after `--`, which register the admin and the authorized writer set. The writer set
cannot be changed afterwards. The deploy prints the **contract id** (`C…`). Copy it into
`.env.local` as `STELLAR_CONTRACT_ID`.

A full CLI walkthrough is in `contracts/traceid/README.md`: create, append, paginate, close, and
watch each invariant reject. Because the contract is **non-upgradeable** (document 06), fixing
a contract bug means repeating this whole section with a fresh contract id and re-seeding.

### 8 — Start the application

```bash
npm run dev                # http://localhost:3000
```

For a manual production-style run:

```bash
npm run build && npm run start
```

Deployment is manual by scope: build, copy, set environment variables, start. No CI, no
automation.

### 9 — Verify a real operation on Testnet

The point of this section is to prove the anchoring works end to end, not just that the UI
renders:

1. Log in with a seeded user.
2. Create an animal (`/animals/new`) with a baseline diet.
3. Watch the record go `pending` → `confirmed`. If a manual drainer run is required, run
   `npm run outbox:drain` *(to be verified, S4)*.
4. Open the record's verification detail and copy the `tx_hash`.
5. Open `https://stellar.expert/explorer/testnet/tx/<TX_HASH>` and confirm the transaction
   exists, succeeded, and invoked your contract id.
6. Read the record straight from the chain, bypassing the application entirely:

```bash
stellar contract invoke \
  --id <CONTRACT_ID> --source traceid-writer --network testnet \
  -- get_record --animal_id <ANIMAL_ID_HEX> --seq 1    # 32 hex chars = the ULID's 16 bytes
```

7. Open the public history `/a/<animal_id>` in a **logged-out** browser and confirm it shows
   ✅ *Verificado*.

Step 6 is the one that actually proves the brief's central requirement: the content is in the
contract, readable without the application.

### 10 — Recovering the demo after a Testnet reset

A Testnet reset destroys the contract and all its state. Recovery:

```bash
curl "https://friendbot.stellar.org/?addr=<YOUR_G_PUBLIC_KEY>"   # re-fund
# rebuild, redeploy, re-init (section 7) — note the NEW contract id
# update STELLAR_CONTRACT_ID in .env.local
npm run db:reset                # drop and re-migrate            (to be verified)
npm run db:seed                 # operational fixtures
npm run seed:chain              # writes the demo animals and records to the new contract
```

`npm run seed:chain` is the deterministic seed decided in the design session: it writes the demo
fixtures to **both** PostgreSQL and the chain, so the demo is reproducible after any reset.

**What does not come back:** anything a user typed live during a demo. Only seeded fixtures are
recoverable. The UI banner states this; the documentation states it; it should be said out loud
before any live demo.

### Environment variables

Every variable, with everything the brief requires stated for each.

| Variable | Purpose | Required | Secret | How to obtain | Where |
|---|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection for app, migrations, seeds | Yes | **Secret** (contains a password) | Matches `docker-compose.yml` | `.env.local` |
| `AUTH_SECRET` | Signs/encrypts session cookies | Yes | **Secret** | `openssl rand -base64 32` | `.env.local` |
| `AUTH_URL` | Canonical app URL for auth callbacks | Only if not `localhost:3000` | Public | Your own host | `.env.local` |
| `STELLAR_NETWORK` | Which network (`testnet`) | Yes | Public | Fixed value | `.env.local` |
| `STELLAR_RPC_URL` | Soroban RPC endpoint | Yes | Public | Stellar docs | `.env.local` |
| `STELLAR_NETWORK_PASSPHRASE` | Must match the network exactly | Yes | Public | Stellar docs | `.env.local` |
| `STELLAR_CONTRACT_ID` | The deployed contract (`C…`) | Yes | Public | Printed by `stellar contract deploy` | `.env.local` |
| `STELLAR_PUBLIC_KEY` | Custodial writer address (`G…`) | Yes | Public | `stellar keys address` | `.env.local` |
| `STELLAR_SECRET_KEY` | Signs every chain write | Yes | **SECRET — server only** | `stellar keys show` | `.env.local` |
| `NEXT_PUBLIC_EXPLORER_BASE_URL` | Builds explorer links in the UI | Optional | Public | Fixed value | `.env.local` |
| `NEXT_PUBLIC_ENVIRONMENT_LABEL` | Text for the "Testnet, demo" banner | Optional | Public | Your choice | `.env.local` |

**`STELLAR_SECRET_KEY` is the one genuinely dangerous value here.** It must never be prefixed
`NEXT_PUBLIC_`, never imported from a Client Component, and never logged. Signing happens
exclusively in the outbox drainer, server-side (document 04, D7). Anyone holding it can write
records that the platform will present as authentic.

### `.env.example`

To be committed at the repository root in S1, with no real secrets:

```dotenv
# ── Database ────────────────────────────────────────────────
# Required. Secret (contains a password). Must match docker-compose.yml.
DATABASE_URL="postgresql://traceid:traceid@localhost:5432/traceid"

# ── Authentication ──────────────────────────────────────────
# Required. Secret. Generate with: openssl rand -base64 32
AUTH_SECRET="replace-me-with-a-generated-value"
# Optional unless deploying somewhere other than localhost:3000. Public.
# AUTH_URL="https://traceid.example.com"

# ── Stellar (Testnet) ───────────────────────────────────────
# All public, documented values — not credentials.
STELLAR_NETWORK="testnet"
STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Required. Public. Printed by `stellar contract deploy`.
STELLAR_CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Required. Public. The custodial writer address.
STELLAR_PUBLIC_KEY="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Required. ***SECRET — SERVER ONLY. NEVER COMMIT. NEVER expose to the browser.***
STELLAR_SECRET_KEY="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# ── UI (optional, public) ───────────────────────────────────
NEXT_PUBLIC_EXPLORER_BASE_URL="https://stellar.expert/explorer/testnet"
NEXT_PUBLIC_ENVIRONMENT_LABEL="Stellar Testnet — entorno de demostración"
```

### Authentication configuration

Seeded per-user accounts with demo-grade passwords: real individual logins, trivial known
passwords printed by the seed and listed in this document, argon2-hashed in PostgreSQL, real
sessions, and a real `requireMembership` check on every write path.

The passwords are **deliberately not secrets** — they are demo fixtures, and the seed refuses to
run against a non-local `DATABASE_URL` without an explicit override flag so they cannot
accidentally reach a shared environment.

| User | Role | Password |
|---|---|---|
| `owner@demo.local` | `owner` | `demo1234` |
| `vet@demo.local` | `professional` | `demo1234` |
| `operator@demo.local` | `operator` | `demo1234` |

*(Exact library and version — Auth.js v5 vs. Better Auth — is an open decision; see document 04,
Pending. The functional requirement above is identical either way.)*

### Official links

- Stellar — [smart contract setup](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- Stellar — [storage strategies and state archival](https://developers.stellar.org/docs/build/guides/storage/storage-strategies)
- Stellar — [Testnet and Friendbot](https://developers.stellar.org/docs/learn/fundamentals/networks)
- [Stellar CLI](https://github.com/stellar/stellar-cli)
- [`soroban-sdk` docs](https://docs.rs/soroban-sdk/latest/soroban_sdk/)
- [Next.js](https://nextjs.org/docs) · [Drizzle ORM](https://orm.drizzle.team/docs/overview) · [Zod](https://zod.dev) · [Auth.js](https://authjs.dev) · [Better Auth](https://better-auth.com)
- SENASA — [Res. 530/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/328620/20250721) · [Res. 1698/2019](https://www.argentina.gob.ar/normativa/nacional/norma-333206/texto) · [Res. 257 anexo](https://servicios.infoleg.gob.ar/infolegInternet/anexos/270000-274999/274630/res257.pdf)

## Pending

- **Exact tool versions.** Pinned in S3: Rust 1.99.1, `soroban-sdk` 29.0.1, `wasm32v1-none`,
  contract tests green. Still open: the exact Stellar CLI version used for the first Testnet
  deploy.
- **Auth library and version** (document 04, Pending).
- **Whether the drainer runs as a script, a dev-mode loop or a worker** — determines whether
  section 9 step 3 needs a manual command at all.
- **Script names** (`db:migrate`, `db:seed`, `seed:chain`, `outbox:drain`, `reconcile`,
  `ttl:extend`) are proposed, not implemented; they are added to `package.json` in the stage that
  creates each one.
- **Whether `npm run db:reset` should also redeploy the contract**, making post-reset recovery a
  single command. Convenient, but a command that silently deploys a contract is easy to run by
  accident.
