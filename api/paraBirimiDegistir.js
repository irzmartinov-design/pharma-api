import { getDb, ok, err, allowCors } from './_db.js';

async function getKur(sql, para) {
  const [r] = await sql`SELECT deger FROM ayarlar WHERE anahtar=${'kur_'+para} LIMIT 1`;
  return r ? parseFloat(r.deger) : 1;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { tablo, bayiId, musteriId, yeniPara, marka, kategori, urun } = await req.json();
    const sql = getDb();
    const yeniKur = await getKur(sql, yeniPara);
    let guncellenen = 0;

    if (tablo === 'FB') {
      // Bayi fiyatlarının para birimi değiştir
      let rows;
      if (marka && kategori && urun) {
        rows = await sql`
          SELECT bf.id, bf.fiyat, bf.para FROM bayi_fiyatlari bf
          JOIN urunler u ON u.id = bf.urun_id
          WHERE bf.bayi_id=${bayiId} AND u.marka=${marka} AND u.kategori=${kategori} AND u.ad=${urun}`;
      } else if (marka && kategori) {
        rows = await sql`
          SELECT bf.id, bf.fiyat, bf.para FROM bayi_fiyatlari bf
          JOIN urunler u ON u.id = bf.urun_id
          WHERE bf.bayi_id=${bayiId} AND u.marka=${marka} AND u.kategori=${kategori}`;
      } else if (marka) {
        rows = await sql`
          SELECT bf.id, bf.fiyat, bf.para FROM bayi_fiyatlari bf
          JOIN urunler u ON u.id = bf.urun_id
          WHERE bf.bayi_id=${bayiId} AND u.marka=${marka}`;
      } else {
        rows = await sql`SELECT id, fiyat, para FROM bayi_fiyatlari WHERE bayi_id=${bayiId}`;
      }
      for (const row of rows) {
        const eskiKur = await getKur(sql, row.para);
        const yeniFiyat = parseFloat(row.fiyat) * yeniKur / eskiKur;
        await sql`UPDATE bayi_fiyatlari SET fiyat=${yeniFiyat}, para=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        guncellenen++;
      }
    } else {
      // Müşteri fiyatlarının para birimi değiştir
      let rows;
      if (marka && kategori && urun) {
        rows = await sql`
          SELECT mf.id, mf.fiyat, mf.para FROM musteri_fiyatlari mf
          JOIN urunler u ON u.id = mf.urun_id
          WHERE mf.musteri_id=${musteriId} AND u.marka=${marka} AND u.kategori=${kategori} AND u.ad=${urun}`;
      } else if (marka && kategori) {
        rows = await sql`
          SELECT mf.id, mf.fiyat, mf.para FROM musteri_fiyatlari mf
          JOIN urunler u ON u.id = mf.urun_id
          WHERE mf.musteri_id=${musteriId} AND u.marka=${marka} AND u.kategori=${kategori}`;
      } else if (marka) {
        rows = await sql`
          SELECT mf.id, mf.fiyat, mf.para FROM musteri_fiyatlari mf
          JOIN urunler u ON u.id = mf.urun_id
          WHERE mf.musteri_id=${musteriId} AND u.marka=${marka}`;
      } else {
        rows = await sql`SELECT id, fiyat, para FROM musteri_fiyatlari WHERE musteri_id=${musteriId}`;
      }
      for (const row of rows) {
        const eskiKur = await getKur(sql, row.para);
        const yeniFiyat = parseFloat(row.fiyat) * yeniKur / eskiKur;
        await sql`UPDATE musteri_fiyatlari SET fiyat=${yeniFiyat}, para=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        guncellenen++;
      }
    }

    return allowCors(ok({ mesaj: `${guncellenen} satır ${yeniPara} para birimine çevrildi`, basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
