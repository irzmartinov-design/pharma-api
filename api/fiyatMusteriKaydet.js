import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId, bayiId, urunId, fiyat, para, mod, yuzde } = await req.json();
    if (!musteriId || !urunId) return allowCors(err('Müşteri ID ve Ürün ID zorunlu'));
    const sql = getDb();

    const [urun] = await sql`SELECT fiyat_musteri, para FROM urunler WHERE id = ${urunId} LIMIT 1`;
    if (!urun) return allowCors(err('Ürün bulunamadı'));

    // Bayi özel fiyatı varsa onu baz al, yoksa genel fiyat
    const [bayiOzel] = bayiId
      ? await sql`SELECT fiyat FROM bayi_fiyatlari WHERE bayi_id=${bayiId} AND urun_id=${urunId} LIMIT 1`
      : [null];
    const baz = parseFloat(bayiOzel?.fiyat ?? urun.fiyat_musteri) || 0;

    let yeniFiyat;
    if (mod === '%') {
      yeniFiyat = baz * (1 + parseFloat(yuzde) / 100);
    } else {
      yeniFiyat = parseFloat(fiyat);
    }

    const karYuzde = baz > 0 ? ((yeniFiyat - baz) / baz * 100) : 0;

    await sql`
      INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      VALUES (${musteriId}, ${bayiId || ''}, ${urunId}, ${yeniFiyat}, ${para || urun.para || 'TL'}, ${karYuzde}, NOW())
      ON CONFLICT (musteri_id, urun_id)
      DO UPDATE SET fiyat=${yeniFiyat}, para=${para || urun.para || 'TL'}, kar_yuzde=${karYuzde}, guncelleme=NOW()`;

    return allowCors(ok({ mesaj: 'Müşteri fiyatı güncellendi', karYuzde: karYuzde.toFixed(2) }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
