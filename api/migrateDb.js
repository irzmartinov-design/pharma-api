import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    // Yeni kolonlar
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_toplam NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_notu TEXT`;
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS admin_notu TEXT`;
    // Eski test verisi: durum NULL → Admin Onay Bekliyor
    await sql`UPDATE siparisler SET durum='Admin Onay Bekliyor' WHERE durum IS NULL`;
    return allowCors(ok({ mesaj: 'Migrasyon tamamlandı' }));
  } catch(e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
