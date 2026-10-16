/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { navigateTo } from '../router';
import { login, logout } from '../services/traceApi';
import {
  Sun,
  Moon,
  LogOut,
  LogIn,
  Layers,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Home,
  ListFilter,
} from 'lucide-react';

interface NavbarProps {
  isAuthenticated: boolean;
  onAuthChange: () => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAuthenticated,
  onAuthChange,
  currentRoute,
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('traceid_dark_mode') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('traceid_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('traceid_dark_mode', 'false');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  const handleLogout = async () => {
    await logout();
    onAuthChange();
    setMobileMenuOpen(false);
    navigateTo('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Logo y Branding */}
        <div
          onClick={() => navigateTo('/')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
          role="button"
          tabIndex={0}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2F6B3A] text-white flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:bg-[#26562f] transition-colors shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            >
              {/* Icono esquemático de cabeza vacuna y anclaje tecnológico */}
              <path d="M5 4l3 5h8l3-5" />
              <path d="M7 9v4c0 3 2 5 5 5s5-2 5-5V9" />
              <circle cx="12" cy="13" r="1.5" className="fill-amber-400 stroke-none" />
              <path d="M12 18v3" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-stone-900 dark:text-white">
                Trace<span className="text-[#2F6B3A] dark:text-emerald-400">ID</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                NEA
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-none hidden sm:block truncate">
              Trazabilidad bovina · Stellar Testnet
            </p>
          </div>
        </div>

        {/* Acciones de escritorio */}
        <div className="hidden md:flex items-center gap-3">
          <nav className="flex items-center gap-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentRoute === 'home'
                  ? 'bg-stone-100 dark:bg-stone-800 text-[#2F6B3A] dark:text-emerald-400 font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={() => navigateTo('/animales')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentRoute === 'animales'
                  ? 'bg-stone-100 dark:bg-stone-800 text-[#2F6B3A] dark:text-emerald-400 font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              Rodeo y Animales
            </button>

            {/* Acceso directo a una muestra de verificación pública */}
            <button
              type="button"
              onClick={() => navigateTo('/a/01JH8V9B7C1D2E3F4G5H6J7K8M')}
              className={`px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 ${
                currentRoute.startsWith('public')
                  ? 'bg-stone-100 dark:bg-stone-800 text-[#2F6B3A] dark:text-emerald-400 font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Historial de Ejemplo
            </button>
          </nav>

          <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 mx-1" />

          {/* Selector de modo oscuro */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Autenticación */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Operador Demo
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
                title="Cerrar sesión demo"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                await login();
                onAuthChange();
                navigateTo('/animales');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2F6B3A] hover:bg-[#26562f] px-3.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar Demo</span>
            </button>
          )}
        </div>

        {/* Acciones en Mobile */}
        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Alternar tema"
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
            className="p-2 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú desplegable Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 pt-3 pb-5 space-y-2">
          <button
            type="button"
            onClick={() => {
              navigateTo('/');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left flex items-center justify-between p-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200"
          >
            <span className="flex items-center gap-2">
              <Home className="w-4 h-4 text-stone-500" />
              Inicio
            </span>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              navigateTo('/animales');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left flex items-center justify-between p-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200"
          >
            <span className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-[#2F6B3A] dark:text-emerald-400" />
              Rodeo y Trazabilidad (Operativo)
            </span>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              navigateTo('/a/01JH8V9B7C1D2E3F4G5H6J7K8M');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left flex items-center justify-between p-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200"
          >
            <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Historial de Ejemplo (Verificación Stellar)
            </span>
            <ExternalLink className="w-4 h-4 text-stone-400" />
          </button>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión demo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await login();
                  onAuthChange();
                  setMobileMenuOpen(false);
                  navigateTo('/animales');
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#2F6B3A] py-2.5 rounded-xl shadow cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar con Credenciales Demo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
