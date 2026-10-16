import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IdentifierError,
  normalizeIdentifier,
  normalizeSearchTerm,
} from "@/lib/identifiers";

describe("normalizacion laxa", () => {
  it("descarta espacios, guiones, puntos y barras", () => {
    for (const raw of [
      "032 02 1234567890",
      "032-02-1234567890",
      "032.02.1234567890",
      "032/02/1234567890",
    ]) {
      assert.equal(normalizeIdentifier(raw).value, "032021234567890");
    }
  });

  it("conserva los ceros a la izquierda", () => {
    assert.equal(normalizeIdentifier("000123456").value, "000123456");
  });

  it("nunca pasa por un numero: 16 digitos sobreviven intactos", () => {
    const raw = "0320212345678901";
    assert.equal(normalizeIdentifier(raw).value, raw);
  });

  it("recorta los espacios de los extremos", () => {
    assert.equal(
      normalizeIdentifier("  032021234567890  ").value,
      "032021234567890",
    );
  });
});

describe("formatos reconocidos", () => {
  it("reconoce el CII de 15 digitos con prefijo 032 y no avisa nada", () => {
    const r = normalizeIdentifier("032021234567890");
    assert.equal(r.kind, "senasa_cii");
    assert.equal(r.detectedFormat, "senasa_cii_15");
    assert.equal(r.warning, null);
  });

  it("reconoce la caravana impresa de 10 digitos", () => {
    const r = normalizeIdentifier("1234567890");
    assert.equal(r.kind, "senasa_printed");
    assert.equal(r.detectedFormat, "senasa_printed_10");
    assert.equal(r.warning, null);
  });

  it("reconoce la caravana impresa de 9 digitos", () => {
    const r = normalizeIdentifier("123456789");
    assert.equal(r.kind, "senasa_printed");
    assert.equal(r.detectedFormat, "senasa_printed_9");
    assert.equal(r.warning, null);
  });
});

describe("avisa sin bloquear (R3.4)", () => {
  it("15 digitos sin el prefijo de pais: avisa pero guarda y sigue siendo CII", () => {
    const r = normalizeIdentifier("999021234567890");
    assert.equal(r.kind, "senasa_cii");
    assert.equal(r.detectedFormat, "senasa_cii_15");
    assert.match(r.warning ?? "", /código de país 032/);
    assert.equal(r.value, "999021234567890");
  });

  it("un largo intermedio no reconocido se guarda con aviso", () => {
    const r = normalizeIdentifier("123456789012");
    assert.equal(r.kind, "unknown_format");
    assert.equal(r.detectedFormat, "digits");
    assert.match(r.warning ?? "", /Formato no reconocido/);
    assert.equal(r.value, "123456789012");
  });

  it("menos de 9 digitos se guarda con aviso, no se rechaza", () => {
    const r = normalizeIdentifier("12345");
    assert.equal(r.value, "12345");
    assert.match(r.warning ?? "", /al menos 9/);
  });

  it("un valor no numerico cae a caravana interna con aviso", () => {
    const r = normalizeIdentifier("ABC-123");
    assert.equal(r.kind, "internal_tag");
    assert.equal(r.detectedFormat, null);
    assert.match(r.warning ?? "", /caravana interna/);
    assert.equal(r.value, "ABC-123");
  });
});

describe("caravana interna declarada", () => {
  it("se guarda tal cual, sin reglas de digitos ni aviso", () => {
    const r = normalizeIdentifier("Rodeo norte 14", { kind: "internal_tag" });
    assert.equal(r.kind, "internal_tag");
    assert.equal(r.value, "Rodeo norte 14");
    assert.equal(r.warning, null);
  });
});

describe("los unicos rechazos", () => {
  it("rechaza un valor vacio", () => {
    assert.throws(() => normalizeIdentifier("   "), IdentifierError);
  });

  it("rechaza mas de 16 digitos", () => {
    assert.throws(() => normalizeIdentifier("1".repeat(17)), IdentifierError);
  });

  it("rechaza un texto desmedido", () => {
    assert.throws(() => normalizeIdentifier("x".repeat(65)), IdentifierError);
    assert.throws(
      () => normalizeIdentifier("x".repeat(65), { kind: "internal_tag" }),
      IdentifierError,
    );
  });
});

describe("termino de busqueda", () => {
  it("normaliza igual que el guardado, para que la busqueda con separadores encuentre", () => {
    assert.equal(normalizeSearchTerm("032 02 1234567890"), "032021234567890");
    assert.equal(normalizeSearchTerm(" 1234-5678 "), "12345678");
  });

  it("deja el texto libre intacto", () => {
    assert.equal(normalizeSearchTerm(" Rodeo norte "), "Rodeo norte");
  });
});
