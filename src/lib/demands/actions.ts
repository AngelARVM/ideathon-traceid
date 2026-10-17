"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import type { ActionResult } from "@/lib/action-result";
import { newId } from "@/lib/ids";
import { AuthorizationError, requirePersona } from "@/lib/persona";
import { demandIdSchema, demandInput, demandSchema } from "./validation";

async function requireBuyer() {
  try {
    return await requirePersona("buyer");
  } catch (error) {
    if (error instanceof AuthorizationError) return null;
    throw error;
  }
}

function invalidateDemand(id: string) {
  revalidatePath("/demands");
  revalidatePath("/my-demands");
  revalidatePath(`/demands/${id}`);
  revalidatePath(`/demands/${id}/edit`);
}

async function validateInput(formData: FormData, localityId: string) {
  const result = demandSchema.safeParse(demandInput(formData, localityId));
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      fieldErrors[field] ??= issue.message;
    }
    return {
      ok: false as const,
      error: "Revisá los campos indicados.",
      fieldErrors,
    };
  }
  const locality = await db.locality.findUnique({
    where: { id: result.data.localityId },
    select: { id: true },
  });
  if (!locality) {
    return {
      ok: false as const,
      error: "Revisá la localidad.",
      fieldErrors: { localityId: "La localidad no existe." },
    };
  }
  return { ok: true as const, data: result.data };
}

export async function createDemand(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const persona = await requireBuyer();
  if (!persona)
    return {
      ok: false,
      error: "Solo los compradores pueden publicar demandas.",
    };
  const input = await validateInput(formData, persona.localityId);
  if (!input.ok) return input;
  const demand = await db.demand.create({
    data: { id: newId(), buyerId: persona.id, ...input.data },
  });
  invalidateDemand(demand.id);
  redirect(`/demands/${demand.id}`);
}

export async function updateDemand(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const persona = await requireBuyer();
  if (!persona)
    return { ok: false, error: "Solo los compradores pueden editar demandas." };
  const id = demandIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "La demanda no es válida." };
  const input = await validateInput(formData, persona.localityId);
  if (!input.ok) return input;
  // Ownership and state are checked in the same write, including concurrent withdrawals.
  const result = await db.demand.updateMany({
    where: { id: id.data, buyerId: persona.id, status: "open" },
    data: input.data,
  });
  if (result.count === 0)
    return {
      ok: false,
      error: "La demanda no existe, fue retirada o no te pertenece.",
    };
  invalidateDemand(id.data);
  redirect(`/demands/${id.data}`);
}

export async function withdrawDemand(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const persona = await requireBuyer();
  if (!persona)
    return {
      ok: false,
      error: "Solo los compradores pueden retirar demandas.",
    };
  const id = demandIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "La demanda no es válida." };
  const result = await db.demand.updateMany({
    where: { id: id.data, buyerId: persona.id, status: "open" },
    data: { status: "withdrawn" },
  });
  if (result.count === 0)
    return {
      ok: false,
      error: "La demanda no existe, ya fue retirada o no te pertenece.",
    };
  invalidateDemand(id.data);
  return { ok: true };
}
