import { getDb, ok, err, allowCors, r2 } from './_db.js';

// Bayi'nin kendi müşterilerine uygulayacağı genel fiyat (toplu, filtre ile)
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, fiyat, para, mod, yuzde, marka, kategori, urun } = await req.json();
    if (!bayiId) return allowCors(err('Bayi ID zorunlu'));
    const sql = getDb();

    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(r => { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    const getKur = (p) => kurMap[p] || 1;

    const m = marka || null, k = kategori || null, u = urun || null;

    // fiyat_bayi Tokken bazlı taban — filtre COALESCE ile (boş alan = filtre yok)
    const urunler = await sql`
      SELECT id, fiyat_bayi, para FROM urunler
      WHERE aktif=TRUE AND marka=COALESCE(${m},marka) AND kategori=COALESCE(${k},kategori) AND ad=COALESCE(${u},ad)`;

    if (!urunler.length) return allowCors(ok({ mesaj: '0 ürün güncellendi' }));

    const yuzdeMod = mod === '%' || mod === 'yuzde';
    const hedefPara = para || 'TL';
    const ids = [], fiyatlar = [], paralar = [], karlar = [];

    for (const urn of urunler) {
      const bazTK = parseFloat(urn.fiyat_bayi) || 0;
      let yeniFiyat;
      if (yuzdeMod) {
        // Tokken bazında % uygula, sonra hedef para birimine çevir
        const yeniFiyatTK = bazTK * (1 + parseFloat(yuzde ?? fiyat) / 100);
        yeniFiyat = yeniFiyatTK * getKur(hedefPara) / getKur('Tokken');
      } else {
        // Kullanıcı doğrudan hedef para biriminde fiyat giriyor
        yeniFiyat = parseFloat(fiyat);
      }
      const bazHedefPara = bazTK * getKur(hedefPara) / getKur('Tokken');
      yeniFiyat = r2(yeniFiyat);
      const karYuzde = r2(bazHedefPara > 0 ? ((yeniFiyat - bazHedefPara) / bazHedefPara * 100) : 0);
      ids.push(urn.id);
      fiyatlar.push(yeniFiyat);
      paralar.push(hedefPara);
      karlar.push(karYuzde);
    }

    await sql`
      INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      SELECT ${bayiId}, unnest(${ids}::text[]), unnest(${fiyatlar}::numeric[]),
             unnest(${paralar}::text[]), unnest(${karlar}::numeric[]), NOW()
      ON CONFLICT (bayi_id, urun_id)
      DO UPDATE SET fiyat=EXCLUDED.fiyat, para=EXCLUDED.para, kar_yuzde=EXCLUDED.kar_yuzde, guncelleme=NOW()`;

    const zararSayisi = karlar.filter(kr => kr < 0).length;
    const mesaj = zararSayisi > 0
      ? `${ids.length} ürün güncellendi — ⚠️ ${zararSayisi} üründe zarar oluştu`
      : `${ids.length} ürün güncellendi`;
    return allowCors(ok({ mesaj, zararSayisi }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
