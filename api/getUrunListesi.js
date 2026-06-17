import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const { kullaniciId, rol } = await req.json().catch(() => ({}));

    let rows;
    if (rol === 'Admin') {
      rows = await sql`
        SELECT DISTINCT ON (u.id)
          u.id, u.ad, u.marka_id, u.marka, u.kat_id, u.kategori,
          u.aktif_madde, u.birim, u.ambalaj,
          u.fiyat_bayi AS genel_fiyat_bayi, u.fiyat_musteri AS genel_fiyat_musteri, u.para AS genel_para,
          fb.fiyat_admin, fb.para_admin, fb.fiyat_bayi AS fb_fiyat_bayi, fb.para_bayi, fb.kar_yuzde
        FROM urunler u
        LEFT JOIN fiyat_bayi fb ON fb.urun_id = u.id AND fb.durum = 'Genel'
        WHERE u.aktif = TRUE ORDER BY u.id, fb.id DESC NULLS LAST`;
    } else if (rol === 'Bayi') {
      rows = await sql`
        SELECT u.id, u.ad, u.marka, u.kategori, u.birim, u.ambalaj,
               COALESCE(fb.fiyat_admin, u.fiyat_bayi)  AS fiyat_admin,
               COALESCE(fb.para_admin,  u.para)         AS para_admin,
               COALESCE(fb.fiyat_bayi,  u.fiyat_bayi)  AS fiyat_bayi,
               COALESCE(fb.para_bayi,   u.para)         AS para_bayi,
               fb.kar_yuzde, fb.bayi_kar,
               CASE WHEN fb.id IS NULL THEN TRUE ELSE FALSE END AS genel_fiyat
        FROM urunler u
        LEFT JOIN fiyat_bayi fb ON fb.urun_id = u.id AND fb.bayi_id = ${kullaniciId}
        WHERE u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    } else {
      rows = await sql`
        SELECT u.id, u.ad, u.marka, u.kategori, u.birim, u.ambalaj,
               COALESCE(fm.fiyat, u.fiyat_musteri) AS fiyat,
               COALESCE(fm.para,  u.para)           AS para,
               CASE WHEN fm.id IS NULL THEN TRUE ELSE FALSE END AS genel_fiyat
        FROM urunler u
        LEFT JOIN fiyat_musteri fm ON fm.urun_id = u.id AND fm.musteri_id = ${kullaniciId}
        WHERE u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    }

    return allowCors(ok({ liste: rows }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}

export const config = { runtime: 'edge' };
