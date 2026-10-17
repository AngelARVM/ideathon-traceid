import { CalendarClock, SlidersHorizontal, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OfferCard } from "@/components/OfferCard";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { formatArsPerTon, formatTons } from "@/lib/format";
import {
  CATEGORY_LABEL,
  PRESENTATION_LABEL,
  PROVINCE_LABEL,
} from "@/lib/labels";
import {
  type CatalogFilters as Filters,
  listCatalog,
  parseCatalogFilters,
} from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { CatalogFilters } from "./_components/CatalogFilters";
import { CatalogSearch } from "./_components/CatalogSearch";
import { catalogHref } from "./_components/catalog-url";
import { FiltersDrawer } from "./_components/FiltersDrawer";

export const metadata: Metadata = { title: "Explorar subproductos" };

export default function OffersPage({ searchParams }: PageProps<"/offers">) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Catálogo de subproductos agroindustriales
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Lotes publicados en Corrientes, Misiones y Chaco, ordenados por
          cercanía a tu planta.
        </p>
      </div>
      {/* Persona y filtros se leen por request: el catálogo queda fuera del shell estático. */}
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const MODES = [
  {
    key: "available",
    label: "Lotes inmediatos",
    hint: "Lotes con stock, listos para retirar o coordinar entrega.",
    icon: <Zap className="h-4 w-4 text-brand-600" aria-hidden />,
  },
  {
    key: "estimated",
    label: "Estimativos",
    hint: "Volúmenes que el vendedor espera tener disponibles más adelante.",
    icon: <CalendarClock className="h-4 w-4 text-amber-600" aria-hidden />,
  },
  {
    key: undefined,
    label: "Todos",
    hint: "Lotes inmediatos y estimativos juntos.",
    icon: null,
  },
] as const;

async function Catalog({
  searchParams,
}: {
  searchParams: PageProps<"/offers">["searchParams"];
}) {
  const persona = await requirePersona();
  const filters = parseCatalogFilters(await searchParams);
  // Una sola consulta sin el modo: alcanza para la grilla y para los contadores del selector.
  const all = await listCatalog(
    { ...filters, availability: undefined },
    persona,
  );
  const items = filters.availability
    ? all.filter((i) => i.offer.status === filters.availability)
    : all;
  const counts = {
    available: all.filter((i) => i.offer.status === "available").length,
    estimated: all.filter((i) => i.offer.status === "estimated").length,
  };
  const mode = MODES.find((m) => m.key === filters.availability) ?? MODES[2];
  const active = activeFilterTags(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Modo del catálogo"
          className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 sm:flex"
        >
          {MODES.map((m) => {
            const selected = m.key === filters.availability;
            const count = m.key === undefined ? all.length : counts[m.key];
            return (
              <Link
                key={m.label}
                href={catalogHref(filters, { availability: m.key })}
                aria-current={selected ? "page" : undefined}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:text-sm ${
                  selected
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="hidden sm:inline">{m.icon}</span>
                {m.label}
                <span className="font-mono-num text-xs text-gray-400">
                  ({count})
                </span>
              </Link>
            );
          })}
        </nav>
        <span className="text-xs text-gray-500">{mode.hint}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-gray-800">
                <SlidersHorizontal
                  className="h-4 w-4 text-brand-600"
                  aria-hidden
                />
                Filtros
              </h2>
              {active.length > 0 && (
                <Link
                  href={catalogHref({
                    availability: filters.availability,
                    sort: filters.sort,
                  })}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Limpiar
                </Link>
              )}
            </div>
            <div className="p-4">
              <CatalogFilters filters={filters} idPrefix="side" />
            </div>
          </Card>
        </aside>

        <div className="min-w-0 space-y-4">
          <CatalogSearch filters={filters} />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">
                {items.length} {items.length === 1 ? "lote" : "lotes"}
              </span>{" "}
              · desde {persona.locality.name}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {active.map((t) => (
                <Tag
                  key={t.key}
                  tone="brand"
                  removeHref={catalogHref(filters, { [t.key]: undefined })}
                >
                  {t.label}
                </Tag>
              ))}
              {active.length > 0 && (
                <Link
                  href={catalogHref({
                    availability: filters.availability,
                    sort: filters.sort,
                  })}
                  className="text-gray-400 hover:text-gray-700"
                >
                  Restablecer
                </Link>
              )}
              <FiltersDrawer activeCount={active.length}>
                <CatalogFilters filters={filters} idPrefix="drawer" />
              </FiltersDrawer>
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="No hay lotes con esos filtros"
              description="Probá ampliar el radio, cambiar de modo o quitar algún filtro."
              action={
                <LinkButton href="/offers" size="sm">
                  Ver todos los lotes
                </LinkButton>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map(({ offer, distanceKm }) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  distanceKm={distanceKm}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tags de los filtros activos (sin el modo ni el orden, que tienen su propio selector). */
function activeFilterTags(f: Filters) {
  const tags: { key: keyof Filters; label: string }[] = [];
  if (f.q) tags.push({ key: "q", label: `“${f.q}”` });
  if (f.category)
    tags.push({ key: "category", label: CATEGORY_LABEL[f.category] });
  if (f.radius) tags.push({ key: "radius", label: `≤ ${f.radius} km` });
  if (f.province)
    tags.push({ key: "province", label: PROVINCE_LABEL[f.province] });
  if (f.maxPrice) {
    tags.push({ key: "maxPrice", label: `≤ ${formatArsPerTon(f.maxPrice)}` });
  }
  if (f.minStock) {
    tags.push({ key: "minStock", label: `≥ ${formatTons(f.minStock)}` });
  }
  if (f.weighbridge) tags.push({ key: "weighbridge", label: "Con báscula" });
  if (f.presentation) {
    tags.push({
      key: "presentation",
      label: PRESENTATION_LABEL[f.presentation],
    });
  }
  if (f.maxHumidity !== undefined) {
    tags.push({
      key: "maxHumidity",
      label: `Humedad ≤ ${f.maxHumidity.toLocaleString("es-AR")} %`,
    });
  }
  if (f.minKcal !== undefined) {
    tags.push({
      key: "minKcal",
      label: `≥ ${f.minKcal.toLocaleString("es-AR")} kcal/kg`,
    });
  }
  return tags;
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="h-14 animate-pulse rounded-xl bg-gray-200/60" />
      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <div className="hidden h-96 animate-pulse rounded-xl bg-gray-200/60 lg:block" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <div
              key={k}
              className="h-96 animate-pulse rounded-xl bg-gray-200/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
