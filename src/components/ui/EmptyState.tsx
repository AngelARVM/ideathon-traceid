import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

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
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 px-6 py-12 text-center dark:border-stone-700">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-campo-50 text-campo-700 dark:bg-campo-950/60 dark:text-campo-300">
        <Inbox className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-stone-600 dark:text-stone-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
