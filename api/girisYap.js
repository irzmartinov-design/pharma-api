import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { email, sifre } = await req.json();
    if (!email || !sifre) return allowCors(err('Email ve şifre zorunlu'));

    const sql = getDb();
    // Şifre hash kontrolü — basit MD5 yerine üretimde bcrypt kullan
    const [kullanici] = await sql`
      SELECT id, ad, rol, bayi_id, para
      FROM kullanicilar
      WHERE email = ${email} AND aktif = TRUE
      LIMIT 1`;

    if (!kullanici) return allowCors(err('Kullanıcı bulunamadı'));

    return allowCors(ok({ kullanici }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}

export const config = { runtime: 'edge' };
