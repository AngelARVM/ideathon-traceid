/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, Bug, RefreshCw, CheckCircle2, AlertOctagon } from 'lucide-react';
import {
  getSimulateFailure,
  setSimulateFailure,
  getSimulateLatency,
  setSimulateLatency,
  resetMockData,
} from '../services/traceApi';

interface BannerProps {
  onDataReset?: () => void;
}

export const Banner: React.FC<BannerProps> = ({ onDataReset }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [simFailure, setSimFailure] = useState(getSimulateFailure());
  const [simLatency, setSimLatency] = useState(getSimulateLatency());
  const [resetting, setResetting] = useState(false);

  const handleToggleFailure = () => {
    const next = !simFailure;
    setSimFailure(next);
    setSimulateFailure(next);
  };

  const handleToggleLatency = () => {
    const next = !simLatency;
    setSimLatency(next);
    setSimulateLatency(next);
  };

  const handleReset = async () => {
    setResetting(true);
    resetMockData();
    if (onDataReset) onDataReset();
    setTimeout(() => {
      setResetting(false);
      setShowConfig(false);
    }, 400);
  };

  return (
    <aside
      aria-label="Aviso de red Stellar Testnet"
      className="bg-amber-50/90 dark:bg-stone-900 border-b border-amber-200/80 dark:border-amber-950/60 px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Aviso:</span> Datos anclados en Stellar Testnet, un entorno de demostración sujeto a reinicios.
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] ml-auto">
          {simFailure && (
            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">
              <AlertOctagon className="w-3 h-3" />
              Modo fallo activo
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-0.5 rounded hover:bg-stone-200/60 dark:hover:bg-stone-800 transition"
            title="Opciones de simulación blockchain"
          >
            <Bug className="w-3 h-3 text-amber-600 dark:text-amber-500" />
            <span>Simulador</span>
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-200/60 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-stone-800/90 p-2 rounded border border-stone-200 dark:border-stone-700">
            <input
              type="checkbox"
              checked={simFailure}
              onChange={handleToggleFailure}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>
              Simular fallo en escrituras <span className="text-[10px] text-stone-500 block">Falla al anclar en Stellar</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-stone-800/90 p-2 rounded border border-stone-200 dark:border-stone-700">
            <input
              type="checkbox"
              checked={simLatency}
              onChange={handleToggleLatency}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>
              Simular latencia de red (1–3 s) <span className="text-[10px] text-stone-500 block">Tiempo de consenso Testnet</span>
            </span>
          </label>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 p-2 rounded border border-stone-300 dark:border-stone-600 font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Restableciendo...' : 'Restablecer datos demo'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};
