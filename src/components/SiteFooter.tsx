export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 px-4 py-4 text-xs text-stone-600 dark:border-stone-800 dark:text-stone-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1.5 sm:flex-row">
        <p>
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            SubMarket
          </span>{" "}
          · Subproductos agroindustriales del NEA
        </p>
        <p>Entorno demostrativo · Precios y volúmenes ficticios</p>
      </div>
    </footer>
  );
}
