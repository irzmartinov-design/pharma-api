import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, marka, kategori, urun } = await req.json().catch(() => ({}));
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();

    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(r => { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    const getKur = (p) => kurMap[p] || 1;

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

    // Normalize
    const fiyatlar = rows.map(r => {
      const karYuzde = parseFloat(r.kar_yuzde) || 0;
      const has_bf = r.id !== null;
      const genel_mi = !has_bf || karYuzde === 0;
      const ozelPara = r.para || r.genel_para || 'Tokken';
      const genelPara = r.genel_para || 'Tokken';
      const genelFiyatHam = parseFloat(r.genel_fiyat) || 0;
      // Genel fiyatı bayi'nin para birimine çevir (kur üzerinden)
      const genelFiyatCevrilmis = genelPara !== ozelPara
        ? genelFiyatHam * getKur(ozelPara) / getKur(genelPara)
        : genelFiyatHam;
      return {
        urun_id:              r.urun_id,
        urun_adi:             r.urun_adi,
        marka:                r.marka,
        kategori:             r.kategori,
        birim:                r.birim,
        ambalaj:              r.ambalaj,
        genel_fiyat:          genelFiyatHam,
        genel_fiyat_cevrilmis: genelFiyatCevrilmis,
        genel_para:           genelPara,
        fiyat:                parseFloat(r.fiyat ?? r.genel_fiyat) || 0,
        para:                 ozelPara,
        kar_yuzde:            karYuzde,
        genel_mi,
        has_bf,
      };
    });

    return allowCors(ok({ fiyatlar }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
