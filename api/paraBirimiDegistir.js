import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { tablo, bayiId, musteriId, yeniPara, marka, kategori, urun } = await req.json();
    if (!yeniPara) return allowCors(err('Yeni para birimi zorunlu'));
    const sql = getDb();

    // Kur değerlerini tek sorguda al
    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(r => { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    const getKur = (para) => kurMap[para] || 1;
    const yeniKur = getKur(yeniPara);

    if (tablo === 'FB') {
      if (!bayiId) return allowCors(err('Bayi ID zorunlu'));

      // Tüm uygun ürünleri COALESCE ile al (kaydı olmayanlar da dahil)
      let urunler;
      if (marka && kategori && urun) {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para, COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}`;
      } else if (marka && kategori) {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para, COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori}`;
      } else if (marka) {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para, COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE AND u.marka = ${marka}`;
      } else {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para, COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE`;
      }

      if (!urunler.length) return allowCors(ok({ mesaj: '0 ürün güncellendi', basarili: true }));

      // Fiyatları hesapla
      const urunIds = urunler.map(u => String(u.urun_id));
      const fiyatArr = urunler.map(u => {
        const eskiKur = getKur(u.para);
        const f = parseFloat(u.fiyat) || 0;
        return (eskiKur > 0 && yeniKur > 0) ? f * yeniKur / eskiKur : f;
      });
      const karArr = urunler.map(u => parseFloat(u.kar_yuzde) || 0);

      // Tek sorguda batch UPSERT (N+1 yok, timeout riski yok)
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

      let urunler;
      if (marka && kategori && urun) {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para, COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}`;
      } else if (marka && kategori) {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para, COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori}`;
      } else if (marka) {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para, COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE AND u.marka = ${marka}`;
      } else {
        urunler = await sql`
          SELECT u.id AS urun_id, COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para, COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE`;
      }

      if (!urunler.length) return allowCors(ok({ mesaj: '0 ürün güncellendi', basarili: true }));

      const urunIds = urunler.map(u => String(u.urun_id));
      const fiyatArr = urunler.map(u => {
        const eskiKur = getKur(u.para);
        const f = parseFloat(u.fiyat) || 0;
        return (eskiKur > 0 && yeniKur > 0) ? f * yeniKur / eskiKur : f;
      });
      const karArr = urunler.map(u => parseFloat(u.kar_yuzde) || 0);
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
