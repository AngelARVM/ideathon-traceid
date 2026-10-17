// Reglas puras de la negociación (docs/00-mvp-spec.md §8.2, §8.3). Sin `server-only` ni acceso a
// la base: las usan la UI, las server actions y, en M5, los tests.

import { Prisma } from "@/generated/prisma/browser";
import type {
  OfferStatus,
  ProposalStatus,
  Role,
} from "@/generated/prisma/enums";
import { type DecimalLike, formatDate, formatTons } from "@/lib/format";

const { Decimal } = Prisma;

export type NegotiationAction =
  | "accept"
  | "reject"
  | "counter"
  | "confirm"
  | "rejectCounter";

/** Estados en los que la propuesta sigue abierta: bloquean otra del mismo comprador. */
export const OPEN_PROPOSAL_STATUSES = [
  "pending",
  "accepted",
  "countered",
] as const satisfies ProposalStatus[];

type TermsInput = {
  quantityTons: DecimalLike;
  pricePerTon: DecimalLike;
  counterQuantityTons: DecimalLike | null;
  counterPricePerTon: DecimalLike | null;
};

export type Terms = { quantityTons: string; pricePerTon: string };

/** Términos vigentes: los de la contraoferta si existen; el campo que falte sale del original. */
export function effectiveTerms(p: TermsInput): Terms {
  return {
    quantityTons: String(p.counterQuantityTons ?? p.quantityTons),
    pricePerTon: String(p.counterPricePerTon ?? p.pricePerTon),
  };
}

/** `quantityTons × pricePerTon`, redondeado a 2 decimales, sin pasar por `number`. */
export function totalAmount(
  quantityTons: DecimalLike,
  pricePerTon: DecimalLike,
): string {
  return new Decimal(String(quantityTons))
    .mul(String(pricePerTon))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toFixed(2);
}

/** `a > b` para cantidades decimales. */
export const exceeds = (a: DecimalLike, b: DecimalLike) =>
  new Decimal(String(a)).gt(String(b));

type ProposalForRules = TermsInput & {
  status: ProposalStatus;
  buyerId: string;
};

type OfferForRules = {
  sellerId: string;
  status: OfferStatus;
  quantityTons: DecimalLike;
  estimatedDate: Date | string | null;
};

type PersonaForRules = { id: string; role: Role };

/** Tabla §8.2: qué puede hacer esta persona sobre la propuesta, hoy. */
export function allowedActions(
  p: ProposalForRules,
  offer: OfferForRules,
  persona: PersonaForRules,
): NegotiationAction[] {
  if (persona.role === "seller" && offer.sellerId === persona.id) {
    if (p.status !== "pending") return [];
    return offer.status === "withdrawn"
      ? ["reject"]
      : ["accept", "reject", "counter"];
  }
  if (persona.role === "buyer" && p.buyerId === persona.id) {
    if (p.status === "accepted") return ["confirm"];
    if (p.status === "countered") return ["confirm", "rejectCounter"];
  }
  return [];
}

/** Motivo legible por el que hoy no se podría confirmar, o `null` si se puede (§8.3, D10). */
export function confirmBlockReason(
  p: TermsInput,
  offer: OfferForRules,
): string | null {
  if (offer.status === "withdrawn") return "La oferta fue retirada";
  if (offer.status === "estimated") {
    return offer.estimatedDate
      ? `La oferta todavía es estimada (disponible aprox. ${formatDate(offer.estimatedDate)})`
      : "La oferta todavía es estimada";
  }
  if (exceeds(effectiveTerms(p).quantityTons, offer.quantityTons)) {
    return `Stock insuficiente: quedan ${formatTons(offer.quantityTons)}`;
  }
  return null;
}
