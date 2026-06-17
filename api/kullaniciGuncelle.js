import { getDb, ok, err, allowCors } from './_db.js';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const raw = await req.json();
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const { id, ad, email, tel, durum, sifre, para } = d;
    if (!id) return allowCors(err('ID zorunlu'));

    const sql = getDb();
    const hash = sifre ? await sha256(sifre) : null;
    const hasDurum = durum !== undefined;
    const hasPara = para !== undefined;
    const aktif = hasDurum ? (durum === 'Aktif') : null;

    if (hash && hasDurum && hasPara) {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, aktif=${aktif}, sifre=${hash}, para=${para} WHERE id=${id}`;
    } else if (hash && hasDurum) {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, aktif=${aktif}, sifre=${hash} WHERE id=${id}`;
    } else if (hash && hasPara) {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, sifre=${hash}, para=${para} WHERE id=${id}`;
    } else if (hash) {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, sifre=${hash} WHERE id=${id}`;
    } else if (hasDurum && hasPara) {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, aktif=${aktif}, para=${para} WHERE id=${id}`;
    } else if (hasDurum) {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, aktif=${aktif} WHERE id=${id}`;
    } else if (hasPara) {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email}, para=${para} WHERE id=${id}`;
    } else {
      await sql`UPDATE kullanicilar SET ad=${ad}, email=${email} WHERE id=${id}`;
    }

    return allowCors(ok({ mesaj: 'Güncellendi' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
