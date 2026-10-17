import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LinkButton } from "@/components/ui/Button";
import type { Role } from "@/generated/prisma/enums";
import { getPersona } from "@/lib/persona";

// Navegación por rol (docs/00-mvp-spec.md §10).
const NAV: Record<Role, { href: string; label: string }[]> = {
  seller: [
    { href: "/offers", label: "Explorar" },
    { href: "/demands", label: "Demandas" },
    { href: "/my-offers", label: "Mis ofertas" },
    { href: "/proposals", label: "Propuestas" },
    { href: "/agreements", label: "Acuerdos" },
  ],
  buyer: [
    { href: "/offers", label: "Explorar" },
    { href: "/demands", label: "Demandas" },
    { href: "/my-demands", label: "Mis demandas" },
    { href: "/proposals", label: "Propuestas" },
    { href: "/agreements", label: "Acuerdos" },
  ],
};

const PUBLISH: Record<Role, { href: string; label: string }> = {
  seller: { href: "/offers/new", label: "Publicar oferta" },
  buyer: { href: "/demands/new", label: "Publicar demanda" },
};

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          href="/"
          className="group min-w-0"
          aria-label="SubMarket, ir al inicio"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* La persona se lee de la cookie por request: queda fuera del shell estático. */}
          <Suspense fallback={<div className="h-10 w-40" />}>
            <PersonaActions />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
      <Suspense fallback={null}>
        <RoleNav />
      </Suspense>
    </header>
  );
}

async function PersonaActions() {
  const persona = await getPersona();
  if (!persona) {
    return (
      <LinkButton href="/" size="sm">
        Elegir persona
      </LinkButton>
    );
  }
  const publish = PUBLISH[persona.role];
  return (
    <>
      <LinkButton
        href={publish.href}
        size="sm"
        className="hidden sm:inline-flex"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {publish.label}
      </LinkButton>
      <PersonaSwitcher persona={persona} />
    </>
  );
}

async function RoleNav() {
  const persona = await getPersona();
  if (!persona) return null;
  const publish = PUBLISH[persona.role];
  return (
    <nav
      aria-label="Principal"
      className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 pb-2 sm:px-6"
    >
      {NAV[persona.role].map((item) => (
        <NavLink key={item.href} href={item.href}>
          {item.label}
        </NavLink>
      ))}
      <span className="sm:hidden">
        <NavLink href={publish.href}>{publish.label}</NavLink>
      </span>
    </nav>
  );
}
