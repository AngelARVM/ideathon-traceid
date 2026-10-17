"use client";

import { Ban, Check, Lock, Repeat2, X } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormError } from "@/components/ui/FormError";
import { parseTons } from "@/lib/decimal";
import { formatTons } from "@/lib/format";
import {
  acceptProposal,
  confirmProposal,
  counterProposal,
  rejectCounter,
  rejectProposal,
} from "@/lib/negotiation/actions";
import { exceeds } from "@/lib/negotiation/terms";

const card =
  "flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900";

// ── Vendedor ─────────────────────────────────────────────────────────────────

export function SellerActions({
  proposalId,
  canAccept,
  canCounter,
  original,
  stockTons,
}: {
  proposalId: string;
  canAccept: boolean;
  canCounter: boolean;
  original: { quantityTons: string; pricePerTon: string };
  stockTons: string;
}) {
  const [acceptState, accept, accepting] = useActionState(
    acceptProposal.bind(null, proposalId),
    null,
  );
  const [rejectState, reject, rejecting] = useActionState(
    rejectProposal.bind(null, proposalId),
    null,
  );
  const [counterOpen, setCounterOpen] = useState(false);
  const busy = accepting || rejecting;
  const error =
    (acceptState?.ok === false && acceptState.error) ||
    (rejectState?.ok === false && rejectState.error) ||
    null;

  return (
    <div className={card}>
      <h2 className="font-semibold">Tu respuesta</h2>
      <FormError message={error} />
      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <form action={accept}>
            <Button type="submit" disabled={busy}>
              <Check className="h-4 w-4" aria-hidden />
              {accepting ? "Aceptando…" : "Aceptar"}
            </Button>
          </form>
        )}
        {canCounter && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setCounterOpen((v) => !v)}
            aria-expanded={counterOpen}
          >
            <Repeat2 className="h-4 w-4" aria-hidden />
            Contraofertar
          </Button>
        )}
        <form action={reject}>
          <Button type="submit" variant="ghost" disabled={busy}>
            <X className="h-4 w-4" aria-hidden />
            {rejecting ? "Rechazando…" : "Rechazar"}
          </Button>
        </form>
      </div>
      {counterOpen && (
        <CounterForm
          proposalId={proposalId}
          original={original}
          stockTons={stockTons}
        />
      )}
    </div>
  );
}

function CounterForm({
  proposalId,
  original,
  stockTons,
}: {
  proposalId: string;
  original: { quantityTons: string; pricePerTon: string };
  stockTons: string;
}) {
  const [state, action, pending] = useActionState(
    counterProposal.bind(null, proposalId),
    null,
  );
  const [quantity, setQuantity] = useState(original.quantityTons);
  const [price, setPrice] = useState(original.pricePerTon);
  const [message, setMessage] = useState("");
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const parsed = parseTons(quantity);
  const overStock = parsed.ok && exceeds(parsed.value, stockTons);

  return (
    <form
      action={action}
      className="flex flex-col gap-4 border-t border-stone-100 pt-4 dark:border-stone-800"
    >
      <p className="text-sm text-stone-600 dark:text-stone-400">
        Una sola contraoferta: el comprador solo podrá aceptarla o rechazarla.
      </p>
      {state?.ok === false && <FormError message={state.error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Cantidad (Tn)"
          htmlFor="counterQuantityTons"
          hint={
            overStock
              ? `Supera el stock actual (${formatTons(stockTons)})`
              : `Stock actual: ${formatTons(stockTons)}`
          }
          error={errors?.counterQuantityTons}
        >
          <Input
            id="counterQuantityTons"
            name="counterQuantityTons"
            inputMode="decimal"
            autoComplete="off"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-invalid={errors?.counterQuantityTons ? true : undefined}
          />
        </Field>
        <Field
          label="Precio por Tn (ARS)"
          htmlFor="counterPricePerTon"
          error={errors?.counterPricePerTon}
        >
          <Input
            id="counterPricePerTon"
            name="counterPricePerTon"
            inputMode="decimal"
            autoComplete="off"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={errors?.counterPricePerTon ? true : undefined}
          />
        </Field>
      </div>
      <Field
        label="Mensaje (opcional)"
        htmlFor="counterMessage"
        error={errors?.counterMessage}
      >
        <Textarea
          id="counterMessage"
          name="counterMessage"
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar contraoferta"}
        </Button>
      </div>
    </form>
  );
}

// ── Comprador ────────────────────────────────────────────────────────────────

export function BuyerActions({
  proposalId,
  countered,
  blockReason,
}: {
  proposalId: string;
  countered: boolean;
  blockReason: string | null;
}) {
  const [confirmState, confirm, confirming] = useActionState(
    confirmProposal.bind(null, proposalId),
    null,
  );
  const [rejectState, reject, rejecting] = useActionState(
    rejectCounter.bind(null, proposalId),
    null,
  );
  const [comment, setComment] = useState("");
  const busy = confirming || rejecting;
  const error =
    (confirmState?.ok === false && confirmState.error) ||
    (rejectState?.ok === false && rejectState.error) ||
    null;
  const commentError =
    confirmState?.ok === false
      ? confirmState.fieldErrors?.closingComment
      : undefined;

  return (
    <div className={card}>
      <h2 className="font-semibold">
        {countered ? "Responder la contraoferta" : "Confirmar el acuerdo"}
      </h2>
      <FormError message={error} />
      <form action={confirm} className="flex flex-col gap-4">
        <Field
          label="Comentario de cierre (opcional)"
          htmlFor="closingComment"
          hint="Queda en el comprobante. Ej.: cómo y cuándo retirás."
          error={commentError}
        >
          <Textarea
            id="closingComment"
            name="closingComment"
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={blockReason !== null}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || blockReason !== null}>
            {blockReason ? (
              <Lock className="h-4 w-4" aria-hidden />
            ) : (
              <Check className="h-4 w-4" aria-hidden />
            )}
            {confirming
              ? "Confirmando…"
              : countered
                ? "Aceptar contraoferta y confirmar"
                : "Confirmar acuerdo"}
          </Button>
          {blockReason && (
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {blockReason}
            </p>
          )}
        </div>
      </form>
      {countered && (
        <form
          action={reject}
          className="border-t border-stone-100 pt-4 dark:border-stone-800"
        >
          <Button type="submit" variant="ghost" disabled={busy}>
            <Ban className="h-4 w-4" aria-hidden />
            {rejecting ? "Rechazando…" : "Rechazar contraoferta"}
          </Button>
        </form>
      )}
    </div>
  );
}
