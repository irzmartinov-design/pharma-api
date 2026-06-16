import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { id } = await req.json();
    if (!id) return allowCors(err('ID zorunlu'));
    const sql = getDb();
    await sql`UPDATE urunler SET aktif = FALSE WHERE id = ${id}`;
    return allowCors(ok({ mesaj: 'Ürün pasife alındı' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
