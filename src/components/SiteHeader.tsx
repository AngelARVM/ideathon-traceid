import { Home, ListFilter, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/session";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
          aria-label="TraceID, ir al inicio"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-campo-600 text-white shadow-md shadow-campo-950/15 transition-colors group-hover:bg-campo-700">
            <LogoMark className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-stone-950 dark:text-white">
                Trace
                <span className="text-campo-600 dark:text-campo-300">ID</span>
              </span>
              <span className="rounded border border-campo-200 bg-campo-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-campo-800 dark:border-campo-800 dark:bg-campo-950 dark:text-campo-200">
                NEA
              </span>
            </span>
            <span className="hidden truncate text-[11px] leading-none text-stone-500 dark:text-stone-400 sm:block">
              Trazabilidad bovina individual
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav
            aria-label="Principal"
            className="hidden items-center gap-1 md:flex"
          >
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-campo-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-campo-300"
            >
              <Home className="h-4 w-4" aria-hidden /> Inicio
            </Link>
          </nav>
          <ThemeToggle />
          <span
            className="mx-1 hidden h-6 w-px bg-stone-200 dark:bg-stone-700 sm:block"
            aria-hidden
          />
          {/* La sesión se lee por request: queda fuera del shell estático. */}
          <Suspense fallback={<div className="h-9 w-24" />}>
            <UserNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-campo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-campo-700"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Ingresar</span>
        <span className="sm:hidden">Entrar</span>
      </Link>
    );
  }

  return (
    <nav
      className="flex min-w-0 items-center gap-1.5 text-sm sm:gap-2"
      aria-label="Cuenta"
    >
      <Link
        href="/animals"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 font-semibold text-campo-700 transition hover:bg-campo-50 dark:text-campo-300 dark:hover:bg-campo-950/60 sm:px-3"
      >
        <ListFilter className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Rodeo y animales</span>
        <span className="sm:hidden">Rodeo</span>
      </Link>
      <span className="hidden max-w-36 items-center gap-1.5 truncate rounded-lg border border-campo-200 bg-campo-50 px-2.5 py-1 text-xs font-medium text-campo-800 dark:border-campo-800 dark:bg-campo-950/60 dark:text-campo-200 lg:inline-flex">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-campo-500"
          aria-hidden
        />
        <span className="truncate">{user.name}</span>
      </span>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Salir"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-stone-200 px-2.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 sm:px-3"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </form>
    </nav>
  );
}
