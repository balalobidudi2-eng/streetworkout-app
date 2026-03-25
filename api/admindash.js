// api/admin.js — Vercel Serverless — Admin dashboard data
// Uses Supabase service role key to list ALL users from auth.users
// Env var required: SUPABASE_SERVICE_ROLE_KEY (add in Vercel dashboard)
// Also uses KV as fallback if service role key is not set

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const SUPABASE_URL  = 'https://tahuyewnuizejbkmqlcb.supabase.co';
const ADMIN_EMAIL   = 'balalobidudi2@gmail.com';

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const body       = req.body || {};
  const action     = body.action || '';
  const callerEmail = (body.callerEmail || '').trim().toLowerCase();

  /* Only admin can call these endpoints */
  if (callerEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const KV_URL      = process.env.KV_REST_API_URL || '';
  const KV_TOKEN    = process.env.KV_REST_API_TOKEN || '';

  /* ── KV helper ── */
  async function kvGet(key) {
    if (!KV_URL || !KV_TOKEN) return null;
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
    } catch(e) { return null; }
  }

  /* ═════════════════ GET ALL USERS ═════════════════ */
  if (action === 'get_all_users') {
    /* 1. Supabase Admin API (requires service role key) */
    if (SERVICE_KEY) {
      try {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        });
        if (r.ok) {
          const data = await r.json();
          const users = (data.users || []).map(u => ({
            id:            u.id,
            email:         u.email,
            created_at:    u.created_at,
            last_sign_in:  u.last_sign_in_at,
            confirmed:     !!u.confirmed_at,
            provider:      (u.app_metadata && u.app_metadata.provider) || 'email',
            name:          (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || ''
          }));
          return res.status(200).json({ ok: true, source: 'supabase', users });
        }
      } catch(e) {}
    }

    /* 2. KV fallback */
    if (KV_URL && KV_TOKEN) {
      try {
        const list = (await kvGet('forge:auth:list')) || [];
        const safeList = Array.isArray(list) ? list : [];
        function safe(e) { return (e || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_'); }
        const users = await Promise.all(safeList.map(async (email) => {
          const u = await kvGet(`forge:auth:${safe(email)}`);
          return {
            email:      email,
            created_at: u ? u.since || u.createdAt || null : null,
            provider:   'email',
            name:       ''
          };
        }));
        return res.status(200).json({ ok: true, source: 'kv', users: users.filter(Boolean) });
      } catch(e) {}
    }

    return res.status(200).json({ ok: true, source: 'none', users: [] });
  }

  /* ═════════════════ GET STATS ═════════════════ */
  if (action === 'get_stats') {
    let totalUsers = 0;
    let newToday   = 0;
    let newThisWeek = 0;
    let byDay      = {}; // { 'YYYY-MM-DD': count }
    let source     = 'none';

    const today     = new Date().toISOString().slice(0, 10);
    const weekAgo   = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    if (SERVICE_KEY) {
      try {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        });
        if (r.ok) {
          const data = await r.json();
          const users = data.users || [];
          totalUsers = users.length;
          source = 'supabase';
          users.forEach(u => {
            const d = (u.created_at || '').slice(0, 10);
            if (d === today) newToday++;
            if (d >= weekAgo) newThisWeek++;
            if (d) byDay[d] = (byDay[d] || 0) + 1;
          });
        }
      } catch(e) {}
    }

    if (source === 'none' && KV_URL && KV_TOKEN) {
      try {
        const list = (await kvGet('forge:auth:list')) || [];
        totalUsers = Array.isArray(list) ? list.length : 0;
        source = 'kv';
        function safe(e) { return (e || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_'); }
        await Promise.all((Array.isArray(list) ? list : []).map(async (email) => {
          const u = await kvGet(`forge:auth:${safe(email)}`);
          const d = u ? (u.since || '').slice(0, 10) : '';
          if (d === today) newToday++;
          if (d >= weekAgo) newThisWeek++;
          if (d) byDay[d] = (byDay[d] || 0) + 1;
        }));
      } catch(e) {}
    }

    /* Sort byDay last 30 days */
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      last30.push({ date: d, count: byDay[d] || 0 });
    }

    return res.status(200).json({
      ok: true, source,
      totalUsers, newToday, newThisWeek,
      byDay: last30,
      serviceKeySet: !!SERVICE_KEY
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
