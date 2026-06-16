import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM markalar WHERE aktif=TRUE ORDER BY ad`;
    return allowCors(ok({ markalar: rows }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
