"use client";

import { Building2, Skull } from "lucide-react";
import { useActionState, useState } from "react";
import { type ActionState, closeChainAction } from "@/app/animals/actions";
import {
  FormError,
  field,
  label,
  personalDataHint,
  SubmitButton,
} from "@/app/animals/form-ui";
import { NewIdField } from "@/components/NewIdField";

type CloseType = "death" | "slaughterhouse_delivery";

/**
 * La confirmación tipeada no es decorativa: el cierre es la única acción del MVP que no se
 * puede deshacer ni con una rectificación.
 */
export function CloseChainForm({
  animalId,
  initialType = "slaughterhouse_delivery",
}: {
  animalId: string;
  initialType?: CloseType;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    closeChainAction,
    {},
  );
  const [type, setType] = useState<CloseType>(initialType);

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="animalId" value={animalId} />
      <NewIdField name="recordId" />

      <FormError state={state} />

      <div>
        <span className={label}>Motivo del cierre</span>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition focus-within:ring-2 focus-within:ring-campo-600/50 ${type === "slaughterhouse_delivery" ? "border-stone-600 bg-stone-50 dark:border-stone-400 dark:bg-stone-800" : "border-stone-200 hover:border-stone-400 dark:border-stone-700"}`}
          >
            <input
              className="sr-only"
              type="radio"
              name="type"
              value="slaughterhouse_delivery"
              checked={type === "slaughterhouse_delivery"}
              onChange={() => setType("slaughterhouse_delivery")}
            />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <strong className="block text-sm">Entrega a frigorífico</strong>
              <small className="text-xs text-stone-500 dark:text-stone-400">
                Fin del seguimiento
              </small>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition focus-within:ring-2 focus-within:ring-rose-500/50 ${type === "death" ? "border-rose-500 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/40" : "border-stone-200 hover:border-rose-300 dark:border-stone-700"}`}
          >
            <input
              className="sr-only"
              type="radio"
              name="type"
              value="death"
              checked={type === "death"}
              onChange={() => setType("death")}
            />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
              <Skull className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <strong className="block text-sm">Muerte</strong>
              <small className="text-xs text-stone-500 dark:text-stone-400">
                Baja biológica
              </small>
            </span>
          </label>
        </div>
      </div>

      {type === "slaughterhouse_delivery" ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/40">
          <label htmlFor="establishment_label" className={label}>
            Frigorífico
          </label>
          <input
            id="establishment_label"
            name="data.establishment_label"
            required
            maxLength={120}
            placeholder="Frigorífico Corrientes"
            className={field}
          />
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {personalDataHint}
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/40">
          <div>
            <label htmlFor="cause" className={label}>
              Causa{" "}
              <span className="font-normal text-stone-500">(opcional)</span>
            </label>
            <select
              id="cause"
              name="data.cause"
              defaultValue=""
              className={field}
            >
              <option value="">Sin especificar</option>
              <option value="disease">Enfermedad</option>
              <option value="accident">Accidente</option>
              <option value="predation">Depredación</option>
              <option value="unknown">Desconocida</option>
              <option value="other">Otra</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes" className={label}>
              Notas{" "}
              <span className="font-normal text-stone-500">(opcional)</span>
            </label>
            <textarea
              id="notes"
              name="data.notes"
              maxLength={280}
              rows={2}
              className={`${field} h-auto py-2`}
            />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {personalDataHint}
            </p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="occurredAt" className={label}>
          Cuándo pasó
        </label>
        <input
          id="occurredAt"
          name="occurredAt"
          type="datetime-local"
          required
          defaultValue={new Date(
            Date.now() - new Date().getTimezoneOffset() * 60_000,
          )
            .toISOString()
            .slice(0, 16)}
          className={field}
        />
      </div>

      <div className="border-t border-stone-100 pt-4 dark:border-stone-800">
        <label htmlFor="confirmation" className={label}>
          Escribí CERRAR para confirmar
        </label>
        <input
          id="confirmation"
          name="confirmation"
          required
          autoComplete="off"
          placeholder="CERRAR"
          className={`${field} font-mono-num tracking-widest`}
        />
      </div>

      <SubmitButton pending={pending} tone="danger">
        Cerrar la cadena definitivamente
      </SubmitButton>
    </form>
  );
}
