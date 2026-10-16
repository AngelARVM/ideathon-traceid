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
      className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-sm font-medium disabled:opacity-60"
    >
      <RefreshCw
        className={`w-4 h-4 ${pending ? "animate-spin" : ""}`}
        aria-hidden
      />
      {pending ? "Procesando…" : "Procesar cola"}
    </button>
  );
}
