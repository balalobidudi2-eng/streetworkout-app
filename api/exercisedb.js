// api/exercisedb.js — Vercel Edge Function — Proxy sécurisé vers ExerciseDB/RapidAPI
// La clé RAPIDAPI_KEY est stockée dans les variables d'environnement Vercel.
// Elle n'est JAMAIS exposée côté client.

export const config = { runtime: 'edge' };

const EXERCISEDB_BASE = 'https://exercisedb.p.rapidapi.com';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const key = process.env.RAPIDAPI_KEY || '';
  if (!key) {
    return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not set' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  const url  = new URL(req.url);
  const path = url.searchParams.get('path') || '/exercises?limit=20';

  // SSRF protection: only allow paths starting with /exercises
  if (!path.startsWith('/exercises')) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  const apiUrl = EXERCISEDB_BASE + path;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'X-RapidAPI-Key':  key,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    });
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=3600'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}
