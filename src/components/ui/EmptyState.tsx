import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

/** Estado vacío de una lista: ícono, título, descripción y acción opcional. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Inbox className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 font-bold text-gray-900">{title}</h2>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
