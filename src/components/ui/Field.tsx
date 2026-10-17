import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-campo-500 aria-invalid:border-red-500 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

/** Etiqueta, control, ayuda y error de un campo de formulario. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-stone-800 dark:text-stone-200"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-stone-500 dark:text-stone-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${control} h-11 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${control} h-11 ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  rows = 3,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={`${control} py-2.5 ${className}`}
      {...props}
    />
  );
}
