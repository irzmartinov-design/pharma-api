import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { rol, bayiId } = await req.json().catch(() => ({}));
    const sql = getDb();
    const [bayiler, musteriler, markalar, siparisler] = await Promise.all([
      sql`SELECT id,ad,email,para FROM kullanicilar WHERE rol='Bayi' AND aktif=TRUE ORDER BY ad`,
      rol === 'Bayi'
        ? sql`SELECT id,ad,email,para FROM kullanicilar WHERE rol='Musteri' AND bayi_id=${bayiId||''} AND aktif=TRUE ORDER BY ad`
        : sql`SELECT id,ad,email,para FROM kullanicilar WHERE rol='Musteri' AND aktif=TRUE ORDER BY ad`,
      sql`SELECT id,ad FROM markalar WHERE aktif=TRUE ORDER BY ad`,
      rol === 'Admin'
        ? sql`SELECT durum FROM siparisler WHERE durum='Bekliyor'`
        : rol === 'Bayi'
          ? sql`SELECT durum FROM siparisler WHERE bayi_kod=${bayiId||''} AND durum='Bekliyor'`
          : sql`SELECT durum FROM siparisler WHERE durum='Bekliyor' LIMIT 0`
    ]);
    return allowCors(ok({
      bayiler, musteriler, markalar,
      bekleyenSayisi: siparisler.length
    }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
