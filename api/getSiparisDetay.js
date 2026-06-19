import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { siparisId } = await req.json();
    const sql = getDb();

    // Fetch all rows in this group (SP-{ts} and SP-{ts}-2, SP-{ts}-3, ...)
    const rows = await sql`
      SELECT * FROM siparisler
      WHERE id = ${siparisId} OR id LIKE ${siparisId + '-%'}
      ORDER BY id`;

    if (!rows.length) return allowCors(err('Sipariş bulunamadı', 404));
    const s = rows[0];

    // Address detail
    let adresStr = null, adresAdi = null, adresAlici = null, adresTel = null, adresIlce = null;
    if (s.adres_id) {
      const [a] = await sql`SELECT * FROM adresler WHERE id=${s.adres_id} LIMIT 1`;
      if (a) {
        adresStr = a.adres + (a.sehir ? ', ' + a.sehir : '');
        adresAdi = a.ad || null;
        adresAlici = a.ad_soyad || null;
        adresTel = a.tel || null;
        adresIlce = a.ilce || null;
      }
    }

    // Bayi purchase prices (what Bayi pays Admin)
    const bayiFiyatlar = {};
    if (s.bayi_kod) {
      const urunIds = rows.map(r => r.urun_id).filter(Boolean);
      if (urunIds.length) {
        const bf = await sql`
          SELECT urun_id, fiyat, para FROM bayi_fiyatlari
          WHERE bayi_id=${s.bayi_kod} AND urun_id = ANY(${urunIds}::text[])`;
        bf.forEach(b => { bayiFiyatlar[b.urun_id] = b; });
      }
    }

    return allowCors(ok({
      siparis: { ...s, id: siparisId },
      adres: adresStr,
      adresAdi: adresAdi,
      adresAlici: adresAlici,
      adresTel: adresTel,
      adresIlce: adresIlce,
      not: s.siparis_not || null,
      bayiNotu: s.bayi_notu || null,
      adminNotu: s.admin_notu || null,
      urunler: rows.map(r => ({
        urunId: r.urun_id,
        urunAdi: r.urun_adi,
        marka: r.marka,
        adet: parseInt(r.miktar) || 0,
        birimFiyat: parseFloat(r.birim_fiyat) || 0,
        tutar: parseFloat(r.toplam) || 0,
        para: r.para,
        bayiAlisFiyat: bayiFiyatlar[r.urun_id] ? parseFloat(bayiFiyatlar[r.urun_id].fiyat) || 0 : 0,
        bayiAlisPara: bayiFiyatlar[r.urun_id] ? (bayiFiyatlar[r.urun_id].para || r.para) : r.para
      }))
    }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
