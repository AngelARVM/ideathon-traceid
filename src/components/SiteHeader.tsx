import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { MobileNav, type NavItem } from "@/components/MobileNav";
import { NavLink } from "@/components/NavLink";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { LinkButton } from "@/components/ui/Button";
import type { Role } from "@/generated/prisma/enums";
import { getPersona } from "@/lib/persona";

// Navegación por rol (docs/00-mvp-spec.md §10).
const NAV: Record<Role, NavItem[]> = {
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

const PUBLISH: Record<Role, NavItem> = {
  seller: { href: "/offers/new", label: "Publicar oferta" },
  buyer: { href: "/demands/new", label: "Publicar demanda" },
};

/** Header global al estilo de `Navbar` de codigo-ui. La persona se lee por request, en `<Suspense>`. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-2xs">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group min-w-0 shrink-0"
          aria-label="SubMarket, ir al inicio"
        >
          <Logo />
        </Link>
        <Suspense fallback={<div className="h-10 w-40" />}>
          <PersonaNav />
        </Suspense>
      </div>
    </header>
  );
}

async function PersonaNav() {
  const persona = await getPersona();
  if (!persona) {
    return (
      <LinkButton href="/" size="sm">
        Elegir persona
      </LinkButton>
    );
  }
  const items = NAV[persona.role];
  const publish = PUBLISH[persona.role];
  return (
    <div className="flex min-w-0 items-center gap-2 lg:gap-5">
      {/* TODO(M7): header-badge — contador de propuestas que esperan a la persona, junto a "Propuestas". */}
      <nav aria-label="Principal" className="hidden items-center gap-5 lg:flex">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <span className="hidden sm:block">
        <LinkButton href={publish.href} size="sm">
          <Plus className="h-4 w-4" aria-hidden />
          {publish.label}
        </LinkButton>
      </span>
      <PersonaSwitcher persona={persona} />
      <MobileNav items={items} publish={publish} />
    </div>
  );
}
