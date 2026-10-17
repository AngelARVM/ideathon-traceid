import { CalendarClock, MapPin, Navigation } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OfferStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  formatArsPerTon,
  formatDate,
  formatKm,
  formatTons,
} from "@/lib/format";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";
import { getOfferToPropose } from "@/lib/negotiation/queries";
import { requirePersona } from "@/lib/persona";
import { ProposalForm } from "./ProposalForm";

export const metadata: Metadata = { title: "Proponer compra" };

export default function ProposePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Suspense fallback={<div className="h-96" />}>
        <ProposeContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProposeContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const persona = await requirePersona();
  if (persona.role !== "buyer") {
    return (
      <EmptyState
        title="Solo los compradores pueden proponer"
        description="Elegí una persona compradora desde el selector del header para enviar una propuesta."
        action={
          <LinkButton href={`/offers/${id}`} variant="secondary">
            Volver a la oferta
          </LinkButton>
        }
      />
    );
  }

  const offer = await getOfferToPropose(id, persona);
  if (!offer) notFound();

  const soldOut = Number(offer.quantityTons) <= 0;

  return (
    <>
      <PageHeader
        title="Proponer compra"
        description="Proponé cantidad y precio. El vendedor puede aceptar, rechazar o contraofertar una vez."
      />

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="rounded-lg bg-campo-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-campo-800 dark:bg-campo-950/60 dark:text-campo-200">
            {CATEGORY_LABEL[offer.category]}
          </span>
          <OfferStatusBadge
            status={offer.status}
            quantityTons={offer.quantityTons}
          />
        </div>
        <h2 className="mt-3 text-lg font-bold">
          <Link
            href={`/offers/${offer.id}`}
            className="hover:text-campo-700 dark:hover:text-campo-300"
          >
            {offer.title}
          </Link>
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden />
            {offer.locality.name}, {PROVINCE_LABEL[offer.locality.province]} ·{" "}
            {offer.sellerName}
          </span>
          <span
            className="inline-flex items-center gap-1"
            title="Aprox., en línea recta"
          >
            <Navigation className="h-4 w-4" aria-hidden />
            {formatKm(offer.distanceKm)} desde {persona.locality.name} (aprox.,
            en línea recta)
          </span>
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-stone-100 pt-4 dark:border-stone-800">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Disponible
            </dt>
            <dd className="font-mono-num text-lg font-bold">
              {formatTons(offer.quantityTons)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Precio de referencia
            </dt>
            <dd className="font-mono-num text-lg font-bold text-campo-700 dark:text-campo-300">
              {offer.pricePerTon
                ? formatArsPerTon(offer.pricePerTon)
                : "A convenir"}
            </dd>
          </div>
        </dl>
      </section>

      {offer.status === "estimated" && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>Oferta estimada</strong>
            {offer.estimatedDate &&
              ` · disponible aprox. ${formatDate(offer.estimatedDate)}`}
            . Podés enviar una propuesta, pero el acuerdo solo se confirma
            cuando el vendedor la marque como disponible.
          </span>
        </p>
      )}

      <div className="mt-6">
        {soldOut ? (
          <EmptyState
            title="Oferta agotada"
            description="Esta oferta no tiene stock y no admite propuestas nuevas."
          />
        ) : offer.openProposalId ? (
          <EmptyState
            title="Ya tenés una propuesta abierta sobre esta oferta"
            description="Seguí la negociación desde la propuesta existente."
            action={
              <LinkButton href={`/proposals/${offer.openProposalId}`}>
                Ver mi propuesta
              </LinkButton>
            }
          />
        ) : (
          <ProposalForm
            offerId={offer.id}
            stockTons={offer.quantityTons}
            referencePrice={offer.pricePerTon}
          />
        )}
      </div>
    </>
  );
}
