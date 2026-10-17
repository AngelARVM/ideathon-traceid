"use client";

import { ArrowRight, Factory, ShoppingBasket } from "lucide-react";
import { useFormStatus } from "react-dom";
import type { DemoPersona } from "@/app/_home/queries";
import { PROVINCE_LABEL } from "@/lib/labels";

export function PersonaButton({ persona }: { persona: DemoPersona }) {
  const { pending } = useFormStatus();
  const Icon = persona.role === "seller" ? Factory : ShoppingBasket;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Entrar como ${persona.name}`}
      className="group flex min-h-32 w-full items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-campo-500 hover:bg-campo-50 disabled:cursor-wait disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-campo-500 dark:hover:bg-campo-950"
    >
      <Icon
        className="mt-1 h-5 w-5 shrink-0 text-campo-700 dark:text-campo-300"
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-stone-950 dark:text-stone-50">
          {persona.name}
        </span>
        {persona.tagline && (
          <span className="mt-1 block text-sm text-stone-600 dark:text-stone-300">
            {persona.tagline}
          </span>
        )}
        <span className="mt-2 block text-xs text-stone-600 dark:text-stone-400">
          {persona.locality.name}, {PROVINCE_LABEL[persona.locality.province]}
        </span>
        {pending && (
          <output className="mt-2 block text-sm font-semibold text-campo-700 dark:text-campo-300">
            Entrando…
          </output>
        )}
      </span>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-campo-700 dark:text-campo-300"
        aria-hidden
      />
    </button>
  );
}
