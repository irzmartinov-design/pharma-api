import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, oran, aktif } = await req.json().catch(() => ({}));
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();
    await sql`ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS musteri_fiyat_orani NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS musteri_fiyat_orani_aktif BOOLEAN DEFAULT FALSE`;

    const oranVal = parseFloat(oran) || 0;
    const aktifVal = !!aktif;

    await sql`UPDATE kullanicilar SET musteri_fiyat_orani=${oranVal}, musteri_fiyat_orani_aktif=${aktifVal} WHERE id=${bayiId}`;

    // Aktifse hemen tüm ürünlere uygula
    if (aktifVal && oranVal > 0) {
      const urunler = await sql`SELECT id, fiyat_bayi, para FROM urunler WHERE aktif=TRUE AND fiyat_bayi IS NOT NULL AND fiyat_bayi > 0`;
      for (const u of urunler) {
        const yeniFiyat = parseFloat(u.fiyat_bayi) * (1 + oranVal / 100);
        const karYuzde = oranVal;
        await sql`
          INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
          VALUES (${bayiId}, ${u.id}, ${yeniFiyat}, ${u.para || 'TL'}, ${karYuzde}, NOW())
          ON CONFLICT (bayi_id, urun_id)
          DO UPDATE SET fiyat=${yeniFiyat}, para=${u.para || 'TL'}, kar_yuzde=${karYuzde}, guncelleme=NOW()`;
      }
      return allowCors(ok({ mesaj: `Oran kaydedildi ve ${urunler.length} ürün güncellendi`, basarili: true }));
    }

    return allowCors(ok({ mesaj: 'Oran kaydedildi', basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
