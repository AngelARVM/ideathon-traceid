"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { type SignInState, signIn } from "@/lib/auth-actions";

const inputClass =
  "w-full h-12 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-base focus:outline-none focus:ring-2 focus:ring-campo-600";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, action, pending] = useActionState<SignInState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <p
          role="alert"
          className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300"
        >
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300"
        >
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            defaultValue={state.email}
            className={inputClass}
          />
          <Mail
            className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-stone-400"
            aria-hidden
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
          <KeyRound
            className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-stone-400"
            aria-hidden
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-campo-600 font-semibold text-white shadow-md shadow-campo-950/15 transition hover:bg-campo-700 disabled:opacity-60"
      >
        {pending ? (
          "Ingresando…"
        ) : (
          <>
            <span>Ingresar al sistema</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}

import { ArrowRight, KeyRound, Mail } from "lucide-react";
