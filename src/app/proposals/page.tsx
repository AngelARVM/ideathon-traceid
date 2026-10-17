import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProposalStatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatArs, formatArsPerTon, formatTons } from "@/lib/format";
import { formatDateTime } from "@/lib/negotiation/format";
import { listProposalsFor, type ProposalView } from "@/lib/negotiation/queries";
import { requirePersona } from "@/lib/persona";

export const metadata: Metadata = { title: "Propuestas" };

export default function ProposalsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Suspense fallback={<div className="h-96" />}>
        <ProposalsContent />
      </Suspense>
    </div>
  );
}

async function ProposalsContent() {
  const persona = await requirePersona();
  const { needsAction, history } = await listProposalsFor(persona);
  const isSeller = persona.role === "seller";

  return (
    <>
      <PageHeader
        title={isSeller ? "Propuestas recibidas" : "Mis propuestas"}
        description={
          isSeller
            ? "Propuestas de compradores sobre tus ofertas."
            : "Propuestas que enviaste a vendedores."
        }
      />

      {needsAction.length === 0 && history.length === 0 ? (
        <EmptyState
          title="Todavía no hay propuestas"
          description={
            isSeller
              ? "Cuando un comprador proponga sobre una de tus ofertas, va a aparecer acá."
              : "Explorá las ofertas y enviá tu primera propuesta."
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <ProposalSection
            title="Requieren tu acción"
            empty="Nada pendiente de tu lado."
            items={needsAction}
          />
          <ProposalSection
            title="Historial"
            empty="Sin propuestas en el historial."
            items={history}
          />
        </div>
      )}
    </>
  );
}

function ProposalSection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: ProposalView[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {title} · {items.length}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/proposals/${p.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-stone-50 dark:hover:bg-stone-800/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.offer.title}</p>
                  <p className="truncate text-xs text-stone-600 dark:text-stone-400">
                    {p.viewerRole === "seller" ? "De" : "A"}{" "}
                    {p.counterparty.name} · {p.counterparty.locality} ·{" "}
                    {formatDateTime(p.updatedAt)}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono-num text-sm font-semibold">
                    {formatTons(p.terms.quantityTons)} ×{" "}
                    {formatArsPerTon(p.terms.pricePerTon)}
                  </p>
                  <p className="font-mono-num text-xs text-stone-500 dark:text-stone-400">
                    {formatArs(p.total)}
                  </p>
                </div>
                <ProposalStatusBadge status={p.status} />
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-stone-400"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
