import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId, marka, kategori, urun } = await req.json().catch(() => ({}));
    if (!musteriId) return allowCors(err('Müşteri ID zorunlu'));
    const sql = getDb();

    let rows;
    if (marka && kategori && urun) {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_musteri AS genel_fiyat, u.para AS genel_para,
               mf.id, mf.fiyat, mf.para, mf.kar_yuzde,
               CASE WHEN mf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
        WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}
        ORDER BY u.ad`;
    } else if (marka && kategori) {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_musteri AS genel_fiyat, u.para AS genel_para,
               mf.id, mf.fiyat, mf.para, mf.kar_yuzde,
               CASE WHEN mf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
        WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori}
        ORDER BY u.ad`;
    } else if (marka) {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_musteri AS genel_fiyat, u.para AS genel_para,
               mf.id, mf.fiyat, mf.para, mf.kar_yuzde,
               CASE WHEN mf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
        WHERE u.aktif = TRUE AND u.marka = ${marka}
        ORDER BY u.kategori, u.ad`;
    } else {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_musteri AS genel_fiyat, u.para AS genel_para,
               mf.id, mf.fiyat, mf.para, mf.kar_yuzde,
               CASE WHEN mf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
        WHERE u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    }

    const fiyatlar = rows.map(r => ({
      urun_id:     r.urun_id,
      urun_adi:    r.urun_adi,
      marka:       r.marka,
      kategori:    r.kategori,
      birim:       r.birim,
      ambalaj:     r.ambalaj,
      genel_fiyat: parseFloat(r.genel_fiyat) || 0,
      genel_para:  r.genel_para || 'TL',
      fiyat:       parseFloat(r.fiyat ?? r.genel_fiyat) || 0,
      para:        r.para || r.genel_para || 'TL',
      kar_yuzde:   parseFloat(r.kar_yuzde) || 0,
      genel_mi:    r.genel_mi,
    }));

    return allowCors(ok({ fiyatlar }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
