# 07 — Local Setup, Credentials and Manual Deployment

## Confirmed

**All prerequisites must be explained step by step, assuming no prior experience with the
network** (Hedera since ADR-0003; the brief says Stellar).

Must be documented: compatible tool versions; local installation and execution; Docker Compose,
PostgreSQL connection, migrations and demo data; Testnet account and key creation; test
funding (on Hedera: the Developer Portal faucet, which replaces Friendbot); network identifier,
mirror node and other required endpoints; contract compilation, deployment and initialization; obtaining and configuring the contract identifier;
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
| Node.js | ≥ 20.12 LTS | Next.js 16 runtime; `process.loadEnvFile` in `prisma.config.ts` | [nodejs.org](https://nodejs.org) |
| npm | bundled with Node | The repo has `package-lock.json`, so npm is the package manager | — |
| Docker + Docker Compose | current stable | Runs PostgreSQL locally | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Foundry (`forge`, `cast`) | stable, pinned in S3 | Compiles, tests and deploys the Solidity contract; `cast` reads it from a terminal | [getfoundry.sh](https://getfoundry.sh) |
| Solidity compiler | `0.8.x`, pinned in `contracts/traceid/foundry.toml` | Fetched by Foundry automatically | — |

> **Windows:** Foundry runs natively via `foundryup` on Git Bash, or inside WSL. Contract tests:
> `cd contracts/traceid && forge test`.

No account on any paid service is required. There is **no API key** anywhere in this project:
the Hedera Testnet mirror node and the Hashio JSON-RPC relay are public and unauthenticated. The
only sign-up is a free Hedera Developer Portal account, which creates the Testnet account itself.

### 1 — Clone and install

```bash
npm install
```

### 2 — Start PostgreSQL

`docker-compose.yml` at the repository root defines a single `postgres` service (`postgres:17-alpine`)
with a named volume and the database `traceid`. It publishes on host port **54320**, not 5432,
so it does not collide with a PostgreSQL already running on the machine. Override with
`TRACEID_DB_PORT=… docker compose up -d` and adjust `DATABASE_URL` to match.

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
npm run db:migrate         # prisma migrate deploy: applies prisma/migrations/
npm run db:seed            # orgs, users, memberships, establishments, lots
```

The seed prints the demo logins. They are intentionally trivial and are **not** secrets — see
the authentication section. It is a no-op if users already exist; `npm run db:seed -- --reset`
wipes the S1 tables and seeds again.

`npm install` runs `prisma generate` (postinstall); the client is written to `src/generated/prisma/`,
which is git-ignored. When the schema changes: edit `prisma/schema.prisma`, run
`npm run db:migrate:dev -- --name <change>` (creates and applies the migration and regenerates the
client), and commit the new folder in `prisma/migrations/`.

### 5 — Create a Hedera Testnet account

A Hedera account has an **account ID** of the form `0.0.12345` (public, an address), an **EVM
address** `0x…` derived from its key (public), and a **private key** (**never** share, never
commit, never put in client code). TraceID needs an **ECDSA** (secp256k1) key, because the
contract authorizes callers by EVM address and Foundry signs with ECDSA.

1. Sign up at [portal.hedera.com](https://portal.hedera.com) and choose **Testnet**.
2. Create an account with an **ECDSA** key. The portal shows the account ID, the EVM address and
   the hex-encoded private key, and funds the account with test HBAR.
3. Copy the three values into `.env.local` (section *Environment variables*).

To top up after use or after a reset, use the portal's faucet
([portal.hedera.com/faucet](https://portal.hedera.com/faucet)). Testnet HBAR has no monetary value
and exists only to pay fees in a test environment.

After a Testnet reset the account no longer exists; create a new one the same way (the key pair
may be reused only if the portal offers it).

### 6 — Network endpoints

These are public, documented values — not credentials:

| Setting | Testnet value |
|---|---|
| Network name (SDK) | `testnet` |
| Mirror node REST | `https://testnet.mirrornode.hedera.com` |
| JSON-RPC relay (Hashio) — deploy and `cast` only | `https://testnet.hashio.io/api` |
| EVM chain id | `296` |
| Explorer | `https://hashscan.io/testnet` |

The application never needs the JSON-RPC relay: writes go to consensus nodes through
`@hashgraph/sdk` (which knows the Testnet node list), and reads go to the mirror node.

### 7 — Build, test and deploy the contract

From `contracts/traceid/` (the Foundry project that replaces the Soroban crate, ADR-0003):

```bash
git submodule update --init lib/forge-std     # test library, once per clone
forge test                                     # one or more tests per invariant (document 09, A3)
forge build
forge create src/TraceId.sol:TraceId \
  --rpc-url https://testnet.hashio.io/api \
  --private-key $HEDERA_OPERATOR_KEY \
  --broadcast \
  --constructor-args '[<YOUR_EVM_ADDRESS>]'     # the writer set, fixed forever
```

`forge create` prints the contract's **EVM address** (`0x…`). Look it up on HashScan
(`https://hashscan.io/testnet/contract/<EVM_ADDRESS>`) to get its **contract ID** (`0.0.…`).
Copy both into `.env.local` as `HEDERA_CONTRACT_EVM_ADDRESS` and `HEDERA_CONTRACT_ID`.

There is no `init`: the constructor registers the writer set atomically at deploy, and it cannot
be changed afterwards. A contract created through the EVM path has **no Hedera admin key**, so it
cannot be updated or deleted *(to be verified on HashScan at the first deploy — the contract's
admin key must show as empty)*. Because the contract is **non-upgradeable** (document 06), fixing
a contract bug means repeating this section with a fresh contract and re-seeding.

A full terminal walkthrough — create, append, paginate, close, and watch each invariant reject —
goes in `contracts/traceid/README.md` (S3).

### 8 — Start the application

```bash
npm run dev                # http://localhost:3000 (or: npm run dev -- --port 3100)
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
3. Watch the record go `pending` → `confirmed`. This needs a drainer run: `npm run outbox:drain`,
   or the "Procesar cola" button in the operator UI. In S2 the drainer confirms without touching
   the chain; from S4 on it submits for real.
4. Open the record's verification detail and copy the **transaction ID**.
5. Open `https://hashscan.io/testnet/transaction/<TRANSACTION_ID>` and confirm the transaction
   exists, succeeded, and called your contract.
6. Read the record straight from the chain, bypassing the application entirely:

```bash
# via the JSON-RPC relay, which forwards eth_call to the mirror node
cast call $HEDERA_CONTRACT_EVM_ADDRESS "getRecord(bytes16,uint32)" 0x<ANIMAL_ID_HEX> 1 \
  --rpc-url https://testnet.hashio.io/api

# or against the mirror node directly — the same path the public history uses
curl -s -X POST https://testnet.mirrornode.hedera.com/api/v1/contracts/call \
  -H 'content-type: application/json' \
  -d "{\"to\":\"$HEDERA_CONTRACT_EVM_ADDRESS\",\"data\":\"$(cast calldata 'getRecord(bytes16,uint32)' 0x<ANIMAL_ID_HEX> 1)\"}"
```

`<ANIMAL_ID_HEX>` is 32 hex characters: the ULID's 16 bytes.

7. Open the public history `/a/<animal_id>` in a **logged-out** browser and confirm it shows
   ✅ *Verificado*.

Step 6 is the one that actually proves the brief's central requirement: the content is in the
contract, readable without the application.

### 10 — Recovering the demo after a Testnet reset

Hedera Testnet resets roughly once a quarter, announced in advance on
[status.hedera.com](https://status.hedera.com). A reset destroys the account, the contract and all
its state. Recovery:

```bash
# create a new Testnet account in the portal (section 5); update HEDERA_OPERATOR_* in .env.local
# redeploy the contract (section 7) — note the NEW contract ID and EVM address
# update HEDERA_CONTRACT_ID and HEDERA_CONTRACT_EVM_ADDRESS in .env.local
npm run db:reset                # drop and re-migrate            (to be verified)
npm run db:seed                 # operational fixtures
npm run seed:chain              # writes the demo animals and records to the new contract
```

`npm run seed:chain` is the deterministic seed decided in the design session: it writes the demo
fixtures to **both** PostgreSQL and the chain, so the demo is reproducible after any reset.

**What does not come back:** anything a user typed live during a demo. Only seeded fixtures are
recoverable. The old mirror data stays queryable for about two weeks after a reset, but the app
does not read it. The UI banner states this; the documentation states it; it should be said out
loud before any live demo.

### Environment variables

Every variable, with everything the brief requires stated for each.

| Variable | Purpose | Required | Secret | How to obtain | Where |
|---|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection for app, migrations, seeds | Yes | **Secret** (contains a password) | Matches `docker-compose.yml` (host port 54320) | `.env.local` |
| `AUTH_SECRET` | Signs/encrypts session cookies | Yes | **Secret** | `openssl rand -base64 32` | `.env.local` |
| `AUTH_URL` | Canonical app URL; Better Auth checks request origins against it | Only if not `http://localhost:3000` (also when running dev on another port) | Public | Your own host | `.env.local` |
| `HEDERA_NETWORK` | Which network (`testnet`) | Yes (from S4) | Public | Fixed value | `.env.local` |
| `HEDERA_MIRROR_URL` | Mirror node REST base URL; every chain read goes here | Yes (from S4) | Public | Hedera docs | `.env.local` |
| `HEDERA_CONTRACT_ID` | The deployed contract, `0.0.…` | Yes (from S4) | Public | HashScan, after `forge create` | `.env.local` |
| `HEDERA_CONTRACT_EVM_ADDRESS` | The same contract's `0x…` address, used for mirror `contracts/call` | Yes (from S4) | Public | Printed by `forge create` | `.env.local` |
| `HEDERA_OPERATOR_ID` | Custodial writer account, `0.0.…` | Yes (from S4) | Public | Developer Portal | `.env.local` |
| `HEDERA_OPERATOR_EVM_ADDRESS` | The writer's `0x…` address, as registered in the contract | Yes (from S4) | Public | Developer Portal | `.env.local` |
| `HEDERA_OPERATOR_KEY` | ECDSA private key; signs every chain write | Yes (from S4) | **SECRET — server only** | Developer Portal | `.env.local` |
| `NEXT_PUBLIC_EXPLORER_BASE_URL` | Builds explorer links in the UI | Optional | Public | Fixed value | `.env.local` |
| `NEXT_PUBLIC_ENVIRONMENT_LABEL` | Text for the "Testnet, demo" banner | Optional | Public | Your choice | `.env.local` |

**`HEDERA_OPERATOR_KEY` is the one genuinely dangerous value here.** It must never be prefixed
`NEXT_PUBLIC_`, never imported from a Client Component, and never logged. Signing happens
exclusively in the outbox drainer, server-side (document 04, D7). Anyone holding it can write
records that the platform will present as authentic.

### `.env.example`

To be committed at the repository root in S1, with no real secrets:

```dotenv
# ── Database ────────────────────────────────────────────────
# Required. Secret (contains a password). Must match docker-compose.yml.
DATABASE_URL="postgresql://traceid:traceid@localhost:54320/traceid"

# ── Authentication ──────────────────────────────────────────
# Required. Secret. Generate with: openssl rand -base64 32
AUTH_SECRET="replace-me-with-a-generated-value"
# Optional unless deploying somewhere other than localhost:3000. Public.
# AUTH_URL="https://traceid.example.com"

# ── Hedera (Testnet) — used from S4 on ─────────────────────
# All public, documented values — not credentials.
HEDERA_NETWORK="testnet"
HEDERA_MIRROR_URL="https://testnet.mirrornode.hedera.com"

# Required from S4. Public. From `forge create` and HashScan.
HEDERA_CONTRACT_ID="0.0.0000000"
HEDERA_CONTRACT_EVM_ADDRESS="0x0000000000000000000000000000000000000000"

# Required from S4. Public. The custodial writer account (Developer Portal).
HEDERA_OPERATOR_ID="0.0.0000000"
HEDERA_OPERATOR_EVM_ADDRESS="0x0000000000000000000000000000000000000000"

# Required from S4. ***SECRET — SERVER ONLY. NEVER COMMIT. NEVER expose to the browser.***
HEDERA_OPERATOR_KEY="0x<hex-encoded-ecdsa-private-key>"

# ── UI (optional, public) ───────────────────────────────────
NEXT_PUBLIC_EXPLORER_BASE_URL="https://hashscan.io/testnet"
NEXT_PUBLIC_ENVIRONMENT_LABEL="Hedera Testnet — entorno de demostración"
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
| `other-org@demo.local` | `owner` of a **second** organization | `demo1234` |

The fourth user exists for the cross-organization authorization case (document 09, case 2).

Library: **Better Auth `1.7.x`**, email + password with sign-up disabled, argon2id hashes,
database-backed sessions (ADR-0001). The route handler is `src/app/api/auth/[...all]/route.ts`;
nothing else needs configuring beyond `AUTH_SECRET` (and `AUTH_URL` off `localhost:3000`).

### Official links

- Hedera — [Developer Portal and faucet](https://portal.hedera.com)
- Hedera — [Testnet and resets](https://docs.hedera.com/networks/testnet)
- Hedera — [Mirror node REST API](https://docs.hedera.com/reference/rest-api/topics) · [`contracts/call` (HIP-584)](https://hips.hedera.com/hip/hip-584)
- Hedera — [Smart contract gas and fees](https://docs.hedera.com/evm/development/gas-fees) · [Smart contract rent (not enabled)](https://docs.hedera.com/evm/development/rent)
- [`@hashgraph/sdk`](https://github.com/hiero-ledger/hiero-sdk-js) · [Foundry](https://getfoundry.sh) · [HashScan](https://hashscan.io/testnet)
- [Next.js](https://nextjs.org/docs) · [Prisma](https://www.prisma.io/docs) · [Zod](https://zod.dev) · [Better Auth](https://better-auth.com)
- SENASA — [Res. 530/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/328620/20250721) · [Res. 1698/2019](https://www.argentina.gob.ar/normativa/nacional/norma-333206/texto) · [Res. 257 anexo](https://servicios.infoleg.gob.ar/infolegInternet/anexos/270000-274999/274630/res257.pdf)

## Pending

- **Exact tool versions.** Re-pinned in S3 for the Hedera contract: Foundry, `solc`,
  `@hashgraph/sdk`. (The Soroban pins — Rust 1.99.1, `soroban-sdk` 29.0.1 — are superseded by
  ADR-0003.)
- *Resolved in S2:* the drainer is a manually run script, `npm run outbox:drain`, so section 9
  step 3 **does** need a manual command — or the "Procesar cola" button in the operator UI,
  which is the same invocation.
- **Script names** (`seed:chain`, `reconcile`) are proposed, not implemented; they are added to
  `package.json` in the stage that creates each one.
- **Whether `npm run db:reset` should also redeploy the contract**, making post-reset recovery a
  single command. Convenient, but a command that silently deploys a contract is easy to run by
  accident.
- **Deploy path.** `forge create` through Hashio is proposed because it needs no extra code; the
  alternative is a small `@hashgraph/sdk` script (`ContractCreateFlow`) that uses the same
  operator ID and key as the drainer and never touches the relay. Decide in S3.
