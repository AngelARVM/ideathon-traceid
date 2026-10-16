import "server-only";

/**
 * El camino de escritura (docs/08, S2; docs/04, D3/D4).
 *
 * Toda escritura hace lo mismo y en este orden: validar → `requireMembership` → construir el
 * payload → hashear → insertar `records` **y** `outbox` en una sola transacción. Nunca se
 * envía nada a la cadena desde acá: eso es trabajo del drainer.
 *
 * ## De dónde sale el `seq` en S2
 *
 * El `seq` y el `prev_hash` están **dentro** del hash y la autoridad sobre el `seq` es el
 * contrato, lo que parece una contradicción con hashear en el momento del insert. Se resuelve
 * así: la transacción toma un lock sobre la fila del animal, lee las columnas espejo
 * (`record_count`, `last_content_hash`), y construye el payload para `seq = record_count + 1`
 * de forma **optimista**. Las columnas espejo avanzan en el mismo insert, que es lo que permite
 * cargar dos hitos seguidos antes de que el drainer corra.
 *
 * En S4 el submitter real relee el header del contrato antes de firmar y, si la vista del
 * contrato avanzó, **recalcula** el payload para el nuevo `seq` (docs/04, D5) — nunca lo
 * parchea, porque el hash cambiaría. Es decir: estas columnas son una predicción, y el contrato
 * es el que decide. En S2 el drainer stub es el único escritor, así que la predicción siempre
 * acierta.
 */

import { db } from "@/db";
import type { MembershipRole, RecordType } from "@/generated/prisma/enums";
import { normalizeIdentifier } from "@/lib/identifiers";
import { newId } from "@/lib/ids";
import { requireMembership } from "@/lib/session";
import { type Bytes, bytesToHex } from "./canonical";
import { buildPayload, GENESIS_PREV_HASH } from "./payload";
import { RECORD_TYPES, recordDataSchemas } from "./types";

/**
 * Quién puede escribir. Los cuatro roles cargan hitos; cerrar la cadena es irreversible, así
 * que queda en `owner` y `admin` (docs/02, R6.3: los roles existen y se chequean aunque no
 * haya flujo de asignación).
 */
const CAN_APPEND: readonly MembershipRole[] = [
  "owner",
  "admin",
  "operator",
  "professional",
];
const CAN_CLOSE: readonly MembershipRole[] = ["owner", "admin"];

export class WriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WriteError";
  }
}

export class ChainClosedError extends WriteError {
  constructor() {
    super(
      "La cadena de este animal está cerrada: solo se pueden registrar rectificaciones. " +
        "En S4 esto además lo rechaza el contrato.",
    );
    this.name = "ChainClosedError";
  }
}

export interface AppendRecordInput {
  /** ULID generado en el cliente: es la clave de idempotencia (docs/04, D4). */
  recordId: string;
  animalId: string;
  type: RecordType;
  occurredAt: Date;
  data: Record<string, unknown>;
}

export interface AppendRecordResult {
  recordId: string;
  seq: number;
  contentHashHex: string;
  terminal: boolean;
  /** `true` si el `record_id` ya existía y no se escribió nada nuevo. */
  deduplicated: boolean;
}

/** Fila del animal con lo mínimo que hace falta para encadenar, ya bloqueada. */
interface LockedAnimal {
  id: string;
  org_id: string;
  chain_status: "open" | "closed";
  record_count: number;
  last_content_hash: Bytes | null;
}

/**
 * Agrega un record al animal. Único punto de escritura para los once tipos, incluidos los
 * terminales y las rectificaciones, para que el ciclo de vida del outbox no tenga variantes.
 */
