import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, marka, kategori, urun } = await req.json().catch(() => ({}));
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();

    let rows;
    if (marka && kategori && urun) {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_bayi AS genel_fiyat, u.para AS genel_para,
               bf.id, bf.fiyat, bf.para, bf.kar_yuzde,
               CASE WHEN bf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
        WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}
        ORDER BY u.marka, u.kategori, u.ad`;
    } else if (marka && kategori) {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_bayi AS genel_fiyat, u.para AS genel_para,
               bf.id, bf.fiyat, bf.para, bf.kar_yuzde,
               CASE WHEN bf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
        WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori}
        ORDER BY u.ad`;
    } else if (marka) {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_bayi AS genel_fiyat, u.para AS genel_para,
               bf.id, bf.fiyat, bf.para, bf.kar_yuzde,
               CASE WHEN bf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
        WHERE u.aktif = TRUE AND u.marka = ${marka}
        ORDER BY u.kategori, u.ad`;
    } else {
      rows = await sql`
        SELECT u.id AS urun_id, u.ad AS urun_adi, u.marka, u.kategori, u.birim, u.ambalaj,
               u.fiyat_bayi AS genel_fiyat, u.para AS genel_para,
               bf.id, bf.fiyat, bf.para, bf.kar_yuzde,
               CASE WHEN bf.id IS NULL THEN TRUE ELSE FALSE END AS genel_mi
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
        WHERE u.aktif = TRUE
        ORDER BY u.marka, u.kategori, u.ad`;
    }

    // Normalize: özel fiyat yoksa genel fiyatı kullan
    const fiyatlar = rows.map(r => {
      const karYuzde = parseFloat(r.kar_yuzde) || 0;
      // kar_yuzde = 0 VE kayıt var → markup yok → genel fiyatla eşdeğer → Genel göster
      const genel_mi = r.genel_mi || (r.id !== null && karYuzde === 0);
      return {
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
        kar_yuzde:   karYuzde,
        genel_mi,
      };
    });

    return allowCors(ok({ fiyatlar }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
