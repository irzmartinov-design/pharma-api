import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, rol } = await req.json().catch(() => ({}));
    const sql = getDb();
    const rows = rol === 'Bayi'
      ? await sql`SELECT * FROM kullanicilar WHERE rol='Musteri' AND bayi_id=${bayiId} AND aktif=TRUE ORDER BY ad`
      : await sql`SELECT * FROM kullanicilar WHERE rol='Musteri' AND aktif=TRUE ORDER BY ad`;
    return allowCors(ok({ musteriler: rows }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
