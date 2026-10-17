import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { MobileNav, type NavItem } from "@/components/MobileNav";
import { NavLink } from "@/components/NavLink";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { LinkButton } from "@/components/ui/Button";
import type { Role } from "@/generated/prisma/enums";
import { countPendingActions } from "@/lib/dashboard/queries";
import { getPersona, type PersonaWithLocality } from "@/lib/persona";

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

/** Header global. La persona se lee por request, en `<Suspense>`. */
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
      <nav aria-label="Principal" className="hidden items-center gap-5 lg:flex">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
            {item.href === "/proposals" && (
              <Suspense fallback={null}>
                <PendingBadge persona={persona} />
              </Suspense>
            )}
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

/** Propuestas que esperan una acción de la persona (M7 §2.4). Sin pendientes, no se muestra. */
async function PendingBadge({ persona }: { persona: PersonaWithLocality }) {
  const count = await countPendingActions(persona);
  if (count === 0) return null;
  const label =
    persona.role === "seller"
      ? `${count} para responder`
      : `${count} para confirmar`;
  return (
    <span
      title={label}
      className="inline-flex min-w-5 justify-center rounded-full bg-amber-500 px-1.5 font-mono-num text-[11px] font-bold leading-5 text-white"
    >
      <span aria-hidden>{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
