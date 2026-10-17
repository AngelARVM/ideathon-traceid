// Fixture de demo de SubMarket (docs/00-mvp-spec.md §5 y §11): localidades, personas,
// ofertas y demandas. Todos los precios, volúmenes y fechas son ficticios.
// Uso: npm run db:seed [-- --reset-demo] [-- --allow-remote]
//
// Es idempotente: hace upsert por id fijo. Con --reset-demo borra además todas las propuestas
// y acuerdos, y las ofertas y demandas creadas en runtime, y restaura el stock del fixture.

import { createPrismaClient } from "../src/db/client";
import type {
  Category,
  Freight,
  OfferStatus,
  Presentation,
  Province,
  Role,
} from "../src/generated/prisma/enums";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const args = new Set(process.argv.slice(2));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL no está definida (copiá .env.example a .env.local).",
  );
  process.exit(1);
}
if (!LOCAL_HOSTS.has(new URL(url).hostname) && !args.has("--allow-remote")) {
  console.error(
    `Negado: DATABASE_URL apunta a "${new URL(url).hostname}", que no es local.\n` +
      "El seed sobrescribe los datos de demo. Usá --allow-remote si es intencional.",
  );
  process.exit(1);
}

const db = createPrismaClient(url);

const localities: {
  id: string;
  name: string;
  province: Province;
  lat: number;
  lng: number;
}[] = [
  {
    id: "corrientes",
    name: "Corrientes",
    province: "corrientes",
    lat: -27.4692,
    lng: -58.8306,
  },
  {
    id: "bella-vista",
    name: "Bella Vista",
    province: "corrientes",
    lat: -28.5096,
    lng: -59.0434,
  },
  {
    id: "mercedes",
    name: "Mercedes",
    province: "corrientes",
    lat: -29.1817,
    lng: -58.0753,
  },
  {
    id: "gobernador-virasoro",
    name: "Gobernador Virasoro",
    province: "corrientes",
    lat: -28.05,
    lng: -56.0333,
  },
  {
    id: "santo-tome",
    name: "Santo Tomé",
    province: "corrientes",
    lat: -28.5499,
    lng: -56.0411,
  },
  {
    id: "paso-de-los-libres",
    name: "Paso de los Libres",
    province: "corrientes",
    lat: -29.7125,
    lng: -57.0877,
  },
  {
    id: "posadas",
    name: "Posadas",
    province: "misiones",
    lat: -27.3671,
    lng: -55.8961,
  },
  {
    id: "obera",
    name: "Oberá",
    province: "misiones",
    lat: -27.4871,
    lng: -55.1199,
  },
  {
    id: "eldorado",
    name: "Eldorado",
    province: "misiones",
    lat: -26.4084,
    lng: -54.6941,
  },
  {
    id: "montecarlo",
    name: "Montecarlo",
    province: "misiones",
    lat: -26.5662,
    lng: -54.7574,
  },
  {
    id: "resistencia",
    name: "Resistencia",
    province: "chaco",
    lat: -27.4606,
    lng: -58.9839,
  },
  {
    id: "saenz-pena",
    name: "Presidencia Roque Sáenz Peña",
    province: "chaco",
    lat: -26.7852,
    lng: -60.4388,
  },
  {
    id: "charata",
    name: "Charata",
    province: "chaco",
    lat: -27.2144,
    lng: -61.1881,
  },
];

