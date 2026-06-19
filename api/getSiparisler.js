import { getDb, ok, err, allowCors } from './_db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { kullaniciId, rol, durum, limit = 200 } = await req.json().catch(() => ({}));
    const sql = getDb();

    let rows;
    if (rol === 'Admin') {
      if (durum === 'bekleyen')
        rows = await sql`SELECT * FROM siparisler WHERE durum='Admin Onay Bekliyor' ORDER BY tarih DESC LIMIT ${limit}`;
      else if (durum)
        rows = await sql`SELECT * FROM siparisler WHERE durum=${durum} ORDER BY tarih DESC LIMIT ${limit}`;
      else
        rows = await sql`SELECT * FROM siparisler ORDER BY tarih DESC LIMIT ${limit}`;
    } else if (rol === 'Bayi') {
      if (durum === 'bekleyen')
        rows = await sql`SELECT * FROM siparisler WHERE bayi_kod=${kullaniciId} AND (durum='Bayi Onay Bekliyor' OR durum='Admin Onay Bekliyor') ORDER BY tarih DESC LIMIT ${limit}`;
      else if (durum)
        rows = await sql`SELECT * FROM siparisler WHERE bayi_kod=${kullaniciId} AND durum=${durum} ORDER BY tarih DESC LIMIT ${limit}`;
      else
        rows = await sql`SELECT * FROM siparisler WHERE bayi_kod=${kullaniciId} ORDER BY tarih DESC LIMIT ${limit}`;
    } else {
      if (durum === 'bekleyen')
        rows = await sql`SELECT * FROM siparisler WHERE musteri_id=${kullaniciId} AND (durum='Bayi Onay Bekliyor' OR durum='Admin Onay Bekliyor') ORDER BY tarih DESC LIMIT ${limit}`;
      else if (durum)
        rows = await sql`SELECT * FROM siparisler WHERE musteri_id=${kullaniciId} AND durum=${durum} ORDER BY tarih DESC LIMIT ${limit}`;
      else
        rows = await sql`SELECT * FROM siparisler WHERE musteri_id=${kullaniciId} ORDER BY tarih DESC LIMIT ${limit}`;
    }

    // Group by base ID: SP-{ts} is group root, SP-{ts}-2 etc are sub-items
    const gruplar = {};
    const sira = [];
    for (const s of rows) {
      const m = s.id.match(/^(SP-\d+)-\d+$/);
      const gid = m ? m[1] : s.id;
      if (!gruplar[gid]) {
        gruplar[gid] = { ...s, id: gid, urunSayisi: 0, toplamAdet: 0, toplamTutar: 0, bayiToplamTutar: 0 };
        sira.push(gid);
      }
      gruplar[gid].urunSayisi++;
      gruplar[gid].toplamAdet += parseInt(s.miktar) || 0;
      gruplar[gid].toplamTutar += parseFloat(s.toplam) || 0;
      gruplar[gid].bayiToplamTutar += parseFloat(s.bayi_toplam) || 0;
      if (!m) gruplar[gid].urun_adi = s.urun_adi;
    }

    return allowCors(ok({ siparisler: sira.map(gid => gruplar[gid]) }));
  } catch (e) {
    return allowCors(err(e.message, 500));
  }
}
export const config = { runtime: 'edge' };
