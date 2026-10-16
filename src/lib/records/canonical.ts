/**
 * Serialización canónica y `content_hash` (docs/05).
 *
 * Esta es la pieza de la que depende toda la verificación: si dos runtimes serializan el
 * mismo payload con un byte de diferencia, la integridad de ese record queda roto para
 * siempre y no hay forma de arreglarlo, porque el hash ya está en una cadena inmutable.
 * De ahí que acá se prefiera *fallar* antes que adivinar: un float, un `NaN`, una fecha
 * con milisegundos o un `null` dentro de un array lanzan en vez de serializarse.
 */

import { createHash } from "node:crypto";

export type CanonicalValue =
  | string
  | number
  | boolean
  | Date
  | Uint8Array
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue | null | undefined }
  | null
  | undefined;

/**
 * Bytes respaldados por un `ArrayBuffer` propio. El tipo explícito existe porque es lo que
 * piden las columnas `Bytes` de Prisma: un `Buffer` de Node no califica, su respaldo puede ser
 * un `SharedArrayBuffer`.
 */
export type Bytes = Uint8Array<ArrayBuffer>;

export class CanonicalizationError extends Error {
  readonly path: string;

  constructor(message: string, path: string) {
    super(`${message} (en \`${path || "<raíz>"}\`)`);
    this.name = "CanonicalizationError";
    this.path = path;
  }
}

/** RFC 3339 en UTC con sufijo `Z` y precisión de segundos. */
export function toCanonicalTimestamp(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new CanonicalizationError("Fecha inválida", "");
  }
  return `${value.toISOString().slice(0, 19)}Z`;
}

/** Bytes como hex minúscula. */
export function toCanonicalBytes(value: Uint8Array): string {
  return Buffer.from(value).toString("hex");
}

const describe = (value: unknown): string =>
  value === null ? "null" : Array.isArray(value) ? "array" : typeof value;

function encode(value: CanonicalValue, path: string): string {
  if (value === null || value === undefined) {
    // Los nulos se omiten en objetos; llegar acá significa un null en un array o en la raíz,
    // que no tiene una representación única.
    throw new CanonicalizationError(
      "`null` solo puede omitirse dentro de un objeto, no serializarse",
      path,
    );
  }

  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";

  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new CanonicalizationError(
        "Sin punto flotante: usá un entero en unidad base (gramos) o un string decimal",
        path,
      );
    }
    if (!Number.isSafeInteger(value)) {
      throw new CanonicalizationError("Entero fuera del rango seguro", path);
    }
    return String(value);
  }

  if (value instanceof Date) return JSON.stringify(toCanonicalTimestamp(value));
  if (value instanceof Uint8Array)
    return JSON.stringify(toCanonicalBytes(value));

  if (Array.isArray(value)) {
    return `[${value.map((item, i) => encode(item, `${path}[${i}]`)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, CanonicalValue>)
      // Los campos ausentes se omiten, para que un opcional tenga una sola representación.
      .filter(([, v]) => v !== null && v !== undefined)
      // Orden lexicográfico por code point de Unicode, en todos los niveles.
      // `Array#sort` sin comparador ya ordena por unidades UTF-16; se compara explícito
      // para no depender de ese detalle.
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

    const body = entries
      .map(
        ([k, v]) =>
          `${JSON.stringify(k)}:${encode(v, path ? `${path}.${k}` : k)}`,
      )
      .join(",");
    return `{${body}}`;
  }

  throw new CanonicalizationError(
    `Tipo no serializable: ${describe(value)}`,
    path,
  );
}

/** JSON canónico: UTF-8, sin espacios, claves ordenadas, sin floats, nulos omitidos. */
export function canonicalJson(
  payload: Record<string, CanonicalValue | null | undefined>,
): string {
  return encode(payload, "");
}

/**
 * `sha256(canonical_json(payload))`.
 *
 * Devuelve `Uint8Array` y no `Buffer` porque es lo que esperan tanto las columnas `Bytes` de
 * Prisma como `BytesN<32>` del contrato.
 */
export function contentHash(canonicalPayload: string): Bytes {
  const digest = createHash("sha256").update(canonicalPayload, "utf8").digest();
  const out = new Uint8Array(new ArrayBuffer(digest.byteLength));
  out.set(digest);
  return out;
}

export function contentHashHex(canonicalPayload: string): string {
  return bytesToHex(contentHash(canonicalPayload));
}

/** Hex minúscula, el formato en el que los hashes se muestran y se pasan a la CLI. */
export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/** Los bytes que realmente se envían al contrato, para medirlos contra `MAX_PAYLOAD_BYTES`. */
export function canonicalByteLength(canonicalPayload: string): number {
  return Buffer.byteLength(canonicalPayload, "utf8");
}
