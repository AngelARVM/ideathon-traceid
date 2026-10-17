import { FileCheck2, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
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

export default function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Suspense fallback={<div className="h-96" />}>
        <AgreementContent params={params} />
      </Suspense>
    </div>
  );
}

async function AgreementContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = await requirePersona();
  // Todo sale del snapshot del acuerdo, nunca de la oferta viva (D9).
  const a = await getAgreementForParty(id, persona);

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-campo-50 px-5 py-4 dark:border-stone-800 dark:bg-campo-950/40">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-campo-600 text-white">
              <FileCheck2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-bold leading-tight">
                Acuerdo comercial declarado
              </h1>
              <p className="font-mono-num text-sm text-stone-600 dark:text-stone-400">
                N° {shortId(a.id)}
              </p>
            </div>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Confirmado el {formatDateTime(a.confirmedAt)}
          </p>
        </header>

        <div className="grid gap-4 border-b border-stone-100 px-5 py-4 sm:grid-cols-2 dark:border-stone-800">
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
          <div className="mt-2 flex items-baseline justify-between gap-4 rounded-xl bg-stone-50 px-3 py-3 dark:bg-stone-800/60">
            <span className="font-semibold">Total</span>
            <span className="font-mono-num text-2xl font-bold text-campo-700 dark:text-campo-300">
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
              <span className="block text-xs text-stone-500 dark:text-stone-400">
                Declarado por el vendedor, no verificado por SubMarket.
              </span>
            </Row>
          )}
        </Section>

        {a.closingComment && (
          <Section title="Comentario de cierre">
            <p className="whitespace-pre-line text-sm text-stone-700 dark:text-stone-300">
              “{a.closingComment}”
            </p>
          </Section>
        )}

        <footer className="flex items-start gap-2 bg-stone-50 px-5 py-4 text-sm text-stone-600 dark:bg-stone-800/40 dark:text-stone-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            SubMarket registra un acuerdo declarado entre las partes. El pago,
            el flete y la entrega ocurren fuera de la plataforma y no son
            verificados por SubMarket.
          </p>
        </footer>
      </article>

      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link
          href="/agreements"
          className="font-semibold text-campo-700 hover:underline dark:text-campo-300"
        >
          ← Mis acuerdos
        </Link>
        <Link
          href={`/proposals/${a.proposalId}`}
          className="font-semibold text-campo-700 hover:underline dark:text-campo-300"
        >
          Ver la negociación
        </Link>
      </p>
    </>
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
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="font-semibold">{name}</p>
      <p className="text-sm text-stone-600 dark:text-stone-400">{locality}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-stone-100 px-5 py-4 dark:border-stone-800">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {title}
      </h2>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-stone-600 dark:text-stone-400">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
