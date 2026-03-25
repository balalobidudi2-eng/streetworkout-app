export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  const ADMIN_EMAIL = '1@gmail.com';

  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({ error: 'KV not configured', ok: false });
  }

  /* ── KV helpers ── */
  async function kvGet(key) {
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
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
  }

  function parse(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function safe(email) {
    return (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /* ── Key schema ── */
  const k = {
    usersList:  'forge:users:list',
    user:       (e)       => `forge:user:${safe(e)}`,
    friends:    (e)       => `forge:friends:${safe(e)}`,
    friendReqs: (e)       => `forge:friend_req:${safe(e)}`,
    dm:         (a, b)    => `forge:dm:${[safe(a), safe(b)].sort().join('__')}`,
    groups:     (e)       => `forge:groups:${safe(e)}`,
    group:      (id)      => `forge:group:${id}`,
    groupMsgs:  (id)      => `forge:group_msgs:${id}`,
    msgIndex:              'forge:admin:msg_index',
  };

  /* ══════════════════ GET ══════════════════ */
  if (req.method === 'GET') {
    const action = req.query.action || '';
    const caller = (req.query.caller || req.query.email || '').trim().toLowerCase();

    /* ── Search users ── */
    if (action === 'search') {
      const q = (req.query.q || '').trim().toLowerCase();
      if (q.length < 2) return res.status(200).json([]);
      const list = parse(await kvGet(k.usersList)) || [];
      const results = await Promise.all(
        list.map(async (email) => {
          if (email === caller) return null;
          const p = parse(await kvGet(k.user(email)));
          if (!p) return null;
          const haystack = `${p.prenom} ${p.nom} ${p.username || ''} ${email}`.toLowerCase();
          return haystack.includes(q) ? p : null;
        })
      );
      return res.status(200).json(results.filter(Boolean));
    }

    /* ── Friends list ── */
    if (action === 'get_friends') {
      if (!caller) return res.status(400).json({ error: 'Missing email' });
      const friendEmails = parse(await kvGet(k.friends(caller))) || [];
      const profiles = await Promise.all(
        friendEmails.map(async (e) => parse(await kvGet(k.user(e))) || { email: e, prenom: e, nom: '' })
      );
      return res.status(200).json(profiles);
    }

    /* ── Pending friend requests ── */
    if (action === 'get_requests') {
      if (!caller) return res.status(400).json({ error: 'Missing email' });
      const reqs = parse(await kvGet(k.friendReqs(caller))) || [];
      const enriched = await Promise.all(
        reqs.map(async (r) => {
          const p = parse(await kvGet(k.user(r.from)));
          return { ...r, profile: p || { email: r.from, prenom: r.from, nom: '' } };
        })
      );
      return res.status(200).json(enriched);
    }

    /* ── DM thread ── */
    if (action === 'get_dm') {
      const withEmail = (req.query.with || '').trim().toLowerCase();
      if (!caller || !withEmail) return res.status(400).json({ error: 'Missing params' });
      return res.status(200).json(parse(await kvGet(k.dm(caller, withEmail))) || []);
    }

    /* ── Groups list ── */
    if (action === 'get_groups') {
      if (!caller) return res.status(400).json({ error: 'Missing email' });
      const ids = parse(await kvGet(k.groups(caller))) || [];
      const groups = await Promise.all(ids.map(async (id) => parse(await kvGet(k.group(id)))));
      return res.status(200).json(groups.filter(Boolean));
    }

    /* ── Group messages ── */
    if (action === 'get_group_msgs') {
      const groupId = req.query.group || '';
      if (!groupId || !caller) return res.status(400).json({ error: 'Missing params' });
      const group = parse(await kvGet(k.group(groupId)));
      if (!group || !group.members.includes(caller)) return res.status(403).json({ error: 'Not a member' });
      return res.status(200).json(parse(await kvGet(k.groupMsgs(groupId))) || []);
    }

    /* ── Admin: all users ── */
    if (action === 'admin_users') {
      if (caller !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });
      const list = parse(await kvGet(k.usersList)) || [];
      const users = await Promise.all(list.map(async (e) => parse(await kvGet(k.user(e)))));
      return res.status(200).json(users.filter(Boolean));
    }

    /* ── Admin: conversation index ── */
    if (action === 'admin_messages') {
      if (caller !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });
      return res.status(200).json(parse(await kvGet(k.msgIndex)) || []);
    }

    /* ── Admin: read a specific DM or group thread ── */
    if (action === 'admin_read_thread') {
      if (caller !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });
      const type   = req.query.type || '';
      const target = req.query.target || '';
      if (!type || !target) return res.status(400).json({ error: 'Missing params' });
      const kvKey = type === 'dm' ? `forge:dm:${target}` : k.groupMsgs(target);
      return res.status(200).json(parse(await kvGet(kvKey)) || []);
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  /* ══════════════════ POST ══════════════════ */
  if (req.method === 'POST') {
    const body   = req.body || {};
    const action = body.action || '';

    /* ── Register / update public profile ── */
    if (action === 'register') {
      const { email, prenom, nom, username, since } = body;
      if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
      const emailLow = email.trim().toLowerCase();
      const profile  = { email: emailLow, prenom: prenom || '', nom: nom || '', username: username || '', since: since || new Date().toISOString().slice(0, 10) };

      await kvSet(k.user(emailLow), profile);

      const list = parse(await kvGet(k.usersList)) || [];
      if (!list.includes(emailLow)) {
        list.push(emailLow);
        await kvSet(k.usersList, list);
      }
      return res.status(200).json({ ok: true });
    }

    /* ── Send friend request ── */
    if (action === 'friend_request') {
      const { from, to } = body;
      if (!from || !to) return res.status(400).json({ error: 'Missing params' });
      const fromLow = from.trim().toLowerCase();
      const toLow   = to.trim().toLowerCase();
      if (fromLow === toLow) return res.status(400).json({ error: 'Cannot add yourself' });

      const friends = parse(await kvGet(k.friends(fromLow))) || [];
      if (friends.includes(toLow)) return res.status(200).json({ ok: true, already: true });

      const reqs = parse(await kvGet(k.friendReqs(toLow))) || [];
      if (!reqs.some((r) => r.from === fromLow)) {
        reqs.push({ from: fromLow, ts: Date.now() });
        await kvSet(k.friendReqs(toLow), reqs);
      }
      return res.status(200).json({ ok: true });
    }

    /* ── Accept friend request ── */
    if (action === 'accept_friend') {
      const { email, from } = body;
      if (!email || !from) return res.status(400).json({ error: 'Missing params' });
      const emailLow = email.trim().toLowerCase();
      const fromLow  = from.trim().toLowerCase();

      const myF = parse(await kvGet(k.friends(emailLow))) || [];
      if (!myF.includes(fromLow)) { myF.push(fromLow); await kvSet(k.friends(emailLow), myF); }

      const theirF = parse(await kvGet(k.friends(fromLow))) || [];
      if (!theirF.includes(emailLow)) { theirF.push(emailLow); await kvSet(k.friends(fromLow), theirF); }

      const reqs = (parse(await kvGet(k.friendReqs(emailLow))) || []).filter((r) => r.from !== fromLow);
      await kvSet(k.friendReqs(emailLow), reqs);
      return res.status(200).json({ ok: true });
    }

    /* ── Reject friend request ── */
    if (action === 'reject_friend') {
      const { email, from } = body;
      if (!email || !from) return res.status(400).json({ error: 'Missing params' });
      const emailLow = email.trim().toLowerCase();
      const fromLow  = from.trim().toLowerCase();
      const reqs = (parse(await kvGet(k.friendReqs(emailLow))) || []).filter((r) => r.from !== fromLow);
      await kvSet(k.friendReqs(emailLow), reqs);
      return res.status(200).json({ ok: true });
    }

    /* ── Send DM ── */
    if (action === 'send_message') {
      const { from, to, text } = body;
      if (!from || !to || !text) return res.status(400).json({ error: 'Missing params' });
      if (text.length > 2000)   return res.status(400).json({ error: 'Message too long' });

      const fromLow = from.trim().toLowerCase();
      const toLow   = to.trim().toLowerCase();
      const dmKey   = k.dm(fromLow, toLow);
      const msgs    = parse(await kvGet(dmKey)) || [];
      msgs.push({ from: fromLow, ts: Date.now(), text: text.trim() });
      if (msgs.length > 500) msgs.splice(0, msgs.length - 500);
      await kvSet(dmKey, msgs);

      /* Update admin message index */
      const pair  = [fromLow, toLow].sort().join('|');
      const index = parse(await kvGet(k.msgIndex)) || [];
      if (!index.find((i) => i.type === 'dm' && i.key === pair)) {
        index.push({ type: 'dm', key: pair, from: fromLow, to: toLow });
        await kvSet(k.msgIndex, index);
      }
      return res.status(200).json({ ok: true });
    }

    /* ── Create group ── */
    if (action === 'create_group') {
      const { creator, name, members } = body;
      if (!creator || !name || !members || !members.length) return res.status(400).json({ error: 'Missing params' });
      const creatorLow = creator.trim().toLowerCase();
      const allMembers = [...new Set([creatorLow, ...members.map((m) => m.trim().toLowerCase())])];
      const id         = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const group      = { id, name: name.trim(), creator: creatorLow, members: allMembers, created: new Date().toISOString().slice(0, 10) };

      await kvSet(k.group(id), group);

      for (const m of allMembers) {
        const gl = parse(await kvGet(k.groups(m))) || [];
        if (!gl.includes(id)) { gl.push(id); await kvSet(k.groups(m), gl); }
      }

      const index = parse(await kvGet(k.msgIndex)) || [];
      index.push({ type: 'group', key: id, name: group.name, creator: creatorLow });
      await kvSet(k.msgIndex, index);

      return res.status(200).json({ ok: true, id });
    }

    /* ── Send group message ── */
    if (action === 'send_group_msg') {
      const { group: groupId, from, text } = body;
      if (!groupId || !from || !text) return res.status(400).json({ error: 'Missing params' });
      if (text.length > 2000)          return res.status(400).json({ error: 'Message too long' });

      const fromLow  = from.trim().toLowerCase();
      const group    = parse(await kvGet(k.group(groupId)));
      if (!group || !group.members.includes(fromLow)) return res.status(403).json({ error: 'Not a member' });

      const msgs = parse(await kvGet(k.groupMsgs(groupId))) || [];
      msgs.push({ from: fromLow, ts: Date.now(), text: text.trim() });
      if (msgs.length > 500) msgs.splice(0, msgs.length - 500);
      await kvSet(k.groupMsgs(groupId), msgs);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
