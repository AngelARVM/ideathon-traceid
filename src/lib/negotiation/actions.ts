"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import type { Role } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";
import { parsePrice, parseTons } from "@/lib/decimal";
import { formatTons } from "@/lib/format";
import { newId } from "@/lib/ids";
import { requirePersona } from "@/lib/persona";
import {
  confirmBlockReason,
  effectiveTerms,
  exceeds,
  OPEN_PROPOSAL_STATUSES,
  totalAmount,
} from "./terms";

// Server actions de la negociación (docs/00-mvp-spec.md §8.2, §8.3). Todas se usan con
// `useActionState`: reciben `(prevState, formData)` y el id llega ligado con `.bind`. Los ids de
// comprador y vendedor salen siempre de la persona, nunca del cliente (§7).

/** Resultado con un aviso no bloqueante (D8). */
export type WarningResult = ActionResult<{ warning?: string }>;

/** Error de `createProposal` que puede enlazar a la propuesta abierta existente. */
export type CreateProposalResult = ActionResult & {
  existingProposalId?: string;
};

const UNAUTHORIZED = "No tenés permiso para esta acción.";

/** Sin persona redirige a `/`; con otro rol devuelve `null` para responder con un error. */
async function personaWithRole(role: Role) {
  const persona = await requirePersona();
  return persona.role === role ? persona : null;
}

const optionalText = z
  .string()
  .trim()
  .max(500, "Máximo 500 caracteres.")
  .transform((s) => s || null);

const text = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

