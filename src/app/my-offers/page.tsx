import { CalendarClock, Inbox, Package, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OfferStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stat } from "@/components/ui/Stat";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate, formatTons } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/labels";
import { markOfferAvailable, withdrawOffer } from "@/lib/offers/actions";
import { listMyOffers, type MyOffer } from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { OfferActionButton } from "../offers/_components/OfferActionButton";

export const metadata: Metadata = { title: "Mis ofertas" };

const TABS = ["inventory", "estimated", "withdrawn"] as const;
type Tab = (typeof TABS)[number];

export default function MyOffersPage({
  searchParams,
}: PageProps<"/my-offers">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-gray-200/60" />
        }
      >
        <SellerPanel searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SellerPanel({
  searchParams,
}: {
  searchParams: PageProps<"/my-offers">["searchParams"];
}) {
  const persona = await requirePersona();
  if (persona.role !== "seller") notFound();
  const raw = (await searchParams).tab;
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "inventory";

  const offers = await listMyOffers(persona);
  const byTab: Record<Tab, MyOffer[]> = {
    inventory: offers.filter((o) => o.status === "available"),
    estimated: offers.filter((o) => o.status === "estimated"),
    withdrawn: offers.filter((o) => o.status === "withdrawn"),
  };
  const pending = offers.reduce((n, o) => n + o.pendingProposals, 0);
  const visible = byTab[tab];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-brand-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Panel del vendedor
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {persona.name}
          </h1>
          <p className="mt-1 text-sm text-emerald-100">
            {persona.tagline && `${persona.tagline} · `}
            {persona.locality.name}. Tus lotes, su stock y las propuestas que
            esperan respuesta.
          </p>
        </div>
        <Link
          href="/offers/new"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-brand-600 transition hover:bg-emerald-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Publicar oferta
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Ofertas activas"
          value={byTab.inventory.length}
          icon={<Package className="h-4 w-4" aria-hidden />}
        />
        <Stat
          label="Estimativos"
          value={byTab.estimated.length}
          icon={<CalendarClock className="h-4 w-4" aria-hidden />}
        />
        <Stat
          label="Propuestas pendientes"
          value={pending}
          hint={
            pending > 0 ? (
              <Link
                href="/proposals?status=pending"
                className="font-semibold text-brand-600 hover:underline"
              >
                Responder →
              </Link>
            ) : (
              "Nada para responder"
            )
          }
          icon={<Inbox className="h-4 w-4" aria-hidden />}
        />
        {/* TODO(M7): seller-kpis — Tn en stock, propuestas que esperan al comprador, acuerdos, Tn y monto acordados. */}
        <Stat label="Retiradas" value={byTab.withdrawn.length} />
      </div>

      {/* TODO(M7): seller-agreements-tab — pestaña Acuerdos con listAgreementsFor. */}
      <Tabs
        label="Secciones del panel"
        active={tab}
        items={[
          {
            key: "inventory",
            label: "Inventario",
            href: "/my-offers",
            count: byTab.inventory.length,
          },
          {
            key: "estimated",
            label: "Estimativos",
            href: "/my-offers?tab=estimated",
            count: byTab.estimated.length,
          },
          {
            key: "withdrawn",
            label: "Retiradas",
            href: "/my-offers?tab=withdrawn",
            count: byTab.withdrawn.length,
          },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          title={
            tab === "inventory"
              ? "No tenés lotes disponibles"
              : tab === "estimated"
                ? "No tenés estimativos"
                : "No tenés ofertas retiradas"
          }
          description={
            tab === "withdrawn"
              ? undefined
              : "Publicá un lote para que los compradores cercanos lo encuentren."
          }
          action={
            tab === "withdrawn" ? undefined : (
              <LinkButton href="/offers/new" size="sm">
                Publicar oferta
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Pendientes</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((offer) => (
                <OfferRow key={offer.id} offer={offer} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OfferRow({ offer }: { offer: MyOffer }) {
  const withdrawn = offer.status === "withdrawn";
  return (
    <tr className={withdrawn ? "text-gray-500" : ""}>
      <td className="px-4 py-3">
        <Link
          href={`/offers/${offer.id}`}
          className="font-semibold text-gray-900 hover:text-brand-600"
        >
          {offer.title}
        </Link>
        <p className="text-xs text-gray-500">
          {CATEGORY_LABEL[offer.category]} · {offer.localityName}
          {offer.status === "estimated" && offer.estimatedDate && (
            <> · para el {formatDate(offer.estimatedDate)}</>
          )}
        </p>
      </td>
      <td className="px-4 py-3">
        <OfferStatusBadge
          status={offer.status}
          quantityTons={offer.quantityTons}
        />
      </td>
      <td className="px-4 py-3 text-right font-mono-num font-semibold text-gray-900">
        {formatTons(offer.quantityTons)}
      </td>
      <td className="px-4 py-3 text-right">
        {offer.pendingProposals > 0 ? (
          <Link
            href="/proposals?status=pending"
            className="inline-flex min-w-6 justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white"
          >
            {offer.pendingProposals}
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {!withdrawn && (
          <div className="flex flex-wrap items-start justify-end gap-2">
            <LinkButton
              href={`/offers/${offer.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Editar
            </LinkButton>
            {offer.status === "estimated" && (
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
              title={`¿Retirar «${offer.title}»?`}
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
      </td>
    </tr>
  );
}
