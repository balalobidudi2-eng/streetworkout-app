// api/wger.js — Vercel Edge Function — Proxy sécurisé vers wger.de
// La clé WGER_API_KEY est stockée dans les variables d'environnement Vercel.
// Elle n'est JAMAIS exposée côté client.

export const config = { runtime: 'edge' };

const WGER_BASE = 'https://wger.de/api/v2';

const ALLOWED_ENDPOINTS = [
  'exercise', 'exerciseinfo', 'exercisecategory',
  'muscle', 'equipment', 'exercisesearch'
];

const ALLOWED_ORIGINS = [
  'https://streetworkout-app.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const endpoint = url.searchParams.get('endpoint');
  const params   = url.searchParams.get('params') || '';

  // Whitelist endpoint
  if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) {
    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Sanitize params — only allow URL-safe characters to prevent SSRF / injection
  if (params && !/^[a-zA-Z0-9=&_\-.%+]+$/.test(params)) {
    return new Response(JSON.stringify({ error: 'Invalid params' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const wgerUrl = `${WGER_BASE}/${endpoint}/?format=json&language=2${params ? '&' + params : ''}`;

  try {
    const response = await fetch(wgerUrl, {
      headers: {
        'Authorization': `Token ${process.env.WGER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Wger error: ${response.status}`);

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=3600' // Cache CDN 1h — les exercices changent peu
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
