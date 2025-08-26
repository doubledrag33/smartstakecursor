import { createClient } from '@supabase/supabase-js';

export type AddFavsRequest = {
  user_id: string;
  cart_id?: string;
  product_ids?: string[];
};

export type AddFavsResponse = { ok: true; added: number; cart_id: string } | { error: string };

/**
 * Add all or selected favorite products to the user's open cart.
 */
export async function handler(body: AddFavsRequest): Promise<AddFavsResponse> {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  try {
    const userId = body.user_id;
    if (!userId) return { error: 'missing user_id' };

    let cid = body.cart_id;
    if (!cid) {
      const { data: existing, error: e0 } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'open')
        .limit(1);
      if (e0) return { error: e0.message };
      if (existing && existing[0]) cid = existing[0].id as string;
      else {
        const { data: created, error: e1 } = await supabase.from('cart').insert({ user_id: userId }).select('id').single();
        if (e1) return { error: e1.message };
        cid = (created as { id: string }).id;
      }
    }

    let pids = body.product_ids;
    if (!pids || pids.length === 0) {
      const { data: favs, error: e2 } = await supabase
        .from('user_favorite')
        .select('product_id')
        .eq('user_id', userId);
      if (e2) return { error: e2.message };
      pids = (favs || []).map((f) => (f as { product_id: string }).product_id);
    }
    const uniq = Array.from(new Set(pids));

    const { data: existingItems, error: e3 } = await supabase
      .from('cart_item')
      .select('product_id')
      .eq('cart_id', cid);
    if (e3) return { error: e3.message };
    const existingSet = new Set((existingItems || []).map((i) => (i as { product_id: string }).product_id));

    const rows = uniq.filter((pid) => !existingSet.has(pid)).map((pid) => ({ cart_id: cid!, product_id: pid, quantity: 1 }));
    if (rows.length) {
      const { error: e4 } = await supabase.from('cart_item').insert(rows);
      if (e4) return { error: e4.message };
    }
    return { ok: true, added: rows.length, cart_id: cid! };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return { error: message };
  }
}