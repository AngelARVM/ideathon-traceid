import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="px-4 py-10 sm:py-16 flex justify-center">
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Ingresar</h1>
        <p className="mt-1 mb-6 text-sm text-stone-600 dark:text-stone-400">
          Registro operativo de ganado bovino.
        </p>

        <Suspense fallback={<div className="h-56" />}>
          <RedirectIfSignedIn />
          <LoginForm />
        </Suspense>

        {process.env.NODE_ENV !== "production" && (
          <p className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
            Demo local: <code className="font-mono">owner@demo.local</code>,{" "}
            <code className="font-mono">vet@demo.local</code> u{" "}
            <code className="font-mono">operator@demo.local</code>, contraseña{" "}
            <code className="font-mono">demo1234</code>.
          </p>
        )}
      </div>
    </div>
  );
}

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/animals");
  return null;
}
