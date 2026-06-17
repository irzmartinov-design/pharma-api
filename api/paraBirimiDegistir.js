import { getDb, ok, err, allowCors } from './_db.js';

async function getKur(sql, para) {
  const [r] = await sql`SELECT deger FROM ayarlar WHERE anahtar=${'kur_'+para} LIMIT 1`;
  return r ? parseFloat(r.deger) : 1;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { tablo, bayiId, musteriId, yeniPara, marka, kategori, urun, rol } = await req.json();
    const sql = getDb();
    const yeniKur = await getKur(sql, yeniPara);
    let guncellenen = 0;

    if (tablo === 'FB') {
      let rows;
      if (marka && kategori && urun) {
        rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka} AND kategori=${kategori} AND urun_adi=${urun}`;
      } else if (marka && kategori) {
        rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka} AND kategori=${kategori}`;
      } else if (marka) {
        rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND marka=${marka}`;
      } else {
        rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId}`;
      }

      for (const row of rows) {
        if (rol === 'Admin') {
          const eskiKurAdmin = await getKur(sql, row.para_admin);
          const yeniFiyatAdmin = parseFloat(row.fiyat_admin) * yeniKur / eskiKurAdmin;
          const eskiKurBayi = await getKur(sql, row.para_bayi);
          const yeniFiyatBayi = parseFloat(row.fiyat_bayi) * yeniKur / eskiKurBayi;
          await sql`UPDATE fiyat_bayi SET fiyat_admin=${yeniFiyatAdmin}, para_admin=${yeniPara}, fiyat_bayi=${yeniFiyatBayi}, para_bayi=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        } else {
          const eskiKur = await getKur(sql, row.para_bayi);
          const yeniFiyat = parseFloat(row.fiyat_bayi) * yeniKur / eskiKur;
          await sql`UPDATE fiyat_bayi SET fiyat_bayi=${yeniFiyat}, para_bayi=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        }
        guncellenen++;
      }
    } else {
      let rows;
      if (marka && kategori && urun) {
        rows = await sql`SELECT * FROM fiyat_musteri WHERE musteri_id=${musteriId} AND marka=${marka} AND kategori=${kategori} AND urun_adi=${urun}`;
      } else if (marka && kategori) {
        rows = await sql`SELECT * FROM fiyat_musteri WHERE musteri_id=${musteriId} AND marka=${marka} AND kategori=${kategori}`;
      } else if (marka) {
        rows = await sql`SELECT * FROM fiyat_musteri WHERE musteri_id=${musteriId} AND marka=${marka}`;
      } else {
        rows = await sql`SELECT * FROM fiyat_musteri WHERE musteri_id=${musteriId}`;
      }

      for (const row of rows) {
        const eskiKur = await getKur(sql, row.para);
        const yeniFiyat = parseFloat(row.fiyat) * yeniKur / eskiKur;
        await sql`UPDATE fiyat_musteri SET fiyat=${yeniFiyat}, para=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        guncellenen++;
      }
    }
    return allowCors(ok({ mesaj: `${guncellenen} satır ${yeniPara} para birimine çevrildi`, basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
