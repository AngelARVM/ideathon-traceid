import "server-only";

import { notFound } from "next/navigation";
import type { OfferCardData } from "@/components/OfferCard";
import { db } from "@/db";
import { Prisma } from "@/generated/prisma/client";
import type { Category } from "@/generated/prisma/enums";
import { distanceKm } from "@/lib/geo";
import type { PersonaWithLocality } from "@/lib/persona";
import type { DemandFilters } from "./validation";

const demandInclude = {
  locality: true,
  buyer: { select: { name: true } },
} as const;
const offerInclude = {
  locality: true,
  seller: { select: { name: true } },
} as const;

export type DemandWithLocality = Prisma.DemandGetPayload<{
  include: typeof demandInclude;
}>;
type OfferWithLocality = Prisma.OfferGetPayload<{
  include: typeof offerInclude;
}>;
export type DemandListItem = DemandWithLocality & {
  distanceKm: number;
  compatibleCount: number;
};
export type CompatibleOffer = {
  offer: OfferCardData;
  distanceKm: number;
  coversTons: string;
  overMaxPrice: boolean;
};

function serializeOffer(offer: OfferWithLocality): OfferCardData {
  return {
    id: offer.id,
    title: offer.title,
    category: offer.category,
    status: offer.status,
    estimatedDate: offer.estimatedDate?.toISOString() ?? null,
    quantityTons: offer.quantityTons.toString(),
    pricePerTon: offer.pricePerTon?.toString() ?? null,
    humidityPct: offer.humidityPct?.toString() ?? null,
    calorificKcalKg: offer.calorificKcalKg,
    presentation: offer.presentation,
    hasWeighbridge: offer.hasWeighbridge,
    locality: { name: offer.locality.name, province: offer.locality.province },
    seller: offer.seller,
  };
}

function compatibleOffers(
  demand: DemandWithLocality,
  offers: OfferWithLocality[],
): CompatibleOffer[] {
  return offers
    .flatMap((offer) => {
      if (offer.category !== demand.category) return [];
      const eligible =
        offer.status === "available"
          ? offer.quantityTons.greaterThan(0)
          : offer.status === "estimated" &&
            (!demand.neededBy ||
              (offer.estimatedDate !== null &&
                offer.estimatedDate <= demand.neededBy));
      if (!eligible) return [];
      const distance = distanceKm(demand.locality, offer.locality);
      if (distance > demand.radiusKm) return [];
      return [
        {
          offer: serializeOffer(offer),
          distanceKm: distance,
          coversTons: Prisma.Decimal.min(
            offer.quantityTons,
            demand.quantityTons,
          ).toString(),
          overMaxPrice:
            demand.maxPricePerTon !== null &&
            offer.pricePerTon !== null &&
            offer.pricePerTon.greaterThan(demand.maxPricePerTon),
        },
      ];
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

async function loadOfferPool(categories: Category[]) {
  if (!categories.length) return [];
  return db.offer.findMany({
    where: {
      category: { in: [...new Set(categories)] },
      OR: [
        { status: "available", quantityTons: { gt: 0 } },
        { status: "estimated" },
      ],
    },
    include: offerInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

async function withCounts(
  demands: DemandWithLocality[],
  persona: PersonaWithLocality,
): Promise<DemandListItem[]> {
  // One shared offer query avoids an N+1 query for every demand card.
  const offers = await loadOfferPool(demands.map((demand) => demand.category));
  return demands.map((demand) => ({
    ...demand,
    distanceKm: distanceKm(persona.locality, demand.locality),
    compatibleCount: compatibleOffers(demand, offers).length,
  }));
}

export async function listDemands(
  filters: DemandFilters,
  persona: PersonaWithLocality,
) {
  const demands = await db.demand.findMany({
    where: { status: "open", category: filters.category },
    include: demandInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  const nearby = demands.filter(
    (demand) =>
      filters.radiusKm === undefined ||
      distanceKm(persona.locality, demand.locality) <= filters.radiusKm,
  );
  return (await withCounts(nearby, persona)).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}

export async function getDemandDetail(
  id: string,
  persona: PersonaWithLocality,
) {
  const demand = await db.demand.findUnique({
    where: { id },
    include: demandInclude,
  });
  if (
    !demand ||
    (demand.status === "withdrawn" && demand.buyerId !== persona.id)
  )
    notFound();
  return demand;
}

export async function listCompatibleOffers(demand: DemandWithLocality) {
  return compatibleOffers(demand, await loadOfferPool([demand.category]));
}

export async function listMyDemands(persona: PersonaWithLocality) {
  if (persona.role !== "buyer") notFound();
  const demands = await db.demand.findMany({
    where: { buyerId: persona.id },
    include: demandInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return withCounts(demands, persona);
}

export async function listLocalities() {
  return db.locality.findMany({
    select: { id: true, name: true, province: true },
    orderBy: [{ province: "asc" }, { name: "asc" }],
  });
}
