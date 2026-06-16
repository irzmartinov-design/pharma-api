import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, marka, kategori, urun } = await req.json().catch(() => ({}));
    const sql = getDb();
    let rows;
    if (marka && kategori && urun) {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka} AND kategori=${kategori} AND urun_adi=${urun} ORDER BY marka, kategori, urun_adi`;
    } else if (marka && kategori) {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka} AND kategori=${kategori} ORDER BY urun_adi`;
    } else if (marka) {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka} ORDER BY kategori, urun_adi`;
    } else {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} ORDER BY marka, kategori, urun_adi`;
    }
    return allowCors(ok({ fiyatlar: rows }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
