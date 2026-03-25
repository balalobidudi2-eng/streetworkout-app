$file = "C:\Users\Admin\streetworkout-app\js\api.js"
$c = Get-Content -Raw $file -Encoding UTF8

# ── 1. Replace skill obligations builder ──────────────────────────────────────
$old1 = "    /* Build skill obligations */
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
          '\n\u26a0\ufe0f OBLIGATION ABSOLUE — Ces exercices DOIVENT appara\u00eetre dans le programme :\n' +
          exObligatoires.join('\n') + '\n';
      }
    }"

$new1 = "    /* Build skill obligations using level-aware exercise selection */
    var skillsText = '';
    var skillObligations = '';
    if (profil.skills && profil.skills.length > 0) {
      skillsText = profil.skills.join(', ');
      var tierLabels = { debutant: 'D\u00c9BUTANT', intermediaire: 'INTERM\u00c9DIAIRE', avance: 'AVANC\u00c9' };
      var skillExercisesForPrompt = selectSkillExercises(profil.skills, profil.testDetail);
      var skillAnalysisLines = profil.skills.map(function(skill) {
        var tier = getSkillTier(skill, profil.testDetail || {});
        return '  \u2192 ' + skill + ' : niveau ' + (tierLabels[tier] || tier) + ' \u2014 prescrire les progressions de ce niveau';
      });
      var exObligatoires = skillExercisesForPrompt.slice(0, profil.skills.length * 2).map(function(ex) {
        return '  - [' + ex.skill.toUpperCase() + '] ' + ex.nom + ' (' + ex.series + 'x' + ex.reps + ', repos: ' + ex.repos + ')';
      });
      if (exObligatoires.length > 0) {
        skillObligations =
          '\n\ud83c\udfaf ANALYSE NIVEAUX SKILLS :\n' + skillAnalysisLines.join('\n') + '\n' +
          '\n\u26a0\ufe0f EXERCICES DE PROGRESSION OBLIGATOIRES (au moins 2 par s\u00e9ance) :\n' +
          exObligatoires.join('\n') + '\n';
      }
    }"

if ($c.Contains($old1)) { $c = $c.Replace($old1, $new1); Write-Host "1) skillObligations OK" }
else { Write-Host "1) skillObligations NOT FOUND" }

# ── 2. Replace testContext builder ────────────────────────────────────────────
$old2 = "    /* Test scores pour personnalisation */
    var testContext = '';
    if (profil.testScore) {
      testContext = '\n\ud83e\uddea TEST DE NIVEAU : score ' + profil.testScore + '/100';
      if (profil.testDetail) {
        var details = profil.testDetail;
        if (details.tractions) testContext += ' | ' + details.tractions + ' tractions en 60s';
        if (details.dips)      testContext += ' | ' + details.dips      + ' dips en 60s';
        if (details.pompes)    testContext += ' | ' + details.pompes    + ' pompes en 60s';
        if (details.gainage)   testContext += ' | ' + details.gainage   + 's de gainage';
      }
      testContext += '\n  \u2192 Adapter l\u2019intensit\u00e9 pr\u00e9cis\u00e9ment \u00e0 ces performances r\u00e9elles.\n';
    }"

$new2 = "    /* Performances réelles pour calibrage précis de l'IA */
    var testContext = '';
    if (profil.testScore || profil.testDetail) {
      var _td = profil.testDetail || {};
      testContext = '\n\ud83e\uddea PERFORMANCES R\u00c9ELLES MESUR\u00c9ES :\n';
      if (profil.testScore)  testContext += '  Score global : ' + profil.testScore + '/100\n';
      if (_td.tractions) testContext += '  - Tractions max (60s) : ' + _td.tractions + ' reps \u2192 calibre les charges et progressions de traction\n';
      if (_td.dips)      testContext += '  - Dips max (60s) : '      + _td.dips     + ' reps \u2192 calibre les dips et pousses\n';
      if (_td.pompes)    testContext += '  - Pompes max (60s) : '    + _td.pompes   + ' reps \u2192 calibre l\u2019endurance de poussee\n';
      if (_td.gainage)   testContext += '  - Gainage max : '         + _td.gainage  + 's \u2192 calibre le core et les skills isometriques\n';
      testContext += '  \u26a0\ufe0f N\u2019indique JAMAIS une charge ou rep superieure a ces performances mesur\u00e9es.\n';
    }"

