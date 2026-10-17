"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Enlace de la navegación principal, resaltado cuando la ruta actual cae en su sección. */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition ${
        active
          ? "bg-campo-50 text-campo-800 dark:bg-campo-950/60 dark:text-campo-200"
          : "text-stone-600 hover:bg-stone-100 hover:text-campo-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-campo-300"
      }`}
    >
      {children}
    </Link>
  );
}
