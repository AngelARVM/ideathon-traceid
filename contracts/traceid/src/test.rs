extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    vec, Address, Bytes, BytesN, Env, IntoVal,
};

struct Setup {
    env: Env,
    client: TraceIdClient<'static>,
    writer: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let writer = Address::generate(&env);
    let id = env.register(TraceId, (admin, vec![&env, writer.clone()]));
    let client = TraceIdClient::new(&env, &id);
    Setup {
        env,
        client,
        writer,
    }
}

fn animal(env: &Env, n: u8) -> BytesN<16> {
    BytesN::from_array(env, &[n; 16])
}

fn author(env: &Env) -> BytesN<16> {
    BytesN::from_array(env, &[0xAA; 16])
}

fn payload(env: &Env, text: &str) -> (Bytes, BytesN<32>) {
    let bytes = Bytes::from_slice(env, text.as_bytes());
    let hash = env.crypto().sha256(&bytes).to_bytes();
    (bytes, hash)
}

fn zero_hash(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0u8; 32])
}

impl Setup {
    fn create(&self, a: &BytesN<16>, text: &str) -> BytesN<32> {
        let (p, h) = payload(&self.env, text);
        assert_eq!(
            self.client
                .create_chain(&self.writer, a, &h, &p, &author(&self.env)),
            1
        );
        h
    }

    fn append(
        &self,
        a: &BytesN<16>,
        prev: &BytesN<32>,
        text: &str,
        kind: RecordKind,
    ) -> BytesN<32> {
        let (p, h) = payload(&self.env, text);
        self.client
            .append_record(&self.writer, a, prev, &h, &p, &kind, &author(&self.env));
        h
    }

    fn close(&self, a: &BytesN<16>, prev: &BytesN<32>, text: &str) -> BytesN<32> {
        let (p, h) = payload(&self.env, text);
        self.client
            .close_chain(&self.writer, a, prev, &h, &p, &author(&self.env));
        h
    }
}

// ── Happy path ──────────────────────────────────────────────────────────────

#[test]
fn full_lifecycle_links_and_reads_back() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, r#"{"type":"registration"}"#);
    let h2 = s.append(&a, &h1, r#"{"type":"weighing"}"#, RecordKind::Ordinary);
    let h3 = s.close(&a, &h2, r#"{"type":"death"}"#);

    let header = s.client.get_header(&a);
    assert_eq!(header.count, 3);
    assert_eq!(header.last_hash, h3);
    assert!(header.closed);

    let records = s.client.get_records(&a, &1, &10);
    assert_eq!(records.len(), 3);
    let r1 = records.get(0).unwrap();
    assert_eq!(
        (r1.seq, r1.prev_hash.clone(), r1.kind),
        (1, zero_hash(&s.env), RecordKind::Ordinary)
    );
    assert_eq!(records.get(1).unwrap().prev_hash, h1);
    let r3 = records.get(2).unwrap();
    assert_eq!(
        (r3.seq, r3.prev_hash.clone(), r3.kind),
        (3, h2, RecordKind::Terminal)
    );
    assert_eq!(s.client.get_record(&a, &3), r3);
}

#[test]
fn chains_are_independent_per_animal() {
    let s = setup();
    let (a, b) = (animal(&s.env, 1), animal(&s.env, 2));
    let ha = s.create(&a, "a1");
    s.create(&b, "b1");
    s.append(&a, &ha, "a2", RecordKind::Ordinary);
    assert_eq!(s.client.get_header(&a).count, 2);
    assert_eq!(s.client.get_header(&b).count, 1);
}

#[test]
fn get_records_paginates_and_caps() {
    let s = setup();
    let a = animal(&s.env, 1);
    let mut prev = s.create(&a, "r1");
    for i in 2..=(MAX_PAGE + 5) {
        prev = s.append(&a, &prev, &std::format!("r{i}"), RecordKind::Ordinary);
    }
    let count = MAX_PAGE + 5;

    let page = s.client.get_records(&a, &1, &3);
    assert_eq!(
        page.iter().map(|r| r.seq).collect::<std::vec::Vec<_>>(),
        [1, 2, 3]
    );

    let capped = s.client.get_records(&a, &1, &u32::MAX);
    assert_eq!(capped.len(), MAX_PAGE);

    let tail = s.client.get_records(&a, &(count - 1), &10);
    assert_eq!(tail.len(), 2);

    // Reading past the head is an empty page, not an error.
    assert_eq!(s.client.get_records(&a, &(count + 1), &10).len(), 0);
    assert_eq!(
        s.client.try_get_records(&a, &(count + 2), &10),
        Err(Ok(Error::RecordNotFound))
    );
    assert_eq!(
        s.client.try_get_records(&a, &0, &10),
        Err(Ok(Error::RecordNotFound))
    );
    assert_eq!(
        s.client.try_get_records(&a, &1, &0),
        Err(Ok(Error::InvalidLimit))
    );
}

#[test]
fn reads_on_unknown_animal_fail() {
    let s = setup();
    let a = animal(&s.env, 9);
    assert_eq!(s.client.try_get_header(&a), Err(Ok(Error::ChainNotFound)));
    assert_eq!(
        s.client.try_get_record(&a, &1),
        Err(Ok(Error::RecordNotFound))
    );
    assert_eq!(
        s.client.try_get_records(&a, &1, &1),
        Err(Ok(Error::ChainNotFound))
    );
}

// ── Invariant 1: sequence authority ─────────────────────────────────────────

#[test]
fn contract_assigns_seq() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    let (p, h) = payload(&s.env, "r2");
    let seq = s.client.append_record(
        &s.writer,
        &a,
        &h1,
        &h,
        &p,
        &RecordKind::Ordinary,
        &author(&s.env),
    );
    assert_eq!(seq, 2);
}

