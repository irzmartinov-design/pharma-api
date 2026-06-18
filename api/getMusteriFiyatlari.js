import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId, bayiId } = await req.json().catch(() => ({}));
    if (!musteriId) return allowCors(err('Müşteri ID zorunlu'));
    const sql = getDb();

    // bayiId yoksa müşterinin bağlı bayi_id'sini bul
    let gecerliBayiId = bayiId;
    if (!gecerliBayiId) {
      const [k] = await sql`SELECT bayi_id FROM kullanicilar WHERE id=${musteriId} LIMIT 1`;
      gecerliBayiId = k?.bayi_id || null;
    }

    // Müşteriye özel fiyatlar
    const musteriRows = await sql`
      SELECT urun_id, fiyat, para, kar_yuzde
      FROM musteri_fiyatlari
      WHERE musteri_id = ${musteriId}`;

    // Bayinin genel fiyatları (müşteri için taban)
    const bayiRows = gecerliBayiId ? await sql`
      SELECT urun_id, fiyat, para
      FROM bayi_fiyatlari
      WHERE bayi_id = ${gecerliBayiId}` : [];

    const bayiMap = {};
    bayiRows.forEach(r => { bayiMap[r.urun_id] = { fiyat: parseFloat(r.fiyat)||0, para: r.para||'Tokken' }; });

    const musteriMap = {};
    musteriRows.forEach(r => { musteriMap[r.urun_id] = { fiyat: parseFloat(r.fiyat)||0, para: r.para||'Tokken', karYuzde: parseFloat(r.kar_yuzde)||0 }; });

    return allowCors(ok({ musteriMap, bayiMap }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
