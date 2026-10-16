/**
 * Codec ULID ↔ `BytesN<16>` (docs/06): el valor de 128 bits del ULID en big-endian, es decir
 * los 26 caracteres de Crockford base32 decodificados a 16 bytes. En la CLI son 32 caracteres
 * hex en minúscula. `animal_id` y `author` usan la misma codificación.
 *
 * Vive del lado de la app porque el contrato solo ve bytes. S4 lo necesita para firmar; S2 lo
 * trae ya probado para que el submitter real no tenga que inventarlo.
 *
 * Se implementa sobre `BigInt` y no sobre un acumulador de bits: un ULID son 128 bits y los
 * operadores de bits de JavaScript trabajan en 32, así que la versión "eficiente" es también
 * la que se equivoca en silencio.
 */

/** Alfabeto Crockford base32 de la spec de ULID: sin I, L, O ni U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const DECODE = new Map<string, bigint>();
for (let i = 0; i < ALPHABET.length; i++) {
  DECODE.set(ALPHABET[i], BigInt(i));
  // Crockford es case-insensitive a la lectura; a la escritura emitimos mayúsculas.
  DECODE.set(ALPHABET[i].toLowerCase(), BigInt(i));
}

const ULID_LENGTH = 26;
const BYTE_LENGTH = 16;
/** 2^128: el valor de un ULID tiene que quedar estrictamente por debajo. */
const MODULUS = 1n << 128n;

export class UlidCodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UlidCodecError";
  }
}

/**
 * ULID (26 caracteres) → 16 bytes big-endian.
 *
 * 26 caracteres de base32 son 130 bits para un valor de 128, así que el primer carácter solo
 * puede llegar hasta `7` (`ALPHABET[7]`): por encima de eso el ULID desborda y no es válido.
 */
export function ulidToBytes(ulid: string): Uint8Array {
  if (ulid.length !== ULID_LENGTH) {
    throw new UlidCodecError(
      `Un ULID tiene ${ULID_LENGTH} caracteres, no ${ulid.length}: ${ulid}`,
    );
  }

  let value = 0n;
  for (const char of ulid) {
    const digit = DECODE.get(char);
    if (digit === undefined) {
      throw new UlidCodecError(
        `Carácter fuera del alfabeto Crockford base32: ${char}`,
      );
    }
    value = value * 32n + digit;
  }

  if (value >= MODULUS) {
    throw new UlidCodecError(
      `ULID desborda 128 bits (el primer carácter no puede pasar de 7): ${ulid}`,
    );
  }

  const out = new Uint8Array(BYTE_LENGTH);
  for (let i = BYTE_LENGTH - 1; i >= 0; i--) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out;
}

/** 16 bytes big-endian → ULID (26 caracteres, mayúsculas). */
export function bytesToUlid(bytes: Uint8Array): string {
  if (bytes.length !== BYTE_LENGTH) {
    throw new UlidCodecError(
      `Se esperaban ${BYTE_LENGTH} bytes, llegaron ${bytes.length}`,
    );
  }

  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);

  let out = "";
  for (let i = 0; i < ULID_LENGTH; i++) {
    out = ALPHABET[Number(value & 31n)] + out;
    value >>= 5n;
  }
  return out;
}

/** Como la CLI de Stellar espera el argumento: 32 caracteres hex en minúscula. */
export function ulidToHex(ulid: string): string {
  return Buffer.from(ulidToBytes(ulid)).toString("hex");
}

export function hexToUlid(hex: string): string {
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
    throw new UlidCodecError(`Se esperaban 32 caracteres hex, llegó: ${hex}`);
  }
  return bytesToUlid(Uint8Array.from(Buffer.from(hex, "hex")));
}
