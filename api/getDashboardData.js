import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { rol, bayiId, musteriId } = await req.json().catch(() => ({}));
    const sql = getDb();
    const bid = bayiId || '';
    const mid = musteriId || '';

    const [bayiler, musteriler, markalar, kategoriler, s1, s2, s3, s4] = await Promise.all([
      sql`SELECT id,ad,email,para FROM kullanicilar WHERE rol='Bayi' AND aktif=TRUE ORDER BY ad`,
      rol === 'Bayi'
        ? sql`SELECT id,ad,email,para FROM kullanicilar WHERE rol='Musteri' AND bayi_id=${bid} AND aktif=TRUE ORDER BY ad`
        : sql`SELECT id,ad,email,para FROM kullanicilar WHERE rol='Musteri' AND aktif=TRUE ORDER BY ad`,
      sql`SELECT id,ad FROM markalar WHERE aktif=TRUE ORDER BY ad`,
      sql`SELECT id,ad,marka_id FROM kategoriler WHERE aktif=TRUE ORDER BY ad`,
      // Bekleyen
      rol === 'Admin'
        ? sql`SELECT COUNT(*) FROM siparisler WHERE durum='Admin Onay Bekliyor' AND id ~ '^SP-[0-9]+$'`
        : rol === 'Bayi'
          ? sql`SELECT COUNT(*) FROM siparisler WHERE bayi_kod=${bid} AND (durum='Bayi Onay Bekliyor' OR durum='Admin Onay Bekliyor') AND id ~ '^SP-[0-9]+$'`
          : sql`SELECT COUNT(*) FROM siparisler WHERE musteri_id=${mid} AND (durum='Bayi Onay Bekliyor' OR durum='Admin Onay Bekliyor') AND id ~ '^SP-[0-9]+$'`,
      // Onaylanan
      rol === 'Admin'
        ? sql`SELECT COUNT(*) FROM siparisler WHERE durum='Onaylandı' AND id ~ '^SP-[0-9]+$'`
        : rol === 'Bayi'
          ? sql`SELECT COUNT(*) FROM siparisler WHERE bayi_kod=${bid} AND durum='Onaylandı' AND id ~ '^SP-[0-9]+$'`
          : sql`SELECT COUNT(*) FROM siparisler WHERE musteri_id=${mid} AND durum='Onaylandı' AND id ~ '^SP-[0-9]+$'`,
      // Tamamlanan
      rol === 'Admin'
        ? sql`SELECT COUNT(*) FROM siparisler WHERE durum='Tamamlandı' AND id ~ '^SP-[0-9]+$'`
        : rol === 'Bayi'
          ? sql`SELECT COUNT(*) FROM siparisler WHERE bayi_kod=${bid} AND durum='Tamamlandı' AND id ~ '^SP-[0-9]+$'`
          : sql`SELECT COUNT(*) FROM siparisler WHERE musteri_id=${mid} AND durum='Tamamlandı' AND id ~ '^SP-[0-9]+$'`,
      // Reddedilen
      rol === 'Admin'
        ? sql`SELECT COUNT(*) FROM siparisler WHERE durum='Reddedildi' AND id ~ '^SP-[0-9]+$'`
        : rol === 'Bayi'
          ? sql`SELECT COUNT(*) FROM siparisler WHERE bayi_kod=${bid} AND durum='Reddedildi' AND id ~ '^SP-[0-9]+$'`
          : sql`SELECT COUNT(*) FROM siparisler WHERE musteri_id=${mid} AND durum='Reddedildi' AND id ~ '^SP-[0-9]+$'`
    ]);

    return allowCors(ok({
      bayiler, musteriler, markalar, kategoriler,
      bekleyenSayisi:   parseInt(s1[0]?.count) || 0,
      onaylananSayisi:  parseInt(s2[0]?.count) || 0,
      tamamlananSayisi: parseInt(s3[0]?.count) || 0,
      reddedilenSayisi: parseInt(s4[0]?.count) || 0
    }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
