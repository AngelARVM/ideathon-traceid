// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {TraceId} from "../src/TraceId.sol";

/// Exposes a back door into storage, to plant a record behind the header's back as a corrupted
/// state would. Only for `test_existingRecordSlotIsNeverOverwritten`.
contract TraceIdHarness is TraceId {
    constructor(address[] memory writers_) TraceId(writers_) {}

    function plant(bytes16 animalId, StoredRecord calldata record) external {
        records[animalId][record.seq] = record;
    }
}

/// Port of the Soroban suite (`contracts/traceid/src/test.rs` in git history), one test per Rust
/// test. Each rejection asserts its exact custom error. The TTL tests have no counterpart:
/// Hedera contract storage does not expire (ADR-0003).
/// Hashes are computed before `vm.prank` / `vm.expectRevert`: `sha256` is a call to the 0x02
/// precompile and would consume the cheatcode meant for the contract.
contract TraceIdTest is Test {
    TraceIdHarness internal c;
    address internal writer = makeAddr("writer");
    bytes16 internal constant AUTHOR = bytes16(0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa);

    function setUp() public {
        address[] memory ws = new address[](1);
        ws[0] = writer;
        c = new TraceIdHarness(ws);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    function animal(uint8 n) internal pure returns (bytes16) {
        return bytes16(uint128(n) * 0x01010101010101010101010101010101);
    }

    function create(bytes16 a, string memory text) internal returns (bytes32 h) {
        bytes memory p = bytes(text);
        h = sha256(p);
        vm.prank(writer);
        assertEq(c.createChain(a, h, p, AUTHOR), 1);
    }

    function append(bytes16 a, bytes32 prev, string memory text, TraceId.Kind kind) internal returns (bytes32 h) {
        bytes memory p = bytes(text);
        h = sha256(p);
        vm.prank(writer);
        c.appendRecord(a, prev, h, p, kind, AUTHOR);
    }

    function close(bytes16 a, bytes32 prev, string memory text) internal returns (bytes32 h) {
        bytes memory p = bytes(text);
        h = sha256(p);
        vm.prank(writer);
        c.closeChain(a, prev, h, p, AUTHOR);
    }

    function expectAppendRevert(bytes16 a, bytes32 prev, string memory text, TraceId.Kind kind, bytes4 err) internal {
        bytes memory p = bytes(text);
        bytes32 h = sha256(p);
        vm.prank(writer);
        vm.expectRevert(err);
        c.appendRecord(a, prev, h, p, kind, AUTHOR);
    }

    function expectCloseRevert(bytes16 a, bytes32 prev, string memory text, bytes4 err) internal {
        bytes memory p = bytes(text);
        bytes32 h = sha256(p);
        vm.prank(writer);
        vm.expectRevert(err);
        c.closeChain(a, prev, h, p, AUTHOR);
    }

    // ── Happy path ────────────────────────────────────────────────────────

    function test_fullLifecycleLinksAndReadsBack() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, '{"type":"registration"}');
        bytes32 h2 = append(a, h1, '{"type":"weighing"}', TraceId.Kind.Ordinary);
        bytes32 h3 = close(a, h2, '{"type":"death"}');

        TraceId.ChainHeader memory header = c.getHeader(a);
        assertEq(header.count, 3);
        assertEq(header.lastHash, h3);
        assertTrue(header.closed);

        TraceId.StoredRecord[] memory rs = c.getRecords(a, 1, 10);
        assertEq(rs.length, 3);
        assertEq(rs[0].seq, 1);
        assertEq(rs[0].prevHash, bytes32(0));
        assertEq(uint8(rs[0].kind), uint8(TraceId.Kind.Ordinary));
        assertEq(rs[1].prevHash, h1);
        assertEq(rs[2].seq, 3);
        assertEq(rs[2].prevHash, h2);
        assertEq(uint8(rs[2].kind), uint8(TraceId.Kind.Terminal));
        assertEq(rs[2].payload, bytes('{"type":"death"}'));
        assertEq(rs[2].author, AUTHOR);
        assertEq(abi.encode(c.getRecord(a, 3)), abi.encode(rs[2]));
    }

    function test_chainsAreIndependentPerAnimal() public {
        (bytes16 a, bytes16 b) = (animal(1), animal(2));
        bytes32 ha = create(a, "a1");
        create(b, "b1");
        append(a, ha, "a2", TraceId.Kind.Ordinary);
        assertEq(c.getHeader(a).count, 2);
        assertEq(c.getHeader(b).count, 1);
    }

    function test_getRecordsPaginatesAndCaps() public {
        bytes16 a = animal(1);
        uint32 maxPage = c.MAX_PAGE();
        uint32 count = maxPage + 5;
        bytes32 prev = create(a, "r1");
        for (uint32 i = 2; i <= count; i++) {
            prev = append(a, prev, string.concat("r", vm.toString(i)), TraceId.Kind.Ordinary);
        }

        TraceId.StoredRecord[] memory page = c.getRecords(a, 1, 3);
        assertEq(page.length, 3);
        assertEq(page[0].seq, 1);
        assertEq(page[1].seq, 2);
        assertEq(page[2].seq, 3);

        assertEq(c.getRecords(a, 1, type(uint32).max).length, maxPage);
        assertEq(c.getRecords(a, count - 1, 10).length, 2);

        // Reading past the head is an empty page, not an error.
        assertEq(c.getRecords(a, count + 1, 10).length, 0);
        vm.expectRevert(TraceId.RecordNotFound.selector);
        c.getRecords(a, count + 2, 10);
        vm.expectRevert(TraceId.RecordNotFound.selector);
        c.getRecords(a, 0, 10);
        vm.expectRevert(TraceId.InvalidLimit.selector);
        c.getRecords(a, 1, 0);
    }

    function test_readsOnUnknownAnimalFail() public {
        bytes16 a = animal(9);
        vm.expectRevert(TraceId.ChainNotFound.selector);
        c.getHeader(a);
        vm.expectRevert(TraceId.RecordNotFound.selector);
        c.getRecord(a, 1);
        vm.expectRevert(TraceId.ChainNotFound.selector);
        c.getRecords(a, 1, 1);
    }

    // ── Invariant 1: sequence authority ───────────────────────────────────

    function test_contractAssignsSeq() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        bytes memory p = bytes("r2");
        bytes32 h = sha256(p);
        vm.prank(writer);
        assertEq(c.appendRecord(a, h1, h, p, TraceId.Kind.Ordinary, AUTHOR), 2);
    }

    // ── Invariant 2: hash linkage ─────────────────────────────────────────

    function test_wrongPrevHashRefused() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        append(a, h1, "r2", TraceId.Kind.Ordinary);

        // A stale writer still pointing at r1 loses the race.
        expectAppendRevert(a, h1, "r2-stale", TraceId.Kind.Ordinary, TraceId.PrevHashMismatch.selector);
        expectCloseRevert(a, h1, "r2-stale", TraceId.PrevHashMismatch.selector);
        assertEq(c.getHeader(a).count, 2);
    }

    function test_contentHashMustMatchPayload() public {
        bytes32 wrong = sha256("something else");
        vm.prank(writer);
        vm.expectRevert(TraceId.HashMismatch.selector);
        c.createChain(animal(1), wrong, bytes("r1"), AUTHOR);
    }

    function test_payloadSizeBounds() public {
        bytes16 a = animal(1);
        uint256 max = c.MAX_PAYLOAD_BYTES();

        bytes32 emptyHash = sha256("");
        vm.prank(writer);
        vm.expectRevert(TraceId.InvalidPayload.selector);
        c.createChain(a, emptyHash, "", AUTHOR);

        bytes memory big = filled(max + 1);
        bytes32 bigHash = sha256(big);
        vm.prank(writer);
        vm.expectRevert(TraceId.InvalidPayload.selector);
        c.createChain(a, bigHash, big, AUTHOR);

        bytes memory full = filled(max);
        bytes32 fullHash = sha256(full);
        vm.prank(writer);
        assertEq(c.createChain(a, fullHash, full, AUTHOR), 1);
    }

    function filled(uint256 n) internal pure returns (bytes memory b) {
        b = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            b[i] = "x";
        }
    }

    // ── Invariant 3: no overwrite ─────────────────────────────────────────

    function test_createChainOnExistingHeaderRefused() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        bytes memory p = bytes("r1-again");
        bytes32 h = sha256(p);
        vm.prank(writer);
        vm.expectRevert(TraceId.ChainExists.selector);
        c.createChain(a, h, p, AUTHOR);
        assertEq(c.getRecord(a, 1).contentHash, h1);
    }

    function test_existingRecordSlotIsNeverOverwritten() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        // Plant a record in slot 2 behind the header's back, as a corrupted state would.
        bytes memory p = bytes("planted");
        c.plant(
            a,
            TraceId.StoredRecord({
                seq: 2,
                contentHash: sha256(p),
                prevHash: h1,
                payload: p,
                kind: TraceId.Kind.Ordinary,
                author: AUTHOR,
                recordedAt: 0,
                blockNumber: 0
            })
        );

        expectAppendRevert(a, h1, "r2", TraceId.Kind.Ordinary, TraceId.RecordExists.selector);
        assertEq(c.getRecord(a, 2).contentHash, sha256(p));
    }

    // ── Invariant 4: authorization ────────────────────────────────────────

    function test_nonWriterRefused() public {
        bytes16 a = animal(1);
        address intruder = makeAddr("intruder");
        bytes memory p = bytes("r1");

        bytes32 h = sha256(p);
        vm.prank(intruder);
        vm.expectRevert(TraceId.NotWriter.selector);
        c.createChain(a, h, p, AUTHOR);

        bytes32 h1 = create(a, "r1");
        bytes memory p2 = bytes("r2");
        bytes32 h2 = sha256(p2);
        vm.prank(intruder);
        vm.expectRevert(TraceId.NotWriter.selector);
        c.appendRecord(a, h1, h2, p2, TraceId.Kind.Ordinary, AUTHOR);
        vm.prank(intruder);
        vm.expectRevert(TraceId.NotWriter.selector);
        c.closeChain(a, h1, h2, p2, AUTHOR);
    }

    /// Soroban's `writer` argument plus `require_auth()` collapse into `msg.sender`: the caller is
    /// whoever signed the transaction, so there is no address to spoof. Without the writer as
    /// sender the call fails; with it, it goes through.
    function test_writerSignatureIsRequired() public {
        bytes16 a = animal(1);
        bytes memory p = bytes("r1");

        bytes32 h = sha256(p);
        vm.expectRevert(TraceId.NotWriter.selector);
        c.createChain(a, h, p, AUTHOR);

        vm.prank(writer);
        c.createChain(a, h, p, AUTHOR);
        assertEq(c.getHeader(a).count, 1);
    }

    function test_constructorRequiresWriters() public {
        vm.expectRevert(TraceId.NoWriters.selector);
        new TraceId(new address[](0));
    }

    function test_constructorStoresWriters() public {
        address[] memory ws = c.writers();
        assertEq(ws.length, 1);
        assertEq(ws[0], writer);
    }

    // ── Invariant 5: closed-chain policy ──────────────────────────────────

    function test_ordinaryMilestoneOnClosedChainRefused() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        bytes32 h2 = close(a, h1, "terminal");
        expectAppendRevert(a, h2, "too late", TraceId.Kind.Ordinary, TraceId.ChainClosed.selector);
    }

    function test_closingTwiceRefused() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        bytes32 h2 = close(a, h1, "terminal");
        expectCloseRevert(a, h2, "terminal-2", TraceId.ChainClosed.selector);
    }

    function test_rectificationAllowedOnClosedChainAndNeverReopens() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        bytes32 h2 = close(a, h1, "terminal");
        bytes32 h3 = append(a, h2, "rectifies #1", TraceId.Kind.Rectification);

        TraceId.ChainHeader memory header = c.getHeader(a);
        assertEq(header.count, 3);
        assertTrue(header.closed);
        assertEq(uint8(c.getRecord(a, 3).kind), uint8(TraceId.Kind.Rectification));

        expectAppendRevert(a, h3, "still too late", TraceId.Kind.Ordinary, TraceId.ChainClosed.selector);
    }

    function test_rectificationOnOpenChainKeepsItOpen() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        append(a, h1, "rectifies #1", TraceId.Kind.Rectification);
        assertFalse(c.getHeader(a).closed);
    }

    function test_terminalKindViaAppendRefused() public {
        bytes16 a = animal(1);
        bytes32 h1 = create(a, "r1");
        expectAppendRevert(a, h1, "sneaky terminal", TraceId.Kind.Terminal, TraceId.TerminalViaAppend.selector);
        assertFalse(c.getHeader(a).closed);
    }

    // ── Events ────────────────────────────────────────────────────────────

    function test_writesEmitEvents() public {
        bytes16 a = animal(1);
        bytes memory p = bytes("r1");
        vm.expectEmit(address(c));
        emit TraceId.RecordAppended(a, 1, sha256(p), TraceId.Kind.Ordinary);
        bytes32 h = sha256(p);
        vm.prank(writer);
        c.createChain(a, h, p, AUTHOR);

        bytes memory t = bytes("terminal");
        vm.expectEmit(address(c));
        emit TraceId.RecordAppended(a, 2, sha256(t), TraceId.Kind.Terminal);
        vm.expectEmit(address(c));
        emit TraceId.ChainTerminated(a, 2);
        bytes32 ht = sha256(t);
        vm.prank(writer);
        c.closeChain(a, h, ht, t, AUTHOR);
    }
}
