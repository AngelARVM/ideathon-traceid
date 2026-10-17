import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { ProposalStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProposalStatus } from "@/generated/prisma/enums";
import { formatArs, formatArsPerTon, formatTons } from "@/lib/format";
import { CATEGORY_LABEL, PROPOSAL_STATUS_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/negotiation/format";
import { listProposalsFor, type ProposalView } from "@/lib/negotiation/queries";
import { requirePersona } from "@/lib/persona";

export const metadata: Metadata = { title: "Propuestas" };

export default function ProposalsPage({
  searchParams,
}: PageProps<"/proposals">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-gray-200/60" />
        }
      >
        <ProposalsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** `?status=` válido o `undefined` (todas). */
function parseStatus(v: string | string[] | undefined) {
  const s = Array.isArray(v) ? v[0] : v;
  return Object.values<string>(ProposalStatus).includes(s ?? "")
    ? (s as ProposalStatus)
    : undefined;
}

async function ProposalsContent({
  searchParams,
}: {
  searchParams: PageProps<"/proposals">["searchParams"];
}) {
  const persona = await requirePersona();
  const status = parseStatus((await searchParams).status);
  const { needsAction, history } = await listProposalsFor(persona);
  const isSeller = persona.role === "seller";
  const all = [...needsAction, ...history];
  const byStatus = (items: ProposalView[]) =>
    status ? items.filter((p) => p.status === status) : items;

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

      {all.length === 0 ? (
        <EmptyState
          title="Todavía no hay propuestas"
          description={
            isSeller
              ? "Cuando un comprador proponga sobre una de tus ofertas, va a aparecer acá."
              : "Explorá las ofertas y enviá tu primera propuesta."
          }
          action={
            isSeller ? undefined : (
              <LinkButton href="/offers" size="sm">
                Explorar ofertas
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="space-y-8">
          <nav
            aria-label="Filtrar por estado"
            className="flex flex-wrap gap-1.5"
          >
            <StatusFilter href="/proposals" active={!status}>
              Todas ({all.length})
            </StatusFilter>
            {Object.values(ProposalStatus).map((s) => {
              const count = all.filter((p) => p.status === s).length;
              if (count === 0) return null;
              return (
                <StatusFilter
                  key={s}
                  href={`/proposals?status=${s}`}
                  active={status === s}
                >
                  {PROPOSAL_STATUS_LABEL[s]} ({count})
                </StatusFilter>
              );
            })}
          </nav>
          <ProposalSection
            title="Requieren tu acción"
            empty="Nada pendiente de tu lado."
            items={byStatus(needsAction)}
          />
          <ProposalSection
            title="Historial"
            empty="Sin propuestas en el historial."
            items={byStatus(history)}
          />
        </div>
      )}
    </>
  );
}

function StatusFilter({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
      }`}
    >
      {children}
    </Link>
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
      <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-gray-500">
        {title} · {items.length}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((p) => (
            <li key={p.id}>
              <ProposalCard p={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProposalCard({ p }: { p: ProposalView }) {
  return (
    <Link
      href={`/proposals/${p.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-800">
          {CATEGORY_LABEL[p.offer.category]}
        </span>
        <ProposalStatusBadge status={p.status} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-sans text-sm font-bold text-gray-900 group-hover:text-brand-600">
          {p.offer.title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
          {p.viewerRole === "seller" ? "De" : "A"} {p.counterparty.name} ·{" "}
          {p.counterparty.locality}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 rounded-lg border border-gray-100 bg-slate-50 px-3 py-2">
        <div>
          <p className="font-mono-num text-xs font-semibold text-gray-800">
            {formatTons(p.terms.quantityTons)} ×{" "}
            {formatArsPerTon(p.terms.pricePerTon)}
          </p>
          <p className="text-[11px] text-gray-400">
            {formatDateTime(p.updatedAt)}
          </p>
        </div>
        <span className="flex items-center gap-1 font-mono-num text-sm font-extrabold text-brand-600">
          {formatArs(p.total)}
          <ArrowRight
            className="h-3.5 w-3.5 text-gray-400 transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
