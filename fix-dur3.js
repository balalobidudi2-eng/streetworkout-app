const fs = require('fs');
const f = 'js/api.js';
let c = fs.readFileSync(f, 'utf8');
const hasCRLF = c.includes('\r\n');
if (hasCRLF) c = c.replace(/\r\n/g, '\n');

// Use Buffer to build string with exact bytes for en-dash (U+2013 = \xe2\x80\x93 in UTF-8)
const enDash = '\u2013';

const old1 =
  "    /* Nombre d'exercices selon dur\u00e9e */\n" +
  "    var nbExercices = dureeMin <= 30 ? '4" + enDash + "5' : dureeMin <= 60 ? '5" + enDash + "6' : dureeMin <= 90 ? '6" + enDash + "8' : '7" + enDash + "9';";

const new1 =
  "    /* Nombre d'exercices selon dur\u00e9e + structure en blocs */\n" +
  "    var nbExercices = dureeMin <= 30 ? 4 : dureeMin <= 60 ? 6 : dureeMin <= 90 ? 8 : 10;\n" +
  "    var seanceStructure = dureeMin <= 45\n" +
  "      ? 'Bloc unique : ' + nbExercices + ' exercices'\n" +
  "      : dureeMin <= 60\n" +
  "        ? 'Bloc 1 Skills+Force (25 min) | Bloc 2 Assistance (20 min) | Bloc 3 Core (15 min)'\n" +
  "        : dureeMin <= 90\n" +
  "          ? 'Bloc 1 Skill/Technique (20 min) | Bloc 2 Force principale (35 min) | Bloc 3 Accessoires (20 min) | Bloc 4 Core+Finisher (15 min)'\n" +
  "          : 'Bloc 1 Skill (25 min) | Bloc 2 Force (40 min) | Bloc 3 Hypertrophie (30 min) | Bloc 4 Core+Finisher (25 min)';";

if (c.includes(old1)) {
  c = c.split(old1).join(new1);
  console.log('OK: nbExercices');
} else {
  // debug: show exactly what's there
  const i = c.indexOf("/* Nombre d'exercices");
  console.log('NOT FOUND. Actual bytes around:', JSON.stringify(c.slice(i, i + 200)));
}

const out = hasCRLF ? c.replace(/\n/g, '\r\n') : c;
fs.writeFileSync(f, out, 'utf8');
console.log('Done.');
