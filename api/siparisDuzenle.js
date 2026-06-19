import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { siparisId, kullaniciId, rol, siparis_not, adres_id, urunler } = await req.json();
    if (!siparisId || !rol || !kullaniciId) return allowCors(err('Eksik parametre'));
    if (!urunler || urunler.length === 0) return allowCors(err('En az bir ürün olmalı'));

    const sql = getDb();

    const [root] = await sql`SELECT * FROM siparisler WHERE id = ${siparisId} LIMIT 1`;
    if (!root) return allowCors(err('Sipariş bulunamadı'));

    if (rol === 'Musteri') {
      if (root.durum !== 'Bayi Onay Bekliyor') return allowCors(err('Bu sipariş artık düzenlenemez'));
      if (root.musteri_id !== kullaniciId) return allowCors(err('Bu sipariş size ait değil'));
    } else if (rol === 'Bayi') {
      if (root.durum !== 'Admin Onay Bekliyor') return allowCors(err('Bu sipariş artık düzenlenemez'));
      if (root.bayi_kod !== kullaniciId) return allowCors(err('Bu sipariş size ait değil'));
    } else {
      return allowCors(err('Bu işlem için yetkiniz yok'));
    }

    // Delete sub-rows (SP-xxx-2, SP-xxx-3, ...)
    await sql`DELETE FROM siparisler WHERE id LIKE ${siparisId + '-%'}`;

    // Update root row with first product
    const u0 = urunler[0];
    const toplam0 = parseFloat(u0.birimFiyat || 0) * parseInt(u0.adet || 1);
    const yeniAdresId = adres_id || root.adres_id;

    await sql`UPDATE siparisler SET
      urun_id = ${u0.urunId || null},
      urun_adi = ${u0.urunAdi},
      marka = ${u0.marka || null},
      miktar = ${parseInt(u0.adet || 1)},
      birim_fiyat = ${parseFloat(u0.birimFiyat || 0)},
      toplam = ${toplam0},
      para = ${u0.para || 'TL'},
      siparis_not = ${siparis_not || null},
      adres_id = ${yeniAdresId}
      WHERE id = ${siparisId}`;

    // Insert remaining products as sub-rows
    for (let i = 1; i < urunler.length; i++) {
      const u = urunler[i];
      const toplam = parseFloat(u.birimFiyat || 0) * parseInt(u.adet || 1);
      const subId = siparisId + '-' + (i + 1);
      await sql`INSERT INTO siparisler
        (id, musteri_id, bayi_kod, urun_id, urun_adi, marka, miktar, birim_fiyat, toplam, para,
         siparis_not, adres_id, durum, tarih)
        VALUES (${subId}, ${root.musteri_id}, ${root.bayi_kod},
          ${u.urunId || null}, ${u.urunAdi}, ${u.marka || null},
          ${parseInt(u.adet || 1)}, ${parseFloat(u.birimFiyat || 0)},
          ${toplam}, ${u.para || 'TL'},
          ${siparis_not || null}, ${yeniAdresId},
          ${root.durum}, ${root.tarih})`;
    }

    return allowCors(ok({ mesaj: 'Sipariş güncellendi', basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
