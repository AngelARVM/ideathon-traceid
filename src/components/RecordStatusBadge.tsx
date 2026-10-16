import { CheckCircle2, Clock, Send, XCircle } from "lucide-react";
import type { SubmissionStatus } from "@/generated/prisma/enums";

/**
 * El estado de envío, **siempre visible** (docs/03). Un registro que todavía no está en la
 * cadena no puede parecer uno que sí: en S2 nada está realmente en una cadena, así que la
 * etiqueta dice "simulado" para no mentirle a nadie durante la demo.
 */

const STATES = {
  pending: {
    label: "En cola",
    hint: "Guardado. Esperando que el drainer lo tome.",
    icon: Clock,
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800",
  },
  submitted: {
    label: "Enviado",
    hint: "Enviado y sin respuesta todavía. Puede haber salido.",
    icon: Send,
    className:
      "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800",
  },
  confirmed: {
    label: "Confirmado",
    hint: "Confirmado por el drainer stub. Todavía no hay cadena real: eso llega en S4.",
    icon: CheckCircle2,
    className:
      "bg-campo-50 text-campo-800 border-campo-200 dark:bg-campo-950/60 dark:text-campo-200 dark:border-campo-800",
  },
  failed: {
    label: "Falló",
    hint: "Rechazado. Se puede volver a enviar, pero con una secuencia nueva.",
    icon: XCircle,
    className:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800",
  },
} as const satisfies Record<SubmissionStatus, unknown>;

export function RecordStatusBadge({
  status,
  className = "",
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  const state = STATES[status];
  const Icon = state.icon;

  return (
    <span
      title={state.hint}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${state.className} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {state.label}
    </span>
  );
}

export const statusHint = (status: SubmissionStatus): string =>
  STATES[status].hint;
