import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { markalar, kategoriler, urunler } = await req.json();
    const sql = getDb();

    for (const m of (markalar || [])) {
      await sql`INSERT INTO markalar (id, ad, aktif) VALUES (${m.id}, ${m.ad}, TRUE)
        ON CONFLICT (id) DO UPDATE SET ad=${m.ad}, aktif=TRUE`;
    }

    for (const k of (kategoriler || [])) {
      await sql`INSERT INTO kategoriler (id, ad, marka_id, aktif) VALUES (${k.id}, ${k.ad}, ${k.markaId}, TRUE)
        ON CONFLICT (id) DO UPDATE SET ad=${k.ad}, marka_id=${k.markaId}, aktif=TRUE`;
    }

    for (const u of (urunler || [])) {
      await sql`INSERT INTO urunler (id, ad, marka_id, marka, kat_id, kategori, aktif_madde, birim, ambalaj, fiyat_bayi, fiyat_musteri, para, aktif)
        VALUES (${u.id}, ${u.ad}, ${u.markaId}, ${u.marka}, ${u.katId}, ${u.kategori}, ${u.aktifMadde||null}, ${u.birim||null}, ${u.ambalaj||null}, ${u.fiyatBayi||null}, ${u.fiyatMusteri||null}, ${u.para||'TL'}, TRUE)
        ON CONFLICT (id) DO UPDATE SET ad=${u.ad}, marka_id=${u.markaId}, marka=${u.marka}, kat_id=${u.katId}, kategori=${u.kategori}, aktif_madde=${u.aktifMadde||null}, birim=${u.birim||null}, ambalaj=${u.ambalaj||null}, fiyat_bayi=${u.fiyatBayi||null}, fiyat_musteri=${u.fiyatMusteri||null}, para=${u.para||'TL'}, aktif=TRUE`;
    }

    return allowCors(ok({
      mesaj: 'Yüklendi',
      markaSayisi: (markalar||[]).length,
      katSayisi: (kategoriler||[]).length,
      urunSayisi: (urunler||[]).length
    }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
