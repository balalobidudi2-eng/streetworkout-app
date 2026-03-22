// api/chat.js — Vercel Edge Function (proxy sécurisé vers OpenAI)
// La clé OpenAI est stockée dans les variables d'environnement Vercel.
// Elle n'est JAMAIS exposée côté client.

export const config = { runtime: 'edge' };

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { messages, userContext } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages invalides' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Sanitize messages — n'accepter que role + content (strings)
  const safeMessages = messages
    .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
    .slice(-10) // Limiter à 10 messages pour contrôler les coûts
    .map(m => ({
      role: m.role === 'user' || m.role === 'assistant' ? m.role : 'user',
      content: m.content.slice(0, 1000) // Max 1000 chars par message
    }));

  if (safeMessages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages vides' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Construire le contexte utilisateur (données provenant de Supabase côté client)
  var contextLines = '';
  if (userContext && typeof userContext === 'object') {
    var ctx = userContext;
    contextLines = '\nDonnées de l\'utilisateur :\n';
    if (ctx.niveau)           contextLines += '- Niveau : ' + ctx.niveau + '\n';
    if (ctx.poids)            contextLines += '- Poids : ' + parseFloat(ctx.poids) + ' kg\n';
    if (ctx.taille)           contextLines += '- Taille : ' + parseFloat(ctx.taille) + ' cm\n';
    if (ctx.pullups)          contextLines += '- Tractions max : ' + parseInt(ctx.pullups) + ' reps\n';
    if (ctx.dips)             contextLines += '- Dips max : ' + parseInt(ctx.dips) + ' reps\n';
    if (ctx.pushups)          contextLines += '- Pompes max : ' + parseInt(ctx.pushups) + ' reps\n';
    if (ctx.muscleup)         contextLines += '- Muscle-up : ' + ctx.muscleup + '\n';
    if (ctx.consecutiveDays)  contextLines += '- Jours d\'entraînement consécutifs : ' + parseInt(ctx.consecutiveDays) + '\n';
    if (ctx.needsDeload)      contextLines += '- ALERTE DELOAD : l\'athlète s\'entraîne sans pause depuis ≥28 jours.\n';
  }

  // Deload alert prefix
  var deloadAlert = '';
  if (userContext && userContext.needsDeload) {
    deloadAlert = '⚠️ PRIORITÉ : L\'athlète n\'a pas eu de semaine de décharge depuis au moins 28 jours. ' +
      'Commence ta réponse en recommandant une semaine de déload (volume -40%, intensité -20%) ' +
      'avant tout autre conseil. ';
  }

  const systemPrompt =
    deloadAlert +
    'Tu es SwBot, un coach fitness expert en Street Workout, Calisthénie et Streetlifting. ' +
    'Tu parles en français, avec un ton motivant mais direct.' +
    contextLines + '\n' +
    'Standards scientifiques à appliquer :\n' +
    '- Progressions : règle 3×10 → lest (Tan 1999, NSCA)\n' +
    '- Protéines : 1.6–2.2 g/kg/jour (Morton et al. 2018, MDPI Nutrients 2025)\n' +
    '- Repos inter-séries : 2–3 min force (Schoenfeld 2017), 60–90 s hypertrophie\n' +
    '- Déload : 1 semaine toutes les 4–6 semaines (semaine de décharge : -40% volume, -20% intensité)\n' +
    '- Fréquence optimale : 2–4 séances/groupe musculaire/semaine (Krieger 2010)\n' +
    'Règles générales :\n' +
    '- Réponses courtes et concrètes (3–5 phrases max sauf si programme demandé)\n' +
    '- Toujours basé sur la science du sport\n' +
    '- Jamais de conseils médicaux (renvoyer vers un professionnel)\n' +
    '- Utiliser les données utilisateur pour personnaliser les conseils\n' +
    '- Emojis avec modération (1–2 max par réponse)';

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return new Response(JSON.stringify({
      reply: 'Le coach IA n\'est pas encore configuré. Reviens bientôt ! 🔧'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...safeMessages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'OpenAI error ' + openaiRes.status);
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || 'Pas de réponse.';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('OpenAI error:', err.message);
    return new Response(JSON.stringify({
      reply: 'Désolé, je rencontre un problème technique. Réessaie dans quelques secondes 🔄'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
