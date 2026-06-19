import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { marka, kategori, urun } = await req.json().catch(() => ({}));
    const sql = getDb();

    // Filtre koşullarına göre geri yükle
    let guncellenen;
    if (marka && kategori && urun) {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL AND marka=${marka} AND kategori=${kategori} AND ad=${urun}`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Seçili ürün için kaydedilmiş varsayılan fiyat yok'));
      await sql`UPDATE urunler SET fiyat_bayi=varsayilan_fiyat_bayi WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL AND marka=${marka} AND kategori=${kategori} AND ad=${urun}`;
      guncellenen = parseInt(kontrol[0].count);
    } else if (marka && kategori) {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL AND marka=${marka} AND kategori=${kategori}`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Seçili filtrede kaydedilmiş varsayılan fiyat yok'));
      await sql`UPDATE urunler SET fiyat_bayi=varsayilan_fiyat_bayi WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL AND marka=${marka} AND kategori=${kategori}`;
      guncellenen = parseInt(kontrol[0].count);
    } else if (marka) {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL AND marka=${marka}`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Seçili marka için kaydedilmiş varsayılan fiyat yok'));
      await sql`UPDATE urunler SET fiyat_bayi=varsayilan_fiyat_bayi WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL AND marka=${marka}`;
      guncellenen = parseInt(kontrol[0].count);
    } else {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Henüz kaydedilmiş varsayılan fiyat yok'));
      await sql`UPDATE urunler SET fiyat_bayi=varsayilan_fiyat_bayi WHERE aktif=TRUE AND varsayilan_fiyat_bayi IS NOT NULL`;
      guncellenen = parseInt(kontrol[0].count);
    }

    const tarihRow = await sql`SELECT MAX(varsayilan_tarih) AS tarih FROM urunler WHERE aktif=TRUE`;

    return allowCors(ok({
      mesaj: guncellenen + ' ürün için varsayılan fiyatlar geri yüklendi',
      tarih: tarihRow[0]?.tarih || null,
      basarili: true
    }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
