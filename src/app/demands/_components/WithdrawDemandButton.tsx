"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import type { ActionResult } from "@/lib/action-result";
import { withdrawDemand } from "@/lib/demands/actions";

export function WithdrawDemandButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [result, action, pending] = useActionState<ActionResult, FormData>(
    withdrawDemand,
    { ok: true },
  );
  if (!confirming)
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Retirar
      </Button>
    );
  return (
    <form
      action={action}
      className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30"
    >
      <input type="hidden" name="id" value={id} />
      <p className="mb-2 text-sm text-red-800 dark:text-red-200">
        ¿Retirar esta demanda? Dejará de aparecer en el listado público y no
        podrás editarla.
      </p>
      <div className="flex gap-2">
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Retirando…" : "Confirmar retiro"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Cancelar
        </Button>
      </div>
      <FormError message={result.ok ? null : result.error} />
    </form>
  );
}
