import { AlertTriangle, CalendarClock, FileCheck2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProposalStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  formatArs,
  formatArsPerTon,
  formatDate,
  formatTons,
} from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/negotiation/format";
import {
  getProposalForParty,
  type ProposalView,
} from "@/lib/negotiation/queries";
import { requirePersona } from "@/lib/persona";
import { BuyerActions, SellerActions } from "./ProposalActions";

export const metadata: Metadata = { title: "Propuesta" };

const STATUS_TEXT: Record<
  ProposalView["status"],
  { buyer: string; seller: string }
> = {
  pending: {
    buyer: "Esperando la respuesta del vendedor.",
    seller: "Respondé la propuesta: aceptala, rechazala o contraofertá.",
  },
  accepted: {
    buyer:
      "El vendedor aceptó tu propuesta. Confirmá el acuerdo para cerrarlo.",
    seller: "Aceptaste la propuesta. Falta que el comprador confirme.",
  },
  countered: {
    buyer: "El vendedor contraofertó. Aceptá la contraoferta o rechazala.",
    seller: "Contraofertaste. Falta que el comprador responda.",
  },
  rejected: {
    buyer: "La negociación terminó sin acuerdo.",
    seller: "La negociación terminó sin acuerdo.",
  },
  confirmed: {
    buyer: "Acuerdo confirmado.",
    seller: "Acuerdo confirmado.",
  },
};

// Bloqueante a propósito: así `notFound()` responde con un 404 real a quien no es parte (§9).
export const instant = false;

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();
  const p = await getProposalForParty(id, persona);
  const seller = p.viewerRole === "seller";
  const open =
    p.status === "pending" ||
    p.status === "accepted" ||
    p.status === "countered";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title={p.offer.title}
        description={
          <>
            {CATEGORY_LABEL[p.offer.category]} · {p.offer.locality} ·{" "}
            {seller ? "Comprador" : "Vendedor"}: {p.counterparty.name} (
            {p.counterparty.locality})
          </>
        }
        actions={<ProposalStatusBadge status={p.status} />}
      />

      <ol className="relative flex flex-col gap-4 border-l-2 border-stone-200 pl-6 dark:border-stone-800">
        <TimelineItem
          title="Propuesta del comprador"
          date={formatDateTime(p.createdAt)}
        >
          <TermsLine
            quantityTons={p.original.quantityTons}
            pricePerTon={p.original.pricePerTon}
          />
          {p.original.message && <Quote>{p.original.message}</Quote>}
        </TimelineItem>

        {p.counter && (
          <TimelineItem
            title="Contraoferta del vendedor"
            date={p.respondedAt ? formatDateTime(p.respondedAt) : undefined}
          >
            <TermsLine
              quantityTons={p.counter.quantityTons}
              pricePerTon={p.counter.pricePerTon}
            />
            {p.counter.message && <Quote>{p.counter.message}</Quote>}
          </TimelineItem>
        )}

        <TimelineItem title="Estado actual" current>
          <p className="text-sm text-stone-700 dark:text-stone-300">
            {STATUS_TEXT[p.status][p.viewerRole]}
          </p>
          {open && (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Términos vigentes:{" "}
              <span className="font-mono-num font-semibold text-stone-900 dark:text-stone-100">
                {formatTons(p.terms.quantityTons)} ×{" "}
                {formatArsPerTon(p.terms.pricePerTon)} = {formatArs(p.total)}
              </span>
            </p>
          )}
        </TimelineItem>
      </ol>

      {open && p.offer.status === "estimated" && (
        <Notice icon="estimated">
          Oferta estimada
          {p.offer.estimatedDate &&
            ` · disponible aprox. ${formatDate(p.offer.estimatedDate)}`}
          . Se puede aceptar, pero el acuerdo solo se confirma cuando el
          vendedor la marque como disponible.
        </Notice>
      )}
      {open && p.offer.status === "withdrawn" && (
        <Notice icon="warning">El vendedor retiró la oferta.</Notice>
      )}
      {open && p.exceedsStock && p.offer.status !== "withdrawn" && (
        <Notice icon="warning">
          La cantidad ({formatTons(p.terms.quantityTons)}) supera el stock
          actual de la oferta ({formatTons(p.offer.quantityTons)}). Se puede
          aceptar, pero no se podrá confirmar hasta que haya stock suficiente.
        </Notice>
      )}

      <div className="mt-6">
        {seller && p.actions.length > 0 && (
          <SellerActions
            proposalId={p.id}
            canAccept={p.actions.includes("accept")}
            canCounter={p.actions.includes("counter")}
            original={p.original}
            stockTons={p.offer.quantityTons}
          />
        )}
        {!seller && p.actions.length > 0 && (
          <BuyerActions
            proposalId={p.id}
            countered={p.status === "countered"}
            blockReason={p.confirmBlockReason}
          />
        )}
        {p.agreementId && (
          <LinkButton href={`/agreements/${p.agreementId}`}>
            <FileCheck2 className="h-4 w-4" aria-hidden />
            Ver comprobante
          </LinkButton>
        )}
        {!seller &&
          p.status === "rejected" &&
          p.offer.status !== "withdrawn" && (
            <LinkButton
              href={`/offers/${p.offer.id}/propose`}
              variant="secondary"
            >
              Hacer una nueva propuesta
            </LinkButton>
          )}
      </div>

      <p className="mt-8 text-sm">
        <Link
          href="/proposals"
          className="font-semibold text-campo-700 hover:underline dark:text-campo-300"
        >
          ← Volver a propuestas
        </Link>
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  current,
  children,
}: {
  title: string;
  date?: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-stone-950 ${current ? "bg-campo-600" : "bg-stone-400"}`}
        aria-hidden
      />
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">{title}</h2>
          {date && (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {date}
            </span>
          )}
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  );
}

function TermsLine({
  quantityTons,
  pricePerTon,
}: {
  quantityTons: string;
  pricePerTon: string;
}) {
  return (
    <p className="font-mono-num text-sm font-semibold">
      {formatTons(quantityTons)} × {formatArsPerTon(pricePerTon)}
    </p>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 whitespace-pre-line rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
      “{children}”
    </p>
  );
}

function Notice({
  icon,
  children,
}: {
  icon: "estimated" | "warning";
  children: ReactNode;
}) {
  const Icon = icon === "estimated" ? CalendarClock : AlertTriangle;
  return (
    <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
