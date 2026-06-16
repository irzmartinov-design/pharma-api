import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { id, musteriId, ad, adres, sehir, islem } = await req.json();
    const sql = getDb();
    if (islem === 'sil') {
      await sql`UPDATE adresler SET aktif=FALSE WHERE id=${id}`;
      return allowCors(ok({ mesaj: 'Adres silindi' }));
    }
    if (islem === 'guncelle') {
      await sql`UPDATE adresler SET ad=${ad}, adres=${adres}, sehir=${sehir} WHERE id=${id}`;
      return allowCors(ok({ mesaj: 'Adres güncellendi' }));
    }
    const yeniId = `ADR-${Date.now()}`;
    await sql`INSERT INTO adresler (id,musteri_id,ad,adres,sehir,aktif) VALUES (${yeniId},${musteriId},${ad},${adres},${sehir||''},TRUE)`;
    return allowCors(ok({ mesaj: 'Adres eklendi', id: yeniId }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
