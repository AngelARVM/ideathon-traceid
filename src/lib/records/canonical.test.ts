// El suite de mayor valor del proyecto (docs/08, S2): si la serialización deja de ser
// determinista, la verificación de integridad miente.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import {
  CanonicalizationError,
  canonicalByteLength,
  canonicalJson,
  contentHashHex,
  toCanonicalBytes,
  toCanonicalTimestamp,
} from "@/lib/records/canonical";

describe("canonicalJson — orden de claves", () => {
  it("ordena las claves lexicograficamente por code point", () => {
    assert.equal(canonicalJson({ b: 1, a: 2, C: 3 }), '{"C":3,"a":2,"b":1}');
  });

  it("ordena en todos los niveles, no solo en la raiz", () => {
    assert.equal(
      canonicalJson({ z: { d: 1, b: { y: 1, x: 2 } }, a: 3 }),
      '{"a":3,"z":{"b":{"x":2,"y":1},"d":1}}',
    );
  });

  it("produce la misma salida sin importar el orden de insercion", () => {
    const a = canonicalJson({ type: "weighing", animal_id: "A", seq: 2 });
    const b = canonicalJson({ seq: 2, animal_id: "A", type: "weighing" });
    assert.equal(a, b);
  });

  it("ordena por code point, no por locale", () => {
    // Con `localeCompare` en es-AR, "a" < "B"; por code point, "B" (0x42) < "a" (0x61).
    assert.equal(canonicalJson({ a: 1, B: 2 }), '{"B":2,"a":1}');
  });
});

describe("canonicalJson — nulos omitidos", () => {
  it("omite los campos null y undefined", () => {
    assert.equal(
      canonicalJson({ a: 1, b: null, c: undefined, d: 2 }),
      '{"a":1,"d":2}',
    );
  });

  it("un opcional ausente y un opcional null serializan igual", () => {
    assert.equal(canonicalJson({ a: 1, b: null }), canonicalJson({ a: 1 }));
  });

  it("omite tambien en objetos anidados", () => {
    assert.equal(
      canonicalJson({ data: { x: 1, y: null } }),
      '{"data":{"x":1}}',
    );
  });

  it("rechaza un null dentro de un array, que no tiene representacion unica", () => {
    assert.throws(
      () => canonicalJson({ xs: [1, null, 2] }),
      CanonicalizationError,
    );
  });

  it("distingue un objeto vacio de un campo omitido", () => {
    assert.equal(canonicalJson({ a: {} }), '{"a":{}}');
  });
});

describe("canonicalJson — sin punto flotante", () => {
  it("rechaza un decimal", () => {
    assert.throws(() => canonicalJson({ weight: 72.5 }), CanonicalizationError);
  });

  it("rechaza NaN e Infinity", () => {
    assert.throws(
      () => canonicalJson({ x: Number.NaN }),
      CanonicalizationError,
    );
    assert.throws(
      () => canonicalJson({ x: Number.POSITIVE_INFINITY }),
      CanonicalizationError,
    );
  });

  it("rechaza enteros fuera del rango seguro", () => {
    assert.throws(() => canonicalJson({ x: 2 ** 53 }), CanonicalizationError);
  });

  it("acepta el entero en unidad base y el string decimal", () => {
    assert.equal(canonicalJson({ weight_g: 72500 }), '{"weight_g":72500}');
    assert.equal(canonicalJson({ dose: "5.5" }), '{"dose":"5.5"}');
  });

  it("serializa el cero y los negativos sin signo redundante", () => {
    assert.equal(canonicalJson({ a: 0, b: -0, c: -7 }), '{"a":0,"b":0,"c":-7}');
  });
});

