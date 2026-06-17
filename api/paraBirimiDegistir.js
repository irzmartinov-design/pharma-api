import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { tablo, bayiId, musteriId, yeniPara, marka, kategori, urun } = await req.json();
    if (!yeniPara) return allowCors(err('Yeni para birimi zorunlu'));
    const sql = getDb();

    // Tüm kur değerlerini tek sorguda al
    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(function(r) { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    function getKurVal(para) { return kurMap[para] || 1; }
    const yeniKur = getKurVal(yeniPara);

    let guncellenen = 0;

    if (tablo === 'FB') {
      if (!bayiId) return allowCors(err('Bayi ID zorunlu'));

      // Tüm uygun ürünleri urunler + mevcut bayi_fiyatlari ile al (kayıtsız olanlar da dahil)
      let urunler;
      if (marka && kategori && urun) {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para,
                 COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}`;
      } else if (marka && kategori) {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para,
                 COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori}`;
      } else if (marka) {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para,
                 COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE AND u.marka = ${marka}`;
      } else {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(bf.fiyat, u.fiyat_bayi) AS fiyat,
                 COALESCE(bf.para, u.para) AS para,
                 COALESCE(bf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN bayi_fiyatlari bf ON bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
          WHERE u.aktif = TRUE`;
      }

      for (const u of urunler) {
        const eskiKur = getKurVal(u.para);
        const fiyat = parseFloat(u.fiyat) || 0;
        const yeniFiyat = eskiKur > 0 && yeniKur > 0 ? fiyat * yeniKur / eskiKur : fiyat;
        await sql`
          INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
          VALUES (${bayiId}, ${u.urun_id}, ${yeniFiyat}, ${yeniPara}, ${u.kar_yuzde}, NOW())
          ON CONFLICT (bayi_id, urun_id)
          DO UPDATE SET fiyat = ${yeniFiyat}, para = ${yeniPara}, guncelleme = NOW()`;
        guncellenen++;
      }
    } else {
      // FM — müşteri fiyatları
      if (!musteriId) return allowCors(err('Müşteri ID zorunlu'));

      const [musteri] = await sql`SELECT bayi_id FROM kullanicilar WHERE id = ${musteriId} LIMIT 1`;
      const mBayiId = musteri ? musteri.bayi_id : null;

      let urunler;
      if (marka && kategori && urun) {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para,
                 COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}`;
      } else if (marka && kategori) {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para,
                 COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE AND u.marka = ${marka} AND u.kategori = ${kategori}`;
      } else if (marka) {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para,
                 COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE AND u.marka = ${marka}`;
      } else {
        urunler = await sql`
          SELECT u.id AS urun_id,
                 COALESCE(mf.fiyat, u.fiyat_musteri) AS fiyat,
                 COALESCE(mf.para, u.para) AS para,
                 COALESCE(mf.kar_yuzde, 0) AS kar_yuzde
          FROM urunler u
          LEFT JOIN musteri_fiyatlari mf ON mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
          WHERE u.aktif = TRUE`;
      }

      for (const u of urunler) {
        const eskiKur = getKurVal(u.para);
        const fiyat = parseFloat(u.fiyat) || 0;
        const yeniFiyat = eskiKur > 0 && yeniKur > 0 ? fiyat * yeniKur / eskiKur : fiyat;
        await sql`
          INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
          VALUES (${musteriId}, ${mBayiId}, ${u.urun_id}, ${yeniFiyat}, ${yeniPara}, ${u.kar_yuzde}, NOW())
          ON CONFLICT (musteri_id, urun_id)
          DO UPDATE SET fiyat = ${yeniFiyat}, para = ${yeniPara}, guncelleme = NOW()`;
        guncellenen++;
      }
    }

    return allowCors(ok({ mesaj: `${guncellenen} ürün ${yeniPara} para birimine çevrildi`, basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
