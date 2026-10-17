// Parseo de cantidades y precios ingresados por el usuario (§6, §12.1). Devuelve el decimal
// normalizado con punto, que Prisma acepta para campos `Decimal`; nunca pasa por `number`.

export type ParseResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

type Limits = {
  scale: number;
  intDigits: number;
  label: string;
  missing: string;
};

const TONS: Limits = {
  scale: 3,
  intDigits: 9,
  label: "La cantidad",
  missing: "Ingresá la cantidad.",
}; // Decimal(12, 3)
const PRICE: Limits = {
  scale: 2,
  intDigits: 12,
  label: "El precio",
  missing: "Ingresá el precio.",
}; // Decimal(14, 2)

/**
 * Acepta "1.234,5" (es-AR) o "1234.5". Con coma, los puntos son separadores de miles.
 * Sin coma, un único punto es el decimal y varios puntos son separadores de miles.
 */
function parseDecimal(
  input: string,
  { scale, intDigits, label, missing }: Limits,
): ParseResult {
  let s = input.trim().replace(/\s/g, "");
  if (s === "") return { ok: false, error: missing };

  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if ((s.match(/\./g) ?? []).length > 1) {
    s = s.replace(/\./g, "");
  }

  const match = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!match) return { ok: false, error: `${label} debe ser un número.` };

  const int = match[1].replace(/^0+(?=\d)/, "");
  const frac = (match[2] ?? "").replace(/0+$/, "");

  if (frac.length > scale) {
    return { ok: false, error: `${label} admite hasta ${scale} decimales.` };
  }
  if (int.length > intDigits) {
    return { ok: false, error: `${label} es demasiado grande.` };
  }
  if (/^0*$/.test(int + frac)) {
    return { ok: false, error: `${label} debe ser mayor que cero.` };
  }

  return { ok: true, value: frac ? `${int}.${frac}` : int };
}

/** Toneladas: > 0, hasta 3 decimales. */
export const parseTons = (s: string) => parseDecimal(s, TONS);

/** ARS por Tn: > 0, hasta 2 decimales. */
export const parsePrice = (s: string) => parseDecimal(s, PRICE);
