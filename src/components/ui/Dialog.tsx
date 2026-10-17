"use client";

import { X } from "lucide-react";
import { type ReactNode, useRef } from "react";

const triggerTone = {
  primary: "bg-brand-600 text-white shadow-xs hover:bg-brand-700",
  secondary:
    "border border-gray-200 bg-white text-gray-800 shadow-xs hover:border-brand-300 hover:text-brand-700",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

/**
 * Confirmación con `<dialog>` nativo. `children` son las acciones (por ejemplo, un `<form>`
 * con su botón de envío); el botón "Cancelar" lo agrega el diálogo.
 */
export function Dialog({
  trigger,
  triggerVariant = "secondary",
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  triggerVariant?: keyof typeof triggerTone;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition sm:text-sm ${triggerTone[triggerVariant]}`}
      >
        {trigger}
      </button>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: el clic en el fondo es un atajo; con teclado, `<dialog>` ya cierra con Escape. */}
      <dialog
        ref={ref}
        aria-label={title}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-gray-200 bg-white p-0 text-gray-800 shadow-xl backdrop:bg-gray-900/40"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {description && (
            <div className="mt-2 text-sm text-gray-600">{description}</div>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            {children}
          </div>
        </div>
      </dialog>
    </>
  );
}
