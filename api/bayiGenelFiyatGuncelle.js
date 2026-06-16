import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, urunId, fiyat, para, mod, yuzde, marka, kategori, urun } = await req.json();
    const sql = getDb();

    const where = sql`bayi_id=${bayiId}
      AND (${marka||null} IS NULL OR marka=${marka})
      AND (${kategori||null} IS NULL OR kategori=${kategori})
      AND (${urun||null} IS NULL OR urun_adi=${urun})`;

    const rows = await sql`SELECT * FROM fiyat_bayi WHERE ${where}`;
    let guncellenen = 0;

    for (const row of rows) {
      let yeniFiyat;
      if (mod === '%') {
        // KURAL: % mod her zaman adminFiyat'ı baz alır
        const referans = row.fiyat_admin > 0 ? row.fiyat_admin : row.fiyat_bayi;
        yeniFiyat = referans * (1 + parseFloat(yuzde) / 100);
      } else {
        yeniFiyat = parseFloat(fiyat);
      }
      const karYuzde = row.fiyat_admin > 0
        ? ((yeniFiyat - row.fiyat_admin) / row.fiyat_admin * 100)
        : 0;
      await sql`UPDATE fiyat_bayi SET fiyat_bayi=${yeniFiyat}, para_bayi=${para||row.para_bayi}, kar_yuzde=${karYuzde}, guncelleme=NOW() WHERE id=${row.id}`;
      guncellenen++;
    }
    return allowCors(ok({ mesaj: `${guncellenen} ürün güncellendi` }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
