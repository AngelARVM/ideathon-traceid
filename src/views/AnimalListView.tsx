"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ArrowRight,
  ChevronRight,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRecordTypeMeta } from "@/components/StatusBadge";
import {
  getAvailableEstablishments,
  getAvailableLots,
  listAnimals,
} from "@/lib/traceApi";
import type { Animal, AnimalFilters, AnimalStatus } from "@/lib/types";

interface AnimalListViewProps {
  onRefreshTrigger?: number;
}

export const AnimalListView: React.FC<AnimalListViewProps> = ({
  onRefreshTrigger,
}) => {
  const router = useRouter();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstablishment, setSelectedEstablishment] =
    useState<string>("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedLot, setSelectedLot] = useState<string>("todos");
  // Filtros colapsados por defecto (no deben costar un toque en el caso común)
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modal para Escanear / Pegar QR
  const [showQrScanModal, setShowQrScanModal] = useState(false);
  const [pastedQrValue, setPastedQrValue] = useState("");
  const [qrScanError, setQrScanError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Foco automático en el campo de búsqueda al entrar
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  // Carga de animales
  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const filters: AnimalFilters = {};
      if (selectedEstablishment !== "todos")
        filters.establishment = selectedEstablishment;
      if (selectedStatus !== "todos")
        filters.status = selectedStatus as AnimalStatus;
      if (selectedLot !== "todos") filters.lot = selectedLot;

      const data = await listAnimals(searchQuery, filters);
      setAnimals(data);
    } catch {
      // Manejado
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, [
    searchQuery,
    selectedEstablishment,
    selectedStatus,
    selectedLot,
    onRefreshTrigger,
  ]);

  const establishments = useMemo(() => getAvailableEstablishments(), [animals]);
  const lots = useMemo(
    () =>
      getAvailableLots(
        selectedEstablishment === "todos" ? undefined : selectedEstablishment,
      ),
    [animals, selectedEstablishment],
  );

  const activeFiltersCount =
    (selectedEstablishment !== "todos" ? 1 : 0) +
    (selectedStatus !== "todos" ? 1 : 0) +
    (selectedLot !== "todos" ? 1 : 0);

  // Manejo de pegado / escaneo de QR
  const handleResolveQr = () => {
    setQrScanError(null);
    const raw = pastedQrValue.trim();
    if (!raw) {
      setQrScanError(
        "Por favor pegue un enlace o identificador de caravana/ULID.",
      );
      return;
    }

    // Si pegaron una URL completa como https://.../#/a/01JH8V9B7C1D...
    const urlMatch =
      raw.match(/\/#\/a\/([^/?#]+)/) || raw.match(/\/a\/([^/?#]+)/);
    const targetId = urlMatch ? urlMatch[1] : raw;

    // Buscar si existe en la base o ir directo
    const found = animals.find(
      (a) =>
        a.id.toLowerCase() === targetId.toLowerCase() ||
        a.officialId.toLowerCase().replace(/\s+/g, "") ===
          targetId.toLowerCase().replace(/\s+/g, "") ||
        a.previousOfficialIds.some(
          (p) =>
            p.toLowerCase().replace(/\s+/g, "") ===
            targetId.toLowerCase().replace(/\s+/g, ""),
        ),
    );

    if (found) {
      setShowQrScanModal(false);
      setPastedQrValue("");
      router.push(`/animals/${found.id}`);
    } else {
      // Intentar navegar con el targetId directo
      setShowQrScanModal(false);
      setPastedQrValue("");
      router.push(`/animals/${targetId}`);
    }
  };

  return (
    <div className="pb-28 sm:pb-16 max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Rodeo y Trazabilidad</span>
            {!loading && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {animals.length} cabezas
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Establecimientos NEA · Registro operativo anclado en Stellar Testnet
          </p>
        </div>

        {/* Acciones superiores para tablet / desktop */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQrScanModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-semibold text-xs shadow-xs transition"
          >
            <QrCode className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
            <span>Escanear QR</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/animals/new")}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2F6B3A] hover:bg-[#26562f] text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo animal</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda con foco automático y botón de filtros colapsados */}
      <div className="mb-3 space-y-2">
        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por caravana o ID"
            className="w-full h-12 pl-11 pr-24 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2F6B3A] transition"
          />
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 pointer-events-none" />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition ${
                filtersOpen || activeFiltersCount > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-[#2F6B3A] dark:text-emerald-400 font-semibold"
                  : "bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#2F6B3A] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filtros colapsados por defecto (desplegables sin bloquear el flujo principal) */}
        {filtersOpen && (
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shadow-xs animate-in fade-in duration-150">
            {/* Estado */}
            <div>
              <label className="block text-stone-500 dark:text-stone-400 font-semibold mb-1">
                Estado de la Cadena
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2F6B3A]"
              >
                <option value="todos">Todos los estados</option>
                <option value="abierta">Abierta (En producción)</option>
                <option value="cerrada">
                  Cerrada (Faena / Venta / Muerte)
                </option>
              </select>
            </div>

            {/* Lote */}
            <div>
              <label className="block text-stone-500 dark:text-stone-400 font-semibold mb-1">
                Lote o Potrero
              </label>
              <select
                value={selectedLot}
                onChange={(e) => setSelectedLot(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2F6B3A]"
              >
                <option value="todos">Todos los lotes</option>
                {lots.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Establecimiento */}
            <div>
              <label className="block text-stone-500 dark:text-stone-400 font-semibold mb-1">
                Establecimiento
              </label>
              <select
                value={selectedEstablishment}
                onChange={(e) => setSelectedEstablishment(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#2F6B3A]"
              >
                <option value="todos">Todos los establecimientos</option>
                {establishments.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <div className="sm:col-span-3 pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEstablishment("todos");
                    setSelectedStatus("todos");
                    setSelectedLot("todos");
                  }}
                  className="text-xs text-[#2F6B3A] dark:text-emerald-400 hover:underline font-semibold"
                >
                  Limpiar filtros activos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resultados / Skeletons / Estado Vacío */}
      {loading ? (
        /* Skeletons de carga */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
                  <div className="h-6 w-36 bg-stone-200 dark:bg-stone-800 rounded" />
                </div>
                <div className="h-6 w-20 bg-stone-200 dark:bg-stone-800 rounded-full" />
              </div>
              <div className="h-14 bg-stone-100 dark:bg-stone-800/60 rounded-xl" />
              <div className="h-4 bg-stone-100 dark:bg-stone-800/60 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : animals.length === 0 ? (
        /* Estado vacío amable */
        <div className="py-16 text-center bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-8 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2F6B3A] dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <Tag className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
            No se encontraron animales con ese criterio
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 leading-relaxed">
            {searchQuery
              ? `No hay coincidencias para "${searchQuery}". Verifique los dígitos de la caravana o el ID.`
              : "No hay animales registrados con los filtros seleccionados actualmente."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(searchQuery || activeFiltersCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedEstablishment("todos");
                  setSelectedStatus("todos");
                  setSelectedLot("todos");
                  searchInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Limpiar búsqueda y filtros</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/animals/new")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2F6B3A] text-white hover:bg-[#26562f] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar nuevo animal</span>
            </button>
          </div>
        </div>
      ) : (
        /* Tarjetas de animales según especificaciones */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {animals.map((animal) => {
            const lastMeta = animal.lastRecordType
              ? getRecordTypeMeta(animal.lastRecordType)
              : null;
            const LastIcon = lastMeta?.icon;

            return (
              <div
                key={animal.id}
                onClick={() => router.push(`/animals/${animal.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    router.push(`/animals/${animal.id}`);
                  }
                }}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs hover:shadow-md hover:border-[#2F6B3A]/50 dark:hover:border-emerald-600/50 transition cursor-pointer flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
              >
                <div>
                  {/* Encabezado: Identificador oficial grande en monoespaciada + Chip de estado */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block">
                        Caravana Oficial
                      </span>
                      {/* Identificador oficial grande en monoespaciada */}
                      <span className="font-mono-num text-xl font-bold tracking-tight text-stone-950 dark:text-white">
                        {animal.officialId}
                      </span>
                    </div>

                    {/* Chip de estado: Abierta verde / Cerrada gris */}
                    {animal.status === "abierta" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        Abierta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-stone-400" />
                        Cerrada
                      </span>
                    )}
                  </div>

                  {/* Lote y Establecimiento */}
                  <div className="space-y-1 text-xs text-stone-600 dark:text-stone-300 mb-3 bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200 font-semibold truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#2F6B3A] dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{animal.establishment}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 pl-5">
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {animal.lot}
                      </span>
                      {animal.category && (
                        <span className="text-[11px]">
                          {animal.category} · {animal.breed || "Cruza"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Último hito con ícono */}
                  <div className="flex items-center justify-between text-xs py-1.5 border-t border-stone-100 dark:border-stone-800/80 text-stone-600 dark:text-stone-300">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      {LastIcon && (
                        <LastIcon className="w-3.5 h-3.5 text-[#2F6B3A] dark:text-emerald-400 shrink-0" />
                      )}
                      <span className="truncate">
                        Último hito:{" "}
                        <strong className="font-semibold text-stone-800 dark:text-stone-100">
                          {lastMeta?.label || "Alta Oficial"}
                        </strong>
                      </span>
                    </span>
                    <span className="font-mono-num text-[11px] text-stone-400 shrink-0">
                      {animal.recordCount} hito
                      {animal.recordCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Pie de tarjeta con acceso */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-mono text-[10px]">
                    ID: {animal.id.slice(0, 10)}…
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#2F6B3A] dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Ver ficha operativa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTÓN FLOTANTE FIJO "+ Nuevo animal" (Mobile y Desktop) */}
      <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-20 safe-bottom">
        <button
          type="button"
          onClick={() => router.push("/animals/new")}
          className="h-14 px-5 rounded-2xl bg-[#2F6B3A] hover:bg-[#26562f] active:bg-[#204527] text-white font-bold text-sm shadow-xl shadow-emerald-950/30 flex items-center gap-2.5 transition active:scale-[0.98] group"
        >
          <Plus className="w-5 h-5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
          <span>+ Nuevo animal</span>
        </button>
      </div>

      {/* MODAL ESCANEAR / PEGAR QR */}
      {showQrScanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-md w-full rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2F6B3A] dark:text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Escanear / Identificar QR
                  </h3>
                  <p className="text-xs text-stone-500">
                    Pegue el enlace del código QR o el identificador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowQrScanModal(false);
                  setQrScanError(null);
                }}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrScanError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                {qrScanError}
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  URL o Identificador leído por cámara
                </label>
                <textarea
                  rows={2}
                  value={pastedQrValue}
                  onChange={(e) => setPastedQrValue(e.target.value)}
                  placeholder="Pegue aquí (ej: https://.../a/01JH8V9B... o caravana 032 01 000012345)"
                  className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2F6B3A]"
                  autoFocus
                />
              </div>

              {/* Botones de prueba rápida con los animales mock */}
              <div>
                <span className="text-[11px] text-stone-400 block mb-1">
                  Muestras de prueba:
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPastedQrValue("032 01 000012345")}
                    className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-mono"
                  >
                    032 01 000012345 (Cerrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPastedQrValue("0012 34567")}
                    className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-mono"
                  >
                    0012 34567 (Rectificada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPastedQrValue("0045 00921")}
                    className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-mono"
                  >
                    0045 00921 (Hito Fallido)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowQrScanModal(false);
                  setQrScanError(null);
                }}
                className="w-1/3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResolveQr}
                className="w-2/3 py-2.5 rounded-xl bg-[#2F6B3A] hover:bg-[#26562f] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Ir al Animal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
