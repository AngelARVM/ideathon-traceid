"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

/** Botón "Filtros (n)" y drawer lateral con los filtros, solo en mobile y tablet. */
export function FiltersDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Al aplicar los filtros cambia la URL: el drawer se cierra solo.
  // biome-ignore lint/correctness/useExhaustiveDependencies: depende solo de la URL.
  useEffect(() => setOpen(false), [pathname, searchParams]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-800 shadow-xs hover:border-brand-300 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden />
        Filtros{activeCount > 0 && ` (${activeCount})`}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-gray-900/40"
          />
          <div
            role="dialog"
            aria-label="Filtros del catálogo"
            className="absolute inset-y-0 left-0 flex w-80 max-w-[90vw] flex-col overflow-y-auto bg-white p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">
                Filtros del catálogo
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar filtros"
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
