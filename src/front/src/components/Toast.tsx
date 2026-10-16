/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ShieldCheck } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastListener = (toast: ToastItem) => void;
const listeners: Set<ToastListener> = new Set();

export function showToast(
  message: string,
  type: ToastType = 'success',
  duration = 4000
): void {
  const item: ToastItem = {
    id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    message,
    type,
    duration,
  };
  listeners.forEach((fn) => fn(item));
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: ToastItem) => {
      setToasts((prev) => [...prev.slice(-3), toast]); // Máximo 4 toasts simultáneos

      // Auto dismiss
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-16 left-0 right-0 z-50 pointer-events-none p-3 flex flex-col items-center gap-2 max-w-md mx-auto"
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              isSuccess
                ? 'bg-emerald-900/95 text-white border-emerald-700 shadow-emerald-950/20 dark:bg-emerald-950/95 dark:border-emerald-600'
                : isError
                ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/20 dark:bg-rose-950/95 dark:border-rose-600'
                : 'bg-stone-900/95 text-white border-stone-700 shadow-stone-950/20 dark:bg-stone-800/95 dark:border-stone-600'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-1.5 rounded-xl shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-800 text-emerald-200'
                    : isError
                    ? 'bg-rose-800 text-rose-200'
                    : 'bg-stone-800 text-stone-200'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                ) : isError ? (
                  <AlertTriangle className="w-5 h-5 text-rose-300" />
                ) : (
                  <Info className="w-5 h-5 text-stone-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold tracking-tight break-words">
                  {t.message}
                </p>
                {isSuccess && (
                  <p className="text-[11px] text-emerald-200/80 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span>Transacción validada por consenso Soroban</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Cerrar notificación"
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 shrink-0 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
