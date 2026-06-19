import { getDb, ok, err, allowCors } from './_db.js';

// Bayi'nin güvendiği müşteriye otomatik onay tanımlaması — açıksa Bayi onay adımı atlanır
export default async function handler(req) {
  if (req.method === 'OPTIONS') return allowCors(new Response(null));
  try {
    const { musteriId, bayiId, otomatikOnay } = await req.json();
    if (!musteriId || !bayiId) return allowCors(err('Müşteri ID ve Bayi ID zorunlu'));
    const sql = getDb();

    const [musteri] = await sql`SELECT id FROM kullanicilar WHERE id=${musteriId} AND bayi_id=${bayiId} AND rol='Musteri' LIMIT 1`;
    if (!musteri) return allowCors(err('Bu müşteri size ait değil'));

    await sql`UPDATE kullanicilar SET otomatik_onay=${!!otomatikOnay} WHERE id=${musteriId}`;

    return allowCors(ok({ mesaj: otomatikOnay ? 'Otomatik onay açıldı' : 'Otomatik onay kapatıldı', basarili: true }));
  } catch (e) { return allowCors(err(e.message, 500)); }
}
export const config = { runtime: 'edge' };
