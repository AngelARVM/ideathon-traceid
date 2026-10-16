import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100dvh-9rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/50 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none sm:p-8">
        <div className="mb-6 space-y-2 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-campo-200 bg-campo-50 text-campo-700 dark:border-campo-800 dark:bg-campo-950 dark:text-campo-300">
            <Shield className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Ingreso a TraceID
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Registro operativo de ganado bovino para establecimientos del NEA
          </p>
        </div>

        <Suspense fallback={<div className="h-56" />}>
          <RedirectIfSignedIn />
          <LoginForm />
        </Suspense>

        {process.env.NODE_ENV !== "production" && (
          <p className="mt-6 border-t border-stone-100 pt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
            Demo local: <code className="font-mono">owner@demo.local</code>,{" "}
            <code className="font-mono">vet@demo.local</code> u{" "}
            <code className="font-mono">operator@demo.local</code>, contraseña{" "}
            <code className="font-mono">demo1234</code>.
          </p>
        )}
        <div className="mt-5 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          <p className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-campo-600 dark:text-campo-300"
              aria-hidden
            />{" "}
            Cada registro muestra su estado de procesamiento.
          </p>
          <p className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> El acceso
            operativo requiere una cuenta de la organización.
          </p>
        </div>
      </div>
    </div>
  );
}

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/animals");
  return null;
}

import { CheckCircle2, Lock, Shield } from "lucide-react";
