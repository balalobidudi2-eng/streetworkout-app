// api/auth.js — Vercel Serverless Function — Authentication avec KV Redis
// Stocke les utilisateurs dans KV pour persistance multi-navigateurs

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
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
      const val = j.result !== undefined ? j.result : null;
      if (val === null) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch(e) { return val; }
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

  const body = req.body || {};
  const action = body.action || '';

  // ══════════════════ PING ══════════════════
  if (action === 'ping') {
    return res.status(200).json({ ok: true, kvAvailable: kvAvailable });
  }

  // ══════════════════ REGISTER ══════════════════
  if (action === 'register') {
    const { email, hash } = body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, err: 'Email invalide' });
    }

    if (!hash || hash.length < 10) {
      return res.status(400).json({ ok: false, err: 'Mot de passe trop court' });
    }

    const emailLow = email.trim().toLowerCase();
    const userKey = `forge:auth:${safe(emailLow)}`;

    if (!kvAvailable) {
      return res.status(503).json({ ok: false, err: 'KV not available', kvAvailable: false });
    }

    // Check if user exists
    const existing = await kvGet(userKey);
    if (existing) {
      return res.status(400).json({ ok: false, err: 'Un compte existe déjà avec cet email' });
    }

    const since = new Date().toISOString().slice(0, 10);

    // Create auth user
    const userData = {
      email: emailLow,
      hash: hash,
      since: since,
      createdAt: Date.now()
    };
    await kvSet(userKey, userData);

    // Add to auth users list
    const authListKey = 'forge:auth:list';
    const authList = (await kvGet(authListKey)) || [];
    if (!Array.isArray(authList)) {
      await kvSet(authListKey, [emailLow]);
    } else if (!authList.includes(emailLow)) {
      authList.push(emailLow);
      await kvSet(authListKey, authList);
    }

    // ALSO register in social users list so admin sees the user immediately
    const socialListKey = 'forge:users:list';
    const socialUserKey = `forge:user:${safe(emailLow)}`;
    const socialList = (await kvGet(socialListKey)) || [];
    if (!Array.isArray(socialList)) {
      await kvSet(socialListKey, [emailLow]);
    } else if (!socialList.includes(emailLow)) {
      socialList.push(emailLow);
      await kvSet(socialListKey, socialList);
    }
    // Create empty social profile if it doesn't exist yet
    const existingProfile = await kvGet(socialUserKey);
    if (!existingProfile) {
      await kvSet(socialUserKey, {
        email: emailLow,
        prenom: '',
        nom: '',
        username: '',
        since: since
      });
    }

    return res.status(200).json({ ok: true, email: emailLow });
  }

  // ══════════════════ LOGIN ══════════════════
  if (action === 'login') {
    const { email, hash } = body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, err: 'Email invalide' });
    }

    if (!kvAvailable) {
      return res.status(503).json({ ok: false, err: 'KV not available', kvAvailable: false });
    }

    const emailLow = email.trim().toLowerCase();
    const userKey = `forge:auth:${safe(emailLow)}`;

    const user = await kvGet(userKey);
    if (!user) {
      return res.status(400).json({ ok: false, err: 'Aucun compte avec cet email' });
    }

    if (user.hash !== hash) {
      return res.status(400).json({ ok: false, err: 'Mot de passe incorrect' });
    }

    return res.status(200).json({ ok: true, email: emailLow });
  }

  // ══════════════════ GET USERS LIST (admin) ══════════════════
  if (action === 'get_users') {
    const { adminEmail } = body;
    if (adminEmail !== 'balalobidudi2@gmail.com') {
      return res.status(403).json({ ok: false, err: 'Forbidden' });
    }

    if (!kvAvailable) {
      return res.status(503).json({ ok: false, err: 'KV not available' });
    }

    const list = (await kvGet('forge:auth:list')) || [];
    const safeList = Array.isArray(list) ? list : [];
    const users = await Promise.all(safeList.map(async (e) => {
      const u = await kvGet(`forge:auth:${safe(e)}`);
      return u ? { email: u.email || e, since: u.since, createdAt: u.createdAt } : { email: e };
    }));

    return res.status(200).json({ ok: true, users: users.filter(Boolean) });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
