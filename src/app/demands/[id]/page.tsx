import { ChevronRight, MapPin, Navigation, PackagePlus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORY_IMAGE } from "@/lib/category-media";
import { getDemandDetail, listCompatibleOffers } from "@/lib/demands/queries";
import { formatDate, formatKm } from "@/lib/format";
import { distanceKm } from "@/lib/geo";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";
import { requirePersona } from "@/lib/persona";
import { CompatibleOfferCard } from "../_components/CompatibleOfferCard";
import { DemandStatusBadge, DemandSummary } from "../_components/DemandCard";
import { DemandLoading } from "../_components/DemandShell";
import { WithdrawDemandButton } from "../_components/WithdrawDemandButton";

export const metadata: Metadata = { title: "Detalle de demanda" };
type Props = { params: Promise<{ id: string }> };

export default function DemandDetailPage(props: Props) {
  return (
    <Suspense fallback={<DemandLoading />}>
      <DemandDetailContent {...props} />
    </Suspense>
  );
}

async function DemandDetailContent({ params }: Props) {
  const persona = await requirePersona();
  const demand = await getDemandDetail((await params).id, persona);
  const matches =
    demand.status === "open" ? await listCompatibleOffers(demand) : [];
  const ownsDemand = demand.buyerId === persona.id;
  const offerParams = new URLSearchParams({
    category: demand.category,
    quantity: demand.quantityTons.toString(),
    title: demand.title,
    demand: demand.id,
  });
  const image = CATEGORY_IMAGE[demand.category];

  return (
    <div className="space-y-8">
      <nav
        aria-label="Ruta"
        className="flex min-w-0 items-center gap-1 text-xs text-gray-500"
      >
        <Link href="/demands" className="shrink-0 hover:text-brand-600">
          Demandas
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate font-semibold text-gray-800">
          {demand.title}
        </span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Card className="overflow-hidden lg:col-span-7">
          <div className="relative h-32 bg-gray-100 sm:h-40">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute inset-x-4 bottom-3 flex items-center gap-2">
              <span className="rounded bg-white/95 px-2 py-0.5 text-xs font-semibold text-cyan-800 shadow-xs">
                {CATEGORY_LABEL[demand.category]}
              </span>
              <DemandStatusBadge status={demand.status} />
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                <span className="font-semibold text-gray-700">
                  {demand.locality.name},{" "}
                  {PROVINCE_LABEL[demand.locality.province]}
                </span>
                <span aria-hidden>•</span>
                {demand.buyer.name}
              </p>
              <h1 className="mt-1 text-xl font-extrabold leading-snug text-gray-900 sm:text-2xl">
                {demand.title}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                <Navigation className="h-3.5 w-3.5" aria-hidden />
                {formatKm(distanceKm(persona.locality, demand.locality))} desde{" "}
                {persona.locality.name} · aprox., en línea recta
              </p>
            </div>
            <DemandSummary demand={demand} />
            {demand.description && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {demand.description}
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-5">
          {persona.role === "seller" && demand.status === "open" && (
            <Card className="space-y-3 border-brand-300 bg-brand-50 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                <PackagePlus className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-bold text-brand-800">
                  ¿Tenés este subproducto?
                </h2>
                <p className="mt-1 text-sm text-brand-800">
                  Publicá una oferta para que {demand.buyer.name} conozca tu
                  lote. El formulario llega precargado con la categoría y la
                  cantidad.
                </p>
              </div>
              <LinkButton
                href={`/offers/new?${offerParams.toString()}`}
                className="w-full"
              >
                Publicar oferta para esta demanda
              </LinkButton>
            </Card>
          )}
          {ownsDemand && demand.status === "open" && (
            <Card className="space-y-3 p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Tu demanda
              </h2>
              <p className="text-sm text-gray-600">
                {matches.length}{" "}
                {matches.length === 1
                  ? "oferta compatible"
                  : "ofertas compatibles"}{" "}
                dentro de {demand.radiusKm} km.
              </p>
              <div className="flex flex-wrap gap-2">
                <LinkButton
                  href={`/demands/${demand.id}/edit`}
                  variant="secondary"
                  size="sm"
                >
                  Editar
                </LinkButton>
                <WithdrawDemandButton id={demand.id} />
              </div>
            </Card>
          )}
        </div>
      </div>

      {demand.status === "withdrawn" ? (
        <EmptyState
          title="Demanda retirada"
          description="Esta demanda ya no aparece en el listado público y no puede editarse."
          action={
            <LinkButton href="/my-demands" variant="secondary" size="sm">
              Volver a mis demandas
            </LinkButton>
          }
        />
      ) : (
        <section aria-labelledby="compatible-offers" className="space-y-4">
          <div className="border-b border-gray-200 pb-3">
            <h2
              id="compatible-offers"
              className="text-xl font-extrabold text-gray-900"
            >
              Ofertas compatibles ({matches.length})
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Misma categoría · dentro de {demand.radiusKm} km · disponibles, o
              estimadas{" "}
              {demand.neededBy
                ? `para el ${formatDate(demand.neededBy)} o antes`
                : "sin límite de fecha"}
              . Pueden cubrir solo parte de lo pedido o superar el precio
              máximo.
            </p>
          </div>
          {matches.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map((match) => (
                <CompatibleOfferCard
                  key={match.offer.id}
                  match={match}
                  requestedTons={demand.quantityTons.toString()}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`Todavía no hay ofertas compatibles dentro de ${demand.radiusKm} km`}
              description="Las ofertas aparecerán aquí cuando coincidan con la categoría, el radio y la fecha de la demanda."
            />
          )}
        </section>
      )}
    </div>
  );
}
