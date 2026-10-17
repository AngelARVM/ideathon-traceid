import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { requirePersona } from "@/lib/persona";

async function DemandNavigation() {
  const persona = await requirePersona();
  return (
    <nav
      aria-label="Navegación de demandas"
      className="mb-6 flex flex-wrap gap-4 text-sm font-semibold text-campo-700 dark:text-campo-300"
    >
      <Link href="/demands" className="hover:underline">
        Todas las demandas
      </Link>
      {persona.role === "buyer" && (
        <>
          <Link href="/my-demands" className="hover:underline">
            Mis demandas
          </Link>
          <Link href="/demands/new" className="hover:underline">
            Publicar demanda
          </Link>
        </>
      )}
    </nav>
  );
}

export function DemandShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Suspense fallback={<div className="mb-6 h-5" />}>
        <DemandNavigation />
      </Suspense>
      {children}
    </div>
  );
}

export function DemandLoading() {
  return (
    <output className="block py-12 text-sm text-stone-500">
      Cargando demandas…
    </output>
  );
}
