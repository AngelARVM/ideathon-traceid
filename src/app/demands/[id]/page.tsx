import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDemandDetail, listCompatibleOffers } from "@/lib/demands/queries";
import { formatDate, formatKm } from "@/lib/format";
import { distanceKm } from "@/lib/geo";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";
import { requirePersona } from "@/lib/persona";
import { CompatibleOfferCard } from "../_components/CompatibleOfferCard";
import { DemandSummary } from "../_components/DemandCard";
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
  return (
    <>
      <PageHeader
        title={demand.title}
        description={CATEGORY_LABEL[demand.category]}
        actions={
          ownsDemand && demand.status === "open" ? (
            <>
              <LinkButton
                href={`/demands/${demand.id}/edit`}
                variant="secondary"
                size="sm"
              >
                Editar
              </LinkButton>
              <WithdrawDemandButton id={demand.id} />
            </>
          ) : undefined
        }
      />
      <section
        aria-label="Datos de la demanda"
        className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-900"
      >
        <p className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {demand.buyer.name} · {demand.locality.name},{" "}
          {PROVINCE_LABEL[demand.locality.province]}
        </p>
        <DemandSummary demand={demand} />
        {demand.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {demand.description}
          </p>
        )}
        <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
          {formatKm(distanceKm(persona.locality, demand.locality))} desde{" "}
          {persona.locality.name} (aprox., en línea recta) · búsqueda dentro de{" "}
          {demand.radiusKm} km
        </p>
      </section>
      {demand.status === "withdrawn" ? (
        <EmptyState
          title="Demanda retirada"
          description="Esta demanda ya no aparece en el listado público y no puede editarse."
          action={
            <LinkButton href="/my-demands" variant="secondary">
              Volver a mis demandas
            </LinkButton>
          }
        />
      ) : (
        <>
          {persona.role === "seller" && (
            <aside className="mb-8 flex flex-col items-start gap-4 rounded-2xl border border-campo-200 bg-campo-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-campo-800 dark:bg-campo-950/40">
              <div>
                <h2 className="font-bold text-campo-900 dark:text-campo-100">
                  ¿Tenés este subproducto?
                </h2>
                <p className="mt-1 text-sm text-campo-800 dark:text-campo-200">
                  Publicá una oferta para que el comprador conozca tu lote.
                </p>
              </div>
              <LinkButton href={`/offers/new?${offerParams.toString()}`}>
                Publicar oferta para esta demanda
              </LinkButton>
            </aside>
          )}
          <section aria-labelledby="compatible-offers">
            <h2 id="compatible-offers" className="text-xl font-bold">
              Ofertas compatibles ({matches.length})
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Misma categoría · dentro de {demand.radiusKm} km · disponibles, o
              estimadas{" "}
              {demand.neededBy
                ? `para el ${formatDate(demand.neededBy)} o antes`
                : "sin límite de fecha"}
              .
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Pueden cubrir solo parte de lo pedido o superar el precio máximo.
              Abrí una oferta para conocerla y proponer una compra.
            </p>
            <div className="mt-5">
              {matches.length ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  description="Las ofertas aparecerán aquí cuando coincidan con la categoría, el radio y la fecha de tu demanda."
                />
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
