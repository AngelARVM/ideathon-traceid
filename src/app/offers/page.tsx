import type { Metadata } from "next";
import { Suspense } from "react";
import { OfferCard } from "@/components/OfferCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { listCatalog, parseCatalogFilters } from "@/lib/offers/queries";
import { requirePersona } from "@/lib/persona";
import { CatalogFilters } from "./_components/CatalogFilters";

export const metadata: Metadata = { title: "Explorar subproductos" };

export default function OffersPage({ searchParams }: PageProps<"/offers">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Explorar subproductos"
        description="Lotes publicados en Corrientes, Misiones y Chaco, ordenados por cercanía."
      />
      {/* Persona y filtros se leen por request: el catálogo queda fuera del shell estático. */}
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({
  searchParams,
}: {
  searchParams: PageProps<"/offers">["searchParams"];
}) {
  const persona = await requirePersona();
  const filters = parseCatalogFilters(await searchParams);
  const items = await listCatalog(filters, persona);

  return (
    <div className="flex flex-col gap-5">
      <CatalogFilters filters={filters} />
      <p className="text-sm text-stone-600 dark:text-stone-400">
        <span className="font-semibold text-stone-900 dark:text-stone-100">
          {items.length} {items.length === 1 ? "lote" : "lotes"}
        </span>{" "}
        · desde {persona.locality.name}
      </p>
      {items.length === 0 ? (
        <EmptyState
          title="No hay lotes con esos filtros"
          description="Probá ampliar el radio o quitar algún filtro."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ offer, distanceKm }) => (
            <OfferCard key={offer.id} offer={offer} distanceKm={distanceKm} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="h-36 animate-pulse rounded-2xl bg-stone-200/60 lg:h-28 dark:bg-stone-800/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["a", "b", "c"].map((k) => (
          <div
            key={k}
            className="h-64 animate-pulse rounded-2xl bg-stone-200/60 dark:bg-stone-800/60"
          />
        ))}
      </div>
    </div>
  );
}