const users: {
  id: string;
  name: string;
  role: Role;
  localityId: string;
  tagline: string;
}[] = [
  {
    id: "p-molinos-ibera",
    name: "Molinos del Iberá",
    role: "seller",
    localityId: "mercedes",
    tagline: "Molino arrocero",
  },
  {
    id: "p-forestal-virasoro",
    name: "Forestal Virasoro",
    role: "seller",
    localityId: "gobernador-virasoro",
    tagline: "Aserradero y chipeadora",
  },
  {
    id: "p-citricola-bella-vista",
    name: "Citrícola Bella Vista",
    role: "seller",
    localityId: "bella-vista",
    tagline: "Planta juguera",
  },
  {
    id: "p-granja-bella-vista",
    name: "Granja Avícola Bella Vista",
    role: "buyer",
    localityId: "bella-vista",
    tagline: "Producción avícola",
  },
  {
    id: "p-yerbatera-obera",
    name: "Yerbatera Oberá",
    role: "buyer",
    localityId: "obera",
    tagline: "Secadero de yerba mate",
  },
  {
    id: "p-feedlot-resistencia",
    name: "Feedlot Resistencia",
    role: "buyer",
    localityId: "resistencia",
    tagline: "Engorde bovino",
  },
];

const offers: {
  id: string;
  sellerId: string;
  localityId: string;
  title: string;
  category: Category;
  description: string;
  status: OfferStatus;
  estimatedDate: Date | null;
  quantityTons: string;
  pricePerTon: string;
  humidityPct: string;
  calorificKcalKg: number | null;
  presentation: Presentation;
  freight: Freight;
  hasWeighbridge: boolean;
  labAnalysis: string | null;
}[] = [
  {
    id: "o-cascarilla-mercedes",
    sellerId: "p-molinos-ibera",
    localityId: "mercedes",
    title: "Cascarilla de arroz a granel",
    category: "cascarilla_arroz",
    description:
      "Cascarilla seca del descascarado diario del molino. Suele utilizarse como cama avícola o combustible de biomasa.",
    status: "available",
    estimatedDate: null,
    quantityTons: "650",
    pricePerTon: "28500",
    humidityPct: "10.8",
    calorificKcalKg: 3550,
    presentation: "granel",
    freight: "retiro_en_planta",
    hasWeighbridge: true,
    labAnalysis: "Análisis de humedad y cenizas, laboratorio externo, 09/2026",
  },
  {
    id: "o-cascarilla-corrientes",
    sellerId: "p-molinos-ibera",
    localityId: "corrientes",
    title: "Cascarilla de arroz en big bags",
    category: "cascarilla_arroz",
    description:
      "Cascarilla embolsada en big bags, en depósito de Corrientes. Práctica para cargas chicas.",
    status: "available",
    estimatedDate: null,
    quantityTons: "120",
    pricePerTon: "32000",
    humidityPct: "11.5",
    calorificKcalKg: 3500,
    presentation: "big_bag",
    freight: "a_convenir",
    hasWeighbridge: false,
    labAnalysis: null,
  },
  {
    id: "o-chips-virasoro",
    sellerId: "p-forestal-virasoro",
    localityId: "gobernador-virasoro",
    title: "Chips de pino para caldera",
    category: "chips_forestales",
    description:
      "Chips de pino de chipeadora propia, granulometría pareja. Suelen usarse en calderas y secaderos.",
    status: "available",
    estimatedDate: null,
    quantityTons: "1200",
    pricePerTon: "34000",
    humidityPct: "32",
    calorificKcalKg: 3950,
    presentation: "granel",
    freight: "entrega_vendedor",
    hasWeighbridge: true,
    labAnalysis: null,
  },
  {
    id: "o-aserrin-santo-tome",
    sellerId: "p-forestal-virasoro",
    localityId: "santo-tome",
    title: "Aserrín y viruta de pino",
    category: "aserrin_virutas",
    description:
      "Mezcla de aserrín y viruta del aserradero. Suele utilizarse para pellets, camas o combustible.",
    status: "available",
    estimatedDate: null,
    quantityTons: "400",
    pricePerTon: "31000",
    humidityPct: "13.5",
    calorificKcalKg: 4200,
    presentation: "granel",
    freight: "retiro_en_planta",
    hasWeighbridge: false,
    labAnalysis: null,
  },
  {
    id: "o-pulpa-bella-vista",
    sellerId: "p-citricola-bella-vista",
    localityId: "bella-vista",
    title: "Pulpa de cítricos fresca",
    category: "orujos_bagazos",
    description:
      "Pulpa y cáscara frescas de la planta juguera. Alta humedad: conviene retirarla en pocos días.",
    status: "available",
    estimatedDate: null,
    quantityTons: "40",
    pricePerTon: "8000",
    humidityPct: "80",
    calorificKcalKg: null,
    presentation: "granel",
    freight: "retiro_en_planta",
    hasWeighbridge: true,
    labAnalysis: null,
  },
  {
    id: "o-pulpa-zafra-2027",
    sellerId: "p-citricola-bella-vista",
    localityId: "bella-vista",
    title: "Pulpa de cítricos — zafra 2027",
    category: "orujos_bagazos",
    description:
      "Volumen estimado para la próxima zafra. Suele destinarse a suplementación de rodeos o compostaje.",
    status: "estimated",
    estimatedDate: new Date("2027-05-01"),
    quantityTons: "300",
    pricePerTon: "7500",
    humidityPct: "80",
    calorificKcalKg: null,
    presentation: "granel",
    freight: "a_convenir",
    hasWeighbridge: true,
    labAnalysis: null,
  },
];

