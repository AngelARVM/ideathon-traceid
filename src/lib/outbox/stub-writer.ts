/**
 * El escritor stub de S2: confirma sin tocar Hedera (docs/08).
 *
 * No es un `return true`. Reimplementa las cinco invariantes estructurales del contrato
 * contra una cadena derivada de las filas ya confirmadas en PostgreSQL, y rechaza con los
 * mismos códigos de error que el contrato Solidity. Eso es lo que hace que valga la pena: el ciclo de vida
 * `pending → submitted → confirmed → failed`, la lógica de encadenado y la idempotencia quedan
 * ejercitados antes de que exista una sola llamada a Hedera, y en S4 el único cambio es de
 * quién verifica.
 */

import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { MAX_PAYLOAD_BYTES } from "@/lib/chain/contract-limits";
import { type Bytes, bytesToHex } from "@/lib/records/canonical";
import {
  ChainError,
  type ChainHeader,
  type ChainReceipt,
  type ChainWrite,
  type ChainWriter,
} from "./chain-writer";

const toBytes = (value: Uint8Array): Bytes => {
  const out = new Uint8Array(new ArrayBuffer(value.byteLength));
  out.set(value);
  return out;
};

/**
 * El header, derivado de lo que ya está `confirmed`. El contrato real lo lee de su storage;
 * acá la fuente equivalente son las filas que el propio drainer confirmó.
 */
async function readHeader(
  db: PrismaClient,
  animalId: string,
): Promise<ChainHeader | null> {
  const confirmed = await db.record.findMany({
    where: { animalId, status: "confirmed" },
    select: { seq: true, contentHash: true, terminal: true },
    orderBy: { seq: "desc" },
    take: 1,
  });

  if (confirmed.length === 0) {
    // Sin filas confirmadas no hay cadena; que el animal exista en PostgreSQL es irrelevante,
    // igual que para el contrato.
    return null;
  }

  const head = confirmed[0];
  const closed = await db.record.count({
    where: { animalId, status: "confirmed", terminal: true },
  });

  return {
    count: head.seq ?? 0,
    lastHash: head.contentHash ? toBytes(head.contentHash) : null,
    closed: closed > 0,
  };
}

/** Las validaciones que el contrato hace en todo camino de escritura. */
function assertPayload(write: ChainWrite): void {
  const bytes = Buffer.byteLength(write.canonicalPayload, "utf8");
  if (bytes === 0 || bytes > MAX_PAYLOAD_BYTES) {
    throw new ChainError("InvalidPayload", `El payload ocupa ${bytes} bytes.`);
  }

  // `content_hash == sha256(payload)`: el contrato lo verifica él mismo y no confía en quien
  // llama, así que el stub tampoco.
  const expected = createHash("sha256")
    .update(write.canonicalPayload, "utf8")
    .digest("hex");
  if (bytesToHex(write.contentHash) !== expected) {
    throw new ChainError(
      "HashMismatch",
      "El content_hash no es el sha256 del payload.",
    );
  }
}

function assertLinkage(write: ChainWrite, header: ChainHeader): void {
  // Autoridad sobre la secuencia: el próximo seq es `count + 1` y nada más.
  if (write.seq !== header.count + 1) {
    throw new ChainError(
      "PrevHashMismatch",
      `La cadena está en ${header.count}, el record trae seq ${write.seq}. Hay que recalcular el payload.`,
      true,
    );
  }

  // Encadenado por hash.
  const expectedPrev = header.lastHash ? bytesToHex(header.lastHash) : null;
  const actualPrev = write.prevHash ? bytesToHex(write.prevHash) : null;
  if (expectedPrev !== actualPrev) {
    throw new ChainError(
      "PrevHashMismatch",
      `prev_hash esperado ${expectedPrev ?? "<génesis>"}, llegó ${actualPrev ?? "<génesis>"}.`,
      true,
    );
  }
}

/** Un recibo que se parece al real sin pretender serlo: el prefijo lo delata. */
function fakeReceipt(): ChainReceipt {
  return {
    txHash: `stub${randomBytes(30).toString("hex")}`,
    ledger: BigInt(Math.floor(Date.now() / 5000)),
  };
}

/**
 * Recibe el cliente en vez de importarlo: el drainer corre tanto dentro de Next como desde
 * `scripts/drain.ts`, que está fuera y no puede tocar un módulo `server-only`.
 */
export function createStubChainWriter(db: PrismaClient): ChainWriter {
  return {
    label: "stub (sin cadena)",

    getHeader: (animalId) => readHeader(db, animalId),

    async createChain(write) {
      assertPayload(write);
      const header = await readHeader(db, write.animalId);
      if (header) {
        throw new ChainError(
          "ChainExists",
          `El animal ${write.animalId} ya tiene cadena.`,
        );
      }
      if (write.seq !== 1) {
        throw new ChainError(
          "PrevHashMismatch",
          `create_chain exige seq 1, llegó ${write.seq}.`,
        );
      }
      if (write.prevHash) {
        throw new ChainError(
          "PrevHashMismatch",
          "El primer record no puede tener antecesor.",
        );
      }
      return fakeReceipt();
    },

    async appendRecord(write) {
      assertPayload(write);

      // El contrato rechaza un terminal por esta vía; los terminales van por close_chain.
      if (write.kind === "terminal") {
        throw new ChainError(
          "TerminalViaAppend",
          "Un record terminal va por close_chain.",
        );
      }

      const header = await readHeader(db, write.animalId);
      if (!header) {
        throw new ChainError(
          "ChainNotFound",
          `El animal ${write.animalId} no tiene cadena.`,
        );
      }

      // Política de cadena cerrada: los hitos ordinarios se rechazan, las rectificaciones no.
      if (header.closed && write.kind !== "rectification") {
        throw new ChainError("ChainClosed", "La cadena está cerrada.");
      }

      assertLinkage(write, header);
      return fakeReceipt();
    },

    async closeChain(write) {
      assertPayload(write);
      if (write.kind !== "terminal") {
        throw new ChainError(
          "TerminalViaAppend",
          "close_chain solo acepta un record terminal.",
        );
      }

      const header = await readHeader(db, write.animalId);
      if (!header) {
        throw new ChainError(
          "ChainNotFound",
          `El animal ${write.animalId} no tiene cadena.`,
        );
      }
      // Un segundo cierre se rechaza.
      if (header.closed) {
        throw new ChainError("ChainClosed", "La cadena ya está cerrada.");
      }

      assertLinkage(write, header);
      return fakeReceipt();
    },
  };
}