// ── Invariant 2: hash linkage ───────────────────────────────────────────────

#[test]
fn wrong_prev_hash_refused() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    s.append(&a, &h1, "r2", RecordKind::Ordinary);

    // A stale writer still pointing at r1 loses the race.
    let (p, h) = payload(&s.env, "r2-stale");
    let res = s.client.try_append_record(
        &s.writer,
        &a,
        &h1,
        &h,
        &p,
        &RecordKind::Ordinary,
        &author(&s.env),
    );
    assert_eq!(res, Err(Ok(Error::PrevHashMismatch)));
    let res = s
        .client
        .try_close_chain(&s.writer, &a, &h1, &h, &p, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::PrevHashMismatch)));
    assert_eq!(s.client.get_header(&a).count, 2);
}

#[test]
fn content_hash_must_match_payload() {
    let s = setup();
    let a = animal(&s.env, 1);
    let (p, _) = payload(&s.env, "r1");
    let (_, other) = payload(&s.env, "something else");
    let res = s
        .client
        .try_create_chain(&s.writer, &a, &other, &p, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::HashMismatch)));
}

#[test]
fn payload_size_bounds() {
    let s = setup();
    let a = animal(&s.env, 1);
    let (empty, eh) = payload(&s.env, "");
    let res = s
        .client
        .try_create_chain(&s.writer, &a, &eh, &empty, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::InvalidPayload)));

    let big = Bytes::from_slice(&s.env, &[b'x'; (MAX_PAYLOAD_BYTES + 1) as usize]);
    let bh = s.env.crypto().sha256(&big).to_bytes();
    let res = s
        .client
        .try_create_chain(&s.writer, &a, &bh, &big, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::InvalidPayload)));

    let max = Bytes::from_slice(&s.env, &[b'x'; MAX_PAYLOAD_BYTES as usize]);
    let mh = s.env.crypto().sha256(&max).to_bytes();
    assert_eq!(
        s.client
            .create_chain(&s.writer, &a, &mh, &max, &author(&s.env)),
        1
    );
}

// ── Invariant 3: no overwrite ───────────────────────────────────────────────