if ($c.Contains($old2)) { $c = $c.Replace($old2, $new2); Write-Host "2) testContext OK" }
else { Write-Host "2) testContext NOT FOUND — trying emoji variant"
  # try with the actual emoji character
  $old2b = "    /* Test scores pour personnalisation */
    var testContext = '';
    if (profil.testScore) {"
  if ($c.Contains($old2b)) { Write-Host "  Found start of testContext block" }
}

# ── 3. Replace systemPrompt ───────────────────────────────────────────────────
$old3 = "    var systemPrompt =
      'Tu es un coach de street workout expert et sp\u00e9cialiste en calisthenics. ' +
      'Tu g\u00e9n\u00e8res des programmes ultra-personnalis\u00e9s et progressifs. ' +
      'Tu ma\u00eetrises les progressions pour muscle-up, front lever, handstand, planche, dragon flag, l-sit, back lever, human flag. ' +
      'Quand des skills sont demand\u00e9s, tu DOIS inclure les exercices de progression sp\u00e9cifiques \u00e0 ces skills. ' +"

$new3 = "    var systemPrompt =
      'Tu es un coach de street workout expert et sp\u00e9cialiste en calisthenics et entra\u00eenement fonctionnel. ' +
      'R\u00c8GLES ABSOLUES : ' +
      '(1) FILTRAGE MAT\u00c9RIEL : n\u2019utilise JAMAIS un exercice n\u00e9cessitant du mat\u00e9riel absent du lieu indiqu\u00e9. ' +
      '(2) OBJECTIF FORCE \u2192 z\u00e9ro cardio (burpees, mountain climbers, jumping jacks, sauts interdits). S\u00e9ries 3\u20136 reps. ' +
      '(3) NIVEAUX SKILLS : prescris exactement le niveau d\u00e9taill\u00e9 dans l\u2019analyse (D\u00c9BUTANT/INTERM\u00c9DIAIRE/AVANC\u00c9). ' +
      '(4) CHARGES R\u00c9ALISTES : n\u2019indique jamais une charge ou reps sup\u00e9rieure aux performances mesur\u00e9es. ' +
      '(5) CHAMP skill : pour chaque exercice ciblant un skill sp\u00e9cifique, mets son nom dans `'`"skill`"`'` (ex: `'`"muscle-up`"`'), sinon `'`"null`"`'. ' +"

if ($c.Contains($old3)) { $c = $c.Replace($old3, $new3); Write-Host "3) systemPrompt OK" }
else { Write-Host "3) systemPrompt NOT FOUND — trying fallback"
  # Try a smaller anchor
  $old3b = "    var systemPrompt =
      'Tu es un coach de street workout expert et sp"
  if ($c.Contains($old3b)) { Write-Host "  Found systemPrompt start" }
}

# ── 4. Add "skill" field to JSON format example ───────────────────────────────
$old4 = '          "conseil": "..."\n' + "        }\n"
$new4 = '          "conseil": "...",\n' + '          "skill": "muscle-up"\n' + "        }\n"

if ($c.Contains($old4)) { $c = $c.Replace($old4, $new4); Write-Host "4) JSON skill field OK" }
else { Write-Host "4) JSON skill field NOT FOUND" }

# ── 5. Replace generateFallback skillExs builder ─────────────────────────────
$old5 = "    /* Build mandatory skill exercises */
    var skillExs = [];
    skills.forEach(function(skill) {
      var exs = SKILL_EXERCISES[skill];
      if (exs) exs.forEach(function(ex) {
        skillExs.push({ nom: ex.nom, series: ex.series, reps: ex.reps, repos: ex.repos, conseil: ex.conseil });
      });
    });"

$new5 = "    /* Build mandatory skill exercises at the right progression level */
    var skillExs = selectSkillExercises(skills, profil.testDetail);"

if ($c.Contains($old5)) { $c = $c.Replace($old5, $new5); Write-Host "5) generateFallback skillExs OK" }
else { Write-Host "5) generateFallback NOT FOUND" }

[System.IO.File]::WriteAllText($file, $c, [System.Text.Encoding]::UTF8)
Write-Host "File saved."
