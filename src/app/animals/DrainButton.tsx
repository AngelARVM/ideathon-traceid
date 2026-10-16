"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { drainAction } from "./actions";

/**
 * Corre el drainer a pedido. En S2 el drainer es un script manual (docs/04, Pending), y este
 * botón es la misma invocación manual desde la UI: sirve para mostrar en la demo cómo un
 * registro pasa de "En cola" a "Confirmado" sin abrir una terminal.
 */
export function DrainButton({ animalId }: { animalId?: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => drainAction(animalId))}
      title="Procesa el outbox una vez, igual que `npm run outbox:drain`."
      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
    >
      <RefreshCw
        className={`w-4 h-4 ${pending ? "animate-spin" : ""}`}
        aria-hidden
      />
      {pending ? "Procesando…" : "Procesar cola"}
    </button>
  );
}
