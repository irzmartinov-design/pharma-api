import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { markaId } = await req.json().catch(() => ({}));
    const sql = getDb();
    const rows = markaId
      ? await sql`SELECT * FROM kategoriler WHERE marka_id=${markaId} AND aktif=TRUE ORDER BY ad`
      : await sql`SELECT * FROM kategoriler WHERE aktif=TRUE ORDER BY ad`;
    return allowCors(ok({ kategoriler: rows }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
