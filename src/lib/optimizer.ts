import { haversineKm, LatLon } from './geo';

export type CartItem = {
  productId: string;
  quantity: number;
  candidateStores: Array<{
    storeId: string;
    storeLatLon: LatLon;
    price: number; // total for quantity
  }>;
};

export type PlanKind = 'economico' | 'equilibrato' | 'un_solo_negozio';

export type PlanResult = {
  kind: PlanKind;
  total: number;
  storesUsed: number;
  kmEst: number;
  assignments: Record<string, string>; // item productId -> storeId
};

export type OptimizeParams = {
  items: CartItem[];
  user: LatLon;
  slider: number; // 0..10
};

function lambda1Euro(slider: number): number {
  return 2.0 * (0.5 + slider / 20);
}

const LAMBDA2_EURO_PER_KM = 0.2;

function computeKmCentroid(user: LatLon, storeLatLons: LatLon[]): number {
  if (storeLatLons.length === 0) return 0;
  const centroid = storeLatLons.reduce(
    (acc, s) => ({ lat: acc.lat + s.lat, lon: acc.lon + s.lon }),
    { lat: 0, lon: 0 },
  );
  centroid.lat /= storeLatLons.length;
  centroid.lon /= storeLatLons.length;
  return haversineKm(user, centroid);
}

function greedyAssign(items: CartItem[], lambda1: number, user: LatLon, singleStoreId?: string): PlanResult {
  const assignments: Record<string, string> = {};
  const storeSet = new Set<string>();
  let total = 0;
  for (const item of items) {
    const candidates = item.candidateStores.filter((c) => (singleStoreId ? c.storeId === singleStoreId : true));
    if (candidates.length === 0) continue;
    let best = candidates[0];
    for (const c of candidates) {
      if (c.price < best.price) best = c;
    }
    assignments[item.productId] = best.storeId;
    storeSet.add(best.storeId);
    total += best.price;
  }
  const storesUsed = storeSet.size;
  const kmEst = computeKmCentroid(
    user,
    Array.from(storeSet).map((sid) => items.find((i) => assignments[i.productId] === sid)!.candidateStores.find((c) => c.storeId === sid)!.storeLatLon),
  );
  const totalWithPenalty = total + lambda1 * storesUsed + LAMBDA2_EURO_PER_KM * kmEst;
  return { kind: 'economico', total: totalWithPenalty, storesUsed, kmEst, assignments };
}

export function optimizePlans(params: OptimizeParams): PlanResult[] {
  const { items, user, slider } = params;
  const lambdaMid = lambda1Euro(slider);

  // Economico: lambda1 ~ 0
  const econ = greedyAssign(items, 0.01, user);
  econ.kind = 'economico';

  // Equilibrato: medium lambda1
  const bal = greedyAssign(items, lambdaMid, user);
  bal.kind = 'equilibrato';

  // Un solo negozio: try each store appearing in candidates, pick best
  const allStores = Array.from(
    new Set(items.flatMap((i) => i.candidateStores.map((c) => c.storeId))),
  );
  let bestSingle: PlanResult | null = null;
  for (const sid of allStores) {
    const p = greedyAssign(items, lambdaMid, user, sid);
    p.kind = 'un_solo_negozio';
    if (!bestSingle || p.total < bestSingle.total) bestSingle = p;
  }
  return [econ, bal, bestSingle ?? bal];
}