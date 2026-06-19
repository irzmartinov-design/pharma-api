import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const { kullaniciId, rol } = await req.json().catch(() => ({}));

    let rows;
    if (rol === 'Admin') {
      rows = await sql`
        SELECT u.id, u.ad, u.marka_id, u.marka, u.kat_id, u.kategori,
               u.aktif_madde, u.birim, u.ambalaj,
               u.fiyat_bayi  AS genel_fiyat_bayi,
               u.fiyat_musteri AS genel_fiyat_musteri,
               u.para        AS genel_para
        FROM urunler u
        WHERE u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    } else if (rol === 'Bayi') {
      rows = await sql`
        SELECT u.id, u.ad, u.marka, u.kategori, u.aktif_madde, u.birim, u.ambalaj,
               COALESCE(bf.fiyat,  u.fiyat_bayi)  AS fiyat_bayi,
               COALESCE(bf.para,   u.para)          AS para_bayi,
               bf.kar_yuzde,
               CASE WHEN bf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${kullaniciId}
        WHERE u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    } else {
      rows = await sql`
        SELECT u.id, u.ad, u.marka, u.kategori, u.aktif_madde, u.birim, u.ambalaj,
               COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
               COALESCE(mf.para,  u.para)           AS para,
               CASE WHEN mf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${kullaniciId}
        WHERE u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    }

    return allowCors(ok({ liste: rows }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
