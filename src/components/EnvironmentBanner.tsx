const label =
  process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ??
  "Stellar Testnet — entorno de demostración";

/** Aviso permanente: Testnet se reinicia y no conserva el historial (docs/07). */
export function EnvironmentBanner() {
  return (
    <aside
      aria-label="Aviso de entorno"
      className="bg-amber-50 dark:bg-stone-900 border-b border-amber-200 dark:border-amber-950/60 px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200"
    >
      <p className="max-w-5xl mx-auto">
        <span className="font-semibold">{label}.</span>{" "}
        <span className="text-amber-800/90 dark:text-amber-200/80">
          Los datos pueden perderse si la red se reinicia.
        </span>
      </p>
    </aside>
  );
}
