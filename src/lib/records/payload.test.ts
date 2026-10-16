import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPayload,
  GENESIS_PREV_HASH,
  PayloadTooLargeError,
  SCHEMA_VERSION,
} from "@/lib/records/payload";
import { recordDataSchemas } from "@/lib/records/types";

const base = {
  recordId: "01JR0000000000000000000001",
  animalId: "01JR0000000000000000000002",
  orgId: "01JR0000000000000000000003",
  authorId: "01JR0000000000000000000004",
  occurredAt: new Date("2026-03-04T12:00:00Z"),
  recordedAt: new Date("2026-03-04T12:00:05Z"),
  seq: 2,
  prevHash: new Uint8Array(32).fill(1),
};

describe("campos hasheados", () => {
  it("hashea exactamente los campos de docs/05 y ninguno mas", () => {
    const { canonicalPayload } = buildPayload({
      ...base,
      type: "weighing",
      data: { weight_g: 412000 },
    });
    assert.deepEqual(Object.keys(JSON.parse(canonicalPayload)).sort(), [
      "animal_id",
      "author_id",
      "data",
      "occurred_at",
      "org_id",
      "prev_hash",
      "record_id",
      "recorded_at",
      "schema_version",
      "seq",
      "terminal",
      "type",
    ]);
  });

  it("nunca incluye tx_hash ni ledger, para no crear la dependencia circular", () => {
    const { canonicalPayload } = buildPayload({
      ...base,
      type: "weighing",
      data: { weight_g: 1 },
    });
    assert.doesNotMatch(canonicalPayload, /tx_hash|ledger|status/);
  });

  it("usa schema_version 1 por defecto", () => {
    const { canonicalPayload } = buildPayload({
      ...base,
      type: "weighing",
      data: { weight_g: 1 },
    });
    assert.equal(JSON.parse(canonicalPayload).schema_version, SCHEMA_VERSION);
  });
});

describe("terminal lo decide el tipo, no quien llama", () => {
  it("marca terminal en death y slaughterhouse_delivery", () => {
    for (const type of ["death", "slaughterhouse_delivery"] as const) {
      const built = buildPayload({
        ...base,
        type,
        data: { establishment_label: "Frigorífico X" },
      });
      assert.equal(built.terminal, true);
      assert.equal(JSON.parse(built.canonicalPayload).terminal, true);
    }
  });

  it("no marca terminal en una rectificacion, nunca", () => {
    const built = buildPayload({
      ...base,
      type: "rectification",
      data: {
        rectifies_record_id: "01JR0000000000000000000009",
        reason: "peso mal tipeado",
      },
    });
    assert.equal(built.terminal, false);
  });

  it("no marca terminal en los hitos ordinarios", () => {
    assert.equal(
      buildPayload({ ...base, type: "sale", data: {} }).terminal,
      false,
    );
  });
});

describe("seq y prev_hash", () => {
  it("usa 32 bytes en cero como antecesor del primer record", () => {
    const built = buildPayload({
      ...base,
      seq: 1,
      prevHash: null,
      type: "registration",
      data: { identifier: "1234567890" },
    });
    assert.equal(JSON.parse(built.canonicalPayload).prev_hash, "0".repeat(64));
    assert.deepEqual(GENESIS_PREV_HASH, new Uint8Array(32));
  });

  it("un seq distinto produce un hash distinto: hay que recalcular, no parchear", () => {
    const a = buildPayload({
      ...base,
      seq: 2,
      type: "weighing",
      data: { weight_g: 1 },
    });
    const b = buildPayload({
      ...base,
      seq: 3,
      type: "weighing",
      data: { weight_g: 1 },
    });
    assert.notEqual(
      a.contentHash.toString("hex"),
      b.contentHash.toString("hex"),
    );
  });

  it("un prev_hash distinto produce un hash distinto", () => {
    const a = buildPayload({
      ...base,
      type: "weighing",
      data: { weight_g: 1 },
    });
    const b = buildPayload({
      ...base,
      prevHash: new Uint8Array(32).fill(2),
      type: "weighing",
      data: { weight_g: 1 },
    });
    assert.notEqual(
      a.contentHash.toString("hex"),
      b.contentHash.toString("hex"),
    );
  });
});

