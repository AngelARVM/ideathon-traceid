import { CalendarClock, ChevronRight, MapPin, Navigation } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OfferStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CATEGORY_IMAGE } from "@/lib/category-media";
import { formatArs, formatDate, formatKm, formatTons } from "@/lib/format";
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
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-gray-200/60" />
        }
      >
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
          href={`/offers/${offer.id}`}
          className="truncate hover:text-brand-600"
        >
          {offer.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="shrink-0 font-semibold text-gray-800">Proponer</span>
      </nav>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Proponer compra
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Proponé cantidad y precio. El vendedor puede aceptar, rechazar o
          contraofertar una vez.
        </p>
      </div>

      <Card className="flex gap-4 p-4">
        <div className="relative hidden h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:block">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800">
              {CATEGORY_LABEL[offer.category]}
            </span>
            <OfferStatusBadge
              status={offer.status}
              quantityTons={offer.quantityTons}
            />
          </div>
          <h2 className="truncate font-bold text-gray-900">
            <Link href={`/offers/${offer.id}`} className="hover:text-brand-600">
              {offer.title}
            </Link>
          </h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              {offer.locality.name}, {PROVINCE_LABEL[offer.locality.province]} ·{" "}
              {offer.sellerName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5" aria-hidden />
              {formatKm(offer.distanceKm)} · aprox., en línea recta
            </span>
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-mono-num font-bold text-gray-900">
              {formatTons(offer.quantityTons)}
            </span>{" "}
            disponibles ·{" "}
            {offer.pricePerTon ? (
              <>
                <span className="font-mono-num font-bold text-brand-600">
                  {formatArs(offer.pricePerTon)}
                </span>{" "}
                / Tn de referencia
              </>
            ) : (
              "Precio a convenir"
            )}
          </p>
        </div>
      </Card>

      {offer.status === "estimated" && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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
  );
}
