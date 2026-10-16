"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import type { RecordType } from "@/generated/prisma/enums";
import { IdentifierError } from "@/lib/identifiers";
import { drainOutbox } from "@/lib/outbox/drain";
import { PayloadTooLargeError } from "@/lib/records/payload";
import { recordDataSchemas } from "@/lib/records/types";
import { appendRecord, createAnimal, WriteError } from "@/lib/records/write";
import { AuthorizationError } from "@/lib/session";

export interface ActionState {
  error?: string;
  /** Aviso no bloqueante: la escritura se hizo igual (docs/02, R3.4). */
  warning?: string;
}

/**
 * Traduce los errores esperados a algo que el operador entienda y deja pasar el resto.
 * Un error inesperado tiene que llegar al log, no convertirse en un cartel amable.
 */
function toState(err: unknown): ActionState {
  if (
    err instanceof WriteError ||
    err instanceof IdentifierError ||
    err instanceof PayloadTooLargeError ||
    err instanceof AuthorizationError
  ) {
    return { error: err.message };
  }
  throw err;
}

const ulidField = z.string().length(26, "Identificador interno inválido.");

/** `datetime-local` llega sin zona; se interpreta como hora local del servidor. */
const occurredAtField = z
  .string()
  .min(1, "Indicá cuándo pasó el hecho.")
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.getTime()), "Fecha inválida.")
  .refine(
    (date) => date.getTime() <= Date.now() + 60_000,
    "El hecho no puede ser futuro.",
  );

const createAnimalSchema = z.object({
  animalId: ulidField,
  recordId: ulidField,
  orgId: ulidField,
  identifier: z.string().min(1, "Ingresá el identificador de la caravana."),
  internalTag: z.coerce.boolean().optional(),
  establishmentId: ulidField,
  lotId: z.union([ulidField, z.literal("")]).optional(),
  initialDiet: z.string().min(1, "La dieta base es obligatoria.").max(200),
  birthDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
    .optional(),
  occurredAt: occurredAtField,
});

export async function createAnimalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createAnimalSchema.safeParse({
    ...Object.fromEntries(formData),
    internalTag: formData.get("internalTag") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  let result: Awaited<ReturnType<typeof createAnimal>>;
  try {
    result = await createAnimal({
      animalId: parsed.data.animalId,
      recordId: parsed.data.recordId,
      orgId: parsed.data.orgId,
      identifier: parsed.data.identifier,
      internalTag: parsed.data.internalTag,
      establishmentId: parsed.data.establishmentId,
      lotId: parsed.data.lotId || undefined,
      initialDiet: parsed.data.initialDiet,
      birthDate: parsed.data.birthDate || undefined,
      occurredAt: parsed.data.occurredAt,
    });
  } catch (err) {
    return toState(err);
  }

  revalidatePath("/animals");
  // El aviso de formato viaja en la URL: después del redirect no hay estado de acción.
  const warning = result.identifierWarning
    ? `?aviso=${encodeURIComponent(result.identifierWarning)}`
    : "";
  redirect(`/animals/${result.animalId}${warning}`);
}

const appendSchema = z.object({
  animalId: ulidField,
  recordId: ulidField,
  type: z.string(),
  occurredAt: occurredAtField,
});

/**
 * Carga un hito. Los campos específicos del tipo se extraen del `FormData` con el prefijo
 * `data.` y los valida el esquema Zod del tipo, no esta función.
 */
export async function appendRecordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = appendSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const type = parsed.data.type as RecordType;
  if (!(type in recordDataSchemas))
    return { error: "Tipo de hito desconocido." };

  const data: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("data.") || typeof value !== "string") continue;
    const field = key.slice("data.".length);
    if (value.trim() === "") continue;
    data[field] = value;
  }

  // Los kilos se convierten acá, en el borde: el payload lleva gramos enteros (docs/05).
  const kg = formData.get("weight_kg");
  if (typeof kg === "string" && kg.trim() !== "") {
    const grams = Math.round(Number(kg) * 1000);
    if (!Number.isFinite(grams) || grams <= 0)
      return { error: "Ingresá un peso válido en kilos." };
    data.weight_g = grams;
  }

  try {
    await appendRecord({
      recordId: parsed.data.recordId,
      animalId: parsed.data.animalId,
      type,
      occurredAt: parsed.data.occurredAt,
      data,
    });
  } catch (err) {
    return toState(err);
  }

  revalidatePath(`/animals/${parsed.data.animalId}`);
  redirect(`/animals/${parsed.data.animalId}`);
}

const closeSchema = appendSchema.extend({
  type: z.enum(["death", "slaughterhouse_delivery"]),
  confirmation: z.literal("CERRAR", {
    message: "Escribí CERRAR para confirmar que entendés que es irreversible.",
  }),
});

/** Cierre explícito con confirmación tipeada (docs/03, flujo E). */
export async function closeChainAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = closeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const data: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (
      key.startsWith("data.") &&
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      data[key.slice("data.".length)] = value;
    }
  }

  try {
    await appendRecord({
      recordId: parsed.data.recordId,
      animalId: parsed.data.animalId,
      type: parsed.data.type,
      occurredAt: parsed.data.occurredAt,
      data,
    });
  } catch (err) {
    return toState(err);
  }

  revalidatePath(`/animals/${parsed.data.animalId}`);
  redirect(`/animals/${parsed.data.animalId}`);
}

const rectifySchema = z.object({
  animalId: ulidField,
  recordId: ulidField,
  rectifiesRecordId: ulidField,
  reason: z.string().min(1, "Explicá qué se corrige.").max(280),
  occurredAt: occurredAtField,
});

/** Rectificación: los dos registros quedan y se muestran (docs/02, R7). */
export async function rectifyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = rectifySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    await appendRecord({
      recordId: parsed.data.recordId,
      animalId: parsed.data.animalId,
      type: "rectification",
      occurredAt: parsed.data.occurredAt,
      data: {
        rectifies_record_id: parsed.data.rectifiesRecordId,
        reason: parsed.data.reason,
      },
    });
  } catch (err) {
    return toState(err);
  }

  revalidatePath(`/animals/${parsed.data.animalId}`);
  redirect(`/animals/${parsed.data.animalId}`);
}

/**
 * Corre el drainer desde la UI. Es la misma invocación manual que `npm run outbox:drain`:
 * sirve para mostrar el ciclo `pending → confirmed` en la demo sin salir a una terminal.
 */
export async function drainAction(animalId?: string): Promise<void> {
  await drainOutbox({ db });
  if (animalId) revalidatePath(`/animals/${animalId}`);
  revalidatePath("/animals");
}
