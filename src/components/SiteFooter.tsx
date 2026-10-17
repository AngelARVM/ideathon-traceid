import { ArrowRight, MapPin, Recycle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Category, Province } from "@/generated/prisma/enums";
import { CATEGORY_LABEL, PROVINCE_LABEL } from "@/lib/labels";

// Localidades del fixture por provincia (docs/00-mvp-spec.md §5).
const LOCALITIES: Record<Province, string> = {
  corrientes:
    "Corrientes, Bella Vista, Mercedes, Gdor. Virasoro, Santo Tomé, Paso de los Libres",
  misiones: "Posadas, Oberá, Eldorado, Montecarlo",
  chaco: "Resistencia, Pcia. Roque Sáenz Peña, Charata",
};

/** Footer global al estilo de codigo-ui, sin datos de contacto (D1). */
export function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 text-gray-300">
      <div className="bg-brand-600 px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="space-y-1 text-center md:text-left">
            <p className="flex items-center justify-center gap-2 text-base font-bold sm:text-lg md:justify-start">
              <Recycle className="h-5 w-5 text-emerald-300" aria-hidden />
              Bioeconomía circular del Nordeste Argentino
            </p>
            <p className="text-xs text-emerald-100 sm:text-sm">
              Conectamos a quienes generan subproductos agroindustriales con
              compradores cercanos.
            </p>
          </div>
          <Link
            href="/offers"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-brand-600 transition hover:bg-emerald-50"
          >
            Explorar materiales
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr]">
          <div className="space-y-3">
            <Logo inverted />
            <p className="max-w-sm text-xs leading-relaxed text-gray-400">
              Marketplace regional para comercializar y revalorizar subproductos
              agroindustriales de Corrientes, Misiones y Chaco.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-white">
              Subproductos
            </h2>
            <ul className="space-y-2 text-xs text-gray-400">
              {Object.values(Category).map((category) => (
                <li key={category}>
                  <Link
                    href={`/offers?category=${category}`}
                    className="transition-colors hover:text-emerald-400"
                  >
                    {CATEGORY_LABEL[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-white">
              Cuencas productivas
            </h2>
            <ul className="space-y-2 text-xs text-gray-400">
              {Object.values(Province).map((province) => (
                <li key={province}>
                  <span className="flex items-center gap-1.5 font-semibold text-gray-200">
                    <MapPin
                      className="h-3.5 w-3.5 text-emerald-400"
                      aria-hidden
                    />
                    {PROVINCE_LABEL[province]}
                  </span>
                  <span>{LOCALITIES[province]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-800 pt-6 text-xs text-gray-500 sm:flex-row">
          <span>SubMarket · Acuerdos entre empresas del NEA</span>
          <span>Entorno demostrativo · Precios y volúmenes ficticios</span>
        </div>
      </div>
    </footer>
  );
}
