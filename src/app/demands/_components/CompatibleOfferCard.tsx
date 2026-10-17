import { Droplets, Flame, MapPin, Scale } from "lucide-react";
import Link from "next/link";
import { OfferStatusBadge } from "@/components/StatusBadge";
import type { CompatibleOffer } from "@/lib/demands/queries";
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

/** Local card keeps English offer URLs without modifying M0's shared OfferCard. */
export function CompatibleOfferCard({
  match,
  requestedTons,
}: {
  match: CompatibleOffer;
  requestedTons: string;
}) {
  const { offer } = match;
  return (
    <article className="flex flex-col rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <Link
        href={`/offers/${offer.id}`}
        className="group flex flex-1 flex-col rounded-t-2xl p-5 transition hover:bg-campo-50/50 dark:hover:bg-campo-950/20"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-campo-700 dark:text-campo-300">
            {CATEGORY_LABEL[offer.category]}
          </span>
          <OfferStatusBadge
            status={offer.status}
            quantityTons={offer.quantityTons}
          />
        </div>
        <h3 className="mt-3 text-lg font-bold group-hover:text-campo-700 dark:group-hover:text-campo-300">
          {offer.title}
        </h3>
        <p className="mt-1 flex items-start gap-1 text-xs text-stone-500 dark:text-stone-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {offer.locality.name}, {PROVINCE_LABEL[offer.locality.province]} ·{" "}
          {offer.seller.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600 dark:text-stone-300">
          {offer.humidityPct !== null && (
            <span className="inline-flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5" aria-hidden />
              Humedad {Number(offer.humidityPct).toLocaleString("es-AR")} %
            </span>
          )}
          {offer.calorificKcalKg !== null && (
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" aria-hidden />
              {offer.calorificKcalKg.toLocaleString("es-AR")} kcal/kg
            </span>
          )}
          {offer.presentation && (
            <span>{PRESENTATION_LABEL[offer.presentation]}</span>
          )}
          {offer.hasWeighbridge && (
            <span className="inline-flex items-center gap-1">
              <Scale className="h-3.5 w-3.5" aria-hidden />
              Báscula en planta
            </span>
          )}
        </div>
        {offer.status === "estimated" && offer.estimatedDate && (
          <p className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
            Estimada para el {formatDate(offer.estimatedDate)}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="font-mono-num text-xl font-bold">
            {formatTons(offer.quantityTons)}
          </span>
          <span className="font-mono-num text-sm font-semibold text-campo-700 dark:text-campo-300">
            {offer.pricePerTon
              ? formatArsPerTon(offer.pricePerTon)
              : "Precio a convenir"}
          </span>
        </div>
        <span className="mt-3 text-xs text-stone-500 dark:text-stone-400">
          {formatKm(match.distanceKm)} desde la demanda (aprox., en línea recta)
        </span>
      </Link>
      <div className="rounded-b-2xl border-t border-stone-100 bg-stone-50 px-5 py-3 dark:border-stone-800 dark:bg-stone-950/30">
        <p className="text-sm font-semibold">
          Cubre {formatTons(match.coversTons).replace(" Tn", "")} de{" "}
          {formatTons(requestedTons)}
        </p>
        {match.overMaxPrice && (
          <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Sobre tu precio máximo
          </p>
        )}
      </div>
    </article>
  );
}
