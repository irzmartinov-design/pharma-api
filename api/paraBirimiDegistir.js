import { getDb, ok, err, allowCors, r2 } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { tablo, bayiId, musteriId, yeniPara, marka, kategori, urun } = await req.json();
    if (!yeniPara) return allowCors(err('Yeni para birimi zorunlu'));
    const sql = getDb();

    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(r => { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    const getKur = (para) => kurMap[para] || 1;
    const yeniKur = getKur(yeniPara);

    const m = marka || null, k = kategori || null, u = urun || null;

    if (tablo === 'FB') {
      if (!bayiId) return allowCors(err('Bayi ID zorunlu'));

      const urunler = await sql`
        SELECT u.id AS urun_id, COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
               COALESCE(bf.para, u.para) AS para, COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
        FROM urunler u LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
        WHERE u.aktif = TRUE
          AND u.marka=COALESCE(${m},u.marka) AND u.kategori=COALESCE(${k},u.kategori) AND u.ad=COALESCE(${u},u.ad)`;

      if (!urunler.length) return allowCors(ok({ mesaj: '0 ürün güncellendi', basarili: true }));

      const urunIds = urunler.map(r => String(r.urun_id));
      const fiyatArr = urunler.map(r => {
        const eskiKur = getKur(r.para);
        const f = parseFloat(r.fiyat) || 0;
        return r2((eskiKur > 0 && yeniKur > 0) ? f * yeniKur / eskiKur : f);
      });
      const karArr = urunler.map(r => parseFloat(r.kar_yuzde) || 0);

      await sql`
        INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
        SELECT ${bayiId}, unnest(${urunIds}::text[]), unnest(${fiyatArr}::numeric[]),
               ${yeniPara}, unnest(${karArr}::numeric[]), NOW()
        ON CONFLICT (bayi_id, urun_id)
        DO UPDATE SET fiyat = EXCLUDED.fiyat, para = EXCLUDED.para, guncelleme = NOW()`;

      return allowCors(ok({ mesaj: `${urunler.length} ürün ${yeniPara} para birimine çevrildi`, basarili: true }));
    } else {
      // FM — müşteri fiyatları
      if (!musteriId) return allowCors(err('Müşteri ID zorunlu'));

      const [musteri] = await sql`SELECT bayi_id FROM kullanicilar WHERE id = ${musteriId} LIMIT 1`;
      const mBayiId = musteri ? musteri.bayi_id : null;

      const urunler = await sql`
        SELECT u.id AS urun_id, COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
               COALESCE(mf.para, u.para) AS para, COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
        FROM urunler u LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
        WHERE u.aktif = TRUE
          AND u.marka=COALESCE(${m},u.marka) AND u.kategori=COALESCE(${k},u.kategori) AND u.ad=COALESCE(${u},u.ad)`;

      if (!urunler.length) return allowCors(ok({ mesaj: '0 ürün güncellendi', basarili: true }));

      const urunIds = urunler.map(r => String(r.urun_id));
      const fiyatArr = urunler.map(r => {
        const eskiKur = getKur(r.para);
        const f = parseFloat(r.fiyat) || 0;
        return r2((eskiKur > 0 && yeniKur > 0) ? f * yeniKur / eskiKur : f);
      });
      const karArr = urunler.map(r => parseFloat(r.kar_yuzde) || 0);
      const bayiArr = urunler.map(() => mBayiId);

      await sql`
        INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
        SELECT ${musteriId}, unnest(${bayiArr}::text[]), unnest(${urunIds}::text[]),
               unnest(${fiyatArr}::numeric[]), ${yeniPara}, unnest(${karArr}::numeric[]), NOW()
        ON CONFLICT (musteri_id, urun_id)
        DO UPDATE SET fiyat = EXCLUDED.fiyat, para = EXCLUDED.para, guncelleme = NOW()`;

      return allowCors(ok({ mesaj: `${urunler.length} ürün ${yeniPara} para birimine çevrildi`, basarili: true }));
    }
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
