import type {
  Category,
  Freight,
  OfferStatus,
  Presentation,
  ProposalStatus,
  Province,
} from "@/generated/prisma/enums";

export const CATEGORY_LABEL: Record<Category, string> = {
  cascarilla_arroz: "Cascarilla de arroz",
  chips_forestales: "Chips forestales",
  aserrin_virutas: "Aserrín y virutas",
  biomasa_pellets: "Biomasa y pellets",
  orujos_bagazos: "Orujos, pulpas y bagazos",
};

export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  available: "Disponible",
  estimated: "Estimada",
  withdrawn: "Retirada",
};

export const PRESENTATION_LABEL: Record<Presentation, string> = {
  granel: "A granel",
  big_bag: "Big bags",
  fardos: "Fardos",
};

export const FREIGHT_LABEL: Record<Freight, string> = {
  retiro_en_planta: "Retiro en planta",
  entrega_vendedor: "Entrega a cargo del vendedor",
  a_convenir: "A convenir",
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  countered: "Contraofertada",
  rejected: "Rechazada",
  confirmed: "Confirmada",
};

export const PROVINCE_LABEL: Record<Province, string> = {
  corrientes: "Corrientes",
  misiones: "Misiones",
  chaco: "Chaco",
};
