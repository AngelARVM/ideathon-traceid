"use client";

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
        className="mt-3 text-xs font-semibold text-campo-700 dark:text-campo-300 hover:underline"
      >
        Rectificar este registro
        {chainClosed ? " (la cadena está cerrada, igual se puede)" : ""}
      </button>
    );
  }

  return (
    <form
      action={action}
      className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3"
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

      <p className="text-sm font-semibold">
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium"
        >
          Cancelar
        </button>
        <div className="flex-1">
          <SubmitButton pending={pending}>Registrar rectificación</SubmitButton>
        </div>
      </div>
    </form>
  );
}