function revalidateProposal(id: string, offerId: string) {
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${id}`);
  revalidatePath(`/offers/${offerId}`);
}

// ── Comprador: proponer ──────────────────────────────────────────────────────

export async function createProposal(
  offerId: string,
  _prev: CreateProposalResult | null,
  formData: FormData,
): Promise<CreateProposalResult> {
  const persona = await personaWithRole("buyer");
  if (!persona) return { ok: false, error: UNAUTHORIZED };

  const quantity = parseTons(text(formData, "quantityTons"));
  const price = parsePrice(text(formData, "pricePerTon"));
  const message = optionalText.safeParse(text(formData, "message"));
  const fieldErrors: Record<string, string> = {};
  if (!quantity.ok) fieldErrors.quantityTons = quantity.error;
  if (!price.ok) fieldErrors.pricePerTon = price.error;
  if (!message.success) fieldErrors.message = message.error.issues[0].message;
  if (!quantity.ok || !price.ok || !message.success) {
    return {
      ok: false,
      error: "Revisá los datos de la propuesta.",
      fieldErrors,
    };
  }

  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { id: true, status: true, quantityTons: true },
  });
  if (!offer || offer.status === "withdrawn") {
    return { ok: false, error: "La oferta no admite propuestas." };
  }
  if (offer.quantityTons.lte(0)) {
    return { ok: false, error: "La oferta está agotada." };
  }
  if (exceeds(quantity.value, offer.quantityTons)) {
    return {
      ok: false,
      error: "Revisá los datos de la propuesta.",
      fieldErrors: {
        quantityTons: `Supera el stock disponible (${formatTons(offer.quantityTons)}).`,
      },
    };
  }

  const open = await db.proposal.findFirst({
    where: {
      offerId,
      buyerId: persona.id,
      status: { in: [...OPEN_PROPOSAL_STATUSES] },
    },
    select: { id: true },
  });
  if (open) {
    return {
      ok: false,
      error: "Ya tenés una propuesta abierta sobre esta oferta.",
      existingProposalId: open.id,
    };
  }

  const id = newId();
  await db.proposal.create({
    data: {
      id,
      offerId,
      buyerId: persona.id,
      quantityTons: quantity.value,
      pricePerTon: price.value,
      message: message.data,
    },
  });

  revalidateProposal(id, offerId);
  redirect(`/proposals/${id}`);
}

// ── Vendedor: responder ──────────────────────────────────────────────────────

/** Aviso de D8: la aceptación no bloquea por stock, pero lo informa. */
async function stockWarning(id: string): Promise<string | undefined> {
  const p = await db.proposal.findUnique({
    where: { id },
    include: { offer: { select: { quantityTons: true } } },
  });
  if (!p) return undefined;
  const { quantityTons } = effectiveTerms(p);
  return exceeds(quantityTons, p.offer.quantityTons)
    ? `La cantidad supera el stock actual (${formatTons(p.offer.quantityTons)}). El comprador no podrá confirmar hasta que haya stock suficiente.`
    : undefined;
}

async function offerIdOf(id: string) {
  const p = await db.proposal.findUnique({
    where: { id },
    select: { offerId: true },
  });
  return p?.offerId;
}

export async function acceptProposal(
  id: string,
  _prev: WarningResult | null,
  _formData: FormData,
): Promise<WarningResult> {
  const persona = await personaWithRole("seller");
  if (!persona) return { ok: false, error: UNAUTHORIZED };

  const { count } = await db.proposal.updateMany({
    where: {
      id,
      status: "pending",
      offer: { sellerId: persona.id, status: { not: "withdrawn" } },
    },
    data: { status: "accepted", respondedAt: new Date() },
  });
  if (count === 0) {
    return { ok: false, error: "La propuesta ya no se puede aceptar." };
  }

  const offerId = await offerIdOf(id);
  if (offerId) revalidateProposal(id, offerId);
  return { ok: true, data: { warning: await stockWarning(id) } };
}

export async function rejectProposal(
  id: string,
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  const persona = await personaWithRole("seller");
  if (!persona) return { ok: false, error: UNAUTHORIZED };

  const { count } = await db.proposal.updateMany({
    where: { id, status: "pending", offer: { sellerId: persona.id } },
    data: { status: "rejected", respondedAt: new Date() },
  });
  if (count === 0) {
    return { ok: false, error: "La propuesta ya no se puede rechazar." };
  }

  const offerId = await offerIdOf(id);
  if (offerId) revalidateProposal(id, offerId);
  return { ok: true };
}

export async function counterProposal(
  id: string,
  _prev: WarningResult | null,
  formData: FormData,
): Promise<WarningResult> {
  const persona = await personaWithRole("seller");
  if (!persona) return { ok: false, error: UNAUTHORIZED };

  const rawQuantity = text(formData, "counterQuantityTons").trim();
  const rawPrice = text(formData, "counterPricePerTon").trim();
  const quantity = rawQuantity ? parseTons(rawQuantity) : null;
  const price = rawPrice ? parsePrice(rawPrice) : null;
  const message = optionalText.safeParse(text(formData, "counterMessage"));

  const fieldErrors: Record<string, string> = {};
  if (quantity && !quantity.ok)
    fieldErrors.counterQuantityTons = quantity.error;
  if (price && !price.ok) fieldErrors.counterPricePerTon = price.error;
  if (!message.success) {
    fieldErrors.counterMessage = message.error.issues[0].message;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Revisá la contraoferta.", fieldErrors };
  }
  if (!quantity && !price) {
    return {
      ok: false,
      error: "Indicá una cantidad o un precio nuevos.",
    };
  }

  const original = await db.proposal.findFirst({
    where: {
      id,
      status: "pending",
      offer: { sellerId: persona.id, status: { not: "withdrawn" } },
    },
    select: { offerId: true, quantityTons: true, pricePerTon: true },
  });
  if (!original) {
    return { ok: false, error: "La propuesta ya no se puede contraofertar." };
  }

  const counterQuantityTons = quantity?.ok
    ? quantity.value
    : original.quantityTons.toString();
  const counterPricePerTon = price?.ok
    ? price.value
    : original.pricePerTon.toString();
  if (
    original.quantityTons.eq(counterQuantityTons) &&
    original.pricePerTon.eq(counterPricePerTon)
  ) {
    return {
      ok: false,
      error: "La contraoferta tiene que cambiar la cantidad o el precio.",
    };
  }

  const { count } = await db.proposal.updateMany({
    where: { id, status: "pending" },
    data: {
      status: "countered",
      counterQuantityTons,
      counterPricePerTon,
      counterMessage: message.data,
      respondedAt: new Date(),
    },
  });
  if (count === 0) {
    return { ok: false, error: "La propuesta ya no se puede contraofertar." };
  }

  revalidateProposal(id, original.offerId);
  return { ok: true, data: { warning: await stockWarning(id) } };
}

// ── Comprador: cerrar ────────────────────────────────────────────────────────

export async function rejectCounter(
  id: string,
  _prev: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  const persona = await personaWithRole("buyer");
  if (!persona) return { ok: false, error: UNAUTHORIZED };

  const { count } = await db.proposal.updateMany({
    where: { id, buyerId: persona.id, status: "countered" },
    data: { status: "rejected" },
  });
  if (count === 0) {
    return { ok: false, error: "La contraoferta ya no se puede rechazar." };
  }

  const offerId = await offerIdOf(id);
  if (offerId) revalidateProposal(id, offerId);
  return { ok: true };
}

/** Error esperado dentro de la transacción: su mensaje se muestra tal cual. */
class ConfirmError extends Error {}

/**
 * Confirmación atómica (§8.3). Sirve para "Confirmar acuerdo" (desde `accepted`) y para
 * "Aceptar contraoferta" (desde `countered`). Cualquier throw revierte el cambio de estado.
 */
export async function confirmProposal(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const persona = await personaWithRole("buyer");
  if (!persona) return { ok: false, error: UNAUTHORIZED };

  const comment = optionalText.safeParse(text(formData, "closingComment"));
  if (!comment.success) {
    return {
      ok: false,
      error: "Revisá el comentario de cierre.",
      fieldErrors: { closingComment: comment.error.issues[0].message },
    };
  }

  let result: { agreementId: string; offerId: string };
  try {
    result = await db.$transaction(async (tx) => {
      // 2. Cambio de estado condicionado: cubre doble confirmación, reintentos y acceso ajeno.
      const claimed = await tx.proposal.updateMany({
        where: {
          id,
          buyerId: persona.id,
          status: { in: ["accepted", "countered"] },
        },
        data: { status: "confirmed" },
      });
      if (claimed.count === 0) {
        throw new ConfirmError("La propuesta ya no se puede confirmar.");
      }

      // 3. Términos efectivos.
      const p = await tx.proposal.findUniqueOrThrow({
        where: { id },
        include: { offer: { include: { locality: true } } },
      });
      const terms = effectiveTerms(p);

      // 4. Descuento de stock condicionado.
      const debited = await tx.offer.updateMany({
        where: {
          id: p.offerId,
          status: "available",
          quantityTons: { gte: terms.quantityTons },
        },
        data: { quantityTons: { decrement: terms.quantityTons } },
      });
      if (debited.count === 0) {
        const offer = await tx.offer.findUniqueOrThrow({
          where: { id: p.offerId },
        });
        throw new ConfirmError(
          confirmBlockReason(p, offer) ??
            `Stock insuficiente: quedan ${formatTons(offer.quantityTons)}`,
        );
      }

      // 5. Acuerdo con los términos finales y el snapshot de la oferta.
      const { offer } = p;
      const agreement = await tx.agreement.create({
        data: {
          id: newId(),
          proposalId: p.id,
          offerId: offer.id,
          sellerId: offer.sellerId,
          buyerId: p.buyerId,
          quantityTons: terms.quantityTons,
          pricePerTon: terms.pricePerTon,
          totalAmount: totalAmount(terms.quantityTons, terms.pricePerTon),
          offerTitle: offer.title,
          category: offer.category,
          originLocality: offer.locality.name,
          humidityPct: offer.humidityPct,
          calorificKcalKg: offer.calorificKcalKg,
          presentation: offer.presentation,
          freight: offer.freight,
          hasWeighbridge: offer.hasWeighbridge,
          labAnalysis: offer.labAnalysis,
          closingComment: comment.data,
        },
        select: { id: true },
      });
      return { agreementId: agreement.id, offerId: offer.id };
    });
  } catch (error) {
    if (error instanceof ConfirmError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  // 6. Fuera de la transacción.
  revalidateProposal(id, result.offerId);
  revalidatePath("/offers");
  revalidatePath("/agreements");
  redirect(`/agreements/${result.agreementId}`);
}
