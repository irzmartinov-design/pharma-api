import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { marka, kategori, urun, para, mod, fiyatBayi, fiyatMusteri } = await req.json();
    if (!para) return allowCors(err('Para birimi zorunlu'));
    const sql = getDb();

    let rows;
    if (marka && kategori && urun) {
      rows = await sql`SELECT id, fiyat_bayi, fiyat_musteri FROM urunler WHERE marka=${marka} AND kategori=${kategori} AND ad=${urun} AND aktif=TRUE`;
    } else if (marka && kategori) {
      rows = await sql`SELECT id, fiyat_bayi, fiyat_musteri FROM urunler WHERE marka=${marka} AND kategori=${kategori} AND aktif=TRUE`;
    } else if (marka) {
      rows = await sql`SELECT id, fiyat_bayi, fiyat_musteri FROM urunler WHERE marka=${marka} AND aktif=TRUE`;
    } else {
      rows = await sql`SELECT id, fiyat_bayi, fiyat_musteri FROM urunler WHERE aktif=TRUE`;
    }

    let guncellenen = 0;
    for (const row of rows) {
      let yFB = fiyatBayi != null ? parseFloat(fiyatBayi) : null;
      let yFM = fiyatMusteri != null ? parseFloat(fiyatMusteri) : null;

      if (mod === 'yuzde') {
        if (yFB != null) yFB = parseFloat(row.fiyat_bayi || 0) * (1 + yFB / 100);
        if (yFM != null) yFM = parseFloat(row.fiyat_musteri || 0) * (1 + yFM / 100);
      }

      if (yFB != null && yFM != null) {
        await sql`UPDATE urunler SET fiyat_bayi=${yFB}, fiyat_musteri=${yFM}, para=${para} WHERE id=${row.id}`;
      } else if (yFB != null) {
        await sql`UPDATE urunler SET fiyat_bayi=${yFB}, para=${para} WHERE id=${row.id}`;
      } else if (yFM != null) {
        await sql`UPDATE urunler SET fiyat_musteri=${yFM}, para=${para} WHERE id=${row.id}`;
      } else {
        await sql`UPDATE urunler SET para=${para} WHERE id=${row.id}`;
      }
      guncellenen++;
    }

    return allowCors(ok({ mesaj: `${guncellenen} ürün güncellendi`, basarili: true }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
