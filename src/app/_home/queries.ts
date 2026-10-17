import "server-only";

import type { OfferCardData } from "@/components/OfferCard";
import { db } from "@/db";
import type { Category } from "@/generated/prisma/enums";
import { distanceKm } from "@/lib/geo";
import { CATEGORY_LABEL } from "@/lib/labels";
import type { PersonaWithLocality } from "@/lib/persona";

export function listDemoPersonas() {
  return db.user.findMany({
    select: {
      id: true,
      name: true,
      tagline: true,
      role: true,
      locality: { select: { name: true, province: true } },
    },
    orderBy: { name: "asc" },
  });
}

export type DemoPersona = Awaited<ReturnType<typeof listDemoPersonas>>[number];

// Read per request so stock, category counts and demands reflect other milestones' writes.
export async function getHomeData(persona: PersonaWithLocality) {
  const [offers, demands] = await Promise.all([
    db.offer.findMany({
      where: { status: { in: ["available", "estimated"] } },
      include: { locality: true, seller: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    db.demand.findMany({
      where: {
        status: "open",
        ...(persona.role === "buyer" ? { buyerId: persona.id } : {}),
      },
      include: { locality: true, buyer: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
  ]);

  const categories = (Object.keys(CATEGORY_LABEL) as Category[]).map(
    (category) => ({
      category,
      count: offers.filter((offer) => offer.category === category).length,
    }),
  );
  const rankedOffers = offers
    .map((offer) => ({
      offer,
      distance: distanceKm(persona.locality, offer.locality),
      exhausted: offer.quantityTons.lessThanOrEqualTo(0),
    }))
    .sort(
      (a, b) =>
        Number(a.exhausted) - Number(b.exhausted) ||
        a.distance - b.distance ||
        b.offer.createdAt.getTime() - a.offer.createdAt.getTime() ||
        a.offer.id.localeCompare(b.offer.id),
    );
  const selected = rankedOffers.slice(0, 4);
  const nearbyEstimate = rankedOffers.find(
    ({ offer, distance }) => offer.status === "estimated" && distance <= 200,
  );
  if (
    nearbyEstimate &&
    !selected.some(
      ({ offer, distance }) => offer.status === "estimated" && distance <= 200,
    )
  ) {
    selected.splice(3, 1, nearbyEstimate);
  }
  const selectedIds = new Set(selected.map(({ offer }) => offer.id));
  const nearbyOffers = rankedOffers
    .filter(({ offer }) => selectedIds.has(offer.id))
    .map(({ offer, distance }) => ({
      distance,
      offer: {
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
        locality: {
          name: offer.locality.name,
          province: offer.locality.province,
        },
        seller: offer.seller,
      } satisfies OfferCardData,
    }));

  const rankedDemands = demands
    .map((demand) => ({
      demand,
      distance: distanceKm(persona.locality, demand.locality),
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        b.demand.createdAt.getTime() - a.demand.createdAt.getTime() ||
        a.demand.id.localeCompare(b.demand.id),
    );
  const visibleDemands =
    persona.role === "buyer" ? rankedDemands : rankedDemands.slice(0, 3);
  return {
    categories,
    nearbyOffers,
    demands: visibleDemands.map(({ demand, distance }) => ({
      id: demand.id,
      title: demand.title,
      category: demand.category,
      quantityTons: demand.quantityTons.toString(),
      maxPricePerTon: demand.maxPricePerTon?.toString() ?? null,
      neededBy: demand.neededBy?.toISOString() ?? null,
      locality: demand.locality,
      buyerName: demand.buyer.name,
      distance,
      compatibleCount:
        persona.role === "buyer"
          ? offers.filter(
              (offer) =>
                offer.category === demand.category &&
                distanceKm(demand.locality, offer.locality) <=
                  demand.radiusKm &&
                ((offer.status === "available" &&
                  offer.quantityTons.greaterThan(0)) ||
                  (offer.status === "estimated" &&
                    offer.estimatedDate !== null &&
                    (demand.neededBy === null ||
                      offer.estimatedDate <= demand.neededBy))),
            ).length
          : null,
    })),
  };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
