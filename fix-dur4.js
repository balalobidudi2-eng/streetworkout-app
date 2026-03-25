const fs = require('fs');
const f = 'js/api.js';
let c = fs.readFileSync(f, 'utf8');
const hasCRLF = c.includes('\r\n');
if (hasCRLF) c = c.replace(/\r\n/g, '\n');

// Use regex to match regardless of apostrophe style
const old1 = /\/\* Nombre d.exercices selon dur.e \*\/\n    var nbExercices = [^\n]+;/;

if (old1.test(c)) {
  c = c.replace(old1,
    "/* Nombre d\u2019exercices selon dur\u00e9e + structure en blocs */\n" +
    "    var nbExercices = dureeMin <= 30 ? 4 : dureeMin <= 60 ? 6 : dureeMin <= 90 ? 8 : 10;\n" +
    "    var seanceStructure = dureeMin <= 45\n" +
    "      ? 'Bloc unique : ' + nbExercices + ' exercices'\n" +
    "      : dureeMin <= 60\n" +
    "        ? 'Bloc 1 Skills+Force (25 min) | Bloc 2 Assistance (20 min) | Bloc 3 Core (15 min)'\n" +
    "        : dureeMin <= 90\n" +
    "          ? 'Bloc 1 Skill/Technique (20 min) | Bloc 2 Force (35 min) | Bloc 3 Accessoires (20 min) | Bloc 4 Core+Finisher (15 min)'\n" +
    "          : 'Bloc 1 Skill (25 min) | Bloc 2 Force (40 min) | Bloc 3 Hypertrophie (30 min) | Bloc 4 Core+Finisher (25 min)';"
  );
  console.log('OK: nbExercices');
} else {
  console.log('NOT FOUND: nbExercices regex');
}

const out = hasCRLF ? c.replace(/\n/g, '\r\n') : c;
fs.writeFileSync(f, out, 'utf8');
console.log('Done.');
