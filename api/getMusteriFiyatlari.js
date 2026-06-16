import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId, marka, kategori, urun } = await req.json().catch(() => ({}));
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM fiyat_musteri
      WHERE musteri_id=${musteriId}
        AND (${marka || null} IS NULL OR marka=${marka})
        AND (${kategori || null} IS NULL OR kategori=${kategori})
        AND (${urun || null} IS NULL OR urun_adi=${urun})
      ORDER BY marka, kategori, urun_adi`;
    return allowCors(ok({ fiyatlar: rows }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
