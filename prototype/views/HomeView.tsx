"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, Layers, QrCode, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useAuth } from "@/components/AppShell";

export const HomeView: React.FC = () => {
  const router = useRouter();
  const { authenticated: isAuthenticated } = useAuth();
  // Animal de ejemplo con historial completo y verificación confirmada
  const exampleAnimalId = "01JH8V9B7C1D2E3F4G5H6J7K8M";

  const handleIngresar = () => {
    if (isAuthenticated) {
      router.push("/animals");
    } else {
      router.push("/login");
    }
  };

  const handleVerEjemplo = () => {
    router.push(`/a/${exampleAnimalId}`);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-between max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      {/* Sección Principal Hero */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Logo TraceID */}
        <div className="relative mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#2F6B3A] text-white flex items-center justify-center shadow-xl shadow-emerald-950/20 ring-4 ring-emerald-600/20">
            <svg
              viewBox="0 0 24 24"
              className="w-12 h-12 sm:w-14 sm:h-14 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            >
              {/* Isotipo esquemático bovino con nodo de red */}
              <path d="M5 4l3 5h8l3-5" />
              <path d="M7 9v4c0 3 2 5 5 5s5-2 5-5V9" />
              <circle
                cx="12"
                cy="13"
                r="1.5"
                className="fill-amber-400 stroke-none"
              />
              <path d="M12 18v3" />
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black tracking-wider uppercase shadow">
            NEA
          </div>
        </div>

        {/* Nombre y Marca */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 mb-3">
          Trace<span className="text-[#2F6B3A] dark:text-emerald-400">ID</span>
        </h1>

        {/* Línea de descripción solicitada */}
        <p className="text-base sm:text-lg md:text-xl font-medium text-stone-700 dark:text-stone-300 max-w-xl mb-8 leading-relaxed">
          Historial verificable de cada animal, anclado en Stellar
        </p>

        {/* Dos botones principales requeridos */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md mb-12">
          <button
            type="button"
            onClick={handleIngresar}
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#2F6B3A] hover:bg-[#26562f] text-white text-sm sm:text-base font-bold shadow-md shadow-emerald-900/20 transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#2F6B3A] focus:ring-offset-2 dark:focus:ring-offset-stone-900 cursor-pointer"
          >
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleVerEjemplo}
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 text-sm sm:text-base font-semibold transition active:scale-[0.98] cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Ver un historial de ejemplo</span>
          </button>
        </div>

        {/* Tarjetas informativas técnicas con diseño sobrio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-[#2F6B3A] dark:text-emerald-300 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200 mb-1">
              Inmutabilidad Criptográfica
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-normal">
              Cada pesaje, vacuna o traslado genera un hash SHA-256 encadenado y
              anclado en la red Stellar.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-3">
              <QrCode className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200 mb-1">
              Auditoría Pública por QR
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-normal">
              Compradores y frigoríficos verifican la cadena completa en vivo
              sin necesidad de crear cuenta ni instalar apps.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200 mb-1">
              Diseñado para el Campo
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-normal">
              Interfaz mobile-first optimizada para uso a una mano en corrales y
              mangas del nordeste argentino.
            </p>
          </div>
        </div>
      </div>

      {/* Pie técnico informativo */}
      <div className="pt-8 border-t border-stone-200 dark:border-stone-800/80 text-center text-xs text-stone-500 dark:text-stone-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-mono text-[11px]">
          Red Stellar Testnet · Soroban Smart Contract
        </span>
        <button
          type="button"
          onClick={() => router.push("/animals")}
          className="text-stone-600 dark:text-stone-300 hover:text-[#2F6B3A] dark:hover:text-emerald-400 underline underline-offset-4"
        >
          Acceso directo de campo (Demo)
        </button>
      </div>
    </div>
  );
};
