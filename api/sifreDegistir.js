import { getDb, ok, err, allowCors } from './_db.js';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { kullaniciId, eskiSifre, yeniSifre } = await req.json();
    if (!kullaniciId || !eskiSifre || !yeniSifre) return allowCors(err('Eksik bilgi'));

    const eskiHash = await sha256(eskiSifre);
    const sql = getDb();
    const [kullanici] = await sql`
      SELECT id FROM kullanicilar
      WHERE id = ${kullaniciId} AND (sifre = ${eskiHash} OR sifre IS NULL) AND aktif = TRUE
      LIMIT 1`;

    if (!kullanici) return allowCors(err('Mevcut şifre hatalı'));

    const yeniHash = await sha256(yeniSifre);
    await sql`UPDATE kullanicilar SET sifre = ${yeniHash} WHERE id = ${kullaniciId}`;

    return allowCors(ok({ mesaj: 'Şifre güncellendi' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
