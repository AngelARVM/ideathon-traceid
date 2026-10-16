// Las invariantes que el contrato de S3 hace cumplir, ejercitadas sobre el stub de S2: si el
// drainer no las respeta acá, tampoco las va a respetar cuando el que rechace sea Soroban.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import { ChainError, type ChainWrite } from "@/lib/outbox/chain-writer";
import { createStubChainWriter } from "@/lib/outbox/stub-writer";
import type { Bytes } from "@/lib/records/canonical";

const bytes = (fill: number): Bytes => {
  const out = new Uint8Array(new ArrayBuffer(32));
  out.fill(fill);
  return out;
};

const sha256 = (payload: string): Bytes => {
  const digest = createHash("sha256").update(payload, "utf8").digest();
  const out = new Uint8Array(new ArrayBuffer(32));
  out.set(digest);
  return out;
};

interface FakeRow {
  seq: number;
  contentHash: Bytes;
  terminal: boolean;
}

/** Un cliente de Prisma mínimo: solo lo que `readHeader` consulta. */
function fakeDb(rows: FakeRow[]): PrismaClient {
  return {
    record: {
      findMany: async () => (rows.length === 0 ? [] : [rows[rows.length - 1]]),
      count: async () => rows.filter((r) => r.terminal).length,
    },
  } as unknown as PrismaClient;
}

const PAYLOAD = '{"a":1}';

const write = (over: Partial<ChainWrite> = {}): ChainWrite => ({
  animalId: "01JR0000000000000000000002",
  seq: 2,
  canonicalPayload: PAYLOAD,
  contentHash: sha256(PAYLOAD),
  prevHash: bytes(1),
  authorId: "01JR0000000000000000000004",
  kind: "ordinary",
  ...over,
});

const codeOf = async (fn: () => Promise<unknown>): Promise<string> => {
  try {
    await fn();
  } catch (err) {
    assert.ok(
      err instanceof ChainError,
      `se esperaba ChainError, llegó ${err}`,
    );
    return err.code;
  }
  return assert.fail("se esperaba un rechazo y la escritura fue aceptada");
};

describe("content_hash == sha256(payload)", () => {
  it("rechaza un hash que no corresponde al payload", async () => {
    const writer = createStubChainWriter(
      fakeDb([{ seq: 1, contentHash: bytes(1), terminal: false }]),
    );
    assert.equal(
      await codeOf(() => writer.appendRecord(write({ contentHash: bytes(9) }))),
      "HashMismatch",
    );
  });

  it("rechaza un payload vacio", async () => {
    const writer = createStubChainWriter(fakeDb([]));
    assert.equal(
      await codeOf(() =>
        writer.createChain(
          write({ seq: 1, prevHash: null, canonicalPayload: "" }),
        ),
      ),
      "InvalidPayload",
    );
  });

  it("rechaza un payload por encima de MAX_PAYLOAD_BYTES", async () => {
    const big = `"${"x".repeat(9000)}"`;
    const writer = createStubChainWriter(fakeDb([]));
    assert.equal(
      await codeOf(() =>
        writer.createChain(
          write({
            seq: 1,
            prevHash: null,
            canonicalPayload: big,
            contentHash: sha256(big),
          }),
        ),
      ),
      "InvalidPayload",
    );
  });
});

