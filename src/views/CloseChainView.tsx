"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Info,
  Lock,
  Skull,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { showToast } from "@/components/Toast";
import { closeChain, getAnimal } from "@/lib/traceApi";
import type { Animal } from "@/lib/types";

interface CloseChainViewProps {
  animalId: string;
  onChainClosed?: () => void;
}

export const CloseChainView: React.FC<CloseChainViewProps> = ({
  animalId,
  onChainClosed,
}) => {
  const router = useRouter();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loadingAnimal, setLoadingAnimal] = useState(true);

  // Tipo terminal: "Entrega a frigorífico" o "Muerte"
  const [terminalType, setTerminalType] = useState<
    "entrega_frigorifico" | "muerte"
  >("entrega_frigorifico");

  const todayStr = new Date().toISOString().split("T")[0];
  const [eventDate, setEventDate] = useState(todayStr);

  // Campos específicos: Entrega a frigorífico
  const [slaughterhouse, setSlaughterhouse] = useState(
    "Frigorífico Exportador del Nordeste (Resistencia)",
  );
  const [dteNumber, setDteNumber] = useState("");

  // Campos específicos: Muerte
  const [deathCause, setDeathCause] = useState<
    "enfermedad" | "accidente" | "predador" | "desconocida" | "otra"
  >("enfermedad");
  const [deathNotes, setDeathNotes] = useState("");

  // Confirmación por tipeo exacto del identificador oficial
  const [confirmIdInput, setConfirmIdInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAnimal(animalId).then((a) => {
      if (isMounted) {
        setAnimal(a);
        setLoadingAnimal(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [animalId]);

  if (loadingAnimal) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#2F6B3A]/30 border-t-[#2F6B3A] rounded-full animate-spin mb-3" />
        <p className="text-sm text-stone-500">Cargando datos del animal...</p>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Animal no encontrado</h2>
        <button
          onClick={() => router.push("/animals")}
          className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-xl"
        >
          Volver al Rodeo
        </button>
      </div>
    );
  }

  // Si la cadena ya está cerrada
  if (animal.status === "cerrada") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 mx-auto flex items-center justify-center mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Cadena ya cerrada
        </h2>
        <p className="text-xs text-stone-500 mb-5">
          La cadena de la caravana{" "}
          <strong className="font-mono">{animal.officialId}</strong> ya fue
          sellada precedentemente. Solo se admiten rectificaciones.
        </p>
        <button
          onClick={() => router.push(`/animals/${animal.id}`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al legajo del animal</span>
        </button>
      </div>
    );
  }

  // Validación de coincidencia exacta del identificador oficial
  const isIdConfirmed = confirmIdInput.trim() === animal.officialId.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isIdConfirmed) {
      setError(
        "Debe escribir exactamente el identificador oficial de la caravana.",
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const destinationOrCause =
        terminalType === "entrega_frigorifico"
          ? slaughterhouse.trim()
          : `Muerte por causa: ${deathCause}${deathNotes ? ` (${deathNotes.trim()})` : ""}`;

      const payload: Record<string, unknown> =
        terminalType === "entrega_frigorifico"
          ? {
              frigorificoDestino: slaughterhouse.trim(),
              dteSenasa: dteNumber.trim() || undefined,
              fechaSalida: eventDate,
              avisoPlataforma:
                "Registra el fin del seguimiento en esta plataforma. No demuestra la faena.",
            }
          : {
              causaMuerte: deathCause,
              fechaBaja: eventDate,
              observaciones: deathNotes.trim() || undefined,
            };

      await closeChain(animal.id, {
        type: terminalType,
        occurredAt: `${eventDate}T12:00:00.000Z`,
        destinationOrCause,
        payload,
      });

      if (onChainClosed) onChainClosed();
      showToast("Cadena cerrada definitivamente en Stellar");
      router.push(`/animals/${animal.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al registrar el cierre en Stellar.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Retorno */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.push(`/animals/${animal.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al animal ({animal.officialId})</span>
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-8 shadow-xs">
        {/* Cabecera */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold mb-2 border border-rose-200 dark:border-rose-900">
            <Lock className="w-3.5 h-3.5" />
            <span>Evento Terminal de Trazabilidad</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            Cerrar Cadena
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Caravana{" "}
            <strong className="font-mono-num text-stone-900 dark:text-stone-100">
              {animal.officialId}
            </strong>{" "}
            · {animal.establishment}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Selector de tipo terminal: "Entrega a frigorífico" o "Muerte" */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
              Seleccionar tipo terminal *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTerminalType("entrega_frigorifico")}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 ${
                  terminalType === "entrega_frigorifico"
                    ? "border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800 shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-stone-900 text-white shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                    Entrega a frigorífico
                  </span>
                  <span className="text-[11px] text-stone-500 mt-0.5 block leading-normal">
                    Salida para faena o terminación industrial.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTerminalType("muerte")}
                className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 ${
                  terminalType === "muerte"
                    ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 shadow-xs"
                    : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0">
                  <Skull className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                    Muerte
                  </span>
                  <span className="text-[11px] text-stone-500 mt-0.5 block leading-normal">
                    Baja biológica en el establecimiento.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Campos para Entrega a frigorífico */}
          {terminalType === "entrega_frigorifico" && (
            <div className="space-y-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80">
              <div>
                <label
                  htmlFor="slaughterhouse"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Frigorífico destino *
                </label>
                <input
                  id="slaughterhouse"
                  type="text"
                  required
                  value={slaughterhouse}
                  onChange={(e) => setSlaughterhouse(e.target.value)}
                  placeholder="Ej: Frigorífico Exportador del Nordeste (Resistencia)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="eventDate"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Fecha de entrega *
                  </label>
                  <input
                    id="eventDate"
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    max={todayStr}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dteNumber"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    DTE SENASA{" "}
                    <span className="font-normal text-stone-400">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="dteNumber"
                    type="text"
                    inputMode="numeric"
                    value={dteNumber}
                    onChange={(e) => setDteNumber(e.target.value)}
                    placeholder="0982-2025-00041289"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-sm text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* AVISO DESTACADO OBLIGATORIO DE FRIGORÍFICO */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5 font-medium leading-relaxed">
                <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aviso destacado:</strong> Registra el fin del
                  seguimiento en esta plataforma. No demuestra la faena.
                </span>
              </div>
            </div>
          )}

          {/* 3. Campos para Muerte */}
          {terminalType === "muerte" && (
            <div className="space-y-4 p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="deathCause"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Causa de muerte *
                  </label>
                  <select
                    id="deathCause"
                    value={deathCause}
                    onChange={(e) => setDeathCause(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                  >
                    <option value="enfermedad">Enfermedad</option>
                    <option value="accidente">Accidente</option>
                    <option value="predador">Predador</option>
                    <option value="desconocida">Desconocida</option>
                    <option value="otra">Otra</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="deathDate"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Fecha de la baja *
                  </label>
                  <input
                    id="deathDate"
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    max={todayStr}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="deathNotes"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Detalle / Circunstancias{" "}
                  <span className="font-normal text-stone-400">(opcional)</span>
                </label>
                <input
                  id="deathNotes"
                  type="text"
                  value={deathNotes}
                  onChange={(e) => setDeathNotes(e.target.value)}
                  placeholder="Ej: Timpanismo agudo en pastoreo"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          )}

          {/* CAJA DE ADVERTENCIA ROJA ANTES DE CONFIRMAR:
              • La cadena no aceptará nuevos hitos ordinarios, nunca.
              • El cierre no se puede deshacer.
              • Solo se podrán agregar rectificaciones. */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-100 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Advertencia crítica sobre el cierre de cadena</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc leading-relaxed">
              <li>
                <strong>
                  La cadena no aceptará nuevos hitos ordinarios, nunca.
                </strong>
              </li>
              <li>
                <strong>El cierre no se puede deshacer.</strong> Quedará sellado
                criptográficamente en Stellar.
              </li>
              <li>
                <strong>Solo se podrán agregar rectificaciones.</strong>
              </li>
            </ul>
          </div>

          {/* CONFIRMACIÓN ESCRIBIENDO EL IDENTIFICADOR OFICIAL DEL ANIMAL */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2">
            <label
              htmlFor="confirmIdInput"
              className="block text-xs font-bold text-stone-800 dark:text-stone-200"
            >
              Para confirmar el cierre, escribe el identificador oficial tal
              cual figura:{" "}
              <span className="font-mono-num font-bold text-rose-700 dark:text-rose-400 select-all">
                {animal.officialId}
              </span>
            </label>

            <input
              id="confirmIdInput"
              type="text"
              required
              value={confirmIdInput}
              onChange={(e) => setConfirmIdInput(e.target.value)}
              placeholder={animal.officialId}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono-num text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            {!isIdConfirmed && confirmIdInput.length > 0 && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Los identificadores no coinciden exactamente.
              </p>
            )}
            {isIdConfirmed && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Identificador verificado correctamente.
              </p>
            )}
          </div>

          {/* BOTÓN: "Cerrar cadena definitivamente" (se habilita solo si coincide exactamente) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !isIdConfirmed}
              className={`w-full h-14 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition ${
                isIdConfirmed
                  ? "bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white cursor-pointer shadow-rose-950/30"
                  : "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed border border-stone-300 dark:border-stone-700"
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Anclando cierre terminal en Stellar…</span>
                </span>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Cerrar cadena definitivamente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
