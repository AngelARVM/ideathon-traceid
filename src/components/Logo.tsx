/** Isotipo de SubMarket: el símbolo de reciclaje de codigo-ui. */
export function LogoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.2a1.8 1.8 0 0 0 1.5-2.6l-3.9-6.9" />
      <path d="m15.5 4.8 2.3 4H10.6" />
      <path d="m4.5 14.5 2.5 4.5 5-2" />
      <path d="M20 14.5 17.5 19l-5-2" />
      <path d="M11 3.5 8.5 8h5.5" />
    </svg>
  );
}

/** Marca completa: isotipo, "subMarket" y la tagline. `inverted` es para fondos oscuros. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex min-w-0 select-none items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-emerald-200 shadow-xs transition-colors group-hover:bg-brand-700">
        <LogoMark className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-baseline leading-none">
          <span
            className={`text-xl font-light tracking-tight ${inverted ? "text-gray-200" : "text-gray-800"}`}
          >
            sub
          </span>
          <span
            className={`text-xl font-extrabold tracking-tight ${inverted ? "text-emerald-400" : "text-brand-600"}`}
          >
            Market
          </span>
        </span>
        <span
          className={`mt-0.5 truncate text-[10px] font-medium tracking-tight ${inverted ? "text-gray-400" : "text-gray-500"}`}
        >
          Lo que sobra, vale.
        </span>
      </span>
    </span>
  );
}
