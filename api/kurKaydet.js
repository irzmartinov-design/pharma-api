import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { para, deger } = await req.json();
    if (!para || !deger) return allowCors(err('Para birimi ve değer zorunlu'));
    const sql = getDb();
    await sql`INSERT INTO ayarlar (anahtar,deger) VALUES (${'kur_'+para},${String(deger)}) ON CONFLICT (anahtar) DO UPDATE SET deger=${String(deger)}, guncelleme=NOW()`;
    return allowCors(ok({ mesaj: `${para} kuru güncellendi` }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