export async function appendRecord(
  input: AppendRecordInput,
): Promise<AppendRecordResult> {
  const meta = RECORD_TYPES[input.type];
  if (!meta) throw new WriteError(`Tipo de record desconocido: ${input.type}`);

  // Validación antes de cualquier consulta: un payload inválido no merece una transacción.
  const parsed = recordDataSchemas[input.type].safeParse(input.data);
  if (!parsed.success) {
    throw new WriteError(
      parsed.error.issues[0]?.message ?? "Datos del hito inválidos.",
    );
  }

  const animalOrg = await db.animal.findUnique({
    where: { id: input.animalId },
    select: { orgId: true },
  });
  if (!animalOrg) throw new WriteError("El animal no existe.");

  // Punto único de autorización. Nunca confiar en que la UI ocultó la acción.
  const { user } = await requireMembership(
    animalOrg.orgId,
    meta.terminal ? CAN_CLOSE : CAN_APPEND,
  );

  // Se fija una sola vez, acá, y nunca se re-estampa: está dentro del hash (docs/05).
  const recordedAt = new Date();

  return db.$transaction(async (tx) => {
    // Idempotencia: si el ULID del cliente ya está, devolvemos lo que hay sin escribir.
    const existing = await tx.record.findUnique({
      where: { recordId: input.recordId },
      select: { recordId: true, seq: true, contentHash: true, terminal: true },
    });
    if (existing) {
      return {
        recordId: existing.recordId,
        seq: existing.seq ?? 0,
        contentHashHex: bytesToHex(existing.contentHash),
        terminal: existing.terminal,
        deduplicated: true,
      };
    }

    // `FOR UPDATE` serializa los appends concurrentes sobre el mismo animal, que es lo que
    // evita que dos hitos simultáneos reclamen el mismo `seq`.
    const [animal] = await tx.$queryRaw<LockedAnimal[]>`
      SELECT id, org_id, chain_status, record_count, last_content_hash
      FROM animals WHERE id = ${input.animalId} FOR UPDATE
    `;
    if (!animal) throw new WriteError("El animal no existe.");

    // Una rectificación sirve con la cadena abierta o cerrada; nada más pasa de acá (docs/06).
    if (animal.chain_status === "closed" && meta.kind !== "rectification") {
      throw new ChainClosedError();
    }

    if (input.type === "rectification") {
      const target = (parsed.data as { rectifies_record_id: string })
        .rectifies_record_id;
      const original = await tx.record.findUnique({
        where: { recordId: target },
        select: { animalId: true, type: true },
      });
      if (!original || original.animalId !== input.animalId) {
        throw new WriteError(
          "El registro que querés rectificar no pertenece a este animal.",
        );
      }
      if (original.type === "rectification") {
        throw new WriteError(
          "No se rectifica una rectificación: rectificá el registro original.",
        );
      }
    }

    const seq = animal.record_count + 1;
    const prevHash =
      seq === 1 ? null : (animal.last_content_hash ?? GENESIS_PREV_HASH);

    const built = buildPayload({
      recordId: input.recordId,
      animalId: input.animalId,
      orgId: animal.org_id,
      authorId: user.id,
      type: input.type,
      occurredAt: input.occurredAt,
      recordedAt,
      seq,
      prevHash,
      data: parsed.data as Record<string, unknown>,
    });

    await tx.record.create({
      data: {
        recordId: input.recordId,
        animalId: input.animalId,
        orgId: animal.org_id,
        authorId: user.id,
        type: input.type,
        occurredAt: input.occurredAt,
        recordedAt,
        terminal: built.terminal,
        rectifiesRecordId:
          input.type === "rectification"
            ? (parsed.data as { rectifies_record_id: string })
                .rectifies_record_id
            : null,
        data: parsed.data as object,
        canonicalPayload: built.canonicalPayload,
        contentHash: built.contentHash,
        seq,
        prevHash: built.prevHash,
        status: "pending",
        // Misma transacción que el record: es el punto de todo el patrón (docs/04, D3).
        outbox: { create: { id: newId(), status: "pending" } },
      },
    });

    await tx.animal.update({
      where: { id: input.animalId },
      data: {
        recordCount: seq,
        lastContentHash: built.contentHash,
        ...(built.terminal ? { chainStatus: "closed" as const } : {}),
      },
    });

    return {
      recordId: input.recordId,
      seq,
      contentHashHex: bytesToHex(built.contentHash),
      terminal: built.terminal,
      deduplicated: false,
    };
  });
}

export interface CreateAnimalInput {
  /** ULID generado en el cliente: es también la clave de la cadena (docs/02, R3.1). */
  animalId: string;
  recordId: string;
  orgId: string;
  identifier: string;
  /** Si el operador declaró explícitamente que es una caravana interna. */
  internalTag?: boolean;
  establishmentId: string;
  lotId?: string;
  initialDiet: string;
  birthDate?: string;
  occurredAt: Date;
}

export interface CreateAnimalResult extends AppendRecordResult {
  animalId: string;
  /** Aviso no bloqueante del validador de identificadores (R3.4). */
  identifierWarning: string | null;
}

