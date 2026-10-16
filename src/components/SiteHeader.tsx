import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/Logo";
import { signOut } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/session";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-campo-600 text-white flex items-center justify-center shrink-0">
            <LogoMark />
          </span>
          <span className="font-bold text-lg tracking-tight">
            Trace
            <span className="text-campo-600 dark:text-campo-300">ID</span>
          </span>
        </Link>

        {/* La sesión se lee por request: queda fuera del shell estático. */}
        <Suspense fallback={<div className="h-9 w-24" />}>
          <UserNav />
        </Suspense>
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
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-campo-600 hover:bg-campo-700 text-white text-sm font-semibold"
      >
        <LogIn className="w-4 h-4" />
        Ingresar
      </Link>
    );
  }

  return (
    <nav className="flex items-center gap-2 text-sm min-w-0">
      <Link
        href="/animals"
        className="h-9 px-3 inline-flex items-center rounded-lg font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
      >
        Animales
      </Link>
      <span className="hidden sm:inline truncate text-xs text-stone-600 dark:text-stone-400">
        {user.name}
      </span>
      <form action={signOut}>
        <button
          type="submit"
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </button>
      </form>
    </nav>
  );
}
