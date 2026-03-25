var fs = require('fs');
var src = fs.readFileSync('js/api.js', 'utf8');

/* ── 1. nbExercices: min 5 ── */
src = src.replace(
  /var nbExercices = dureeMin <= 30 \? 4 :/,
  'var nbExercices = dureeMin <= 30 ? 5 :'
);

/* ── 2. Replace systemPrompt and userPrompt ── */
var startMarker = /var systemPrompt\s*=/;
var endMarker   = /\n\s*try\s*\{/;

var si = src.search(startMarker);
var ei = src.search(endMarker);

if (si === -1 || ei === -1) { console.error('Markers not found', si, ei); process.exit(1); }

var before = src.slice(0, si);
var after  = src.slice(ei);

var newPrompts =
`    var systemPrompt =
      'Tu es un coach expert en street workout et pr\u00e9paration physique. ' +
      'R\u00c8GLES ABSOLUES (NON N\u00c9GOCIABLES) :\\n' +
      '(1) DUR\u00c9E : calcule le temps d\u2019ex\u00e9cution + repos de chaque exercice. La s\u00e9ance DOIT durer exactement ' + dureeMin + ' min (\u00b15 min). ' +
      'Si trop courte \u2192 ajoute des exercices. Si trop longue \u2192 ajuste. Indique "temps_estime" par exercice.\\n' +
      '(2) MAT\u00c9RIEL/LIEU : n\u2019utilise JAMAIS un exercice n\u00e9cessitant du mat\u00e9riel absent du lieu. ' +
      (profil.lieu === 'street'
        ? 'STREET = INTERDIT : box jump, machines de salle. AUTORIS\u00c9 : tractions, dips, pompes, gainage, anneaux.\\n'
        : '\\n') +
      '(3) OBJECTIF FORCE : exercices lourds uniquement, 1\u20136 reps, repos 2\u20133 min. INTERDIT : burpees, mountain climbers, jumping jacks, cardio.\\n' +
      '(4) OBJECTIF ENDURANCE : r\u00e9p\u00e9titions \u00e9lev\u00e9es 15\u201325, repos courts 30\u201360 sec. Pas de charges extr\u00eames.\\n' +
      '(5) MINIMUM 5 exercices par s\u00e9ance, pas d\u2019exception.\\n' +
      '(6) LEST DISPONIBLE : obligatoirement utilis\u00e9 dans au moins 3 exercices par s\u00e9ance (nommer le poids, ex: "Tractions lest\u00e9es (10kg)").\\n' +
      '(7) NIVEAU : adapte TOUS les exercices au niveau r\u00e9el. Prescris le niveau D\u00c9BUTANT/INTERM\u00c9DIAIRE/AVANC\u00c9 d\u00e9taill\u00e9 dans l\u2019analyse.\\n' +
      '(8) CHARGES R\u00c9ALISTES : n\u2019indique jamais une charge impossible \u00e0 tenir au regard des performances mesur\u00e9es.\\n' +
      '(9) CHAMP skill : pour chaque exercice ciblant un skill, mets le nom du skill dans "skill" (ex: "muscle-up"), sinon null.\\n' +
      '(10) AUTO-V\u00c9RIFICATION AVANT R\u00c9PONSE : dur\u00e9e correcte \u2713 | coh\u00e9rence objectif \u2713 | coh\u00e9rence niveau \u2713 | mat\u00e9riel OK \u2713 | \u22655 exercices \u2713. Corrige toute erreur avant de r\u00e9pondre.\\n' +
      'R\u00e9ponds UNIQUEMENT en JSON valide, sans texte hors du JSON.';

    var userPrompt =
      'G\u00e9n\u00e8re un programme d\u2019entra\u00eenement COMPLET pour tous les jours demand\u00e9s.\\n\\n' +
      '### \ud83d\udc64 DONN\u00c9ES UTILISATEUR\\n' +
      '- Objectif : ' + (profil.objectif || 'MAINTIEN') + '\\n' +
      '- Niveau : ' + (profil.niveau || 'D\u00e9butant') + '\\n' +
      '- \u00c2ge : ' + (profil.age || 25) + ' ans | Poids : ' + (profil.poids || 75) + ' kg | Taille : ' + (profil.taille || 175) + ' cm\\n' +
      '- Fr\u00e9quence : ' + (profil.frequence || 3) + ' j/semaine\\n' +
      '- Jours : ' + (profil.jours ? profil.jours.join(', ') : 'Lundi, Mercredi, Vendredi') + '\\n' +
      '- Dur\u00e9e par s\u00e9ance : ' + dureeMin + ' min (\u00b15 min maximum)\\n' +
      '- Lieu : ' + lieuLabel + '\\n' +
      '- Mat\u00e9riel lest\u00e9 : ' + (lesteText || 'aucun') + '\\n' +
      (skillsText ? '- Skills s\u00e9lectionn\u00e9s : ' + skillsText + '\\n' : '') +
      '\\n### \u23f1 DUR\u00c9E\\n' +
      '- Calcule : temps d\u2019ex\u00e9cution + temps de repos pour chaque exercice\\n' +
      '- Si la s\u00e9ance est trop courte \u2192 ajoute des exercices\\n' +
      '- Si trop longue \u2192 ajuste les reps ou le repos\\n' +
      '- Indique "temps_estime" pour chaque exercice (ex: "3 min")\\n' +
      '\\n### \ud83e\uddf1 STRUCTURE OBLIGATOIRE (' + dureeMin + ' min)\\n' +
      (skillsText
        ? '1. Skill (' + skillsText + ') \u2192 15\u201325 min\\n2. Bloc principal \u2192 30\u201340 min\\n3. Accessoires \u2192 20\u201330 min\\n4. Finisher (optionnel)\\n'
        : seanceStructure + '\\n') +
      '\\n### \ud83d\udd04 VOLUME MINIMUM\\n' +
      '- MINIMUM 5 exercices par s\u00e9ance (obligatoire)\\n' +
      '- Objectif : EXACTEMENT ' + nbExercices + ' exercices pour ' + dureeMin + ' min\\n' +
      lesteObligation +
      objectifScheme +
      testContext +
      skillObligations +
      historiqueText +
      '\\n### \ud83d\udccb EXERCICES DISPONIBLES (cr\u00e9er des variantes lest\u00e9es si n\u00e9cessaire)\\n' + exList + '\\n\\n' +
      '### \ud83d\udfeb FILTRAGE AUTOMATIQUE\\n' +
      '- Supprimer tout exercice non adapt\u00e9 au lieu, \u00e0 l\u2019objectif, au niveau ou au mat\u00e9riel\\n' +
      (profil.lieu === 'street'
        ? '- LIEU STREET : supprimer box jump, machines de salle\\n'
        : '') +
      ((profil.objectif || '').toUpperCase() === 'FORCE'
        ? '- OBJECTIF FORCE : supprimer cardio, burpees, mountain climbers, jumping jacks\\n'
        : '') +
      '\\nFORMAT JSON OBLIGATOIRE :\\n' +
      '{\\n' +
      '  "programme": [\\n' +
      '    {\\n' +
      '      "jour": "Lundi",\\n' +
      '      "type": "Progression ' + (skillsText ? skillsText.split(',')[0].trim() : 'Force') + '",\\n' +
      '      "duree": "' + dureeMin + ' min",\\n' +
      '      "exercices": [\\n' +
      '        {\\n' +
      '          "nom": "...",\\n' +
      '          "series": 4,\\n' +
      '          "reps": "5-6",\\n' +
      '          "repos": "120 sec",\\n' +
      '          "temps_estime": "5 min",\\n' +
      '          "conseil": "...",\\n' +
      '          "skill": null\\n' +
      '        }\\n' +
      '      ]\\n' +
      '    }\\n' +
      '  ],\\n' +
      '  "conseil_global": "..."\\n' +
      '}';
`;

src = before + newPrompts + after;

/* ── 3. max_tokens 3500 → 4500 ── */
src = src.replace(/max_tokens: 3500/, 'max_tokens: 4500');

/* ── 4. generateFallback: perDay min 4 → 5 ── */
src = src.replace(
  /var perDay\s*=\s*dur <= 30 \? 4 : dur <= 60 \? 6/,
  'var perDay   = dur <= 30 ? 5 : dur <= 60 ? 6'
);

/* ── 5. generateFallback: trim minimum 4 → 5 ── */
src = src.replace(
  /dayExs\.length > 4\)/,
  'dayExs.length > 5)'
);

