import { getDb, ok, err, allowCors } from './_db.js';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { ad, email, sifre, rol, bayiId, para } = await req.json();
    if (!ad || !email || !rol) return allowCors(err('Ad, email ve rol zorunlu'));
    const sql = getDb();
    const [mevcut] = await sql`SELECT id FROM kullanicilar WHERE email=${email} LIMIT 1`;
    if (mevcut) return allowCors(err('Bu email zaten kayıtlı'));
    const id = `${rol.toUpperCase()}-${Date.now()}`;
    const hash = sifre ? await sha256(sifre) : null;
    await sql`INSERT INTO kullanicilar (id,ad,email,sifre,rol,bayi_id,para,aktif) VALUES (${id},${ad},${email},${hash},${rol},${bayiId||null},${para||'TL'},TRUE)`;
    return allowCors(ok({ mesaj: `${rol} eklendi`, id }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
