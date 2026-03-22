/* ========================================
   PROGRAM-GENERATOR.JS
   GÃ©nÃ©ration dynamique durÃ©e Ã— niveau Ã— objectif
   Sources : NSCA Guidelines + Schoenfeld 2017
   DÃ©pend de : wger-client.js (globals), storage.js (SW global)
   ======================================== */

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MATRICES DE CONFIGURATION
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

var DURATION_MATRIX = {
  5:  { exCount: 3, series: 2, label: 'Express'   },
  15: { exCount: 4, series: 2, label: 'Court'      },
  30: { exCount: 5, series: 3, label: 'Standard'   },
  45: { exCount: 6, series: 3, label: 'Complet'    },
  60: { exCount: 7, series: 4, label: 'Long'       },
  90: { exCount: 9, series: 4, label: 'Endurance'  },
};

var LEVEL_MATRIX = {
  debutant: {
    repsMin: 12, repsMax: 15, reposMin: 90, reposMax: 120,
    intensite: 0.6, supersets: false, tempoDesc: '3-0-1',
    note: 'Amplitude complÃ¨te, technique prioritaire'
  },
  novice: {
    repsMin: 10, repsMax: 12, reposMin: 75, reposMax: 90,
    intensite: 0.7, supersets: false, tempoDesc: '2-0-1',
    note: 'Commencer Ã  ajouter de la rÃ©sistance'
  },
  intermediaire: {
    repsMin: 8, repsMax: 12, reposMin: 60, reposMax: 90,
    intensite: 0.75, supersets: false, tempoDesc: '2-0-1',
    note: 'Surcharge progressive semaine Ã  semaine'
  },
  avance: {
    repsMin: 6, repsMax: 10, reposMin: 90, reposMax: 120,
    intensite: 0.85, supersets: true, tempoDesc: '3-1-1',
    note: 'Supersets + tempo contrÃ´lÃ©'
  },
  elite: {
    repsMin: 3, repsMax: 6, reposMin: 120, reposMax: 180,
    intensite: 0.95, supersets: true, tempoDesc: '4-2-1',
    note: 'Force maximale, longue rÃ©cupÃ©ration'
  }
};

var OBJECTIF_MATRIX = {
  force: {
    repsOverride: [3, 6], reposOverride: 180, seriesBonus: 1,
    label: 'Force', priorite: 'lourd, peu de reps, long repos'
  },
  hypertrophie: {
    repsOverride: [8, 12], reposOverride: 75, seriesBonus: 0,
    label: 'Hypertrophie', priorite: 'volume modÃ©rÃ©, repos modÃ©rÃ©'
  },
  endurance: {
    repsOverride: [15, 25], reposOverride: 45, seriesBonus: -1,
    label: 'Endurance', priorite: 'beaucoup de reps, peu de repos'
  },
  street_workout: {
    repsOverride: null, reposOverride: null, seriesBonus: 0,
    label: 'Street Workout', priorite: 'Ã©quilibre push/pull/skills'
  }
};

/* â”€â”€ Types de sÃ©ances (global pour programme.js) â”€â”€ */
var SESSION_TYPES = {
  FULL_BODY: { id: 'full_body', label: 'Full Body',     icon: 'ðŸ”„' },
  UPPER:     { id: 'upper',    label: 'Haut du corps',  icon: 'ðŸ’ª' },
  LOWER:     { id: 'lower',    label: 'Bas du corps',   icon: 'ðŸ¦µ' },
  PUSH:      { id: 'push',     label: 'Push',           icon: 'â¬†ï¸' },
  PULL:      { id: 'pull',     label: 'Pull',           icon: 'â¬‡ï¸' },
  SKILLS:    { id: 'skills',   label: 'Skills SW',      icon: 'ðŸ¤¸' },
  CORE:      { id: 'core',     label: 'Core / Abdos',   icon: 'ðŸŽ¯' }
};

/* â”€â”€ Configuration par niveau â€” alias legacy â”€â”€ */
var LEVEL_CONFIG = LEVEL_MATRIX;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BASE DE DONNÃ‰ES EXERCICES SW STATIQUES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

