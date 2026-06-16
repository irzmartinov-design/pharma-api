import { neon } from '@neondatabase/serverless';

export function getDb() {
  return neon(process.env.DATABASE_URL);
}

export function ok(data) {
  return Response.json({ basarili: true, ...data });
}

export function err(mesaj, status = 400) {
  return Response.json({ basarili: false, hata: mesaj }, { status });
}

export function allowCors(res) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (res instanceof Response) {
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  return new Response(null, { headers });
}
