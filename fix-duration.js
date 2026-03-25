const fs = require('fs');
const f = 'js/api.js';
let c = fs.readFileSync(f, 'utf8');
const hasCRLF = c.includes('\r\n');
if (hasCRLF) c = c.replace(/\r\n/g, '\n');

function rep(old, neo, label) {
  if (c.includes(old)) { c = c.split(old).join(neo); console.log('OK:', label); return true; }
  console.log('NOT FOUND:', label, '|', old.slice(0, 50));
  return false;
}

// ── 1. Replace nbExercices (duration → exercise count) with proper blocks ────
rep(
`    /* Nombre d'exercices selon durée */
    var nbExercices = dureeMin <= 30 ? '4–5' : dureeMin <= 60 ? '5–6' : dureeMin <= 90 ? '6–8' : '7–9';`,
`    /* Nombre d'exercices selon durée + structure en blocs */
    var nbExercices = dureeMin <= 30 ? 4 : dureeMin <= 60 ? 6 : dureeMin <= 90 ? 8 : 10;
    var nbExStr = nbExercices + ' exercices';
    /* Structure des blocs selon durée */
    var seanceStructure = dureeMin <= 45
      ? 'Bloc unique : ' + nbExercices + ' exercices complets'
      : dureeMin <= 60
        ? 'Bloc 1 Skills/Force (25 min) + Bloc 2 Assistance (20 min) + Bloc 3 Core (15 min)'
        : dureeMin <= 90
          ? 'Bloc 1 Skill/Technique (20 min) + Bloc 2 Force principale (35 min) + Bloc 3 Accessoires (20 min) + Bloc 4 Core/Finisher (15 min)'
          : 'Bloc 1 Skill (25 min) + Bloc 2 Force (40 min) + Bloc 3 Hypertrophie (30 min) + Bloc 4 Core + Finisher (25 min)';`,
  'nbExercices → blocks'
);

// ── 2. Replace the strict-rules section in userPrompt to include block structure + min exercises ──
rep(
  `      '3. EXACTEMENT ' + nbExercices + ' exercices par s\\u00e9ance — champ duree = "' + dureeMin + ' min"\\n' +`,
  `      '3. EXACTEMENT ' + nbExercices + ' exercices par s\\u00e9ance sur ' + dureeMin + ' min (TOUTES les s\\u00e9ances, pas d\\u2019exception)\\n' +
      '   Structure : ' + seanceStructure + '\\n' +`,
  'strict rules line 3'
);

// ── 3. Replace the "Durée séance" line in userPrompt to show block structure ──
rep(
  `      '- Dur\\u00e9e s\\u00e9ance : ' + dureeMin + ' min \\u2192 ' + nbExercices + ' exercices par s\\u00e9ance\\n' +`,
  `      '- Dur\\u00e9e s\\u00e9ance : ' + dureeMin + ' min \\u2192 EXACTEMENT ' + nbExercices + ' exercices par s\\u00e9ance (CHAQUE jour doit avoir exactement ' + nbExercices + ' exercices)\\n' +`,
  'duree line in userPrompt'
);

