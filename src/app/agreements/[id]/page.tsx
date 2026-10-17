import { FileCheck2, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatArs, formatArsPerTon, formatTons } from "@/lib/format";
import {
  CATEGORY_LABEL,
  FREIGHT_LABEL,
  PRESENTATION_LABEL,
} from "@/lib/labels";
import { formatDateTime, shortId } from "@/lib/negotiation/format";
import { getAgreementForParty } from "@/lib/negotiation/queries";
import { requirePersona } from "@/lib/persona";

export const metadata: Metadata = { title: "Comprobante de acuerdo" };

// Bloqueante a propósito: así `notFound()` llega antes del shell y responde con un 404 real
// a quien no es parte (§9, §13 paso 9), en vez de un 200 con la UI de "no encontrado".
export const instant = false;

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();
  // Todo sale del snapshot del acuerdo, nunca de la oferta viva (D9).
  const a = await getAgreementForParty(id, persona);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FileCheck2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-extrabold leading-tight text-gray-900">
                Acuerdo comercial declarado
              </h1>
              <p className="font-mono-num text-sm text-gray-500">
                N° {shortId(a.id)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Confirmado el {formatDateTime(a.confirmedAt)}
          </p>
        </header>

        <div className="grid gap-4 border-b border-gray-100 px-5 py-4 sm:grid-cols-2">
          <Party
            label="Vendedor"
            name={a.seller.name}
            locality={a.seller.locality}
          />
          <Party
            label="Comprador"
            name={a.buyer.name}
            locality={a.buyer.locality}
          />
        </div>

        <Section title="Material">
          <Row label="Oferta">{a.offerTitle}</Row>
          <Row label="Categoría">{CATEGORY_LABEL[a.category]}</Row>
          <Row label="Origen">{a.originLocality}</Row>
        </Section>

        <Section title="Términos acordados">
          <Row label="Cantidad">
            <span className="font-mono-num">{formatTons(a.quantityTons)}</span>
          </Row>
          <Row label="Precio">
            <span className="font-mono-num">
              {formatArsPerTon(a.pricePerTon)}
            </span>
          </Row>
          <div className="mt-2 flex items-baseline justify-between gap-4 rounded-lg border border-brand-300 bg-brand-50 px-4 py-3">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="font-mono-num text-2xl font-black text-brand-600">
              {formatArs(a.totalAmount)}
            </span>
          </div>
        </Section>

        <Section title="Características y logística">
          {a.humidityPct !== null && (
            <Row label="Humedad">
              {Number(a.humidityPct).toLocaleString("es-AR")} %
            </Row>
          )}
          {a.calorificKcalKg !== null && (
            <Row label="Poder calorífico">
              {a.calorificKcalKg.toLocaleString("es-AR")} kcal/kg
            </Row>
          )}
          {a.presentation && (
            <Row label="Presentación">{PRESENTATION_LABEL[a.presentation]}</Row>
          )}
          <Row label="Flete">{FREIGHT_LABEL[a.freight]}</Row>
          <Row label="Báscula en planta">{a.hasWeighbridge ? "Sí" : "No"}</Row>
          {a.labAnalysis && (
            <Row label="Análisis de laboratorio">
              {a.labAnalysis}
              <span className="block text-xs text-gray-500">
                Declarado por el vendedor, no verificado por SubMarket.
              </span>
            </Row>
          )}
        </Section>

        {a.closingComment && (
          <Section title="Comentario de cierre">
            <p className="whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-gray-700">
              “{a.closingComment}”
            </p>
          </Section>
        )}

        <footer className="flex items-start gap-2 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <strong>Acuerdo declarado:</strong> pago, flete y entrega se
            coordinan fuera de SubMarket.
          </p>
        </footer>
      </article>

      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link
          href="/agreements"
          className="font-semibold text-brand-600 hover:underline"
        >
          ← Mis acuerdos
        </Link>
        <Link
          href={`/proposals/${a.proposalId}`}
          className="font-semibold text-brand-600 hover:underline"
        >
          Ver la negociación
        </Link>
      </p>
    </div>
  );
}

function Party({
  label,
  name,
  locality,
}: {
  label: string;
  name: string;
  locality: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="font-bold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500">{locality}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-gray-100 px-5 py-4">
      <h2 className="mb-2 font-sans text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {title}
      </h2>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-semibold text-gray-900">{children}</dd>
    </div>
  );
}
