export type LatLon = { lat: number; lon: number };

/**
 * Compute great-circle distance in km using the Haversine formula.
 */
export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export type OsrmMatrix = {
  distances: number[][] | null;
};

/**
 * Fetch OSRM table distances in km if OSRM_BASE_URL is set.
 */
export async function osrmMatrixKm(points: LatLon[]): Promise<number[][] | null> {
  const base = process.env.OSRM_BASE_URL;
  if (!base || points.length === 0) return null;
  const coords = points.map((p) => `${p.lon},${p.lat}`).join(";");
  const url = `${base.replace(/\/$/, '')}/table/v1/driving/${coords}?annotations=distance`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as OsrmMatrix;
  if (!json.distances) return null;
  return json.distances.map((row) => row.map((m) => m / 1000));
}