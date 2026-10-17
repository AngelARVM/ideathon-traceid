"use client";

import { Calculator } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatArs } from "@/lib/format";

/** Acepta "1.234,5" o "1234.5", como `parseTons`. */
const toNumber = (s: string) =>
  Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);

/**
 * Calculadora de carga: Tn × precio de referencia, solo en el cliente y sin flete. El total es
 * referencial; el precio se negocia en la propuesta. `proposeHref` es `null` si no se puede proponer.
 */
export function LoadCalculator({
  pricePerTon,
  stockTons,
  proposeHref,
}: {
  pricePerTon: string | null;
  stockTons: string;
  proposeHref: string | null;
}) {
  const stock = Number(stockTons);
  const [tons, setTons] = useState(() =>
    String(Math.min(stock, 30) || "").replace(".", ","),
  );
  const value = toNumber(tons);
  const valid = Number.isFinite(value) && value > 0;
  const total = valid && pricePerTon ? value * Number(pricePerTon) : null;

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-gray-200 bg-slate-50 p-3.5 text-xs">
        <label
          htmlFor="calc-tons"
          className="flex items-center gap-1.5 font-bold text-gray-800"
        >
          <Calculator className="h-4 w-4 text-brand-600" aria-hidden />
          Calculadora de carga
        </label>
        <div className="flex items-center gap-2">
          <input
            id="calc-tons"
            inputMode="decimal"
            value={tons}
            onChange={(e) => setTons(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
            aria-describedby="calc-help"
          />
          <span className="shrink-0 font-semibold text-gray-600">Tn</span>
        </div>
        {valid && value > stock && (
          <p className="text-amber-700">Supera el stock publicado.</p>
        )}
        <div className="flex items-center justify-between border-t border-gray-200 pt-2">
          <span className="text-gray-500">Total referencial</span>
          <span className="font-mono-num text-base font-extrabold text-brand-600">
            {total !== null ? formatArs(total) : "—"}
          </span>
        </div>
        <p id="calc-help" className="text-[11px] text-gray-400">
          {pricePerTon
            ? "Tn × precio de referencia. No incluye flete; el precio final se acuerda en la propuesta."
            : "Precio a convenir: el total se acuerda en la propuesta."}
        </p>
      </div>
      {proposeHref && (
        <Link
          href={proposeHref}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-xs transition hover:bg-brand-700"
        >
          Proponer compra
        </Link>
      )}
    </div>
  );
}
