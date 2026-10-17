import type { CatalogFilters } from "@/lib/offers/queries";

type FilterKey = keyof CatalogFilters;

/** URL de `/offers` con los filtros dados; `undefined` en `overrides` quita ese param. */
export function catalogHref(
  filters: CatalogFilters,
  overrides: Partial<Record<FilterKey, string | number | undefined>> = {},
): string {
  const merged: Record<string, unknown> = { ...filters, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/offers?${qs}` : "/offers";
}
