import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { gizliAnahtar } = await req.json().catch(() => ({}));
    if (gizliAnahtar !== 'RESET-PHARMA-2026') return allowCors(err('Yetkisiz', 403));

    const sql = getDb();
    await sql`DELETE FROM bayi_fiyatlari`;
    await sql`DELETE FROM urunler`;
    await sql`DELETE FROM kategoriler`;
    await sql`DELETE FROM markalar`;
    await sql`DELETE FROM kullanicilar WHERE rol != 'Admin'`;
    await sql`DELETE FROM adresler`;
    await sql`DELETE FROM siparisler`;

    return allowCors(ok({ mesaj: 'Veritabanı sıfırlandı' }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
