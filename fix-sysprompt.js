const fs = require('fs');
const f = 'js/api.js';
let c = fs.readFileSync(f, 'utf8');
const hasCRLF = c.includes('\r\n');
if (hasCRLF) c = c.replace(/\r\n/g, '\n');

const startMark = "var systemPrompt =\n      'Tu es un coach de street workout expert";
const endMark   = "'R\u00e9ponds UNIQUEMENT en JSON valide, aucun texte en dehors du JSON.';";

const si = c.indexOf(startMark);
const ei = c.indexOf(endMark);
console.log('start:', si, 'end:', ei);

if (si !== -1 && ei !== -1) {
  const eFull = ei + endMark.length;
  const neo = "var systemPrompt =\n" +
    "      'Tu es un coach de street workout expert et sp\u00e9cialiste en calisthenics et entra\u00eenement fonctionnel. ' +\n" +
    "      'R\u00c8GLES ABSOLUES : ' +\n" +
    "      '(1) FILTRAGE MAT\u00c9RIEL : n\u2019utilise JAMAIS un exercice n\u00e9cessitant du mat\u00e9riel absent du lieu indiqu\u00e9. ' +\n" +
    "      '(2) OBJECTIF FORCE \u2192 z\u00e9ro cardio (burpees, mountain climbers, jumping jacks, sauts). S\u00e9ries 3\u20136 reps uniquement. ' +\n" +
    "      '(3) NIVEAUX SKILLS : prescris exactement le niveau d\u00e9taill\u00e9 dans l\u2019analyse (D\u00c9BUTANT/INTERM\u00c9DIAIRE/AVANC\u00c9). ' +\n" +
    "      '(4) CHARGES R\u00c9ALISTES : n\u2019indique jamais une charge ou reps sup\u00e9rieure aux performances mesur\u00e9es de l\u2019utilisateur. ' +\n" +
    "      '(5) CHAMP skill : pour chaque exercice ciblant un skill, mets le nom du skill dans le champ \"skill\" (ex: \"muscle-up\"), sinon \"null\". ' +\n" +
    "      '(6) DUR\u00c9E : calibre s\u00e9ries, reps et repos pour tenir dans la dur\u00e9e totale indiqu\u00e9e. ' +\n" +
    "      'R\u00e9ponds UNIQUEMENT en JSON valide, aucun texte en dehors du JSON.';";
  c = c.slice(0, si) + neo + c.slice(eFull);
  const out = hasCRLF ? c.replace(/\n/g, '\r\n') : c;
  fs.writeFileSync(f, out, 'utf8');
  console.log('systemPrompt replaced OK');
} else {
  console.log('NOT FOUND');
}
