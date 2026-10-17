import Form from "next/form";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { RADIUS_OPTIONS } from "@/lib/geo";
import {
  CATEGORY_LABEL,
  PRESENTATION_LABEL,
  PROVINCE_LABEL,
} from "@/lib/labels";
import type { CatalogFilters as Filters } from "@/lib/offers/queries";

/**
 * Filtros del catálogo en columna: formulario GET con los query params de §9.2. El modo
 * (`availability`), la búsqueda (`q`) y el orden (`sort`) se eligen en la barra de arriba y
 * viajan como campos ocultos. `idPrefix` evita ids repetidos entre la barra lateral y el drawer
 * de mobile.
 */
export function CatalogFilters({
  filters,
  idPrefix,
}: {
  filters: Filters;
  idPrefix: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <Form
      // `key`: al navegar con otros filtros, los controles se vuelven a montar con sus valores.
      key={JSON.stringify(filters)}
      action="/offers"
      className="flex flex-col gap-4"
    >
      {filters.availability && (
        <input type="hidden" name="availability" value={filters.availability} />
      )}
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
      <FilterField id={id("category")} label="Categoría">
        <Select
          id={id("category")}
          name="category"
          defaultValue={filters.category ?? ""}
        >
          <option value="">Todas</option>
          {Object.entries(CATEGORY_LABEL).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </Select>
      </FilterField>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-bold text-gray-800">
          Radio desde tu planta
        </legend>
        <div className="grid grid-cols-2 gap-1">
          {RADIUS_OPTIONS.map((r) => (
            <label
              key={r ?? "all"}
              className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-700 transition hover:border-brand-300 has-checked:border-brand-600 has-checked:bg-brand-600 has-checked:text-white"
            >
              <input
                type="radio"
                name="radius"
                value={r ?? ""}
                defaultChecked={(filters.radius ?? null) === r}
                className="sr-only"
              />
              {r ? `≤ ${r} km` : "Todas"}
            </label>
          ))}
        </div>
      </fieldset>

      <FilterField id={id("province")} label="Provincia">
        <Select
          id={id("province")}
          name="province"
          defaultValue={filters.province ?? ""}
        >
          <option value="">Todas</option>
          {Object.entries(PROVINCE_LABEL).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </Select>
      </FilterField>

      <div className="grid grid-cols-2 gap-3">
        <FilterField id={id("price")} label="Precio máx. $/Tn">
          <Input
            id={id("price")}
            name="maxPrice"
            inputMode="decimal"
            defaultValue={filters.maxPrice ?? ""}
            placeholder="Ej. 30000"
          />
        </FilterField>
        <FilterField id={id("stock")} label="Stock mín. Tn">
          <Input
            id={id("stock")}
            name="minStock"
            inputMode="decimal"
            defaultValue={filters.minStock ?? ""}
            placeholder="Ej. 100"
          />
        </FilterField>
      </div>

      <FilterField id={id("presentation")} label="Presentación">
        <Select
          id={id("presentation")}
          name="presentation"
          defaultValue={filters.presentation ?? ""}
        >
          <option value="">Cualquier presentación</option>
          {Object.entries(PRESENTATION_LABEL).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </Select>
      </FilterField>

      <div className="grid grid-cols-2 gap-3">
        <FilterField id={id("humidity")} label="Humedad máx. %">
          <Input
            id={id("humidity")}
            name="maxHumidity"
            inputMode="decimal"
            defaultValue={filters.maxHumidity?.toString() ?? ""}
            placeholder="Ej. 12"
          />
        </FilterField>
        <FilterField id={id("kcal")} label="kcal/kg mín.">
          <Input
            id={id("kcal")}
            name="minKcal"
            inputMode="numeric"
            defaultValue={filters.minKcal?.toString() ?? ""}
            placeholder="Ej. 3500"
          />
        </FilterField>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-800">
        <input
          type="checkbox"
          name="weighbridge"
          value="1"
          defaultChecked={filters.weighbridge === 1}
          className="h-4 w-4 rounded border-gray-300 accent-brand-600"
        />
        Con báscula en planta
      </label>

      <Button type="submit" size="sm" className="w-full">
        Aplicar filtros
      </Button>
    </Form>
  );
}

function FilterField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold text-gray-800">
        {label}
      </label>
      {children}
    </div>
  );
}
