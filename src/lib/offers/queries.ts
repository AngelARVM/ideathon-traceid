import "server-only";

import { notFound } from "next/navigation";
import type { OfferCardData } from "@/components/OfferCard";
import { db } from "@/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  Category,
  type OfferStatus,
  Presentation,
} from "@/generated/prisma/enums";
import { distanceKm } from "@/lib/geo";
import type { OfferFormValues } from "@/lib/offers/schema";
import type { PersonaWithLocality } from "@/lib/persona";

// Lecturas de ofertas (M1). Filtros y orden del catálogo según docs/00-mvp-spec.md §9.2.

export type CatalogFilters = {
  categoria?: Category;
  radio?: 50 | 100 | 200;
  disponibilidad?: "disponible" | "estimada";
  humedadMax?: number;
  kcalMin?: number;
  presentacion?: Presentation;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const isIn = <T extends string>(
  values: Record<string, T>,
  v: string | undefined,
): v is T => v !== undefined && Object.values<string>(values).includes(v);

/** Valida los query params del catálogo. Un valor inválido se ignora. */
export function parseCatalogFilters(params: SearchParams): CatalogFilters {
  const filters: CatalogFilters = {};

  const categoria = first(params.categoria);
  if (isIn(Category, categoria)) filters.categoria = categoria;

  const radio = Number(first(params.radio));
  if (radio === 50 || radio === 100 || radio === 200) filters.radio = radio;

  const disponibilidad = first(params.disponibilidad);
  if (disponibilidad === "disponible" || disponibilidad === "estimada") {
    filters.disponibilidad = disponibilidad;
  }

  const humedad = Number(first(params.humedadMax)?.replace(",", "."));
  if (first(params.humedadMax) && Number.isFinite(humedad) && humedad >= 0) {
    filters.humedadMax = humedad;
  }

  const kcal = Number(first(params.kcalMin));
  if (first(params.kcalMin) && Number.isInteger(kcal) && kcal >= 0) {
    filters.kcalMin = kcal;
  }

  const presentacion = first(params.presentacion);
  if (isIn(Presentation, presentacion)) filters.presentacion = presentacion;

  return filters;
}

const cardInclude = {
  locality: { select: { name: true, province: true, lat: true, lng: true } },
  seller: { select: { name: true } },
} satisfies Prisma.OfferInclude;

type OfferWithCard = Prisma.OfferGetPayload<{ include: typeof cardInclude }>;

/** `Offer` → `OfferCardData`, con los `Decimal` serializados como string. */
function toCardData(offer: OfferWithCard): OfferCardData {
  return {
    id: offer.id,
    title: offer.title,
    category: offer.category,
    status: offer.status,
    estimatedDate: offer.estimatedDate,
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
    seller: { name: offer.seller.name },
  };
}

export type CatalogItem = { offer: OfferCardData; distanceKm: number };

/** Ofertas disponibles y estimadas, filtradas y ordenadas por distancia (§9.2). */
export async function listCatalog(
  filters: CatalogFilters,
  persona: PersonaWithLocality,
): Promise<CatalogItem[]> {
  const status: OfferStatus[] =
    filters.disponibilidad === "disponible"
      ? ["available"]
      : filters.disponibilidad === "estimada"
        ? ["estimated"]
        : ["available", "estimated"];

  // Humedad y kcal se filtran en SQL: una comparación con NULL es falsa, así que las ofertas sin
  // dato quedan afuera solo cuando se usa el filtro, que es la regla de §9.2.
  const offers = await db.offer.findMany({
    where: {
      status: { in: status },
      category: filters.categoria,
      presentation: filters.presentacion,
      humidityPct:
        filters.humedadMax !== undefined
          ? { lte: filters.humedadMax }
          : undefined,
      calorificKcalKg:
        filters.kcalMin !== undefined ? { gte: filters.kcalMin } : undefined,
    },
    include: cardInclude,
  });

  const items = offers
    .map((offer) => ({
      offer,
      distanceKm: distanceKm(persona.locality, offer.locality),
      soldOut: offer.status === "available" && offer.quantityTons.lte(0),
    }))
    .filter(
      (i) => filters.radio === undefined || i.distanceKm <= filters.radio,
    );

  // Agotadas al final; después por distancia y, a igual distancia, las más recientes.
  items.sort(
    (a, b) =>
      Number(a.soldOut) - Number(b.soldOut) ||
      a.distanceKm - b.distanceKm ||
      b.offer.createdAt.getTime() - a.offer.createdAt.getTime(),
  );

  return items.map((i) => ({
    offer: toCardData(i.offer),
    distanceKm: i.distanceKm,
  }));
}

/** Detalle de una oferta. Una retirada solo la ve su dueño; para el resto, 404 (§9). */
export async function getOfferDetail(id: string, persona: PersonaWithLocality) {
  const offer = await db.offer.findUnique({
    where: { id },
    include: {
      locality: true,
      seller: { select: { id: true, name: true, tagline: true } },
    },
  });
  if (!offer) notFound();
  const isOwner = offer.sellerId === persona.id;
  if (offer.status === "withdrawn" && !isOwner) notFound();

  return {
    offer,
    isOwner,
    distanceKm: distanceKm(persona.locality, offer.locality),
  };
}

export type OfferDetail = Awaited<ReturnType<typeof getOfferDetail>>;

/** Ofertas del vendedor, retiradas incluidas, con la cantidad de propuestas pendientes. */
export async function listMyOffers(persona: PersonaWithLocality) {
  const offers = await db.offer.findMany({
    where: { sellerId: persona.id },
    include: {
      locality: { select: { name: true } },
      _count: { select: { proposals: { where: { status: "pending" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return offers.map((o) => ({
    id: o.id,
    title: o.title,
    category: o.category,
    status: o.status,
    estimatedDate: o.estimatedDate,
    quantityTons: o.quantityTons.toString(),
    localityName: o.locality.name,
    pendingProposals: o._count.proposals,
  }));
}

export type MyOffer = Awaited<ReturnType<typeof listMyOffers>>[number];

/** Valores del formulario de edición. Solo el dueño, y no si la oferta está retirada. */
export async function getOfferFormValues(
  id: string,
  persona: PersonaWithLocality,
): Promise<{ title: string; values: OfferFormValues }> {
  const offer = await db.offer.findFirst({
    where: { id, sellerId: persona.id, status: { not: "withdrawn" } },
  });
  if (!offer) notFound();

  return {
    title: offer.title,
    values: {
      title: offer.title,
      category: offer.category,
      description: offer.description,
      quantityTons: offer.quantityTons.toString(),
      pricePerTon: offer.pricePerTon?.toString() ?? "",
      status: offer.status,
      estimatedDate: offer.estimatedDate?.toISOString().slice(0, 10) ?? "",
      localityId: offer.localityId,
      humidityPct: offer.humidityPct?.toString() ?? "",
      calorificKcalKg: offer.calorificKcalKg?.toString() ?? "",
      presentation: offer.presentation ?? "",
      freight: offer.freight,
      hasWeighbridge: offer.hasWeighbridge ? "on" : "",
      labAnalysis: offer.labAnalysis ?? "",
    },
  };
}

/** Localidades para el selector del formulario. */
export function listLocalities() {
  return db.locality.findMany({
    select: { id: true, name: true, province: true },
    orderBy: [{ province: "asc" }, { name: "asc" }],
  });
}

/** Título de una demanda abierta, para el aviso de precarga (§12.2). */
export async function getDemandTitle(id: string) {
  const demand = await db.demand.findFirst({
    where: { id, status: "open" },
    select: { id: true, title: true },
  });
  return demand;
}
