"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";

export type NavItem = { href: string; label: string };

/** Drawer de navegación para mobile (el `Drawer` de codigo-ui), con los mismos enlaces del header. */
export function MobileNav({
  items,
  publish,
}: {
  items: NavItem[];
  publish: NavItem;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={close}
            className="absolute inset-0 bg-gray-900/40"
          />
          <nav
            aria-label="Menú"
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-1 bg-white p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
              <Link href="/" onClick={close} className="group">
                <Logo />
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar menú"
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <NavLink href="/" block onNavigate={close}>
              Inicio
            </NavLink>
            {items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                block
                onNavigate={close}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              href={publish.href}
              onClick={close}
              className="mt-2 rounded-md bg-brand-50 px-3 py-2 font-bold text-brand-700"
            >
              + {publish.label}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
