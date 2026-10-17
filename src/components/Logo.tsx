/** Isotipo de SubMarket: una hoja con un ciclo de reaprovechamiento. */
export function LogoMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" />
      <path d="M5 19c3-4 6-7 10-10" />
      <circle
        cx="17.5"
        cy="17.5"
        r="2"
        className="fill-amber-400 stroke-none"
      />
    </svg>
  );
}

/** Marca completa: isotipo, nombre y tagline. */
export function Logo() {
  return (
    <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-campo-600 text-white shadow-md shadow-campo-950/15 transition-colors group-hover:bg-campo-700">
        <LogoMark className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-tight tracking-tight text-stone-950 dark:text-white">
          Sub<span className="text-campo-600 dark:text-campo-300">Market</span>
        </span>
        <span className="hidden truncate text-[11px] leading-none text-stone-500 dark:text-stone-400 sm:block">
          Lo que sobra, vale.
        </span>
      </span>
    </span>
  );
}
