import {
  CalendarClock,
  Droplets,
  Flame,
  MapPin,
  Navigation,
  Package,
  Scale,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { OfferStatusBadge } from "@/components/StatusBadge";
import type {
  Category,
  OfferStatus,
  Presentation,
  Province,
} from "@/generated/prisma/enums";
import { CATEGORY_IMAGE } from "@/lib/category-media";
import { formatArs, formatDate, formatKm, formatTons } from "@/lib/format";
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

/** Tarjeta de lote al estilo de codigo-ui (`ProductCard`). Toda la tarjeta enlaza al detalle. */
export function OfferCard({
  offer,
  distanceKm,
}: {
  offer: OfferCardData;
  distanceKm?: number;
}) {
  const soldOut =
    offer.status === "available" && Number(offer.quantityTons) <= 0;
  const image = CATEGORY_IMAGE[offer.category];

  return (
    <Link
      href={`/offers/${offer.id}`}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card transition hover:border-brand-300 hover:shadow-card-hover ${soldOut ? "opacity-70" : ""}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-2">
          <span className="truncate rounded bg-white/95 px-2 py-0.5 text-xs font-semibold text-cyan-800 shadow-xs">
            {CATEGORY_LABEL[offer.category]}
          </span>
          <OfferStatusBadge
            status={offer.status}
            quantityTons={offer.quantityTons}
          />
        </div>
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 text-xs">
          <span className="rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-xs">
            {formatTons(offer.quantityTons)}{" "}
            {offer.status === "estimated" ? "estimadas" : "disponibles"}
          </span>
          {distanceKm !== undefined && (
            <span
              className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200"
              title="Aprox., en línea recta"
            >
              <Navigation className="h-3 w-3" aria-hidden />
              {formatKm(distanceKm)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
          <span
            className="shrink-0 font-semibold text-gray-700"
            title={PROVINCE_LABEL[offer.locality.province]}
          >
            {offer.locality.name}
          </span>
          <span aria-hidden>•</span>
          <span className="truncate">{offer.seller.name}</span>
        </p>

        <h3 className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-brand-600">
          {offer.title}
        </h3>

        <div className="space-y-1.5 rounded-lg border border-gray-100 bg-slate-50 p-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Spec
              icon={<Droplets className="h-3.5 w-3.5 text-blue-500" />}
              label="Humedad"
              value={
                offer.humidityPct !== null
                  ? `${Number(offer.humidityPct).toLocaleString("es-AR")} %`
                  : "N/D"
              }
            />
            <Spec
              icon={<Flame className="h-3.5 w-3.5 text-amber-500" />}
              label="Poder calorífico"
              value={
                offer.calorificKcalKg !== null
                  ? `${offer.calorificKcalKg.toLocaleString("es-AR")} kcal/kg`
                  : "N/D"
              }
            />
          </div>
          {(offer.presentation || offer.hasWeighbridge) && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-200/60 pt-1.5 text-[11px] text-gray-500">
              <span className="flex items-center gap-1 truncate">
                {offer.presentation && (
                  <>
                    <Package className="h-3 w-3" aria-hidden />
                    {PRESENTATION_LABEL[offer.presentation]}
                  </>
                )}
              </span>
              {offer.hasWeighbridge && (
                <span className="flex shrink-0 items-center gap-1 text-brand-700">
                  <Scale className="h-3 w-3" aria-hidden />
                  Báscula en planta
                </span>
              )}
            </div>
          )}
        </div>

        {offer.status === "estimated" && offer.estimatedDate && (
          <p className="flex items-center gap-1 text-xs font-medium text-amber-700">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            Estimada para el {formatDate(offer.estimatedDate)}
          </p>
        )}

        <div className="mt-auto border-t border-gray-100 pt-3">
          <span className="block text-[11px] font-medium text-gray-400">
            Precio de referencia
          </span>
          {offer.pricePerTon ? (
            <p className="flex items-baseline gap-1">
              <span className="font-mono-num text-lg font-extrabold text-brand-600">
                {formatArs(offer.pricePerTon)}
              </span>
              <span className="text-xs text-gray-500">/ Tn</span>
            </p>
          ) : (
            <p className="text-sm font-bold text-gray-700">A convenir</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden>{icon}</span>
      <div className="min-w-0">
        <span className="block text-[10px] leading-tight text-gray-400">
          {label}
        </span>
        <span className="block truncate font-bold text-gray-800">{value}</span>
      </div>
    </div>
  );
}
