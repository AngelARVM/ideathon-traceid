export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 px-4 py-4 text-xs text-stone-600 dark:border-stone-800 dark:text-stone-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1.5 sm:flex-row">
        <p>
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            TraceID
          </span>{" "}
          · Trazabilidad bovina individual (NEA)
        </p>
        <p className="font-mono-num text-[11px]">
          Entorno de demostración · registros locales
        </p>
      </div>
    </footer>
  );
}
