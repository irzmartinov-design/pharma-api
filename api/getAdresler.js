import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId } = await req.json().catch(() => ({}));
    const sql = getDb();
    const rows = musteriId
      ? await sql`SELECT * FROM adresler WHERE musteri_id=${musteriId} AND aktif=TRUE ORDER BY ad`
      : await sql`SELECT * FROM adresler WHERE aktif=TRUE ORDER BY ad`;
    return allowCors(ok({ adresler: rows }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
