import { sendMail, girisLinki } from './_mail.js';

const METIN = {
  tr: {
    onayBekliyor: (urunAdi) => ({
      subject: 'Onay bekleyen bir siparişiniz var',
      html: `<p>"${urunAdi}" için onay bekleyen yeni bir sipariş var.</p><p><a href="${girisLinki()}">Siteye giriş yapın</a></p>`,
    }),
    onaylandi: (urunAdi) => ({
      subject: 'Siparişiniz onaylandı',
      html: `<p>"${urunAdi}" siparişiniz onaylandı.</p><p><a href="${girisLinki()}">Detayları görüntülemek için giriş yapın</a></p>`,
    }),
    reddedildi: (urunAdi) => ({
      subject: 'Siparişiniz reddedildi',
      html: `<p>"${urunAdi}" siparişiniz reddedildi.</p><p><a href="${girisLinki()}">Detayları görüntülemek için giriş yapın</a></p>`,
    }),
  },
  en: {
    onayBekliyor: (urunAdi) => ({
      subject: 'You have an order awaiting approval',
      html: `<p>A new order for "${urunAdi}" is awaiting your approval.</p><p><a href="${girisLinki()}">Log in to the site</a></p>`,
    }),
    onaylandi: (urunAdi) => ({
      subject: 'Your order has been approved',
      html: `<p>Your order for "${urunAdi}" has been approved.</p><p><a href="${girisLinki()}">Log in to view details</a></p>`,
    }),
    reddedildi: (urunAdi) => ({
      subject: 'Your order has been rejected',
      html: `<p>Your order for "${urunAdi}" has been rejected.</p><p><a href="${girisLinki()}">Log in to view details</a></p>`,
    }),
  },
};

async function aliciBul(sql, { rol, id }) {
  if (rol === 'Admin') {
    return await sql`SELECT email, dil FROM kullanicilar WHERE rol='Admin' AND aktif=TRUE`;
  }
  if (!id) return [];
  return await sql`SELECT email, dil FROM kullanicilar WHERE id=${id} AND aktif=TRUE`;
}

// durum: 'Bayi Onay Bekliyor' | 'Admin Onay Bekliyor' | 'Onaylandı' | 'Onaylandı (Otomatik)' | 'Reddedildi'
export async function siparisMailBildir(sql, { grupId, durum, bayiKod, musteriId, urunAdi }) {
  let hedefRol = null, hedefId = null, tip = null;

  if (durum === 'Bayi Onay Bekliyor') { hedefRol = 'Bayi'; hedefId = bayiKod; tip = 'onayBekliyor'; }
  else if (durum === 'Admin Onay Bekliyor') { hedefRol = 'Admin'; tip = 'onayBekliyor'; }
  else if (durum === 'Onaylandı' || durum === 'Onaylandı (Otomatik)') {
    hedefRol = musteriId ? 'Musteri' : 'Bayi'; hedefId = musteriId || bayiKod; tip = 'onaylandi';
  } else if (durum === 'Reddedildi') {
    hedefRol = musteriId ? 'Musteri' : 'Bayi'; hedefId = musteriId || bayiKod; tip = 'reddedildi';
  } else {
    return;
  }

  const aliciler = await aliciBul(sql, { rol: hedefRol, id: hedefId });
  if (!aliciler.length) return;

  let gonderildi = false;
  for (const alici of aliciler) {
    const dil = alici.dil === 'en' ? 'en' : 'tr';
    const { subject, html } = METIN[dil][tip](urunAdi || 'Sipariş');
    const basarili = await sendMail({ to: alici.email, subject, html });
    gonderildi = gonderildi || basarili;
  }

  if (gonderildi) {
    try { await sql`UPDATE siparisler SET mail_gonderildi=TRUE WHERE id=${grupId} OR id LIKE ${grupId + '-%'}`; } catch (e) {}
  }
}
