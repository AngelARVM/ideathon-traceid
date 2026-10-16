# traceid — Soroban contract (stage S3)

Append-only, hash-linked record chains, one per animal. Design and rationale are in
[`docs/06-stellar-contract.md`](../../docs/06-stellar-contract.md). Setup and toolchain are in
[`docs/07-setup-and-deployment.md`](../../docs/07-setup-and-deployment.md).

```
src/lib.rs    contract: storage layout, entry points, invariants, TTL
src/test.rs   unit tests — one or more per invariant, each asserting the rejection
```

## Test

```bash
cargo test
```

| Invariant | Tests |
|---|---|
| 1 Sequence authority | `contract_assigns_seq`, `get_records_paginates_and_caps` |
| 2 Hash linkage | `wrong_prev_hash_refused`, `content_hash_must_match_payload` |
| 3 No overwrite | `create_chain_on_existing_header_refused`, `existing_record_slot_is_never_overwritten` |
| 4 Authorization | `non_writer_refused`, `writer_signature_is_required`, `constructor_requires_writers` |
| 5 Closed-chain policy | `ordinary_milestone_on_closed_chain_refused`, `closing_twice_refused`, `terminal_kind_via_append_refused`, `rectification_allowed_on_closed_chain_and_never_reopens`, `rectification_on_open_chain_keeps_it_open` |
| TTL | `writes_bump_ttl_to_max`, `extend_ttl_restores_max_after_time_passes` |

## Build and deploy (Testnet)

Requires Stellar CLI ≥ 25.2.0.

```bash
stellar keys generate traceid-writer --network testnet --fund
W=$(stellar keys address traceid-writer)

stellar contract build
C=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/traceid.wasm \
  --source-account traceid-writer --network testnet \
  -- --admin $W --writers "[\"$W\"]")
echo $C
```

## Exit-criteria walkthrough, from a terminal only

`Bytes` and `BytesN` arguments are hex. `kind` is an integer: `0` Ordinary, `1` Terminal, `2` Rectification. `animal_id` and `author` are 16 bytes (32 hex chars).
`content_hash` must be `sha256(payload)`, or the contract refuses the record.

```bash
inv() { stellar contract invoke --id $C --source-account traceid-writer --network testnet -- "$@"; }
hex()  { printf '%s' "$1" | xxd -p | tr -d '\n'; }
sha()  { printf '%s' "$1" | sha256sum | cut -d' ' -f1; }

A=01890a5d000000000000000000000001   # animal_id
U=0000000000000000000000000000000a   # author
P1='{"type":"registration"}'; P2='{"type":"weighing"}'; P3='{"type":"death"}'

inv create_chain  --writer $W --animal_id $A --content_hash $(sha "$P1") --payload $(hex "$P1") --author $U
inv append_record --writer $W --animal_id $A --expected_prev_hash $(sha "$P1") \
  --content_hash $(sha "$P2") --payload $(hex "$P2") --kind 0 --author $U
inv get_records --animal_id $A --from_seq 1 --limit 10
inv close_chain   --writer $W --animal_id $A --expected_prev_hash $(sha "$P2") \
  --content_hash $(sha "$P3") --payload $(hex "$P3") --author $U
inv get_header --animal_id $A
```

What each invariant should refuse (the CLI prints `Error(Contract, #N)`):

| Attempt | Expected |
|---|---|
| `create_chain` again on `$A` | `#2 ChainExists` |
| `append_record` with a stale `--expected_prev_hash` | `#4 PrevHashMismatch` |
| `append_record --kind 0` after `close_chain` | `#6 ChainClosed` |
| `close_chain` a second time | `#6 ChainClosed` |
| `append_record --kind 1` | `#7 TerminalViaAppend` |
| `--content_hash` that is not `sha256(payload)` | `#8 HashMismatch` |
| any write with `--writer` set to an address not in the writer set | `#1 NotWriter` |
| any write signed by a different key than `--writer` | auth failure |

`append_record --kind 2` on the closed chain **succeeds**, and `get_header` still
reports `closed: true`.

## Measurements to record (doc 06 / 07, Pending)

| Measure | Value |
|---|---|
| Rent + fee per `append_record` (~300-byte payload) | _to measure_ |
| Append latency, submit → confirmed | _to measure_ |
| Max safe `get_records` page at 8 KiB payloads (`MAX_PAGE` is provisionally 50) | _to measure_ |
| Stellar CLI version used | _to record_ |
