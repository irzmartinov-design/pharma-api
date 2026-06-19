import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { siparisId, rol, karar, not } = await req.json();
    const sql = getDb();

    // Lazy migration
    try { await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_notu TEXT`; } catch(e) {}
    try { await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS admin_notu TEXT`; } catch(e) {}

    if (rol === 'Bayi') {
      const durumBayi = karar === 'Onaylandı' ? 'Admin Onay Bekliyor' : karar;
      await sql`UPDATE siparisler SET onay_bayi=${karar}, durum=${durumBayi}, bayi_notu=${not||null}
                WHERE id=${siparisId} OR id LIKE ${siparisId + '-%'}`;
    } else if (rol === 'Admin') {
      const red = karar === 'Reddedildi' ? (not||'') : '';
      const adminNotu = karar !== 'Reddedildi' ? (not||null) : null;
      await sql`UPDATE siparisler SET onay_admin=${karar}, durum=${karar}, red=${red}, admin_notu=${adminNotu}
                WHERE id=${siparisId} OR id LIKE ${siparisId + '-%'}`;
    }
    return allowCors(ok({ mesaj: 'Sipariş güncellendi' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
