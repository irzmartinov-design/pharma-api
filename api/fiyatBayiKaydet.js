import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const d = await req.json();
    const { bayiId, urunId, fiyat, para, mod, yuzde, durum } = d;
    const sql = getDb();
    const kurlar = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kur = {};
    kurlar.forEach(r => { kur[r.anahtar.replace('kur_','')] = parseFloat(r.deger); });

    const [mevcut] = await sql`SELECT * FROM fiyat_bayi WHERE bayi_id=${bayiId} AND urun_id=${urunId} AND durum=${durum||'Genel'} LIMIT 1`;

    let yeniFiyat;
    if (mod === '%') {
      const [urun] = await sql`SELECT fiyat_bayi, para FROM urunler WHERE id=${urunId} LIMIT 1`;
      const refFiyat = urun ? (urun.fiyat_bayi * (kur[para] || 1)) : (mevcut?.fiyat_admin || 0);
      yeniFiyat = refFiyat * (1 + parseFloat(yuzde) / 100);
    } else {
      yeniFiyat = parseFloat(fiyat);
    }

    const karYuzde = mevcut?.fiyat_admin > 0
      ? ((yeniFiyat - mevcut.fiyat_admin) / mevcut.fiyat_admin * 100)
      : 0;

    if (mevcut) {
      await sql`UPDATE fiyat_bayi SET fiyat_admin=${yeniFiyat}, para_admin=${para}, fiyat_bayi=${yeniFiyat}, para_bayi=${para}, kar_yuzde=${karYuzde}, guncelleme=NOW() WHERE id=${mevcut.id}`;
    } else {
      const urunRow = d.urunBilgi || {};
      await sql`INSERT INTO fiyat_bayi (bayi_id,fiyat_admin,para_admin,fiyat_bayi,para_bayi,durum,marka_id,marka,kat_id,kategori,urun_id,urun_adi,aktif_madde,birim,ambalaj,kar_yuzde,bayi_kar) VALUES (${bayiId},${yeniFiyat},${para},${yeniFiyat},${para},${durum||'Genel'},${urunRow.markaId||''},${urunRow.marka||''},${urunRow.katId||''},${urunRow.kategori||''},${urunId},${urunRow.urunAdi||''},${urunRow.aktifMadde||''},${urunRow.birim||''},${urunRow.ambalaj||''},${karYuzde},0)`;
    }
    return allowCors(ok({ mesaj: 'Fiyat kaydedildi', karYuzde: karYuzde.toFixed(2) }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
