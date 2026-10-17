import Link from "next/link";
import type { ReactNode } from "react";

export type TabItem = {
  key: string;
  label: ReactNode;
  href: string;
  count?: number;
};

/** Pestañas como enlaces (`?tab=`): sin estado de cliente. `active` es la clave seleccionada. */
export function Tabs({
  items,
  active,
  label,
}: {
  items: TabItem[];
  active: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-gray-200"
    >
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              selected
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold ${
                  selected
                    ? "bg-brand-50 text-brand-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
