/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export interface RouteMatch {
  route:
    | 'home'
    | 'login'
    | 'animales'
    | 'animales_nuevo'
    | 'animal_detalle'
    | 'animal_hito'
    | 'animal_cerrar'
    | 'public_history'
    | 'public_record'
    | 'not_found';
  params: {
    id?: string;
    seq?: number;
  };
  rawHash: string;
}

export function parseHash(hash: string): RouteMatch {
  const clean = hash.replace(/^#/, '').trim();
  const path = clean === '' ? '/' : clean;

  if (path === '/' || path === '/inicio' || path === '/home') {
    return { route: 'home', params: {}, rawHash: path };
  }

  if (path === '/login') {
    return { route: 'login', params: {}, rawHash: path };
  }

  if (path === '/animales') {
    return { route: 'animales', params: {}, rawHash: path };
  }

  if (path === '/animales/nuevo') {
    return { route: 'animales_nuevo', params: {}, rawHash: path };
  }

  // /animales/:id/hito
  const hitoMatch = path.match(/^\/animales\/([^/]+)\/hito$/);
  if (hitoMatch) {
    return { route: 'animal_hito', params: { id: decodeURIComponent(hitoMatch[1]) }, rawHash: path };
  }

  // /animales/:id/cerrar
  const cerrarMatch = path.match(/^\/animales\/([^/]+)\/cerrar$/);
  if (cerrarMatch) {
    return { route: 'animal_cerrar', params: { id: decodeURIComponent(cerrarMatch[1]) }, rawHash: path };
  }

  // /animales/:id
  const animalDetailMatch = path.match(/^\/animales\/([^/]+)$/);
  if (animalDetailMatch) {
    return { route: 'animal_detalle', params: { id: decodeURIComponent(animalDetailMatch[1]) }, rawHash: path };
  }

  // /a/:id/registro/:seq
  const publicRecordMatch = path.match(/^\/a\/([^/]+)\/registro\/(\d+)$/);
  if (publicRecordMatch) {
    return {
      route: 'public_record',
      params: {
        id: decodeURIComponent(publicRecordMatch[1]),
        seq: parseInt(publicRecordMatch[2], 10),
      },
      rawHash: path,
    };
  }

  // /a/:id
  const publicHistoryMatch = path.match(/^\/a\/([^/]+)$/);
  if (publicHistoryMatch) {
    return {
      route: 'public_history',
      params: { id: decodeURIComponent(publicHistoryMatch[1]) },
      rawHash: path,
    };
  }

  return { route: 'not_found', params: {}, rawHash: path };
}

export function navigateTo(path: string): void {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
}

export function useHashRoute(): RouteMatch {
  const [routeMatch, setRouteMatch] = useState<RouteMatch>(() =>
    parseHash(typeof window !== 'undefined' ? window.location.hash : '')
  );

  useEffect(() => {
    const handleHashChange = () => {
      setRouteMatch(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    // Asegurar hash inicial en #/ si no hay hash
    if (!window.location.hash) {
      window.location.hash = '#/';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return routeMatch;
}
