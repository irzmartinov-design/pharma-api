import { getDb, ok, err, allowCors, r2 } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { bayiId, musteriId, marka, kategori, urun, para, mod, fiyat, yuzde } = await req.json();
    if (!bayiId || !musteriId) return allowCors(err('Bayi ID ve Müşteri ID zorunlu'));
    const sql = getDb();

    const kurRows = await sql`SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'kur_%'`;
    const kurMap = {};
    kurRows.forEach(r => { kurMap[r.anahtar.replace('kur_', '')] = parseFloat(r.deger); });
    const getKur = (p) => kurMap[p] || 1;

    const m = marka || null, k = kategori || null, u = urun || null;

    // Tek sorguda: ürünler + bayinin kendi genel fiyatı (varsa) birleşik
    const urunler = await sql`
      SELECT u.id, u.fiyat_musteri, bf.fiyat AS bf_fiyat, bf.para AS bf_para
      FROM urunler u
      LEFT JOIN bayi_fiyatlari bf ON bf.urun_id=u.id AND bf.bayi_id=${bayiId}
      WHERE u.aktif=TRUE AND u.marka=COALESCE(${m},u.marka) AND u.kategori=COALESCE(${k},u.kategori) AND u.ad=COALESCE(${u},u.ad)`;

    if (!urunler.length) return allowCors(ok({ mesaj: '0 ürün güncellendi' }));

    const yuzdeMod = mod === '%' || mod === 'yuzde';
    const hedefPara = para || 'TL';
    const ids = [], fiyatlar = [], paralar = [], karlar = [];

    for (const urn of urunler) {
      // Bayinin kendi genel fiyatı varsa onu Tokken'e çevir, yoksa ürünün Tokken bazlı fiyat_musteri'sini kullan
      const bazTK = urn.bf_fiyat != null
        ? parseFloat(urn.bf_fiyat) * getKur('Tokken') / getKur(urn.bf_para || 'Tokken')
        : parseFloat(urn.fiyat_musteri) || 0;
      const bazHedefPara = bazTK * getKur(hedefPara) / getKur('Tokken');
      let yeniFiyat;
      if (yuzdeMod) {
        // Tokken bazında yüzdeyi uygula, sonra hedef para birimine çevir
        const yeniFiyatTK = bazTK * (1 + parseFloat(yuzde ?? fiyat) / 100);
        yeniFiyat = yeniFiyatTK * getKur(hedefPara) / getKur('Tokken');
      } else {
        // Kullanıcı doğrudan hedef para biriminde fiyat giriyor
        yeniFiyat = parseFloat(fiyat);
      }
      yeniFiyat = r2(yeniFiyat);
      const karYuzde = r2(bazHedefPara > 0 ? ((yeniFiyat - bazHedefPara) / bazHedefPara * 100) : 0);
      ids.push(urn.id);
      fiyatlar.push(yeniFiyat);
      paralar.push(hedefPara);
      karlar.push(karYuzde);
    }

    await sql`
      INSERT INTO musteri_fiyatlari (musteri_id, bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
      SELECT ${musteriId}, ${bayiId},
             unnest(${ids}::text[]),
             unnest(${fiyatlar}::numeric[]),
             unnest(${paralar}::text[]),
             unnest(${karlar}::numeric[]),
             NOW()
      ON CONFLICT (musteri_id, urun_id)
      DO UPDATE SET fiyat=EXCLUDED.fiyat, para=EXCLUDED.para,
                    kar_yuzde=EXCLUDED.kar_yuzde, guncelleme=NOW()`;

    const zararSayisi = karlar.filter(k => k < 0).length;
    const mesaj = zararSayisi > 0
      ? `${ids.length} ürün güncellendi — ⚠️ ${zararSayisi} üründe zarar oluştu`
      : `${ids.length} ürün güncellendi`;
    return allowCors(ok({ mesaj, zararSayisi }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