describe("recorded_at dentro del hash", () => {
  it("un recorded_at distinto cambia el hash, por eso se fija una sola vez", () => {
    const a = buildPayload({
      ...base,
      type: "weighing",
      data: { weight_g: 1 },
    });
    const b = buildPayload({
      ...base,
      recordedAt: new Date("2026-03-04T12:00:06Z"),
      type: "weighing",
      data: { weight_g: 1 },
    });
    assert.notEqual(
      a.contentHash.toString("hex"),
      b.contentHash.toString("hex"),
    );
  });

  it("dos construcciones identicas dan el mismo hash: reintentar es seguro", () => {
    const a = buildPayload({
      ...base,
      type: "weighing",
      data: { weight_g: 1 },
    });
    const b = buildPayload({
      ...base,
      type: "weighing",
      data: { weight_g: 1 },
    });
    assert.equal(a.contentHash.toString("hex"), b.contentHash.toString("hex"));
    assert.equal(a.canonicalPayload, b.canonicalPayload);
  });
});

describe("tope de 8192 bytes del contrato", () => {
  it("un record realista queda muy por debajo", () => {
    const built = buildPayload({
      ...base,
      type: "vaccination",
      data: {
        product: "Aftosa bivalente",
        dose: "2 ml",
        batch: "L-2026-03",
        route: "sc",
      },
    });
    assert.ok(built.byteLength < 500, `ocupo ${built.byteLength} bytes`);
  });

  it("rechaza un payload que el contrato no aceptaria", () => {
    assert.throws(
      () =>
        buildPayload({
          ...base,
          type: "other",
          data: { description: "x".repeat(9000) },
        }),
      PayloadTooLargeError,
    );
  });
});

describe("esquemas Zod de los once tipos", () => {
  it("define un esquema por tipo", () => {
    assert.equal(Object.keys(recordDataSchemas).length, 11);
  });

  it("ningun tipo acepta un campo de monto", () => {
    for (const [type, schema] of Object.entries(recordDataSchemas)) {
      const keys = Object.keys(
        (schema as { shape: Record<string, unknown> }).shape,
      );
      for (const key of keys) {
        assert.doesNotMatch(
          key,
          /price|precio|amount|monto|cost/i,
          `${type}.${key}`,
        );
      }
    }
  });

  it("weighing exige gramos enteros y rechaza decimales", () => {
    assert.equal(
      recordDataSchemas.weighing.safeParse({ weight_g: 412000 }).success,
      true,
    );
    assert.equal(
      recordDataSchemas.weighing.safeParse({ weight_g: 412.5 }).success,
      false,
    );
  });

  it("registration exige la dieta base", () => {
    const result = recordDataSchemas.registration.safeParse({
      identifier: "032021234567890",
      identifier_kind: "senasa_cii",
      establishment_id: "01JR0000000000000000000005",
      establishment_label: "Est. La Esperanza",
    });
    assert.equal(result.success, false);
  });

  it("recorta el texto libre y rechaza lo que excede el tope", () => {
    assert.equal(
      recordDataSchemas.other.safeParse({ title: "t", description: "d" })
        .success,
      true,
    );
    assert.equal(
      recordDataSchemas.other.safeParse({
        title: "x".repeat(81),
        description: "d",
      }).success,
      false,
    );
  });

  it("sale no tiene campo de precio", () => {
    assert.deepEqual(Object.keys(recordDataSchemas.sale.shape).sort(), [
      "buyer_label",
      "document_ref",
    ]);
  });

  it("rectification exige el record que corrige y el motivo", () => {
    assert.equal(
      recordDataSchemas.rectification.safeParse({ reason: "sin id" }).success,
      false,
    );
    assert.equal(
      recordDataSchemas.rectification.safeParse({
        rectifies_record_id: "01JR0000000000000000000009",
        reason: "peso mal tipeado",
      }).success,
      true,
    );
  });
});
