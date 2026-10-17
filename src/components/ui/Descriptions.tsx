import type { ReactNode } from "react";

export type DescriptionItem = { label: string; value: ReactNode };

/** Lista de etiqueta y valor (ficha técnica, términos). Omite los ítems con valor `null`. */
export function Descriptions({
  items,
  columns = 2,
}: {
  items: (DescriptionItem | null | false)[];
  columns?: 1 | 2;
}) {
  const visible = items.filter(
    (i): i is DescriptionItem => !!i && i.value != null,
  );
  return (
    <dl
      className={`grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-sm ${
        columns === 2 ? "sm:grid-cols-2" : ""
      }`}
    >
      {visible.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-0.5 bg-white px-4 py-3"
        >
          <dt className="text-xs font-medium text-gray-500">{item.label}</dt>
          <dd className="font-semibold text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
