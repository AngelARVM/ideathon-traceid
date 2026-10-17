import {
  ArrowLeft,
  CalendarClock,
  FlaskConical,
  MapPin,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { OfferStatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/ui/Button";
import {
  formatArsPerTon,
  formatDate,
  formatKm,
  formatTons,
} from "@/lib/format";
import {
  CATEGORY_LABEL,
  FREIGHT_LABEL,
  PRESENTATION_LABEL,
  PROVINCE_LABEL,
} from "@/lib/labels";
import { markOfferAvailable, withdrawOffer } from "@/lib/offers/actions";
import { getOfferDetail } from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { OfferActionButton } from "../_components/OfferActionButton";

export default function OfferDetailPage({
  params,
}: PageProps<"/ofertas/[id]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/ofertas"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-campo-700 dark:text-stone-400 dark:hover:text-campo-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al catálogo
      </Link>
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-2xl bg-stone-200/60 dark:bg-stone-800/60" />
        }
      >
        <OfferDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OfferDetail({
  params,
}: {
  params: PageProps<"/ofertas/[id]">["params"];
}) {
  const persona = await requirePersona();
  const { id } = await params;
  const { offer, isOwner, distanceKm } = await getOfferDetail(id, persona);

  const withdrawn = offer.status === "withdrawn";
  const estimated = offer.status === "estimated";
  const hasStock = offer.quantityTons.gt(0);
  // §12.3: M3 repite estas validaciones en el servidor.
  const canPropose = persona.role === "buyer" && !withdrawn && hasStock;

  const features = [
    offer.humidityPct !== null && {
      label: "Humedad",
      value: `${Number(offer.humidityPct).toLocaleString("es-AR")} %`,
    },
    offer.calorificKcalKg !== null && {
      label: "Poder calorífico",
      value: `${offer.calorificKcalKg.toLocaleString("es-AR")} kcal/kg`,
    },
    offer.presentation && {
      label: "Presentación",
      value: PRESENTATION_LABEL[offer.presentation],
    },
  ].filter((f) => f !== false && f !== null);

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-campo-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-campo-800 dark:bg-campo-950/60 dark:text-campo-200">
            {CATEGORY_LABEL[offer.category]}
          </span>
          <OfferStatusBadge
            status={offer.status}
            quantityTons={offer.quantityTons}
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl dark:text-stone-50">
          {offer.title}
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {offer.seller.name}
            </span>
            {offer.seller.tagline && ` · ${offer.seller.tagline}`} ·{" "}
            {offer.locality.name}, {PROVINCE_LABEL[offer.locality.province]}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
          <Navigation className="h-4 w-4 shrink-0" aria-hidden />
          {formatKm(distanceKm)} desde {persona.locality.name} (aprox., en línea
          recta)
        </p>
      </header>

      {estimated && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            <span className="font-bold">
              Oferta estimada · disponible aprox.{" "}
              {offer.estimatedDate ? formatDate(offer.estimatedDate) : "—"}.
            </span>{" "}
            Podés enviar una propuesta, pero el acuerdo solo se confirma cuando
            el vendedor la marque como disponible.
          </p>
        </div>
      )}

      {withdrawn && (
        <div className="rounded-2xl border border-stone-200 bg-stone-100 p-4 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
          Retiraste esta oferta: ya no aparece en el catálogo ni admite
          propuestas.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Block title="Stock y precio">
          <Row label="Stock disponible">
            <span className="font-mono-num text-lg font-bold">
              {formatTons(offer.quantityTons)}
            </span>
          </Row>
          <Row label="Precio de referencia">
            <span className="font-mono-num font-semibold text-campo-700 dark:text-campo-300">
              {offer.pricePerTon
                ? formatArsPerTon(offer.pricePerTon)
                : "Precio a convenir"}
            </span>
          </Row>
        </Block>

        <Block title="Características">
          {features.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              El vendedor no cargó características.
            </p>
          ) : (
            features.map((f) => (
              <Row key={f.label} label={f.label}>
                {f.value}
              </Row>
            ))
          )}
        </Block>

        <Block title="Logística">
          <Row label="Flete">{FREIGHT_LABEL[offer.freight]}</Row>
          <Row label="Báscula en planta">
            {offer.hasWeighbridge ? "Sí" : "No"}
          </Row>
        </Block>
      </div>

      {offer.labAnalysis && (
        <section className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <FlaskConical
            className="mt-0.5 h-5 w-5 shrink-0 text-campo-700 dark:text-campo-300"
            aria-hidden
          />
          <div>
            <h2 className="text-sm font-bold">Análisis de laboratorio</h2>
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
              {offer.labAnalysis}
            </p>
            <p className="mt-1 text-xs italic text-stone-500 dark:text-stone-400">
              Declarado por el vendedor, no verificado por SubMarket.
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Descripción
        </h2>
        <p className="mt-2 whitespace-pre-line text-stone-800 dark:text-stone-200">
          {offer.description}
        </p>
      </section>

      {canPropose && (
        <div>
          <LinkButton href={`/ofertas/${offer.id}/proponer`}>
            Proponer compra
          </LinkButton>
        </div>
      )}

      {isOwner && !withdrawn && (
        <div className="flex flex-wrap items-start gap-2 border-t border-stone-200 pt-5 dark:border-stone-800">
          <LinkButton href={`/ofertas/${offer.id}/editar`} variant="secondary">
            Editar
          </LinkButton>
          {estimated && (
            <OfferActionButton
              action={markOfferAvailable}
              offerId={offer.id}
              label="Marcar disponible"
              pendingLabel="Marcando…"
              variant="primary"
            />
          )}
          <OfferActionButton
            action={withdrawOffer}
            offerId={offer.id}
            label="Retirar"
            pendingLabel="Retirando…"
            confirmMessage="¿Retirar esta oferta? Deja de aparecer en el catálogo y no se puede deshacer."
            variant="danger"
          />
        </div>
      )}
    </article>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-stone-600 dark:text-stone-400">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
