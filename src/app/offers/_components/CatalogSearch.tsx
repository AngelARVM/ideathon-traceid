import { Search } from "lucide-react";
import Form from "next/form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { CatalogFilters as Filters } from "@/lib/offers/queries";
import { SortSelect } from "./SortSelect";

/**
 * Búsqueda de texto (`q`) y orden (`sort`) del catálogo (§9.2). El resto de los filtros viaja
 * como campos ocultos, para que buscar u ordenar no los borre.
 */
export function CatalogSearch({ filters }: { filters: Filters }) {
  const { q, sort, ...rest } = filters;
  return (
    <Form
      key={JSON.stringify(filters)}
      action="/offers"
      role="search"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      {Object.entries(rest).map(([name, value]) =>
        value === undefined ? null : (
          <input key={name} type="hidden" name={name} value={String(value)} />
        ),
      )}
      <div className="relative min-w-0 flex-1">
        <label htmlFor="catalog-q" className="sr-only">
          Buscar en el catálogo
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <Input
          id="catalog-q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          minLength={2}
          maxLength={60}
          placeholder="Buscar por título o descripción, ej. pino"
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <SortSelect defaultValue={sort ?? "distance"} />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </div>
    </Form>
  );
}
