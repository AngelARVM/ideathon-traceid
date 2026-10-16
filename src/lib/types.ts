/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Species = "bovino";

export type AnimalStatus = "abierta" | "cerrada";

export type RecordType =
  | "alta"
  | "pesaje"
  | "vacunacion"
  | "desparasitacion"
  | "alimentacion"
  | "traslado"
  | "venta"
  | "entrega_frigorifico"
  | "muerte"
  | "otro"
  | "rectificacion";

export type RecordStatus = "pendiente" | "confirmado" | "fallido";

export type VerificationState =
  | "verificado"
  | "falla_integridad"
  | "no_verificable";

export interface Animal {
  id: string; // ULID, 26 chars
  officialId: string; // string, conservar ceros iniciales (e.g. "032 01 000012345")
  previousOfficialIds: string[];
  species: "bovino";
  establishment: string;
  lot: string;
  status: AnimalStatus;
  recordCount: number;
  lastRecordType?: RecordType;
  // Campos complementarios del registro de campo
  category?: string; // Novillo, Vaquillona, Ternero, Toro, Vaca
  breed?: string; // Braford, Brangus, Brahman, etc.
  birthDate?: string;
  createdAt?: string;
}

export interface TraceRecord {
  seq: number;
  animalId: string;
  type: RecordType;
  schemaVersion: number;
  occurredAt: string; // ISO
  recordedAt: string; // ISO
  author: string;
  payload: Record<string, unknown>;
  contentHash: string; // hex 64 (SHA-256)
  prevHash: string | null; // hex 64 o null para seq 0
  txHash?: string;
  ledger?: number;
  status: RecordStatus;
  terminal: boolean;
  rectifies?: number;
  rectifiedBy?: number;
}

export interface AnimalFilters {
  establishment?: string;
  lot?: string;
  status?: AnimalStatus | "todos";
  type?: RecordType | "todos";
}

export interface CreateAnimalInput {
  officialId: string;
  establishment: string;
  lot: string;
  identificationDate?: string;
  birthDate?: string;
  baseDiet: string;
  category?: string;
  breed?: string;
  notes?: string;
}

export interface AddRecordInput {
  type: RecordType;
  occurredAt: string;
  author?: string;
  payload: Record<string, unknown>;
  rectifies?: number;
}

export interface CloseChainInput {
  type: "entrega_frigorifico" | "muerte" | "venta";
  occurredAt: string;
  author?: string;
  destinationOrCause: string;
  payload: Record<string, unknown>;
}

// Proyecciones exclusivas para vistas públicas (/a/:id y /a/:id/registro/:seq)
export interface PublicHistoryAnimal {
  id: string;
  officialId: string;
  previousOfficialIds: string[];
  species: "bovino";
  establishment: string;
  status: AnimalStatus;
  recordCount: number;
  closedAt?: string;
  chainIntegrity: VerificationState;
  category?: string;
  breed?: string;
}

export interface PublicTraceRecordSummary {
  seq: number;
  type: RecordType;
  occurredAt: string;
  recordedAt: string;
  contentHash: string;
  prevHash: string | null;
  txHash?: string;
  ledger?: number;
  status: RecordStatus;
  terminal: boolean;
  rectifies?: number;
  rectifiedBy?: number;
  verificationState: VerificationState;
  summaryText: string;
  author: string;
  payload: Record<string, unknown>;
}

export interface PublicHistoryResult {
  animal: PublicHistoryAnimal;
  records: PublicTraceRecordSummary[];
  anchoredLedgerRange?: { min: number; max: number };
  stellarNetwork: "Testnet";
  contractId: string;
}

export interface PublicRecordResult {
  animal: PublicHistoryAnimal;
  record: TraceRecord;
  contractId: string;
  stellarNetwork: "Testnet";
  canonicalPayloadJson: string;
  verification: {
    state: VerificationState;
    calculatedHash: string;
    storedHash: string;
    prevHashMatches: boolean;
    ledgerConfirmed: boolean;
    anchoredAt?: string;
    stellarTxUrl?: string;
  };
}
