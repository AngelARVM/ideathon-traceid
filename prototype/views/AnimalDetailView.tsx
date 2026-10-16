"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit3,
  ExternalLink,
  History,
  Info,
  Layers,
  Lock,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Unlock,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import type React from "react";
import { useEffect, useState } from "react";
import { CopyableHash } from "@/components/CopyableHash";
import { getRecordTypeMeta } from "@/components/StatusBadge";
import { showToast } from "@/components/Toast";
import {
  addRecord,
  getAnimal,
  getAnimalOperationalRecords,
  retryRecord,
} from "@/lib/traceApi";
import type { Animal, TraceRecord } from "@/lib/types";

interface AnimalDetailViewProps {
  animalId: string;
}

export const AnimalDetailView: React.FC<AnimalDetailViewProps> = ({
  animalId,
}) => {
  const router = useRouter();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [records, setRecords] = useState<TraceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal QR
  const [showQrModal, setShowQrModal] = useState(false);

  // Modal de Rectificación
  const [rectifyingRecord, setRectifyingRecord] = useState<TraceRecord | null>(
    null,
  );
  const [rectificationReason, setRectificationReason] = useState("");
  const [correctedWeight, setCorrectedWeight] = useState("");
  const [correctedProduct, setCorrectedProduct] = useState("");
  const [correctedDose, setCorrectedDose] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [submittingRectification, setSubmittingRectification] = useState(false);
  const [rectificationError, setRectificationError] = useState<string | null>(
    null,
  );

  // Estado de reintento de anclaje para registros fallidos
  const [retryingSeq, setRetryingSeq] = useState<number | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<{
    seq: number;
    error?: string;
    success?: boolean;
  } | null>(null);

  const loadAnimalData = async () => {
    try {
      const a = await getAnimal(animalId);
      if (a) {
        setAnimal(a);
        const r = await getAnimalOperationalRecords(a.id);
        setRecords(r);
      }
    } catch {
      // Manejado
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimalData();
  }, [animalId]);

  // Manejador de reintento en Stellar
  const handleRetry = async (seq: number) => {
    if (!animal) return;
    setRetryingSeq(seq);
    setRetryFeedback(null);

    try {
      const updated = await retryRecord(animal.id, seq);
      setRecords((prev) => prev.map((r) => (r.seq === seq ? updated : r)));
      setRetryFeedback({ seq, success: true });
      showToast("Hito anclado con éxito en Stellar");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al reintentar transacción en Stellar";
      setRetryFeedback({ seq, error: msg });
    } finally {
      setRetryingSeq(null);
    }
  };

  // Apertura del modal de rectificación
  // REGLA CLAVE: "Siempre apunta al registro ORIGINAL (si ya fue rectificado, se rectifica el original, no la rectificación)"
  const handleOpenRectifyModal = (rec: TraceRecord) => {
    let target = rec;
    if (typeof rec.rectifies === "number") {
      const original = records.find((item) => item.seq === rec.rectifies);
      if (original) target = original;
    }

    setRectifyingRecord(target);
    setRectificationReason("");
    setRectificationError(null);

    // Pre-llenar campos según el tipo original
    if (target.type === "pesaje") {
      const curWeight = (target.payload?.pesoKg ||
        target.payload?.pesoKgCorregido ||
        "") as string | number;
      setCorrectedWeight(String(curWeight));
    } else if (target.type === "vacunacion") {
      setCorrectedProduct(
        String(target.payload?.vacuna || target.payload?.producto || ""),
      );
      const d = target.payload?.dosis;
      setCorrectedDose(
        typeof d === "object" && d !== null
          ? String((d as any).valor || "")
          : String(target.payload?.dosisMl || ""),
      );
    } else if (target.type === "desparasitacion") {
      setCorrectedProduct(
        String(
          target.payload?.producto || target.payload?.principioActivo || "",
        ),
      );
      const d = target.payload?.dosis;
      setCorrectedDose(
        typeof d === "object" && d !== null
          ? String((d as any).valor || "")
          : String(target.payload?.dosisMl || ""),
      );
    } else {
      setCorrectedText("");
    }
  };

  const handleConfirmRectification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rectifyingRecord || !animal) return;

    if (!rectificationReason.trim()) {
      setRectificationError("El motivo de la rectificación es obligatorio.");
      return;
    }

    setSubmittingRectification(true);
    setRectificationError(null);

    try {
      const correctedPayload: Record<string, unknown> = {
        hitoRectificadoSeq: rectifyingRecord.seq,
        tipoOriginal: rectifyingRecord.type,
        motivo: rectificationReason.trim(),
      };

      if (rectifyingRecord.type === "pesaje") {
        const p = parseFloat(correctedWeight);
        if (isNaN(p) || p <= 0) {
          throw new Error("Debe ingresar un peso numérico válido.");
        }
        correctedPayload.pesoKgCorregido = p;
        correctedPayload.pesoOriginal = rectifyingRecord.payload?.pesoKg;
      } else if (
        rectifyingRecord.type === "vacunacion" ||
        rectifyingRecord.type === "desparasitacion"
      ) {
        if (!correctedProduct.trim()) {
          throw new Error("Debe indicar el producto corregido.");
        }
        correctedPayload.productoCorregido = correctedProduct.trim();
        correctedPayload.dosisCorregida = correctedDose.trim() || undefined;
      } else if (correctedText.trim()) {
        correctedPayload.detalleCorregido = correctedText.trim();
      }

      const newRecord = await addRecord(animal.id, {
        type: "rectificacion",
        occurredAt: new Date().toISOString(),
        author: "Operador Certificante NEA",
        payload: correctedPayload,
        rectifies: rectifyingRecord.seq,
      });

      // Actualizar estado local: marcar el original como rectificado por este nuevo seq
      setRecords((prev) => {
        const updated = prev.map((item) =>
          item.seq === rectifyingRecord.seq
            ? { ...item, rectifiedBy: newRecord.seq }
            : item,
        );
        return [...updated, newRecord];
      });

      setAnimal((prev) =>
        prev
          ? {
              ...prev,
              recordCount: prev.recordCount + 1,
              lastRecordType: "rectificacion",
            }
          : null,
      );

      setRectifyingRecord(null);
      showToast("Rectificación registrada en Stellar");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRectificationError(err.message);
      } else {
        setRectificationError("Error al asentar la rectificación en Stellar.");
      }
    } finally {
      setSubmittingRectification(false);
    }
  };

  // URL pública a la que apunta el QR
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/a/${animal?.id || animalId}`
      : `/a/${animalId}`;

  // Descarga del QR en PNG
  const handleDownloadPng = () => {
    const canvas = document.getElementById(
      "traceid-qr-canvas",
    ) as HTMLCanvasElement;
    if (!canvas || !animal) return;

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `TraceID-${animal.officialId.replace(/[\s/]/g, "_")}-QR.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#2F6B3A]/30 border-t-[#2F6B3A] rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
          Cargando legajo operativo...
        </p>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center mb-3">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Animal no encontrado
        </h2>
        <p className="text-xs text-stone-500 mb-5">
          No se encontró el registro del animal con ID{" "}
          <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">
            {animalId}
          </code>
          .
        </p>
        <button
          type="button"
          onClick={() => router.push("/animals")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Rodeo</span>
        </button>
      </div>
    );
  }

  const isClosed = animal.status === "cerrada";

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-28">
      {/* Botón de retorno al listado */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.push("/animals")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Rodeo</span>
        </button>
      </div>

      {/* CABECERA OPERATIVA */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Ficha Operativa de Campo
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                ULID: {animal.id.slice(0, 10)}…
              </span>
            </div>

            {/* Identificador oficial grande en monoespaciada */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono-num text-stone-950 dark:text-white tracking-tight">
                {animal.officialId}
              </h1>
              <CopyableHash
                value={animal.officialId}
                truncateLength={24}
                className="bg-transparent border-none p-0"
                monoClass="hidden"
              />
            </div>

            {/* Identificadores anteriores (si hay) */}
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

        {/* Lote y Establecimiento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold">
              Establecimiento
            </span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 block truncate mt-0.5">
              {animal.establishment}
            </span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold">
              Lote Actual
            </span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 block truncate mt-0.5">
              {animal.lot}
            </span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold">
              Categoría y Raza
            </span>
            <span className="font-medium text-stone-700 dark:text-stone-300 block truncate mt-0.5">
              {animal.category || "General"} · {animal.breed || "Cruza"}
            </span>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold">
              ID Stellar (ULID)
            </span>
            <CopyableHash
              value={animal.id}
              truncateLength={7}
              monoClass="text-[11px] text-stone-800 dark:text-stone-200"
            />
          </div>
        </div>

        {/* BOTÓN PRINCIPAL GRANDE "Nuevo hito" */}
        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
          {!isClosed ? (
            <button
              type="button"
              onClick={() => router.push(`/animals/${animal.id}/records/new`)}
              className="w-full h-14 rounded-2xl bg-[#2F6B3A] hover:bg-[#26562f] active:bg-[#204527] text-white font-bold text-base shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2.5 transition active:scale-[0.99]"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Nuevo hito</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-stone-600 dark:text-stone-300">
                <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="font-medium">
                  La cadena está cerrada. Solo se admiten rectificaciones.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const lastConfirm = [...records]
                    .reverse()
                    .find((r) => r.status === "confirmado");
                  if (lastConfirm) handleOpenRectifyModal(lastConfirm);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <History className="w-4 h-4" />
                <span>Rectificar</span>
              </button>
            </div>
          )}
        </div>

        {/* ACCIONES SECUNDARIAS */}
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/a/${animal.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-950/80 text-[#2F6B3A] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ver historial público</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-semibold transition"
            >
              <QrCode className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
              <span>Mostrar QR</span>
            </button>
          </div>

          {/* "Cerrar cadena" (en rojo, separado) */}
          {!isClosed ? (
            <button
              type="button"
              onClick={() => router.push(`/animals/${animal.id}/close`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition ml-auto"
            >
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Cerrar cadena</span>
            </button>
          ) : (
            <span className="text-xs text-stone-400 font-mono ml-auto">
              Cadena sellada en Stellar
            </span>
          )}
        </div>
      </div>

      {/* LÍNEA DE TIEMPO DE REGISTROS POR SEQ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
            <span>Línea de Tiempo Operativa ({records.length} hitos)</span>
          </h2>
          <span className="text-xs text-stone-400 font-mono">
            Secuencia 0 a {records.length - 1}
          </span>
        </div>

        <div className="space-y-3 relative pl-6 sm:pl-8 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
          {records.map((r) => {
            const meta = getRecordTypeMeta(r.type);
            const Icon = meta.icon;
            const isRetrying = retryingSeq === r.seq;
            const errorMsg =
              r.payload &&
              typeof r.payload === "object" &&
              (r.payload as Record<string, unknown>).errorStellar
                ? String((r.payload as Record<string, unknown>).errorStellar)
                : "Fallo de anclaje: Time-out de red en nodo Horizon Testnet";

            return (
              <div
                key={r.seq}
                id={`record-seq-${r.seq}`}
                className="relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-xs transition"
              >
                {/* Indicador de secuencia */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                    r.status === "confirmado"
                      ? "bg-emerald-600 border-white dark:border-stone-900 text-white"
                      : r.status === "pendiente"
                        ? "bg-amber-500 border-white dark:border-stone-900 text-white animate-pulse"
                        : "bg-rose-600 border-white dark:border-stone-900 text-white"
                  }`}
                >
                  {r.seq}
                </div>

                {/* Encabezado del hito con chips */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${meta.colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {meta.label}
                        </h4>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          Seq #{r.seq}
                        </span>
                        {r.terminal && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-800 text-white">
                            Terminal
                          </span>
                        )}

                        {/* RECTIFICACIÓN: En la línea de tiempo, el original muestra "Rectificado por #N" y la rectificación "Rectifica #N" */}
                        {typeof r.rectifiedBy === "number" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <History className="w-3 h-3 text-amber-600" />
                            Rectificado por #{r.rectifiedBy}
                          </span>
                        )}

                        {typeof r.rectifies === "number" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border border-orange-300 dark:border-orange-800 flex items-center gap-1">
                            <History className="w-3 h-3 text-orange-600" />
                            Rectifica #{r.rectifies}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {new Date(r.occurredAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        · Certificante: {r.author}
                      </p>
                    </div>
                  </div>

                  {/* Chips de estado: Pendiente, Confirmado, Fallido */}
                  <div className="flex items-center gap-2">
                    {r.status === "pendiente" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        <span className="w-3.5 h-3.5 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Registrando en Stellar…</span>
                      </span>
                    )}

                    {r.status === "confirmado" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmado</span>
                      </span>
                    )}

                    {r.status === "fallido" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Fallido</span>
                      </span>
                    )}

                    {/* Menú / Botón "Rectificar" desde cualquier registro confirmado */}
                    {r.status === "confirmado" && (
                      <button
                        type="button"
                        onClick={() => handleOpenRectifyModal(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition"
                        title="Rectificar este hito"
                      >
                        <Edit3 className="w-3 h-3 text-amber-600" />
                        <span>Rectificar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Si falló, mostrar el mensaje de error y el botón "Reintentar" */}
                {r.status === "fallido" && (
                  <div className="my-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Error de anclaje blockchain</span>
                      </div>
                      <p className="text-xs text-rose-800 dark:text-rose-300 font-mono">
                        {errorMsg}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isRetrying}
                      onClick={() => handleRetry(r.seq)}
                      className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`}
                      />
                      <span>{isRetrying ? "Reintentando…" : "Reintentar"}</span>
                    </button>
                  </div>
                )}

                {/* Feedback si el reintento tuvo éxito */}
                {retryFeedback?.seq === r.seq && retryFeedback.success && (
                  <div className="my-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      ¡Reintento exitoso! Anclado en nuevo ledger de Stellar
                      Testnet.
                    </span>
                  </div>
                )}

                {/* Datos del payload */}
                <div className="py-2.5 text-xs text-stone-700 dark:text-stone-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50/70 dark:bg-stone-800/40 p-2.5 rounded-xl">
                    {Object.entries(r.payload)
                      .filter(([k]) => k !== "errorStellar")
                      .map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="text-stone-400 font-semibold capitalize">
                            {k.replace(/([A-Z])/g, " $1")}:{" "}
                          </span>
                          <span className="text-stone-900 dark:text-stone-100 font-medium">
                            {typeof v === "object"
                              ? JSON.stringify(v)
                              : String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Hashes y Enlaces */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CopyableHash
                      value={r.contentHash}
                      label="Hash"
                      truncateLength={10}
                      monoClass="text-[10px]"
                    />
                    {r.ledger && (
                      <span className="font-mono text-stone-400 text-[10px]">
                        Ledger #{r.ledger}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/a/${animal.id}/records/${r.seq}`)
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F6B3A] dark:text-emerald-400 hover:underline"
                  >
                    <span>Auditar hash</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE RECTIFICACIÓN
          - Registro original (solo lectura)
          - Campos corregidos del mismo tipo
          - "Motivo de la rectificación" obligatorio
          - Siempre apunta al registro ORIGINAL
          - Texto: "El registro original no se modifica ni se borra. Ambos quedarán visibles." */}
      {rectifyingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 max-w-lg w-full rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Rectificar Hito Seq #{rectifyingRecord.seq}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {getRecordTypeMeta(rectifyingRecord.type).label} · Caravana{" "}
                    {animal.officialId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRectifyingRecord(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TEXTO DESTACADO OBLIGATORIO:
                "El registro original no se modifica ni se borra. Ambos quedarán visibles." */}
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 font-medium leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Principio de inmutabilidad:</strong> El registro
                original no se modifica ni se borra. Ambos quedarán visibles en
                la cadena de bloques con su secuencia y hash.
              </span>
            </div>

            {rectificationError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-xs text-rose-800 dark:text-rose-200">
                {rectificationError}
              </div>
            )}

            <form onSubmit={handleConfirmRectification} className="space-y-4">
              {/* REGISTRO ORIGINAL (SOLO LECTURA) */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 text-xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                  Registro Original (Solo lectura) — Seq #{rectifyingRecord.seq}
                </span>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Fecha original:</span>
                  <span className="font-mono">
                    {new Date(rectifyingRecord.occurredAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Autor asentado:</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {rectifyingRecord.author}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-stone-200 dark:border-stone-700/60 text-stone-700 dark:text-stone-300">
                  <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                    Datos asentados:
                  </span>
                  <div className="grid grid-cols-2 gap-1 mt-0.5 font-mono text-[11px]">
                    {Object.entries(rectifyingRecord.payload)
                      .filter(([k]) => k !== "errorStellar")
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <div key={k} className="truncate">
                          <span className="text-stone-400">{k}: </span>
                          <span>{String(v)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* CAMPOS CORREGIDOS DEL MISMO TIPO */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-700 dark:text-stone-300 block">
                  Nuevos Valores Corregidos
                </span>

                {rectifyingRecord.type === "pesaje" && (
                  <div>
                    <label
                      htmlFor="correctedWeight"
                      className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                    >
                      Peso correcto en báscula (kg) *
                    </label>
                    <div className="relative">
                      <input
                        id="correctedWeight"
                        type="number"
                        step="0.1"
                        min="1"
                        inputMode="numeric"
                        required
                        value={correctedWeight}
                        onChange={(e) => setCorrectedWeight(e.target.value)}
                        placeholder="Ej: 435.0"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono-num text-base font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                        autoFocus
                      />
                      <span className="absolute right-4 top-2.5 text-sm font-bold text-stone-400">
                        kg
                      </span>
                    </div>
                  </div>
                )}

                {(rectifyingRecord.type === "vacunacion" ||
                  rectifyingRecord.type === "desparasitacion") && (
                  <div className="space-y-2">
                    <div>
                      <label
                        htmlFor="correctedProduct"
                        className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                      >
                        Producto corregido *
                      </label>
                      <input
                        id="correctedProduct"
                        type="text"
                        required
                        value={correctedProduct}
                        onChange={(e) => setCorrectedProduct(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="correctedDose"
                        className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                      >
                        Dosis corregida
                      </label>
                      <input
                        id="correctedDose"
                        type="text"
                        value={correctedDose}
                        onChange={(e) => setCorrectedDose(e.target.value)}
                        placeholder="Ej: 2 ml"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-mono text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                )}

                {rectifyingRecord.type !== "pesaje" &&
                  rectifyingRecord.type !== "vacunacion" &&
                  rectifyingRecord.type !== "desparasitacion" && (
                    <div>
                      <label
                        htmlFor="correctedText"
                        className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1"
                      >
                        Detalle del dato corregido
                      </label>
                      <input
                        id="correctedText"
                        type="text"
                        value={correctedText}
                        onChange={(e) => setCorrectedText(e.target.value)}
                        placeholder="Ingrese la corrección específica..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  )}
              </div>

              {/* MOTIVO DE LA RECTIFICACIÓN (OBLIGATORIO) */}
              <div>
                <label
                  htmlFor="rectificationReason"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Motivo de la rectificación *
                </label>
                <textarea
                  id="rectificationReason"
                  rows={2}
                  required
                  value={rectificationReason}
                  onChange={(e) => setRectificationReason(e.target.value)}
                  placeholder="Explique el error involuntario y la fuente de verificación (ej: ticket de báscula)..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRectifyingRecord(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingRectification || !rectificationReason.trim()
                  }
                  className="w-2/3 py-2.5 rounded-xl bg-[#2F6B3A] hover:bg-[#26562f] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingRectification ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Anclando en Stellar…</span>
                    </span>
                  ) : (
                    <>
                      <History className="w-3.5 h-3.5" />
                      <span>Anclar Rectificación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL "Mostrar QR" */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-sm w-full rounded-3xl p-6 text-center border border-stone-200 dark:border-stone-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Trazabilidad Móvil
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              Código QR de Acceso Público
            </h3>
            <p className="text-xs text-stone-500 mb-4 font-mono-num font-semibold">
              Caravana {animal.officialId}
            </p>

            <div className="p-4 bg-white rounded-2xl border border-stone-200 dark:border-stone-700 inline-block shadow-inner mb-4">
              <QRCodeCanvas
                id="traceid-qr-canvas"
                value={publicUrl}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="mb-4 text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/80 p-2 rounded-xl truncate">
              {publicUrl}
            </div>

            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left">
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-snug flex items-start gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Importante:</strong> Este QR da acceso al historial en
                  TraceID. No reemplaza la caravana ni el dispositivo oficial de
                  SENASA.
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="w-full py-3 rounded-xl bg-[#2F6B3A] hover:bg-[#26562f] active:bg-[#204527] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PNG</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-50 dark:hover:bg-stone-800 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
