import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { siparisId } = await req.json();
    const sql = getDb();
    const rows = await sql`SELECT * FROM siparisler WHERE id=${siparisId}`;
    if (!rows.length) return allowCors(err('Sipariş bulunamadı', 404));
    const s = rows[0];
    const fb = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${s.bayi_kod} AND urun_id=${s.urun_id} LIMIT 1`;
    const fm = await sql`SELECT * FROM fiyat_musteri WHERE musteri_id=${s.musteri_id} AND urun_id=${s.urun_id} LIMIT 1`;
    return allowCors(ok({
      siparis: s,
      adminBayiFiyat: fb[0]?.fiyat_admin || 0,
      bayiMusteriFiyat: fb[0]?.fiyat_bayi || 0,
      musteriOzelFiyat: fm[0]?.fiyat || 0,
      para: s.para
    }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
