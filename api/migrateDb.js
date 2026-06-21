import { getDb, ok, err, allowCors } from './_db.js';
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const sql = getDb();
    // Yeni kolonlar
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_toplam NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS bayi_notu TEXT`;
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS admin_notu TEXT`;
    // Eski test verisi: durum NULL → Admin Onay Bekliyor
    await sql`UPDATE siparisler SET durum='Admin Onay Bekliyor' WHERE durum IS NULL`;
    // Sabit taban fiyat kolonu
    await sql`ALTER TABLE urunler ADD COLUMN IF NOT EXISTS fiyat_taban NUMERIC`;
    await sql`UPDATE urunler SET fiyat_taban = fiyat_bayi WHERE fiyat_taban IS NULL AND fiyat_bayi IS NOT NULL`;
    // Bayi'nin güvendiği müşteriye otomatik onay
    await sql`ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS otomatik_onay BOOLEAN DEFAULT FALSE`;
    // Ürün ambalaj görseli
    await sql`ALTER TABLE urunler ADD COLUMN IF NOT EXISTS gorsel_url TEXT`;
    // İleride otomatik mail bildirimi için hazırlık (henüz aktif gönderim yok)
    await sql`ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS mail_gonderildi BOOLEAN DEFAULT FALSE`;
    // Kullanıcı arayüz dili tercihi
    await sql`ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS dil TEXT DEFAULT 'tr'`;
    return allowCors(ok({ mesaj: 'Migrasyon tamamlandı' }));
  } catch(e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
