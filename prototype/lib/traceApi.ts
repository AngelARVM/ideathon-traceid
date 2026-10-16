/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AddRecordInput,
  Animal,
  AnimalFilters,
  CloseChainInput,
  CreateAnimalInput,
  PublicHistoryAnimal,
  PublicHistoryResult,
  PublicRecordResult,
  PublicTraceRecordSummary,
  RecordType,
  TraceRecord,
  VerificationState,
} from "./types";

// Helper de simulación de hash SHA-256 (64 hex chars)
function generateHexHash(seed: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const part3 = ((h1 ^ 0x5a5a5a5a) >>> 0).toString(16).padStart(8, "0");
  const part4 = ((h2 ^ 0x3c3c3c3c) >>> 0).toString(16).padStart(8, "0");
  const part5 = ((h1 ^ 0xf0f0f0f0) >>> 0).toString(16).padStart(8, "0");
  const part6 = ((h2 ^ 0x0f0f0f0f) >>> 0).toString(16).padStart(8, "0");
  const part7 = ((h1 ^ 0x12345678) >>> 0).toString(16).padStart(8, "0");
  const part8 = ((h2 ^ 0x87654321) >>> 0).toString(16).padStart(8, "0");
  return (part1 + part2 + part3 + part4 + part5 + part6 + part7 + part8)
    .toLowerCase()
    .slice(0, 64);
}

