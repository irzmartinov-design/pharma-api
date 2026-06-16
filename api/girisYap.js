import { getDb, ok, err, allowCors } from './_db.js';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { email, sifre } = await req.json();
    if (!email || !sifre) return allowCors(err('Email ve şifre zorunlu'));

    const hash = await sha256(sifre);
    const sql = getDb();
    const [kullanici] = await sql`
      SELECT id, ad, rol, bayi_id, para
      FROM kullanicilar
      WHERE email = ${email} AND (sifre = ${hash} OR sifre IS NULL) AND aktif = TRUE
      LIMIT 1`;

    if (!kullanici) return allowCors(err('Email veya şifre hatalı'));

    return allowCors(ok({ kullanici }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}

export const config = { runtime: 'edge' };
