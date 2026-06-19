import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { id, musteriId, ad, adres, sehir, islem, adSoyad, tel, ilce } = await req.json();
    const sql = getDb();
    // Lazy migration for extra columns
    await sql`ALTER TABLE adresler ADD COLUMN IF NOT EXISTS ad_soyad TEXT`;
    await sql`ALTER TABLE adresler ADD COLUMN IF NOT EXISTS tel TEXT`;
    await sql`ALTER TABLE adresler ADD COLUMN IF NOT EXISTS ilce TEXT`;
    if (islem === 'sil') {
      await sql`UPDATE adresler SET aktif=FALSE WHERE id=${id}`;
      return allowCors(ok({ mesaj: 'Adres silindi' }));
    }
    if (islem === 'guncelle') {
      await sql`UPDATE adresler SET ad=${ad}, adres=${adres}, sehir=${sehir}, ad_soyad=${adSoyad||null}, tel=${tel||null}, ilce=${ilce||null} WHERE id=${id}`;
      return allowCors(ok({ mesaj: 'Adres güncellendi' }));
    }
    const yeniId = `ADR-${Date.now()}`;
    await sql`INSERT INTO adresler (id,musteri_id,ad,adres,sehir,ad_soyad,tel,ilce,aktif) VALUES (${yeniId},${musteriId},${ad},${adres},${sehir||''},${adSoyad||null},${tel||null},${ilce||null},TRUE)`;
    return allowCors(ok({ mesaj: 'Adres eklendi', id: yeniId }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
