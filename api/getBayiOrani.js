import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId } = await req.json().catch(() => ({}));
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();
    await sql`ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS musteri_fiyat_orani NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS musteri_fiyat_orani_aktif BOOLEAN DEFAULT FALSE`;
    const rows = await sql`SELECT musteri_fiyat_orani, musteri_fiyat_orani_aktif FROM kullanicilar WHERE id=${bayiId} LIMIT 1`;
    const row = rows[0] || {};
    return allowCors(ok({
      oran: parseFloat(row.musteri_fiyat_orani) || 0,
      aktif: row.musteri_fiyat_orani_aktif || false
    }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
