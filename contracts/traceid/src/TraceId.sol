// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title TraceID — append-only, hash-linked record chains, one per animal.
/// @notice The contract is type-blind (doc 04, D9): it never parses the payload. It enforces only
/// the five structural invariants of doc 06 — sequence authority, hash linkage, no overwrite,
/// writer authorization and the closed-chain policy — plus `contentHash == sha256(payload)`.
/// It is non-upgradeable (doc 04, D8): no proxy, no `delegatecall`, no self-destruct, no admin.
contract TraceId {
    /// Hard ceiling on a single payload, so a `ContractExecuteTransaction` carrying it with ABI
    /// overhead stays inside Hedera's ~6 KiB transaction size (doc 06).
    uint32 public constant MAX_PAYLOAD_BYTES = 4_096;
    /// Internal cap for `getRecords` page size. Provisional until measured against the mirror's
    /// `contracts/call` with maximum-size payloads (doc 06, Pending).
    uint32 public constant MAX_PAGE = 20;

    enum Kind {
        Ordinary,
        Terminal,
        Rectification
    }

    struct ChainHeader {
        /// Records so far; the next seq is `count + 1`. Zero means the chain does not exist.
        uint32 count;
        /// contentHash of the head record.
        bytes32 lastHash;
        bool closed;
        /// block.timestamp at `createChain`.
        uint64 createdAt;
    }

    struct StoredRecord {
        uint32 seq;
        bytes32 contentHash;
        bytes32 prevHash;
        /// Canonical JSON bytes — opaque to the contract.
        bytes payload;
        Kind kind;
        /// author_id, informational, mirrors the payload.
        bytes16 author;
        uint64 recordedAt;
        uint64 blockNumber;
    }

    // Same names and order as the Soroban contract, so the app's error mapping carries over.

    /// Caller is not in the writer set.
    error NotWriter();
    /// `createChain` on an animal that already has a header.
    error ChainExists();
    /// Operation on an animal with no header.
    error ChainNotFound();
    /// `expectedPrevHash` does not match `header.lastHash`.
    error PrevHashMismatch();
    /// `records[animalId][seq]` already exists.
    error RecordExists();
    /// Ordinary milestone, or a second close, on a closed chain.
    error ChainClosed();
    /// `Terminal` passed to `appendRecord`; terminal records go through `closeChain`.
    error TerminalViaAppend();
    /// `contentHash` is not `sha256(payload)`.
    error HashMismatch();
    /// Empty payload or larger than `MAX_PAYLOAD_BYTES`.
    error InvalidPayload();
    /// `seq` / `fromSeq` outside `1..=count`.
    error RecordNotFound();
    /// `limit` of zero.
    error InvalidLimit();
    /// Writer set is empty.
    error NoWriters();

    event RecordAppended(bytes16 indexed animalId, uint32 indexed seq, bytes32 contentHash, Kind kind);
    /// Named apart from the `ChainClosed` error: Solidity forbids an event and an error sharing a name.
    event ChainTerminated(bytes16 indexed animalId, uint32 seq);

    mapping(bytes16 => ChainHeader) internal headers;
    mapping(bytes16 => mapping(uint32 => StoredRecord)) internal records;
    mapping(address => bool) internal isWriter;
    address[] internal writerList;

    /// The writer set is fixed here; there is deliberately no way to amend it. Rotating a key
    /// means a new contract and a re-seed.
    constructor(address[] memory writers_) {
        if (writers_.length == 0) revert NoWriters();
        for (uint256 i = 0; i < writers_.length; i++) {
            isWriter[writers_[i]] = true;
        }
        writerList = writers_;
    }

    modifier onlyWriter() {
        if (!isWriter[msg.sender]) revert NotWriter();
        _;
    }

    /// Opens a chain with its first record (seq 1, `prevHash` all zeros, kind `Ordinary`).
    function createChain(bytes16 animalId, bytes32 contentHash, bytes calldata payload, bytes16 author)
        external
        onlyWriter
        returns (uint32)
    {
        ChainHeader storage header = headers[animalId];
        if (header.count != 0) revert ChainExists();
        header.createdAt = uint64(block.timestamp);
        return _writeRecord(animalId, header, contentHash, payload, Kind.Ordinary, author, false);
    }

    /// Appends an `Ordinary` or `Rectification` record. The contract assigns `seq`.
    function appendRecord(
        bytes16 animalId,
        bytes32 expectedPrevHash,
        bytes32 contentHash,
        bytes calldata payload,
        Kind kind,
        bytes16 author
    ) external onlyWriter returns (uint32) {
        if (kind == Kind.Terminal) revert TerminalViaAppend();
        ChainHeader storage header = _loadLinkedHeader(animalId, expectedPrevHash);
        if (header.closed && kind != Kind.Rectification) revert ChainClosed();
        // A rectification never touches `closed`.
        return _writeRecord(animalId, header, contentHash, payload, kind, author, false);
    }

    /// Appends a `Terminal` record and closes the chain, atomically.
    function closeChain(
        bytes16 animalId,
        bytes32 expectedPrevHash,
        bytes32 contentHash,
        bytes calldata payload,
        bytes16 author
    ) external onlyWriter returns (uint32) {
        ChainHeader storage header = _loadLinkedHeader(animalId, expectedPrevHash);
        if (header.closed) revert ChainClosed();
        uint32 seq = _writeRecord(animalId, header, contentHash, payload, Kind.Terminal, author, true);
        emit ChainTerminated(animalId, seq);
        return seq;
    }

    function getHeader(bytes16 animalId) external view returns (ChainHeader memory) {
        return _loadHeader(animalId);
    }

    function getRecord(bytes16 animalId, uint32 seq) external view returns (StoredRecord memory) {
        StoredRecord storage record = records[animalId][seq];
        if (record.seq == 0) revert RecordNotFound();
        return record;
    }

    /// Records `fromSeq ..` in ascending order, at most `min(limit, MAX_PAGE)` of them.
    /// An empty array means `fromSeq == count + 1` (the caller has read everything).
    function getRecords(bytes16 animalId, uint32 fromSeq, uint32 limit)
        external
        view
        returns (StoredRecord[] memory page)
    {
        ChainHeader storage header = _loadHeader(animalId);
        if (limit == 0) revert InvalidLimit();
        if (fromSeq == 0 || fromSeq > header.count + 1) revert RecordNotFound();
        uint32 capped = limit < MAX_PAGE ? limit : MAX_PAGE;
        uint32 available = header.count + 1 - fromSeq;
        uint32 size = capped < available ? capped : available;
        page = new StoredRecord[](size);
        for (uint32 i = 0; i < size; i++) {
            page[i] = records[animalId][fromSeq + i];
        }
    }

    function writers() external view returns (address[] memory) {
        return writerList;
    }

    function _loadHeader(bytes16 animalId) private view returns (ChainHeader storage header) {
        header = headers[animalId];
        if (header.count == 0) revert ChainNotFound();
    }

    function _loadLinkedHeader(bytes16 animalId, bytes32 expectedPrevHash)
        private
        view
        returns (ChainHeader storage header)
    {
        header = _loadHeader(animalId);
        if (header.lastHash != expectedPrevHash) revert PrevHashMismatch();
    }

    /// Validates the payload, writes `records[animalId][count + 1]` and advances the header. The
    /// single write path shared by all three mutating entry points.
    function _writeRecord(
        bytes16 animalId,
        ChainHeader storage header,
        bytes32 contentHash,
        bytes calldata payload,
        Kind kind,
        bytes16 author,
        bool close
    ) private returns (uint32 seq) {
        if (payload.length == 0 || payload.length > MAX_PAYLOAD_BYTES) revert InvalidPayload();
        if (sha256(payload) != contentHash) revert HashMismatch();
        seq = header.count + 1;
        StoredRecord storage record = records[animalId][seq];
        if (record.seq != 0) revert RecordExists();

        record.seq = seq;
        record.contentHash = contentHash;
        record.prevHash = header.lastHash;
        record.payload = payload;
        record.kind = kind;
        record.author = author;
        record.recordedAt = uint64(block.timestamp);
        record.blockNumber = uint64(block.number);

        header.count = seq;
        header.lastHash = contentHash;
        if (close) header.closed = true;

        emit RecordAppended(animalId, seq, contentHash, kind);
    }
}
