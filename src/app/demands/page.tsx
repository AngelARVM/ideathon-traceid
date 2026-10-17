import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { listDemands } from "@/lib/demands/queries";
import {
  parseDemandFilters,
  type SearchParams,
} from "@/lib/demands/validation";
import { RADIUS_OPTIONS } from "@/lib/geo";
import { CATEGORY_LABEL } from "@/lib/labels";
import { requirePersona } from "@/lib/persona";
import { DemandCard } from "./_components/DemandCard";
import { DemandLoading } from "./_components/DemandShell";

export const metadata: Metadata = { title: "Demandas de compradores" };
type Props = { searchParams: Promise<SearchParams> };

export default function DemandsPage(props: Props) {
  return (
    <Suspense fallback={<DemandLoading />}>
      <DemandsContent {...props} />
    </Suspense>
  );
}

async function DemandsContent({ searchParams }: Props) {
  const persona = await requirePersona();
  const filters = parseDemandFilters(await searchParams);
  const demands = await listDemands(filters, persona);
  return (
    <>
      <PageHeader
        title="Demandas de compradores"
        description="Encontrá empresas que buscan subproductos de tu región."
        actions={
          persona.role === "buyer" ? (
            <LinkButton href="/demands/new">Publicar demanda</LinkButton>
          ) : undefined
        }
      />
      <form
        action="/demands"
        method="get"
        className="mb-6 grid items-end gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] dark:border-stone-800 dark:bg-stone-900"
      >
        <Field label="Categoría" htmlFor="category">
          <Select
            id="category"
            name="category"
            defaultValue={filters.category ?? ""}
            key={filters.category ?? "all"}
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`Radio desde ${persona.locality.name}`} htmlFor="radius">
          <Select
            id="radius"
            name="radius"
            defaultValue={filters.radiusKm ?? ""}
            key={filters.radiusKm ?? "all"}
          >
            {RADIUS_OPTIONS.map((radius) => (
              <option key={radius ?? "all"} value={radius ?? ""}>
                {radius === null
                  ? "Todas las distancias"
                  : `Hasta ${radius} km`}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Aplicar</Button>
          <LinkButton href="/demands" variant="ghost">
            Limpiar
          </LinkButton>
        </div>
      </form>
      <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
        {demands.length} {demands.length === 1 ? "demanda" : "demandas"} · desde{" "}
        {persona.locality.name} · distancias aprox., en línea recta
      </p>
      {demands.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {demands.map((demand) => (
            <DemandCard key={demand.id} demand={demand} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay demandas con estos filtros"
          description="Probá ampliar el radio o elegir otra categoría."
          action={
            <LinkButton href="/demands" variant="secondary">
              Ver todas las demandas
            </LinkButton>
          }
        />
      )}
    </>
  );
}
