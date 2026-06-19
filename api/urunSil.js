import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { id, rol } = await req.json().catch(() => ({}));
    if (!id) return allowCors(err('ID zorunlu'));
    if (rol !== 'Admin') return allowCors(err('Bu işlem için yetkiniz yok'));
    const sql = getDb();
    await sql`UPDATE urunler SET aktif = FALSE WHERE id = ${id}`;
    return allowCors(ok({ mesaj: 'Ürün pasife alındı', basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
