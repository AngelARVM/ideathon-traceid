"use client";

import { AlertTriangle, Building2, ChevronRight, Skull } from "lucide-react";
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
import { RecordTypeIcon } from "@/components/RecordTypeIcon";
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
      <div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SELECTABLE_RECORD_TYPES.map((candidate) => (
            <li key={candidate}>
              <Link
                href={`/animals/${animalId}/records/new?tipo=${candidate}`}
                className="flex h-full min-h-28 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-campo-500 hover:bg-campo-50/50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-campo-700 dark:hover:bg-campo-950/20"
              >
                <RecordTypeIcon type={candidate} />
                <p className="mt-3 text-sm font-bold">
                  {RECORD_TYPES[candidate].label}
                </p>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                  {RECORD_TYPES[candidate].hint}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-stone-100 pt-5 dark:border-stone-800">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Cierra la cadena ·
            irreversible
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/animals/${animalId}/close?tipo=slaughterhouse_delivery`}
              className="flex items-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-4 transition hover:border-rose-500 dark:border-rose-900 dark:bg-rose-950/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white">
                <Building2 className="h-5 w-5" aria-hidden />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">Entrega a frigorífico</strong>
                <small className="text-xs text-stone-500 dark:text-stone-400">
                  Fin del seguimiento
                </small>
              </span>
              <ChevronRight className="h-4 w-4 text-stone-400" aria-hidden />
            </Link>
            <Link
              href={`/animals/${animalId}/close?tipo=death`}
              className="flex items-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-4 transition hover:border-rose-500 dark:border-rose-900 dark:bg-rose-950/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                <Skull className="h-5 w-5" aria-hidden />
              </span>
              <span className="flex-1">
                <strong className="block text-sm">Muerte</strong>
                <small className="text-xs text-stone-500 dark:text-stone-400">
                  Baja biológica
                </small>
              </span>
              <ChevronRight className="h-4 w-4 text-stone-400" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
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

      <div className="flex items-start gap-3 rounded-2xl border border-campo-200 bg-campo-50 p-3.5 dark:border-campo-800 dark:bg-campo-950/40">
        <RecordTypeIcon type={type} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{meta.label}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {meta.hint}
          </p>
          <Link
            href={`/animals/${animalId}/records/new`}
            className="mt-1 inline-block text-xs font-semibold text-campo-700 hover:underline dark:text-campo-300"
          >
            Cambiar tipo
          </Link>
        </div>
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
