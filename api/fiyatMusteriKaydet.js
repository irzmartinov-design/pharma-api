import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId, bayiId, urunId, fiyat, para, mod, yuzde } = await req.json();
    const sql = getDb();
    const [mevcut] = await sql`SELECT * FROM fiyat_musteri WHERE musteri_id=${musteriId} AND urun_id=${urunId} LIMIT 1`;

    let yeniFiyat;
    if (mod === '%') {
      const base = mevcut?.fiyat || 0;
      yeniFiyat = base * (1 + parseFloat(yuzde) / 100);
    } else {
      yeniFiyat = parseFloat(fiyat);
    }
    const karYuzde = mevcut?.fiyat > 0 ? ((yeniFiyat - mevcut.fiyat) / mevcut.fiyat * 100) : 0;

    if (mevcut) {
      await sql`UPDATE fiyat_musteri SET fiyat=${yeniFiyat}, para=${para||mevcut.para}, kar_yuzde=${karYuzde}, guncelleme=NOW() WHERE id=${mevcut.id}`;
    } else {
      // Ürün bilgisini urunler tablosundan al
      const [urun] = await sql`SELECT * FROM urunler WHERE id=${urunId} LIMIT 1`;
      if (!urun) return allowCors(err('Ürün bulunamadı'));
      await sql`INSERT INTO fiyat_musteri (musteri_id, bayi_id, urun_id, urun_adi, marka_id, marka, kat_id, kategori, aktif_madde, birim, ambalaj, fiyat, para, kar_yuzde, guncelleme)
        VALUES (${musteriId}, ${bayiId||null}, ${urunId}, ${urun.ad}, ${urun.marka_id}, ${urun.marka}, ${urun.kat_id}, ${urun.kategori}, ${urun.aktif_madde||null}, ${urun.birim||null}, ${urun.ambalaj||null}, ${yeniFiyat}, ${para||'TL'}, 0, NOW())`;
    }
    return allowCors(ok({ mesaj: 'Müşteri fiyatı güncellendi', karYuzde: karYuzde.toFixed(2) }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
