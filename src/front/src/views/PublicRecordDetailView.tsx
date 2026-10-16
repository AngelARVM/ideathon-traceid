/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getPublicRecord } from '../services/traceApi';
import { PublicRecordResult } from '../types';
import { navigateTo } from '../router';
import { getRecordTypeMeta } from '../components/StatusBadge';
import { CopyableHash } from '../components/CopyableHash';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Code,
  Calendar,
  User,
  Fingerprint,
  Link,
  Layers,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
} from 'lucide-react';

interface PublicRecordDetailViewProps {
  animalId: string;
  seq: number;
}

export const PublicRecordDetailView: React.FC<PublicRecordDetailViewProps> = ({
  animalId,
  seq,
}) => {
  const [data, setData] = useState<PublicRecordResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRecord = async () => {
      setLoading(true);
      try {
        // Exclusivo: SOLO getPublicRecord
        const result = await getPublicRecord(animalId, seq);
        if (isMounted) setData(result);
      } catch {
        if (isMounted) setData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecord();
    return () => {
      isMounted = false;
    };
  }, [animalId, seq]);

  const handleCopyCanonicalPayload = () => {
    if (!data?.canonicalPayloadJson) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.canonicalPayloadJson);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#2F6B3A]/30 border-t-[#2F6B3A] rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Recalculando hash y verificando evidencia criptográfica en Stellar…
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
          Evidencia de registro no encontrada
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
          No se encontró el hito #{seq} para el animal especificado.
        </p>
        <button
          type="button"
          onClick={() => navigateTo(`/a/${animalId}`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Historial Público</span>
        </button>
      </div>
    );
  }

  const { animal, record, verification, contractId, stellarNetwork, canonicalPayloadJson } = data;
  const meta = getRecordTypeMeta(record.type);
  const Icon = meta.icon;

  const hashesMatch = verification.storedHash === verification.calculatedHash;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-24">
      {/* Botón Volver y navegación entre secuencias */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={() => navigateTo(`/a/${animalId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Historial ({animal.officialId})</span>
        </button>

        {/* Atajos a hito anterior / siguiente */}
        <div className="flex items-center gap-1.5 text-xs">
          {seq > 0 && (
            <button
              type="button"
              onClick={() => navigateTo(`/a/${animalId}/registro/${seq - 1}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Seq #{seq - 1}</span>
            </button>
          )}

          {seq < animal.recordCount - 1 && (
            <button
              type="button"
              onClick={() => navigateTo(`/a/${animalId}/registro/${seq + 1}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-medium"
            >
              <span>Seq #{seq + 1}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cabecera del Hito Auditado */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl border ${meta.colorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Prueba de Evidencia Criptográfica
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 font-bold text-stone-700 dark:text-stone-300">
                  Secuencia #{record.seq}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-stone-950 dark:text-white">
                {meta.label}
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Caravana: <strong className="font-mono-num">{animal.officialId}</strong> · {animal.establishment}
              </p>
            </div>
          </div>

          <div>
            {hashesMatch && verification.state === 'verificado' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Hash Verificado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Discrepancia Criptográfica</span>
              </span>
            )}
          </div>
        </div>

        {/* =========================================================================
            COMPARACIÓN LADO A LADO:
            "Hash registrado en Stellar" vs "Hash recalculado ahora" con ✓ / ✗
           ========================================================================= */}
        <div className="my-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
              <span>Comparación Criptográfica de Integridad</span>
            </h3>
            <span className="text-[10px] font-mono text-stone-500">
              SHA-256 (256 bits)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Hash registrado en Stellar */}
            <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                  Hash registrado en Stellar
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Inmutable
                </span>
              </div>
              <CopyableHash
                value={verification.storedHash}
                truncateLength={16}
                monoClass="text-xs font-mono text-emerald-900 dark:text-emerald-300 font-semibold"
              />
            </div>

            {/* Hash recalculado ahora */}
            <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400">
                  Hash recalculado ahora
                </span>
                {hashesMatch ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Coincide (✓)
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Discrepa (✗)
                  </span>
                )}
              </div>
              <CopyableHash
                value={verification.calculatedHash}
                truncateLength={16}
                monoClass={`text-xs font-mono font-semibold ${
                  hashesMatch
                    ? 'text-emerald-900 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            PARÁMETROS DEL ENLACE Y DE LA BLOCKCHAIN
            prev_hash (con link al registro anterior), tx_hash, ledger, red, contract ID, todos con copiar.
            Botón "Ver en Stellar Expert" → https://stellar.expert/explorer/testnet/tx/<txHash>
            Si falta tx_hash o ledger: "Metadato no verificado en vivo"
           ========================================================================= */}
        <div className="space-y-2.5 text-xs">
          {/* prev_hash */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
              <Link className="w-3.5 h-3.5 text-[#2F6B3A] dark:text-emerald-400" />
              <span className="font-semibold text-[11px] uppercase">prev_hash:</span>
            </div>
            <div className="flex items-center gap-2">
              {record.prevHash ? (
                <>
                  <CopyableHash
                    value={record.prevHash}
                    truncateLength={16}
                    monoClass="text-[11px] font-mono text-stone-700 dark:text-stone-300"
                  />
                  {seq > 0 && (
                    <button
                      type="button"
                      onClick={() => navigateTo(`/a/${animalId}/registro/${seq - 1}`)}
                      className="text-[11px] font-bold text-[#2F6B3A] dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Ver Seq #{seq - 1}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </>
              ) : (
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  null (Registro Génesis de la Cadena)
                </span>
              )}
            </div>
          </div>

          {/* tx_hash y enlace a Stellar Expert */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="font-semibold text-[11px] uppercase text-stone-600 dark:text-stone-400">
              tx_hash:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {record.txHash ? (
                <>
                  <CopyableHash
                    value={record.txHash}
                    truncateLength={16}
                    monoClass="text-[11px] font-mono text-sky-800 dark:text-sky-300"
                  />
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${record.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold text-[11px] hover:bg-sky-100 transition border border-sky-200 dark:border-sky-800"
                  >
                    <span>Ver en Stellar Expert</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-medium text-[11px]">
                  Metadato no verificado en vivo
                </span>
              )}
            </div>
          </div>

          {/* ledger y red */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase text-stone-400 block mb-0.5">
                Ledger:
              </span>
              {record.ledger ? (
                <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200">
                  #{record.ledger}
                </span>
              ) : (
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Metadato no verificado en vivo
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase text-stone-400 block mb-0.5">
                Red:
              </span>
              <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200">
                {stellarNetwork}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase text-stone-400 block mb-0.5">
                Contract ID:
              </span>
              <CopyableHash
                value={contractId}
                truncateLength={8}
                monoClass="text-[10px] font-mono text-stone-800 dark:text-stone-200"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            PAYLOAD CANÓNICO EXACTO COMO JSON MONOESPACIADO (El que se hashea)
           ========================================================================= */}
        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                Payload Canónico Exacto (Entrada SHA-256)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyCanonicalPayload}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition"
            >
              {copiedPayload ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar JSON canónico</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-stone-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-stone-800 leading-relaxed shadow-inner">
            {canonicalPayloadJson}
          </pre>
          <p className="mt-1.5 text-[11px] text-stone-400">
            Este JSON con claves ordenadas lexicográficamente es la representación canónica exacta sometida a la función hash SHA-256 en Stellar.
          </p>
        </div>
      </div>
    </div>
  );
};
