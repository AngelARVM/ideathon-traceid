import { AlertTriangle } from "lucide-react";
import type { ActionState } from "./actions";

/** Clases compartidas por los formularios del operador, mobile-first (docs/03). */
export const field =
  "mt-1 w-full h-11 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm";

export const label = "block text-sm font-semibold";

/** El aviso que acompaña a todo campo de texto libre (docs/05). */
export const personalDataHint = "No ingrese datos personales.";

export function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-3 py-2.5 text-sm text-red-800 dark:text-red-200"
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      {state.error}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
  tone = "primary",
}: {
  pending: boolean;
  children: React.ReactNode;
  tone?: "primary" | "danger";
}) {
  const tones = {
    primary: "bg-campo-600 hover:bg-campo-700",
    danger: "bg-red-700 hover:bg-red-800",
  } as const;

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full h-12 rounded-xl text-white font-semibold disabled:opacity-60 ${tones[tone]}`}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}
