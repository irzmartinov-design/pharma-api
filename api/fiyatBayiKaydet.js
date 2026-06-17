import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, urunId, fiyat, para, mod, yuzde } = await req.json();
    if (!bayiId || !urunId) return allowCors(err('Bayi ID ve Ürün ID zorunlu'));
    const sql = getDb();

    const [urun] = await sql`SELECT fiyat_bayi, para FROM urunler WHERE id = ${urunId} LIMIT 1`;
    if (!urun) return allowCors(err('Ürün bulunamadı'));

    let yeniFiyat;
    if (mod === '%') {
      const baz = parseFloat(urun.fiyat_bayi) || 0;
      yeniFiyat = baz * (1 + parseFloat(yuzde) / 100);
    } else {
      yeniFiyat = parseFloat(fiyat);
    }

    const genelFiyat = parseFloat(urun.fiyat_bayi) || 0;
    const karYuzde = genelFiyat > 0 ? ((yeniFiyat - genelFiyat) / genelFiyat * 100) : 0;

    await sql`
      INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      VALUES (${bayiId}, ${urunId}, ${yeniFiyat}, ${para || urun.para || 'TL'}, ${karYuzde}, NOW())
      ON CONFLICT (bayi_id, urun_id)
      DO UPDATE SET fiyat=${yeniFiyat}, para=${para || urun.para || 'TL'}, kar_yuzde=${karYuzde}, guncelleme=NOW()`;

    return allowCors(ok({ mesaj: 'Fiyat kaydedildi', karYuzde: karYuzde.toFixed(2) }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
