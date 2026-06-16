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
      const rows = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId}
        AND (${marka||null} IS NULL OR marka=${marka})
        AND (${kategori||null} IS NULL OR kategori=${kategori})
        AND (${urun||null} IS NULL OR urun_adi=${urun})`;

      for (const row of rows) {
        if (rol === 'Admin') {
          const eskiKurAdmin = await getKur(sql, row.para_admin);
          const yeniFiyatAdmin = row.fiyat_admin * yeniKur / eskiKurAdmin;
          const eskiKurBayi = await getKur(sql, row.para_bayi);
          const yeniFiyatBayi = row.fiyat_bayi * yeniKur / eskiKurBayi;
          await sql`UPDATE fiyat_bayi SET fiyat_admin=${yeniFiyatAdmin}, para_admin=${yeniPara}, fiyat_bayi=${yeniFiyatBayi}, para_bayi=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        } else {
          const eskiKur = await getKur(sql, row.para_bayi);
          const yeniFiyat = row.fiyat_bayi * yeniKur / eskiKur;
          await sql`UPDATE fiyat_bayi SET fiyat_bayi=${yeniFiyat}, para_bayi=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        }
        guncellenen++;
      }
    } else {
      const rows = await sql`SELECT * FROM fiyat_musteri WHERE musteri_id=${musteriId}
        AND (${marka||null} IS NULL OR marka=${marka})
        AND (${kategori||null} IS NULL OR kategori=${kategori})
        AND (${urun||null} IS NULL OR urun_adi=${urun})`;

      for (const row of rows) {
        const eskiKur = await getKur(sql, row.para);
        const yeniFiyat = row.fiyat * yeniKur / eskiKur;
        await sql`UPDATE fiyat_musteri SET fiyat=${yeniFiyat}, para=${yeniPara}, guncelleme=NOW() WHERE id=${row.id}`;
        guncellenen++;
      }
    }
    return allowCors(ok({ mesaj: `${guncellenen} satır ${yeniPara} para birimine çevrildi`, basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
