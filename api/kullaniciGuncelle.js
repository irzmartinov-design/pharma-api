import { getDb, ok, err, allowCors } from './_db.js';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const body = typeof (await req.clone().json().catch(() => null)) === 'object'
      ? await req.json() : JSON.parse(await req.text());
    const d = typeof body === 'string' ? JSON.parse(body) : body;
    const { id, ad, email, tel, durum, sifre } = d;
    if (!id) return allowCors(err('ID zorunlu'));

    const sql = getDb();
    const aktif = durum === 'Aktif';

    if (sifre) {
      const hash = await sha256(sifre);
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, aktif=${aktif}, sifre=${hash} WHERE id=${id}`;
    } else {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, aktif=${aktif} WHERE id=${id}`;
    }

    return allowCors(ok({ mesaj: 'Güncellendi' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
