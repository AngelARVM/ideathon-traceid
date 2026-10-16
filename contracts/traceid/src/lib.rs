//! TraceID — append-only, hash-linked record chains, one per animal.
//!
//! The contract is type-blind (doc 04, D9): it never parses the payload. It enforces only the
//! five structural invariants of doc 06 — sequence authority, hash linkage, no overwrite,
//! writer authorization and the closed-chain policy — plus `content_hash == sha256(payload)`.
//! It is non-upgradeable (doc 04, D8): there is no code-replacement entry point.
#![no_std]
// The entry-point signatures are the interface fixed in doc 06.
#![allow(clippy::too_many_arguments)]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Bytes, BytesN,
    Env, Vec,
};

/// Ledgers per day at ~5 s per ledger.
const DAY_IN_LEDGERS: u32 = 17_280;
/// Hard ceiling on a single payload. A realistic record is a few hundred bytes (doc 06); this
/// keeps every `StoredRecord` far below the 64 KiB ledger-entry limit.
pub const MAX_PAYLOAD_BYTES: u32 = 8_192;
/// Internal cap for `get_records` / `extend_ttl` page size. Provisional until measured on
/// Testnet (doc 06, Pending); also keeps `extend_ttl` under the 200-entries-per-tx limit.
pub const MAX_PAGE: u32 = 50;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// animal_id -> ChainHeader
    Header(BytesN<16>),
    /// (animal_id, seq) -> StoredRecord
    Record(BytesN<16>, u32),
    /// instance storage
    Admin,
    /// instance storage: authorized writer set
    Writers,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum RecordKind {
    Ordinary = 0,
    Terminal = 1,
    Rectification = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ChainHeader {
    /// Records so far; the next seq is `count + 1`.
    pub count: u32,
    /// content_hash of the head record.
    pub last_hash: BytesN<32>,
    pub closed: bool,
    /// Ledger timestamp at `create_chain`.
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StoredRecord {
    pub seq: u32,
    pub content_hash: BytesN<32>,
    pub prev_hash: BytesN<32>,
    /// Canonical JSON bytes — opaque to the contract.
    pub payload: Bytes,
    pub kind: RecordKind,
    /// author_id, informational, mirrors the payload.
    pub author: BytesN<16>,
    pub recorded_ledger: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Caller is not in the `Writers` set.
    NotWriter = 1,
    /// `create_chain` on an animal that already has a header.
    ChainExists = 2,
    /// Operation on an animal with no header.
    ChainNotFound = 3,
    /// `expected_prev_hash` does not match `header.last_hash`.
    PrevHashMismatch = 4,
    /// `Record(animal_id, seq)` already exists.
    RecordExists = 5,
    /// Ordinary milestone, or a second close, on a closed chain.
    ChainClosed = 6,
    /// `Terminal` passed to `append_record`; terminal records go through `close_chain`.
    TerminalViaAppend = 7,
    /// `content_hash` is not `sha256(payload)`.
    HashMismatch = 8,
    /// Empty payload or larger than `MAX_PAYLOAD_BYTES`.
    InvalidPayload = 9,
    /// `seq` / `from_seq` outside `1..=count`.
    RecordNotFound = 10,
    /// `limit` of zero.
    InvalidLimit = 11,
    /// `Writers` set is empty.
    NoWriters = 12,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecordAppended {
    #[topic]
    pub animal_id: BytesN<16>,
    pub seq: u32,
    pub content_hash: BytesN<32>,
    pub kind: RecordKind,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ChainClosed {
    #[topic]
    pub animal_id: BytesN<16>,
    pub seq: u32,
}

#[contract]
pub struct TraceId;

#[contractimpl]
impl TraceId {
    /// Runs once, atomically, at deploy time — so there is no `init` that could be front-run or
    /// called twice. The writer set is fixed here; there is deliberately no way to amend it.
    pub fn __constructor(env: Env, admin: Address, writers: Vec<Address>) -> Result<(), Error> {
        if writers.is_empty() {
            return Err(Error::NoWriters);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Writers, &writers);
        bump_instance(&env);
        Ok(())
    }

    /// Opens a chain with its first record (seq 1, `prev_hash` all zeros, kind `Ordinary`).
    pub fn create_chain(
        env: Env,
        writer: Address,
        animal_id: BytesN<16>,
        content_hash: BytesN<32>,
        payload: Bytes,
        author: BytesN<16>,
    ) -> Result<u32, Error> {
        require_writer(&env, &writer)?;
        let header_key = DataKey::Header(animal_id.clone());
        if env.storage().persistent().has(&header_key) {
            return Err(Error::ChainExists);
        }
        let header = ChainHeader {
            count: 0,
            last_hash: BytesN::from_array(&env, &[0u8; 32]),
            closed: false,
            created_at: env.ledger().timestamp(),
        };
        write_record(
            &env,
            &animal_id,
            header,
            content_hash,
            payload,
            RecordKind::Ordinary,
            author,
            false,
        )
    }

    /// Appends an `Ordinary` or `Rectification` record. The contract assigns `seq`.
    pub fn append_record(
        env: Env,
        writer: Address,
        animal_id: BytesN<16>,
        expected_prev_hash: BytesN<32>,
        content_hash: BytesN<32>,
        payload: Bytes,
        kind: RecordKind,
        author: BytesN<16>,
    ) -> Result<u32, Error> {
        require_writer(&env, &writer)?;
        if kind == RecordKind::Terminal {
            return Err(Error::TerminalViaAppend);
        }
        let header = load_linked_header(&env, &animal_id, &expected_prev_hash)?;
        if header.closed && kind != RecordKind::Rectification {
            return Err(Error::ChainClosed);
        }
        // A rectification never touches `closed`: it is written with the header's current value.
        write_record(
            &env,
            &animal_id,
            header,
            content_hash,
            payload,
            kind,
            author,
            false,
        )
    }

    /// Appends a `Terminal` record and closes the chain, atomically.
    pub fn close_chain(
        env: Env,
        writer: Address,
        animal_id: BytesN<16>,
        expected_prev_hash: BytesN<32>,
        content_hash: BytesN<32>,
        payload: Bytes,
        author: BytesN<16>,
    ) -> Result<u32, Error> {
        require_writer(&env, &writer)?;
        let header = load_linked_header(&env, &animal_id, &expected_prev_hash)?;
        if header.closed {
            return Err(Error::ChainClosed);
        }
        let seq = write_record(
            &env,
            &animal_id,
            header,
            content_hash,
            payload,
            RecordKind::Terminal,
            author,
            true,
        )?;
        ChainClosed { animal_id, seq }.publish(&env);
        Ok(seq)
    }

    pub fn get_header(env: Env, animal_id: BytesN<16>) -> Result<ChainHeader, Error> {
        load_header(&env, &animal_id)
    }

    pub fn get_record(env: Env, animal_id: BytesN<16>, seq: u32) -> Result<StoredRecord, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Record(animal_id, seq))
            .ok_or(Error::RecordNotFound)
    }

    /// Records `from_seq ..` in ascending order, at most `min(limit, MAX_PAGE)` of them.
    /// An empty vector means `from_seq == count + 1` (the caller has read everything).
    pub fn get_records(
        env: Env,
        animal_id: BytesN<16>,
        from_seq: u32,
        limit: u32,
    ) -> Result<Vec<StoredRecord>, Error> {
        let header = load_header(&env, &animal_id)?;
        let (from, to) = page_bounds(&header, from_seq, limit)?;
        let mut out = Vec::new(&env);
        for seq in from..=to {
            let record: StoredRecord = env
                .storage()
                .persistent()
                .get(&DataKey::Record(animal_id.clone(), seq))
                .ok_or(Error::RecordNotFound)?;
            out.push_back(record);
        }
        Ok(out)
    }

    /// Extends the TTL of the header, the instance and records `from_seq ..` (one page) to the
    /// network maximum. Permissionless: anyone can already extend any entry's TTL natively, so
    /// gating it would protect nothing. Returns the number of records touched.
    pub fn extend_ttl(
        env: Env,
        animal_id: BytesN<16>,
        from_seq: u32,
        limit: u32,
    ) -> Result<u32, Error> {
        let header = load_header(&env, &animal_id)?;
        bump_instance(&env);
        bump(&env, &DataKey::Header(animal_id.clone()));
        let (from, to) = page_bounds(&header, from_seq, limit)?;
        if from > to {
            return Ok(0);
        }
        for seq in from..=to {
            bump(&env, &DataKey::Record(animal_id.clone(), seq));
        }
        Ok(to - from + 1)
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn writers(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::Writers).unwrap()
    }
}

fn require_writer(env: &Env, writer: &Address) -> Result<(), Error> {
    writer.require_auth();
    let writers: Vec<Address> = env.storage().instance().get(&DataKey::Writers).unwrap();
    if !writers.contains(writer) {
        return Err(Error::NotWriter);
    }
    Ok(())
}

fn load_header(env: &Env, animal_id: &BytesN<16>) -> Result<ChainHeader, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Header(animal_id.clone()))
        .ok_or(Error::ChainNotFound)
}

