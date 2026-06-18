import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, musteriId, marka, kategori, urun, para, mod, fiyat, yuzde } = await req.json();
    if (!bayiId || !musteriId) return allowCors(err('Bayi ID ve Müşteri ID zorunlu'));
    const sql = getDb();

    // Tek sorguda: ürünler + bayi özel fiyat (varsa) birleşik
    let urunler;
    if (marka && kategori && urun) {
      urunler = await sql`
        SELECT u.id, COALESCE(bf.fiyat, u.fiyat_musteri) AS baz, u.para
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id=u.id AND bf.bayi_id=${bayiId}
        WHERE u.aktif=TRUE AND u.marka=${marka} AND u.kategori=${kategori} AND u.ad=${urun}`;
    } else if (marka && kategori) {
      urunler = await sql`
        SELECT u.id, COALESCE(bf.fiyat, u.fiyat_musteri) AS baz, u.para
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id=u.id AND bf.bayi_id=${bayiId}
        WHERE u.aktif=TRUE AND u.marka=${marka} AND u.kategori=${kategori}`;
    } else if (marka) {
      urunler = await sql`
        SELECT u.id, COALESCE(bf.fiyat, u.fiyat_musteri) AS baz, u.para
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id=u.id AND bf.bayi_id=${bayiId}
        WHERE u.aktif=TRUE AND u.marka=${marka}`;
    } else {
      urunler = await sql`
        SELECT u.id, COALESCE(bf.fiyat, u.fiyat_musteri) AS baz, u.para
        FROM urunler u
        LEFT JOIN bayi_fiyatlari bf ON bf.urun_id=u.id AND bf.bayi_id=${bayiId}
        WHERE u.aktif=TRUE`;
    }

    if (!urunler.length) return allowCors(ok({ mesaj: '0 ürün güncellendi' }));

    // JS'de hesapla, tek bulk upsert
    const ids = [], fiyatlar = [], paralar = [], karlar = [];
    for (const u of urunler) {
      const baz = parseFloat(u.baz) || 0;
      const yeniFiyat = (mod === '%' || mod === 'yuzde')
        ? baz * (1 + parseFloat(yuzde ?? fiyat) / 100)
        : parseFloat(fiyat);
      const karYuzde = baz > 0 ? ((yeniFiyat - baz) / baz * 100) : 0;
      ids.push(u.id);
      fiyatlar.push(yeniFiyat);
      paralar.push(para || u.para || 'TL');
      karlar.push(karYuzde);
    }

    await sql`
      INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      SELECT ${musteriId}, ${bayiId},
             unnest(${ids}::text[]),
             unnest(${fiyatlar}::numeric[]),
             unnest(${paralar}::text[]),
             unnest(${karlar}::numeric[]),
             NOW()
      ON CONFLICT (musteri_id, urun_id)
      DO UPDATE SET fiyat=EXCLUDED.fiyat, para=EXCLUDED.para,
                    kar_yuzde=EXCLUDED.kar_yuzde, guncelleme=NOW()`;

    return allowCors(ok({ mesaj: `${ids.length} ürün güncellendi` }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
