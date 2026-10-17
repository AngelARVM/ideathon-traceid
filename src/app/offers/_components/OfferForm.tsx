"use client";

import { useActionState, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import type { Province } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";
import {
  CATEGORY_LABEL,
  FREIGHT_LABEL,
  PRESENTATION_LABEL,
  PROVINCE_LABEL,
} from "@/lib/labels";
import type { OfferFormValues } from "@/lib/offers/schema";

type OfferAction = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

type FormState = {
  result: ActionResult | null;
  values: OfferFormValues;
  /** Cambia en cada envío para volver a montar los campos con lo que se escribió. */
  attempt: number;
};

export type LocalityOption = { id: string; name: string; province: Province };

/** Formulario de alta y edición de ofertas. Si la acción falla, conserva lo escrito y marca los errores. */
export function OfferForm({
  action,
  initialValues,
  localities,
  offerId,
  submitLabel,
  cancelHref,
}: {
  action: OfferAction;
  initialValues: OfferFormValues;
  localities: LocalityOption[];
  offerId?: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await action(prev.result, formData);
      const values: OfferFormValues = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          values[key as keyof OfferFormValues] = value;
        }
      }
      return { result, values, attempt: prev.attempt + 1 };
    },
    { result: null, values: initialValues, attempt: 0 },
  );

  const errors =
    state.result && !state.result.ok ? (state.result.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {offerId && <input type="hidden" name="id" value={offerId} />}
      <FormError
        message={state.result && !state.result.ok ? state.result.error : null}
      />
      <Fields
        key={state.attempt}
        values={state.values}
        errors={errors}
        localities={localities}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <LinkButton href={cancelHref} variant="secondary">
          Cancelar
        </LinkButton>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

const section =
  "grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6 dark:border-stone-800 dark:bg-stone-900";
const sectionTitle =
  "text-sm font-bold uppercase tracking-wider text-stone-500 sm:col-span-2 dark:text-stone-400";

function Fields({
  values: v,
  errors,
  localities,
}: {
  values: OfferFormValues;
  errors: Record<string, string>;
  localities: LocalityOption[];
}) {
  const [status, setStatus] = useState(v.status || "available");
  const invalid = (name: string) => (errors[name] ? true : undefined);

  return (
    <>
      <fieldset className={section}>
        <legend className="sr-only">Lote</legend>
        <h2 className={sectionTitle}>Lote</h2>
        <div className="sm:col-span-2">
          <Field label="Título" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              name="title"
              defaultValue={v.title}
              maxLength={120}
              placeholder="Cascarilla de arroz a granel"
              aria-invalid={invalid("title")}
              required
            />
          </Field>
        </div>
        <Field label="Categoría" htmlFor="category" error={errors.category}>
          <Select
            id="category"
            name="category"
            defaultValue={v.category ?? ""}
            aria-invalid={invalid("category")}
            required
          >
            <option value="" disabled>
              Elegí una categoría
            </option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Localidad de origen"
          htmlFor="localityId"
          error={errors.localityId}
        >
          <Select
            id="localityId"
            name="localityId"
            defaultValue={v.localityId}
            aria-invalid={invalid("localityId")}
          >
            {localities.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({PROVINCE_LABEL[l.province]})
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Descripción"
            htmlFor="description"
            error={errors.description}
            hint="Origen, estado del material y usos habituales, en lenguaje condicional."
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={v.description}
              maxLength={1000}
              aria-invalid={invalid("description")}
              required
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className="sr-only">Stock y precio</legend>
        <h2 className={sectionTitle}>Stock y precio</h2>
        <Field
          label="Cantidad (Tn)"
          htmlFor="quantityTons"
          error={errors.quantityTons}
          hint="Hasta 3 decimales. Ej.: 650 o 12,5"
        >
          <Input
            id="quantityTons"
            name="quantityTons"
            inputMode="decimal"
            defaultValue={v.quantityTons}
            aria-invalid={invalid("quantityTons")}
            required
          />
        </Field>
        <Field
          label="Precio de referencia (ARS/Tn)"
          htmlFor="pricePerTon"
          error={errors.pricePerTon}
          hint="Opcional. Sin precio se muestra «Precio a convenir»."
        >
          <Input
            id="pricePerTon"
            name="pricePerTon"
            inputMode="decimal"
            defaultValue={v.pricePerTon}
            aria-invalid={invalid("pricePerTon")}
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            Disponibilidad
          </span>
          <div className="flex gap-2" role="radiogroup">
            {(
              [
                ["available", "Disponible"],
                ["estimated", "Estimada"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 text-sm font-semibold has-checked:border-campo-500 has-checked:bg-campo-50 has-checked:text-campo-800 dark:border-stone-700 dark:has-checked:bg-campo-950/60 dark:has-checked:text-campo-200"
              >
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  className="accent-campo-600"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.status && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors.status}
            </p>
          )}
        </div>
        {status === "estimated" && (
          <Field
            label="Fecha estimada de disponibilidad"
            htmlFor="estimatedDate"
            error={errors.estimatedDate}
          >
            <Input
              id="estimatedDate"
              name="estimatedDate"
              type="date"
              defaultValue={v.estimatedDate}
              aria-invalid={invalid("estimatedDate")}
              required
            />
          </Field>
        )}
      </fieldset>

      <fieldset className={section}>
        <legend className="sr-only">Características</legend>
        <h2 className={sectionTitle}>Características (opcionales)</h2>
        <Field
          label="Humedad (%)"
          htmlFor="humidityPct"
          error={errors.humidityPct}
        >
          <Input
            id="humidityPct"
            name="humidityPct"
            inputMode="decimal"
            defaultValue={v.humidityPct}
            aria-invalid={invalid("humidityPct")}
          />
        </Field>
        <Field
          label="Poder calorífico (kcal/kg)"
          htmlFor="calorificKcalKg"
          error={errors.calorificKcalKg}
        >
          <Input
            id="calorificKcalKg"
            name="calorificKcalKg"
            inputMode="numeric"
            defaultValue={v.calorificKcalKg}
            aria-invalid={invalid("calorificKcalKg")}
          />
        </Field>
        <Field
          label="Presentación"
          htmlFor="presentation"
          error={errors.presentation}
        >
          <Select
            id="presentation"
            name="presentation"
            defaultValue={v.presentation ?? ""}
            aria-invalid={invalid("presentation")}
          >
            <option value="">Sin especificar</option>
            {Object.entries(PRESENTATION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <fieldset className={section}>
        <legend className="sr-only">Logística</legend>
        <h2 className={sectionTitle}>Logística</h2>
        <Field label="Flete" htmlFor="freight" error={errors.freight}>
          <Select
            id="freight"
            name="freight"
            defaultValue={v.freight || "a_convenir"}
            aria-invalid={invalid("freight")}
          >
            {Object.entries(FREIGHT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
          <input
            type="checkbox"
            name="hasWeighbridge"
            defaultChecked={v.hasWeighbridge === "on"}
            className="h-4 w-4 accent-campo-600"
          />
          Báscula en planta
        </label>
        <div className="sm:col-span-2">
          <Field
            label="Análisis de laboratorio"
            htmlFor="labAnalysis"
            error={errors.labAnalysis}
            hint="Opcional. Se muestra como declarado por el vendedor, no verificado por SubMarket."
          >
            <Textarea
              id="labAnalysis"
              name="labAnalysis"
              rows={2}
              maxLength={500}
              defaultValue={v.labAnalysis}
              aria-invalid={invalid("labAnalysis")}
            />
          </Field>
        </div>
      </fieldset>
    </>
  );
}
