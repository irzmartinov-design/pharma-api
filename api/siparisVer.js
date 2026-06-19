import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const data = await req.json();
    const { musteriId, bayiKod, adresId, sipNot, rol } = data;
    if (!musteriId) return allowCors(err('Müşteri ID zorunlu'));

    const urunler = data.urunler && data.urunler.length
      ? data.urunler
      : [{ urunId: data.urunId, urunAdi: data.urunAdi, marka: data.marka, markaId: data.markaId,
           kategori: data.kategori, katId: data.katId, miktar: data.miktar,
           birimFiyat: data.birimFiyat, para: data.para, toplam: data.toplam }];

    if (!urunler[0] || !urunler[0].urunId) return allowCors(err('Ürün bilgisi eksik'));

    const sql = getDb();

    // Müşteri siparişi → Bayi onayı beklenir; Bayi/Admin siparişi → direk Admin'e
    const durum = (rol === 'Musteri' && bayiKod) ? 'Bayi Onay Bekliyor' : 'Admin Onay Bekliyor';

    // Lazy migration: bayi_toplam kolonu
    try { await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_toplam NUMERIC DEFAULT 0`; } catch(e) {}

    // Bayi alış fiyatlarını tek sorguda al
    const bayiFiyatMap = {};
    if (bayiKod && bayiKod !== 'ADMIN') {
      const urunIds = urunler.map(u => u.urunId).filter(Boolean);
      if (urunIds.length) {
        const bf = await sql`SELECT urun_id, fiyat FROM bayi_fiyatlari WHERE bayi_id=${bayiKod} AND urun_id = ANY(${urunIds}::text[])`;
        bf.forEach(b => { bayiFiyatMap[b.urun_id] = parseFloat(b.fiyat) || 0; });
      }
    }

    const grupId = `SP-${Date.now()}`;

    for (let i = 0; i < urunler.length; i++) {
      const u = urunler[i];
      const id = i === 0 ? grupId : `${grupId}-${i + 1}`;
      const bayiToplam = bayiFiyatMap[u.urunId] ? bayiFiyatMap[u.urunId] * (parseInt(u.miktar) || 0) : 0;
      await sql`
        INSERT INTO siparisler (id, musteri_id, bayi_kod, adres_id, urun_adi, marka, marka_id,
          kategori, kat_id, urun_id, miktar, birim_fiyat, para, toplam, bayi_toplam, durum, siparis_not)
        VALUES (${id}, ${musteriId}, ${bayiKod||null}, ${adresId||null},
          ${u.urunAdi}, ${u.marka||''}, ${u.markaId||null},
          ${u.kategori||''}, ${u.katId||null}, ${u.urunId},
          ${parseInt(u.miktar)}, ${parseFloat(u.birimFiyat)}, ${u.para},
          ${parseFloat(u.toplam)}, ${bayiToplam}, ${durum}, ${sipNot||null})`;
    }

    return allowCors(ok({ mesaj: 'Sipariş alındı', siparisId: grupId }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
