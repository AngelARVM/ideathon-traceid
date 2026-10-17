import { CalendarDays, MapPin, Navigation, Radar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CATEGORY_IMAGE } from "@/lib/category-media";
import type { DemandListItem, DemandWithLocality } from "@/lib/demands/queries";
import { formatArs, formatDate, formatKm, formatTons } from "@/lib/format";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";

/** Volumen, precio máximo, fecha y radio de una demanda, en la caja gris de las tarjetas. */
export function DemandSummary({ demand }: { demand: DemandWithLocality }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-gray-100 bg-slate-50 p-3 text-xs">
      <div>
        <dt className="text-[10px] text-gray-400">Busca</dt>
        <dd className="font-mono-num font-bold text-gray-900">
          {formatTons(demand.quantityTons)}
        </dd>
      </div>
      <div>
        <dt className="text-[10px] text-gray-400">Precio máximo</dt>
        <dd className="font-mono-num font-bold text-gray-900">
          {demand.maxPricePerTon
            ? `${formatArs(demand.maxPricePerTon)} / Tn`
            : "Sin máximo"}
        </dd>
      </div>
      <div>
        <dt className="flex items-center gap-1 text-[10px] text-gray-400">
          <CalendarDays className="h-3 w-3" aria-hidden />
          Necesito para
        </dt>
        <dd className="font-semibold text-gray-800">
          {demand.neededBy ? formatDate(demand.neededBy) : "Sin fecha"}
        </dd>
      </div>
      <div>
        <dt className="flex items-center gap-1 text-[10px] text-gray-400">
          <Radar className="h-3 w-3" aria-hidden />
          Radio
        </dt>
        <dd className="font-semibold text-gray-800">
          Hasta {demand.radiusKm} km
        </dd>
      </div>
    </dl>
  );
}

/** Estado de la demanda, con el mismo estilo que el de las ofertas. */
export function DemandStatusBadge({
  status,
}: {
  status: "open" | "withdrawn";
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${
        status === "open"
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-gray-200 bg-gray-100 text-gray-600"
      }`}
    >
      {status === "open" ? "Abierta" : "Retirada"}
    </span>
  );
}

/** Tarjeta de demanda con el lenguaje de `OfferCard`: miniatura de la categoría y caja de datos. */
export function DemandCard({
  demand,
  actions,
}: {
  demand: DemandListItem;
  actions?: ReactNode;
}) {
  const image = CATEGORY_IMAGE[demand.category];
  return (
    <article className="group flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={image.src}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-cyan-800">
              {CATEGORY_LABEL[demand.category]}
            </span>
            <DemandStatusBadge status={demand.status} />
          </div>
          <h2 className="mt-0.5 font-sans text-sm font-bold text-gray-900">
            <Link
              href={`/demands/${demand.id}`}
              className="line-clamp-2 hover:text-brand-600"
            >
              {demand.title}
            </Link>
          </h2>
        </div>
      </div>
      <p className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
        <span className="shrink-0 font-semibold text-gray-700">
          {demand.locality.name}
        </span>
        <span aria-hidden>•</span>
        <span className="truncate">{demand.buyer.name}</span>
      </p>
      <DemandSummary demand={demand} />
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs">
        <span
          className="inline-flex items-center gap-1 text-gray-500"
          title={`Aprox., en línea recta · ${PROVINCE_LABEL[demand.locality.province]}`}
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden />
          {formatKm(demand.distanceKm)} de vos
        </span>
        {demand.status === "open" && (
          <Link
            href={`/demands/${demand.id}`}
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            {demand.compatibleCount}{" "}
            {demand.compatibleCount === 1
              ? "oferta compatible"
              : "ofertas compatibles"}{" "}
            →
          </Link>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-start gap-2">{actions}</div>
      )}
    </article>
  );
}
