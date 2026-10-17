import {
  CalendarClock,
  Droplets,
  Flame,
  MapPin,
  Navigation,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { OfferStatusBadge } from "@/components/StatusBadge";
import type {
  Category,
  OfferStatus,
  Presentation,
  Province,
} from "@/generated/prisma/enums";
import {
  formatArsPerTon,
  formatDate,
  formatKm,
  formatTons,
} from "@/lib/format";
import {
  CATEGORY_LABEL,
  PRESENTATION_LABEL,
  PROVINCE_LABEL,
} from "@/lib/labels";

/** Datos serializables de una oferta para la tarjeta: los `Decimal` llegan como string. */
export type OfferCardData = {
  id: string;
  title: string;
  category: Category;
  status: OfferStatus;
  estimatedDate: Date | string | null;
  quantityTons: string;
  pricePerTon: string | null;
  humidityPct: string | null;
  calorificKcalKg: number | null;
  presentation: Presentation | null;
  hasWeighbridge: boolean;
  locality: { name: string; province: Province };
  seller: { name: string };
};

/** Tarjeta de lote (estilo del PDF de referencia). Enlaza al detalle de la oferta. */
export function OfferCard({
  offer,
  distanceKm,
}: {
  offer: OfferCardData;
  distanceKm?: number;
}) {
  const soldOut =
    offer.status === "available" && Number(offer.quantityTons) <= 0;

  return (
    <Link
      href={`/offers/${offer.id}`}
      className={`group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-campo-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-campo-700 ${soldOut ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-lg bg-campo-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-campo-800 dark:bg-campo-950/60 dark:text-campo-200">
          {CATEGORY_LABEL[offer.category]}
        </span>
        <OfferStatusBadge
          status={offer.status}
          quantityTons={offer.quantityTons}
        />
      </div>

      <h3 className="mt-3 font-bold leading-snug text-stone-950 group-hover:text-campo-700 dark:text-stone-50 dark:group-hover:text-campo-300">
        {offer.title}
      </h3>
      <p className="mt-1 flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          {offer.locality.name}, {PROVINCE_LABEL[offer.locality.province]} ·{" "}
          {offer.seller.name}
        </span>
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium text-stone-700 dark:text-stone-300">
        {distanceKm !== undefined && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-800"
            title="Aprox., en línea recta"
          >
            <Navigation className="h-3 w-3" aria-hidden />
            {formatKm(distanceKm)}
          </span>
        )}
        {offer.humidityPct !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-800">
            <Droplets className="h-3 w-3" aria-hidden />
            Humedad {Number(offer.humidityPct).toLocaleString("es-AR")} %
          </span>
        )}
        {offer.calorificKcalKg !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-800">
            <Flame className="h-3 w-3" aria-hidden />
            {offer.calorificKcalKg.toLocaleString("es-AR")} kcal/kg
          </span>
        )}
        {offer.presentation && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-800">
            {PRESENTATION_LABEL[offer.presentation]}
          </span>
        )}
        {offer.hasWeighbridge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 dark:bg-stone-800">
            <Scale className="h-3 w-3" aria-hidden />
            Báscula en planta
          </span>
        )}
      </div>

      {offer.status === "estimated" && offer.estimatedDate && (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-200">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Estimada para el {formatDate(offer.estimatedDate)}
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Disponible
          </p>
          <p className="font-mono-num text-lg font-bold">
            {formatTons(offer.quantityTons)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Precio ref.
          </p>
          <p className="font-mono-num text-sm font-semibold text-campo-700 dark:text-campo-300">
            {offer.pricePerTon
              ? formatArsPerTon(offer.pricePerTon)
              : "A convenir"}
          </p>
        </div>
      </div>
    </Link>
  );
}
