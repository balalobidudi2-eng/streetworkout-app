// api/auth.js — Vercel Edge Function — Authentication avec KV Redis
// Stocke les utilisateurs dans KV pour persistance multi-navigateurs

export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  // Check if KV is available
  const kvAvailable = !!(KV_URL && KV_TOKEN);

  // KV helpers
  async function kvGet(key) {
    if (!kvAvailable) return null;
    try {
      const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      if (!r.ok) return null;
      const j = await r.json();
      return j.result !== undefined ? j.result : null;
    } catch (e) { return null; }
  }

  async function kvSet(key, value) {
    if (!kvAvailable) return false;
    try {
      await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${KV_TOKEN}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(value)
      });
      return true;
    } catch (e) { return false; }
  }

  function safe(email) {
    return (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || '';

  // ══════════════════ PING ══════════════════
  if (action === 'ping') {
    return new Response(JSON.stringify({ 
      ok: true, 
      kvAvailable: kvAvailable 
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  // ══════════════════ REGISTER ══════════════════
  if (action === 'register') {
    const { email, hash } = body;
    
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ ok: false, err: 'Email invalide' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
    
    if (!hash || hash.length < 10) {
      return new Response(JSON.stringify({ ok: false, err: 'Mot de passe trop court' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const emailLow = email.trim().toLowerCase();
    const userKey = `forge:auth:${safe(emailLow)}`;

    // If KV not available, return fallback response
    if (!kvAvailable) {
      return new Response(JSON.stringify({ 
        ok: false, 
        err: 'KV not available',
        kvAvailable: false 
      }), {
        status: 503,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists
    const existing = await kvGet(userKey);
    if (existing) {
      return new Response(JSON.stringify({ ok: false, err: 'Un compte existe déjà avec cet email' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Create user
    const userData = {
      email: emailLow,
      hash: hash,
      since: new Date().toISOString().slice(0, 10),
      createdAt: Date.now()
    };

    await kvSet(userKey, userData);

    // Add to users list
    const listKey = 'forge:auth:list';
    const list = (await kvGet(listKey)) || [];
    if (!list.includes(emailLow)) {
      list.push(emailLow);
      await kvSet(listKey, list);
    }

    return new Response(JSON.stringify({ ok: true, email: emailLow }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  // ══════════════════ LOGIN ══════════════════
  if (action === 'login') {
    const { email, hash } = body;
    
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ ok: false, err: 'Email invalide' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // If KV not available, return fallback response
    if (!kvAvailable) {
      return new Response(JSON.stringify({ 
        ok: false, 
        err: 'KV not available',
        kvAvailable: false 
      }), {
        status: 503,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const emailLow = email.trim().toLowerCase();
    const userKey = `forge:auth:${safe(emailLow)}`;

    const user = await kvGet(userKey);
    if (!user) {
      return new Response(JSON.stringify({ ok: false, err: 'Aucun compte avec cet email' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    if (user.hash !== hash) {
      return new Response(JSON.stringify({ ok: false, err: 'Mot de passe incorrect' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, email: emailLow }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  // ══════════════════ GET USERS LIST (admin) ══════════════════
  if (action === 'get_users') {
    const { adminEmail } = body;
    if (adminEmail !== '1@gmail.com') {
      return new Response(JSON.stringify({ ok: false, err: 'Forbidden' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    if (!kvAvailable) {
      return new Response(JSON.stringify({ ok: false, err: 'KV not available' }), {
        status: 503,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const list = (await kvGet('forge:auth:list')) || [];
    const users = await Promise.all(list.map(async (e) => {
      const u = await kvGet(`forge:auth:${safe(e)}`);
      return u ? { email: u.email, since: u.since, createdAt: u.createdAt } : null;
    }));

    return new Response(JSON.stringify({ ok: true, users: users.filter(Boolean) }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}
