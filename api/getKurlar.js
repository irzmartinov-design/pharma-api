import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    const rows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurlar = {};
    rows.forEach(r => { kurlar[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    return allowCors(ok({ kurlar }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}

export const config = { runtime: 'edge' };
