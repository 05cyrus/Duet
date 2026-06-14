/**
 * Pure geo helpers — no external/paid API. Distance via haversine, ETA via
 * simple average-speed model. This deliberately avoids Google Directions
 * (billed) — accurate enough for "how far is my partner" between two people.
 */

const R = 6_371_000; // earth radius (m)
const toRad = (d: number) => (d * Math.PI) / 180;

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

/** Average urban speeds; "good enough" ETA without a routing API. */
const DRIVING_MPS = 11; // ~40 km/h with traffic
const WALKING_MPS = 1.35; // ~4.8 km/h

export function estimateEta(meters: number): { drivingSeconds: number; walkingSeconds: number } {
  // road distance ≈ straight-line × 1.3 detour factor
  const road = meters * 1.3;
  return {
    drivingSeconds: Math.round(road / DRIVING_MPS),
    walkingSeconds: Math.round(road / WALKING_MPS),
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function isInsideGeofence(point: LatLng, center: LatLng, radiusM: number): boolean {
  return haversineMeters(point, center) <= radiusM;
}
