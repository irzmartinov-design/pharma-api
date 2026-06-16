import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const data = await req.json();
    const { musteriId, bayiKod, adresId, urunId, urunAdi, marka, markaId, kategori, katId,
            miktar, birimFiyat, para, toplam } = data;

    if (!musteriId || !urunId || !miktar) return allowCors(err('Zorunlu alanlar eksik'));

    const sql = getDb();
    const id = `SP-${Date.now()}`;

    await sql`
      INSERT INTO siparisler (id, musteri_id, bayi_kod, adres_id, urun_adi, marka, marka_id,
        kategori, kat_id, urun_id, miktar, birim_fiyat, para, toplam)
      VALUES (${id}, ${musteriId}, ${bayiKod}, ${adresId}, ${urunAdi}, ${marka}, ${markaId},
        ${kategori}, ${katId}, ${urunId}, ${miktar}, ${birimFiyat}, ${para}, ${toplam})`;

    return allowCors(ok({ mesaj: 'Sipariş alındı', siparisId: id }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}

export const config = { runtime: 'edge' };
