const fs = require('fs');
const f = 'js/api.js';
let c = fs.readFileSync(f, 'utf8');
const hasCRLF = c.includes('\r\n');
if (hasCRLF) c = c.replace(/\r\n/g, '\n');

function rep(old, neo, label) {
  if (c.includes(old)) { c = c.split(old).join(neo); console.log('OK:', label); return true; }
  console.log('NOT FOUND:', label);
  return false;
}

// ── 1. nbExercices (uses real UTF8 en-dashes) ──────────────────────────────
rep(
  "    /* Nombre d'exercices selon dur\u00e9e */\n    var nbExercices = dureeMin <= 30 ? '4\u20135' : dureeMin <= 60 ? '5\u20136' : dureeMin <= 90 ? '6\u20138' : '7\u20139';",
  "    /* Nombre d'exercices selon dur\u00e9e + blocs de s\u00e9ance */\n" +
  "    var nbExercices = dureeMin <= 30 ? 4 : dureeMin <= 60 ? 6 : dureeMin <= 90 ? 8 : 10;\n" +
  "    var nbExStr = String(nbExercices);\n" +
  "    var seanceStructure = dureeMin <= 45\n" +
  "      ? 'Bloc unique : ' + nbExercices + ' exercices complets'\n" +
  "      : dureeMin <= 60\n" +
  "        ? 'Bloc 1 Skills/Force (25 min) + Bloc 2 Assistance (20 min) + Bloc 3 Core (15 min)'\n" +
  "        : dureeMin <= 90\n" +
  "          ? 'Bloc 1 Skill/Technique (20 min) + Bloc 2 Force principale (35 min) + Bloc 3 Accessoires (20 min) + Bloc 4 Core+Finisher (15 min)'\n" +
  "          : 'Bloc 1 Skill (25 min) + Bloc 2 Force (40 min) + Bloc 3 Hypertrophie (30 min) + Bloc 4 Core+Finisher (25 min)';",
  'nbExercices'
);

// ── 2. Durée line in userPrompt (real UTF8 chars) ──────────────────────────
rep(
  "'- Dur\u00e9e s\u00e9ance : ' + dureeMin + ' min \u2192 ' + nbExercices + ' exercices par s\u00e9ance\\n' +",
  "'- Dur\u00e9e s\u00e9ance : ' + dureeMin + ' min \u2192 EXACTEMENT ' + nbExercices + ' exercices par s\u00e9ance (CHAQUE jour, sans exception)\\n' +\n" +
  "      '- Structure : ' + seanceStructure + '\\n' +",
  'duree line'
);

const out = hasCRLF ? c.replace(/\n/g, '\r\n') : c;
fs.writeFileSync(f, out, 'utf8');
console.log('Done.');
