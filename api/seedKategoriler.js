import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const rows = [
      { id: 'KAT-1', ad: 'Antibiyotik', marka_id: 'MRK-1' },
      { id: 'KAT-2', ad: 'Ağrı Kesici', marka_id: 'MRK-1' },
      { id: 'KAT-3', ad: 'Vitamin',     marka_id: 'MRK-2' },
      { id: 'KAT-4', ad: 'Supplement',  marka_id: 'MRK-2' },
    ];
    for (const r of rows) {
      await sql`INSERT INTO kategoriler (id, ad, marka_id, aktif) VALUES (${r.id}, ${r.ad}, ${r.marka_id}, TRUE)
        ON CONFLICT (id) DO NOTHING`;
    }
    return allowCors(ok({ mesaj: 'Kategoriler eklendi', adet: rows.length }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
