"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { OfferCard, type OfferCardData } from "@/components/OfferCard";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import { FormSection } from "@/components/ui/FormSection";
import { Steps } from "@/components/ui/Steps";
import {
  Category,
  type Presentation,
  type Province,
} from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";
import {
  CATEGORY_LABEL,
  FREIGHT_LABEL,
  PRESENTATION_LABEL,
  PROVINCE_LABEL,
} from "@/lib/labels";
import type { OfferFormField, OfferFormValues } from "@/lib/offers/schema";

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

const STEPS = [
  "Identificación",
  "Volumen y precio",
  "Ubicación y logística",
  "Ficha técnica",
];

/** Paso de cada campo: si la acción devuelve `fieldErrors`, el wizard salta al primero. */
const FIELD_STEP: Record<OfferFormField, number> = {
  title: 0,
  category: 0,
  description: 0,
  quantityTons: 1,
  pricePerTon: 1,
  status: 1,
  estimatedDate: 1,
  localityId: 2,
  freight: 2,
  hasWeighbridge: 2,
  labAnalysis: 2,
  humidityPct: 3,
  calorificKcalKg: 3,
  presentation: 3,
};

const errorSteps = (errors: Record<string, string>) => [
  ...new Set(
    Object.keys(errors).map((k) => FIELD_STEP[k as OfferFormField] ?? 0),
  ),
];

/**
 * Wizard de alta y edición de ofertas. Todos los campos
 * viven en un solo `<form>`: los pasos se ocultan con CSS, no se desmontan, y se envía una vez.
 */
export function OfferForm({
  action,
  initialValues,
  localities,
  sellerName,
  offerId,
  submitLabel,
  cancelHref,
}: {
  action: OfferAction;
  initialValues: OfferFormValues;
  localities: LocalityOption[];
  sellerName: string;
  offerId?: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OfferFormValues>(initialValues);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: FormState, formData: FormData): Promise<FormState> => {
      const result = await action(prev.result, formData);
      const values = readValues(formData);
      if (!result.ok && result.fieldErrors) {
        const steps = errorSteps(result.fieldErrors);
        if (steps.length > 0) setStep(Math.min(...steps));
      }
      return { result, values, attempt: prev.attempt + 1 };
    },
    { result: null, values: initialValues, attempt: 0 },
  );

  const errors =
    state.result && !state.result.ok ? (state.result.fieldErrors ?? {}) : {};
  const last = step === STEPS.length - 1;

  /** Valida con el navegador solo los campos del paso visible antes de avanzar. */
  function next() {
    const panel = formRef.current?.querySelector<HTMLElement>(
      `[data-step="${step}"]`,
    );
    const fields = panel?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");
    for (const f of fields ?? []) {
      if (!f.checkValidity()) {
        f.reportValidity();
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={(e) => setDraft(readValues(new FormData(e.currentTarget)))}
      className="space-y-6"
      noValidate
    >
      {offerId && <input type="hidden" name="id" value={offerId} />}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
        <Steps
          steps={STEPS}
          current={step}
          invalid={errorSteps(errors)}
          onSelect={setStep}
        />
      </div>
      <FormError
        message={state.result && !state.result.ok ? state.result.error : null}
      />
      <Fields
        key={state.attempt}
        step={step}
        values={state.values}
        draft={draft}
        errors={errors}
        localities={localities}
        sellerName={sellerName}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LinkButton href={cancelHref} variant="ghost">
          Cancelar
        </LinkButton>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Anterior
            </Button>
          )}
          {/* `key` distintas: si React reusara el botón, el clic en "Siguiente" que lleva al último
              paso lo encontraría ya convertido en submit y enviaría el formulario. */}
          {last ? (
            <Button key="submit" type="submit" disabled={pending}>
              {pending ? "Guardando…" : submitLabel}
            </Button>
          ) : (
            <Button key="next" onClick={next}>
              Siguiente
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function readValues(formData: FormData): OfferFormValues {
  const values: OfferFormValues = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key as keyof OfferFormValues] = value;
    }
  }
  return values;
}