describe("autoridad sobre la secuencia y encadenado por hash", () => {
  const head = [{ seq: 1, contentHash: bytes(1), terminal: false }];

  it("acepta el seq siguiente con el prev_hash correcto", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    const receipt = await writer.appendRecord(
      write({ seq: 2, prevHash: bytes(1) }),
    );
    assert.match(receipt.txHash, /^stub[0-9a-f]{60}$/);
  });

  it("rechaza un seq adelantado", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    assert.equal(
      await codeOf(() => writer.appendRecord(write({ seq: 3 }))),
      "PrevHashMismatch",
    );
  });

  it("rechaza un seq ya usado", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    assert.equal(
      await codeOf(() => writer.appendRecord(write({ seq: 1 }))),
      "PrevHashMismatch",
    );
  });

  it("rechaza un prev_hash que no es la cabeza", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    assert.equal(
      await codeOf(() =>
        writer.appendRecord(write({ seq: 2, prevHash: bytes(7) })),
      ),
      "PrevHashMismatch",
    );
  });

  it("marca el desfase de seq como reintentable: hay que recalcular, no abandonar", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    try {
      await writer.appendRecord(write({ seq: 5 }));
      assert.fail("se esperaba un rechazo");
    } catch (err) {
      assert.ok(err instanceof ChainError);
      assert.equal(err.retryable, true);
    }
  });
});

describe("create_chain", () => {
  it("crea la cadena del animal en seq 1 sin antecesor", async () => {
    const writer = createStubChainWriter(fakeDb([]));
    const receipt = await writer.createChain(write({ seq: 1, prevHash: null }));
    assert.ok(receipt.ledger > 0n);
  });

  it("rechaza crear una cadena que ya existe", async () => {
    const writer = createStubChainWriter(
      fakeDb([{ seq: 1, contentHash: bytes(1), terminal: false }]),
    );
    assert.equal(
      await codeOf(() => writer.createChain(write({ seq: 1, prevHash: null }))),
      "ChainExists",
    );
  });

  it("rechaza un primer record con antecesor", async () => {
    const writer = createStubChainWriter(fakeDb([]));
    assert.equal(
      await codeOf(() =>
        writer.createChain(write({ seq: 1, prevHash: bytes(1) })),
      ),
      "PrevHashMismatch",
    );
  });

  it("rechaza operar sobre un animal sin cadena", async () => {
    const writer = createStubChainWriter(fakeDb([]));
    assert.equal(
      await codeOf(() => writer.appendRecord(write())),
      "ChainNotFound",
    );
  });
});

describe("los terminales no pasan por append_record", () => {
  const head = [{ seq: 1, contentHash: bytes(1), terminal: false }];

  it("rechaza un terminal via append_record", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    assert.equal(
      await codeOf(() => writer.appendRecord(write({ kind: "terminal" }))),
      "TerminalViaAppend",
    );
  });

  it("rechaza un no-terminal via close_chain", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    assert.equal(
      await codeOf(() => writer.closeChain(write({ kind: "ordinary" }))),
      "TerminalViaAppend",
    );
  });

  it("acepta el terminal via close_chain", async () => {
    const writer = createStubChainWriter(fakeDb(head));
    const receipt = await writer.closeChain(write({ kind: "terminal" }));
    assert.ok(receipt.txHash.startsWith("stub"));
  });
});

describe("politica de cadena cerrada", () => {
  const closed = [
    { seq: 1, contentHash: bytes(1), terminal: false },
    { seq: 2, contentHash: bytes(2), terminal: true },
  ];

  it("rechaza un hito ordinario sobre una cadena cerrada", async () => {
    const writer = createStubChainWriter(fakeDb(closed));
    assert.equal(
      await codeOf(() =>
        writer.appendRecord(write({ seq: 3, prevHash: bytes(2) })),
      ),
      "ChainClosed",
    );
  });

  it("acepta una rectificacion sobre una cadena cerrada", async () => {
    const writer = createStubChainWriter(fakeDb(closed));
    const receipt = await writer.appendRecord(
      write({ seq: 3, prevHash: bytes(2), kind: "rectification" }),
    );
    assert.ok(receipt.txHash.startsWith("stub"));
  });

  it("rechaza un segundo cierre", async () => {
    const writer = createStubChainWriter(fakeDb(closed));
    assert.equal(
      await codeOf(() =>
        writer.closeChain(
          write({ seq: 3, prevHash: bytes(2), kind: "terminal" }),
        ),
      ),
      "ChainClosed",
    );
  });
});
