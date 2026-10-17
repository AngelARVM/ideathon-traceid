import "server-only";

import { notFound } from "next/navigation";
import { db } from "@/db";
import type { Prisma } from "@/generated/prisma/client";
import { distanceKm } from "@/lib/geo";
import type { PersonaWithLocality } from "@/lib/persona";
import {
  allowedActions,
  confirmBlockReason,
  effectiveTerms,
  exceeds,
  OPEN_PROPOSAL_STATUSES,
  totalAmount,
} from "./terms";

// Lecturas de M3 (docs/specs/M3-negotiation-agreements.md). Una persona que no es parte recibe
// `notFound()`, para no revelar que el recurso existe (§9). Los `Decimal` salen como string.

const str = (d: { toString(): string } | null) =>
  d === null ? null : d.toString();

// ── Oferta a proponer ────────────────────────────────────────────────────────

/** Oferta sobre la que un buyer puede proponer. `null` si no existe o está retirada. */
export async function getOfferToPropose(
  offerId: string,
  persona: PersonaWithLocality,
) {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { seller: true, locality: true },
  });
  if (!offer || offer.status === "withdrawn") return null;

  const openProposal = await db.proposal.findFirst({
    where: {
      offerId,
      buyerId: persona.id,
      status: { in: [...OPEN_PROPOSAL_STATUSES] },
    },
    select: { id: true },
  });

  return {
    id: offer.id,
    title: offer.title,
    category: offer.category,
    status: offer.status,
    estimatedDate: offer.estimatedDate,
    quantityTons: offer.quantityTons.toString(),
    pricePerTon: str(offer.pricePerTon),
    sellerName: offer.seller.name,
    locality: { name: offer.locality.name, province: offer.locality.province },
    distanceKm: distanceKm(persona.locality, offer.locality),
    openProposalId: openProposal?.id ?? null,
  };
}

// ── Propuestas ───────────────────────────────────────────────────────────────

const proposalInclude = {
  offer: {
    include: { seller: { include: { locality: true } }, locality: true },
  },
  buyer: { include: { locality: true } },
  agreement: { select: { id: true } },
} satisfies Prisma.ProposalInclude;

type ProposalRow = Prisma.ProposalGetPayload<{
  include: typeof proposalInclude;
}>;

function toProposalView(p: ProposalRow, persona: PersonaWithLocality) {
  const terms = effectiveTerms(p);
  const isBuyer = p.buyerId === persona.id;
  const counterparty = isBuyer ? p.offer.seller : p.buyer;
  return {
    id: p.id,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    respondedAt: p.respondedAt,
    original: {
      quantityTons: p.quantityTons.toString(),
      pricePerTon: p.pricePerTon.toString(),
      message: p.message,
    },
    counter:
      p.counterQuantityTons !== null || p.counterPricePerTon !== null
        ? {
            quantityTons:
              str(p.counterQuantityTons) ?? p.quantityTons.toString(),
            pricePerTon: str(p.counterPricePerTon) ?? p.pricePerTon.toString(),
            message: p.counterMessage,
          }
        : null,
    terms,
    total: totalAmount(terms.quantityTons, terms.pricePerTon),
    offer: {
      id: p.offer.id,
      title: p.offer.title,
      category: p.offer.category,
      status: p.offer.status,
      estimatedDate: p.offer.estimatedDate,
      quantityTons: p.offer.quantityTons.toString(),
      pricePerTon: str(p.offer.pricePerTon),
      locality: p.offer.locality.name,
    },
    viewerRole: isBuyer ? ("buyer" as const) : ("seller" as const),
    counterparty: {
      name: counterparty.name,
      locality: counterparty.locality.name,
    },
    actions: allowedActions(p, p.offer, persona),
    confirmBlockReason: confirmBlockReason(p, p.offer),
    exceedsStock: exceeds(terms.quantityTons, p.offer.quantityTons),
    agreementId: p.agreement?.id ?? null,
  };
}

export type ProposalView = ReturnType<typeof toProposalView>;

/** Buyer: sus propuestas. Seller: las recibidas en sus ofertas. Separadas por si requieren acción. */
export async function listProposalsFor(persona: PersonaWithLocality) {
  const rows = await db.proposal.findMany({
    where:
      persona.role === "buyer"
        ? { buyerId: persona.id }
        : { offer: { sellerId: persona.id } },
    include: proposalInclude,
    orderBy: { updatedAt: "desc" },
  });
  const views = rows.map((p) => toProposalView(p, persona));
  return {
    needsAction: views.filter((v) => v.actions.length > 0),
    history: views.filter((v) => v.actions.length === 0),
  };
}

export async function getProposalForParty(
  id: string,
  persona: PersonaWithLocality,
): Promise<ProposalView> {
  const p = await db.proposal.findUnique({
    where: { id },
    include: proposalInclude,
  });
  if (!p) notFound();
  if (p.buyerId !== persona.id && p.offer.sellerId !== persona.id) notFound();
  return toProposalView(p, persona);
}

// ── Acuerdos ─────────────────────────────────────────────────────────────────

const partyWhere = (persona: PersonaWithLocality) =>
  ({
    OR: [{ buyerId: persona.id }, { sellerId: persona.id }],
  }) satisfies Prisma.AgreementWhereInput;

export async function listAgreementsFor(persona: PersonaWithLocality) {
  const rows = await db.agreement.findMany({
    where: partyWhere(persona),
    include: { buyer: true, seller: true },
    orderBy: { confirmedAt: "desc" },
  });
  return rows.map((a) => ({
    id: a.id,
    offerTitle: a.offerTitle,
    category: a.category,
    quantityTons: a.quantityTons.toString(),
    totalAmount: a.totalAmount.toString(),
    confirmedAt: a.confirmedAt,
    counterparty: a.buyerId === persona.id ? a.seller.name : a.buyer.name,
    viewerRole:
      a.buyerId === persona.id ? ("buyer" as const) : ("seller" as const),
  }));
}

/** Comprobante: datos tomados solo del `Agreement` (snapshot), nunca de la oferta viva (D9). */
export async function getAgreementForParty(
  id: string,
  persona: PersonaWithLocality,
) {
  const a = await db.agreement.findFirst({
    where: { id, ...partyWhere(persona) },
    include: {
      buyer: { include: { locality: true } },
      seller: { include: { locality: true } },
    },
  });
  if (!a) notFound();
  return {
    id: a.id,
    proposalId: a.proposalId,
    quantityTons: a.quantityTons.toString(),
    pricePerTon: a.pricePerTon.toString(),
    totalAmount: a.totalAmount.toString(),
    offerTitle: a.offerTitle,
    category: a.category,
    originLocality: a.originLocality,
    humidityPct: str(a.humidityPct),
    calorificKcalKg: a.calorificKcalKg,
    presentation: a.presentation,
    freight: a.freight,
    hasWeighbridge: a.hasWeighbridge,
    labAnalysis: a.labAnalysis,
    closingComment: a.closingComment,
    confirmedAt: a.confirmedAt,
    seller: { name: a.seller.name, locality: a.seller.locality.name },
    buyer: { name: a.buyer.name, locality: a.buyer.locality.name },
  };
}
