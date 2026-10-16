/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  createAnimal,
  getAvailableEstablishments,
  getAvailableLots,
} from '../services/traceApi';
import { navigateTo } from '../router';
import { showToast } from '../components/Toast';
import {
  ArrowLeft,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
  Calendar,
  Wheat,
} from 'lucide-react';

interface NewAnimalViewProps {
  onCreated?: () => void;
}

// Validación de formatos conocidos de caravanas en Argentina:
// Formato A: 15 dígitos continuos o agrupados (código país 032 + 2 dígitos provincia/oficina + 10 dígitos)
// Formato B: 9–10 dígitos en dos bloques (ej: 0012 34567 o 0045 00921)
function checkOfficialIdFormat(id: string): boolean {
  const clean = id.trim().replace(/[\s\-_/]/g, '');
  if (!clean) return true; // Si está vacío aún no advertir

  // Solo dígitos
  if (!/^\d+$/.test(clean)) return false;

  // 15 dígitos
  if (clean.length === 15) return true;

  // 9 o 10 dígitos en dos bloques
  if (clean.length === 9 || clean.length === 10) return true;

  return false;
}

export const NewAnimalView: React.FC<NewAnimalViewProps> = ({ onCreated }) => {
  const establishments = useMemo(() => getAvailableEstablishments(), []);
  const todayStr = new Date().toISOString().split('T')[0];

  const [establishment, setEstablishment] = useState(
    establishments[0] || 'La Esperanza – Corrientes'
  );
  const [lot, setLot] = useState('Lote 1 – Pastura Brachiaria');
  const [officialId, setOfficialId] = useState('');
  const [identificationDate, setIdentificationDate] = useState(todayStr);
  const [birthDate, setBirthDate] = useState('');
  const [baseDiet, setBaseDiet] = useState('Pastura Brachiaria + Suplementación mineral');
  const [notes, setNotes] = useState('');

  // Estado de envío y progreso
  const [submitting, setSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Validación no bloqueante del identificador oficial
  const isFormatRecognized = useMemo(() => {
    if (!officialId.trim()) return true;
    return checkOfficialIdFormat(officialId);
  }, [officialId]);

  const lots = useMemo(
    () => getAvailableLots(establishment),
    [establishment]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOfficialId = officialId.trim();
    if (!cleanOfficialId) {
      setError('El identificador oficial (caravana) es obligatorio.');
      return;
    }

    if (!baseDiet.trim()) {
      setError('La dieta base es obligatoria.');
      return;
    }

    if (notes.length > 280) {
      setError('Las notas no pueden superar los 280 caracteres.');
      return;
    }

    // Iniciar pantalla de progreso "Registrando en Stellar…"
    setSubmitting(true);
    setProgressStep(1);

    const stepTimer1 = setTimeout(() => setProgressStep(2), 700);
    const stepTimer2 = setTimeout(() => setProgressStep(3), 1500);

    try {
      const created = await createAnimal({
        officialId: cleanOfficialId,
        establishment,
        lot,
        identificationDate,
        birthDate: birthDate.trim() || undefined,
        baseDiet: baseDiet.trim(),
        notes: notes.trim() || undefined,
      });

      if (onCreated) onCreated();
      showToast('Animal registrado en Stellar');

      // Breve pausa para mostrar confirmación visual antes de redirigir
      setTimeout(() => {
        navigateTo(`/animales/${created.id}`);
      }, 500);
    } catch (err: unknown) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSubmitting(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al registrar el animal en Stellar.');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Retorno */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigateTo('/animales')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Rodeo</span>
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-8 shadow-xs">
        {/* Encabezado del Formulario */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-2 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Génesis Inmutable en Stellar Testnet</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            Nuevo Animal
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Alta inicial de caravana individual para el rodeo del nordeste argentino.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Identificador oficial con validación NO bloqueante */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="officialId"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300"
              >
                Identificador oficial (Caravana) *
              </label>

              {/* Badge ámbar no bloqueante si el formato no es reconocido */}
              {!isFormatRecognized && officialId.trim() && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Formato no reconocido
                </span>
              )}
            </div>

            <input
              id="officialId"
              type="text"
              inputMode="numeric"
              required
              value={officialId}
              onChange={(e) => setOfficialId(e.target.value)}
              placeholder="Ej: 032 01 000012345 o 0012 34567"
              className={`w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border font-mono-num text-lg font-bold text-stone-900 dark:text-stone-100 focus:outline-none transition ${
                !isFormatRecognized && officialId.trim()
                  ? 'border-amber-400 dark:border-amber-600 focus:ring-2 focus:ring-amber-500'
                  : 'border-stone-300 dark:border-stone-700 focus:ring-2 focus:ring-[#2F6B3A]'
              }`}
              autoFocus
            />

            <p className="mt-1.5 text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
              Conserva ceros iniciales. Formatos estándar: 15 dígitos (CUIG oficial), o 9–10 dígitos en dos bloques. Si el formato no coincide, puedes continuar igualmente.
            </p>
          </div>

          {/* 2. Establecimiento y Lote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="establishment"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Establecimiento *
              </label>
              <select
                id="establishment"
                value={establishment}
                onChange={(e) => {
                  setEstablishment(e.target.value);
                  const newLots = getAvailableLots(e.target.value);
                  if (newLots.length > 0) setLot(newLots[0]);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#2F6B3A]"
              >
                {establishments.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="lot"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Lote o Potrero *
              </label>
              <select
                id="lot"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#2F6B3A]"
              >
                {lots.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
                {!lots.includes('Lote 1 – Pastura Brachiaria') && (
                  <option value="Lote 1 – Pastura Brachiaria">Lote 1 – Pastura Brachiaria</option>
                )}
                {!lots.includes('Lote 4 – Invernada') && (
                  <option value="Lote 4 – Invernada">Lote 4 – Invernada</option>
                )}
              </select>
            </div>
          </div>

          {/* 3. Fechas: Identificación (hoy por defecto) y Nacimiento (declarada) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="identificationDate"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Fecha de identificación *
              </label>
              <input
                id="identificationDate"
                type="date"
                required
                value={identificationDate}
                onChange={(e) => setIdentificationDate(e.target.value)}
                max={todayStr}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#2F6B3A]"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Fecha en la que se colocó la caravana en la manga.
              </span>
            </div>

            <div>
              <label
                htmlFor="birthDate"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Fecha de nacimiento <span className="font-normal text-stone-400">(declarada, opcional)</span>
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={todayStr}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#2F6B3A]"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Estimada o asentada en el libro de pariciones.
              </span>
            </div>
          </div>

          {/* 4. Dieta base (obligatoria, texto corto) */}
          <div>
            <label
              htmlFor="baseDiet"
              className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
            >
              Dieta base *
            </label>
            <input
              id="baseDiet"
              type="text"
              required
              value={baseDiet}
              onChange={(e) => setBaseDiet(e.target.value)}
              placeholder="Ej: Pastizal natural / Brachiaria Brizantha + sales minerales"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
            />
            {/* Opciones rápidas */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Pastizal natural NEA',
                'Brachiaria Brizantha',
                'Pasto Gatton Panic',
                'Pastura + Grano diferido',
              ].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setBaseDiet(opt)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 transition"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Notas opcionales (máx. 280 caracteres) con aviso de privacidad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="notes"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300"
              >
                Notas opcionales
              </label>
              <span
                className={`text-[11px] font-mono ${
                  notes.length > 280
                    ? 'text-rose-600 font-bold'
                    : 'text-stone-400'
                }`}
              >
                {notes.length} / 280
              </span>
            </div>

            <textarea
              id="notes"
              rows={3}
              maxLength={280}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones iniciales del animal..."
              className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
            />

            {/* Aviso obligatorio */}
            <div className="mt-1.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400">
              <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
              <span>
                <strong>Aviso:</strong> No incluyas datos personales: esta información será pública en el historial criptográfico de Stellar.
              </span>
            </div>
          </div>

          {/* Botón de envío grande al alcance del pulgar */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting || !officialId.trim() || !baseDiet.trim()}
              className="w-full h-14 rounded-2xl bg-[#2F6B3A] hover:bg-[#26562f] active:bg-[#204527] text-white font-bold text-base shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>Registrar y Anclar en Stellar Testnet</span>
            </button>
          </div>
        </form>
      </div>

      {/* PANTALLA DE PROGRESO AL ENVIAR: "Registrando en Stellar…" */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 text-center border border-stone-200 dark:border-stone-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-[#2F6B3A]/20 border-t-[#2F6B3A] rounded-full animate-spin" />
              <Layers className="w-6 h-6 text-[#2F6B3A] dark:text-emerald-400 absolute inset-0 m-auto" />
            </div>

            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              Registrando en Stellar…
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              Generando bloque génesis y anclando hash en la red Testnet
            </p>

            <div className="space-y-2.5 text-xs text-left border-t border-stone-100 dark:border-stone-800 pt-4">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cálculo de hash SHA-256 de caravana</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                {progressStep >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                <span>Firma de transacción Soroban</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                {progressStep >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-4 h-4 border-2 border-stone-300 rounded-full shrink-0" />
                )}
                <span>Consenso y confirmación en ledger</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
