import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Tag } from "@/components/ui/Tag";
import { listDemands } from "@/lib/demands/queries";
import {
  type DemandFilters,
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

const demandsHref = (f: DemandFilters) => {
  const params = new URLSearchParams();
  if (f.category) params.set("category", f.category);
  if (f.radiusKm) params.set("radius", String(f.radiusKm));
  const qs = params.toString();
  return qs ? `/demands?${qs}` : "/demands";
};

async function DemandsContent({ searchParams }: Props) {
  const persona = await requirePersona();
  const filters = parseDemandFilters(await searchParams);
  const demands = await listDemands(filters, persona);
  const hasFilters = Boolean(filters.category || filters.radiusKm);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Demandas de compradores
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Empresas del NEA que buscan subproductos. Si tenés el material,
            publicá una oferta para que te encuentren.
          </p>
        </div>
        {persona.role === "buyer" && (
          <LinkButton href="/demands/new" className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden />
            Publicar demanda
          </LinkButton>
        )}
      </div>

      <Form
        key={JSON.stringify(filters)}
        action="/demands"
        className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-end"
      >
        <div className="flex flex-col gap-1.5 lg:w-72">
          <label htmlFor="category" className="text-xs font-bold text-gray-800">
            Categoría
          </label>
          <Select
            id="category"
            name="category"
            defaultValue={filters.category ?? ""}
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-xs font-bold text-gray-800">
            Radio desde {persona.locality.name}
          </legend>
          <div className="grid grid-cols-4 gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <label
                key={r ?? "all"}
                className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-brand-300 has-checked:border-brand-600 has-checked:bg-brand-600 has-checked:text-white"
              >
                <input
                  type="radio"
                  name="radius"
                  value={r ?? ""}
                  defaultChecked={(filters.radiusKm ?? null) === r}
                  className="sr-only"
                />
                {r ? `≤ ${r} km` : "Todas"}
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" className="lg:ml-auto">
          Aplicar
        </Button>
      </Form>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">
            {demands.length} {demands.length === 1 ? "demanda" : "demandas"}
          </span>{" "}
          · desde {persona.locality.name} · distancias aprox., en línea recta
        </span>
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.category && (
              <Tag
                tone="brand"
                removeHref={demandsHref({ ...filters, category: undefined })}
              >
                {CATEGORY_LABEL[filters.category]}
              </Tag>
            )}
            {filters.radiusKm && (
              <Tag
                tone="brand"
                removeHref={demandsHref({ ...filters, radiusKm: undefined })}
              >
                {`≤ ${filters.radiusKm} km`}
              </Tag>
            )}
            <Link href="/demands" className="text-gray-400 hover:text-gray-700">
              Restablecer
            </Link>
          </div>
        )}
      </div>

      {demands.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {demands.map((demand) => (
            <DemandCard key={demand.id} demand={demand} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay demandas con estos filtros"
          description="Probá ampliar el radio o elegir otra categoría."
          action={
            <LinkButton href="/demands" variant="secondary" size="sm">
              Ver todas las demandas
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
