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

    // Aktif otomatik oranlı bayileri güncelle
    const aktifBayiler = await sql`SELECT id, musteri_fiyat_orani FROM kullanicilar WHERE rol='Bayi' AND aktif=TRUE AND musteri_fiyat_orani_aktif=TRUE AND musteri_fiyat_orani > 0`.catch(() => []);
    for (const bayi of aktifBayiler) {
      const oran = parseFloat(bayi.musteri_fiyat_orani);
      for (const row of rows) {
        const yFB = fiyatBayi != null ? parseFloat(fiyatBayi) : null;
        const taban = yFB != null ? (mod === 'yuzde' ? parseFloat(row.fiyat_bayi || 0) * (1 + yFB / 100) : yFB) : parseFloat(row.fiyat_bayi || 0);
        if (taban <= 0) continue;
        const yeniFiyat = taban * (1 + oran / 100);
        await sql`
          INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
          VALUES (${bayi.id}, ${row.id}, ${yeniFiyat}, ${para}, ${oran}, NOW())
          ON CONFLICT (bayi_id, urun_id)
          DO UPDATE SET fiyat=${yeniFiyat}, para=${para}, kar_yuzde=${oran}, guncelleme=NOW()`;
      }
    }

    return allowCors(ok({ mesaj: `${guncellenen} ürün güncellendi`, basarili: true }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