#[test]
fn create_chain_on_existing_header_refused() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    let (p, h) = payload(&s.env, "r1-again");
    let res = s
        .client
        .try_create_chain(&s.writer, &a, &h, &p, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::ChainExists)));
    assert_eq!(s.client.get_record(&a, &1).content_hash, h1);
}

#[test]
fn existing_record_slot_is_never_overwritten() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    // Plant a record in slot 2 behind the header's back, as a corrupted state would.
    let (p, h) = payload(&s.env, "planted");
    let planted = StoredRecord {
        seq: 2,
        content_hash: h.clone(),
        prev_hash: h1.clone(),
        payload: p,
        kind: RecordKind::Ordinary,
        author: author(&s.env),
        recorded_ledger: 0,
    };
    s.env.as_contract(&s.client.address, || {
        s.env
            .storage()
            .persistent()
            .set(&DataKey::Record(a.clone(), 2), &planted);
    });

    let (p2, h2) = payload(&s.env, "r2");
    let res = s.client.try_append_record(
        &s.writer,
        &a,
        &h1,
        &h2,
        &p2,
        &RecordKind::Ordinary,
        &author(&s.env),
    );
    assert_eq!(res, Err(Ok(Error::RecordExists)));
    assert_eq!(s.client.get_record(&a, &2).content_hash, h);
}

// ── Invariant 4: authorization ──────────────────────────────────────────────

#[test]
fn non_writer_refused() {
    let s = setup();
    let a = animal(&s.env, 1);
    let intruder = Address::generate(&s.env);
    let (p, h) = payload(&s.env, "r1");
    let res = s
        .client
        .try_create_chain(&intruder, &a, &h, &p, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::NotWriter)));

    let h1 = s.create(&a, "r1");
    let (p2, h2) = payload(&s.env, "r2");
    let res = s.client.try_append_record(
        &intruder,
        &a,
        &h1,
        &h2,
        &p2,
        &RecordKind::Ordinary,
        &author(&s.env),
    );
    assert_eq!(res, Err(Ok(Error::NotWriter)));
    let res = s
        .client
        .try_close_chain(&intruder, &a, &h1, &h2, &p2, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::NotWriter)));
}

#[test]
fn writer_signature_is_required() {
    let s = setup();
    let a = animal(&s.env, 1);
    let (p, h) = payload(&s.env, "r1");
    let au = author(&s.env);

    // Clear the blanket mock: nobody has signed anything.
    s.env.set_auths(&[]);
    assert!(s
        .client
        .try_create_chain(&s.writer, &a, &h, &p, &au)
        .is_err());

    // With exactly the writer's signature over exactly this call, it goes through.
    s.client
        .mock_auths(&[MockAuth {
            address: &s.writer,
            invoke: &MockAuthInvoke {
                contract: &s.client.address,
                fn_name: "create_chain",
                args: (
                    s.writer.clone(),
                    a.clone(),
                    h.clone(),
                    p.clone(),
                    au.clone(),
                )
                    .into_val(&s.env),
                sub_invokes: &[],
            },
        }])
        .create_chain(&s.writer, &a, &h, &p, &au);
    assert_eq!(s.client.get_header(&a).count, 1);
}

#[test]
fn constructor_requires_writers() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let empty: Vec<Address> = Vec::new(&env);
    let res = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        env.register(TraceId, (admin, empty));
    }));
    assert!(res.is_err());
}

#[test]
fn constructor_stores_admin_and_writers() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let w = Address::generate(&env);
    let id = env.register(TraceId, (admin.clone(), vec![&env, w.clone()]));
    let client = TraceIdClient::new(&env, &id);
    assert_eq!(client.admin(), admin);
    assert_eq!(client.writers(), vec![&env, w]);
}

// ── Invariant 5: closed-chain policy ────────────────────────────────────────

#[test]
fn ordinary_milestone_on_closed_chain_refused() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    let h2 = s.close(&a, &h1, "terminal");
    let (p, h) = payload(&s.env, "too late");
    let res = s.client.try_append_record(
        &s.writer,
        &a,
        &h2,
        &h,
        &p,
        &RecordKind::Ordinary,
        &author(&s.env),
    );
    assert_eq!(res, Err(Ok(Error::ChainClosed)));
}

