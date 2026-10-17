"use client";

import { Select } from "@/components/ui/Field";
import type { CatalogSort } from "@/lib/offers/queries";

const SORT_LABEL: Record<CatalogSort, string> = {
  distance: "Más cercanas",
  price_asc: "Menor precio",
  price_desc: "Mayor precio",
  recent: "Más recientes",
  stock_desc: "Mayor stock",
};

/** Selector de orden: al cambiar, envía el formulario que lo contiene. */
export function SortSelect({ defaultValue }: { defaultValue: CatalogSort }) {
  return (
    <>
      <label htmlFor="catalog-sort" className="sr-only">
        Ordenar por
      </label>
      <Select
        id="catalog-sort"
        name="sort"
        defaultValue={defaultValue}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="sm:w-44"
      >
        {Object.entries(SORT_LABEL).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </Select>
    </>
  );
}
