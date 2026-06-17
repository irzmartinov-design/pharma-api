import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { kullaniciId } = await req.json();
    if (!kullaniciId) return allowCors(err('ID zorunlu'));
    const sql = getDb();
    const [u] = await sql`SELECT id, ad, email, rol, para, aktif FROM kullanicilar WHERE id = ${kullaniciId} LIMIT 1`;
    if (!u) return allowCors(err('Kullanıcı bulunamadı'));
    return allowCors(ok({ profil: u }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
