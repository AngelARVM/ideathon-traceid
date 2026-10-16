"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type ActionState, appendRecordAction } from "@/app/animals/actions";
import {
  FormError,
  field,
  label,
  personalDataHint,
  SubmitButton,
} from "@/app/animals/form-ui";
import { NewIdField } from "@/components/NewIdField";
import type { RecordType } from "@/generated/prisma/enums";
import { RECORD_TYPES, SELECTABLE_RECORD_TYPES } from "@/lib/records/types";

/**
 * El tipo se elige primero y queda en la URL, así que volver atrás vuelve al selector en vez
 * de perder el formulario.
 */
export function NewRecordForm({
  animalId,
  selected,
}: {
  animalId: string;
  selected: string | null;
}) {
  const type =
    SELECTABLE_RECORD_TYPES.find((candidate) => candidate === selected) ?? null;

  if (!type) {
    return (
      <ul className="mt-6 space-y-2">
        {SELECTABLE_RECORD_TYPES.map((candidate) => (
          <li key={candidate}>
            <Link
              href={`/animals/${animalId}/records/new?tipo=${candidate}`}
              className="block rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-campo-400 dark:hover:border-campo-700"
            >
              <p className="font-semibold">{RECORD_TYPES[candidate].label}</p>
              <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                {RECORD_TYPES[candidate].hint}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return <TypeForm animalId={animalId} type={type} />;
}

function TypeForm({ animalId, type }: { animalId: string; type: RecordType }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    appendRecordAction,
    {},
  );
  const meta = RECORD_TYPES[type];

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="animalId" value={animalId} />
      <input type="hidden" name="type" value={type} />
      <NewIdField name="recordId" />

      <FormError state={state} />

      <div className="rounded-xl bg-stone-100 dark:bg-stone-800/60 px-3 py-2.5">
        <p className="text-sm font-semibold">{meta.label}</p>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {meta.hint}
        </p>
        <Link
          href={`/animals/${animalId}/records/new`}
          className="mt-1 inline-block text-xs text-campo-700 dark:text-campo-300 hover:underline"
        >
          Cambiar tipo
        </Link>
      </div>

      <TypeFields type={type} />

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

      <SubmitButton pending={pending}>Registrar hito</SubmitButton>
    </form>
  );
}

function Text({
  name,
  children,
  max,
  required = false,
  placeholder,
  hint,
}: {
  name: string;
  children: string;
  max: number;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={label}>
        {children}
        {required ? null : (
          <span className="font-normal text-stone-500"> (opcional)</span>
        )}
      </label>
      <input
        id={name}
        name={`data.${name}`}
        maxLength={max}
        required={required}
        placeholder={placeholder}
        className={field}
      />
      {hint ? (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  name,
  children,
  options,
}: {
  name: string;
  children: string;
  options: [value: string, label: string][];
}) {
  return (
    <div>
      <label htmlFor={name} className={label}>
        {children}{" "}
        <span className="font-normal text-stone-500">(opcional)</span>
      </label>
      <select id={name} name={`data.${name}`} defaultValue="" className={field}>
        <option value="">Sin especificar</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

const ROUTES: [string, string][] = [
  ["sc", "Subcutánea"],
  ["im", "Intramuscular"],
  ["iv", "Intravenosa"],
  ["oral", "Oral"],
  ["other", "Otra"],
];

/** Un bloque por tipo. Los campos son los de docs/05 y ni uno más. */
function TypeFields({ type }: { type: RecordType }) {
  switch (type) {
    case "weighing":
      return (
        <>
          <div>
            <label htmlFor="weight_kg" className={label}>
              Peso en kilos
            </label>
            <input
              id="weight_kg"
              name="weight_kg"
              type="number"
              step="0.001"
              min="0.001"
              required
              inputMode="decimal"
              className={`${field} font-mono-num`}
            />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Se guarda en gramos enteros: la serialización canónica no admite
              decimales.
            </p>
          </div>
          <Select
            name="method"
            options={[
              ["scale", "Balanza"],
              ["estimated", "Estimado"],
            ]}
          >
            Método
          </Select>
        </>
      );

    case "vaccination":
    case "deworming":
      return (
        <>
          <Text
            name="product"
            max={120}
            required
            placeholder="Aftosa bivalente"
          >
            Producto
          </Text>
          <Text name="dose" max={40} required placeholder="2 ml">
            Dosis
          </Text>
          <Text name="batch" max={60} placeholder="L-2026-03">
            Partida
          </Text>
          <Select name="route" options={ROUTES}>
            Vía
          </Select>
        </>
      );

    case "feeding":
      return (
        <>
          <Text
            name="diet"
            max={200}
            required
            placeholder="Silaje de maíz con balanceado"
            hint={`Solo el cambio: la dieta base está en el alta. ${personalDataHint}`}
          >
            Nueva dieta
          </Text>
          <Text name="change_reason" max={200} hint={personalDataHint}>
            Motivo del cambio
          </Text>
          <div>
            <label htmlFor="effective_from" className={label}>
              Vigente desde{" "}
              <span className="font-normal text-stone-500">(opcional)</span>
            </label>
            <input
              id="effective_from"
              name="data.effective_from"
              type="date"
              className={field}
            />
          </div>
        </>
      );

    case "movement":
      return (
        <>
          <Text name="from_label" max={120} placeholder="Est. La Esperanza">
            Desde
          </Text>
          <Text name="to_label" max={120} placeholder="Est. San Roque">
            Hacia
          </Text>
          <Text name="transport_doc" max={60} placeholder="DTE 123456">
            Documento de transporte
          </Text>
        </>
      );

    case "sale":
      return (
        <>
          <Text
            name="buyer_label"
            max={120}
            hint={`Una etiqueta pública, no el nombre de una persona. ${personalDataHint}`}
          >
            Comprador
          </Text>
          <Text
            name="document_ref"
            max={60}
            placeholder="Factura A-0001-00012345"
          >
            Documento
          </Text>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            No se registran montos: un precio en una cadena pública es
            irreversible.
          </p>
        </>
      );

    case "other":
      return (
        <>
          <Text name="title" max={80} required>
            Título
          </Text>
          <Text name="description" max={280} required hint={personalDataHint}>
            Descripción
          </Text>
        </>
      );

    default:
      return null;
  }
}
