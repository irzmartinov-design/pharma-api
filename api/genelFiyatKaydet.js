import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { marka, kategori, urun, para, mod, fiyatBayi, fiyatMusteri, taban } = await req.json();
    if (!para) return allowCors(err('Para birimi zorunlu'));

    const sql = getDb();
    const yuzde = mod === '%';
    const yFB = fiyatBayi != null ? parseFloat(fiyatBayi) : null;
    const yFM = fiyatMusteri != null ? parseFloat(fiyatMusteri) : null;

    // COALESCE: parametre NULL ise kolon kendi değeriyle eşleşir (filtre yok)
    // Parametre doluysa o değere göre filtreler
    const m = marka || null;
    const k = kategori || null;
    const u = urun || null;

    if (yFB != null) {
      if (taban) {
        // Ürünler sayfası: Bayi + Müşteri taban fiyatları birlikte (Tokken bazlı)
        yuzde
          ? await sql`UPDATE urunler SET fiyat_bayi=ROUND(fiyat_bayi*(1+${yFB}/100),2), fiyat_taban=ROUND(fiyat_bayi*(1+${yFB}/100),2), fiyat_musteri=ROUND(fiyat_bayi*(1+${yFB}/100),2), para=${para}
              WHERE aktif=TRUE AND marka=COALESCE(${m},marka) AND kategori=COALESCE(${k},kategori) AND ad=COALESCE(${u},ad)`
          : await sql`UPDATE urunler SET fiyat_bayi=${yFB}, fiyat_taban=${yFB}, fiyat_musteri=${yFB}, para=${para}
              WHERE aktif=TRUE AND marka=COALESCE(${m},marka) AND kategori=COALESCE(${k},kategori) AND ad=COALESCE(${u},ad)`;
      } else {
        yuzde
          ? await sql`UPDATE urunler SET fiyat_bayi=ROUND(fiyat_bayi*(1+${yFB}/100),2), para=${para}
              WHERE aktif=TRUE AND marka=COALESCE(${m},marka) AND kategori=COALESCE(${k},kategori) AND ad=COALESCE(${u},ad)`
          : await sql`UPDATE urunler SET fiyat_bayi=${yFB}, para=${para}
              WHERE aktif=TRUE AND marka=COALESCE(${m},marka) AND kategori=COALESCE(${k},kategori) AND ad=COALESCE(${u},ad)`;
      }
    } else if (yFM != null) {
      await sql`UPDATE urunler SET fiyat_musteri=${yFM}, para=${para}
        WHERE aktif=TRUE AND marka=COALESCE(${m},marka) AND kategori=COALESCE(${k},kategori) AND ad=COALESCE(${u},ad)`;
    }

    // Aktif otomatik oranlı bayileri tek INSERT…SELECT ile güncelle
    const aktifBayiler = await sql`
      SELECT id, musteri_fiyat_orani FROM kullanicilar
      WHERE rol='Bayi' AND aktif=TRUE AND musteri_fiyat_orani_aktif=TRUE AND musteri_fiyat_orani > 0
    `.catch(() => []);

    for (const bayi of aktifBayiler) {
      const oran = parseFloat(bayi.musteri_fiyat_orani);
      await sql`INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
        SELECT ${bayi.id}, u.id, ROUND(u.fiyat_bayi*(1+${oran}/100),2), ${para}, ${oran}, NOW()
        FROM urunler u
        WHERE u.aktif=TRUE AND u.fiyat_bayi>0
          AND u.marka=COALESCE(${m},u.marka) AND u.kategori=COALESCE(${k},u.kategori) AND u.ad=COALESCE(${u},u.ad)
        ON CONFLICT (bayi_id, urun_id)
        DO UPDATE SET fiyat=EXCLUDED.fiyat, para=EXCLUDED.para, kar_yuzde=EXCLUDED.kar_yuzde, guncelleme=EXCLUDED.guncelleme`;
    }

    return allowCors(ok({ mesaj: 'Fiyatlar güncellendi', basarili: true }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
