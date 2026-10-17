import "server-only";

import { db } from "@/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ProposalStatus } from "@/generated/prisma/enums";
import type { PersonaWithLocality } from "@/lib/persona";

// Lecturas que cruzan ofertas, propuestas y acuerdos (M7). Todo se agrega en SQL con `count` y
// `aggregate`, y los `Decimal` se serializan como string. Son lecturas por persona: no se
// cachean y quien las use va dentro de `<Suspense>` (§7).

const ACTIVE_OFFER = {
  status: { in: ["available", "estimated"] },
} satisfies Prisma.OfferWhereInput;

/** Propuestas que el vendedor ya respondió y esperan la confirmación del comprador. */
const AWAITING_BUYER: ProposalStatus[] = ["accepted", "countered"];

/** Estadísticas públicas de un vendedor, para la tarjeta de `/offers/[id]` (M7 §2.2). */
export async function getSellerStats(sellerId: string) {
  const [seller, activeOffers, agreements] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: sellerId },
      select: { createdAt: true },
    }),
    db.offer.count({ where: { sellerId, ...ACTIVE_OFFER } }),
    db.agreement.aggregate({
      where: { sellerId },
      _count: true,
      _sum: { quantityTons: true },
    }),
  ]);
  return {
    memberSince: seller.createdAt,
    activeOffers,
    agreements: agreements._count,
    tonsAgreed: agreements._sum.quantityTons?.toString() ?? "0",
  };
}

export type SellerStats = Awaited<ReturnType<typeof getSellerStats>>;

/** KPIs del panel del vendedor en `/my-offers` (M7 §2.3). */
export async function getSellerDashboard(persona: PersonaWithLocality) {
  const sellerId = persona.id;
  const [activeOffers, stock, pending, awaitingBuyer, agreements] =
    await Promise.all([
      db.offer.count({ where: { sellerId, ...ACTIVE_OFFER } }),
      db.offer.aggregate({
        where: { sellerId, status: "available", quantityTons: { gt: 0 } },
        _sum: { quantityTons: true },
      }),
      db.proposal.count({
        where: { offer: { sellerId }, status: "pending" },
      }),
      db.proposal.count({
        where: { offer: { sellerId }, status: { in: AWAITING_BUYER } },
      }),
      db.agreement.aggregate({
        where: { sellerId },
        _count: true,
        _sum: { quantityTons: true, totalAmount: true },
      }),
    ]);
  return {
    activeOffers,
    stockTons: stock._sum.quantityTons?.toString() ?? "0",
    pendingProposals: pending,
    awaitingBuyer,
    agreements: agreements._count,
    tonsAgreed: agreements._sum.quantityTons?.toString() ?? "0",
    amountAgreed: agreements._sum.totalAmount?.toString() ?? "0",
  };
}

export type SellerDashboard = Awaited<ReturnType<typeof getSellerDashboard>>;

/**
 * Propuestas que esperan una acción de la persona, para el contador del header (M7 §2.4): al
 * vendedor, las `pending` sobre sus ofertas; al comprador, las suyas `accepted` o `countered`.
 */
export function countPendingActions(persona: PersonaWithLocality) {
  return persona.role === "seller"
    ? db.proposal.count({
        where: { offer: { sellerId: persona.id }, status: "pending" },
      })
    : db.proposal.count({
        where: { buyerId: persona.id, status: { in: AWAITING_BUYER } },
      });
}