var SW_EXERCISES_DB = {
  pull: [
    { id:'australian_row',  nom:'RangÃ©e australienne',      muscles:['Grand dorsal','TrapÃ¨ze'],            niveau:'debutant',      points:1 },
    { id:'tractions',       nom:'Tractions (Pull-up)',       muscles:['Grand dorsal','Biceps'],             niveau:'novice',        points:2 },
    { id:'chin_up',         nom:'Chin-up (supination)',      muscles:['Grand dorsal','Biceps','Pectoral'],  niveau:'novice',        points:2 },
    { id:'archer_pullup',   nom:'Traction archer',           muscles:['Grand dorsal','Biceps'],             niveau:'intermediaire', points:3 },
    { id:'weighted_pullup', nom:'Traction lestÃ©e',           muscles:['Grand dorsal','Biceps'],             niveau:'avance',        points:4 },
    { id:'muscle_up',       nom:'Muscle-up',                 muscles:['Grand dorsal','Triceps','Pectoral'], niveau:'avance',        points:5 },
    { id:'front_lever',     nom:'Front Lever (maintien)',    muscles:['Grand dorsal','Abdos'],              niveau:'avance',        points:5 },
  ],
  push: [
    { id:'knee_pushup',     nom:'Pompes sur genoux',         muscles:['Pectoral','Triceps'],                niveau:'debutant',      points:1 },
    { id:'pompes',          nom:'Pompes strictes',           muscles:['Pectoral','Triceps','DeltoÃ¯de'],     niveau:'debutant',      points:2 },
    { id:'diamond_pushup',  nom:'Pompes diamant',            muscles:['Triceps','Pectoral'],                niveau:'novice',        points:2 },
    { id:'dips',            nom:'Dips',                      muscles:['Triceps','Pectoral','DeltoÃ¯de'],     niveau:'novice',        points:3 },
    { id:'pike_pushup',     nom:'Pike Push-up',              muscles:['DeltoÃ¯de','Triceps'],                niveau:'intermediaire', points:3 },
    { id:'hspu',            nom:'Handstand Push-up (HSPU)',  muscles:['DeltoÃ¯de','Triceps'],                niveau:'elite',         points:5 },
  ],
  legs: [
    { id:'squat',           nom:'Squat',                     muscles:['Quadriceps','Fessiers'],             niveau:'debutant',      points:1 },
    { id:'lunge',           nom:'Fentes',                    muscles:['Quadriceps','Fessiers'],             niveau:'debutant',      points:1 },
    { id:'jump_squat',      nom:'Jump Squat',                muscles:['Quadriceps','Mollets'],              niveau:'novice',        points:2 },
    { id:'bulgarian',       nom:'Bulgarian Split Squat',     muscles:['Quadriceps','Fessiers'],             niveau:'intermediaire', points:3 },
    { id:'pistol_squat',    nom:'Pistol Squat',              muscles:['Quadriceps','Fessiers','Ã‰quilibre'], niveau:'avance',        points:5 },
  ],
  core: [
    { id:'plank',           nom:'Gainage planche',           muscles:['Core complet'],                     niveau:'debutant',      points:1 },
    { id:'hollow_body',     nom:'Hollow Body Hold',          muscles:['Abdos','Lombaires'],                niveau:'debutant',      points:2 },
    { id:'l_sit',           nom:'L-sit',                     muscles:['Abdos','Hip flexors'],              niveau:'intermediaire', points:4 },
    { id:'dragon_flag',     nom:'Dragon Flag',               muscles:['Abdos complets'],                   niveau:'avance',        points:5 },
  ],
  skills: [
    { id:'handstand',       nom:'Handstand',                 muscles:['DeltoÃ¯de','Core'],                  niveau:'avance',        points:5 },
    { id:'back_lever',      nom:'Back Lever',                muscles:['Grand dorsal','Triceps'],           niveau:'avance',        points:5 },
  ],
};

/* Alias legacy */
var SW_EXERCISES = SW_EXERCISES_DB;

