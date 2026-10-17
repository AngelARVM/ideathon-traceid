import Form from "next/form";
import type { ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { RADIUS_OPTIONS } from "@/lib/geo";
import { CATEGORY_LABEL, PRESENTATION_LABEL } from "@/lib/labels";
import type { CatalogFilters as Filters } from "@/lib/offers/queries";

/** Barra de filtros del catálogo: formulario GET con los query params de §9.2. */
export function CatalogFilters({ filters }: { filters: Filters }) {
  return (
    <Form
      // `key`: al navegar con otros filtros, los controles se vuelven a montar con sus valores.
      key={JSON.stringify(filters)}
      action="/ofertas"
      className="grid grid-cols-2 gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-7 dark:border-stone-800 dark:bg-stone-900"
    >
      <FilterField
        id="filter-categoria"
        label="Categoría"
        className="col-span-2 sm:col-span-1 lg:col-span-2"
      >
        <Select
          id="filter-categoria"
          name="categoria"
          defaultValue={filters.categoria ?? ""}
        >
          <option value="">Todas</option>
          {Object.entries(CATEGORY_LABEL).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </Select>
      </FilterField>
      <FilterField id="filter-radio" label="Radio">
        <Select
          id="filter-radio"
          name="radio"
          defaultValue={filters.radio?.toString() ?? ""}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r ?? "all"} value={r ?? ""}>
              {r ? `≤ ${r} km` : "Todas"}
            </option>
          ))}
        </Select>
      </FilterField>
      <FilterField id="filter-disponibilidad" label="Disponibilidad">
        <Select
          id="filter-disponibilidad"
          name="disponibilidad"
          defaultValue={filters.disponibilidad ?? ""}
        >
          <option value="">Todas</option>
          <option value="disponible">Disponible</option>
          <option value="estimada">Estimada</option>
        </Select>
      </FilterField>
      <FilterField id="filter-presentacion" label="Presentación">
        <Select
          id="filter-presentacion"
          name="presentacion"
          defaultValue={filters.presentacion ?? ""}
        >
          <option value="">Todas</option>
          {Object.entries(PRESENTATION_LABEL).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </Select>
      </FilterField>
      <FilterField id="filter-humedad" label="Humedad máx. %">
        <Input
          id="filter-humedad"
          name="humedadMax"
          inputMode="decimal"
          defaultValue={filters.humedadMax?.toString() ?? ""}
          placeholder="Ej. 12"
        />
      </FilterField>
      <FilterField id="filter-kcal" label="kcal/kg mín.">
        <Input
          id="filter-kcal"
          name="kcalMin"
          inputMode="numeric"
          defaultValue={filters.kcalMin?.toString() ?? ""}
          placeholder="Ej. 3500"
        />
      </FilterField>
      <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-7 lg:justify-end">
        <LinkButton href="/ofertas" variant="ghost" size="sm">
          Limpiar
        </LinkButton>
        <Button type="submit" size="sm">
          Aplicar
        </Button>
      </div>
    </Form>
  );
}

function FilterField({
  id,
  label,
  className = "",
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={id}
        className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
