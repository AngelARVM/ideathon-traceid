/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AnimalStatus,
  RecordStatus,
  VerificationState,
  RecordType,
} from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Syringe,
  Pill,
  Wheat,
  Truck,
  DollarSign,
  Building2,
  Skull,
  HelpCircle,
  FileCheck2,
  History,
  Lock,
  Unlock,
} from 'lucide-react';

interface StatusBadgeProps {
  status: AnimalStatus | RecordStatus | VerificationState;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'abierta':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${sizeClasses}`}
        >
          <Unlock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Cadena Abierta
        </span>
      );
    case 'cerrada':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700 ${sizeClasses}`}
        >
          <Lock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Cadena Cerrada
        </span>
      );
    case 'confirmado':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 ${sizeClasses}`}
        >
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Anclado en Ledger
        </span>
      );
    case 'pendiente':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${sizeClasses}`}
        >
          <Clock className={`animate-pulse ${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          Pendiente (Mempool)
        </span>
      );
    case 'fallido':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 ${sizeClasses}`}
        >
          <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Fallo de Anclaje
        </span>
      );
    case 'verificado':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700 ${sizeClasses}`}
        >
          <ShieldCheck className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Verificado en Stellar
        </span>
      );
    case 'falla_integridad':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-400 dark:border-rose-700 ${sizeClasses}`}
        >
          <ShieldAlert className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Falla de Integridad
        </span>
      );
    case 'no_verificable':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-400 dark:border-amber-700 ${sizeClasses}`}
        >
          <Clock className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          No Verificable (Pendiente)
        </span>
      );
    default:
      return null;
  }
};

export const getRecordTypeMeta = (type: RecordType) => {
  switch (type) {
    case 'alta':
      return {
        label: 'Alta Oficial',
        icon: FileCheck2,
        colorClass: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
      };
    case 'pesaje':
      return {
        label: 'Pesaje',
        icon: Scale,
        colorClass: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800',
      };
    case 'vacunacion':
      return {
        label: 'Vacunación',
        icon: Syringe,
        colorClass: 'text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
      };
    case 'desparasitacion':
      return {
        label: 'Desparasitación',
        icon: Pill,
        colorClass: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
      };
    case 'alimentacion':
      return {
        label: 'Alimentación',
        icon: Wheat,
        colorClass: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
      };
    case 'traslado':
      return {
        label: 'Traslado de Lote',
        icon: Truck,
        colorClass: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      };
    case 'venta':
      return {
        label: 'Venta',
        icon: DollarSign,
        colorClass: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
      };
    case 'entrega_frigorifico':
      return {
        label: 'Entrega a Frigorífico',
        icon: Building2,
        colorClass: 'text-stone-800 bg-stone-100 dark:text-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-600',
      };
    case 'muerte':
      return {
        label: 'Baja / Muerte',
        icon: Skull,
        colorClass: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/50 border-red-200 dark:border-red-800',
      };
    case 'rectificacion':
      return {
        label: 'Rectificación',
        icon: History,
        colorClass: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
      };
    case 'otro':
    default:
      return {
        label: 'Hito Técnico',
        icon: HelpCircle,
        colorClass: 'text-stone-700 bg-stone-50 dark:text-stone-300 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
      };
  }
};
