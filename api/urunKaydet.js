import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const body = await req.json();
    const d = typeof body === 'string' ? JSON.parse(body) : body;
    const { id, ad, markaId, markaAdi, katId, katAdi, aktifMadde, birim, ambalaj, fiyatBayi, fiyatMusteri, para } = d;

    if (!ad || !markaAdi || !katAdi) return allowCors(err('Ürün adı, marka ve kategori zorunlu'));

    const sql = getDb();

    // Yeni marka gerekiyorsa ekle
    let gercekMarkaId = markaId;
    if (!markaId) {
      const mevcut = await sql`SELECT id FROM markalar WHERE ad=${markaAdi} LIMIT 1`;
      if (mevcut.length) {
        gercekMarkaId = mevcut[0].id;
      } else {
        const yeniId = 'MRK-' + Date.now();
        await sql`INSERT INTO markalar (id, ad, aktif) VALUES (${yeniId}, ${markaAdi}, TRUE)`;
        gercekMarkaId = yeniId;
      }
    }

    // Yeni kategori gerekiyorsa ekle
    let gercekKatId = katId;
    if (!katId) {
      const mevcut = await sql`SELECT id FROM kategoriler WHERE ad=${katAdi} LIMIT 1`;
      if (mevcut.length) {
        gercekKatId = mevcut[0].id;
      } else {
        const yeniId = 'KAT-' + Date.now();
        await sql`INSERT INTO kategoriler (id, ad, marka_id, aktif) VALUES (${yeniId}, ${katAdi}, ${gercekMarkaId}, TRUE)`;
        gercekKatId = yeniId;
      }
    }

    if (id) {
      // Güncelle
      await sql`UPDATE urunler SET
        ad=${ad}, marka_id=${gercekMarkaId}, marka=${markaAdi},
        kat_id=${gercekKatId}, kategori=${katAdi},
        aktif_madde=${aktifMadde||null}, birim=${birim||null}, ambalaj=${ambalaj||null},
        fiyat_bayi=${fiyatBayi||null}, fiyat_taban=${fiyatBayi||null},
        fiyat_musteri=${fiyatMusteri||null}, para=${para||'Tokken'}
        WHERE id=${id}`;
      return allowCors(ok({ mesaj: 'Ürün güncellendi' }));
    } else {
      // Ekle
      const yeniId = 'URN-' + Date.now();
      await sql`INSERT INTO urunler
        (id, ad, marka_id, marka, kat_id, kategori, aktif_madde, birim, ambalaj, fiyat_bayi, fiyat_taban, fiyat_musteri, para, aktif)
        VALUES (${yeniId}, ${ad}, ${gercekMarkaId}, ${markaAdi}, ${gercekKatId}, ${katAdi},
          ${aktifMadde||null}, ${birim||null}, ${ambalaj||null},
          ${fiyatBayi||null}, ${fiyatBayi||null}, ${fiyatMusteri||null}, ${para||'Tokken'}, TRUE)`;
      // Aktif otomatik oranlı bayilere yeni ürünü ekle
      if (fiyatBayi) {
        const aktifBayiler = await sql`SELECT id, musteri_fiyat_orani FROM kullanicilar WHERE rol='Bayi' AND aktif=TRUE AND musteri_fiyat_orani_aktif=TRUE AND musteri_fiyat_orani > 0`.catch(() => []);
        for (const bayi of aktifBayiler) {
          const oran = parseFloat(bayi.musteri_fiyat_orani);
          const yeniFiyat = parseFloat(fiyatBayi) * (1 + oran / 100);
          await sql`
            INSERT INTO bayi_fiyatlari (bayi_id, urun_id, fiyat, para, kar_yuzde, guncelleme)
            VALUES (${bayi.id}, ${yeniId}, ${yeniFiyat}, ${para||'TL'}, ${oran}, NOW())
            ON CONFLICT (bayi_id, urun_id)
            DO UPDATE SET fiyat=${yeniFiyat}, kar_yuzde=${oran}, guncelleme=NOW()`.catch(() => {});
        }
      }
      return allowCors(ok({ mesaj: 'Ürün eklendi', id: yeniId }));
    }
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
