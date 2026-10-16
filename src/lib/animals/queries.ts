import "server-only";

/**
 * Capa de lectura del operador (docs/03).
 *
 * Esto es la vista **privada**: puede leer PostgreSQL por velocidad y muestra registros
 * `pending` / `submitted` / `failed` que todavía no existen en la cadena. La vista pública
 * `/a/<animal_id>` es otra ruta con otra capa de acceso y llega en S5; no reutiliza nada de
 * acá, a propósito, porque un solo camino sirviendo a las dos audiencias es exactamente cómo
 * contenido cacheado de la base termina renderizado como historia verificada.
 */

import { db } from "@/db";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeSearchTerm } from "@/lib/identifiers";

export interface AnimalListItem {
  id: string;
  /** Identificador activo, o `null` si todos fueron reemplazados. */
  identifier: string | null;
  identifierKind: string | null;
  detectedFormat: string | null;
  lotLabel: string | null;
  chainStatus: "open" | "closed";
  recordCount: number;
  lastRecordAt: Date | null;
  lastRecordType: string | null;
  /** `true` si algún registro del animal no está confirmado. */
  hasUnconfirmed: boolean;
  /** `true` si el término de búsqueda coincidió con un identificador ya reemplazado. */
  matchedHistoricalIdentifier: boolean;
}

/**
 * Busca por identificador activo **o histórico** (docs/02, R3.5): el número de una caravana
 * reemplazada es el número que alguien va a tipear. También matchea el ULID interno.
 */
export async function listAnimals(
  orgIds: readonly string[],
  search?: string,
): Promise<AnimalListItem[]> {
  if (orgIds.length === 0) return [];

  const term = search ? normalizeSearchTerm(search) : "";
  const where: Prisma.AnimalWhereInput = {
    orgId: { in: [...orgIds] },
    ...(term
      ? {
          OR: [
            { identifiers: { some: { identifier: { contains: term } } } },
            { id: { startsWith: term.toUpperCase() } },
          ],
        }
      : {}),
  };

  const animals = await db.animal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      chainStatus: true,
      recordCount: true,
      currentLot: { select: { publicLabel: true } },
      identifiers: {
        select: {
          identifier: true,
          identifierKind: true,
          detectedFormat: true,
          replacedAt: true,
        },
        orderBy: { assignedAt: "desc" },
      },
      records: {
        select: { type: true, occurredAt: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return animals.map((animal) => {
    const active =
      animal.identifiers.find((i) => i.replacedAt === null) ?? null;
    const last = animal.records[0] ?? null;

    return {
      id: animal.id,
      identifier: active?.identifier ?? null,
      identifierKind: active?.identifierKind ?? null,
      detectedFormat: active?.detectedFormat ?? null,
      lotLabel: animal.currentLot?.publicLabel ?? null,
      chainStatus: animal.chainStatus,
      recordCount: animal.recordCount,
      lastRecordAt: last?.occurredAt ?? null,
      lastRecordType: last?.type ?? null,
      hasUnconfirmed: animal.records.some((r) => r.status !== "confirmed"),
      matchedHistoricalIdentifier:
        term.length > 0 &&
        animal.identifiers.some(
          (i) => i.replacedAt !== null && i.identifier.includes(term),
        ),
    };
  });
}

const animalDetailSelect = {
  id: true,
  orgId: true,
  species: true,
  birthDate: true,
  chainStatus: true,
  recordCount: true,
  lastContentHash: true,
  createdAt: true,
  organization: { select: { name: true } },
  currentLot: { select: { id: true, name: true, publicLabel: true } },
  identifiers: { orderBy: { assignedAt: "desc" } },
  records: {
    orderBy: { seq: "desc" },
    select: {
      recordId: true,
      type: true,
      seq: true,
      status: true,
      terminal: true,
      occurredAt: true,
      recordedAt: true,
      data: true,
      contentHash: true,
      prevHash: true,
      canonicalPayload: true,
      txHash: true,
      ledger: true,
      rectifiesRecordId: true,
      rectifiedBy: { select: { recordId: true, seq: true } },
      author: { select: { name: true } },
      outbox: { select: { status: true, attempts: true, lastError: true } },
    },
  },
} satisfies Prisma.AnimalSelect;

export type AnimalDetail = Prisma.AnimalGetPayload<{
  select: typeof animalDetailSelect;
}>;
export type AnimalRecord = AnimalDetail["records"][number];

/** Detalle operativo. Devuelve `null` si no existe o no es de una organización del usuario. */
export async function getAnimalDetail(
  animalId: string,
  orgIds: readonly string[],
): Promise<AnimalDetail | null> {
  if (orgIds.length === 0) return null;
  return db.animal.findFirst({
    where: { id: animalId, orgId: { in: [...orgIds] } },
    select: animalDetailSelect,
  });
}

/** Establecimientos y lotes para los selectores del alta. */
export async function getWriteTargets(orgIds: readonly string[]) {
  if (orgIds.length === 0) return { establishments: [], lots: [] };
  const [establishments, lots] = await Promise.all([
    db.establishment.findMany({
      where: { orgId: { in: [...orgIds] } },
      select: { id: true, orgId: true, name: true, publicLabel: true },
      orderBy: { name: "asc" },
    }),
    db.lot.findMany({
      where: { orgId: { in: [...orgIds] }, active: true },
      select: {
        id: true,
        orgId: true,
        establishmentId: true,
        name: true,
        publicLabel: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);
  return { establishments, lots };
}

/**
 * La dieta vigente: la base está en `registration.initial_diet` y los `feeding` son solo
 * cambios, así que leer `feeding` sola sugeriría que el animal nunca comió (docs/05).
 */
export function currentDiet(
  records: readonly AnimalRecord[],
): { diet: string; since: Date } | null {
  const ordered = [...records].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  let diet: { diet: string; since: Date } | null = null;

  for (const record of ordered) {
    const data = record.data as Record<string, unknown>;
    if (
      record.type === "registration" &&
      typeof data.initial_diet === "string"
    ) {
      diet = { diet: data.initial_diet, since: record.occurredAt };
    }
    if (record.type === "feeding" && typeof data.diet === "string") {
      diet = { diet: data.diet, since: record.occurredAt };
    }
  }
  return diet;
}