#[test]
fn closing_twice_refused() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    let h2 = s.close(&a, &h1, "terminal");
    let (p, h) = payload(&s.env, "terminal-2");
    let res = s
        .client
        .try_close_chain(&s.writer, &a, &h2, &h, &p, &author(&s.env));
    assert_eq!(res, Err(Ok(Error::ChainClosed)));
}

#[test]
fn rectification_allowed_on_closed_chain_and_never_reopens() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    let h2 = s.close(&a, &h1, "terminal");
    let h3 = s.append(&a, &h2, "rectifies #1", RecordKind::Rectification);

    let header = s.client.get_header(&a);
    assert_eq!((header.count, header.closed), (3, true));
    assert_eq!(s.client.get_record(&a, &3).kind, RecordKind::Rectification);

    let (p, h) = payload(&s.env, "still too late");
    let res = s.client.try_append_record(
        &s.writer,
        &a,
        &h3,
        &h,
        &p,
        &RecordKind::Ordinary,
        &author(&s.env),
    );
    assert_eq!(res, Err(Ok(Error::ChainClosed)));
}

#[test]
fn rectification_on_open_chain_keeps_it_open() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    s.append(&a, &h1, "rectifies #1", RecordKind::Rectification);
    assert!(!s.client.get_header(&a).closed);
}

#[test]
fn terminal_kind_via_append_refused() {
    let s = setup();
    let a = animal(&s.env, 1);
    let h1 = s.create(&a, "r1");
    let (p, h) = payload(&s.env, "sneaky terminal");
    let res = s.client.try_append_record(
        &s.writer,
        &a,
        &h1,
        &h,
        &p,
        &RecordKind::Terminal,
        &author(&s.env),
    );
    assert_eq!(res, Err(Ok(Error::TerminalViaAppend)));
    assert!(!s.client.get_header(&a).closed);
}

// ── TTL ─────────────────────────────────────────────────────────────────────

#[test]
fn writes_bump_ttl_to_max() {
    use soroban_sdk::testutils::storage::Persistent as _;
    let s = setup();
    let a = animal(&s.env, 1);
    s.create(&a, "r1");
    let max = s.env.storage().max_ttl();
    s.env.as_contract(&s.client.address, || {
        assert_eq!(
            s.env
                .storage()
                .persistent()
                .get_ttl(&DataKey::Header(a.clone())),
            max
        );
        assert_eq!(
            s.env
                .storage()
                .persistent()
                .get_ttl(&DataKey::Record(a.clone(), 1)),
            max
        );
    });
}

#[test]
fn extend_ttl_restores_max_after_time_passes() {
    use soroban_sdk::testutils::{storage::Persistent as _, Ledger as _};
    let s = setup();
    let a = animal(&s.env, 1);
    let mut prev = s.create(&a, "r1");
    prev = s.append(&a, &prev, "r2", RecordKind::Ordinary);
    s.append(&a, &prev, "r3", RecordKind::Ordinary);

    s.env
        .ledger()
        .with_mut(|l| l.sequence_number += 30 * DAY_IN_LEDGERS);
    let max = s.env.storage().max_ttl();
    s.env.as_contract(&s.client.address, || {
        assert!(
            s.env
                .storage()
                .persistent()
                .get_ttl(&DataKey::Record(a.clone(), 1))
                < max
        );
    });

    assert_eq!(s.client.extend_ttl(&a, &1, &10), 3);
    s.env.as_contract(&s.client.address, || {
        for seq in 1..=3 {
            assert_eq!(
                s.env
                    .storage()
                    .persistent()
                    .get_ttl(&DataKey::Record(a.clone(), seq)),
                max
            );
        }
        assert_eq!(
            s.env
                .storage()
                .persistent()
                .get_ttl(&DataKey::Header(a.clone())),
            max
        );
    });
    assert_eq!(s.client.extend_ttl(&a, &4, &10), 0);
}
