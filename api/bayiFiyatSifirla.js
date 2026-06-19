import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { tablo, bayiId, musteriId, marka, kategori, urun } = await req.json();
    const sql = getDb();

    if (tablo === 'FB') {
      if (!bayiId) return allowCors(err('Bayi ID zorunlu'));

      let result;
      if (marka && kategori && urun) {
        result = await sql`
          DELETE FROM bayi_fiyatlari bf
          USING urunler u
          WHERE bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
            AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}
          RETURNING bf.urun_id`;
      } else if (marka && kategori) {
        result = await sql`
          DELETE FROM bayi_fiyatlari bf
          USING urunler u
          WHERE bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
            AND u.marka = ${marka} AND u.kategori = ${kategori}
          RETURNING bf.urun_id`;
      } else if (marka) {
        result = await sql`
          DELETE FROM bayi_fiyatlari bf
          USING urunler u
          WHERE bf.urun_id = u.id AND bf.bayi_id = ${bayiId}
            AND u.marka = ${marka}
          RETURNING bf.urun_id`;
      } else {
        result = await sql`
          DELETE FROM bayi_fiyatlari WHERE bayi_id = ${bayiId} RETURNING urun_id`;
      }

      return allowCors(ok({ mesaj: `${result.length} ürün Genel fiyata döndürüldü`, basarili: true }));

    } else {
      if (!musteriId) return allowCors(err('Müşteri ID zorunlu'));

      let result;
      if (marka && kategori && urun) {
        result = await sql`
          DELETE FROM musteri_fiyatlari mf
          USING urunler u
          WHERE mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
            AND u.marka = ${marka} AND u.kategori = ${kategori} AND u.ad = ${urun}
          RETURNING mf.urun_id`;
      } else if (marka && kategori) {
        result = await sql`
          DELETE FROM musteri_fiyatlari mf
          USING urunler u
          WHERE mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
            AND u.marka = ${marka} AND u.kategori = ${kategori}
          RETURNING mf.urun_id`;
      } else if (marka) {
        result = await sql`
          DELETE FROM musteri_fiyatlari mf
          USING urunler u
          WHERE mf.urun_id = u.id AND mf.musteri_id = ${musteriId}
            AND u.marka = ${marka}
          RETURNING mf.urun_id`;
      } else {
        result = await sql`
          DELETE FROM musteri_fiyatlari WHERE musteri_id = ${musteriId} RETURNING urun_id`;
      }

      return allowCors(ok({ mesaj: `${result.length} ürün Genel fiyata döndürüldü`, basarili: true }));
    }
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
