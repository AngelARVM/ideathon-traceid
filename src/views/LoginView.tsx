"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/components/AppShell";
import { login } from "@/lib/traceApi";

export const LoginView: React.FC = () => {
  const router = useRouter();
  const { refreshAuth: onLoginSuccess } = useAuth();
  const [password, setPassword] = useState("campo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(password);
      onLoginSuccess();
      router.push("/animals");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al ingresar.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setPassword("campo2025");
    setError(null);
    setLoading(true);
    try {
      await login("campo2025");
      onLoginSuccess();
      router.push("/animals");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-200 dark:border-stone-800 p-6 sm:p-8">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2F6B3A]/10 dark:bg-emerald-950/60 text-[#2F6B3A] dark:text-emerald-400 mb-2 border border-[#2F6B3A]/20">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Ingreso a TraceID
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Registro operativo de ganado bovino para establecimientos del NEA
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5"
            >
              Clave de Establecimiento / Operador
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese clave de demo"
                className="w-full px-4 py-3 pl-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A] text-sm"
                autoComplete="current-password"
                autoFocus
              />
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              Clave demo sugerida:{" "}
              <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">
                campo
              </code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#2F6B3A] hover:bg-[#26562f] text-white font-semibold shadow-md shadow-emerald-900/10 transition disabled:opacity-50 text-sm"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </span>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-stone-900 px-2 text-stone-400">
                o acceso rápido
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-[#2F6B3A] dark:hover:border-emerald-500 text-stone-700 dark:text-stone-300 hover:text-[#2F6B3A] dark:hover:text-emerald-400 font-medium text-xs flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ingresar directo con credenciales demo</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800/80 space-y-2 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Los registros se anclan criptográficamente en Stellar Testnet.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <span>
              La vista pública no requiere clave ni cuenta (
              <code className="font-mono">/a/:id</code>).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
