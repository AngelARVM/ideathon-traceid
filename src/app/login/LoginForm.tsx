"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { type SignInState, signIn } from "@/lib/auth-actions";

const inputClass =
  "w-full h-12 px-4 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-base focus:outline-none focus:ring-2 focus:ring-campo-600";

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
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email
        </label>
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
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-xl bg-campo-600 hover:bg-campo-700 text-white font-semibold disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
