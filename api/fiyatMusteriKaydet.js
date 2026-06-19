import { getDb, ok, err, allowCors, r2 } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId, bayiId, urunId, fiyat, para, mod, yuzde } = await req.json();
    if (!musteriId || !urunId) return allowCors(err('Müşteri ID ve Ürün ID zorunlu'));
    const sql = getDb();

    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(r => { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    const getKur = (p) => kurMap[p] || 1;

    const [urun] = await sql`SELECT fiyat_musteri FROM urunler WHERE id = ${urunId} LIMIT 1`;
    if (!urun) return allowCors(err('Ürün bulunamadı'));

    // Bayi özel fiyatı varsa onu baz al (kendi para birimini Tokken'e çevir), yoksa genel fiyat (zaten Tokken)
    const [bayiOzel] = bayiId
      ? await sql`SELECT fiyat, para FROM bayi_fiyatlari WHERE bayi_id=${bayiId} AND urun_id=${urunId} LIMIT 1`
      : [null];
    const bazTK = bayiOzel
      ? parseFloat(bayiOzel.fiyat) * getKur('Tokken') / getKur(bayiOzel.para || 'Tokken')
      : parseFloat(urun.fiyat_musteri) || 0;

    const hedefPara = para || 'TL';
    const bazHedefPara = bazTK * getKur(hedefPara) / getKur('Tokken');

    let yeniFiyat;
    if (mod === '%') {
      // Tokken bazında yüzdeyi uygula, sonra hedef para birimine çevir
      const yeniFiyatTK = bazTK * (1 + parseFloat(yuzde) / 100);
      yeniFiyat = yeniFiyatTK * getKur(hedefPara) / getKur('Tokken');
    } else {
      // Kullanıcı doğrudan hedef para biriminde fiyat giriyor
      yeniFiyat = parseFloat(fiyat);
    }

    yeniFiyat = r2(yeniFiyat);
    const karYuzde = r2(bazHedefPara > 0 ? ((yeniFiyat - bazHedefPara) / bazHedefPara * 100) : 0);

    await sql`
      INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      VALUES (${musteriId}, ${bayiId || ''}, ${urunId}, ${yeniFiyat}, ${hedefPara}, ${karYuzde}, NOW())
      ON CONFLICT (musteri_id, urun_id)
      DO UPDATE SET fiyat=${yeniFiyat}, para=${hedefPara}, kar_yuzde=${karYuzde}, guncelleme=NOW()`;

    return allowCors(ok({ mesaj: 'Müşteri fiyatı güncellendi', karYuzde: karYuzde.toFixed(2) }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
