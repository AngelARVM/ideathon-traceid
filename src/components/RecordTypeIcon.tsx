import {
  Building2,
  FileText,
  Handshake,
  PenLine,
  Pill,
  Scale,
  Skull,
  Syringe,
  Tag,
  Truck,
  Wheat,
} from "lucide-react";
import type { RecordType } from "@/generated/prisma/enums";

const types = {
  registration: {
    icon: Tag,
    color: "bg-campo-100 text-campo-700 dark:bg-campo-950 dark:text-campo-300",
  },
  weighing: {
    icon: Scale,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  vaccination: {
    icon: Syringe,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  deworming: {
    icon: Pill,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  feeding: {
    icon: Wheat,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  movement: {
    icon: Truck,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  sale: {
    icon: Handshake,
    color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
  slaughterhouse_delivery: {
    icon: Building2,
    color: "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
  },
  death: {
    icon: Skull,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  other: {
    icon: FileText,
    color: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  },
  rectification: {
    icon: PenLine,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
} as const satisfies Record<RecordType, { icon: typeof Tag; color: string }>;

export function RecordTypeIcon({
  type,
  className = "",
}: {
  type: RecordType;
  className?: string;
}) {
  const entry = types[type];
  const Icon = entry.icon;
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entry.color} ${className}`}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}
