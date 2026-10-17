// Formato de la UI en locale es-AR (§12.1). Los montos se formatean desde su string decimal:
// `Intl.NumberFormat` acepta strings sin pasar por float, así que no hay `toFixed` ni redondeos de JS.

/** `Prisma.Decimal`, o un decimal ya serializado. */
export type DecimalLike = { toString(): string } | string | number;

const tons = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 });
const money = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const integer = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  // Las fechas son `@db.Date`: llegan como medianoche UTC.
  timeZone: "UTC",
});

// `format` acepta strings decimales (Intl.NumberFormat v3); los tipos de TS todavía no.
const fmt = (f: Intl.NumberFormat, d: DecimalLike) =>
  f.format(String(d) as unknown as number);

/** "650 Tn" */
export const formatTons = (d: DecimalLike) => `${fmt(tons, d)} Tn`;

/** "$ 28.500" */
export const formatArs = (d: DecimalLike) => `$ ${fmt(money, d)}`;

/** "$ 28.500/Tn" */
export const formatArsPerTon = (d: DecimalLike) => `${formatArs(d)}/Tn`;

/** "≈ 120 km" */
export const formatKm = (n: number) => `≈ ${integer.format(n)} km`;

/** "01/05/2027" */
export const formatDate = (d: Date | string) => date.format(new Date(d));
