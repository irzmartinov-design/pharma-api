import { getDb, ok, err, allowCors } from './_db.js';

// Admin'in belirli bayinin tüm fiyatlarını toplu güncelleme (filtre ile)
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, fiyat, para, mod, yuzde, marka, kategori, urun } = await req.json();
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();

    // Filtre koşuluna göre ürünleri al (genel fiyatı referans alacağız)
    let urunler;
    if (marka && kategori && urun) {
      urunler = await sql`SELECT id, fiyat_bayi, para FROM urunler WHERE aktif=TRUE AND marka=${marka} AND kategori=${kategori} AND ad=${urun}`;
    } else if (marka && kategori) {
      urunler = await sql`SELECT id, fiyat_bayi, para FROM urunler WHERE aktif=TRUE AND marka=${marka} AND kategori=${kategori}`;
    } else if (marka) {
      urunler = await sql`SELECT id, fiyat_bayi, para FROM urunler WHERE aktif=TRUE AND marka=${marka}`;
    } else {
      urunler = await sql`SELECT id, fiyat_bayi, para FROM urunler WHERE aktif=TRUE`;
    }

    let guncellenen = 0;
    for (const u of urunler) {
      const genelFiyat = parseFloat(u.fiyat_bayi) || 0;
      let yeniFiyat;
      if (mod === '%' || mod === 'yuzde') {
        yeniFiyat = genelFiyat * (1 + parseFloat(yuzde || fiyat) / 100);
      } else {
        yeniFiyat = parseFloat(fiyat);
      }
      const karYuzde = genelFiyat > 0 ? ((yeniFiyat - genelFiyat) / genelFiyat * 100) : 0;

      await sql`
        INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
        VALUES (${bayiId}, ${u.id}, ${yeniFiyat}, ${para || u.para || 'TL'}, ${karYuzde}, NOW())
        ON CONFLICT (bayi_id, urun_id)
        DO UPDATE SET fiyat=${yeniFiyat}, para=${para || u.para || 'TL'}, kar_yuzde=${karYuzde}, guncelleme=NOW()`;
      guncellenen++;
    }

    return allowCors(ok({ mesaj: `${guncellenen} ürün güncellendi` }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
