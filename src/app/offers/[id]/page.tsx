import {
  CalendarClock,
  ChevronRight,
  FileText,
  MapPin,
  Navigation,
  Store,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { OfferStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Descriptions } from "@/components/ui/Descriptions";
import { Dialog } from "@/components/ui/Dialog";
import { CATEGORY_IMAGE } from "@/lib/category-media";
import { formatArs, formatDate, formatKm, formatTons } from "@/lib/format";
import {
  CATEGORY_LABEL,
  FREIGHT_LABEL,
  PRESENTATION_LABEL,
  PROVINCE_LABEL,
} from "@/lib/labels";
import { markOfferAvailable, withdrawOffer } from "@/lib/offers/actions";
import { getOfferDetail } from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { LoadCalculator } from "../_components/LoadCalculator";
import { OfferActionButton } from "../_components/OfferActionButton";

export default function OfferDetailPage({ params }: PageProps<"/offers/[id]">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-12" aria-hidden>
            <div className="h-[28rem] animate-pulse rounded-xl bg-gray-200/60 lg:col-span-7" />
            <div className="h-[28rem] animate-pulse rounded-xl bg-gray-200/60 lg:col-span-5" />
          </div>
        }
      >
        <OfferDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OfferDetail({
  params,
}: {
  params: PageProps<"/offers/[id]">["params"];
}) {
  const persona = await requirePersona();
  const { id } = await params;
  const { offer, isOwner, distanceKm } = await getOfferDetail(id, persona);

  const withdrawn = offer.status === "withdrawn";
  const estimated = offer.status === "estimated";
  const hasStock = offer.quantityTons.gt(0);
  // §12.3: M3 repite estas validaciones en el servidor.
  const canPropose = persona.role === "buyer" && !withdrawn && hasStock;
  const image = CATEGORY_IMAGE[offer.category];

  return (
    <div className="space-y-6">
      <nav
        aria-label="Ruta"
        className="flex min-w-0 items-center gap-1 text-xs text-gray-500"
      >
        <Link href="/offers" className="shrink-0 hover:text-brand-600">
          Catálogo
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <Link
          href={`/offers?category=${offer.category}`}
          className="shrink-0 hover:text-brand-600"
        >
          {CATEGORY_LABEL[offer.category]}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate font-semibold text-gray-800">
          {offer.title}
        </span>
      </nav>

      {withdrawn && (
        <p className="rounded-xl border border-gray-200 bg-gray-100 p-4 text-sm text-gray-700">
          Retiraste esta oferta: ya no aparece en el catálogo ni admite
          propuestas.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/10] bg-gray-100">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                preload
                sizes="(min-width: 1280px) 720px, (min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <div className="absolute left-3 top-3 flex gap-2">
                <span className="rounded bg-white/95 px-2 py-0.5 text-xs font-semibold text-cyan-800 shadow-xs">
                  {CATEGORY_LABEL[offer.category]}
                </span>
                <OfferStatusBadge
                  status={offer.status}
                  quantityTons={offer.quantityTons}
                />
              </div>
            </div>
            <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
              Imagen ilustrativa de la categoría.
            </p>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-5 lg:row-span-2">
          <Card className="space-y-5 p-5 shadow-md">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                <span className="font-semibold text-gray-700">
                  {offer.locality.name},{" "}
                  {PROVINCE_LABEL[offer.locality.province]}
                </span>
              </p>
              <h1 className="text-xl font-extrabold leading-snug text-gray-900 sm:text-2xl">
                {offer.title}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                <Navigation className="h-3.5 w-3.5" aria-hidden />
                {formatKm(distanceKm)} desde {persona.locality.name} · aprox.,
                en línea recta
              </p>
            </div>

            <div className="flex items-end justify-between gap-3 rounded-lg border border-brand-300 bg-brand-50 p-3.5">
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-500">
                  Precio de referencia
                </span>
                {offer.pricePerTon ? (
                  <p className="flex items-baseline gap-1">
                    <span className="font-mono-num text-2xl font-black text-brand-600">
                      {formatArs(offer.pricePerTon)}
                    </span>
                    <span className="text-xs text-gray-500">/ Tn</span>
                  </p>
                ) : (
                  <p className="text-lg font-extrabold text-gray-800">
                    Precio a convenir
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-gray-500">
                  {estimated ? "Volumen estimado" : "Stock disponible"}
                </span>
                <span className="font-mono-num text-sm font-extrabold text-gray-900">
                  {formatTons(offer.quantityTons)}
                </span>
              </div>
            </div>

            {estimated && (
              <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                <p>
                  <span className="font-bold">
                    Oferta estimada · disponible aprox.{" "}
                    {offer.estimatedDate
                      ? formatDate(offer.estimatedDate)
                      : "—"}
                    .
                  </span>{" "}
                  Podés enviar una propuesta, pero el acuerdo solo se confirma
                  cuando el vendedor la marque como disponible.
                </p>
              </div>
            )}

            {!withdrawn && hasStock && (
              <LoadCalculator
                pricePerTon={offer.pricePerTon?.toString() ?? null}
                stockTons={offer.quantityTons.toString()}
                proposeHref={canPropose ? `/offers/${offer.id}/propose` : null}
              />
            )}

            {isOwner && !withdrawn && (
              <div className="flex flex-wrap items-start gap-2 border-t border-gray-100 pt-4">
                <LinkButton
                  href={`/offers/${offer.id}/edit`}
                  variant="secondary"
                  size="sm"
                >
                  Editar
                </LinkButton>
                {estimated && (
                  <Dialog
                    trigger="Marcar disponible"
                    triggerVariant="primary"
                    title="¿Marcar la oferta como disponible?"
                    description="Las propuestas aceptadas ya se van a poder confirmar como acuerdo."
                  >
                    <OfferActionButton
                      action={markOfferAvailable}
                      offerId={offer.id}
                      label="Marcar disponible"
                      pendingLabel="Marcando…"
                      variant="primary"
                      size="sm"
                    />
                  </Dialog>
                )}
                <Dialog
                  trigger="Retirar"
                  triggerVariant="danger"
                  title="¿Retirar esta oferta?"
                  description="Deja de aparecer en el catálogo y no admite propuestas nuevas. No se puede deshacer."
                >
                  <OfferActionButton
                    action={withdrawOffer}
                    offerId={offer.id}
                    label="Retirar oferta"
                    pendingLabel="Retirando…"
                    variant="danger"
                    size="sm"
                  />
                </Dialog>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              Vendedor
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Store className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">
                  {offer.seller.name}
                </p>
                {offer.seller.tagline && (
                  <p className="truncate text-xs text-gray-500">
                    {offer.seller.tagline}
                  </p>
                )}
              </div>
            </div>
            {/* TODO(M7): seller-stats — antigüedad, ofertas activas, acuerdos y Tn acordadas (getSellerStats). */}
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <h2 className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5 font-bold text-gray-900">
              <FileText className="h-4 w-4 text-brand-600" aria-hidden />
              Descripción y ficha técnica
            </h2>
            <div className="space-y-4 p-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {offer.description}
              </p>
              <Descriptions
                items={[
                  offer.humidityPct !== null && {
                    label: "Humedad",
                    value: `${Number(offer.humidityPct).toLocaleString("es-AR")} %`,
                  },
                  offer.calorificKcalKg !== null && {
                    label: "Poder calorífico",
                    value: `${offer.calorificKcalKg.toLocaleString("es-AR")} kcal/kg`,
                  },
                  offer.presentation && {
                    label: "Presentación",
                    value: PRESENTATION_LABEL[offer.presentation],
                  },
                  { label: "Flete", value: FREIGHT_LABEL[offer.freight] },
                  {
                    label: "Báscula en planta",
                    value: offer.hasWeighbridge ? "Sí" : "No",
                  },
                  estimated &&
                    offer.estimatedDate && {
                      label: "Disponible aprox.",
                      value: formatDate(offer.estimatedDate),
                    },
                ]}
              />
              {offer.labAnalysis && (
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-gray-900">
                    Análisis de laboratorio
                  </p>
                  <p className="mt-1 text-gray-700">{offer.labAnalysis}</p>
                  <p className="mt-1 text-xs italic text-gray-500">
                    Declarado por el vendedor, no verificado por SubMarket.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
