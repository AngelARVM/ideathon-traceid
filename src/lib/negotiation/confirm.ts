// Transacción de confirmación (docs/00-mvp-spec.md §8.3), sin cookies ni `server-only` para poder
// probarla con `node --test`. NO exportarla desde un archivo "use server": recibe `buyerId` por
// parámetro y quedaría expuesta como endpoint. La única entrada desde la UI es `confirmProposal`.

import type { Prisma } from "@/generated/prisma/client";
import { formatTons } from "@/lib/format";
import { newId } from "@/lib/ids";
import { confirmBlockReason, effectiveTerms, totalAmount } from "./terms";

/** Error esperado dentro de la transacción: su mensaje se muestra tal cual. */
export class ConfirmError extends Error {}

/** Pasos 2–5 de §8.3. Cualquier throw revierte el cambio de estado. */
export async function confirmProposalTx(
  tx: Prisma.TransactionClient,
  buyerId: string,
  proposalId: string,
  closingComment: string | null | undefined,
): Promise<{ agreementId: string; offerId: string }> {
  // 2. Cambio de estado condicionado: cubre doble confirmación, reintentos y acceso ajeno.
  const claimed = await tx.proposal.updateMany({
    where: {
      id: proposalId,
      buyerId,
      status: { in: ["accepted", "countered"] },
    },
    data: { status: "confirmed" },
  });
  if (claimed.count === 0) {
    throw new ConfirmError("La propuesta ya no se puede confirmar.");
  }

  // 3. Términos efectivos.
  const p = await tx.proposal.findUniqueOrThrow({
    where: { id: proposalId },
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
      closingComment: closingComment ?? null,
    },
    select: { id: true },
  });
  return { agreementId: agreement.id, offerId: offer.id };
}
