import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type TagTone = "brand" | "amber" | "blue" | "red" | "gray" | "cyan";

const tones: Record<TagTone, string> = {
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  red: "border-red-200 bg-red-50 text-red-700",
  gray: "border-gray-200 bg-gray-50 text-gray-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

/** Etiqueta chica. Con `removeHref` es un filtro activo que se quita al hacer clic. */
export function Tag({
  tone = "gray",
  icon,
  removeHref,
  className = "",
  children,
}: {
  tone?: TagTone;
  icon?: ReactNode;
  removeHref?: string;
  className?: string;
  children: ReactNode;
}) {
  const classes = `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`;
  if (removeHref) {
    return (
      <Link
        href={removeHref}
        className={`${classes} transition hover:border-brand-300`}
        aria-label={`Quitar filtro: ${typeof children === "string" ? children : ""}`}
      >
        {icon}
        {children}
        <X className="h-3 w-3" aria-hidden />
      </Link>
    );
  }
  return (
    <span className={classes}>
      {icon}
      {children}
    </span>
  );
}
