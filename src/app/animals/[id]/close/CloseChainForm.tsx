"use client";

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
export function CloseChainForm({ animalId }: { animalId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    closeChainAction,
    {},
  );
  const [type, setType] = useState<CloseType>("slaughterhouse_delivery");

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="animalId" value={animalId} />
      <NewIdField name="recordId" />

      <FormError state={state} />

      <div>
        <label htmlFor="type" className={label}>
          Motivo del cierre
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as CloseType)}
          className={field}
        >
          <option value="slaughterhouse_delivery">Entrega a frigorífico</option>
          <option value="death">Muerte</option>
        </select>
      </div>

      {type === "slaughterhouse_delivery" ? (
        <div>
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
        <>
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
        </>
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

      <div>
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
