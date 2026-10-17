"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { ActionResult } from "@/lib/action-result";
import { withdrawDemand } from "@/lib/demands/actions";

/** Retirar una demanda, con confirmación en `Dialog`. */
export function WithdrawDemandButton({ id }: { id: string }) {
  const [result, action, pending] = useActionState<ActionResult, FormData>(
    withdrawDemand,
    { ok: true },
  );
  return (
    <Dialog
      trigger="Retirar"
      triggerVariant="danger"
      title="¿Retirar esta demanda?"
      description={
        <>
          Deja de aparecer en el listado público y no se puede editar.
          {!result.ok && (
            <span role="alert" className="mt-2 block font-medium text-red-600">
              {result.error}
            </span>
          )}
        </>
      }
    >
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Retirando…" : "Retirar demanda"}
        </Button>
      </form>
    </Dialog>
  );
}
