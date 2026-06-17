import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, fiyat, para, mod, yuzde, marka, kategori, urun } = await req.json();
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();

    let rows;
    if (marka && kategori && urun) {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka} AND kategori=${kategori} AND urun_adi=${urun}`;
    } else if (marka && kategori) {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka} AND kategori=${kategori}`;
    } else if (marka) {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka}`;
    } else {
      rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId}`;
    }
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
