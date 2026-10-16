"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  History,
  Info,
  Layers,
  Lock,
  QrCode,
  RefreshCw,
  Share2,
  Sliders,
  Unlock,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { CopyableHash } from "@/components/CopyableHash";
import { getRecordTypeMeta } from "@/components/StatusBadge";
import { getPublicHistory } from "@/lib/traceApi";
import type { PublicHistoryResult, VerificationState } from "@/lib/types";

interface PublicHistoryViewProps {
  animalId: string;
}

export const PublicHistoryView: React.FC<PublicHistoryViewProps> = ({
  animalId,
}) => {
  const router = useRouter();
  const [data, setData] = useState<PublicHistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Selector de demo para presentación: 'normal' | 'falla' | 'offline'
  // Lee de la URL query ?estado=falla o ?estado=offline si existe
  const [demoStateOverride, setDemoStateOverride] = useState<
    "normal" | "falla" | "offline"
  >(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      if (search.includes("estado=falla") || hash.includes("estado=falla"))
        return "falla";
      if (search.includes("estado=offline") || hash.includes("estado=offline"))
        return "offline";
    }
    return "normal";
  });

  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Exclusivo: SOLO getPublicHistory
      const result = await getPublicHistory(animalId);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [animalId]);

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  // Cálculo del estado efectivo de verificación (con soporte para selector demo)
  const effectiveVerificationState: VerificationState | "offline" =
    useMemo(() => {
      if (demoStateOverride === "falla") return "falla_integridad";
      if (demoStateOverride === "offline") return "no_verificable";
      if (!data) return "no_verificable";
      return data.animal.chainIntegrity;
    }, [demoStateOverride, data]);

  // Encontrar el primer registro que falla si hay falla de integridad
  const firstFailingSeq = useMemo(() => {
    if (!data) return 0;
    const failing = data.records.find(
      (r) => r.verificationState === "falla_integridad",
    );
    return failing ? failing.seq : 2;
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#2F6B3A]/30 border-t-[#2F6B3A] rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Consultando registros directamente en Stellar Testnet…
        </p>
        <p className="text-xs text-stone-400 mt-1">
          Auditando hashes y secuencia de ledgers
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center mb-4 border border-amber-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Animal no encontrado en la red pública
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
          No se encontró un registro público para el identificador{" "}
          <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
            {animalId}
          </code>
          .
        </p>
        <button
          type="button"
          onClick={() => router.push("/animals")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </button>
      </div>
    );
  }

  const { animal, records, contractId } = data;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-24">
      {/* Navegación y controles de cabecera */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={() => router.push("/animals")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Rodeo</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Selector demo interactivo para presentaciones (?estado=falla o ?estado=offline) */}
          <button
            type="button"
            onClick={() => setShowDemoSelector(!showDemoSelector)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
            title="Selector de estado para demostración"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Simulador demo:</span>
            <span className="font-bold uppercase text-[#2F6B3A] dark:text-emerald-400">
              {demoStateOverride}
            </span>
          </button>

          <button
            type="button"
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 px-3 py-1.5 rounded-xl transition shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Copiado" : "Compartir"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 px-3 py-1.5 rounded-xl transition shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-[#2F6B3A] dark:text-emerald-400" />
            <span className="hidden xs:inline">QR</span>
          </button>
        </div>
      </div>

      {/* Barra desplegable para alternar demo ?estado=falla o ?estado=offline */}
      {showDemoSelector && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-stone-900 border border-amber-300 dark:border-stone-700 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-semibold">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Seleccionar estado para demostración del comprador:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDemoStateOverride("normal")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                demoStateOverride === "normal"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              }`}
            >
              ✅ Verificado
            </button>
            <button
              type="button"
              onClick={() => setDemoStateOverride("falla")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                demoStateOverride === "falla"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              }`}
            >
              ⚠️ Falla integridad
            </button>
            <button
              type="button"
              onClick={() => setDemoStateOverride("offline")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                demoStateOverride === "offline"
                  ? "bg-stone-800 text-white shadow-xs"
                  : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              }`}
            >
              ⛔ No se pudo verificar
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CABECERA PÚBLICA SEGÚN ESPECIFICACIÓN:
          - Identificador oficial (y anteriores)
          - Especie ("Bovino")
          - Estado de la cadena
          - Cantidad de registros
          - Red "Stellar Testnet"
          - Contract ID truncado con botón copiar
         ========================================================================= */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Historial Público de Trazabilidad
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-semibold">
                Red: Stellar Testnet
              </span>
            </div>

            {/* Identificador oficial en fuente monoespaciada con copiar */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono-num text-stone-950 dark:text-white tracking-tight">
                {animal.officialId}
              </h1>
              <CopyableHash
                value={animal.officialId}
                truncateLength={20}
                className="bg-transparent border-none p-0"
                monoClass="hidden"
              />
            </div>

            {/* Caravanas anteriores (si hay) */}
            {animal.previousOfficialIds &&
              animal.previousOfficialIds.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">
                    Caravanas anteriores:
                  </span>
                  <span className="font-mono-num font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60">
                    {animal.previousOfficialIds.join(", ")}
                  </span>
                </div>
              )}

            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {animal.establishment} · Especie:{" "}
              <strong className="text-stone-800 dark:text-stone-200 uppercase">
                Bovino
              </strong>
              {animal.category ? ` · ${animal.category}` : ""}
              {animal.breed ? ` (${animal.breed})` : ""}
            </p>
          </div>

          {/* Estado de la cadena y cantidad de registros */}
          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2">
            {animal.status === "abierta" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Unlock className="w-3.5 h-3.5" />
                Cadena Abierta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                <Lock className="w-3.5 h-3.5" />
                Cadena Cerrada
              </span>
            )}
            <span className="font-mono-num text-xs text-stone-500 font-medium">
              {animal.recordCount} registro{animal.recordCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Contract ID de Soroban truncado con botón copiar */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-semibold text-[10px] uppercase">
              Contrato Soroban:
            </span>
            <CopyableHash
              value={contractId}
              truncateLength={12}
              monoClass="text-[11px] font-mono text-stone-700 dark:text-stone-300"
            />
          </div>

          <div className="text-[11px] text-stone-500">
            Algoritmo de enlace:{" "}
            <span className="font-mono font-semibold">SHA-256 (64 hex)</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RESUMEN DE VERIFICACIÓN GRANDE (Exactamente uno de tres estados):
          1. ✅ "Verificado"
          2. ⚠️ "Falla de integridad"
          3. ⛔ "No se pudo verificar"
         ========================================================================= */}
      <div className="mb-6">
        {effectiveVerificationState === "verificado" && (
          <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-800 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                    Auditoría Criptográfica
                  </span>
                  <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    100% Coincidencia
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-950 dark:text-emerald-100">
                  Verificado
                </h2>
                <p className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                  Leímos los {animal.recordCount} registros directamente desde
                  Stellar, recalculamos cada hash y la cadena está completa y en
                  orden.
                </p>
              </div>
            </div>
          </div>
        )}

        {effectiveVerificationState === "falla_integridad" && (
          <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-950/20">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-rose-800 dark:text-rose-200 bg-rose-200 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                    Discrepancia en Ledger
                  </span>
                  <span className="text-xs font-mono text-rose-700 dark:text-rose-300 font-semibold">
                    Atención Comprador
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-rose-950 dark:text-rose-100">
                  Falla de integridad
                </h2>
                <p className="text-sm text-rose-900 dark:text-rose-200 leading-relaxed font-semibold">
                  El registro #{firstFailingSeq} no coincide con su hash o con
                  el registro anterior. Este historial no es confiable.
                </p>
              </div>
            </div>
          </div>
        )}

        {effectiveVerificationState === "no_verificable" && (
          <div className="p-6 rounded-3xl bg-amber-50 dark:bg-stone-900 border-2 border-amber-300 dark:border-stone-700 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-950/20">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                      Horizon No Disponible
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                    No se pudo verificar
                  </h2>
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    No pudimos conectarnos con Stellar en este momento. No
                    mostramos datos como verificados.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchHistory}
                className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-black font-semibold text-xs flex items-center gap-2 shrink-0 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar verificación</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          PANEL "QUÉ GARANTIZA ESTE HISTORIAL" (SIEMPRE VISIBLE, NO COLAPSADO)
         ========================================================================= */}
      <div className="mb-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
          <span>Qué garantiza este historial</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-950 dark:text-emerald-200 font-semibold block">
                Integridad:
              </strong>
              <span className="text-emerald-900 dark:text-emerald-300">
                El contenido no fue alterado desde que se registró.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-950 dark:text-emerald-200 font-semibold block">
                Orden:
              </strong>
              <span className="text-emerald-900 dark:text-emerald-300">
                Los registros están en el orden en que se incorporaron, sin
                inserciones.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60">
            <XCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-700 dark:text-stone-300 font-semibold block">
                Autoría:
              </strong>
              <span className="text-stone-500 dark:text-stone-400">
                Todos los registros los firma la plataforma TraceID; el autor
                indicado es declarado por la plataforma, no verificado en la
                red.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60">
            <XCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-700 dark:text-stone-300 font-semibold block">
                Veracidad:
              </strong>
              <span className="text-stone-500 dark:text-stone-400">
                Nadie verifica que el hecho declarado haya ocurrido en la
                realidad.
              </span>
            </div>
          </div>
        </div>

        {/* NOTA AL PIE OBLIGATORIA */}
        <p className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
          <strong>Nota al pie:</strong> TraceID no es una certificación
          sanitaria ni reemplaza los sistemas oficiales de SENASA.
        </p>
      </div>

      {/* =========================================================================
          LÍNEA DE TIEMPO POR SEQ
          - Si estado es "no_verificable" (offline), se muestra ATENUADA con etiqueta "sin verificar"
          - Tipo con ícono
          - "Fecha del hecho" y "Registrado el" (ambas visibles; si difieren > 24 h, "cargado con posterioridad")
          - Contenido público legible
          - Badge de verificación por registro
          - Marcas de rectificación ("Rectifica #N" o "Rectificado por #N")
          - Enlace "Ver evidencia"
         ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
            <span>Secuencia Criptográfica de Registros</span>
          </h2>

          {effectiveVerificationState === "no_verificable" && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700">
              Sin verificar en vivo
            </span>
          )}
        </div>

        <div
          className={`space-y-3 relative pl-6 sm:pl-8 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800 ${
            effectiveVerificationState === "no_verificable"
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
        >
          {records.map((rec) => {
            const meta = getRecordTypeMeta(rec.type);
            const Icon = meta.icon;

            // Calcular diferencia entre fecha del hecho y fecha de registro
            const eventTime = new Date(rec.occurredAt).getTime();
            const recordTime = new Date(rec.recordedAt).getTime();
            const diffHours =
              Math.abs(recordTime - eventTime) / (1000 * 60 * 60);
            const isLoadedLater = diffHours >= 24;

            return (
              <div
                key={rec.seq}
                className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs hover:border-[#2F6B3A]/40 transition"
              >
                {/* Indicador de secuencia */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                    rec.verificationState === "verificado"
                      ? "bg-emerald-600 border-white dark:border-stone-900 text-white"
                      : rec.verificationState === "no_verificable"
                        ? "bg-amber-500 border-white dark:border-stone-900 text-white"
                        : "bg-rose-600 border-white dark:border-stone-900 text-white"
                  }`}
                >
                  {rec.seq}
                </div>

                {/* Encabezado del bloque */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${meta.colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {meta.label}
                        </h3>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          Seq #{rec.seq}
                        </span>

                        {rec.terminal && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-800 text-white">
                            Cierre Terminal
                          </span>
                        )}

                        {/* Marcas de rectificación */}
                        {typeof rec.rectifies === "number" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-200 flex items-center gap-1">
                            <History className="w-3 h-3 text-orange-600" />
                            Rectifica #{rec.rectifies}
                          </span>
                        )}

                        {typeof rec.rectifiedBy === "number" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <History className="w-3 h-3 text-amber-600" />
                            Rectificado por #{rec.rectifiedBy}
                          </span>
                        )}
                      </div>

                      {/* Fechas: "Fecha del hecho" y "Registrado el" (ambas visibles) */}
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>
                            <strong>Fecha del hecho:</strong>{" "}
                            {new Date(rec.occurredAt).toLocaleDateString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          <span>·</span>
                          <span>
                            <strong>Registrado el:</strong>{" "}
                            {new Date(rec.recordedAt).toLocaleDateString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>

                          {/* Aclaración si difieren mucho */}
                          {isLoadedLater && (
                            <span className="font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[10px] border border-amber-300 dark:border-amber-800">
                              cargado con posterioridad
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge de verificación por registro y enlace "Ver evidencia" */}
                  <div className="flex items-center gap-2">
                    {rec.verificationState === "verificado" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verificado
                      </span>
                    )}

                    {rec.verificationState === "falla_integridad" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Discrepancia
                      </span>
                    )}

                    {rec.verificationState === "no_verificable" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pendiente
                      </span>
                    )}

                    {/* ENLACE "Ver evidencia" */}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/a/${animal.id}/records/${rec.seq}`)
                      }
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#2F6B3A] dark:text-emerald-400 hover:underline px-2.5 py-1 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40"
                    >
                      <span>Ver evidencia</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contenido público legible */}
                <div className="py-2.5 text-xs text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                  {rec.summaryText}
                </div>

                {/* Hashes criptográficos */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono uppercase text-stone-400">
                      Content Hash:
                    </span>
                    <CopyableHash
                      value={rec.contentHash}
                      truncateLength={12}
                      monoClass="text-[10px] text-stone-700 dark:text-stone-300 font-mono"
                    />
                  </div>

                  {rec.ledger && (
                    <span className="font-mono text-stone-400">
                      Ledger Testnet #{rec.ledger}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL SIMULADOR QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-sm w-full rounded-3xl p-6 text-center border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#2F6B3A] dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              Código QR de Trazabilidad
            </h3>
            <p className="text-xs text-stone-500 mb-4 font-mono-num font-semibold">
              Caravana {animal.officialId}
            </p>
            <p className="text-xs text-stone-400 mb-4">
              Escaneable para verificar la integridad inmutable en Stellar
              Testnet.
            </p>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