function generateUlid(prefix = "01J"): string {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = prefix;
  while (out.length < 26) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

// Configuración de simulación
let simulateWriteFailure = false;
let simulateLatency = true;

export function setSimulateFailure(value: boolean): void {
  simulateWriteFailure = value;
}

export function getSimulateFailure(): boolean {
  return simulateWriteFailure;
}

export function setSimulateLatency(value: boolean): void {
  simulateLatency = value;
}

export function getSimulateLatency(): boolean {
  return simulateLatency;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomWriteDelay = async () => {
  if (!simulateLatency) return;
  // Latencia requerida: 1 a 3 segundos
  const ms = Math.floor(1000 + Math.random() * 2000);
  await sleep(ms);
};

// Base de datos en memoria inicial
const INITIAL_ANIMALS: Animal[] = [
  {
    id: "01JH8V9B7C1D2E3F4G5H6J7K8M",
    officialId: "032 01 000012345",
    previousOfficialIds: ["032 01 000009981"],
    species: "bovino",
    establishment: "La Esperanza – Corrientes",
    lot: "Lote 4 – Invernada",
    status: "cerrada",
    recordCount: 4,
    lastRecordType: "entrega_frigorifico",
    category: "Novillo",
    breed: "Braford",
    birthDate: "2023-09-12",
    createdAt: "2023-09-15T08:00:00.000Z",
  },
  {
    id: "01JH8V9B7C1D2E3F4G5H6J7K9N",
    officialId: "0012 34567",
    previousOfficialIds: [],
    species: "bovino",
    establishment: "El Ombú – Chaco",
    lot: "Lote 1 – Pastura Brachiaria",
    status: "abierta",
    recordCount: 4,
    lastRecordType: "rectificacion",
    category: "Vaquillona",
    breed: "Brangus Negro",
    birthDate: "2024-02-18",
    createdAt: "2024-02-20T10:15:00.000Z",
  },
  {
    id: "01JH8V9B7C1D2E3F4G5H6J7KAP",
    officialId: "032 02 000088912",
    previousOfficialIds: [],
    species: "bovino",
    establishment: "La Esperanza – Corrientes",
    lot: "Lote Maternidad y Cría",
    status: "abierta",
    recordCount: 3,
    lastRecordType: "vacunacion",
    category: "Ternero",
    breed: "Brahman",
    birthDate: "2024-08-05",
    createdAt: "2024-08-06T14:30:00.000Z",
  },
  {
    id: "01JH8V9B7C1D2E3F4G5H6J7KBQ",
    officialId: "0045 00921",
    previousOfficialIds: [],
    species: "bovino",
    establishment: "El Ombú – Chaco",
    lot: "Lote 4 – Invernada",
    status: "abierta",
    recordCount: 3,
    lastRecordType: "traslado",
    category: "Toro",
    breed: "Braford 3/8",
    birthDate: "2022-11-20",
    createdAt: "2022-11-22T09:00:00.000Z",
  },
  {
    id: "01JH8V9B7C1D2E3F4G5H6J7KCR",
    officialId: "032 01 000034110",
    previousOfficialIds: ["032 01 000030012"],
    species: "bovino",
    establishment: "La Esperanza – Corrientes",
    lot: "Lote 1 – Pastura Brachiaria",
    status: "abierta",
    recordCount: 2,
    lastRecordType: "pesaje",
    category: "Novillito",
    breed: "Brangus Colorado",
    birthDate: "2024-01-10",
    createdAt: "2024-01-12T11:00:00.000Z",
  },
  {
    id: "01JH8V9B7C1D2E3F4G5H6J7KDS",
    officialId: "0012 88204",
    previousOfficialIds: [],
    species: "bovino",
    establishment: "El Ombú – Chaco",
    lot: "Lote Maternidad y Cría",
    status: "abierta",
    recordCount: 2,
    lastRecordType: "desparasitacion",
    category: "Vaca",
    breed: "Criollo Chaqueño",
    birthDate: "2021-05-14",
    createdAt: "2021-05-16T16:20:00.000Z",
  },
];

// Registros de trazabilidad vinculados por hash previo
const INITIAL_RECORDS: TraceRecord[] = [
  // ANIMAL 1: Cadena cerrada por entrega_frigorifico
  {
    seq: 0,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K8M",
    type: "alta",
    schemaVersion: 1,
    occurredAt: "2023-09-15T08:00:00.000Z",
    recordedAt: "2023-09-15T08:05:22.000Z",
    author: "Dr. M. Benítez (Méd. Vet. Reg. 4192)",
    payload: {
      caravanaOficial: "032 01 000012345",
      raza: "Braford",
      sexo: "Macho entero",
      pesoInicialKg: 38.5,
      madreCaravana: "032 01 000004120",
      renspaEstablecimiento: "18.004.0.01234/00",
    },
    contentHash:
      "7b2a9e8841c6ce57d0f19b2246822507a3f89be98234671190bcda124890ffee",
    prevHash: null,
    txHash: "e63ab9273c09194511da483e5831969a473fbe695c0245a198c39fa926a84cf2",
    ledger: 54109280,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 1,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K8M",
    type: "vacunacion",
    schemaVersion: 1,
    occurredAt: "2024-03-20T10:30:00.000Z",
    recordedAt: "2024-03-20T10:45:10.000Z",
    author: "Campaña Oficial SENASA NEA - Plan 01",
    payload: {
      vacuna: "Fiebre Aftosa Bivalente + Carbunclo",
      laboratorio: "Biogénesis Bagó",
      serieLote: "BB-AFT-2409-C",
      dosisMl: 2.0,
      veterinarioCertificante: "SENASA Delegación Curuzú Cuatiá",
    },
    contentHash:
      "8a9c2f345e67890123456789abcdef0123456789abcdef0123456789abcdef01",
    prevHash:
      "7b2a9e8841c6ce57d0f19b2246822507a3f89be98234671190bcda124890ffee",
    txHash: "190cbb45e31789a421bde792881cf459012389abce45901a88bb332144558899",
    ledger: 54221045,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 2,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K8M",
    type: "pesaje",
    schemaVersion: 1,
    occurredAt: "2024-08-14T07:15:00.000Z",
    recordedAt: "2024-08-14T07:22:04.000Z",
    author: "J. Valenzuela (Encargado Balanza)",
    payload: {
      pesoKg: 462.0,
      balanzaCertificada: "Báscula Mecánica-Electrónica Hook SC-200",
      gananciaDiariaEstKg: 0.82,
      loteDestino: "Lote 4 – Invernada",
    },
    contentHash:
      "f412cd909876543210abcdef0123456789abcdef0123456789abcdef01234567",
    prevHash:
      "8a9c2f345e67890123456789abcdef0123456789abcdef0123456789abcdef01",
    txHash: "77a88bb99c00112233445566778899aabbccddeeff00112233445566778899aa",
    ledger: 54310502,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 3,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K8M",
    type: "entrega_frigorifico",
    schemaVersion: 1,
    occurredAt: "2024-10-02T13:45:00.000Z",
    recordedAt: "2024-10-02T13:58:30.000Z",
    author: "Consignataria del Litoral S.A.",
    payload: {
      dteSenasa: "DTE-0982-2024-00192834",
      frigorificoDestino: "Frigorífico Exportador del Nordeste (Resistencia)",
      matriculaSenasaFrig: "FRIG-1422-B",
      pesoRomaneoBrutoKg: 478.5,
      motivoCierre: "Faena con destino cuota Hilton UE",
    },
    contentHash:
      "c998a1276354abcedf0192837465019283746501928374650192837465019283",
    prevHash:
      "f412cd909876543210abcdef0123456789abcdef0123456789abcdef01234567",
    txHash: "ff4433221100aabbccddeeff99887766554433221100aabbccddeeff99887766",
    ledger: 54399120,
    status: "confirmado",
    terminal: true,
  },

  // ANIMAL 2: Con rectificación (seq 1 rectificado por seq 2)
  {
    seq: 0,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K9N",
    type: "alta",
    schemaVersion: 1,
    occurredAt: "2024-02-20T10:15:00.000Z",
    recordedAt: "2024-02-20T10:20:00.000Z",
    author: "Ing. Agr. G. Romero (El Ombú)",
    payload: {
      caravanaOficial: "0012 34567",
      raza: "Brangus Negro",
      sexo: "Hembra",
      pesoInicialKg: 34.0,
      padreRegistro: "Correntino Gran Campeón 2021",
    },
    contentHash:
      "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    prevHash: null,
    txHash: "2233445566778899aabbccddeeff00112233445566778899aabbccddeeff0011",
    ledger: 54200110,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 1,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K9N",
    type: "pesaje",
    schemaVersion: 1,
    occurredAt: "2024-06-10T09:00:00.000Z",
    recordedAt: "2024-06-10T09:12:00.000Z",
    author: "Operador de Manga 2",
    payload: {
      pesoKg: 310.0, // Error humano registrado
      nota: "Lectura visual rápida en manga",
    },
    contentHash:
      "33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122",
    prevHash:
      "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    txHash: "445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233",
    ledger: 54289004,
    status: "confirmado",
    terminal: false,
    rectifiedBy: 2,
  },
  {
    seq: 2,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K9N",
    type: "rectificacion",
    schemaVersion: 1,
    occurredAt: "2024-06-10T11:30:00.000Z",
    recordedAt: "2024-06-10T11:40:15.000Z",
    author: "Ing. Agr. G. Romero (El Ombú)",
    payload: {
      hitoRectificadoSeq: 1,
      motivo:
        "Corrección de error de tipeo en báscula. El peso real verificado en ticket fue 335.0 kg.",
      pesoKgCorregido: 335.0,
      ticketBalanzaNumero: "TK-00892-CH",
    },
    contentHash:
      "5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344",
    prevHash:
      "33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122",
    txHash: "66778899aabbccddeeff00112233445566778899aabbccddeeff001122334455",
    ledger: 54289520,
    status: "confirmado",
    terminal: false,
    rectifies: 1,
  },
  {
    seq: 3,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7K9N",
    type: "alimentacion",
    schemaVersion: 1,
    occurredAt: "2024-09-01T08:00:00.000Z",
    recordedAt: "2024-09-01T08:25:00.000Z",
    author: "Técnico Nutricionista M. Silva",
    payload: {
      dieta: "Suplementación proteica con pellet de algodón 28% PB",
      kilosPorAnimalDia: 1.5,
      pastizalBase: "Brachiaria Brizantha en rebrote primaveral",
    },
    contentHash:
      "778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566",
    prevHash:
      "5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344",
    txHash: "8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677",
    ledger: 54378190,
    status: "confirmado",
    terminal: false,
  },

  // ANIMAL 3: Con registro PENDIENTE (en proceso de confirmación en Stellar Testnet)
  {
    seq: 0,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KAP",
    type: "alta",
    schemaVersion: 1,
    occurredAt: "2024-08-06T14:30:00.000Z",
    recordedAt: "2024-08-06T14:35:00.000Z",
    author: "Dr. M. Benítez (Méd. Vet.)",
    payload: {
      caravanaOficial: "032 02 000088912",
      raza: "Brahman Blanco",
      sexo: "Macho",
      pesoInicialKg: 31.0,
      parto: "Natural en piquete de parición",
    },
    contentHash:
      "99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
    prevHash: null,
    txHash: "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
    ledger: 54341000,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 1,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KAP",
    type: "desparasitacion",
    schemaVersion: 1,
    occurredAt: "2024-09-18T09:00:00.000Z",
    recordedAt: "2024-09-18T09:10:00.000Z",
    author: "Dr. M. Benítez (Méd. Vet.)",
    payload: {
      principioActivo: "Ivermectina 3.15% L.A.",
      marcaComercial: "Ivomec Gold",
      dosisMl: 1.0,
      via: "Subcutánea tabla del cuello",
    },
    contentHash:
      "bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa",
    prevHash:
      "99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
    txHash: "bbccddeeff00112233445566778899aabbccddeeff00112233445566778899bb",
    ledger: 54390012,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 2,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KAP",
    type: "vacunacion",
    schemaVersion: 1,
    occurredAt: "2024-10-14T11:00:00.000Z",
    recordedAt: "2024-10-14T11:04:12.000Z",
    author: "Campaña Oficial SENASA NEA",
    payload: {
      vacuna: "Antiaftosa 2da Dosis Menores + Cepa 19 Brucelosis",
      serieLote: "SENASA-2024-OCT-11",
      observacion:
        "Enviado a mempool de Stellar Testnet; esperando cierre del ledger",
    },
    contentHash:
      "ccddeeff00112233445566778899aabbccddeeff00112233445566778899aabb",
    prevHash:
      "bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa",
    status: "pendiente", // REGISTRO PENDIENTE
    terminal: false,
  },

  // ANIMAL 4: Con registro FALLIDO (ej: fallo de red o rechazo de transacción)
  {
    seq: 0,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KBQ",
    type: "alta",
    schemaVersion: 1,
    occurredAt: "2022-11-22T09:00:00.000Z",
    recordedAt: "2022-11-22T09:15:00.000Z",
    author: "Administración El Ombú",
    payload: {
      caravanaOficial: "0045 00921",
      raza: "Braford 3/8",
      sexo: "Macho",
      origen: "Cabaña Los Guaraníes",
    },
    contentHash:
      "ddeeff00112233445566778899aabbccddeeff00112233445566778899aabbcc",
    prevHash: null,
    txHash: "ddeeff00112233445566778899aabbccddeeff00112233445566778899aabbdd",
    ledger: 53100200,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 1,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KBQ",
    type: "pesaje",
    schemaVersion: 1,
    occurredAt: "2023-11-10T08:30:00.000Z",
    recordedAt: "2023-11-10T08:40:00.000Z",
    author: "Capataz R. Ojeda",
    payload: {
      pesoKg: 780.0,
      condicionCorporal: "4 (Escala 1 a 5)",
    },
    contentHash:
      "eeff00112233445566778899aabbccddeeff00112233445566778899aabbccee",
    prevHash:
      "ddeeff00112233445566778899aabbccddeeff00112233445566778899aabbcc",
    txHash: "eeff00112233445566778899aabbccddeeff00112233445566778899aabbcce0",
    ledger: 53890123,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 2,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KBQ",
    type: "traslado",
    schemaVersion: 1,
    occurredAt: "2024-10-10T16:00:00.000Z",
    recordedAt: "2024-10-10T16:15:00.000Z",
    author: "Capataz R. Ojeda",
    payload: {
      origenLote: "Lote Maternidad",
      destinoLote: "Lote 4 – Invernada",
      motivo: "Rotación de pastoreo y descanso de potrero",
      errorStellar:
        "tx_bad_seq: Fallo de secuencia temporal en nodo Horizon Testnet",
    },
    contentHash:
      "ff00112233445566778899aabbccddeeff00112233445566778899aabbcceff0",
    prevHash:
      "eeff00112233445566778899aabbccddeeff00112233445566778899aabbccee",
    status: "fallido", // REGISTRO FALLIDO
    terminal: false,
  },

  // ANIMAL 5
  {
    seq: 0,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KCR",
    type: "alta",
    schemaVersion: 1,
    occurredAt: "2024-01-12T11:00:00.000Z",
    recordedAt: "2024-01-12T11:05:00.000Z",
    author: "Dr. M. Benítez",
    payload: {
      caravanaOficial: "032 01 000034110",
      raza: "Brangus Colorado",
      sexo: "Macho",
    },
    contentHash:
      "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    prevHash: null,
    txHash: "00112233445566778899aabbccddeeff00112233445566778899aabbccddee01",
    ledger: 54190111,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 1,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KCR",
    type: "pesaje",
    schemaVersion: 1,
    occurredAt: "2024-07-20T08:00:00.000Z",
    recordedAt: "2024-07-20T08:14:00.000Z",
    author: "J. Valenzuela",
    payload: {
      pesoKg: 285.0,
      gananciaMedia: 0.75,
    },
    contentHash:
      "0112233445566778899aabbccddeeff00112233445566778899aabbccddeeff0",
    prevHash:
      "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    txHash: "0112233445566778899aabbccddeeff00112233445566778899aabbccddee02",
    ledger: 54298102,
    status: "confirmado",
    terminal: false,
  },

  // ANIMAL 6
  {
    seq: 0,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KDS",
    type: "alta",
    schemaVersion: 1,
    occurredAt: "2021-05-16T16:20:00.000Z",
    recordedAt: "2021-05-16T16:25:00.000Z",
    author: "Ing. Agr. G. Romero",
    payload: {
      caravanaOficial: "0012 88204",
      raza: "Criollo Chaqueño",
      sexo: "Hembra",
    },
    contentHash:
      "12233445566778899aabbccddeeff00112233445566778899aabbccddeeff001",
    prevHash: null,
    txHash: "12233445566778899aabbccddeeff00112233445566778899aabbccddee03",
    ledger: 51900100,
    status: "confirmado",
    terminal: false,
  },
  {
    seq: 1,
    animalId: "01JH8V9B7C1D2E3F4G5H6J7KDS",
    type: "desparasitacion",
    schemaVersion: 1,
    occurredAt: "2024-04-12T10:00:00.000Z",
    recordedAt: "2024-04-12T10:08:00.000Z",
    author: "Ing. Agr. G. Romero",
    payload: {
      producto: "Levamisol 10% inyectable",
      dosisMl: 12.0,
      motivo: "Profilaxis otoño garrapata y parásitos gastrointestinales",
    },
    contentHash:
      "233445566778899aabbccddeeff00112233445566778899aabbccddeeff0012",
    prevHash:
      "12233445566778899aabbccddeeff00112233445566778899aabbccddeeff001",
    txHash: "233445566778899aabbccddeeff00112233445566778899aabbccddee04",
    ledger: 54245600,
    status: "confirmado",
    terminal: false,
  },
];

// Estado en memoria
let animalsStore: Animal[] = [...INITIAL_ANIMALS];
let recordsStore: TraceRecord[] = [...INITIAL_RECORDS];

// Autenticación de demo
const SESSION_STORAGE_KEY = "traceid_session_authenticated";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  // Ingreso directo por defecto con credenciales de demo
  if (stored === null) {
    localStorage.setItem(SESSION_STORAGE_KEY, "true");
    return true;
  }
  return stored === "true";
}

export async function login(password?: string): Promise<boolean> {
  // Demo password: auto o "demo" / "campo" / cualquier clave
  await sleep(250);
  localStorage.setItem(SESSION_STORAGE_KEY, "true");
  return true;
}

export async function logout(): Promise<void> {
  await sleep(150);
  localStorage.setItem(SESSION_STORAGE_KEY, "false");
}

// --------------------------------------------------------------------------
// API OPERATIVA (requiere sesión en el flujo de la app)
// --------------------------------------------------------------------------

export async function listAnimals(
  query = "",
  filters?: AnimalFilters,
): Promise<Animal[]> {
  // Simular pequeña latencia de lectura de campo
  await sleep(180);

  let result = [...animalsStore];

  if (query && query.trim()) {
    const rawQ = query.trim().toLowerCase();
    const cleanQ = rawQ.replace(/[\s\-_/]/g, "");

    result = result.filter((a) => {
      // 1. Identificador oficial actual
      const offClean = a.officialId.toLowerCase().replace(/[\s\-_/]/g, "");
      const matchesOfficial =
        offClean.includes(cleanQ) || a.officialId.toLowerCase().includes(rawQ);

      // 2. Identificadores oficiales anteriores
      const matchesPrevious = a.previousOfficialIds.some(
        (prev) =>
          prev.toLowerCase().includes(rawQ) ||
          prev
            .toLowerCase()
            .replace(/[\s\-_/]/g, "")
            .includes(cleanQ),
      );

      // 3. ID interno (ULID de 26 caracteres)
      const matchesInternalId = a.id.toLowerCase().includes(rawQ);

      // 4. Establecimiento o lote o raza para comodidad en campo
      const matchesLocation =
        a.establishment.toLowerCase().includes(rawQ) ||
        a.lot.toLowerCase().includes(rawQ) ||
        (a.breed && a.breed.toLowerCase().includes(rawQ)) ||
        (a.category && a.category.toLowerCase().includes(rawQ));

      return (
        matchesOfficial ||
        matchesPrevious ||
        matchesInternalId ||
        matchesLocation
      );
    });
  }

  if (filters) {
    if (filters.establishment && filters.establishment !== "todos") {
      result = result.filter((a) => a.establishment === filters.establishment);
    }
    if (filters.lot && filters.lot !== "todos") {
      result = result.filter((a) => a.lot === filters.lot);
    }
    if (filters.status && filters.status !== "todos") {
      result = result.filter((a) => a.status === filters.status);
    }
    if (filters.type && filters.type !== "todos") {
      result = result.filter((a) => a.lastRecordType === filters.type);
    }
  }

  return result;
}

export async function getAnimal(id: string): Promise<Animal | null> {
  await sleep(120);
  const animal = animalsStore.find((a) => a.id === id || a.officialId === id);
  return animal ? { ...animal } : null;
}

export async function getAnimalOperationalRecords(
  animalId: string,
): Promise<TraceRecord[]> {
  await sleep(120);
  return recordsStore
    .filter((r) => r.animalId === animalId)
    .sort((a, b) => a.seq - b.seq)
    .map((r) => ({ ...r }));
}

export async function retryRecord(
  animalId: string,
  seq: number,
): Promise<TraceRecord> {
  await randomWriteDelay();

  if (simulateWriteFailure) {
    throw new Error(
      "Fallo simulado: Error al reintentar anclaje en Stellar Testnet (Horizon op_bad_auth)",
    );
  }

  const rec = recordsStore.find(
    (r) => r.animalId === animalId && r.seq === seq,
  );
  if (!rec) {
    throw new Error("Registro no encontrado para reintentar");
  }

  const txHash = generateHexHash(
    `stellar-tx-retry-${animalId}-seq${seq}-${Date.now()}`,
  );
  const simulatedLedger = 54410000 + Math.floor(Math.random() * 2000);

  rec.status = "confirmado";
  rec.txHash = txHash;
  rec.ledger = simulatedLedger;
  if (rec.payload && typeof rec.payload === "object") {
    delete (rec.payload as Record<string, unknown>).errorStellar;
  }

  return { ...rec };
}

export async function createAnimal(input: CreateAnimalInput): Promise<Animal> {
  await randomWriteDelay();

  if (simulateWriteFailure) {
    throw new Error(
      "Fallo simulado: No se pudo anclar la transacción de alta en Stellar Testnet (Horizon timeout)",
    );
  }

  if (!input.officialId || input.officialId.trim().length === 0) {
    throw new Error("El identificador oficial (caravana) es obligatorio.");
  }

  // Verificar unicidad de caravana oficial
  const exists = animalsStore.some(
    (a) =>
      a.officialId.replace(/\s+/g, "") === input.officialId.replace(/\s+/g, ""),
  );
  if (exists) {
    throw new Error(
      `Ya existe un animal registrado con la caravana ${input.officialId}`,
    );
  }

  const newId = generateUlid();
  const nowIso = new Date().toISOString();

  // Crear registro de génesis (seq 0, tipo "alta")
  const contentHash = generateHexHash(
    `${newId}-seq0-${input.officialId}-${nowIso}`,
  );
  const txHash = generateHexHash(`stellar-tx-${newId}-seq0-${Date.now()}`);
  const simulatedLedger = 54400000 + Math.floor(Math.random() * 5000);

  const genesisRecord: TraceRecord = {
    seq: 0,
    animalId: newId,
    type: "alta",
    schemaVersion: 1,
    occurredAt: input.identificationDate
      ? `${input.identificationDate}T12:00:00.000Z`
      : nowIso,
    recordedAt: nowIso,
    author: "Operador de Establecimiento",
    payload: {
      caravanaOficial: input.officialId,
      establecimiento: input.establishment,
      lote: input.lot,
      fechaIdentificacion: input.identificationDate || nowIso.split("T")[0],
      fechaNacimientoDeclarada: input.birthDate || null,
      dietaBase: input.baseDiet,
      raza: input.breed || "Sin especificar",
      categoria: input.category || "General",
      observaciones: input.notes || "Alta inicial en sistema TraceID NEA",
    },
    contentHash,
    prevHash: null,
    txHash,
    ledger: simulatedLedger,
    status: "confirmado",
    terminal: false,
  };

  const newAnimal: Animal = {
    id: newId,
    officialId: input.officialId,
    previousOfficialIds: [],
    species: "bovino",
    establishment: input.establishment,
    lot: input.lot,
    status: "abierta",
    recordCount: 1,
    lastRecordType: "alta",
    category: input.category,
    breed: input.breed,
    birthDate: input.birthDate,
    createdAt: nowIso,
  };

  animalsStore.unshift(newAnimal);
  recordsStore.push(genesisRecord);

  return { ...newAnimal };
}

export async function addRecord(
  animalId: string,
  input: AddRecordInput,
): Promise<TraceRecord> {
  await randomWriteDelay();

  if (simulateWriteFailure) {
    throw new Error(
      "Fallo simulado: Error al anclar hash en Stellar Testnet (Horizon op_bad_auth)",
    );
  }

  const animalIndex = animalsStore.findIndex((a) => a.id === animalId);
  if (animalIndex === -1) {
    throw new Error("Animal no encontrado");
  }

  const currentAnimal = animalsStore[animalIndex];
  if (currentAnimal.status === "cerrada" && input.type !== "rectificacion") {
    throw new Error("La cadena está cerrada. Solo se admiten rectificaciones.");
  }

  const existingRecords = recordsStore
    .filter((r) => r.animalId === animalId)
    .sort((a, b) => a.seq - b.seq);

  const lastRecord = existingRecords[existingRecords.length - 1];
  const nextSeq = lastRecord ? lastRecord.seq + 1 : 0;
  const prevHash = lastRecord ? lastRecord.contentHash : null;

  const nowIso = new Date().toISOString();
  const contentHash = generateHexHash(
    `${animalId}-seq${nextSeq}-${input.type}-${JSON.stringify(input.payload)}-${prevHash}`,
  );
  const txHash = generateHexHash(
    `stellar-tx-${animalId}-seq${nextSeq}-${Date.now()}`,
  );
  const simulatedLedger = 54405000 + Math.floor(Math.random() * 2000);

  const newRecord: TraceRecord = {
    seq: nextSeq,
    animalId,
    type: input.type,
    schemaVersion: 1,
    occurredAt: input.occurredAt || nowIso,
    recordedAt: nowIso,
    author: input.author || "Técnico de Campo NEA",
    payload: input.payload,
    contentHash,
    prevHash,
    txHash,
    ledger: simulatedLedger,
    status: "confirmado",
    terminal: false,
    rectifies: input.rectifies,
  };

  if (typeof input.rectifies === "number") {
    // Marcar el registro anterior como rectificado por este
    const rectTarget = recordsStore.find(
      (r) => r.animalId === animalId && r.seq === input.rectifies,
    );
    if (rectTarget) {
      rectTarget.rectifiedBy = nextSeq;
    }
  }

  recordsStore.push(newRecord);

  // Actualizar animal
  animalsStore[animalIndex] = {
    ...currentAnimal,
    recordCount: currentAnimal.recordCount + 1,
    lastRecordType: input.type,
  };

  return { ...newRecord };
}

export async function closeChain(
  animalId: string,
  input: CloseChainInput,
): Promise<TraceRecord> {
  await randomWriteDelay();

  if (simulateWriteFailure) {
    throw new Error(
      "Fallo simulado: No se pudo registrar el cierre terminal en Stellar Testnet",
    );
  }

  const animalIndex = animalsStore.findIndex((a) => a.id === animalId);
  if (animalIndex === -1) {
    throw new Error("Animal no encontrado");
  }

  const currentAnimal = animalsStore[animalIndex];
  if (currentAnimal.status === "cerrada") {
    throw new Error("La cadena ya se encuentra cerrada");
  }

  const existingRecords = recordsStore
    .filter((r) => r.animalId === animalId)
    .sort((a, b) => a.seq - b.seq);

  const lastRecord = existingRecords[existingRecords.length - 1];
  const nextSeq = lastRecord ? lastRecord.seq + 1 : 0;
  const prevHash = lastRecord ? lastRecord.contentHash : null;

  const nowIso = new Date().toISOString();
  const payloadWithMeta = {
    ...input.payload,
    destinoOMotivo: input.destinationOrCause,
    tipoCierreTerminal: input.type,
  };

  const contentHash = generateHexHash(
    `${animalId}-seq${nextSeq}-${input.type}-${JSON.stringify(payloadWithMeta)}-${prevHash}`,
  );
  const txHash = generateHexHash(`stellar-tx-${animalId}-close-${Date.now()}`);
  const simulatedLedger = 54408000 + Math.floor(Math.random() * 2000);

  const terminalRecord: TraceRecord = {
    seq: nextSeq,
    animalId,
    type: input.type,
    schemaVersion: 1,
    occurredAt: input.occurredAt || nowIso,
    recordedAt: nowIso,
    author: input.author || "Inspector / Frigorífico Certificante",
    payload: payloadWithMeta,
    contentHash,
    prevHash,
    txHash,
    ledger: simulatedLedger,
    status: "confirmado",
    terminal: true,
  };

  recordsStore.push(terminalRecord);

  animalsStore[animalIndex] = {
    ...currentAnimal,
    status: "cerrada",
    recordCount: currentAnimal.recordCount + 1,
    lastRecordType: input.type,
  };

  return { ...terminalRecord };
}

// --------------------------------------------------------------------------
// API PÚBLICA (/a/:id y /a/:id/registro/:seq)
// Vistas independientes sin sesión, orientadas a transparencia blockchain
// --------------------------------------------------------------------------

function verifyChainIntegrity(records: TraceRecord[]): VerificationState {
  if (!records.length) return "no_verificable";

  // Si hay registros fallidos o pendientes, se marca según estado
  const hasFailed = records.some((r) => r.status === "fallido");
  if (hasFailed) return "falla_integridad";

  for (let i = 0; i < records.length; i++) {
    const curr = records[i];
    if (i === 0) {
      if (curr.prevHash !== null) return "falla_integridad";
    } else {
      const prev = records[i - 1];
      if (curr.prevHash !== prev.contentHash) {
        return "falla_integridad";
      }
    }
  }

  const hasPending = records.some((r) => r.status === "pendiente");
  if (hasPending) return "no_verificable";

  return "verificado";
}

function formatSummaryText(
  type: RecordType,
  payload: Record<string, unknown>,
): string {
  switch (type) {
    case "alta":
      return `Alta inicial oficial (Caravana: ${payload.caravanaOficial || "S/D"})`;
    case "pesaje":
      return `Pesaje verificado: ${payload.pesoKg || payload.pesoKgCorregido || "---"} kg`;
    case "vacunacion":
      return `Vacunación: ${payload.vacuna || "Campaña oficial NEA"}`;
    case "desparasitacion":
      return `Desparasitación: ${payload.producto || payload.principioActivo || "Tratamiento sanitario"}`;
    case "alimentacion":
      return `Manejo nutricional: ${payload.dieta || "Alimentación suplementaria"}`;
    case "traslado":
      return `Movimiento de potrero: ${payload.origenLote || "Origen"} -> ${payload.destinoLote || "Destino"}`;
    case "venta":
      return `Venta registrada: ${payload.comprador || payload.destinoOMotivo || "Transacción comercial"}`;
    case "entrega_frigorifico":
      return `Entrega a Frigorífico: ${payload.frigorificoDestino || "Planta faenadora"} (DTE: ${payload.dteSenasa || "S/D"})`;
    case "muerte":
      return `Causa de baja: ${payload.motivo || payload.destinoOMotivo || "Baja biológica"}`;
    case "rectificacion":
      return `Rectificación de hito previo: ${payload.motivo || "Ajuste de datos"}`;
    default:
      return "Registro de trazabilidad verificado en blockchain";
  }
}

const TRACEID_SOROBAN_CONTRACT_ID =
  "CB7L7Q64X773Q44D63N64MZXO24I6W3N6Q7Y5R6P4O2I1U8Y7T6R5E4W3Q2Z";

export async function getPublicHistory(
  animalId: string,
): Promise<PublicHistoryResult | null> {
  await sleep(150);

  const animal = animalsStore.find(
    (a) => a.id === animalId || a.officialId === animalId,
  );
  if (!animal) return null;

  const animalRecords = recordsStore
    .filter((r) => r.animalId === animal.id)
    .sort((a, b) => a.seq - b.seq);

  const integrityState = verifyChainIntegrity(animalRecords);

  const terminalRecord = animalRecords.find((r) => r.terminal);

  const publicAnimal: PublicHistoryAnimal = {
    id: animal.id,
    officialId: animal.officialId,
    previousOfficialIds: animal.previousOfficialIds || [],
    species: animal.species,
    establishment: animal.establishment,
    status: animal.status,
    recordCount: animal.recordCount,
    closedAt: terminalRecord?.recordedAt,
    chainIntegrity: integrityState,
    category: animal.category,
    breed: animal.breed,
  };

  const ledgers = animalRecords
    .map((r) => r.ledger)
    .filter((l): l is number => typeof l === "number");

  const anchoredLedgerRange =
    ledgers.length > 0
      ? { min: Math.min(...ledgers), max: Math.max(...ledgers) }
      : undefined;

  const publicRecords: PublicTraceRecordSummary[] = animalRecords.map(
    (r, index) => {
      let recVerification: VerificationState = "verificado";
      if (r.status === "fallido") {
        recVerification = "falla_integridad";
      } else if (r.status === "pendiente") {
        recVerification = "no_verificable";
      } else if (
        index > 0 &&
        r.prevHash !== animalRecords[index - 1].contentHash
      ) {
        recVerification = "falla_integridad";
      }

      return {
        seq: r.seq,
        type: r.type,
        occurredAt: r.occurredAt,
        recordedAt: r.recordedAt,
        contentHash: r.contentHash,
        prevHash: r.prevHash,
        txHash: r.txHash,
        ledger: r.ledger,
        status: r.status,
        terminal: r.terminal,
        rectifies: r.rectifies,
        rectifiedBy: r.rectifiedBy,
        verificationState: recVerification,
        summaryText: formatSummaryText(r.type, r.payload),
        author: r.author,
        payload: r.payload,
      };
    },
  );

  return {
    animal: publicAnimal,
    records: publicRecords,
    anchoredLedgerRange,
    stellarNetwork: "Testnet",
    contractId: TRACEID_SOROBAN_CONTRACT_ID,
  };
}

export async function getPublicRecord(
  animalId: string,
  seq: number,
): Promise<PublicRecordResult | null> {
  await sleep(140);

  const animal = animalsStore.find(
    (a) => a.id === animalId || a.officialId === animalId,
  );
  if (!animal) return null;

  const animalRecords = recordsStore
    .filter((r) => r.animalId === animal.id)
    .sort((a, b) => a.seq - b.seq);

  const targetRecord = animalRecords.find((r) => r.seq === seq);
  if (!targetRecord) return null;

  const integrityState = verifyChainIntegrity(animalRecords);

  const publicAnimal: PublicHistoryAnimal = {
    id: animal.id,
    officialId: animal.officialId,
    previousOfficialIds: animal.previousOfficialIds || [],
    species: animal.species,
    establishment: animal.establishment,
    status: animal.status,
    recordCount: animal.recordCount,
    chainIntegrity: integrityState,
    category: animal.category,
    breed: animal.breed,
  };

  // Verificación individual matemática del registro
  const prevRec = seq > 0 ? animalRecords.find((r) => r.seq === seq - 1) : null;
  const prevHashMatches =
    seq === 0
      ? targetRecord.prevHash === null
      : targetRecord.prevHash === prevRec?.contentHash;
  const ledgerConfirmed =
    targetRecord.status === "confirmado" &&
    typeof targetRecord.ledger === "number";

  let recVerificationState: VerificationState = "verificado";
  if (targetRecord.status === "fallido" || !prevHashMatches) {
    recVerificationState = "falla_integridad";
  } else if (targetRecord.status === "pendiente") {
    recVerificationState = "no_verificable";
  }

  const stellarTxUrl = targetRecord.txHash
    ? `https://stellar.expert/explorer/testnet/tx/${targetRecord.txHash}`
    : undefined;

  // Formatear payload canónico exacto como JSON
  const sortedPayload: Record<string, unknown> = {};
  Object.keys(targetRecord.payload)
    .sort()
    .forEach((k) => {
      sortedPayload[k] = targetRecord.payload[k];
    });

  const canonicalPayload = {
    animalId: targetRecord.animalId,
    seq: targetRecord.seq,
    type: targetRecord.type,
    schemaVersion: targetRecord.schemaVersion,
    occurredAt: targetRecord.occurredAt,
    author: targetRecord.author,
    payload: sortedPayload,
    prevHash: targetRecord.prevHash,
  };

  return {
    animal: publicAnimal,
    record: { ...targetRecord },
    contractId: TRACEID_SOROBAN_CONTRACT_ID,
    stellarNetwork: "Testnet",
    canonicalPayloadJson: JSON.stringify(canonicalPayload, null, 2),
    verification: {
      state: recVerificationState,
      calculatedHash: targetRecord.contentHash,
      storedHash: targetRecord.contentHash,
      prevHashMatches,
      ledgerConfirmed,
      anchoredAt: targetRecord.recordedAt,
      stellarTxUrl,
    },
  };
}

// Helpers adicionales para UI
export function getAvailableEstablishments(): string[] {
  const set = new Set<string>();
  animalsStore.forEach((a) => set.add(a.establishment));
  return Array.from(set);
}

export function getAvailableLots(establishment?: string): string[] {
  const set = new Set<string>();
  animalsStore
    .filter((a) => !establishment || a.establishment === establishment)
    .forEach((a) => set.add(a.lot));
  return Array.from(set);
}

// Reiniciar datos a los mocks iniciales
export function resetMockData(): void {
  animalsStore = JSON.parse(JSON.stringify(INITIAL_ANIMALS));
  recordsStore = JSON.parse(JSON.stringify(INITIAL_RECORDS));
}
