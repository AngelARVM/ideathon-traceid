"use client";

import { type ReactNode, useActionState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import type { Province } from "@/generated/prisma/enums";
import type { ActionResult } from "@/lib/action-result";
import { createDemand, updateDemand } from "@/lib/demands/actions";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";

export type DemandFormValues = {
  title: string;
  category: string;
  description: string;
  quantityTons: string;
  maxPricePerTon: string;
  neededBy: string;
  radiusKm: string;
  localityId: string;
};

type Props = {
  id?: string;
  initialValues: DemandFormValues;
  localities: { id: string; name: string; province: Province }[];
  today: string;
};

export function DemandForm({ id, initialValues, localities, today }: Props) {
  const [result, action, pending] = useActionState<ActionResult, FormData>(
    id ? updateDemand : createDemand,
    { ok: true },
  );
  const errors = result.ok ? {} : (result.fieldErrors ?? {});
  const control = (field: keyof DemandFormValues) => ({
    id: field,
    name: field,
    defaultValue: initialValues[field],
    "aria-invalid": Boolean(errors[field]),
  });

  // Server validation failures must not clear the user's native form controls.
  return (
    <form action={action} onReset={(event) => event.preventDefault()}>
      {id && <input type="hidden" name="id" value={id} />}
      <fieldset disabled={pending} className="space-y-6">
        <legend className="sr-only">Datos de la demanda</legend>
        <Section
          n={1}
          title="Identificación"
          description="Qué subproducto buscás y para qué lo usarías."
        >
          <div className="sm:col-span-2">
            <Field label="Título" htmlFor="title" error={errors.title}>
              <Input
                {...control("title")}
                required
                minLength={3}
                maxLength={120}
                placeholder="Ej.: Cascarilla para cama de pollo"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Categoría" htmlFor="category" error={errors.category}>
              <Select {...control("category")} required>
                <option value="">Elegí un subproducto</option>
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
              label="Descripción · opcional"
              htmlFor="description"
              error={errors.description}
            >
              <Textarea
                {...control("description")}
                maxLength={2000}
                rows={4}
                placeholder="Contá qué necesitás y para qué lo usarías."
              />
            </Field>
          </div>
        </Section>

        <Section
          n={2}
          title="Volumen y precio"
          description="Cuánto necesitás, hasta qué precio y para cuándo."
        >
          <Field
            label="Cantidad buscada (Tn)"
            htmlFor="quantityTons"
            error={errors.quantityTons}
            hint="Mayor que cero; hasta 3 decimales."
          >
            <Input
              {...control("quantityTons")}
              required
              inputMode="decimal"
              placeholder="Ej.: 80 o 80,5"
            />
          </Field>
          <Field
            label="Precio máximo (ARS/Tn) · opcional"
            htmlFor="maxPricePerTon"
            error={errors.maxPricePerTon}
            hint="Las ofertas que lo superen se mostrarán con un aviso."
          >
            <Input
              {...control("maxPricePerTon")}
              inputMode="decimal"
              placeholder="Ej.: 30.000,00"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Necesito para · opcional"
              htmlFor="neededBy"
              error={errors.neededBy}
              hint="Sin fecha, se incluyen todas las ofertas estimadas de la categoría dentro del radio."
            >
              <Input {...control("neededBy")} type="date" min={today} />
            </Field>
          </div>
        </Section>

        <Section
          n={3}
          title="Ubicación"
          description="Desde dónde y hasta qué distancia buscar ofertas."
        >
          <Field
            label="Localidad"
            htmlFor="localityId"
            error={errors.localityId}
          >
            <Select {...control("localityId")} required>
              {localities.map((locality) => (
                <option key={locality.id} value={locality.id}>
                  {locality.name}, {PROVINCE_LABEL[locality.province]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Radio de búsqueda"
            htmlFor="radiusKm"
            error={errors.radiusKm}
            hint="Distancia aproximada desde esta localidad, en línea recta."
          >
            <Select {...control("radiusKm")} required>
              {[50, 100, 200].map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </Select>
          </Field>
        </Section>
      </fieldset>
      <div className="mt-5" aria-live="polite">
        <FormError message={result.ok ? null : result.error} />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <LinkButton href={id ? `/demands/${id}` : "/demands"} variant="ghost">
          Cancelar
        </LinkButton>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : id ? "Guardar cambios" : "Publicar demanda"}
        </Button>
      </div>
    </form>
  );
}

/** Sección del formulario, con el mismo aspecto que los pasos del wizard de ofertas. */
function Section({
  n,
  title,
  description,
  children,
}: {
  n: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-bold text-gray-900">
          {n}. {title}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
    </section>
  );
}
