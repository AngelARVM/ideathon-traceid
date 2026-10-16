/**
 * Normalización laxa de identificadores SENASA (docs/02, R3.3–R3.6).
 *
 * La decisión de fondo: **avisar sin bloquear**. La reglamentación no coincide consigo misma
 * (el CII electrónico son 15 dígitos; la caravana impresa aparece como 9 o 10 en dos bloques)
 * y la identificación obligatoria se termina de implantar durante 2026, así que una regex
 * estricta construida sobre una norma ambigua rechazaría caravanas reales en medio de una demo.
 * Se guarda el valor tal como quedó normalizado más lo que se pudo reconocer, y la UI muestra
 * un badge "formato no reconocido" que no impide guardar.
 *
 * El valor es SIEMPRE `text`: conserva ceros a la izquierda y nunca pasa por un número.
 */

import type { IdentifierKind } from "@/generated/prisma/enums";

/** Prefijo de país de Argentina en el CII (docs/02, R3.4). */
const COUNTRY_CODE = "032";

const MIN_DIGITS = 9;
const MAX_DIGITS = 16;

/** Lo que se le muestra al operador y se guarda en `animal_identifiers.detected_format`. */
export type DetectedFormat =
  | "senasa_cii_15"
  | "senasa_printed_10"
  | "senasa_printed_9"
  | "digits"
  | "internal_tag";

export interface NormalizedIdentifier {
  /** El valor a guardar: dígitos sin separadores, o el texto crudo si es una caravana interna. */
  value: string;
  kind: IdentifierKind;
  detectedFormat: DetectedFormat | null;
  /**
   * Mensaje no bloqueante. Si viene, la UI muestra el badge y guarda igual; nunca es un error
   * de validación.
   */
  warning: string | null;
}

export class IdentifierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentifierError";
  }
}

/** Separadores que se descartan: espacios, guiones, puntos y barras. */
const stripSeparators = (raw: string): string => raw.replace(/[\s.\-/]/g, "");

const FORMATS: Record<number, DetectedFormat | undefined> = {
  15: "senasa_cii_15",
  10: "senasa_printed_10",
  9: "senasa_printed_9",
};

/**
 * Normaliza lo que tipeó el operador. Lanza solo cuando no hay nada que guardar o cuando el
 * valor excede lo que la columna admite; todo lo demás sale como `warning`.
 */
export function normalizeIdentifier(
  raw: string,
  options: { kind?: IdentifierKind } = {},
): NormalizedIdentifier {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new IdentifierError("Ingresá un identificador.");
  }

  // Caravana interna: se declara explícitamente y se guarda tal cual, sin reglas de dígitos.
  if (options.kind === "internal_tag") {
    if (trimmed.length > 64) {
      throw new IdentifierError(
        "La caravana interna no puede superar los 64 caracteres.",
      );
    }
    return {
      value: trimmed,
      kind: "internal_tag",
      detectedFormat: "internal_tag",
      warning: null,
    };
  }

  const digits = stripSeparators(trimmed);

  if (!/^\d+$/.test(digits)) {
    // No es numérico: se acepta como caravana interna en vez de rechazarse.
    if (trimmed.length > 64) {
      throw new IdentifierError(
        "El identificador no puede superar los 64 caracteres.",
      );
    }
    return {
      value: trimmed,
      kind: "internal_tag",
      detectedFormat: null,
      warning:
        "Formato no reconocido: se guarda como caravana interna, no como identificador oficial.",
    };
  }

  if (digits.length > MAX_DIGITS) {
    throw new IdentifierError(
      `Un identificador oficial no supera los ${MAX_DIGITS} dígitos (ingresaste ${digits.length}).`,
    );
  }

  const detectedFormat = FORMATS[digits.length];

  // El CII de 15 dígitos es el único formato que se puede afirmar: país 032 + especie + individuo.
  if (detectedFormat === "senasa_cii_15") {
    if (digits.startsWith(COUNTRY_CODE)) {
      return {
        value: digits,
        kind: "senasa_cii",
        detectedFormat,
        warning: null,
      };
    }
    return {
      value: digits,
      kind: "senasa_cii",
      detectedFormat,
      warning: `Tiene 15 dígitos pero no empieza con el código de país ${COUNTRY_CODE}. Se guarda igual; verificá la caravana.`,
    };
  }

  if (
    detectedFormat === "senasa_printed_10" ||
    detectedFormat === "senasa_printed_9"
  ) {
    return {
      value: digits,
      kind: "senasa_printed",
      detectedFormat,
      warning: null,
    };
  }

  if (digits.length < MIN_DIGITS) {
    return {
      value: digits,
      kind: "unknown_format",
      detectedFormat: "digits",
      warning: `Formato no reconocido: tiene ${digits.length} dígitos y se esperaban al menos ${MIN_DIGITS}. Se guarda igual.`,
    };
  }

  return {
    value: digits,
    kind: "unknown_format",
    detectedFormat: "digits",
    warning: `Formato no reconocido: ${digits.length} dígitos no coinciden con el CII de 15 ni con la caravana impresa de 9 o 10. Se guarda igual.`,
  };
}

/**
 * Normaliza un término de búsqueda al mismo criterio con que se guardó, para que tipear
 * "032 02 1234567890" encuentre lo que se guardó como "032021234567890".
 */
export function normalizeSearchTerm(raw: string): string {
  const trimmed = raw.trim();
  const digits = stripSeparators(trimmed);
  return /^\d+$/.test(digits) ? digits : trimmed;
}

/** Etiqueta en español del formato detectado, para la UI. */
export const DETECTED_FORMAT_LABELS: Record<DetectedFormat, string> = {
  senasa_cii_15: "CII SENASA (15 dígitos)",
  senasa_printed_10: "Caravana impresa (10 dígitos)",
  senasa_printed_9: "Caravana impresa (9 dígitos)",
  digits: "Numérico, formato no reconocido",
  internal_tag: "Caravana interna",
};
