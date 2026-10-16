/**
 * La interfaz que el drainer usa para escribir en la cadena.
 *
 * Tiene exactamente las tres entradas de escritura del contrato
 * (`contracts/traceid/src/lib.rs`) y no una sola función genérica, porque el contrato **no**
 * las trata igual: un record terminal pasado a `append_record` se rechaza con
 * `TerminalViaAppend`. Modelar esa bifurcación acá, en S2, es lo que permite que S4 reemplace
 * la implementación sin reescribir el ciclo de vida del outbox.
 */

import type { Bytes } from "@/lib/records/canonical";

/** Los códigos de error del contrato, con el mismo nombre que en Rust. */
export type ChainErrorCode =
  | "NotWriter"
  | "ChainExists"
  | "ChainNotFound"
  | "PrevHashMismatch"
  | "RecordExists"
  | "ChainClosed"
  | "TerminalViaAppend"
  | "HashMismatch"
  | "InvalidPayload"
  | "RecordNotFound";

export class ChainError extends Error {
  readonly code: ChainErrorCode;
  /** Si reintentar el mismo payload puede llegar a funcionar. */
  readonly retryable: boolean;

  constructor(code: ChainErrorCode, message: string, retryable = false) {
    super(`${code}: ${message}`);
    this.name = "ChainError";
    this.code = code;
    this.retryable = retryable;
  }
}

/** Lo que el contrato guarda por animal, que es lo que decide el próximo `seq`. */
export interface ChainHeader {
  count: number;
  lastHash: Bytes | null;
  closed: boolean;
}

export interface ChainWrite {
  animalId: string;
  seq: number;
  contentHash: Bytes;
  prevHash: Bytes | null;
  canonicalPayload: string;
  authorId: string;
  kind: "ordinary" | "terminal" | "rectification";
}

/** Lo que devuelve la cadena una vez que aceptó la escritura. */
export interface ChainReceipt {
  txHash: string;
  ledger: bigint;
}

export interface ChainWriter {
  /** Cómo se identifica en los logs: "stub (sin cadena)" o el id del contrato. */
  readonly label: string;
  /** `get_header`; `null` si el animal todavía no tiene cadena. */
  getHeader(animalId: string): Promise<ChainHeader | null>;
  /** `create_chain` + el primer `append_record`, que en el contrato es el `seq = 1`. */
  createChain(write: ChainWrite): Promise<ChainReceipt>;
  /** `append_record`. Rechaza los terminales. */
  appendRecord(write: ChainWrite): Promise<ChainReceipt>;
  /** `close_chain`. La única vía para un record terminal. */
  closeChain(write: ChainWrite): Promise<ChainReceipt>;
}
