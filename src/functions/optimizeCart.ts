import { optimizePlans, PlanResult } from '../lib/optimizer';
import { LatLon } from '../lib/geo';

export type OptimizeRequest = {
  cart_id: string;
  userLat: number;
  userLon: number;
  slider: number; // 0..10
};

export type OptimizeResponse = { plans: PlanResult[] } | { error: string };

/**
 * Build optimization plans for a cart, given pre-fetched candidate prices.
 * Note: This is the compute core. Data fetching to build candidates is expected
 * to be implemented by the API layer (Supabase RPC/joins) in a later step.
 */
export async function handler(body: OptimizeRequest, itemsJson: string): Promise<OptimizeResponse> {
  try {
    if (body.slider < 0 || body.slider > 10) return { error: 'slider out of range' };
    const user: LatLon = { lat: body.userLat, lon: body.userLon };
    const items = JSON.parse(itemsJson);
    const plans = optimizePlans({ items, user, slider: body.slider });
    return { plans };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return { error: message };
  }
}