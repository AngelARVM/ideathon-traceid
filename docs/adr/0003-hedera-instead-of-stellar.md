# ADR-0003 — Hedera instead of Stellar

**Status:** accepted (2026-10-16, after S3's contract, before its Testnet deploy) · supersedes
the Stellar/Soroban network choice in `base.md` and documents 01–10 · replaces the Soroban crate
in `contracts/traceid/`

## Context

The brief (`base.md`) names **Stellar Testnet** as a required technology and proposes a Soroban
contract as the initial design. S3 built that contract (`contracts/traceid/`, Rust,
`soroban-sdk` 29) but never deployed it.

The design that resulted carried one structural weakness that no amount of code removes:
Soroban persistent storage is **rent-bearing and archivable** (max TTL ≈180 days). An
"immutable public history" therefore needed a TTL-maintenance policy, a keeper script, a
multi-transaction restoration runbook and an archived-read UI state that could not be tested
within a demo timeframe (documents 06, 09, 10 — R3, R12, O23).

The team decided to move to **Hedera Testnet**, keeping record creation on-chain and reading
the public history, ideally, from the **mirror node**.

## Options considered

| Option | Enforces the five invariants on write? | Verdict |
|---|---|---|
| **A. Hedera Consensus Service (HCS) only** — one topic per animal or one global topic | **No.** A topic's `submitKey` covers authorization and topics are append-only, but HCS runs no logic: a stale `prev_hash` or an ordinary milestone on a closed chain is *published* and must be ignored by every reader | Rejected. The brief requires the contract to *prevent* these actions; moving the rule to the reader is the "hiding it in the interface" the brief rejects |
| **B. Hedera Smart Contract Service (EVM / Solidity), payload in contract storage, reads via mirror `contracts/call`** | **Yes**, identically to the Soroban contract | **Chosen** |
| C. Smart contract that stores only the header and emits the payload in events, reads via mirror logs | Yes | Rejected for the MVP: the mirror's topic-filtered log search requires a timestamp range of at most seven days, so reconstructing a life needs per-record timestamps and many queries. Kept as the fallback if contract rent is ever enabled (document 10, R3) |

## Decision

- **Network:** Hedera **Testnet**. Mainnet stays out of scope.
- **Contract:** a Solidity contract on the Hedera Smart Contract Service with the **same
  storage layout, interface semantics, errors and five invariants** as the Soroban contract
  (document 06). The contract is **type-blind** and **non-upgradeable** as before (document 04,
  D8, D9). It is deployed **without a Hedera admin key**, so it cannot be updated or deleted by
  anyone.
- **Writes:** server-side only, from the outbox drainer, as `ContractExecuteTransaction`s signed
  by one custodial ECDSA account via `@hashgraph/sdk` (document 04, D7).
- **Reads:** the public history and `reconcile` read through the **mirror node REST API**:
  `POST /api/v1/contracts/call` (a free, read-only EVM simulation of `getHeader` / `getRecords`)
  and `GET /api/v1/contracts/results/{transactionIdOrHash}` for transaction metadata.
- **The Soroban crate is superseded.** It remains in git history; S3 is reopened to replace it
  (document 08).

## What this keeps

The whole business model (documents 01, 02, 05): record types, payload schemas, canonical
serialization and `content_hash`, the outbox lifecycle, idempotency, `prev_hash` concurrency
control, reconciliation from the chain, closure and rectification policy, custodial-key honesty,
the two separate data paths and the three verification states. The S1–S2 code is unaffected
except for one constant (the payload cap) and module names.

## What this gains

- **No TTL, no archival, no restoration.** Hedera has not enabled contract rent, so contract
  storage does not expire. `extend_ttl`, the `ttl:extend` script, the restoration runbook and
  the archived-read state are removed.
- **Free public reads with full history.** The mirror node serves contract state and every
  transaction result for the life of the network, not a short RPC retention window.
- **Deterministic finality** in a few seconds and fees fixed in USD.

## What this costs — stated plainly

- **The brief's literal network requirement is not met.** `base.md` says Stellar. This ADR is the
  explicit, flagged substitution that document 10's rule requires; it must be confirmed with the
  brief's owner. If the owner insists on Stellar, revert to the Soroban crate in git history.
- **S3's contract is rewritten**, in Solidity, with its tests.
- **The mirror node is a trust point.** It is not a consensus node. The public Testnet mirror is
  operated by Hedera; the verifier trusts that it reports contract state faithfully. The mirror
  URL is configurable so another mirror (or a self-hosted one) can be used to cross-check.
- **Mirror lag.** The mirror reflects consensus a few seconds later. `confirmed` therefore waits
  for the mirror to return the record, not only for the consensus receipt (document 04, D3).
- **Smaller payload cap.** A standard Hedera transaction is limited to ~6 KiB, so the payload cap
  drops from 8,192 to **4,096 bytes**. Realistic records are a few hundred bytes.
- **Testnet still resets**, about once a quarter, wiping contract state. The deterministic seed
  remains the recovery path.
- **Contract rent may be enabled later.** If it is, storing payloads in storage acquires a
  recurring cost (Hedera's announced rate is about $0.02 per storage slot per year). Option C is
  the documented fallback.
