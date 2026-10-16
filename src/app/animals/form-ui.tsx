import { AlertTriangle } from "lucide-react";
import type { ActionState } from "./actions";

/** Clases compartidas por los formularios del operador, mobile-first (docs/03). */
export const field =
  "mt-1.5 h-12 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm text-stone-900 focus:border-campo-500 focus:outline-none focus:ring-2 focus:ring-campo-600/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100";

export const label =
  "block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300";

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
      className={`h-14 w-full rounded-2xl text-base font-bold text-white shadow-lg shadow-campo-950/15 transition disabled:opacity-60 ${tones[tone]}`}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}
