import { ArrowRight, ArrowUpRight, MapPin, Plus } from "lucide-react";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/app/_home/hero";
import type { HomeData } from "@/app/_home/queries";
import { OfferCard } from "@/components/OfferCard";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Category } from "@/generated/prisma/enums";
import { CATEGORY_IMAGE } from "@/lib/category-media";
import {
  formatArsPerTon,
  formatDate,
  formatKm,
  formatTons,
} from "@/lib/format";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";
import type { PersonaWithLocality } from "@/lib/persona";

// Usos habituales en lenguaje condicional: nada de aptitudes aprobadas (§11).
const CATEGORY_TEXT: Record<Category, string> = {
  cascarilla_arroz:
    "De molinos y secaderos arroceros. Suele usarse como cama avícola o combustible de biomasa.",
  chips_forestales:
    "Astillas de pino y eucalipto que suelen alimentar calderas y secaderos.",
  aserrin_virutas:
    "Residuo fino de aserraderos, habitual en pellets y camas de animales.",
  biomasa_pellets:
    "Biomasa densificada y otros combustibles sólidos de origen vegetal.",
  orujos_bagazos:
    "Pulpas y bagazos de jugueras e ingenios, a veces usados en suplementación o abonos.",
};

export function MarketplaceHome({
  persona,
  data,
}: {
  persona: PersonaWithLocality;
  data: HomeData;
}) {
  const buyer = persona.role === "buyer";
  const publishPath = buyer ? "/demands/new" : "/offers/new";
  const publishLabel = buyer ? "Publicar demanda" : "Publicar oferta";
  const nearest = data.nearbyOffers[0];

  return (
    <>
      <Hero
        title="Transformamos subproductos en oportunidades"
        subtitle={
          <>
            Hola, <strong className="text-gray-800">{persona.name}</strong>. Lo
            que una industria ya no necesita, otra lo puede transformar. Conectá
            con materiales y empresas cerca de {persona.locality.name}.
          </>
        }
        highlight={
          nearest
            ? {
                eyebrow: "El lote más cercano",
                title: nearest.offer.title,
                subtitle: `${nearest.offer.locality.name}, ${PROVINCE_LABEL[nearest.offer.locality.province]} · ${formatKm(nearest.distance)}`,
                href: `/offers/${nearest.offer.id}`,
              }
            : {
                eyebrow: "De residuo a recurso",
                title: "5 categorías de subproductos",
                subtitle: "Corrientes · Misiones · Chaco",
              }
        }
      >
        <Form
          action="/offers"
          className="flex max-w-xl flex-col gap-2 rounded-2xl border border-gray-200/80 bg-white p-2 shadow-xs sm:flex-row"
        >
          <label htmlFor="home-category" className="sr-only">
            Categoría
          </label>
          <select
            id="home-category"
            name="category"
            defaultValue=""
            className="h-12 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          >
            <option value="">Todos los materiales</option>
            {data.categories.map(({ category }) => (
              <option key={category} value={category}>
                {CATEGORY_LABEL[category]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="flex h-12 items-center justify-center gap-2.5 rounded-xl bg-brand-600 px-7 text-sm font-bold text-white shadow-xs transition hover:bg-brand-700"
          >
            Explorar materiales
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </button>
        </Form>
        <Link
          href={publishPath}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {publishLabel}
        </Link>
      </Hero>

      <section
        aria-labelledby="categories-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <SectionHeader
          id="categories-heading"
          title="Un nuevo destino para cada material"
          description="Ofertas disponibles y estimadas por categoría, en Corrientes, Misiones y Chaco."
          link={{ href: "/offers", label: "Ver todo el catálogo" }}
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map(({ category, count }) => {
            const image = CATEGORY_IMAGE[category];
            return (
              <li key={category}>
                <Link
                  href={`/offers?category=${category}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-2xs transition duration-300 hover:border-brand-300 hover:shadow-card-hover"
                >
                  <div className="relative h-36 overflow-hidden bg-gray-100">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-brand-600 shadow-xs">
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-gray-800 shadow-xs">
                        <span className="font-mono-num">{count}</span>{" "}
                        {count === 1 ? "oferta activa" : "ofertas activas"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="space-y-1.5">
                      <h3 className="font-sans text-base font-extrabold text-gray-900 group-hover:text-brand-600">
                        {CATEGORY_LABEL[category]}
                      </h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
                        {CATEGORY_TEXT[category]}
                      </p>
                    </div>
                    <span className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-brand-600">
                      Explorar lotes
                      <ArrowRight
                        className="h-3.5 w-3.5 transition group-hover:translate-x-1"
                        aria-hidden
                      />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="nearby-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <SectionHeader
          id="nearby-heading"
          eyebrow={`Desde ${persona.locality.name}`}
          title="Lotes cerca tuyo"
          description="Distancias aprox., en línea recta."
          link={{ href: "/offers", label: "Explorar todos" }}
        />
        {data.nearbyOffers.length === 0 ? (
          <EmptyState
            title="Todavía no hay ofertas activas"
            description="Las ofertas disponibles y estimadas aparecerán acá."
            action={<LinkButton href={publishPath}>{publishLabel}</LinkButton>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {data.nearbyOffers.map(({ offer, distance }) => (
              <OfferCard key={offer.id} offer={offer} distanceKm={distance} />
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="demands-heading"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <SectionHeader
          id="demands-heading"
          title={buyer ? "Tus demandas" : "Demandas cerca tuyo"}
          description={
            buyer
              ? "Tus búsquedas abiertas y las ofertas compatibles."
              : "Qué materiales necesitan otras empresas. Distancias aprox., en línea recta."
          }
          link={{
            href: buyer ? "/my-demands" : "/demands",
            label: "Ver todas",
          }}
        />
        {data.demands.length === 0 ? (
          <EmptyState
            title={
              buyer
                ? "¿Qué necesita tu empresa?"
                : "Todavía no hay demandas abiertas"
            }
            description={
              buyer
                ? "Publicá una demanda para encontrar ofertas de tu categoría y radio."
                : "Volvé a consultar cuando haya nuevas búsquedas de compradores."
            }
            action={
              buyer ? (
                <LinkButton href="/demands/new">Publicar demanda</LinkButton>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.demands.map((demand) => (
              <li key={demand.id}>
                <Link
                  href={`/demands/${demand.id}`}
                  className="group flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-card-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={CATEGORY_IMAGE[demand.category].src}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-cyan-800">
                        {CATEGORY_LABEL[demand.category]}
                      </p>
                      <h3 className="truncate font-sans text-sm font-bold text-gray-900 group-hover:text-brand-600">
                        {demand.title}
                      </h3>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                    <MapPin
                      className="h-3.5 w-3.5 shrink-0 text-brand-600"
                      aria-hidden
                    />
                    {demand.buyerName} · {demand.locality.name}
                  </p>
                  <div className="mt-auto flex items-end justify-between gap-2 rounded-lg border border-gray-100 bg-slate-50 px-3 py-2 text-xs">
                    <div>
                      <p className="font-mono-num font-bold text-gray-900">
                        {formatTons(demand.quantityTons)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {demand.neededBy
                          ? `Para el ${formatDate(demand.neededBy)}`
                          : "Sin fecha"}
                        {demand.maxPricePerTon
                          ? ` · Máx. ${formatArsPerTon(demand.maxPricePerTon)}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-brand-600">
                      {demand.compatibleCount === null
                        ? formatKm(demand.distance)
                        : `${demand.compatibleCount} ${demand.compatibleCount === 1 ? "compatible" : "compatibles"}`}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  link,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  link: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            {eyebrow}
          </span>
        )}
        <h2
          id={id}
          className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-1 text-xs text-gray-500 sm:text-sm">{description}</p>
      </div>
      <Link
        href={link.href}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-200"
      >
        {link.label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
