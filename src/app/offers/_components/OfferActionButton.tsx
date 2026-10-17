"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/lib/action-result";

/** Botón de una acción sobre una oferta (retirar, marcar disponible). La confirmación la da un `Dialog`. */
export function OfferActionButton({
  action,
  offerId,
  label,
  pendingLabel,
  variant = "secondary",
  size = "md",
}: {
  action: (id: string) => Promise<ActionResult>;
  offerId: string;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult | null) => action(offerId),
    null,
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <Button type="submit" variant={variant} size={size} disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state && !state.ok && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
