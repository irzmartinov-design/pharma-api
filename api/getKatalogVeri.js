import { getDb, ok, err, allowCors } from './_db.js';

// Herkese açık, fiyatsız katalog verisi — login gerektirmez.
// Güvenlik: fiyat alanları kasıtlı olarak SELECT edilmiyor, hiçbir koşulda dönmez.
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const urunler = await sql`
      SELECT ad, marka, kategori, aktif_madde, birim, ambalaj, gorsel_url
      FROM urunler
      WHERE aktif = TRUE
      ORDER BY marka, kategori, ad`;
    const markalar = await sql`SELECT ad FROM markalar WHERE aktif = TRUE ORDER BY ad`;
    return allowCors(ok({ urunler, markalar: markalar.map(m => m.ad) }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
