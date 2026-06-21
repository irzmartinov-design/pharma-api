import { put } from '@vercel/blob';
import { getDb } from './_db.js';

// Admin'in ürün ekleme/düzenleme formundan resim yüklemesi — Vercel Blob'a kaydeder
// Node.js runtime (klasik req/res) — @vercel/blob Edge Runtime'da çalışmıyor
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { urunId, dosyaAdi, base64Veri } = req.body;
    if (!urunId || !base64Veri) return res.status(400).json({ basarili: false, hata: 'Ürün ID ve dosya zorunlu' });

    const ext = (dosyaAdi || 'image.jpg').split('.').pop().toLowerCase();
    const buffer = Buffer.from(base64Veri, 'base64');

    const blob = await put(`urunler/${urunId}-${Date.now()}.${ext}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });

    const sql = getDb();
    await sql`UPDATE urunler SET gorsel_url=${blob.url} WHERE id=${urunId}`;

    return res.status(200).json({ basarili: true, mesaj: 'Görsel yüklendi', url: blob.url });
  } catch (e) {
    return res.status(500).json({ basarili: false, hata: e.message });
  }
}
