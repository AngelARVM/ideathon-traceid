"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  Suspense,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Banner } from "@/components/Banner";
import { Navbar } from "@/components/Navbar";
import { ToastContainer } from "@/components/Toast";
import { isAuthenticated as checkAuth } from "@/lib/traceApi";

interface AuthContextValue {
  authenticated: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AppShell>");
  return ctx;
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" || pathname === "/login" || pathname.startsWith("/a/")
  );
}

// Protección de rutas operativas (la sesión de demo vive en localStorage)
function RouteGuard({
  authenticated,
  authReady,
}: {
  authenticated: boolean;
  authReady: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (authenticated && pathname === "/login") {
      router.replace("/animals");
      return;
    }
    if (!authenticated && !isPublicPath(pathname)) {
      router.replace("/login");
    }
  }, [pathname, authenticated, authReady, router]);

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  // Al reiniciar los datos mock se remonta la vista actual para que vuelva a cargarlos
  const [resetKey, setResetKey] = useState(0);

  const refreshAuth = useCallback(() => setAuthenticated(checkAuth()), []);

  useEffect(() => {
    setAuthenticated(checkAuth());
    setAuthReady(true);
  }, []);

  return (
    <AuthContext value={{ authenticated, refreshAuth }}>
      <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors selection:bg-[#2F6B3A] selection:text-white">
        {/* Contenedor flotante de notificaciones Toasts */}
        <ToastContainer />

        {/* Banner de entorno persistente en todas las pantallas */}
        <Banner onDataReset={() => setResetKey((k) => k + 1)} />

        {/* usePathname suspende en rutas dinámicas con cacheComponents */}
        <Suspense fallback={<div className="h-16" />}>
          <Navbar isAuthenticated={authenticated} onAuthChange={refreshAuth} />
        </Suspense>
        <Suspense fallback={null}>
          <RouteGuard authenticated={authenticated} authReady={authReady} />
        </Suspense>

        <main
          key={resetKey}
          className="flex-1 w-full max-w-full overflow-x-hidden"
        >
          {children}
        </main>

        {/* Pie de página discreto */}
        <footer className="border-t border-stone-200 dark:border-stone-800/80 py-4 px-4 text-center text-xs text-stone-600 dark:text-stone-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                TraceID
              </span>
              <span>· Trazabilidad Bovina Individual (NEA)</span>
            </p>
            <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              Contrato Soroban · Stellar Testnet Horizon
            </p>
          </div>
        </footer>
      </div>
    </AuthContext>
  );
}
