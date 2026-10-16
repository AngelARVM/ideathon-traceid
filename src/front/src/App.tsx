/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useHashRoute, navigateTo } from './router';
import { isAuthenticated as checkAuth } from './services/traceApi';
import { Banner } from './components/Banner';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { AnimalListView } from './views/AnimalListView';
import { AnimalDetailView } from './views/AnimalDetailView';
import { NewAnimalView } from './views/NewAnimalView';
import { NewRecordView } from './views/NewRecordView';
import { CloseChainView } from './views/CloseChainView';
import { PublicHistoryView } from './views/PublicHistoryView';
import { PublicRecordDetailView } from './views/PublicRecordDetailView';

export default function App() {
  const routeMatch = useHashRoute();
  const [authenticated, setAuthenticated] = useState<boolean>(() => checkAuth());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const updateAuth = () => {
    setAuthenticated(checkAuth());
  };

  const handleDataReset = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Protección de rutas operativas
  useEffect(() => {
    if (authenticated && routeMatch.route === 'login') {
      navigateTo('/animales');
      return;
    }

    const isPublicRoute =
      routeMatch.route === 'home' ||
      routeMatch.route === 'public_history' ||
      routeMatch.route === 'public_record' ||
      routeMatch.route === 'login';

    if (!isPublicRoute && !authenticated) {
      navigateTo('/login');
    }
  }, [routeMatch.route, authenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors selection:bg-[#2F6B3A] selection:text-white">
      {/* Contenedor flotante de notificaciones Toasts */}
      <ToastContainer />

      {/* Banner de entorno persistente en todas las pantallas */}
      <Banner onDataReset={handleDataReset} />

      {/* Barra de navegación */}
      <Navbar
        isAuthenticated={authenticated}
        onAuthChange={updateAuth}
        currentRoute={routeMatch.route}
      />

      {/* Contenido principal según la ruta */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {routeMatch.route === 'home' && (
          <HomeView isAuthenticated={authenticated} />
        )}

        {routeMatch.route === 'login' && (
          <LoginView onLoginSuccess={updateAuth} />
        )}

        {routeMatch.route === 'animales' && (
          <AnimalListView onRefreshTrigger={refreshTrigger} />
        )}

        {routeMatch.route === 'animales_nuevo' && (
          <NewAnimalView onCreated={() => setRefreshTrigger((p) => p + 1)} />
        )}

        {routeMatch.route === 'animal_detalle' && routeMatch.params.id && (
          <AnimalDetailView animalId={routeMatch.params.id} />
        )}

        {routeMatch.route === 'animal_hito' && routeMatch.params.id && (
          <NewRecordView
            animalId={routeMatch.params.id}
            onRecordAdded={() => setRefreshTrigger((p) => p + 1)}
          />
        )}

        {routeMatch.route === 'animal_cerrar' && routeMatch.params.id && (
          <CloseChainView
            animalId={routeMatch.params.id}
            onChainClosed={() => setRefreshTrigger((p) => p + 1)}
          />
        )}

        {routeMatch.route === 'public_history' && routeMatch.params.id && (
          <PublicHistoryView animalId={routeMatch.params.id} />
        )}

        {routeMatch.route === 'public_record' &&
          routeMatch.params.id &&
          typeof routeMatch.params.seq === 'number' && (
            <PublicRecordDetailView
              animalId={routeMatch.params.id}
              seq={routeMatch.params.seq}
            />
          )}

        {routeMatch.route === 'not_found' && (
          <div className="max-w-md mx-auto px-4 py-16 text-center">
            <h2 className="text-xl font-bold mb-2">Página no encontrada</h2>
            <p className="text-xs text-stone-500 mb-4">
              La ruta solicitada no existe en el sistema TraceID.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="px-4 py-2 rounded-xl bg-[#2F6B3A] text-white text-xs font-semibold cursor-pointer"
            >
              Ir al inicio
            </button>
          </div>
        )}
      </main>

      {/* Pie de página discreto */}
      <footer className="border-t border-stone-200 dark:border-stone-800/80 py-4 px-4 text-center text-xs text-stone-600 dark:text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-800 dark:text-stone-200">TraceID</span>
            <span>· Trazabilidad Bovina Individual (NEA)</span>
          </p>
          <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
            Contrato Soroban · Stellar Testnet Horizon
          </p>
        </div>
      </footer>
    </div>
  );
}
