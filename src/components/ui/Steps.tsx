import { Check } from "lucide-react";

/** Indicador de pasos de un wizard. Con `onSelect` (desde un Client Component) los pasos son botones. */
export function Steps({
  steps,
  current,
  invalid = [],
  onSelect,
}: {
  steps: string[];
  current: number;
  invalid?: number[];
  onSelect?: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((title, i) => {
        const done = i < current;
        const active = i === current;
        const error = invalid.includes(i);
        const circle = error
          ? "border-red-500 bg-red-50 text-red-600"
          : active
            ? "border-brand-600 bg-brand-600 text-white"
            : done
              ? "border-brand-600 bg-white text-brand-600"
              : "border-gray-300 bg-white text-gray-400";
        const content = (
          <>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${circle}`}
            >
              {done && !error ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={`hidden text-sm font-semibold md:inline ${
                active ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {title}
            </span>
          </>
        );
        return (
          <li
            key={title}
            className="flex min-w-0 flex-1 items-center gap-2 last:flex-none"
            aria-current={active ? "step" : undefined}
          >
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(i)}
                className="flex items-center gap-2"
              >
                {content}
                <span className="sr-only md:hidden">{title}</span>
              </button>
            ) : (
              <span className="flex items-center gap-2">{content}</span>
            )}
            {i < steps.length - 1 && (
              <span
                className={`h-0.5 min-w-4 flex-1 rounded ${
                  done ? "bg-brand-600" : "bg-gray-200"
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
