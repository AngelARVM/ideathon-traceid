import type { ReactNode } from "react";

/**
 * Sección numerada de un formulario largo: título, descripción y campos en dos columnas. Con
 * `step`, se renderiza como `<fieldset>` de un wizard y solo se ve cuando es el paso actual.
 */
export function FormSection({
  n,
  title,
  description,
  step,
  children,
}: {
  n: number;
  title: string;
  description: string;
  step?: { index: number; current: number };
  children: ReactNode;
}) {
  const body = (
    <>
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-bold text-gray-900">
          {n}. {title}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
    </>
  );
  const card = "rounded-xl border border-gray-200 bg-white shadow-card";
  if (!step) return <section className={card}>{body}</section>;
  return (
    <fieldset
      data-step={step.index}
      className={`${card} ${step.index === step.current ? "" : "hidden"}`}
    >
      <legend className="sr-only">{title}</legend>
      {body}
    </fieldset>
  );
}