/* ── 6. generateFallback: add temps_estime to exercises ── */
/* After building each exercise with scheme(), attach computed time */
src = src.replace(
  /function calcSeanceTime\(exList\) \{/,
  'function calcSeanceTime(exList) {'
);
/* Add formatTime helper after calcSeanceTime */
src = src.replace(
  /(function calcSeanceTime\(exList\) \{[\s\S]*?^\s*\})/m,
  function(match) {
    return match + '\n\n    function formatEstTime(ex) {\n' +
      '      var secs = parseDuration(ex.reps || \'10\', ex.series || 3) +\n' +
      '        (parseInt((ex.repos || \'90 sec\').replace(/[^0-9]/g,\'\')) || 90) * Math.max(0, (ex.series || 3) - 1);\n' +
      '      var m = Math.round(secs / 60); return (m < 1 ? 1 : m) + \' min\';\n' +
      '    }';
  }
);

/* Patch skill exercises to add temps_estime when pushed into dayExs */
src = src.replace(
  /dayExs\.push\(skillExs\[\(sk \+ s2\) % skillExs\.length\]\);/,
  [
    'var _sx = Object.assign({}, skillExs[(sk + s2) % skillExs.length]);',
    '        _sx.temps_estime = formatEstTime(_sx);',
    '        dayExs.push(_sx);'
  ].join('\n        ')
);

/* Patch qPool exercises to add temps_estime */
src = src.replace(
  /dayExs\.push\(\{ nom: applyLeste\(qPool\[pidx % qPool\.length\]\), series: sc\.s, reps: sc\.r, repos: sc\.p, conseil: '' \}\);/,
  [
    'var _qx = { nom: applyLeste(qPool[pidx % qPool.length]), series: sc.s, reps: sc.r, repos: sc.p, conseil: \'\' };',
    '        _qx.temps_estime = formatEstTime(_qx);',
    '        dayExs.push(_qx);'
  ].join('\n        ')
);

/* Patch extra fill exercises */
src = src.replace(
  /var ex2 = \{ nom: applyLeste\(qPool\[extra % qPool\.length\]\), series: sc2\.s, reps: sc2\.r, repos: sc2\.p, conseil: '' \};/,
  [
    'var ex2 = { nom: applyLeste(qPool[extra % qPool.length]), series: sc2.s, reps: sc2.r, repos: sc2.p, conseil: \'\' };',
    '        ex2.temps_estime = formatEstTime(ex2);'
  ].join('\n        ')
);

fs.writeFileSync('js/api.js', src, 'utf8');
console.log('api.js updated OK');
