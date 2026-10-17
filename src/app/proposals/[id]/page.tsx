import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  FileCheck2,
  Repeat2,
  Send,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProposalStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Descriptions } from "@/components/ui/Descriptions";
import {
  formatArs,
  formatArsPerTon,
  formatDate,
  formatTons,
} from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/negotiation/format";
import {
  getAgreementForParty,
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
  const agreement = p.agreementId
    ? await getAgreementForParty(p.agreementId, persona)
    : null;
  const seller = p.viewerRole === "seller";
  const open =
    p.status === "pending" ||
    p.status === "accepted" ||
    p.status === "countered";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/proposals"
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Volver a propuestas
      </Link>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            {CATEGORY_LABEL[p.offer.category]} · {p.offer.locality}
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
            <Link
              href={`/offers/${p.offer.id}`}
              className="hover:text-brand-600"
            >
              {p.offer.title}
            </Link>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {seller ? "Comprador" : "Vendedor"}:{" "}
            <span className="font-semibold text-gray-900">
              {p.counterparty.name}
            </span>{" "}
            ({p.counterparty.locality})
          </p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <ProposalStatusBadge status={p.status} />
          <p className="max-w-xs text-sm text-gray-600 sm:text-right">
            {STATUS_TEXT[p.status][p.viewerRole]}
          </p>
        </div>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <h2 className="border-b border-gray-100 px-5 py-3.5 font-bold text-gray-900">
              Parámetros del trato
            </h2>
            <div className="space-y-4 p-5">
              <Descriptions
                items={[
                  {
                    label: "Propuesta del comprador",
                    value: (
                      <Terms
                        q={p.original.quantityTons}
                        price={p.original.pricePerTon}
                      />
                    ),
                  },
                  p.counter && {
                    label: "Contraoferta del vendedor",
                    value: (
                      <Terms
                        q={p.counter.quantityTons}
                        price={p.counter.pricePerTon}
                      />
                    ),
                  },
                  {
                    label: open ? "Términos vigentes" : "Términos finales",
                    value: (
                      <Terms
                        q={p.terms.quantityTons}
                        price={p.terms.pricePerTon}
                      />
                    ),
                  },
                  {
                    label: "Stock actual de la oferta",
                    value: formatTons(p.offer.quantityTons),
                  },
                ]}
              />
              <div className="flex items-center justify-between rounded-lg border border-brand-300 bg-brand-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">
                  Total
                </span>
                <span className="font-mono-num text-xl font-black text-brand-600">
                  {formatArs(p.total)}
                </span>
              </div>
            </div>
          </Card>

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
              aceptar, pero no se podrá confirmar hasta que haya stock
              suficiente.
            </Notice>
          )}

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
          {(p.agreementId ||
            (!seller &&
              p.status === "rejected" &&
              p.offer.status !== "withdrawn")) && (
            <div className="flex flex-wrap gap-2">
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
          )}
        </div>

        <Card className="p-5 lg:col-span-5">
          <h2 className="mb-4 font-bold text-gray-900">Historial</h2>
          <Timeline p={p} closing={agreement} />
        </Card>
      </div>
    </div>
  );
}

type Step = {
  key: string;
  title: string;
  date?: string;
  icon: ReactNode;
  tone: "brand" | "blue" | "red" | "gray";
  body?: ReactNode;
};

/** Línea de tiempo derivada de la propuesta (no hay chat, §3): cada paso sale de sus campos. */
function Timeline({
  p,
  closing,
}: {
  p: ProposalView;
  closing: { confirmedAt: Date; closingComment: string | null } | null;
}) {
  const steps: Step[] = [
    {
      key: "sent",
      title: "Propuesta enviada",
      date: formatDateTime(p.createdAt),
      icon: <Send className="h-3.5 w-3.5" aria-hidden />,
      tone: "gray",
      body: (
        <>
          <Terms q={p.original.quantityTons} price={p.original.pricePerTon} />
          {p.original.message && <Quote>{p.original.message}</Quote>}
        </>
      ),
    },
  ];
  const respondedAt = p.respondedAt ? formatDateTime(p.respondedAt) : undefined;
  if (p.counter) {
    steps.push({
      key: "counter",
      title: "Contraoferta del vendedor",
      date: respondedAt,
      icon: <Repeat2 className="h-3.5 w-3.5" aria-hidden />,
      tone: "blue",
      body: (
        <>
          <Terms q={p.counter.quantityTons} price={p.counter.pricePerTon} />
          {p.counter.message && <Quote>{p.counter.message}</Quote>}
        </>
      ),
    });
  } else if (p.status === "accepted" || p.status === "confirmed") {
    steps.push({
      key: "accepted",
      title: "Aceptada por el vendedor",
      date: respondedAt,
      icon: <Check className="h-3.5 w-3.5" aria-hidden />,
      tone: "blue",
    });
  }
  if (p.status === "rejected") {
    steps.push({
      key: "rejected",
      title: p.counter
        ? "Contraoferta rechazada por el comprador"
        : "Rechazada por el vendedor",
      date: formatDateTime(p.updatedAt),
      icon: <X className="h-3.5 w-3.5" aria-hidden />,
      tone: "red",
    });
  }
  if (p.status === "confirmed") {
    steps.push({
      key: "confirmed",
      title: "Acuerdo confirmado",
      date: closing ? formatDateTime(closing.confirmedAt) : undefined,
      icon: <FileCheck2 className="h-3.5 w-3.5" aria-hidden />,
      tone: "brand",
      body: closing?.closingComment ? (
        <Quote>{closing.closingComment}</Quote>
      ) : undefined,
    });
  }

  const tone = {
    brand: "bg-brand-600 text-white",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <ol className="space-y-5">
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex gap-3">
          {i < steps.length - 1 && (
            <span
              className="absolute left-3.5 top-8 -bottom-5 w-px bg-gray-200"
              aria-hidden
            />
          )}
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone[s.tone]}`}
          >
            {s.icon}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <h3 className="font-sans text-sm font-semibold text-gray-900">
                {s.title}
              </h3>
              {s.date && (
                <span className="text-[11px] text-gray-400">{s.date}</span>
              )}
            </div>
            {s.body && <div className="mt-1">{s.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Terms({ q, price }: { q: string; price: string }) {
  return (
    <span className="font-mono-num text-sm font-semibold text-gray-900">
      {formatTons(q)} × {formatArsPerTon(price)}
    </span>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-gray-700">
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
    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