function Fields({
  step,
  values: v,
  draft,
  errors,
  localities,
  sellerName,
}: {
  step: number;
  values: OfferFormValues;
  draft: OfferFormValues;
  errors: Record<string, string>;
  localities: LocalityOption[];
  sellerName: string;
}) {
  const [status, setStatus] = useState(v.status || "available");
  const invalid = (name: string) => (errors[name] ? true : undefined);

  return (
    <>
      <FormSection
        n={1}
        step={{ index: 0, current: step }}
        title="Identificación"
        description="Qué subproducto ofrecés y cómo lo describirías."
      >
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
        <div className="sm:col-span-2">
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
        </div>
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
              rows={4}
              defaultValue={v.description}
              maxLength={1000}
              aria-invalid={invalid("description")}
              required
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        n={2}
        step={{ index: 1, current: step }}
        title="Volumen y precio"
        description="Stock en toneladas y un precio de referencia para negociar."
      >
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
          <span className="text-sm font-semibold text-gray-700">
            Disponibilidad
          </span>
          <div className="flex gap-2" role="radiogroup">
            {(
              [
                ["available", "Lote inmediato"],
                ["estimated", "Estimativo"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 transition hover:border-brand-300 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-700"
              >
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  className="accent-brand-600"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.status && (
            <p className="text-xs font-medium text-red-600">{errors.status}</p>
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
      </FormSection>

      <FormSection
        n={3}
        step={{ index: 2, current: step }}
        title="Ubicación y logística"
        description="Dónde está el lote y cómo se retira. El flete se coordina fuera de SubMarket."
      >
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
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 sm:col-span-2">
          <input
            type="checkbox"
            name="hasWeighbridge"
            defaultChecked={v.hasWeighbridge === "on"}
            className="h-4 w-4 accent-brand-600"
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
      </FormSection>

      <FormSection
        n={4}
        step={{ index: 3, current: step }}
        title="Ficha técnica y confirmación"
        description="Características opcionales y una vista previa de cómo se ve en el catálogo."
      >
        <div className="grid content-start gap-4">
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
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-gray-700">
            Vista previa
          </p>
          <Preview
            draft={draft}
            localities={localities}
            sellerName={sellerName}
          />
        </div>
      </FormSection>
    </>
  );
}

/** La oferta tal como se vería en el catálogo, con lo escrito hasta ahora. */
function Preview({
  draft: d,
  localities,
  sellerName,
}: {
  draft: OfferFormValues;
  localities: LocalityOption[];
  sellerName: string;
}) {
  const category = Object.values<string>(Category).includes(d.category ?? "")
    ? (d.category as Category)
    : null;
  if (!category) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        Elegí una categoría en el paso 1 para ver la vista previa.
      </p>
    );
  }
  const locality = localities.find((l) => l.id === d.localityId);
  const decimal = (s?: string) => {
    const raw = s ?? "";
    const n = Number(
      raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw,
    );
    return s && Number.isFinite(n) ? String(n) : null;
  };
  const offer: OfferCardData = {
    id: "preview",
    title: d.title || "Título de la oferta",
    category,
    status: d.status === "estimated" ? "estimated" : "available",
    estimatedDate: d.estimatedDate || null,
    quantityTons: decimal(d.quantityTons) ?? "0",
    pricePerTon: decimal(d.pricePerTon),
    humidityPct: decimal(d.humidityPct),
    calorificKcalKg: d.calorificKcalKg
      ? Number(d.calorificKcalKg) || null
      : null,
    presentation: (d.presentation || null) as Presentation | null,
    hasWeighbridge: d.hasWeighbridge === "on",
    locality: {
      name: locality?.name ?? "—",
      province: locality?.province ?? "corrientes",
    },
    seller: { name: sellerName },
  };
  return (
    <div inert className="pointer-events-none">
      <OfferCard offer={offer} />
    </div>
  );
}