// ── 4. Add duration time-calculator to generateFallback ──────────────────────
// Replace the simple perDay calculation with real time tracking
rep(
`    var dur      = profil.dureeSeance || 60;
    var perDay   = dur <= 30 ? 4 : dur <= 60 ? 5 : dur <= 90 ? 7 : 8;`,
`    var dur      = profil.dureeSeance || 60;
    /* Min exercises to guarantee target duration is met */
    var perDay   = dur <= 30 ? 4 : dur <= 60 ? 6 : dur <= 90 ? 8 : 10;

    /* Parse a reps/time string into an average duration in seconds */
    function parseDuration(repsStr, series) {
      var r = String(repsStr);
      /* isometric hold: "20-30 sec", "10 sec", "5-8 sec" */
      var secMatch = r.match(/(\\d+)(?:-(\\d+))?\\s*sec/i);
      if (secMatch) {
        var avg = secMatch[2] ? (parseInt(secMatch[1]) + parseInt(secMatch[2])) / 2 : parseInt(secMatch[1]);
        return series * avg;
      }
      /* reps range: "8-10", "4-6", "3-5" */
      var repMatch = r.match(/(\\d+)(?:-(\\d+))?/);
      if (repMatch) {
        var avgRep = repMatch[2] ? (parseInt(repMatch[1]) + parseInt(repMatch[2])) / 2 : parseInt(repMatch[1]);
        return series * avgRep * 4; /* ~4 sec/rep average */
      }
      return series * 10 * 3; /* fallback: 3 reps × 10s */
    }

    /* Calculate total time in seconds for a list of exercises */
    function calcSeanceTime(exList) {
      return exList.reduce(function(total, ex) {
        var repsSecs = parseDuration(ex.reps || '10', ex.series || 3);
        var reposSecs = parseInt((ex.repos || '90 sec').replace(/[^0-9]/g, '')) || 90;
        var reposTimes = Math.max(0, (ex.series || 3) - 1);
        return total + repsSecs + reposSecs * reposTimes;
      }, 0);
    }`,
  'perDay + time calculator'
);

// ── 5. Replace the day-building loop to use time-based filling ────────────────
rep(
`    var programme = [];
    var poolIdx = 0;
    for (var d = 0; d < freq; d++) {
      var dayExs = [];
      if (skillExs.length > 0) {
        var sk = (d * 2) % skillExs.length;
        for (var s2 = 0; s2 < 2 && dayExs.length < perDay; s2++) dayExs.push(skillExs[(sk + s2) % skillExs.length]);
      }
      while (dayExs.length < perDay && poolIdx < qPool.length) {
        var sc = scheme();
        dayExs.push({ nom: applyLeste(qPool[poolIdx++]), series: sc.s, reps: sc.r, repos: sc.p, conseil: '' });
      }
      programme.push({ jour: jours[d], type: dayTypes[d % dayTypes.length], duree: '~' + dur + ' min', exercices: dayExs });
    }`,
`    var targetSecs = dur * 60;
    var slackSecs  = 5 * 60; /* ±5 min tolerance */

    var programme = [];
    for (var d = 0; d < freq; d++) {
      var dayExs = [];
      /* Rotate skill exercises per day so each session has different ones */
      if (skillExs.length > 0) {
        var sk = (d * 2) % skillExs.length;
        for (var s2 = 0; s2 < 2 && dayExs.length < perDay; s2++) {
          dayExs.push(skillExs[(sk + s2) % skillExs.length]);
        }
      }
      /* Fill with pool exercises — each day gets its own offset for variety */
      var dayPoolStart = d * perDay;
      var pidx = dayPoolStart % Math.max(qPool.length, 1);
      while (dayExs.length < perDay) {
        var sc = scheme();
        dayExs.push({ nom: applyLeste(qPool[pidx % qPool.length]), series: sc.s, reps: sc.r, repos: sc.p, conseil: '' });
        pidx++;
      }
      /* Time-adjust: add or trim until within target ±5 min */
      var elapsed = calcSeanceTime(dayExs);
      /* If under target, add more exercises */
      var extra = (dayPoolStart + perDay) % Math.max(qPool.length, 1);
      while (elapsed < targetSecs - slackSecs && qPool.length > 0) {
        var sc2 = scheme();
        var ex2 = { nom: applyLeste(qPool[extra % qPool.length]), series: sc2.s, reps: sc2.r, repos: sc2.p, conseil: '' };
        dayExs.push(ex2);
        elapsed += calcSeanceTime([ex2]);
        extra++;
      }
      /* If over target, trim last exercises (but keep minimum 4) */
      while (elapsed > targetSecs + slackSecs && dayExs.length > 4) {
        var removed = dayExs.pop();
        elapsed -= calcSeanceTime([removed]);
      }
      programme.push({ jour: jours[d], type: dayTypes[d % dayTypes.length], duree: '~' + dur + ' min', exercices: dayExs });
    }`,
  'day building loop'
);

const out = hasCRLF ? c.replace(/\n/g, '\r\n') : c;
fs.writeFileSync(f, out, 'utf8');
console.log('Done.');
