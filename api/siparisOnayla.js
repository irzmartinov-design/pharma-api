import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { siparisId, rol, karar, not } = await req.json();
    const sql = getDb();
    if (rol === 'Bayi') {
      const durumBayi = karar === 'Onaylandı' ? 'Admin Onay Bekliyor' : karar;
      await sql`UPDATE siparisler SET onay_bayi=${karar}, durum=${durumBayi}, siparis_not=${not||null} WHERE id=${siparisId}`;
    } else if (rol === 'Admin') {
      const red = karar === 'Reddedildi' ? (not||'') : '';
      await sql`UPDATE siparisler SET onay_admin=${karar}, durum=${karar}, red=${red}, siparis_not=${not||null} WHERE id=${siparisId}`;
    }
    return allowCors(ok({ mesaj: 'Sipariş güncellendi' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
