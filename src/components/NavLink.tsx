"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Enlace de la navegación principal, resaltado cuando la ruta actual cae en su sección. */
export function NavLink({
  href,
  children,
  onNavigate,
  block = false,
}: {
  href: string;
  children: ReactNode;
  onNavigate?: () => void;
  block?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const look = block
    ? `flex items-center justify-between rounded-md px-3 py-2 ${active ? "bg-brand-50 font-bold text-brand-700" : "font-medium text-gray-700 hover:bg-gray-100"}`
    : `relative inline-flex shrink-0 items-center gap-1.5 text-sm transition-colors ${active ? "font-bold text-brand-600" : "font-medium text-gray-700 hover:text-gray-900"}`;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={look}
    >
      {children}
    </Link>
  );
}
