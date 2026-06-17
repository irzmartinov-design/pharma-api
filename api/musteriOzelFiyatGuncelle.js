import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, musteriId, marka, kategori, urun, para, mod, fiyat, yuzde } = await req.json();
    if (!bayiId || !musteriId) return allowCors(err('Bayi ID ve Müşteri ID zorunlu'));
    const sql = getDb();

    let urunler;
    if (marka && kategori && urun) {
      urunler = await sql`SELECT id, fiyat_musteri, para FROM urunler WHERE aktif=TRUE AND marka=${marka} AND kategori=${kategori} AND ad=${urun}`;
    } else if (marka && kategori) {
      urunler = await sql`SELECT id, fiyat_musteri, para FROM urunler WHERE aktif=TRUE AND marka=${marka} AND kategori=${kategori}`;
    } else if (marka) {
      urunler = await sql`SELECT id, fiyat_musteri, para FROM urunler WHERE aktif=TRUE AND marka=${marka}`;
    } else {
      urunler = await sql`SELECT id, fiyat_musteri, para FROM urunler WHERE aktif=TRUE`;
    }

    let guncellenen = 0;
    for (const u of urunler) {
      // Bayi özel fiyatını baz al, yoksa genel müşteri fiyatı
      const [bayiOzel] = await sql`SELECT fiyat FROM bayi_fiyatlari WHERE bayi_id=${bayiId} AND urun_id=${u.id} LIMIT 1`;
      const baz = parseFloat(bayiOzel?.fiyat ?? u.fiyat_musteri) || 0;

      let yeniFiyat;
      if (mod === '%' || mod === 'yuzde') {
        yeniFiyat = baz * (1 + parseFloat(yuzde ?? fiyat) / 100);
      } else {
        yeniFiyat = parseFloat(fiyat);
      }
      const karYuzde = baz > 0 ? ((yeniFiyat - baz) / baz * 100) : 0;
      const hedefPara = para || u.para || 'TL';

      await sql`
        INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
        VALUES (${musteriId}, ${bayiId}, ${u.id}, ${yeniFiyat}, ${hedefPara}, ${karYuzde}, NOW())
        ON CONFLICT (musteri_id, urun_id)
        DO UPDATE SET fiyat=${yeniFiyat}, para=${hedefPara}, kar_yuzde=${karYuzde}, guncelleme=NOW()`;
      guncellenen++;
    }

    return allowCors(ok({ mesaj: `${guncellenen} ürün güncellendi` }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