const demands: {
  id: string;
  buyerId: string;
  localityId: string;
  title: string;
  category: Category;
  description: string;
  quantityTons: string;
  maxPricePerTon: string | null;
  neededBy: Date;
  radiusKm: number;
}[] = [
  {
    id: "d-cama-avicola",
    buyerId: "p-granja-bella-vista",
    localityId: "bella-vista",
    title: "Cascarilla para cama de pollo",
    category: "cascarilla_arroz",
    description: "Reposición de cama para los galpones antes del verano.",
    quantityTons: "80",
    maxPricePerTon: "30000",
    neededBy: new Date("2026-11-30"),
    radiusKm: 200,
  },
  {
    id: "d-secadero-obera",
    buyerId: "p-yerbatera-obera",
    localityId: "obera",
    title: "Chips para secadero",
    category: "chips_forestales",
    description: "Combustible para el secadero de yerba durante la temporada.",
    quantityTons: "300",
    maxPricePerTon: "35000",
    neededBy: new Date("2026-12-15"),
    radiusKm: 200,
  },
  {
    id: "d-suplemento-feedlot",
    buyerId: "p-feedlot-resistencia",
    localityId: "resistencia",
    title: "Pulpa de cítricos para suplementación",
    category: "orujos_bagazos",
    description: "Buscamos volumen sostenido para la próxima temporada.",
    quantityTons: "150",
    maxPricePerTon: null,
    neededBy: new Date("2027-06-30"),
    radiusKm: 200,
  },
];

async function main() {
  await db.$transaction(async (tx) => {
    if (args.has("--reset-demo")) {
      // Orden inverso a las FK: los acuerdos referencian propuestas y ofertas.
      await tx.agreement.deleteMany();
      await tx.proposal.deleteMany();
      await tx.offer.deleteMany({
        where: { id: { notIn: offers.map((o) => o.id) } },
      });
      await tx.demand.deleteMany({
        where: { id: { notIn: demands.map((d) => d.id) } },
      });
    }

    for (const { id, ...data } of localities) {
      await tx.locality.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
    }
    for (const { id, ...data } of users) {
      await tx.user.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
    }
    // El update restaura todos los campos, incluido el stock original.
    for (const { id, ...data } of offers) {
      await tx.offer.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
    }
    for (const { id, ...data } of demands) {
      await tx.demand.upsert({
        where: { id },
        create: { id, ...data },
        update: { ...data, status: "open" },
      });
    }
  });

  console.log(
    "Seed listo%s: %d localidades, %d personas, %d ofertas, %d demandas.",
    args.has("--reset-demo") ? " (demo reiniciada)" : "",
    localities.length,
    users.length,
    offers.length,
    demands.length,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
