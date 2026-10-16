/**
 * Construcción del payload hasheado (docs/05).
 *
 * El payload **es** la superficie pública: si un campo está acá, va a la cadena y hay que
 * asumirlo permanente, inmutable y legible por cualquiera. Por eso este módulo enumera los
 * campos de forma explícita en vez de volcar un objeto: un spread accidental de una fila de
 * PostgreSQL es exactamente cómo un email termina en una cadena pública para siempre.
 *
 * Campos hasheados, exactamente estos:
 *   record_id, animal_id, org_id, type, schema_version, occurred_at, recorded_at,
 *   author_id, seq, prev_hash, terminal, data
 *
 * Excluidos del hash a propósito: `tx_hash`, `ledger` y cualquier estado de PostgreSQL. Eso es
 * lo que evita la dependencia circular — un hash de transacción no puede estar dentro del
 * contenido que produce esa transacción.
 */

import type { RecordType } from "@/generated/prisma/enums";
import { MAX_PAYLOAD_BYTES } from "@/lib/stellar/contract-limits";
import {
  type Bytes,
  type CanonicalValue,
  canonicalByteLength,
  canonicalJson,
  contentHash,
} from "./canonical";
import { isTerminal } from "./types";

export const SCHEMA_VERSION = 1;

export interface PayloadInput {
  recordId: string;
  animalId: string;
  orgId: string;
  authorId: string;
  type: RecordType;
  /** Cuándo pasó el hecho. */
  occurredAt: Date;
  /**
   * Fijado por el servidor una sola vez antes de enviar. **Nunca se re-estampa en un
   * reintento**: está dentro del hash, así que el mismo record lógico hashearía distinto en
   * cada intento (docs/05, consecuencia 1).
   */
  recordedAt: Date;
  /**
   * Lo asigna el contrato. La app lee el header y calcula el payload para `seq = count + 1`;
   * si la vista del contrato avanzó, la transacción se rechaza y el payload se **recalcula**
   * para el nuevo `seq`, nunca se parchea (docs/05, consecuencia 2).
   */
  seq: number;
  /** `null` solo para `seq = 1`, donde no hay antecesor. */
  prevHash: Bytes | null;
  data: Record<string, unknown>;
  schemaVersion?: number;
}

export interface BuiltPayload {
  /** Los bytes exactos que se hashearon, guardados textuales para que todo sea reproducible. */
  canonicalPayload: string;
  contentHash: Bytes;
  byteLength: number;
  seq: number;
  prevHash: Bytes | null;
  terminal: boolean;
}

export class PayloadTooLargeError extends Error {
  constructor(byteLength: number) {
    super(
      `El payload ocupa ${byteLength} bytes y el contrato acepta hasta ${MAX_PAYLOAD_BYTES}. Acortá el texto libre.`,
    );
    this.name = "PayloadTooLargeError";
  }
}

/** El hash de 32 bytes en cero que representa "sin antecesor", para `seq = 1`. */
export const GENESIS_PREV_HASH: Bytes = new Uint8Array(new ArrayBuffer(32));

export function buildPayload(input: PayloadInput): BuiltPayload {
  const terminal = isTerminal(input.type);

  // Enumeración explícita. No agregar un spread acá.
  const payload: Record<string, CanonicalValue> = {
    record_id: input.recordId,
    animal_id: input.animalId,
    org_id: input.orgId,
    author_id: input.authorId,
    type: input.type,
    schema_version: input.schemaVersion ?? SCHEMA_VERSION,
    occurred_at: input.occurredAt,
    recorded_at: input.recordedAt,
    seq: input.seq,
    prev_hash: input.prevHash ?? GENESIS_PREV_HASH,
    terminal,
    data: input.data as CanonicalValue,
  };

  const canonicalPayload = canonicalJson(payload);
  const byteLength = canonicalByteLength(canonicalPayload);
  if (byteLength > MAX_PAYLOAD_BYTES)
    throw new PayloadTooLargeError(byteLength);

  return {
    canonicalPayload,
    contentHash: contentHash(canonicalPayload),
    byteLength,
    seq: input.seq,
    prevHash: input.prevHash,
    terminal,
  };
}
