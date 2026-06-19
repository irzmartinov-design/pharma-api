import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { marka, kategori, urun } = await req.json().catch(() => ({}));
    const sql = getDb();

    let guncellenen;
    if (marka && kategori && urun) {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND fiyat_taban IS NOT NULL AND marka=${marka} AND kategori=${kategori} AND ad=${urun}`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Seçili ürün için taban fiyat yok'));
      await sql`UPDATE urunler SET fiyat_bayi=fiyat_taban WHERE aktif=TRUE AND fiyat_taban IS NOT NULL AND marka=${marka} AND kategori=${kategori} AND ad=${urun}`;
      guncellenen = parseInt(kontrol[0].count);
    } else if (marka && kategori) {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND fiyat_taban IS NOT NULL AND marka=${marka} AND kategori=${kategori}`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Seçili filtrede taban fiyat yok'));
      await sql`UPDATE urunler SET fiyat_bayi=fiyat_taban WHERE aktif=TRUE AND fiyat_taban IS NOT NULL AND marka=${marka} AND kategori=${kategori}`;
      guncellenen = parseInt(kontrol[0].count);
    } else if (marka) {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND fiyat_taban IS NOT NULL AND marka=${marka}`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Seçili marka için taban fiyat yok'));
      await sql`UPDATE urunler SET fiyat_bayi=fiyat_taban WHERE aktif=TRUE AND fiyat_taban IS NOT NULL AND marka=${marka}`;
      guncellenen = parseInt(kontrol[0].count);
    } else {
      const kontrol = await sql`SELECT COUNT(*) FROM urunler WHERE aktif=TRUE AND fiyat_taban IS NOT NULL`;
      if (parseInt(kontrol[0]?.count) === 0) return allowCors(err('Henüz taban fiyat girilmemiş'));
      await sql`UPDATE urunler SET fiyat_bayi=fiyat_taban WHERE aktif=TRUE AND fiyat_taban IS NOT NULL`;
      guncellenen = parseInt(kontrol[0].count);
    }

    return allowCors(ok({
      mesaj: guncellenen + ' ürün taban fiyata döndürüldü',
      basarili: true
    }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
