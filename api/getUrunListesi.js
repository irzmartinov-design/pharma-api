import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const { kullaniciId, rol } = await req.json().catch(() => ({}));

    let rows;
    if (rol === 'Admin') {
      rows = await sql`
        SELECT u.*, fb.fiyat_admin, fb.para_admin, fb.fiyat_bayi, fb.para_bayi, fb.kar_yuzde
        FROM urunler u
        LEFT JOIN fiyat_bayi fb ON fb.urun_id = u.id AND fb.durum = 'Genel'
        WHERE u.aktif = TRUE ORDER BY u.marka, u.kategori, u.ad`;
    } else if (rol === 'Bayi') {
      rows = await sql`
        SELECT u.ad, u.marka, u.kategori, u.birim, u.ambalaj,
               fb.fiyat_admin, fb.para_admin, fb.fiyat_bayi, fb.para_bayi, fb.kar_yuzde, fb.bayi_kar
        FROM fiyat_bayi fb
        JOIN urunler u ON u.id = fb.urun_id
        WHERE fb.bayi_id = ${kullaniciId} AND u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    } else {
      rows = await sql`
        SELECT u.ad, u.marka, u.kategori, u.birim, u.ambalaj,
               fm.fiyat, fm.para
        FROM fiyat_musteri fm
        JOIN urunler u ON u.id = fm.urun_id
        WHERE fm.musteri_id = ${kullaniciId} AND u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    }

    return allowCors(ok({ liste: rows }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}

export const config = { runtime: 'edge' };
