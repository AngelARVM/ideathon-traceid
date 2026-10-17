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
      className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-card transition hover:border-brand-300 hover:shadow-card-hover disabled:cursor-wait disabled:opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-gray-900 group-hover:text-brand-600">
          {persona.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-gray-500">
          {persona.tagline && `${persona.tagline} · `}
          {persona.locality.name}, {PROVINCE_LABEL[persona.locality.province]}
        </span>
        {pending && (
          <output className="mt-1 block text-xs font-semibold text-brand-600">
            Entrando…
          </output>
        )}
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
        aria-hidden
      />
    </button>
  );
}