describe("timestamps", () => {
  it("serializa en UTC con Z y precision de segundos", () => {
    assert.equal(
      toCanonicalTimestamp(new Date("2026-03-04T12:34:56.789Z")),
      "2026-03-04T12:34:56Z",
    );
  });

  it("normaliza un offset a UTC", () => {
    assert.equal(
      toCanonicalTimestamp(new Date("2026-03-04T09:34:56-03:00")),
      "2026-03-04T12:34:56Z",
    );
  });

  it("dos instantes con el mismo segundo y distinto offset serializan igual", () => {
    assert.equal(
      toCanonicalTimestamp(new Date("2026-03-04T12:34:56Z")),
      toCanonicalTimestamp(new Date("2026-03-04T14:34:56+02:00")),
    );
  });

  it("serializa un Date embebido en el payload", () => {
    assert.equal(
      canonicalJson({ occurred_at: new Date("2026-01-01T00:00:00.500Z") }),
      '{"occurred_at":"2026-01-01T00:00:00Z"}',
    );
  });

  it("rechaza una fecha invalida", () => {
    assert.throws(
      () => canonicalJson({ at: new Date("no") }),
      CanonicalizationError,
    );
  });
});

describe("bytes", () => {
  it("serializa bytes como hex minuscula", () => {
    assert.equal(
      toCanonicalBytes(Uint8Array.from([0x0a, 0xff, 0x00])),
      "0aff00",
    );
  });

  it("serializa un prev_hash embebido como string hex", () => {
    const hash = new Uint8Array(32).fill(0xab);
    assert.equal(
      canonicalJson({ prev_hash: hash }),
      `{"prev_hash":"${"ab".repeat(32)}"}`,
    );
  });
});

describe("escapes y unicode", () => {
  it("escapa comillas y barras invertidas", () => {
    assert.equal(canonicalJson({ t: 'a"b\\c' }), '{"t":"a\\"b\\\\c"}');
  });

  it("conserva acentos y enies sin escapar", () => {
    assert.equal(canonicalJson({ t: "Ñandú" }), '{"t":"Ñandú"}');
  });

  it("cuenta los bytes UTF-8, no los code units", () => {
    assert.equal(
      canonicalByteLength(canonicalJson({ t: "ñ" })),
      '{"t":"ñ"}'.length + 1,
    );
  });
});

describe("contentHash", () => {
  it("es sha256 del payload canonico", () => {
    const payload = canonicalJson({ a: 1 });
    assert.equal(
      contentHashHex(payload),
      createHash("sha256").update(payload).digest("hex"),
    );
  });

  it("es estable para un payload de record completo", () => {
    // Vector fijo: si este valor cambia, cambió la serializacion y la verificacion se rompe.
    const payload = canonicalJson({
      record_id: "01JR0000000000000000000001",
      animal_id: "01JR0000000000000000000002",
      org_id: "01JR0000000000000000000003",
      author_id: "01JR0000000000000000000004",
      type: "weighing",
      schema_version: 1,
      occurred_at: new Date("2026-03-04T12:00:00Z"),
      recorded_at: new Date("2026-03-04T12:00:05Z"),
      seq: 2,
      prev_hash: new Uint8Array(32).fill(1),
      terminal: false,
      data: { weight_g: 412000, method: "scale" },
    });
    assert.equal(
      payload,
      '{"animal_id":"01JR0000000000000000000002","author_id":"01JR0000000000000000000004",' +
        '"data":{"method":"scale","weight_g":412000},"occurred_at":"2026-03-04T12:00:00Z",' +
        `"org_id":"01JR0000000000000000000003","prev_hash":"${"01".repeat(32)}",` +
        '"record_id":"01JR0000000000000000000001","recorded_at":"2026-03-04T12:00:05Z",' +
        '"schema_version":1,"seq":2,"terminal":false,"type":"weighing"}',
    );
    // Vector de hash fijado: no se recalcula, se compara contra una constante.
    assert.equal(
      contentHashHex(payload),
      "587201f170441c9374fbd425d5cb6dcce890fd6fca41d4ce28c2ad2bb58c19eb",
    );
  });

  it("un cambio de un bit en el payload cambia el hash", () => {
    assert.notEqual(
      contentHashHex(canonicalJson({ seq: 1 })),
      contentHashHex(canonicalJson({ seq: 2 })),
    );
  });

  it("dos ordenes de insercion producen el mismo hash", () => {
    assert.equal(
      contentHashHex(canonicalJson({ b: 1, a: 2 })),
      contentHashHex(canonicalJson({ a: 2, b: 1 })),
    );
  });
});
