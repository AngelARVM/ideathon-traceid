// Formato propio de M3. Los timestamps (`createdAt`, `confirmedAt`) se muestran en hora
// argentina; `formatDate` de §12.1 usa UTC porque está pensado para columnas `@db.Date`.

const dateTime = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

/** "17/10/2026, 14:05" */
export const formatDateTime = (d: Date | string) =>
  dateTime.format(new Date(d));

/** Número corto y legible de un id ulid: sus últimos 8 caracteres. */
export const shortId = (id: string) => id.slice(-8).toUpperCase();
