"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import { parsePrice, parseTons } from "@/lib/decimal";
import { formatArs, formatTons } from "@/lib/format";
import { createProposal } from "@/lib/negotiation/actions";
import { totalAmount } from "@/lib/negotiation/terms";

export function ProposalForm({
  offerId,
  stockTons,
  referencePrice,
  initialQuantity,
}: {
  offerId: string;
  stockTons: string;
  referencePrice: string | null;
  /** Cantidad que trae `?quantity=` desde la calculadora, ya validada. */
  initialQuantity?: string;
}) {
  const [state, action, pending] = useActionState(
    createProposal.bind(null, offerId),
    null,
  );
  const [quantity, setQuantity] = useState(
    initialQuantity?.replace(".", ",") ?? "",
  );
  const [price, setPrice] = useState(referencePrice ?? "");
  const [message, setMessage] = useState("");

  // Total solo visual: el servidor vuelve a validar y calcular.
  const q = parseTons(quantity);
  const p = parsePrice(price);
  const total = q.ok && p.ok ? totalAmount(q.value, p.value) : null;
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-card sm:p-6"
    >
      {state?.ok === false && (
        <div className="flex flex-col gap-2">
          <FormError message={state.error} />
          {state.existingProposalId && (
            <Link
              href={`/proposals/${state.existingProposalId}`}
              className="text-sm font-semibold text-brand-600 underline"
            >
              Ver la propuesta abierta
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Cantidad (Tn)"
          htmlFor="quantityTons"
          hint={`Disponible: ${formatTons(stockTons)}`}
          error={errors?.quantityTons}
        >
          <Input
            id="quantityTons"
            name="quantityTons"
            inputMode="decimal"
            autoComplete="off"
            placeholder="80"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-invalid={errors?.quantityTons ? true : undefined}
          />
        </Field>
        <Field
          label="Precio por Tn (ARS)"
          htmlFor="pricePerTon"
          hint={
            referencePrice
              ? "Precargado con el precio de referencia"
              : "La oferta no tiene precio de referencia"
          }
          error={errors?.pricePerTon}
        >
          <Input
            id="pricePerTon"
            name="pricePerTon"
            inputMode="decimal"
            autoComplete="off"
            placeholder="26000"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={errors?.pricePerTon ? true : undefined}
          />
        </Field>
      </div>

      <Field
        label="Mensaje para el vendedor (opcional)"
        htmlFor="message"
        error={errors?.message}
      >
        <Textarea
          id="message"
          name="message"
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Contá para qué lo necesitás, cuándo retirás, etc."
        />
      </Field>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-300 bg-brand-50 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-500">
            Subtotal de la propuesta
          </p>
          <p className="text-xs text-gray-500">
            Tn × precio propuesto · sin flete
          </p>
        </div>
        <span className="font-mono-num text-xl font-black text-brand-600">
          {total ? formatArs(total) : "—"}
        </span>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar propuesta"}
        </Button>
      </div>
    </form>
  );
}
