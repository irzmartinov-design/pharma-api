import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const log = [];

    // 1. bayi_fiyatlari — yeni, temiz tablo
    await sql`
      CREATE TABLE IF NOT EXISTS bayi_fiyatlari (
        id        SERIAL PRIMARY KEY,
        bayi_id   TEXT NOT NULL,
        urun_id   TEXT NOT NULL,
        fiyat     NUMERIC DEFAULT 0,
        para      TEXT    DEFAULT 'TL',
        kar_yuzde NUMERIC DEFAULT 0,
        guncelleme TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(bayi_id, urun_id)
      )`;
    log.push('bayi_fiyatlari tablosu hazır');

    // 2. musteri_fiyatlari — yeni, temiz tablo
    await sql`
      CREATE TABLE IF NOT EXISTS musteri_fiyatlari (
        id         SERIAL PRIMARY KEY,
        musteri_id TEXT NOT NULL,
        bayi_id    TEXT NOT NULL,
        urun_id    TEXT NOT NULL,
        fiyat      NUMERIC DEFAULT 0,
        para       TEXT    DEFAULT 'TL',
        kar_yuzde  NUMERIC DEFAULT 0,
        guncelleme TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(musteri_id, urun_id)
      )`;
    log.push('musteri_fiyatlari tablosu hazır');

    // 3. siparisler.bayi_id kolonu ekle (bayi_kod'un FK versiyonu)
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_id TEXT`;
    await sql`UPDATE siparisler SET bayi_id = bayi_kod WHERE bayi_id IS NULL AND bayi_kod IS NOT NULL`;
    log.push('siparisler.bayi_id eklendi');

    // 4. Mevcut fiyat_bayi → bayi_fiyatlari (urun_id olan kayıtlar)
    const fbSonuc = await sql`
      INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      SELECT bayi_id, urun_id, fiyat_bayi, para_bayi, kar_yuzde, guncelleme
      FROM fiyat_bayi
      WHERE urun_id IS NOT NULL AND bayi_id IS NOT NULL
      ON CONFLICT (bayi_id, urun_id) DO NOTHING`;
    log.push('fiyat_bayi → bayi_fiyatlari: taşındı');

    // 5. Mevcut fiyat_musteri → musteri_fiyatlari
    const fmSonuc = await sql`
      INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      SELECT musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme
      FROM fiyat_musteri
      WHERE urun_id IS NOT NULL AND musteri_id IS NOT NULL
      ON CONFLICT (musteri_id, urun_id) DO NOTHING`;
    log.push('fiyat_musteri → musteri_fiyatlari: taşındı');

    // 6. playing_with_neon sil
    await sql`DROP TABLE IF EXISTS playing_with_neon`;
    log.push('playing_with_neon silindi');

    // 7. Eski tabloları yedekle (isim değiştir, silme)
    await sql`ALTER TABLE IF EXISTS fiyat_bayi RENAME TO _eski_fiyat_bayi`;
    log.push('fiyat_bayi → _eski_fiyat_bayi (yedek)');

    await sql`ALTER TABLE IF EXISTS fiyat_musteri RENAME TO _eski_fiyat_musteri`;
    log.push('fiyat_musteri → _eski_fiyat_musteri (yedek)');

    // Sayımlar
    const [bf] = await sql`SELECT COUNT(*) AS n FROM bayi_fiyatlari`;
    const [mf] = await sql`SELECT COUNT(*) AS n FROM musteri_fiyatlari`;
    const [ur] = await sql`SELECT COUNT(*) AS n FROM urunler`;

    return allowCors(ok({
      log,
      sayimlar: {
        urunler: ur.n,
        bayi_fiyatlari: bf.n,
        musteri_fiyatlari: mf.n
      }
    }));
  } catch (e) {
    return allowCors(err('Migration hatası: ' + e.message, 500));
  }
}
export const config = { runtime: 'edge' };
