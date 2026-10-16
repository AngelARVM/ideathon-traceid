"use client";

import { PencilLine, X } from "lucide-react";
import { useActionState, useState } from "react";
import { type ActionState, rectifyAction } from "@/app/animals/actions";
import {
  FormError,
  field,
  label,
  personalDataHint,
  SubmitButton,
} from "@/app/animals/form-ui";
import { NewIdField } from "@/components/NewIdField";

/**
 * Rectificar (docs/02, R7). Disponible con la cadena abierta **y** cerrada, porque corregir un
 * error no es lo mismo que seguir cargando hitos. Ninguno de los dos registros se borra: el
 * original queda y la rectificación lo marca.
 */
export function RectifyDialog({
  animalId,
  recordId,
  seq,
  typeLabel,
  chainClosed,
}: {
  animalId: string;
  recordId: string;
  seq: number;
  typeLabel: string;
  chainClosed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    rectifyAction,
    {},
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-campo-700 transition hover:bg-campo-50 dark:text-campo-300 dark:hover:bg-campo-950/50"
      >
        <PencilLine className="h-3.5 w-3.5" aria-hidden />
        Rectificar este registro
        {chainClosed ? " (la cadena está cerrada, igual se puede)" : ""}
      </button>
    );
  }

  return (
    <form
      action={action}
      className="mt-4 space-y-4 rounded-2xl border border-campo-200 bg-campo-50/50 p-4 dark:border-campo-800 dark:bg-campo-950/20"
    >
      <input type="hidden" name="animalId" value={animalId} />
      <input type="hidden" name="rectifiesRecordId" value={recordId} />
      <NewIdField name="recordId" />
      <input
        type="hidden"
        name="occurredAt"
        value={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
          .toISOString()
          .slice(0, 16)}
      />

      <FormError state={state} />

      <p className="flex items-center gap-2 text-sm font-bold text-campo-900 dark:text-campo-200">
        <PencilLine className="h-4 w-4" aria-hidden />
        Rectificar #{seq} · {typeLabel}
      </p>
      <div>
        <label htmlFor={`reason-${recordId}`} className={label}>
          Qué se corrige
        </label>
        <textarea
          id={`reason-${recordId}`}
          name="reason"
          required
          maxLength={280}
          rows={2}
          placeholder="El peso se cargó en gramos en lugar de kilos."
          className={`${field} h-auto py-2`}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Los dos registros quedan visibles, acá y en la vista pública.{" "}
          {personalDataHint}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
        >
          <X className="h-4 w-4" aria-hidden />
          Cancelar
        </button>
        <div className="min-w-48 flex-1">
          <SubmitButton pending={pending}>Registrar rectificación</SubmitButton>
        </div>
      </div>
    </form>
  );
}
