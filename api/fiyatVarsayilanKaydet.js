import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    // Lazy migration
    await sql`ALTER TABLE urunler ADD COLUMN IF NOT EXISTS varsayilan_fiyat_bayi NUMERIC`;
    await sql`ALTER TABLE urunler ADD COLUMN IF NOT EXISTS varsayilan_tarih TIMESTAMPTZ`;

    await sql`
      UPDATE urunler
      SET varsayilan_fiyat_bayi = fiyat_bayi,
          varsayilan_tarih = NOW()
      WHERE aktif = TRUE`;

    return allowCors(ok({ mesaj: 'Varsayılan fiyatlar kaydedildi', basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
