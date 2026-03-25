import { readFileSync } from 'fs';

// Load .env.local
const env = {};
readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const KV_URL   = env.KV_REST_API_URL;
const KV_TOKEN = env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const j = await r.json();
  return j.result !== undefined ? j.result : null;
}

async function kvSet(key, value) {
  const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });
  const j = await r.json();
  return j;
}

function parse(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function safe(email) {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function registerUser(email, prenom, nom, since) {
  const emailLow = email.trim().toLowerCase();
  const profile = { email: emailLow, prenom, nom, since };
  const setResult = await kvSet(`forge:user:${safe(emailLow)}`, profile);
  console.log(`SET forge:user:${safe(emailLow)} →`, setResult);

  const list = parse(await kvGet('forge:users:list')) || [];
  if (!list.includes(emailLow)) {
    list.push(emailLow);
    await kvSet('forge:users:list', list);
  }
  console.log(`Registered ${emailLow} (${prenom}). Users list:`, list);
}

// Register both known users
await registerUser('1@gmail.com',                  'Ilias',  '', '2024-01-01');
await registerUser('gillesestmera25@gmail.com',    'Yannis', '', '2024-01-01');

// Verify search
console.log('\n--- Verification search "ilias" ---');
const list = parse(await kvGet('forge:users:list')) || [];
for (const email of list) {
  const p = parse(await kvGet(`forge:user:${safe(email)}`));
  const haystack = `${p?.prenom || ''} ${p?.nom || ''} ${email}`.toLowerCase();
  console.log(`  ${email}: prenom="${p?.prenom}" | ilias? ${haystack.includes('ilias')} | yannis? ${haystack.includes('yannis')}`);
}
