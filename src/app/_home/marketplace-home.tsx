import {
  ArrowRight,
  Flame,
  Leaf,
  MapPin,
  Plus,
  Search,
  Sprout,
  Trees,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import type { HomeData } from "@/app/_home/queries";
import { OfferCard } from "@/components/OfferCard";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Field";
import type { Category } from "@/generated/prisma/enums";
import {
  formatArsPerTon,
  formatDate,
  formatKm,
  formatTons,
} from "@/lib/format";
import { RADIUS_OPTIONS } from "@/lib/geo";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";
import type { PersonaWithLocality } from "@/lib/persona";

const categoryIcons = {
  cascarilla_arroz: Wheat,
  chips_forestales: Trees,
  aserrin_virutas: Leaf,
  biomasa_pellets: Flame,
  orujos_bagazos: Sprout,
} satisfies Record<Category, typeof Wheat>;

const linkStyle =
  "inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-campo-700 underline-offset-4 hover:underline dark:text-campo-300";

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

  return (
    <>
      <section
        aria-labelledby="welcome-heading"
        className="grid gap-8 rounded-2xl bg-campo-100 p-6 sm:p-9 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 dark:bg-campo-950"
      >
        <div className="min-w-0">
          <h1
            id="welcome-heading"
            className="text-balance text-3xl font-bold leading-tight tracking-tight text-campo-950 sm:text-4xl dark:text-campo-100"
          >
            Hola, {persona.name}
          </h1>
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-campo-800 dark:text-campo-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {buyer ? "Comprador" : "Vendedor"} · {persona.locality.name},{" "}
              {PROVINCE_LABEL[persona.locality.province]}
            </span>
          </p>
          <p className="mt-5 max-w-md text-pretty leading-relaxed text-campo-900 dark:text-campo-200">
            Lo que sobra, vale. Conectá con los materiales y las empresas del
            NEA.
          </p>
          <LinkButton href={publishPath} className="mt-6">
            <Plus className="h-4 w-4" aria-hidden />
            {publishLabel}
          </LinkButton>
        </div>
        <form
          method="get"
          action="/offers"
          className="rounded-2xl bg-white p-5 sm:p-6 dark:bg-stone-900"
        >
          <h2 className="text-xl font-bold tracking-tight">
            ¿Qué material estás buscando?
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="home-category">
              <Select id="home-category" name="categoria" defaultValue="">
                <option value="">Todas las categorías</option>
                {data.categories.map(({ category }) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABEL[category]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Radio desde tu localidad" htmlFor="home-radius">
              <Select id="home-radius" name="radio" defaultValue="200">
                {RADIUS_OPTIONS.map((radius) => (
                  <option key={radius ?? "all"} value={radius ?? ""}>
                    {radius === null
                      ? "Todas las distancias"
                      : `Hasta ${radius} km`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
            Distancias aprox., en línea recta.
          </p>
          <Button type="submit" className="mt-5 w-full">
            <Search className="h-4 w-4" aria-hidden />
            Buscar ofertas
          </Button>
        </form>
      </section>

      <section aria-labelledby="categories-heading" className="mt-12">
        <h2
          id="categories-heading"
          className="text-2xl font-bold tracking-tight"
        >
          Un nuevo destino para cada material
        </h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          Explorá las ofertas disponibles y estimadas por categoría.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.categories.map(({ category, count }) => {
            const Icon = categoryIcons[category];
            return (
              <li key={category}>
                <Link
                  href={`/offers?categoria=${category}`}
                  className="group flex h-full min-h-40 flex-col rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-campo-500 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-campo-500"
                >
                  <div className="flex items-center justify-between text-campo-700 dark:text-campo-300">
                    <Icon className="h-6 w-6" aria-hidden />
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-sm font-bold leading-snug group-hover:text-campo-700 dark:group-hover:text-campo-300">
                    {CATEGORY_LABEL[category]}
                  </h3>
                  <p className="mt-auto pt-2 text-xs text-stone-600 dark:text-stone-400">
                    <span className="font-mono-num font-semibold">{count}</span>{" "}
                    {count === 1 ? "oferta activa" : "ofertas activas"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="nearby-heading" className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
          <h2 id="nearby-heading" className="text-2xl font-bold tracking-tight">
            Lotes cerca tuyo
          </h2>
          <Link href="/offers" className={linkStyle}>
            Ver todos
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          Desde {persona.locality.name}. Distancias aprox., en línea recta.
        </p>
        <div className="mt-6">
          {data.nearbyOffers.length === 0 ? (
            <EmptyState
              title="Todavía no hay ofertas activas"
              description="Las ofertas disponibles y estimadas aparecerán acá."
              action={
                <LinkButton href={publishPath}>{publishLabel}</LinkButton>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {data.nearbyOffers.map(({ offer, distance }) => (
                <OfferCard key={offer.id} offer={offer} distanceKm={distance} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="demands-heading" className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
          <h2
            id="demands-heading"
            className="text-2xl font-bold tracking-tight"
          >
            {buyer ? "Tus demandas" : "Demandas cerca tuyo"}
          </h2>
          <Link href={buyer ? "/my-demands" : "/demands"} className={linkStyle}>
            Ver todas
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          {buyer
            ? "Tus búsquedas abiertas y las ofertas compatibles."
            : "Conocé qué materiales necesitan otras empresas. Distancias aprox., en línea recta."}
        </p>
        <div className="mt-6">
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
            <ul className="divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
              {data.demands.map((demand) => (
                <li key={demand.id}>
                  <Link
                    href={`/demands/${demand.id}`}
                    className="group flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-campo-700 dark:text-campo-300">
                        {CATEGORY_LABEL[demand.category]}
                      </p>
                      <h3 className="mt-1 font-bold group-hover:text-campo-700 dark:group-hover:text-campo-300">
                        {demand.title}
                      </h3>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                        {demand.buyerName} · {demand.locality.name},{" "}
                        {PROVINCE_LABEL[demand.locality.province]}
                      </p>
                      <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
                        {demand.neededBy
                          ? `Necesito para el ${formatDate(demand.neededBy)}`
                          : "Fecha a convenir"}
                        {demand.maxPricePerTon
                          ? ` · Máx. ${formatArsPerTon(demand.maxPricePerTon)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-5 sm:text-right">
                      <div>
                        <p className="font-mono-num font-bold">
                          {formatTons(demand.quantityTons)}
                        </p>
                        <p className="mt-1 text-sm text-campo-700 dark:text-campo-300">
                          {demand.compatibleCount === null
                            ? formatKm(demand.distance)
                            : `${demand.compatibleCount} ${demand.compatibleCount === 1 ? "oferta compatible" : "ofertas compatibles"}`}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-4 w-4 text-campo-700 dark:text-campo-300"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
