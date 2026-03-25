/* ═══════════════════════════════════════════════════════
   FORGE — api/userdata.js
   Server-side user data persistence via Vercel KV (Redis).
   Falls back gracefully if KV is not configured.
   ═══════════════════════════════════════════════════════ */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  /* Require KV environment variables */
  var KV_URL     = process.env.KV_REST_API_URL;
  var KV_TOKEN   = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({ error: 'KV not configured' });
  }

  /* Helper: call Vercel KV REST API */
  async function kvGet(key) {
    var r = await fetch(KV_URL + '/get/' + encodeURIComponent(key), {
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });
    if (!r.ok) return null;
    var j = await r.json();
    return j.result;
  }

  async function kvSet(key, value) {
    var r = await fetch(KV_URL + '/set/' + encodeURIComponent(key), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
    return r.ok;
  }

  async function kvScan(pattern) {
    var r = await fetch(KV_URL + '/scan/0?match=' + encodeURIComponent(pattern) + '&count=200', {
      headers: { Authorization: 'Bearer ' + KV_TOKEN }
    });
    if (!r.ok) return [];
    var j = await r.json();
    /* KV scan returns [cursor, [keys...]] */
    return Array.isArray(j.result) && Array.isArray(j.result[1]) ? j.result[1] : [];
  }

  /* Sanitise email → safe key segment */
  function safeEmail(email) {
    return (email || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  if (req.method === 'GET') {
    /* GET /api/userdata?email=x  →  { key: value, ... } for all keys of user */
    var email = req.query.email || '';
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });

    var safe = safeEmail(email);
    var pattern = 'sw_*__' + safe;
    try {
      var keys = await kvScan(pattern);
      var result = {};
      await Promise.all(keys.map(async function(k) {
        var val = await kvGet(k);
        if (val !== null) result[k] = val;
      }));
      return res.status(200).json(result);
    } catch(e) {
      return res.status(500).json({ error: 'KV error', detail: e.message });
    }

  } else if (req.method === 'POST') {
    /* POST /api/userdata  body: { email, key, data } */
    var body = req.body || {};
    var email = body.email || '';
    var key   = body.key   || '';
    var data  = body.data;

    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
    if (!key)   return res.status(400).json({ error: 'Missing key' });

    /* Validate that key belongs to this email (namespace check) */
    var safe = safeEmail(email);
    if (!key.endsWith('__' + safe)) {
      return res.status(403).json({ error: 'Key namespace mismatch' });
    }

    try {
      await kvSet(key, data);
      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: 'KV error', detail: e.message });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
