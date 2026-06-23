export async function sendMail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Pharma B2B <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  return res.ok;
}

export function girisLinki() {
  return `${process.env.SITE_URL || 'https://pharma-api-beta.vercel.app'}/giris.html`;
}