fn load_linked_header(
    env: &Env,
    animal_id: &BytesN<16>,
    expected_prev_hash: &BytesN<32>,
) -> Result<ChainHeader, Error> {
    let header = load_header(env, animal_id)?;
    if header.last_hash != *expected_prev_hash {
        return Err(Error::PrevHashMismatch);
    }
    Ok(header)
}

/// Validates the payload, writes `Record(animal_id, count + 1)`, advances the header and bumps
/// every entry touched. The single write path shared by all three mutating entry points.
fn write_record(
    env: &Env,
    animal_id: &BytesN<16>,
    mut header: ChainHeader,
    content_hash: BytesN<32>,
    payload: Bytes,
    kind: RecordKind,
    author: BytesN<16>,
    close: bool,
) -> Result<u32, Error> {
    if payload.is_empty() || payload.len() > MAX_PAYLOAD_BYTES {
        return Err(Error::InvalidPayload);
    }
    if env.crypto().sha256(&payload).to_bytes() != content_hash {
        return Err(Error::HashMismatch);
    }
    let seq = header.count + 1;
    let record_key = DataKey::Record(animal_id.clone(), seq);
    if env.storage().persistent().has(&record_key) {
        return Err(Error::RecordExists);
    }

    let record = StoredRecord {
        seq,
        content_hash: content_hash.clone(),
        prev_hash: header.last_hash.clone(),
        payload,
        kind,
        author,
        recorded_ledger: env.ledger().sequence() as u64,
    };
    env.storage().persistent().set(&record_key, &record);

    header.count = seq;
    header.last_hash = content_hash.clone();
    header.closed = header.closed || close;
    let header_key = DataKey::Header(animal_id.clone());
    env.storage().persistent().set(&header_key, &header);

    bump(env, &record_key);
    bump(env, &header_key);
    bump_instance(env);

    RecordAppended {
        animal_id: animal_id.clone(),
        seq,
        content_hash,
        kind,
    }
    .publish(env);
    Ok(seq)
}

/// `[from, to]` inclusive. `from == count + 1` yields an empty range (`from > to`).
fn page_bounds(header: &ChainHeader, from_seq: u32, limit: u32) -> Result<(u32, u32), Error> {
    if limit == 0 {
        return Err(Error::InvalidLimit);
    }
    if from_seq == 0 || from_seq > header.count + 1 {
        return Err(Error::RecordNotFound);
    }
    let limit = limit.min(MAX_PAGE);
    let to = (from_seq - 1).saturating_add(limit).min(header.count);
    Ok((from_seq, to))
}

fn bump(env: &Env, key: &DataKey) {
    let max = env.storage().max_ttl();
    env.storage()
        .persistent()
        .extend_ttl(key, max.saturating_sub(DAY_IN_LEDGERS), max);
}

fn bump_instance(env: &Env) {
    let max = env.storage().max_ttl();
    env.storage()
        .instance()
        .extend_ttl(max.saturating_sub(DAY_IN_LEDGERS), max);
}

#[cfg(test)]
mod test;
