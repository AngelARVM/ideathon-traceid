import type { ReactNode } from "react";

/** Contenedor de las páginas de demandas. La navegación por rol ya está en el header. */
export function DemandShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

export function DemandLoading() {
  return (
    <output className="block space-y-4" aria-label="Cargando demandas…">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-gray-200/60" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {["a", "b", "c"].map((k) => (
          <div
            key={k}
            className="h-64 animate-pulse rounded-xl bg-gray-200/60"
          />
        ))}
      </div>
    </output>
  );
}
