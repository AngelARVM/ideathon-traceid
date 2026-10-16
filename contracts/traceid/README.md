# traceid — Hedera contract (stage S3)

Append-only, hash-linked record chains, one per animal, on the Hedera Smart Contract Service.
Design and rationale: [`docs/06-hedera-contract.md`](../../docs/06-hedera-contract.md) and
[ADR-0003](../../docs/adr/0003-hedera-instead-of-stellar.md). Setup and toolchain:
[`docs/07-setup-and-deployment.md`](../../docs/07-setup-and-deployment.md). The Soroban crate this
replaces is in git history.

```
src/TraceId.sol      contract: storage layout, entry points, invariants
test/TraceId.t.sol   Foundry tests — one or more per invariant, each asserting its custom error
lib/forge-std        test library (git submodule)
```

## Test

```bash
git submodule update --init lib/forge-std   # once per clone
forge test                                  # or, from the repo root: make contract
forge test --gas-report
```

| Invariant | Tests |
|---|---|
| 1 Sequence authority | `test_contractAssignsSeq`, `test_getRecordsPaginatesAndCaps` |
| 2 Hash linkage | `test_wrongPrevHashRefused`, `test_contentHashMustMatchPayload` |
| 3 No overwrite | `test_createChainOnExistingHeaderRefused`, `test_existingRecordSlotIsNeverOverwritten` |
| 4 Authorization | `test_nonWriterRefused`, `test_writerSignatureIsRequired`, `test_constructorRequiresWriters` |
| 5 Closed-chain policy | `test_ordinaryMilestoneOnClosedChainRefused`, `test_closingTwiceRefused`, `test_terminalKindViaAppendRefused`, `test_rectificationAllowedOnClosedChainAndNeverReopens`, `test_rectificationOnOpenChainKeepsItOpen` |

The Soroban TTL tests have no counterpart: Hedera contract storage does not expire.

## Deploy (Testnet)

Needs the ECDSA operator account from document 07, section 5. The constructor argument is the
writer set — **fixed forever**.

```bash
export RPC=https://testnet.hashio.io/api
forge create src/TraceId.sol:TraceId --rpc-url $RPC --private-key $HEDERA_OPERATOR_KEY \
  --broadcast --constructor-args "[$WRITER]"
```

`$WRITER` must be the address the contract sees as `msg.sender` for the operator account (document
06, Pending): after deploying, check that `cast call $C "writers()(address[])" --rpc-url $RPC` and a
first `createChain` agree. On HashScan, confirm the contract shows **no admin key**.

## Exit-criteria walkthrough, from a terminal only

`animalId` and `author` are `bytes16` (`0x` + 32 hex). `kind` is `0` Ordinary, `1` Terminal,
`2` Rectification. `contentHash` must be `sha256(payload)`, or the contract refuses the record.

```bash
C=0x<CONTRACT_EVM_ADDRESS>
send() { cast send $C "$@" --rpc-url $RPC --private-key $HEDERA_OPERATOR_KEY; }
call() { cast call $C "$@" --rpc-url $RPC; }
hex()  { printf '0x%s' "$(printf '%s' "$1" | xxd -p | tr -d '\n')"; }
sha()  { printf '0x%s' "$(printf '%s' "$1" | shasum -a 256 | cut -d' ' -f1)"; }

A=0x01890a5d000000000000000000000001   # animalId
U=0x0000000000000000000000000000000a   # author
P1='{"type":"registration"}'; P2='{"type":"weighing"}'; P3='{"type":"death"}'

send "createChain(bytes16,bytes32,bytes,bytes16)" $A $(sha "$P1") $(hex "$P1") $U
send "appendRecord(bytes16,bytes32,bytes32,bytes,uint8,bytes16)" \
  $A $(sha "$P1") $(sha "$P2") $(hex "$P2") 0 $U
call "getRecords(bytes16,uint32,uint32)((uint32,bytes32,bytes32,bytes,uint8,bytes16,uint64,uint64)[])" $A 1 10
send "closeChain(bytes16,bytes32,bytes32,bytes,bytes16)" $A $(sha "$P2") $(sha "$P3") $(hex "$P3") $U
call "getHeader(bytes16)((uint32,bytes32,bool,uint64))" $A

# The same read through the mirror node, the path the public history uses:
curl -s -X POST https://testnet.mirrornode.hedera.com/api/v1/contracts/call \
  -H 'content-type: application/json' \
  -d "{\"to\":\"$C\",\"data\":\"$(cast calldata 'getHeader(bytes16)' $A)\"}"
```

What each invariant should refuse (`cast` prints the custom error; decode an unknown selector with
`cast decode-error <data> --sig '<Error>()'`):

| Attempt | Expected |
|---|---|
| `createChain` again on `$A` | `ChainExists()` |
| `appendRecord` with a stale `expectedPrevHash` | `PrevHashMismatch()` |
| `appendRecord … 0` after `closeChain` | `ChainClosed()` |
| `closeChain` a second time | `ChainClosed()` |
| `appendRecord … 1` (Terminal) | `TerminalViaAppend()` |
| a `contentHash` that is not `sha256(payload)` | `HashMismatch()` |
| any write signed by a key not in the writer set | `NotWriter()` |

`appendRecord … 2` (Rectification) on the closed chain **succeeds**, and `getHeader` still reports
`closed: true`.

## Measurements to record (documents 06 / 07, Pending)

Local EVM gas from `forge test --gas-report` (Hedera charges gas with its own price; HBAR still to
measure on Testnet):

| Measure | Value |
|---|---|
| `appendRecord`, small payload | ~176 k gas (local) |
| `createChain`, 4,096-byte payload | ~3.1 M gas (local; limit 15 M) |
| HBAR per record, realistic and maximum payload | _to measure_ |
| Latency submit → receipt, receipt → visible on mirror | _to measure_ |
| Safe `MAX_PAGE` via mirror `contracts/call` at 4 KiB payloads (provisionally 20) | _to measure_ |
| `msg.sender` for an ECDSA operator (EVM alias vs long-zero) | _to confirm_ |
| Foundry / solc versions | forge 1.8.5, solc 0.8.28 (`evm_version = cancun`) |
