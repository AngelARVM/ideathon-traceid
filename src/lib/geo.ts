const EARTH_RADIUS_KM = 6371;

type Point = { lat: number; lng: number };

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia haversine entre centros de localidad, en km enteros (§9.1). */
export function distanceKm(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)));
}

/** Radios del filtro de cercanía; `null` es "Todas". */
export const RADIUS_OPTIONS = [50, 100, 200, null] as const;
