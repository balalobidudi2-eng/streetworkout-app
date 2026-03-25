const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'js', 'api.js');
let raw = fs.readFileSync(file, 'utf8');
const hasCRLF = raw.includes('\r\n');
let c = raw.replace(/\r\n/g, '\n');  // normalize to LF for searching
let changes = 0;

function rep(old, neo) {
  if (c.includes(old)) { c = c.split(old).join(neo); changes++; return true; }
  console.log('NOT FOUND:', old.slice(0, 60));
  return false;
}

// ── 1. Skill obligations builder ─────────────────────────────────────────────
rep(
`    /* Build skill obligations */
    var skillsText = '';
    var skillObligations = '';
    if (profil.skills && profil.skills.length > 0) {
      skillsText = profil.skills.join(', ');
      var exObligatoires = [];
      profil.skills.forEach(function(skill) {
        var exs = SKILL_EXERCISES[skill];
        if (exs) {
          exs.slice(0, 2).forEach(function(ex) {
            exObligatoires.push('  - ' + ex.nom + ' (' + ex.series + 'x' + ex.reps + ', repos: ' + ex.repos + ')');
          });
        }
      });
      if (exObligatoires.length > 0) {
        skillObligations =
          '\\n\\u26a0\\ufe0f OBLIGATION ABSOLUE \u2014 Ces exercices DOIVENT appara\u00eetre dans le programme :\\n' +
          exObligatoires.join('\\n') + '\\n';
      }
    }`,
`    /* Build skill obligations using level-aware exercise selection */
    var skillsText = '';
    var skillObligations = '';
    if (profil.skills && profil.skills.length > 0) {
      skillsText = profil.skills.join(', ');
      var tierLabels = { debutant: 'D\u00c9BUTANT', intermediaire: 'INTERM\u00c9DIAIRE', avance: 'AVANC\u00c9' };
      var skillExercisesForPrompt = selectSkillExercises(profil.skills, profil.testDetail);
      var skillAnalysisLines = profil.skills.map(function(skill) {
        var tier = getSkillTier(skill, profil.testDetail || {});
        return '  \\u2192 ' + skill + ' : niveau ' + (tierLabels[tier] || tier) + ' \\u2014 prescrire les progressions de ce niveau';
      });
      var exObligatoires = skillExercisesForPrompt.slice(0, profil.skills.length * 2).map(function(ex) {
        return '  - [' + ex.skill.toUpperCase() + '] ' + ex.nom + ' (' + ex.series + 'x' + ex.reps + ', repos: ' + ex.repos + ')';
      });
      if (exObligatoires.length > 0) {
        skillObligations =
          '\\n\\ud83c\\udfaf ANALYSE NIVEAUX SKILLS :\\n' + skillAnalysisLines.join('\\n') + '\\n' +
          '\\n\\u26a0\\ufe0f EXERCICES DE PROGRESSION OBLIGATOIRES (au moins 2 par s\u00e9ance) :\\n' +
          exObligatoires.join('\\n') + '\\n';
      }
    }`
);

// ── 2. testContext builder ──────────────────────────────────────────────────
// Find the testContext block and replace
const testCtxStart = '    /* Test scores pour personnalisation */';
const testCtxEnd = "      testContext += '\\n  \\u2192 Adapter l\\u2019intensit\\u00e9 pr\\u00e9cis\\u00e9ment \\u00e0 ces performances r\\u00e9elles.\\n';\n    }";
const idx1 = c.indexOf(testCtxStart);
const idx2 = c.indexOf(testCtxEnd);
if (idx1 !== -1 && idx2 !== -1) {
  const newTestCtx = `    /* Performances mesurées pour calibrage précis de l'IA */
    var testContext = '';
    if (profil.testScore || profil.testDetail) {
      var _td = profil.testDetail || {};
      testContext = '\\n\\ud83e\\uddea PERFORMANCES R\\u00c9ELLES MESUR\\u00c9ES :\\n';
      if (profil.testScore)  testContext += '  Score global : ' + profil.testScore + '/100\\n';
      if (_td.tractions) testContext += '  - Tractions max (60s) : ' + _td.tractions + ' reps \\u2192 calibre les charges de traction\\n';
      if (_td.dips)      testContext += '  - Dips max (60s) : '      + _td.dips     + ' reps \\u2192 calibre les dips et pousses\\n';
      if (_td.pompes)    testContext += '  - Pompes max (60s) : '    + _td.pompes   + ' reps \\u2192 calibre l\\u2019endurance de poussee\\n';
      if (_td.gainage)   testContext += '  - Gainage max : '         + _td.gainage  + 's \\u2192 calibre le core et skills isometriques\\n';
      testContext += '  \\u26a0\\ufe0f N\\u2019indique JAMAIS une charge sup\\u00e9rieure aux performances mesur\\u00e9es.\\n';
    }`;
  c = c.slice(0, idx1) + newTestCtx + c.slice(idx2 + testCtxEnd.length);
  changes++;
  console.log('2) testContext OK');
} else {
  console.log('2) testContext NOT FOUND idx1=' + idx1 + ' idx2=' + idx2);
}

