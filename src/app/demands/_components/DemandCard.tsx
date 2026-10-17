import { ArrowUpRight, CalendarDays, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DemandListItem, DemandWithLocality } from "@/lib/demands/queries";
import {
  formatArsPerTon,
  formatDate,
  formatKm,
  formatTons,
} from "@/lib/format";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";

export function DemandSummary({ demand }: { demand: DemandWithLocality }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600 dark:text-stone-300">
      <span className="font-bold text-stone-900 dark:text-stone-50">
        {formatTons(demand.quantityTons)} buscadas
      </span>
      <span>
        {demand.maxPricePerTon
          ? `Máximo ${formatArsPerTon(demand.maxPricePerTon)}`
          : "Sin precio máximo"}
      </span>
      {demand.neededBy && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" aria-hidden />
          Necesito para {formatDate(demand.neededBy)}
        </span>
      )}
    </div>
  );
}

export function DemandCard({
  demand,
  actions,
}: {
  demand: DemandListItem;
  actions?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-lg bg-campo-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-campo-800 dark:bg-campo-950/60 dark:text-campo-200">
          {CATEGORY_LABEL[demand.category]}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${demand.status === "open" ? "bg-campo-50 text-campo-800 dark:bg-campo-950 dark:text-campo-200" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"}`}
        >
          {demand.status === "open" ? "Abierta" : "Retirada"}
        </span>
      </div>
      <Link
        href={`/demands/${demand.id}`}
        className="mt-3 flex items-start justify-between gap-3 font-bold text-stone-950 hover:text-campo-700 dark:text-stone-50 dark:hover:text-campo-300"
      >
        <h2 className="text-lg">{demand.title}</h2>
        <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
      </Link>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        {demand.buyer.name} · {demand.locality.name},{" "}
        {PROVINCE_LABEL[demand.locality.province]}
      </p>
      <DemandSummary demand={demand} />
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-xs dark:border-stone-800">
        <span
          className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400"
          title="Aprox., en línea recta"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden />
          {formatKm(demand.distanceKm)} desde tu localidad
        </span>
        {demand.status === "open" && (
          <Link
            href={`/demands/${demand.id}`}
            className="font-semibold text-campo-700 hover:underline dark:text-campo-300"
          >
            {demand.compatibleCount}{" "}
            {demand.compatibleCount === 1
              ? "oferta compatible"
              : "ofertas compatibles"}
          </Link>
        )}
      </div>
      {actions && (
        <div className="mt-4 flex flex-wrap items-start gap-2">{actions}</div>
      )}
    </article>
  );
}
