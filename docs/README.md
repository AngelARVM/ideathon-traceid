# TraceID — MVP Documentation

Individual traceability of bovine cattle for producers in the Argentine Northeast (NEA),
anchored on Stellar Testnet via a Soroban contract.

These documents are the output of a design session. **No code is implemented yet** and no
dependencies have been added: the repository is still a bare `create-next-app` tree
(Next.js 16.4.2, React 19.3, TypeScript, Biome).

## How to read these documents

Every document opens with three sections, so the origin of each statement is structural
rather than a footnote:

- **Confirmed** — requirements taken directly from the project brief (`base.md`) or settled
  explicitly during the design session. Do not change these without revisiting the brief.
- **Proposed** — design decisions made in this session, with rationale. Implementable as
  written, revisable with cause.
- **Pending** — genuinely open questions. **These are not to be resolved silently during
  implementation.** Raise them.

## Documents

| # | Document | Covers |
|---|---|---|
| 01 | [Vision, value hypotheses and scope](./01-vision-and-scope.md) | What this is, what it claims, what is out of scope |
| 02 | [Functional requirements and business rules](./02-functional-requirements.md) | Operations, record types, chain and closure rules |
| 03 | [User flows and screens](./03-user-flows-and-screens.md) | Route inventory, mobile-first flows, record states |
| 04 | [Architecture and technical decisions](./04-architecture.md) | Postgres vs Stellar responsibilities, outbox, write path |
| 05 | [Data model and record schemas](./05-data-model.md) | Relational model, canonical payloads, per-type schemas |
| 06 | [Stellar contract and integration](./06-stellar-contract.md) | Soroban storage layout, interface, TTL, limits |
| 07 | [Local setup, credentials and manual deployment](./07-setup-and-deployment.md) | Step-by-step, no prior Stellar experience assumed |
| 08 | [Staged implementation plan](./08-implementation-plan.md) | S1–S7, each independently demoable |
| 09 | [Acceptance criteria and test strategy](./09-acceptance-and-testing.md) | The walkthrough plus eight adversarial cases |
| 10 | [Risks, assumptions and open decisions](./10-risks-and-open-questions.md) | Consolidated Pending items and accepted risks |

Repository conventions for agents working on this project live separately in
[`docs/agents/`](./agents/).

## The one-paragraph version

Each animal has an append-only chain of records inside a single Soroban contract. The
contract assigns sequence numbers and enforces hash linkage, so it — not the UI — refuses
overwrites, unauthorized appends and ordinary milestones on a closed chain. The full public
payload of every record is stored on-chain, so the public history is reconstructible from the
contract alone; PostgreSQL is an operational read model and index that the public history
never trusts. Writes are signed by a single custodial backend key, which means the network
attests that *the platform* submitted a record, not who authored it. The platform verifies
integrity and ordering; it does not and cannot verify that a declared fact is true, and it is
not a sanitary certification nor a replacement for official SENASA systems.
