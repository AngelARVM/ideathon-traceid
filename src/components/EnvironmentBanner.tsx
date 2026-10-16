import { Layers } from "lucide-react";

/** Aviso permanente: el escritor real de Stellar todavía no está conectado (S2). */
export function EnvironmentBanner() {
  return (
    <aside
      aria-label="Aviso de entorno"
      className="border-b border-amber-200/80 bg-amber-50/90 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-950/60 dark:bg-stone-900 dark:text-amber-200"
    >
      <p className="mx-auto flex max-w-7xl items-center gap-2 sm:px-3">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
          aria-hidden
        />
        <Layers
          className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <span>
          <strong>Modo demostración.</strong> Los registros se confirman
          localmente; la conexión con Stellar está pendiente.
        </span>
      </p>
    </aside>
  );
}
