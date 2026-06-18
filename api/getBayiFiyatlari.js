import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId } = await req.json().catch(() => ({}));
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();

    const rows = await sql`
      SELECT urun_id, fiyat, para, kar_yuzde
      FROM bayi_fiyatlari
      WHERE bayi_id = ${bayiId}`;

    const fiyatMap = {};
    rows.forEach(r => {
      fiyatMap[r.urun_id] = {
        fiyat:     parseFloat(r.fiyat) || 0,
        para:      r.para || 'Tokken',
        karYuzde:  parseFloat(r.kar_yuzde) || 0,
      };
    });

    return allowCors(ok({ fiyatMap }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
