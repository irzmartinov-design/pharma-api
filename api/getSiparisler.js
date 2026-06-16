import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { kullaniciId, rol, limit = 100 } = await req.json().catch(() => ({}));
    const sql = getDb();

    let rows;
    if (rol === 'Admin') {
      rows = await sql`SELECT * FROM siparisler ORDER BY tarih DESC LIMIT ${limit}`;
    } else if (rol === 'Bayi') {
      rows = await sql`SELECT * FROM siparisler WHERE bayi_kod = ${kullaniciId} ORDER BY tarih DESC LIMIT ${limit}`;
    } else {
      rows = await sql`SELECT * FROM siparisler WHERE musteri_id = ${kullaniciId} ORDER BY tarih DESC LIMIT ${limit}`;
    }

    return allowCors(ok({ siparisler: rows }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}

export const config = { runtime: 'edge' };