/* â”€â”€ Normaliser le niveau depuis Supabase â”€â”€ */
function _normalizeNiveau(raw) {
  var map = {
    '\u00c9lite': 'elite', 'Elite': 'elite',
    'Avanc\u00e9': 'avance', 'Avance': 'avance', 'AvancÃ©': 'avance',
    'Interm\u00e9diaire': 'intermediaire', 'Intermediaire': 'intermediaire', 'IntermÃ©diaire': 'intermediaire',
    'Novice': 'novice',
    'D\u00e9butant': 'debutant', 'Debutant': 'debutant', 'DÃ©butant': 'debutant'
  };
  if (!raw) return 'debutant';
  return map[raw] || raw.toLowerCase() || 'debutant';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SÃ‰LECTION INTELLIGENTE â€” mÃ©lange dÃ©terministe par date
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function _seededShuffle(arr, seed) {
  var a = arr.slice();
  var s = seed >>> 0;
  for (var i = a.length - 1; i > 0; i--) {
    s = ((s * 1664525) + 1013904223) >>> 0;
    var j = s % (i + 1);
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function _getTodaySeed() {
  var d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function _selectByLevel(pool, niveau, count) {
  var ORDER = ['debutant','novice','intermediaire','avance','elite'];
  var idx   = ORDER.indexOf(niveau);
  var accessible = pool.filter(function(e) {
    return ORDER.indexOf(e.niveau) <= idx + 1;
  });
  var shuffled = _seededShuffle(accessible, _getTodaySeed());
  return shuffled.slice(0, count);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONSTRUCTION EXERCICES PAR TYPE DE SÃ‰ANCE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

async function _buildExercisesForType(sessionType, niveau, count) {
  var wgerPool = [];

  try {
    if (typeof getExercisesByCategory === 'function' && typeof WGER_CATEGORIES !== 'undefined') {
      var catIds = [];
      if      (sessionType === 'pull')               catIds = [WGER_CATEGORIES.BACK, WGER_CATEGORIES.ARMS];
      else if (sessionType === 'push')               catIds = [WGER_CATEGORIES.CHEST, WGER_CATEGORIES.SHOULDERS];
      else if (sessionType === 'lower' || sessionType === 'legs') catIds = [WGER_CATEGORIES.LEGS];
      else if (sessionType === 'upper')              catIds = [WGER_CATEGORIES.BACK, WGER_CATEGORIES.CHEST, WGER_CATEGORIES.SHOULDERS];
      else if (sessionType === 'full_body')          catIds = [WGER_CATEGORIES.BACK, WGER_CATEGORIES.CHEST, WGER_CATEGORIES.LEGS, WGER_CATEGORIES.ABS];
      else if (sessionType === 'core')               catIds = [WGER_CATEGORIES.ABS];

      if (catIds.length) {
        var results = await Promise.allSettled(catIds.map(function(id) { return getExercisesByCategory(id, 15); }));
        results.forEach(function(r) {
          if (r.status !== 'fulfilled') return;
          (r.value || []).forEach(function(ex) {
            var t = null;
            if (ex.translations) {
              for (var i = 0; i < ex.translations.length; i++) {
                if (ex.translations[i].language === 2) { t = ex.translations[i]; break; }
              }
              if (!t && ex.translations.length) t = ex.translations[0];
            }
            var name = (t && t.name) || ex.name || '';
            if (name && name !== 'Exercice') {
              wgerPool.push({
                id: 'wger_' + ex.id,
                nom: name,
                muscles: (ex.muscles || []).map(function(m) { return m.name_en || m.name; }),
                niveau: 'novice',
                points: 2,
                source: 'wger',
                wger_id: ex.id,
              });
            }
          });
        });
      }
    }
  } catch(e) {
    console.warn('Wger unavailable, using SW_EXERCISES_DB:', e.message);
  }

  var swMap = {
    pull:      SW_EXERCISES_DB.pull,
    push:      SW_EXERCISES_DB.push,
    lower:     SW_EXERCISES_DB.legs,
    legs:      SW_EXERCISES_DB.legs,
    upper:     SW_EXERCISES_DB.pull.concat(SW_EXERCISES_DB.push),
    full_body: SW_EXERCISES_DB.pull.slice(0,3).concat(SW_EXERCISES_DB.push.slice(0,3), SW_EXERCISES_DB.legs.slice(0,2), SW_EXERCISES_DB.core.slice(0,2)),
    skills:    SW_EXERCISES_DB.skills.concat(SW_EXERCISES_DB.pull.filter(function(e){ return e.niveau === 'avance' || e.niveau === 'elite'; })),
    core:      SW_EXERCISES_DB.core,
  };
  var swPool = swMap[sessionType] || SW_EXERCISES_DB.pull;
  var combined = swPool.concat(wgerPool);
  return _selectByLevel(combined, niveau, count);
}

/* â”€â”€ Ã‰chauffement contextuel â”€â”€ */
function _buildWarmup(sessionType, niveau) {
  var warmups = {
    pull: [
      { nom:'Suspension passive barre', duree:'30s',    desc:'DÃ©compresser les Ã©paules' },
      { nom:'Rotations Ã©paules',        duree:'60s',    desc:'10 rotations avant + arriÃ¨re' },
      { nom:'RangÃ©e australienne lÃ©gÃ¨re', duree:'8 reps', desc:'Ã‰chauffement grand dorsal' },
    ],
    push: [
      { nom:'Rotations poignets',       duree:'60s',    desc:'10 rotations dans chaque sens' },
      { nom:'Pompes lentes',            duree:'10 reps', desc:'Amplitude complÃ¨te, tempo 3-0-3' },
      { nom:'Pike push-up',             duree:'8 reps',  desc:'Activer les deltoÃ¯des' },
    ],
    lower: [
      { nom:'Jumping jacks',            duree:'60s',    desc:'Ã‰lever la tempÃ©rature corporelle' },
      { nom:'Leg swings',               duree:'30s',    desc:'10 balancements par jambe' },
      { nom:'Squats lents',             duree:'10 reps', desc:'Amplitude complÃ¨te' },
    ],
    legs: [
      { nom:'Jumping jacks',            duree:'60s',    desc:'Ã‰lever la tempÃ©rature corporelle' },
      { nom:'Leg swings',               duree:'30s',    desc:'10 balancements par jambe' },
      { nom:'Squats lents',             duree:'10 reps', desc:'Amplitude complÃ¨te' },
    ],
  };
  var def = [
    { nom:'Jumping jacks',              duree: niveau === 'elite' ? '90s' : '60s', desc:'Activer le systÃ¨me cardiovasculaire' },
    { nom:'Rotations articulaires',     duree:'2 min',  desc:'Ã‰paules â†’ poignets â†’ hanches â†’ chevilles' },
    { nom:'Gainage planche',            duree:'30s',    desc:'Activer le core' },
  ];
  return warmups[sessionType] || def;
}

/* â”€â”€ Retour au calme â”€â”€ */
function _buildCooldown() {
  return [
    { nom:'Ã‰tirement grand dorsal',  duree:'30s',      desc:'Bras tendu au-dessus, pencher latÃ©ralement' },
    { nom:'Ã‰tirement pectoral',      duree:'30s/cÃ´tÃ©', desc:'Bras en croix contre un mur' },
    { nom:'Respiration 4-4-4',       duree:'1 min',    desc:'4s inspirer, 4s tenir, 4s expirer' },
  ];
}

/* â”€â”€ DurÃ©e estimÃ©e â”€â”€ */
function _estimateDuration(count, series, repos) {
  var workTime = count * series * 40;
  var restTime = count * series * repos;
  var total = Math.round((workTime + restTime + 600) / 60);
  return total + '\u2013' + (total + 10) + ' min';
}

/* â”€â”€ Conseil par exercice selon niveau â”€â”€ */
function _getExerciseTip(exerciseId, niveau) {
  var tips = {
    tractions: {
      debutant:      'Commence avec un Ã©lastique. Focus sur la descente lente (3s).',
      novice:        'Vise 3\u00d78 strict. Introduis le lest dÃ¨s 3\u00d710.',
      intermediaire: 'Vise 3\u00d710 lestÃ©s. Quand tu arrives Ã  3\u00d712, ajoute 2.5 kg.',
      avance:        'Travaille les variantes : prise large, neutre, lestÃ©e +20 kg.',
      elite:         'Tractions lestÃ©es + one-arm progressions (archer pull-ups).'
    },
    dips: {
      debutant:      'Poids de corps. Descends jusqu\'aux Ã©paules sous les coudes.',
      novice:        'Vise 3\u00d712. Garde le torse lÃ©gÃ¨rement inclinÃ© vers l\'avant.',
      intermediaire: 'Ajoute 5\u201310 kg. Ring dips pour l\'instabilitÃ©.',
      avance:        'Dips lestÃ©s +20 kg + ring dips.',
      elite:         'Ring dips lestÃ©s + Korean dips pour les coudes.'
    },
    pompes: {
      debutant:      'Corps parfaitement alignÃ©. Pas de fesses en l\'air.',
      novice:        'Pompes dÃ©clinÃ©es pour cibler le pectoral haut.',
      intermediaire: 'Archer push-ups pour prÃ©parer le one-arm.',
      avance:        'One-arm push-up : commence avec les pieds Ã©cartÃ©s.',
      elite:         'Clap push-ups + one-arm pour la puissance maximale.'
    }
  };
  var tip = tips[exerciseId];
  return tip ? (tip[niveau] || '') : '';
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FONCTION PRINCIPALE DE GÃ‰NÃ‰RATION
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

async function generateProgram(sessionTypeOrConfig, userProfile) {
  /* Support deux signatures :
     generateProgram('pull', profile)
     generateProgram({ type, duree, objectif }, profile) */
  var sessionType, dureeMin, objectif;

  if (typeof sessionTypeOrConfig === 'string') {
    sessionType = sessionTypeOrConfig;
    dureeMin    = 45;
    objectif    = 'street_workout';
  } else {
    sessionType = (sessionTypeOrConfig && sessionTypeOrConfig.type)    || 'full_body';
    dureeMin    = parseInt((sessionTypeOrConfig && sessionTypeOrConfig.duree) || 45);
    objectif    = (sessionTypeOrConfig && sessionTypeOrConfig.objectif) || 'street_workout';
  }

  var niveau = _normalizeNiveau(userProfile && userProfile.niveau);

  /* â”€â”€ 1. Configuration durÃ©e â”€â”€ */
  var dureeKeys = [5, 15, 30, 45, 60, 90];
  var dureeKey = dureeKeys.reduce(function(prev, curr) {
    return Math.abs(curr - dureeMin) < Math.abs(prev - dureeMin) ? curr : prev;
  });
  var durationCfg = DURATION_MATRIX[dureeKey];

  /* â”€â”€ 2. Configuration niveau â”€â”€ */
  var levelCfg = LEVEL_MATRIX[niveau] || LEVEL_MATRIX.debutant;

  /* â”€â”€ 3. Overrides objectif â”€â”€ */
  var objCfg     = OBJECTIF_MATRIX[objectif] || OBJECTIF_MATRIX.street_workout;
  var finalSeries = Math.max(1, durationCfg.series + (objCfg.seriesBonus || 0));
  var finalReps   = objCfg.repsOverride
    ? objCfg.repsOverride[0] + '\u2013' + objCfg.repsOverride[1]
    : levelCfg.repsMin + '\u2013' + levelCfg.repsMax;
  var finalRepos  = objCfg.reposOverride || levelCfg.reposMin;
  var finalCount  = durationCfg.exCount;

  /* â”€â”€ 4. SÃ©lectionner exercices â”€â”€ */
  var exercises = [];
  try {
    exercises = await _buildExercisesForType(sessionType, niveau, finalCount + 3);
  } catch(err) {
    console.warn('GÃ©nÃ©ration exercices failed, fallback SW_DB:', err.message);
    var fbMap = {
      pull:'pull', push:'push', lower:'legs', legs:'legs',
      upper:'pull', full_body:'pull', skills:'skills', core:'core'
    };
    exercises = (SW_EXERCISES_DB[fbMap[sessionType] || 'pull'] || SW_EXERCISES_DB.pull).slice();
  }

  /* â”€â”€ 5. Formatter exercices â”€â”€ */
  var exercicesFormatted = exercises.slice(0, finalCount).map(function(ex, i) {
    var isSuperset = levelCfg.supersets && i % 2 === 1;
    return Object.assign({}, ex, {
      series:        finalSeries,
      reps:          finalReps,
      repos:         isSuperset ? 0 : finalRepos,
      tempo:         levelCfg.tempoDesc,
      superset_with: isSuperset && exercises[i - 1] ? exercises[i - 1].nom : null,
      notes:         ex.notes || _getExerciseTip(ex.id, niveau) || levelCfg.note,
    });
  });

  /* â”€â”€ 6. LibellÃ© type de sÃ©ance â”€â”€ */
  var SESSION_LABELS = {
    pull:'Pull', push:'Push', legs:'Legs', lower:'Bas du corps',
    upper:'Haut du corps', full_body:'Full Body', skills:'Skills SW', core:'Core / Abdos'
  };

  return {
    type:            sessionType,
    nom:             SESSION_LABELS[sessionType] || sessionType,
    niveau:          niveau,
    objectif:        objectif,
    objectif_label:  objCfg.label,
    duree_min:       dureeMin,
    label_duree:     durationCfg.label,
    date:            new Date().toISOString().slice(0, 10),
    config:          { series: finalSeries, reps: finalReps, repos: finalRepos },
    echauffement:    _buildWarmup(sessionType, niveau),
    exercices:       exercicesFormatted,
    retour_au_calme: _buildCooldown(),
    duree_estimee:   _estimateDuration(finalCount, finalSeries, finalRepos),
    seed:            _getTodaySeed(),
  };
}

/* â”€â”€ Sauvegarder le programme gÃ©nÃ©rÃ© â”€â”€ */
function saveGeneratedProgram(program) {
  if (typeof SW === 'undefined') return;
  var programs = SW.load('generated_programs') || [];
  var filtered = programs.filter(function(p) {
    return !(p.type === program.type && p.date === program.date);
  });
  filtered.unshift(Object.assign({}, program, { id: Date.now() }));
  SW.save('generated_programs', filtered.slice(0, 10));
}

