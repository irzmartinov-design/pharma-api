import { getDb, ok, err, allowCors } from './_db.js';

// Toplu görsel atama — [{marka, ad, url}] dizisi alır, tek SQL ile (timeout riski yok)
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { atamalar } = await req.json();
    if (!Array.isArray(atamalar) || !atamalar.length) return allowCors(err('Atama listesi zorunlu'));
    const sql = getDb();

    const markalar = atamalar.map(a => a.marka);
    const adlar = atamalar.map(a => a.ad);
    const urller = atamalar.map(a => a.url);

    const result = await sql`
      UPDATE urunler u
      SET gorsel_url = data.url
      FROM (
        SELECT unnest(${markalar}::text[]) AS marka,
               unnest(${adlar}::text[]) AS ad,
               unnest(${urller}::text[]) AS url
      ) AS data
      WHERE u.marka = data.marka AND u.ad = data.ad AND u.aktif = TRUE
      RETURNING u.id`;

    return allowCors(ok({ mesaj: `${result.length} ürüne görsel atandı`, basarili: true }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