/**
 * Crea el animal y su `registration` como una sola escritura en la cadena (docs/03, flujo B).
 * El animal, su primer identificador, su historia de lote y el record nacen juntos o no nacen.
 */
export async function createAnimal(
  input: CreateAnimalInput,
): Promise<CreateAnimalResult> {
  const { user } = await requireMembership(input.orgId, CAN_APPEND);

  const normalized = normalizeIdentifier(input.identifier, {
    kind: input.internalTag ? "internal_tag" : undefined,
  });

  const establishment = await db.establishment.findUnique({
    where: { id: input.establishmentId },
    select: { orgId: true, publicLabel: true },
  });
  if (!establishment || establishment.orgId !== input.orgId) {
    throw new WriteError("El establecimiento no pertenece a tu organización.");
  }

  const lot = input.lotId
    ? await db.lot.findUnique({
        where: { id: input.lotId },
        select: { orgId: true, publicLabel: true },
      })
    : null;
  if (input.lotId && (!lot || lot.orgId !== input.orgId)) {
    throw new WriteError("El lote no pertenece a tu organización.");
  }

  const recordedAt = new Date();

  const built = buildPayload({
    recordId: input.recordId,
    animalId: input.animalId,
    orgId: input.orgId,
    authorId: user.id,
    type: "registration",
    occurredAt: input.occurredAt,
    recordedAt,
    // Por definición es el primero de la cadena.
    seq: 1,
    prevHash: null,
    data: {
      identifier: normalized.value,
      identifier_kind: normalized.kind,
      establishment_id: input.establishmentId,
      establishment_label: establishment.publicLabel,
      ...(lot ? { lot_label: lot.publicLabel } : {}),
      initial_diet: input.initialDiet,
      ...(input.birthDate ? { birth_date: input.birthDate } : {}),
    },
  });

  try {
    await db.$transaction(async (tx) => {
      await tx.animal.create({
        data: {
          id: input.animalId,
          orgId: input.orgId,
          birthDate: input.birthDate
            ? new Date(`${input.birthDate}T00:00:00Z`)
            : null,
          currentLotId: input.lotId ?? null,
          chainStatus: "open",
          recordCount: 1,
          lastContentHash: built.contentHash,
          identifiers: {
            create: {
              id: newId(),
              orgId: input.orgId,
              identifier: normalized.value,
              identifierKind: normalized.kind,
              detectedFormat: normalized.detectedFormat,
            },
          },
          ...(input.lotId
            ? {
                lotHistory: {
                  create: { id: newId(), lotId: input.lotId, movedBy: user.id },
                },
              }
            : {}),
        },
      });

      await tx.record.create({
        data: {
          recordId: input.recordId,
          animalId: input.animalId,
          orgId: input.orgId,
          authorId: user.id,
          type: "registration",
          occurredAt: input.occurredAt,
          recordedAt,
          terminal: false,
          data: JSON.parse(built.canonicalPayload).data,
          canonicalPayload: built.canonicalPayload,
          contentHash: built.contentHash,
          seq: 1,
          prevHash: null,
          status: "pending",
          outbox: { create: { id: newId(), status: "pending" } },
        },
      });
    });
  } catch (err) {
    // El índice único parcial `animal_identifiers_active_value_per_org_uq` es lo que evita
    // cadenas duplicadas (docs/04, D11); acá se traduce a algo que el operador entienda.
    if (isUniqueViolation(err, "animal_identifiers_active_value_per_org_uq")) {
      throw new WriteError(
        `Ya existe un animal activo con el identificador ${normalized.value} en tu organización.`,
      );
    }
    throw err;
  }

  return {
    animalId: input.animalId,
    recordId: input.recordId,
    seq: 1,
    contentHashHex: bytesToHex(built.contentHash),
    terminal: false,
    deduplicated: false,
    identifierWarning: normalized.warning,
  };
}

/**
 * Prisma 7 no expone el nombre del índice en un lugar estable: con el adaptador `pg` viaja
 * anidado en `meta.driverAdapterError.cause.constraint.index`. Se busca sobre el `meta`
 * serializado para no depender de esa forma, que es interna del adaptador.
 */
function isUniqueViolation(err: unknown, constraint: string): boolean {
  const known = (err ?? {}) as { code?: string; meta?: unknown };
  if (known.code !== "P2002") return false;
  return JSON.stringify(known.meta ?? "").includes(constraint);
}
