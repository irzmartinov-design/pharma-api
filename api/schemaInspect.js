import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    const result = {};
    for (const t of tables) {
      const cols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name=${t.table_name} AND table_schema='public' ORDER BY ordinal_position`;
      result[t.table_name] = cols.map(c => ({ col: c.column_name, type: c.data_type, null: c.is_nullable, def: c.column_default }));
    }
    const countRows = await sql`
      SELECT relname AS tbl, reltuples::bigint AS approx
      FROM pg_class WHERE relkind='r' AND relnamespace=(SELECT oid FROM pg_namespace WHERE nspname='public')`;
    const counts = {};
    countRows.forEach(r => { counts[r.tbl] = r.approx; });
    return allowCors(ok({ tables: result, counts }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
