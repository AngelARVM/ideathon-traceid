import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ulid } from "ulid";
import {
  bytesToUlid,
  hexToUlid,
  UlidCodecError,
  ulidToBytes,
  ulidToHex,
} from "@/lib/chain/ulid-bytes";

describe("codec ULID ↔ BytesN<16>", () => {
  it("round-trip sobre ULIDs reales generados por la libreria", () => {
    for (let i = 0; i < 2000; i++) {
      const id = ulid();
      assert.equal(bytesToUlid(ulidToBytes(id)), id);
    }
  });

  it("round-trip en la direccion bytes → ULID → bytes", () => {
    for (let i = 0; i < 500; i++) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      // El primer carácter no puede pasar de 7, lo que limita los 2 bits altos del byte 0.
      bytes[0] &= 0x7f;
      assert.deepEqual(ulidToBytes(bytesToUlid(bytes)), bytes);
    }
  });

  it("codifica siempre a 16 bytes", () => {
    assert.equal(ulidToBytes(ulid()).length, 16);
  });

  it("mapea el ULID minimo a 16 bytes en cero", () => {
    assert.deepEqual(ulidToBytes("0".repeat(26)), new Uint8Array(16));
    assert.equal(bytesToUlid(new Uint8Array(16)), "0".repeat(26));
  });

  it("mapea el ULID maximo a 16 bytes en 0xff", () => {
    const max = "7ZZZZZZZZZZZZZZZZZZZZZZZZZ";
    assert.deepEqual(ulidToBytes(max), new Uint8Array(16).fill(0xff));
    assert.equal(bytesToUlid(new Uint8Array(16).fill(0xff)), max);
  });

  it("es big-endian: el byte final es el menos significativo", () => {
    const bytes = ulidToBytes("00000000000000000000000001");
    assert.equal(bytes[15], 1);
    assert.deepEqual(bytes.slice(0, 15), new Uint8Array(15));
  });

  it("acepta minusculas y normaliza a mayusculas", () => {
    const id = ulid();
    assert.equal(bytesToUlid(ulidToBytes(id.toLowerCase())), id);
  });
});

describe("codec hex para la CLI", () => {
  it("produce 32 caracteres hex en minuscula", () => {
    const hex = ulidToHex(ulid());
    assert.match(hex, /^[0-9a-f]{32}$/);
  });

  it("round-trip via hex", () => {
    const id = ulid();
    assert.equal(hexToUlid(ulidToHex(id)), id);
  });

  it("vector fijo contra el valor que se le pasa al contrato", () => {
    assert.equal(
      ulidToHex("01JR0000000000000000000001"),
      "01960000000000000000000000000001",
    );
  });
});

describe("rechazos", () => {
  it("rechaza una longitud distinta de 26", () => {
    assert.throws(() => ulidToBytes("0123"), UlidCodecError);
    assert.throws(() => ulidToBytes("0".repeat(27)), UlidCodecError);
  });

  it("rechaza los caracteres excluidos de Crockford (I, L, O, U)", () => {
    for (const bad of ["I", "L", "O", "U"]) {
      assert.throws(
        () => ulidToBytes(`0${bad}${"0".repeat(24)}`),
        UlidCodecError,
      );
    }
  });

  it("rechaza un ULID que desborda 128 bits", () => {
    assert.throws(() => ulidToBytes(`8${"0".repeat(25)}`), UlidCodecError);
    assert.throws(() => ulidToBytes("Z".repeat(26)), UlidCodecError);
  });

  it("rechaza un largo de bytes incorrecto", () => {
    assert.throws(() => bytesToUlid(new Uint8Array(15)), UlidCodecError);
  });

  it("rechaza hex malformado", () => {
    assert.throws(() => hexToUlid("abc"), UlidCodecError);
    assert.throws(() => hexToUlid("z".repeat(32)), UlidCodecError);
  });
});
