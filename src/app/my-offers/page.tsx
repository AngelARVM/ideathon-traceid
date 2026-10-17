import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OfferStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatTons } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/labels";
import { markOfferAvailable, withdrawOffer } from "@/lib/offers/actions";
import { listMyOffers, type MyOffer } from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { OfferActionButton } from "../offers/_components/OfferActionButton";

export const metadata: Metadata = { title: "Mis ofertas" };

export default function MyOffersPage({
  searchParams,
}: PageProps<"/my-offers">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Mis ofertas"
        description="Tus lotes publicados, con su stock y las propuestas que esperan respuesta."
        actions={
          <LinkButton href="/offers/new">
            <Plus className="h-4 w-4" aria-hidden />
            Publicar oferta
          </LinkButton>
        }
      />
      <Suspense
        fallback={
          <div className="h-80 animate-pulse rounded-2xl bg-stone-200/60 dark:bg-stone-800/60" />
        }
      >
        <MyOffers searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MyOffers({
  searchParams,
}: {
  searchParams: PageProps<"/my-offers">["searchParams"];
}) {
  const persona = await requirePersona();
  if (persona.role !== "seller") notFound();
  const showWithdrawn = (await searchParams).showWithdrawn === "true";

  const offers = await listMyOffers(persona);
  const withdrawnCount = offers.filter((o) => o.status === "withdrawn").length;
  const visible = showWithdrawn
    ? offers
    : offers.filter((o) => o.status !== "withdrawn");

  return (
    <div className="flex flex-col gap-4">
      {withdrawnCount > 0 && (
        <div className="flex justify-end">
          <Link
            href={
              showWithdrawn ? "/my-offers" : "/my-offers?showWithdrawn=true"
            }
            className="text-sm font-semibold text-campo-700 hover:underline dark:text-campo-300"
          >
            {showWithdrawn
              ? "Ocultar retiradas"
              : `Mostrar retiradas (${withdrawnCount})`}
          </Link>
        </div>
      )}
      {visible.length === 0 ? (
        <EmptyState
          title="Todavía no tenés ofertas activas"
          description="Publicá un lote para que los compradores cercanos lo encuentren."
          action={<LinkButton href="/offers/new">Publicar oferta</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((offer) => (
            <MyOfferRow key={offer.id} offer={offer} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MyOfferRow({ offer }: { offer: MyOffer }) {
  const withdrawn = offer.status === "withdrawn";
  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-stone-800 dark:bg-stone-900 ${withdrawn ? "opacity-70" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <OfferStatusBadge
            status={offer.status}
            quantityTons={offer.quantityTons}
          />
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {CATEGORY_LABEL[offer.category]}
          </span>
        </div>
        <Link
          href={`/offers/${offer.id}`}
          className="mt-1 block truncate font-bold hover:text-campo-700 dark:hover:text-campo-300"
        >
          {offer.title}
        </Link>
        <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
          <span className="font-mono-num font-semibold text-stone-900 dark:text-stone-100">
            {formatTons(offer.quantityTons)}
          </span>{" "}
          · {offer.localityName}
          {offer.status === "estimated" && offer.estimatedDate && (
            <> · estimada para el {formatDate(offer.estimatedDate)}</>
          )}
          {" · "}
          {offer.pendingProposals > 0 ? (
            <Link
              href="/proposals"
              className="font-semibold text-campo-700 hover:underline dark:text-campo-300"
            >
              {offer.pendingProposals}{" "}
              {offer.pendingProposals === 1
                ? "propuesta pendiente"
                : "propuestas pendientes"}
            </Link>
          ) : (
            "sin propuestas pendientes"
          )}
        </p>
      </div>
      {!withdrawn && (
        <div className="flex shrink-0 flex-wrap items-start gap-2">
          <LinkButton
            href={`/offers/${offer.id}/edit`}
            variant="secondary"
            size="sm"
          >
            Editar
          </LinkButton>
          {offer.status === "estimated" && (
            <OfferActionButton
              action={markOfferAvailable}
              offerId={offer.id}
              label="Marcar disponible"
              pendingLabel="Marcando…"
              size="sm"
            />
          )}
          <OfferActionButton
            action={withdrawOffer}
            offerId={offer.id}
            label="Retirar"
            pendingLabel="Retirando…"
            confirmMessage={`¿Retirar «${offer.title}»? Deja de aparecer en el catálogo y no se puede deshacer.`}
            variant="ghost"
            size="sm"
          />
        </div>
      )}
    </li>
  );
}
