import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-xs transition placeholder:text-gray-400 hover:border-brand-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15 aria-invalid:border-red-500 disabled:bg-gray-50 disabled:opacity-60";

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
      <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/** Input de texto o número con el estilo de los formularios. */
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${control} h-11 ${className}`} {...props} />;
}

/** Select nativo con el estilo de los formularios. */
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${control} h-11 ${className}`} {...props} />;
}

/** Área de texto con el estilo de los formularios. */
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
