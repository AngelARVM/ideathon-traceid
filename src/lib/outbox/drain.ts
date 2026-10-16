/**
 * El drainer (docs/04, D3; docs/08, S2–S4).
 *
 * La lógica vive acá y su invocación en `scripts/drain.ts`, a propósito: en S2 se corre a mano,
 * y lo que cambie en S4 es el `ChainWriter` que se le pasa, no este ciclo de vida.
 *
 * Sin `server-only`: lo usa también `scripts/drain.ts`, que corre fuera de Next, y por eso
 * recibe el cliente de Prisma en vez de importarlo.
 *
 * Es **un solo escritor**: serializa los envíos por animal de forma natural y es lo que
 * mantiene el `prev_hash` encadenado sin coordinación extra. Correr dos drainers en paralelo
 * rompería esa propiedad; el `record_id` único del outbox evita el doble envío, no la carrera.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import type { SubmissionStatus } from "@/generated/prisma/enums";
import { type Bytes, bytesToHex } from "@/lib/records/canonical";
import { recordKind } from "@/lib/records/types";
import { ChainError, type ChainWrite, type ChainWriter } from "./chain-writer";
import { createStubChainWriter } from "./stub-writer";

/** Reintentos con backoff acotado: 1 min, 4 min, 9 min... y después se da por `failed`. */
const MAX_ATTEMPTS = 5;
const backoffMs = (attempts: number) => attempts ** 2 * 60_000;

export interface DrainOptions {
  db: PrismaClient;
  writer?: ChainWriter;
  /** Cuántas filas procesar como máximo en una corrida. */
  limit?: number;
  onLog?: (line: string) => void;
}

export interface DrainResult {
  confirmed: number;
  failed: number;
  retried: number;
  /** Filas que se saltearon porque su backoff todavía no venció. */
  skipped: number;
}

const toBytes = (value: Uint8Array): Bytes => {
  const out = new Uint8Array(new ArrayBuffer(value.byteLength));
  out.set(value);
  return out;
};

/**
 * Drena el outbox una vez. Procesa en orden de creación, que dentro de un animal coincide con
 * el orden de `seq`: el record 3 no se puede enviar antes que el 2 porque su `prev_hash`
 * depende de él.
 */
export async function drainOutbox(options: DrainOptions): Promise<DrainResult> {
  const { db } = options;
  const writer = options.writer ?? createStubChainWriter(db);
  const log = options.onLog ?? (() => {});
  const result: DrainResult = {
    confirmed: 0,
    failed: 0,
    retried: 0,
    skipped: 0,
  };

  const rows = await db.outbox.findMany({
    where: { status: { in: ["pending", "submitted"] } },
    orderBy: { createdAt: "asc" },
    take: options.limit ?? 100,
    include: {
      record: {
        select: {
          recordId: true,
          animalId: true,
          type: true,
          seq: true,
          prevHash: true,
          contentHash: true,
          canonicalPayload: true,
          authorId: true,
        },
      },
    },
  });

  log(`${rows.length} fila(s) en el outbox. Escritor: ${writer.label}.`);
  const now = Date.now();

  for (const row of rows) {
    if (row.nextAttemptAt.getTime() > now) {
      result.skipped++;
      continue;
    }

    const record = row.record;
    const kind = recordKind(record.type);
    const write: ChainWrite = {
      animalId: record.animalId,
      // Sin `seq` no hay nada que enviar; el insert siempre lo asigna (ver lib/records/write.ts).
      seq: record.seq ?? 0,
      contentHash: toBytes(record.contentHash),
      prevHash: record.prevHash ? toBytes(record.prevHash) : null,
      canonicalPayload: record.canonicalPayload,
      authorId: record.authorId,
      kind,
    };

    // `submitted` se marca ANTES de llamar a la cadena: si el proceso muere acá, la fila queda
    // en un estado que dice "puede haber salido", y el script `reconcile` de S6 es el que
    // decide leyendo la cadena. Marcar después sería perder esa distinción.
    await db.outbox.update({
      where: { id: row.id },
      data: {
        status: "submitted",
        attempts: { increment: 1 },
        submittedAt: row.submittedAt ?? new Date(),
      },
    });
    await db.record.update({
      where: { recordId: record.recordId },
      data: { status: "submitted" },
    });

    try {
      const receipt = await submit(writer, write);

      // Liquidación: la fila del outbox y la del record, juntas.
      await db.$transaction([
        db.record.update({
          where: { recordId: record.recordId },
          data: {
            status: "confirmed",
            // Metadata de transacción: se persiste y NUNCA se hashea (docs/05).
            txHash: receipt.txHash,
            ledger: receipt.ledger,
          },
        }),
        db.outbox.update({
          where: { id: row.id },
          data: { status: "confirmed", settledAt: new Date(), lastError: null },
        }),
      ]);

      result.confirmed++;
      log(
        `✓ ${record.type} seq ${write.seq} de ${record.animalId} → ${bytesToHex(write.contentHash).slice(0, 12)}…`,
      );
    } catch (err) {
      const attempts = row.attempts + 1;
      const chainError = err instanceof ChainError ? err : null;
      const message = err instanceof Error ? err.message : String(err);

      // Un error no reintentable, o agotados los intentos, queda `failed`. Una fila `failed`
      // es re-enviable, pero bajo un `seq` NUEVO (docs/08, S6): el payload hay que recalcularlo.
      const giveUp =
        attempts >= MAX_ATTEMPTS || chainError?.retryable === false;
      const status: SubmissionStatus = giveUp ? "failed" : "pending";

      await db.$transaction([
        db.record.update({
          where: { recordId: record.recordId },
          data: { status },
        }),
        db.outbox.update({
          where: { id: row.id },
          data: {
            status,
            lastError: message.slice(0, 500),
            nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
            ...(giveUp ? { settledAt: new Date() } : {}),
          },
        }),
      ]);

      if (giveUp) result.failed++;
      else result.retried++;
      log(
        `✗ ${record.type} seq ${write.seq} de ${record.animalId}: ${message}`,
      );
    }
  }

  return result;
}

/** Enruta al entry point que corresponde. El contrato no acepta cualquiera para cualquier cosa. */
function submit(writer: ChainWriter, write: ChainWrite) {
  if (write.seq === 1) return writer.createChain(write);
  if (write.kind === "terminal") return writer.closeChain(write);
  return writer.appendRecord(write);
}