// ── 3. systemPrompt (replace the old 6-line version) ────────────────────────
const spStart = "    var systemPrompt =\n      'Tu es un coach de street workout expert";
const spEnd   = "      'R\\u00e9ponds UNIQUEMENT en JSON valide, aucun texte en dehors du JSON.';";
const si1 = c.indexOf(spStart);
const si2 = c.indexOf(spEnd);
if (si1 !== -1 && si2 !== -1) {
  const newSP = `    var systemPrompt =
      'Tu es un coach de street workout expert et sp\\u00e9cialiste en calisthenics et entra\\u00eenement fonctionnel. ' +
      'R\\u00c8GLES ABSOLUES : ' +
      '(1) FILTRAGE MAT\\u00c9RIEL : n\\u2019utilise JAMAIS un exercice n\\u00e9cessitant du mat\\u00e9riel absent du lieu indiqu\\u00e9. ' +
      '(2) OBJECTIF FORCE \\u2192 z\\u00e9ro cardio (burpees, mountain climbers, jumping jacks, sauts interdits). S\\u00e9ries 3\\u20136 reps uniquement. ' +
      '(3) NIVEAUX SKILLS : prescris exactement le niveau d\\u00e9taill\\u00e9 dans l\\u2019analyse (D\\u00c9BUTANT/INTERM\\u00c9DIAIRE/AVANC\\u00c9). Ne pas r\\u00e9p\\u00e9ter exactement les m\\u00eames exercices chaque s\\u00e9ance. ' +
      '(4) CHARGES R\\u00c9ALISTES : n\\u2019indique jamais une charge ou reps sup\\u00e9rieure aux performances mesur\\u00e9es. ' +
      '(5) CHAMP skill : pour chaque exercice ciblant un skill, mets le nom du skill dans le champ "skill" (ex: "muscle-up"), sinon la valeur "null". ' +
      '(6) DUR\\u00c9E : calibre s\\u00e9ries, reps et repos pour tenir dans la dur\\u00e9e totale indiqu\\u00e9e. ' +
      'R\\u00e9ponds UNIQUEMENT en JSON valide, aucun texte en dehors du JSON.';`;
  c = c.slice(0, si1) + newSP + c.slice(si2 + spEnd.length);
  changes++;
  console.log('3) systemPrompt OK');
} else {
  console.log('3) systemPrompt NOT FOUND si1=' + si1 + ' si2=' + si2);
}

// ── 4. JSON format — add skill field ────────────────────────────────────────
rep(
  `          "conseil": "..."\n        }`,
  `          "conseil": "...",\n          "skill": "muscle-up"\n        }`
);

// ── 5. generateFallback — replace skillExs builder ──────────────────────────
rep(
`    /* Build mandatory skill exercises */
    var skillExs = [];
    skills.forEach(function(skill) {
      var exs = SKILL_EXERCISES[skill];
      if (exs) exs.forEach(function(ex) {
        skillExs.push({ nom: ex.nom, series: ex.series, reps: ex.reps, repos: ex.repos, conseil: ex.conseil });
      });
    });`,
`    /* Build mandatory skill exercises at the right progression level */
    var skillExs = selectSkillExercises(skills, profil.testDetail);`
);

const out = hasCRLF ? c.replace(/\n/g, '\r\n') : c;
fs.writeFileSync(file, out, 'utf8');
console.log('Done. Total changes applied: ' + changes);
