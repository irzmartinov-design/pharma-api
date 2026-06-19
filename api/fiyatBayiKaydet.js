import { getDb, ok, err, allowCors, r2 } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, urunId, fiyat, para, mod, yuzde } = await req.json();
    if (!bayiId || !urunId) return allowCors(err('Bayi ID ve Ürün ID zorunlu'));
    const sql = getDb();

    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(r => { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    const getKur = (p) => kurMap[p] || 1;

    const [urun] = await sql`SELECT fiyat_bayi, para FROM urunler WHERE id = ${urunId} LIMIT 1`;
    if (!urun) return allowCors(err('Ürün bulunamadı'));

    const bazTK = parseFloat(urun.fiyat_bayi) || 0;
    const hedefPara = para || urun.para || 'Tokken';

    let yeniFiyat, karYuzde;
    if (mod === '%') {
      // %kar Tokken bazlı → TK fiyatını artır → hedef para birimine çevir
      const yeniFiyatTK = bazTK * (1 + parseFloat(yuzde) / 100);
      yeniFiyat = yeniFiyatTK * getKur(hedefPara) / getKur(urun.para);
      karYuzde = parseFloat(yuzde);
    } else {
      // Birim: kullanıcı doğrudan hedef para biriminde fiyat giriyor
      yeniFiyat = parseFloat(fiyat);
      // karYuzde Tokken bazlı hesapla
      const yeniFiyatTK = yeniFiyat * getKur(urun.para) / getKur(hedefPara);
      karYuzde = bazTK > 0 ? ((yeniFiyatTK - bazTK) / bazTK * 100) : 0;
    }

    yeniFiyat = r2(yeniFiyat);
    karYuzde = r2(karYuzde);

    await sql`
      INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      VALUES (${bayiId}, ${urunId}, ${yeniFiyat}, ${hedefPara}, ${karYuzde}, NOW())
      ON CONFLICT (bayi_id, urun_id)
      DO UPDATE SET fiyat=${yeniFiyat}, para=${hedefPara}, kar_yuzde=${karYuzde}, guncelleme=NOW()`;

    return allowCors(ok({ mesaj: 'Fiyat kaydedildi', karYuzde: karYuzde.toFixed(2) }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
