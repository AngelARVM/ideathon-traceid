"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import type { ActionResult } from "@/lib/action-result";
import { newId } from "@/lib/ids";
import {
  type OfferFormMode,
  type OfferInput,
  parseOfferForm,
} from "@/lib/offers/schema";
import {
  AuthorizationError,
  type PersonaWithLocality,
  requirePersona,
} from "@/lib/persona";

// Mutaciones de ofertas (M1). El vendedor sale siempre de la cookie de persona, nunca del
// formulario: toda escritura filtra por `sellerId: persona.id` (docs/00-mvp-spec.md §7, §9).

const NOT_FOUND = "La oferta no existe o no es tuya.";

/** Persona vendedora, o el error de autorización como `ActionResult`. Sin persona redirige a `/`. */
async function requireSeller(): Promise<
  { ok: true; persona: PersonaWithLocality } | { ok: false; error: string }
> {
  try {
    return { ok: true, persona: await requirePersona("seller") };
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { ok: false, error: "Solo un vendedor puede gestionar ofertas." };
    }
    throw e;
  }
}

function revalidateOffer(id: string) {
  revalidatePath("/offers");
  revalidatePath("/my-offers");
  revalidatePath(`/offers/${id}`);
}

/** Valida el formulario y la localidad (por defecto, la de la persona). */
async function readInput(
  formData: FormData,
  mode: OfferFormMode,
  persona: PersonaWithLocality,
): Promise<
  | { ok: true; data: OfferInput & { localityId: string } }
  | (ActionResult & { ok: false })
> {
  const parsed = parseOfferForm(formData, mode);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "Revisá los campos marcados.",
      fieldErrors: parsed.fieldErrors,
    };
  }
  const localityId = parsed.data.localityId ?? persona.localityId;
  const locality = await db.locality.findUnique({
    where: { id: localityId },
    select: { id: true },
  });
  if (!locality) {
    return {
      ok: false,
      error: "Revisá los campos marcados.",
      fieldErrors: { localityId: "Elegí una localidad de la lista." },
    };
  }
  return { ok: true, data: { ...parsed.data, localityId } };
}

export async function createOffer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireSeller();
  if (!auth.ok) return auth;
  const input = await readInput(formData, "create", auth.persona);
  if (!input.ok) return input;

  const id = newId();
  await db.offer.create({
    data: { ...input.data, id, sellerId: auth.persona.id },
  });

  revalidateOffer(id);
  redirect(`/offers/${id}`);
}

export async function updateOffer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireSeller();
  if (!auth.ok) return auth;
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, error: NOT_FOUND };
  const input = await readInput(formData, "update", auth.persona);
  if (!input.ok) return input;

  // Editar no toca propuestas ni acuerdos: los acuerdos tienen su propio snapshot (§8.1).
  const { count } = await db.offer.updateMany({
    where: { id, sellerId: auth.persona.id, status: { not: "withdrawn" } },
    data: input.data,
  });
  if (count === 0) return { ok: false, error: NOT_FOUND };

  revalidateOffer(id);
  redirect(`/offers/${id}`);
}

export async function withdrawOffer(id: string): Promise<ActionResult> {
  const auth = await requireSeller();
  if (!auth.ok) return auth;

  const { count } = await db.offer.updateMany({
    where: { id, sellerId: auth.persona.id, status: { not: "withdrawn" } },
    data: { status: "withdrawn" },
  });
  if (count === 0) {
    return {
      ok: false,
      error: "La oferta no existe, no es tuya o ya está retirada.",
    };
  }

  revalidateOffer(id);
  return { ok: true };
}

export async function markOfferAvailable(id: string): Promise<ActionResult> {
  const auth = await requireSeller();
  if (!auth.ok) return auth;

  const { count } = await db.offer.updateMany({
    where: { id, sellerId: auth.persona.id, status: "estimated" },
    data: { status: "available", estimatedDate: null },
  });
  if (count === 0) {
    return {
      ok: false,
      error: "La oferta no existe, no es tuya o no está estimada.",
    };
  }

  revalidateOffer(id);
  return { ok: true };
}
