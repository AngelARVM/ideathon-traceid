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
  ChevronRight,
  DollarSign,
  FileText,
  Info,
  Pill,
  Scale,
  Skull,
  Syringe,
  Truck,
  Wheat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { getRecordTypeMeta } from "@/components/StatusBadge";
import { showToast } from "@/components/Toast";
import {
  addRecord,
  getAnimal,
  getAnimalOperationalRecords,
  getAvailableEstablishments,
} from "@/lib/traceApi";
import type { Animal, RecordType, TraceRecord } from "@/lib/types";

interface NewRecordViewProps {
  animalId: string;
  onRecordAdded?: () => void;
}

export const NewRecordView: React.FC<NewRecordViewProps> = ({
  animalId,
  onRecordAdded,
}) => {
  const router = useRouter();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [records, setRecords] = useState<TraceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Paso 1: tipo seleccionado
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<RecordType>("pesaje");

  // Fecha y hora del hecho (por defecto actual, editable hacia atrás)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const [occurredAt, setOccurredAt] = useState(defaultDateTime);

  // Campos específicos por tipo:
  // Pesaje
  const [weightKg, setWeightKg] = useState("420.5");

  // Vacunación
  const [vaccineProduct, setVaccineProduct] = useState(
    "Fiebre Aftosa Bivalente",
  );
  const [vaccineDoseValue, setVaccineDoseValue] = useState("2");
  const [vaccineDoseUnit, setVaccineDoseUnit] = useState<
    "ml" | "mg" | "cc" | "g"
  >("ml");
  const [vaccineBatch, setVaccineBatch] = useState("LOTE-SENASA-2025-04");

  // Desparasitación
  const [dewormerProduct, setDewormerProduct] = useState(
    "Ivermectina 3.15% L.A.",
  );
  const [dewormerDoseValue, setDewormerDoseValue] = useState("1");
  const [dewormerDoseUnit, setDewormerDoseUnit] = useState<
    "ml" | "mg" | "cc" | "g"
  >("ml");
  const [dewormerRoute, setDewormerRoute] = useState<
    "inyectable" | "oral" | "pour-on"
  >("inyectable");

  // Alimentación
  const [dietText, setDietText] = useState(
    "Suplementación proteica con pellet de algodón 28%",
  );
  const [dietChangeReason, setDietChangeReason] = useState(
    "Inicio de período seco invernal",
  );

  // Traslado
  const establishments = useMemo(() => getAvailableEstablishments(), []);
  const [targetEstablishment, setTargetEstablishment] = useState(
    establishments[1] || "El Ombú – Chaco",
  );
  const [transferReason, setTransferReason] = useState(
    "Invernada y terminación",
  );

  // Venta
  const [buyerName, setBuyerName] = useState(
    "Consorcio Ganadero del Paraná S.A.",
  );

  // Otro
  const [otherDescription, setOtherDescription] = useState("");

  // Rectificación
  const [rectifiesSeq, setRectifiesSeq] = useState<number>(1);
  const [rectificationReason, setRectificationReason] = useState("");

  // Envío y feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const a = await getAnimal(animalId);
        if (isMounted && a) {
          setAnimal(a);
          const r = await getAnimalOperationalRecords(a.id);
          if (isMounted) {
            setRecords(r);
            if (a.status === "cerrada") {
              setSelectedType("rectificacion");
              setStep(2);
            }
          }
        }
      } catch {
        // Manejado
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [animalId]);

  const lastRecord = records[records.length - 1];

  // Comprobar si la fecha del hecho es anterior a la del último registro
  const isRetrospectiveDate = useMemo(() => {
    if (!lastRecord || !occurredAt) return false;
    const eventTime = new Date(occurredAt).getTime();
    const lastTime = new Date(lastRecord.occurredAt).getTime();
    return eventTime < lastTime;
  }, [lastRecord, occurredAt]);

  const handleSelectType = (type: RecordType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let payload: Record<string, unknown> = {};

    switch (selectedType) {
      case "pesaje": {
        const p = parseFloat(weightKg);
        if (isNaN(p) || p <= 0) {
          setError("El peso debe ser un número mayor a 0 kg.");
          return;
        }
        payload = {
          pesoKg: p,
          unidad: "kg",
        };
        break;
      }
      case "vacunacion": {
        if (!vaccineProduct.trim()) {
          setError("Debe indicar el producto de vacunación.");
          return;
        }
        const doseVal = parseFloat(vaccineDoseValue);
        if (isNaN(doseVal) || doseVal <= 0) {
          setError("La dosis debe ser un número positivo.");
          return;
        }
        payload = {
          producto: vaccineProduct.trim(),
          dosis: {
            valor: doseVal,
            unidad: vaccineDoseUnit,
          },
          loteProducto: vaccineBatch.trim() || undefined,
        };
        break;
      }
      case "desparasitacion": {
        if (!dewormerProduct.trim()) {
          setError("Debe indicar el producto desparasitante.");
          return;
        }
        const doseVal = parseFloat(dewormerDoseValue);
        if (isNaN(doseVal) || doseVal <= 0) {
          setError("La dosis debe ser un número positivo.");
          return;
        }
        payload = {
          producto: dewormerProduct.trim(),
          dosis: {
            valor: doseVal,
            unidad: dewormerDoseUnit,
          },
          via: dewormerRoute,
        };
        break;
      }
      case "alimentacion": {
        if (!dietText.trim()) {
          setError("Debe indicar la dieta.");
          return;
        }
        payload = {
          dieta: dietText.trim(),
          motivoCambio: dietChangeReason.trim() || undefined,
        };
        break;
      }
      case "traslado": {
        if (!targetEstablishment.trim()) {
          setError("Debe indicar el establecimiento de destino.");
          return;
        }
        payload = {
          origenEstablecimiento: animal?.establishment,
          destinoEstablecimiento: targetEstablishment.trim(),
          motivo: transferReason.trim() || "Movimiento de rodeo",
        };
        break;
      }
      case "venta": {
        if (!buyerName.trim()) {
          setError(
            "Debe indicar el comprador (sin datos de contacto personales).",
          );
          return;
        }
        payload = {
          comprador: buyerName.trim(),
          aclaracion: "La venta no cierra la cadena",
        };
        break;
      }
      case "otro": {
        if (!otherDescription.trim()) {
          setError("Debe ingresar una descripción del hecho.");
          return;
        }
        if (otherDescription.length > 140) {
          setError("La descripción no puede superar los 140 caracteres.");
          return;
        }
        payload = {
          descripcion: otherDescription.trim(),
        };
        break;
      }
      case "rectificacion": {
        if (!rectificationReason.trim()) {
          setError("Debe detallar el motivo de la rectificación.");
          return;
        }
        payload = {
          hitoRectificadoSeq: rectifiesSeq,
          motivo: rectificationReason.trim(),
        };
        break;
      }
      default:
        payload = { tipo: selectedType };
    }

    setSubmitting(true);
    try {
      const occurredIso = new Date(occurredAt).toISOString();
      await addRecord(animalId, {
        type: selectedType,
        occurredAt: occurredIso,
        payload,
        rectifies: selectedType === "rectificacion" ? rectifiesSeq : undefined,
      });

      if (onRecordAdded) onRecordAdded();
      showToast("Hito registrado en Stellar");
      router.push(`/animals/${animalId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al registrar el hito en Stellar.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#2F6B3A]/30 border-t-[#2F6B3A] rounded-full animate-spin mb-3" />
        <p className="text-sm text-stone-500">Cargando...</p>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-2">Animal no encontrado</h2>
        <button
          type="button"
          onClick={() => router.push("/animals")}
          className="text-xs font-semibold px-4 py-2 bg-stone-900 text-white rounded-xl"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const meta = getRecordTypeMeta(selectedType);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Botón de retorno */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (step === 2 && animal.status !== "cerrada") {
              setStep(1);
            } else {
              router.push(`/animals/${animalId}`);
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {step === 2 && animal.status !== "cerrada"
              ? "Cambiar tipo de hito"
              : `Volver al animal (${animal.officialId})`}
          </span>
        </button>

        <span className="text-xs font-mono text-stone-400">
          Paso {step} de 2
        </span>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-8 shadow-xs">
        {/* Cabecera común */}
        <div className="mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Nuevo Hito · Caravana {animal.officialId}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {step === 1
              ? "Seleccionar Tipo de Evento"
              : `Registrar: ${meta.label}`}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {animal.establishment} · {animal.lot} · Próxima Seq #
            {records.length}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            PASO 1: Grilla de botones grandes con ícono en el orden requerido
            1. Pesaje, 2. Vacunación, 3. Desparasitación, 4. Traslado,
            5. Alimentación, 6. Venta, 7. Otro.
            Separados abajo con borde rojo y aviso "Cierra la cadena — irreversible":
            Entrega a frigorífico, Muerte (llevan a /cerrar)
           ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Eventos de manejo y sanidad
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Pesaje */}
                <button
                  type="button"
                  onClick={() => handleSelectType("pesaje")}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#2F6B3A] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition flex flex-col justify-between group h-28"
                >
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 w-fit">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block group-hover:text-[#2F6B3A]">
                      Pesaje
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Control de balanza (kg)
                    </span>
                  </div>
                </button>

                {/* 2. Vacunación */}
                <button
                  type="button"
                  onClick={() => handleSelectType("vacunacion")}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#2F6B3A] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition flex flex-col justify-between group h-28"
                >
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 w-fit">
                    <Syringe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block group-hover:text-[#2F6B3A]">
                      Vacunación
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Aftosa, brucelosis, etc.
                    </span>
                  </div>
                </button>

                {/* 3. Desparasitación */}
                <button
                  type="button"
                  onClick={() => handleSelectType("desparasitacion")}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#2F6B3A] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition flex flex-col justify-between group h-28"
                >
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 w-fit">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block group-hover:text-[#2F6B3A]">
                      Desparasitación
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Profilaxis de garrapatas
                    </span>
                  </div>
                </button>

                {/* 4. Traslado */}
                <button
                  type="button"
                  onClick={() => handleSelectType("traslado")}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#2F6B3A] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition flex flex-col justify-between group h-28"
                >
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 w-fit">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block group-hover:text-[#2F6B3A]">
                      Traslado
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Movimiento de campo
                    </span>
                  </div>
                </button>

                {/* 5. Alimentación */}
                <button
                  type="button"
                  onClick={() => handleSelectType("alimentacion")}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#2F6B3A] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition flex flex-col justify-between group h-28"
                >
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 w-fit">
                    <Wheat className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block group-hover:text-[#2F6B3A]">
                      Alimentación
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Cambio de ración o suplemento
                    </span>
                  </div>
                </button>

                {/* 6. Venta */}
                <button
                  type="button"
                  onClick={() => handleSelectType("venta")}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#2F6B3A] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition flex flex-col justify-between group h-28"
                >
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 w-fit">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block group-hover:text-[#2F6B3A]">
                      Venta
                    </span>
                    <span className="text-[11px] text-stone-500">
                      No cierra la cadena
                    </span>
                  </div>
                </button>

                {/* 7. Otro */}
                <button
                  type="button"
                  onClick={() => handleSelectType("otro")}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-[#2F6B3A] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-left transition flex flex-col justify-between group h-28"
                >
                  <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 w-fit">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block group-hover:text-[#2F6B3A]">
                      Otro
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Hito técnico libre
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* SEPARADOS ABAJO: CON BORDE ROJO Y ADVERTENCIA "Cierra la cadena — irreversible" */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 mb-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Cierra la cadena — irreversible</span>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Estos eventos dan por concluida la trazabilidad del animal y
                sellan los registros en la blockchain:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/animals/${animalId}/close`)}
                  className="p-4 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-500 text-left transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-stone-900 text-white">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                        Entrega a frigorífico
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Faena oficial / DTE
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/animals/${animalId}/close`)}
                  className="p-4 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-500 text-left transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                      <Skull className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                        Muerte / Baja biológica
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Registro de mortandad
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PASO 2: Formulario con campos específicos por tipo
           ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Fecha del hecho (editable hacia atrás) */}
            <div>
              <label
                htmlFor="occurredAt"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Fecha del hecho *
              </label>
              <input
                id="occurredAt"
                type="datetime-local"
                required
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
              />

              {/* NOTA REQUERIDA si la fecha del hecho es anterior a la del último registro */}
              {isRetrospectiveDate && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Nota:</strong> Este hecho se agregará al final de la
                    cadena con su fecha declarada; no se inserta entre registros
                    anteriores.
                  </span>
                </div>
              )}
            </div>

            {/* CAMPOS SEGÚN TIPO: */}

            {/* 1. Pesaje: peso (número > 0), unidad (kg) */}
            {selectedType === "pesaje" && (
              <div>
                <label
                  htmlFor="weightKg"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Peso verificado en balanza *
                </label>
                <div className="relative">
                  <input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    min="1"
                    inputMode="numeric"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="Ej: 435.0"
                    className="w-full px-4 py-3 pr-14 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono-num text-lg font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                    autoFocus
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-bold text-stone-400">
                    kg
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Lectura directa de báscula de manga.
                </span>
              </div>
            )}

            {/* 2. Vacunación: producto, dosis {valor, unidad: ml|mg|cc|g}, lote del producto (opcional) */}
            {selectedType === "vacunacion" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="vaccineProduct"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Producto de vacunación *
                  </label>
                  <input
                    id="vaccineProduct"
                    type="text"
                    required
                    value={vaccineProduct}
                    onChange={(e) => setVaccineProduct(e.target.value)}
                    placeholder="Ej: Fiebre Aftosa Bivalente / Carbunclo"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="vaccineDoseValue"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Dosis (valor) *
                    </label>
                    <input
                      id="vaccineDoseValue"
                      type="number"
                      step="0.1"
                      min="0.1"
                      inputMode="numeric"
                      required
                      value={vaccineDoseValue}
                      onChange={(e) => setVaccineDoseValue(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vaccineDoseUnit"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Unidad *
                    </label>
                    <select
                      id="vaccineDoseUnit"
                      value={vaccineDoseUnit}
                      onChange={(e) =>
                        setVaccineDoseUnit(
                          e.target.value as "ml" | "mg" | "cc" | "g",
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                    >
                      <option value="ml">ml (mililitros)</option>
                      <option value="cc">cc (centímetros cúbicos)</option>
                      <option value="mg">mg (miligramos)</option>
                      <option value="g">g (gramos)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="vaccineBatch"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Lote del producto{" "}
                    <span className="font-normal text-stone-400">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="vaccineBatch"
                    type="text"
                    value={vaccineBatch}
                    onChange={(e) => setVaccineBatch(e.target.value)}
                    placeholder="Ej: BB-AFT-2025-01"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-sm text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
            )}

            {/* 3. Desparasitación: producto, dosis {valor, unidad}, vía (oral/inyectable/pour-on) */}
            {selectedType === "desparasitacion" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="dewormerProduct"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Producto desparasitante *
                  </label>
                  <input
                    id="dewormerProduct"
                    type="text"
                    required
                    value={dewormerProduct}
                    onChange={(e) => setDewormerProduct(e.target.value)}
                    placeholder="Ej: Ivermectina 3.15% / Levamisol 10%"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="dewormerDoseValue"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Dosis (valor) *
                    </label>
                    <input
                      id="dewormerDoseValue"
                      type="number"
                      step="0.1"
                      min="0.1"
                      inputMode="numeric"
                      required
                      value={dewormerDoseValue}
                      onChange={(e) => setDewormerDoseValue(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dewormerDoseUnit"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Unidad *
                    </label>
                    <select
                      id="dewormerDoseUnit"
                      value={dewormerDoseUnit}
                      onChange={(e) =>
                        setDewormerDoseUnit(
                          e.target.value as "ml" | "mg" | "cc" | "g",
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                    >
                      <option value="ml">ml</option>
                      <option value="cc">cc</option>
                      <option value="mg">mg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="dewormerRoute"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Vía de aplicación *
                  </label>
                  <select
                    id="dewormerRoute"
                    value={dewormerRoute}
                    onChange={(e) =>
                      setDewormerRoute(
                        e.target.value as "inyectable" | "oral" | "pour-on",
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                  >
                    <option value="inyectable">
                      Inyectable (Subcutánea / Intramuscular)
                    </option>
                    <option value="pour-on">Pour-on (Dorsal)</option>
                    <option value="oral">Oral</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. Alimentación: dieta (texto corto), motivo del cambio (opcional) */}
            {selectedType === "alimentacion" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="dietText"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Dieta *
                  </label>
                  <input
                    id="dietText"
                    type="text"
                    required
                    value={dietText}
                    onChange={(e) => setDietText(e.target.value)}
                    placeholder="Ej: Pellet de algodón 28% PB + silo de maíz"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="dietChangeReason"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Motivo del cambio{" "}
                    <span className="font-normal text-stone-400">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="dietChangeReason"
                    type="text"
                    value={dietChangeReason}
                    onChange={(e) => setDietChangeReason(e.target.value)}
                    placeholder="Ej: Sequía invernal / terminación de lote"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
            )}

            {/* 5. Traslado: establecimiento destino, motivo. Aviso: "El traslado es informativo; no transfiere permisos." */}
            {selectedType === "traslado" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="targetEstablishment"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Establecimiento destino *
                  </label>
                  <select
                    id="targetEstablishment"
                    value={targetEstablishment}
                    onChange={(e) => setTargetEstablishment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                    autoFocus
                  >
                    {establishments.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                    <option value="Cabaña Los Guaraníes – Formosa">
                      Cabaña Los Guaraníes – Formosa
                    </option>
                    <option value="Estancia San Cayetano – Corrientes">
                      Estancia San Cayetano – Corrientes
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="transferReason"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Motivo del traslado
                  </label>
                  <input
                    id="transferReason"
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Ej: Recría a pastizal bajo costa"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                  />
                </div>

                {/* AVISO REQUERIDO DE TRASLADO */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Aviso:</strong> El traslado es informativo; no
                    transfiere permisos ni reemplaza el DTE oficial de SENASA.
                  </span>
                </div>
              </div>
            )}

            {/* 6. Venta: comprador (texto corto, sin datos de contacto), aclaración "La venta no cierra la cadena." */}
            {selectedType === "venta" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="buyerName"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Comprador (Razón social / Nombre) *
                  </label>
                  <input
                    id="buyerName"
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Ej: Cabaña Don Pancho S.A."
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                    autoFocus
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    No incluyas números de teléfono, DNI ni datos de contacto
                    personales.
                  </span>
                </div>

                {/* ACLARACIÓN REQUERIDA DE VENTA */}
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Aclaración:</strong> La venta no cierra la cadena.
                    El nuevo titular podrá continuar registrando eventos en la
                    blockchain.
                  </span>
                </div>
              </div>
            )}

            {/* 7. Otro: descripción (máx. 140) */}
            {selectedType === "otro" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="otherDescription"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300"
                  >
                    Descripción del hecho (máx. 140 caracteres) *
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      otherDescription.length > 140
                        ? "text-rose-600 font-bold"
                        : "text-stone-400"
                    }`}
                  >
                    {otherDescription.length} / 140
                  </span>
                </div>
                <textarea
                  id="otherDescription"
                  rows={3}
                  maxLength={140}
                  required
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  placeholder="Detalle del evento técnico..."
                  className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                  autoFocus
                />
              </div>
            )}

            {/* Rectificación de hito previo */}
            {selectedType === "rectificacion" && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="rectifiesSeq"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Secuencia a rectificar *
                  </label>
                  <select
                    id="rectifiesSeq"
                    value={rectifiesSeq}
                    onChange={(e) =>
                      setRectifiesSeq(parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-mono text-stone-900 dark:text-stone-100"
                  >
                    {records.map((r) => (
                      <option key={r.seq} value={r.seq}>
                        Seq #{r.seq} — {r.type.toUpperCase()} (
                        {new Date(r.occurredAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rectificationReason"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Motivo y corrección del dato *
                  </label>
                  <textarea
                    id="rectificationReason"
                    rows={3}
                    required
                    value={rectificationReason}
                    onChange={(e) => setRectificationReason(e.target.value)}
                    placeholder="Explique el error corregido (ej: corrección de peso anotado por balanza)..."
                    className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* RESUMEN ANTES DE CONFIRMAR */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Resumen del Hito a Registrar
              </span>
              <div className="flex justify-between items-center text-stone-800 dark:text-stone-200 font-medium">
                <span>Tipo de evento:</span>
                <span className="font-bold text-[#2F6B3A] dark:text-emerald-400 capitalize">
                  {meta.label}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-800 dark:text-stone-200">
                <span>Fecha y hora declarada:</span>
                <span className="font-mono">
                  {new Date(occurredAt).toLocaleString("es-AR")}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-800 dark:text-stone-200">
                <span>Posición en blockchain:</span>
                <span className="font-mono font-semibold">
                  Secuencia #{records.length} (Anclada a Seq #
                  {records.length - 1})
                </span>
              </div>
            </div>

            {/* BOTÓN GRANDE "Registrar hito" */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-[#2F6B3A] hover:bg-[#26562f] active:bg-[#204527] text-white font-bold text-base shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registrando en Stellar…</span>
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Registrar hito</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
