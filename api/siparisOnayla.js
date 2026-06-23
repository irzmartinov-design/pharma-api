import { getDb, ok, err, allowCors } from './_db.js';
import { siparisMailBildir } from './_bildirim.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { siparisId, rol, karar, not } = await req.json();
    const sql = getDb();

    // Lazy migration
    try { await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_notu TEXT`; } catch(e) {}
    try { await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS admin_notu TEXT`; } catch(e) {}

    let durum, satirlar;
    if (rol === 'Bayi') {
      durum = karar === 'Onaylandı' ? 'Admin Onay Bekliyor' : karar;
      satirlar = await sql`UPDATE siparisler SET onay_bayi=${karar}, durum=${durum}, bayi_notu=${not||null}
                WHERE id=${siparisId} OR id LIKE ${siparisId + '-%'} RETURNING bayi_kod, musteri_id, urun_adi`;
    } else if (rol === 'Admin') {
      durum = karar;
      const red = karar === 'Reddedildi' ? (not||'') : '';
      const adminNotu = karar !== 'Reddedildi' ? (not||null) : null;
      satirlar = await sql`UPDATE siparisler SET onay_admin=${karar}, durum=${karar}, red=${red}, admin_notu=${adminNotu}
                WHERE id=${siparisId} OR id LIKE ${siparisId + '-%'} RETURNING bayi_kod, musteri_id, urun_adi`;
    }

    if (satirlar && satirlar[0]) {
      const { bayi_kod, musteri_id, urun_adi } = satirlar[0];
      await siparisMailBildir(sql, { grupId: siparisId, durum, bayiKod: bayi_kod, musteriId: musteri_id, urunAdi: urun_adi });
    }

    return allowCors(ok({ mesaj: 'Sipariş güncellendi' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
