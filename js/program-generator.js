/* ========================================
   PROGRAM-GENERATOR.JS
   Génère des programmes basés sur le profil + exercices Wger
   Dépend de : wger-client.js (globals), storage.js (SW global)
   ======================================== */

/* ── Types de séances ── */
var SESSION_TYPES = {
  FULL_BODY: { id: 'full_body', label: 'Full Body',     icon: '🔄' },
  UPPER:     { id: 'upper',    label: 'Haut du corps',  icon: '💪' },
  LOWER:     { id: 'lower',    label: 'Bas du corps',   icon: '🦵' },
  PUSH:      { id: 'push',     label: 'Push',           icon: '⬆️' },
  PULL:      { id: 'pull',     label: 'Pull',           icon: '⬇️' },
  SKILLS:    { id: 'skills',   label: 'Skills SW',      icon: '🤸' },
  CORE:      { id: 'core',     label: 'Core / Abdos',   icon: '🎯' }
};

/* ── Configuration par niveau (NSCA Position Statement 2016) ── */
var LEVEL_CONFIG = {
  debutant:      { series: 2, repsRange: [8, 12],  reposMin:  60, reposMax:  90, exercicesCount: 4, intensite: 'légère' },
  novice:        { series: 3, repsRange: [8, 12],  reposMin:  75, reposMax:  90, exercicesCount: 5, intensite: 'modérée' },
  intermediaire: { series: 3, repsRange: [6, 10],  reposMin:  90, reposMax: 120, exercicesCount: 6, intensite: 'modérée-haute' },
  avance:        { series: 4, repsRange: [5,  8],  reposMin: 120, reposMax: 180, exercicesCount: 6, intensite: 'haute' },
  elite:         { series: 5, repsRange: [3,  6],  reposMin: 180, reposMax: 300, exercicesCount: 7, intensite: 'maximale' }
};

/* ── Exercices SW statiques (complètent Wger pour les mouvements spécifiques) ── */
var SW_EXERCISES = {
  pull: [
    { id: 'tractions',        nom: 'Tractions (Pull-up)',      muscles: ['Grand dorsal', 'Biceps'],              niveau: 'novice' },
    { id: 'chin_up',          nom: 'Chin-up (supination)',     muscles: ['Grand dorsal', 'Biceps', 'Pectoral'],  niveau: 'novice' },
    { id: 'australian_row',   nom: 'Rangée australienne',      muscles: ['Grand dorsal', 'Trapèze'],             niveau: 'debutant' },
    { id: 'muscle_up',        nom: 'Muscle-up',                muscles: ['Grand dorsal', 'Triceps', 'Pectoral'], niveau: 'avance' },
    { id: 'front_lever',      nom: 'Front Lever (maintien)',   muscles: ['Grand dorsal', 'Abdos'],               niveau: 'avance' }
  ],
  push: [
    { id: 'pompes',           nom: 'Pompes strictes',          muscles: ['Pectoral', 'Triceps', 'Deltoïde'],    niveau: 'debutant' },
    { id: 'dips',             nom: 'Dips',                     muscles: ['Triceps', 'Pectoral', 'Deltoïde'],    niveau: 'novice' },
    { id: 'pike_pushup',      nom: 'Pike Push-up',             muscles: ['Deltoïde', 'Triceps'],                niveau: 'novice' },
    { id: 'diamond_pushup',   nom: 'Pompes diamant',           muscles: ['Triceps', 'Pectoral'],                niveau: 'intermediaire' },
    { id: 'hspu',             nom: 'Handstand Push-up',        muscles: ['Deltoïde', 'Triceps'],                niveau: 'elite' }
  ],
  legs: [
    { id: 'squat',            nom: 'Squat',                    muscles: ['Quadriceps', 'Fessiers'],             niveau: 'debutant' },
    { id: 'pistol_squat',     nom: 'Pistol Squat',             muscles: ['Quadriceps', 'Fessiers', 'Équilibre'],niveau: 'avance' },
    { id: 'jump_squat',       nom: 'Jump Squat',               muscles: ['Quadriceps', 'Mollets'],              niveau: 'intermediaire' },
    { id: 'lunge',            nom: 'Fentes',                   muscles: ['Quadriceps', 'Fessiers'],             niveau: 'debutant' }
  ],
  core: [
    { id: 'hollow_body',      nom: 'Hollow Body Hold',         muscles: ['Abdos', 'Lombaires'],                 niveau: 'debutant' },
    { id: 'l_sit',            nom: 'L-sit',                    muscles: ['Abdos', 'Hip flexors'],               niveau: 'intermediaire' },
    { id: 'dragon_flag',      nom: 'Dragon Flag',              muscles: ['Abdos complets'],                     niveau: 'avance' },
    { id: 'plank',            nom: 'Gainage planche',          muscles: ['Core complet'],                       niveau: 'debutant' }
  ]
};

/* ── Normaliser le niveau depuis Supabase ── */
function _normalizeNiveau(raw) {
  var map = {
    '\u00c9lite': 'elite', 'Elite': 'elite',
    'Avanc\u00e9': 'avance', 'Avance': 'avance', 'Avancé': 'avance',
    'Interm\u00e9diaire': 'intermediaire', 'Intermediaire': 'intermediaire', 'Intermédiaire': 'intermediaire',
    'Novice': 'novice',
    'D\u00e9butant': 'debutant', 'Debutant': 'debutant', 'Débutant': 'debutant'
  };
  if (!raw) return 'debutant';
  return map[raw] || raw.toLowerCase() || 'debutant';
}

/* ── Formater les exercices Wger vers le format interne ── */
function _formatWgerExercises(wgerExercises) {
  return wgerExercises.map(function(ex) {
    var translation = null;
    if (ex.translations) {
      for (var i = 0; i < ex.translations.length; i++) {
        if (ex.translations[i].language === 2) { translation = ex.translations[i]; break; }
      }
      if (!translation && ex.translations.length > 0) translation = ex.translations[0];
    }

    var muscles = [];
    (ex.muscles || []).forEach(function(m) { if (m.name_en || m.name) muscles.push(m.name_en || m.name); });
    (ex.muscles_secondary || []).forEach(function(m) { if (m.name_en || m.name) muscles.push(m.name_en || m.name); });

    return {
      id: 'wger_' + ex.id,
      nom: (translation && translation.name) || ex.name || 'Exercice',
      description: translation && translation.description
        ? translation.description.replace(/<[^>]*>/g, '').slice(0, 150) : '',
      muscles: muscles.length ? muscles : ['Non spécifié'],
      source: 'wger',
      wger_id: ex.id,
      equipement: (ex.equipment || []).map(function(e) { return e.name; }).join(', ') || 'Poids de corps'
    };
  });
}

/* ── Filtrer selon les blessures ── */
function _filterByInjuries(exercises, blessures) {
  if (!blessures || !blessures.length) return exercises;
  var INJURY_FILTERS = {
    epaules:  ['tractions', 'chin_up', 'muscle_up', 'hspu', 'dips'],
    poignets: ['pompes', 'dips', 'handstand', 'planche'],
    coudes:   ['diamond_pushup', 'dips', 'chin_up'],
    dos_bas:  ['dragon_flag', 'hollow_body'],
    genoux:   ['pistol_squat', 'jump_squat', 'lunge']
  };
  var toFilter = [];
  blessures.forEach(function(z) {
    (INJURY_FILTERS[z] || []).forEach(function(id) { toFilter.push(id); });
  });
  return exercises.filter(function(ex) { return toFilter.indexOf(ex.id) === -1; });
}

/* ── Builders par type de séance ── */
async function _buildPull(config, blessures) {
  var wgerExercises = await getExercisesByCategory(WGER_CATEGORIES.BACK, 20);
  var formatted = _formatWgerExercises(wgerExercises);
  var swPull = SW_EXERCISES.pull.filter(function(e) {
    return !(blessures && blessures.indexOf('epaules') !== -1);
  });
  return swPull.concat(formatted);
}

async function _buildPush(config, blessures) {
  var results = await Promise.allSettled([
    getExercisesByCategory(WGER_CATEGORIES.CHEST, 10),
    getExercisesByCategory(WGER_CATEGORIES.SHOULDERS, 10)
  ]);
  var formatted = [];
  results.forEach(function(r) {
    if (r.status === 'fulfilled') formatted = formatted.concat(_formatWgerExercises(r.value));
  });
  var swPush = SW_EXERCISES.push.filter(function(e) {
    return !(blessures && blessures.indexOf('poignets') !== -1 &&
      (e.id === 'pompes' || e.id === 'dips'));
  });
  return swPush.concat(formatted);
}

async function _buildLower(config, blessures) {
  var wgerLegs = await getExercisesByCategory(WGER_CATEGORIES.LEGS, 15);
  var formatted = _formatWgerExercises(wgerLegs);
  var swLegs = SW_EXERCISES.legs.filter(function(e) {
    return !(blessures && blessures.indexOf('genoux') !== -1 &&
      (e.id === 'pistol_squat' || e.id === 'jump_squat'));
  });
  return swLegs.concat(formatted);
}

async function _buildUpper(config, blessures) {
  var results = await Promise.allSettled([
    _buildPull(config, blessures),
    _buildPush(config, blessures)
  ]);
  var pull = results[0].status === 'fulfilled' ? results[0].value : SW_EXERCISES.pull;
  var push = results[1].status === 'fulfilled' ? results[1].value : SW_EXERCISES.push;
  var result = [];
  var maxLen = Math.max(pull.length, push.length);
  for (var i = 0; i < maxLen && result.length < config.exercicesCount + 2; i++) {
    if (push[i]) result.push(push[i]);
    if (pull[i]) result.push(pull[i]);
  }
  return result;
}

async function _buildFullBody(config, blessures) {
  var results = await Promise.allSettled([
    _buildPull(config, blessures),
    _buildPush(config, blessures),
    _buildLower(config, blessures)
  ]);
  var pull  = results[0].status === 'fulfilled' ? results[0].value : SW_EXERCISES.pull;
  var push  = results[1].status === 'fulfilled' ? results[1].value : SW_EXERCISES.push;
  var lower = results[2].status === 'fulfilled' ? results[2].value : SW_EXERCISES.legs;
  return pull.slice(0, 2).concat(push.slice(0, 2), lower.slice(0, 2), SW_EXERCISES.core.slice(0, 1));
}

function _buildSkills(config, niveau) {
  var niveauOrder = ['debutant', 'novice', 'intermediaire', 'avance', 'elite'];
  var niveauIndex = niveauOrder.indexOf(niveau);
  var allSkills = SW_EXERCISES.pull.concat(SW_EXERCISES.push);
  return allSkills.filter(function(e) {
    return niveauOrder.indexOf(e.niveau) <= niveauIndex;
  });
}

function _buildFallback(sessionType, config, niveau) {
  var map = {
    pull:      SW_EXERCISES.pull,
    push:      SW_EXERCISES.push,
    legs:      SW_EXERCISES.legs,
    core:      SW_EXERCISES.core,
    upper:     SW_EXERCISES.pull.concat(SW_EXERCISES.push),
    lower:     SW_EXERCISES.legs,
    full_body: SW_EXERCISES.pull.slice(0,2).concat(SW_EXERCISES.push.slice(0,2), SW_EXERCISES.legs.slice(0,2)),
    skills:    SW_EXERCISES.pull.concat(SW_EXERCISES.push)
  };
  return map[sessionType] || SW_EXERCISES.pull;
}

/* ── Échauffement ── */
function _buildWarmup(sessionType) {
  var warmups = {
    pull: [
      { nom: 'Rotations épaules',       duree: '60s',    desc: '10 rotations avant + arrière' },
      { nom: 'Suspension passive',       duree: '30s',    desc: 'Se pendre à la barre, épaules décontractées' },
      { nom: 'Rangée australienne légère', duree: '10 reps', desc: 'Échauffement grand dorsal' }
    ],
    push: [
      { nom: 'Rotations poignets',      duree: '60s',    desc: '10 rotations dans chaque sens' },
      { nom: 'Pompes lentes',           duree: '10 reps', desc: 'Amplitude complète, tempo 3-0-3' },
      { nom: 'Pike push-up',            duree: '8 reps',  desc: 'Activer les deltoïdes' }
    ],
    legs: [
      { nom: 'Jumping jacks',           duree: '60s',    desc: 'Élever la température corporelle' },
      { nom: 'Leg swings',              duree: '30s',    desc: '10 balancements par jambe, avant/arrière' },
      { nom: 'Squats lents',            duree: '10 reps', desc: 'Amplitude complète, descendre bas' }
    ]
  };
  var def = [
    { nom: 'Jumping jacks',             duree: '60s',    desc: 'Élever la température corporelle' },
    { nom: 'Rotations articulaires',    duree: '2 min',  desc: 'Épaules, poignets, hanches, chevilles' },
    { nom: 'Gainage planche',           duree: '30s',    desc: 'Activer le core' }
  ];
  return warmups[sessionType] || def;
}

/* ── Retour au calme ── */
function _buildCooldown() {
  return [
    { nom: 'Étirement grand dorsal',  duree: '30s', desc: 'Bras tendu au-dessus, pencher latéralement' },
    { nom: 'Étirement pectoral',      duree: '30s', desc: 'Bras en croix contre un mur' },
    { nom: 'Respiration profonde',    duree: '60s', desc: '4s inspirer — 4s expirer, calmer le SNC' }
  ];
}

/* ── Durée estimée ── */
function _estimateDuration(config) {
  var tempsExercice = config.exercicesCount * config.series * 45;
  var tempsRepos    = config.exercicesCount * config.series * config.reposMin;
  var total = Math.round((tempsExercice + tempsRepos + 600) / 60);
  return total + '\u2013' + (total + 10) + ' min';
}

/* ── Conseil par exercice selon niveau ── */
function _getExerciseTip(exerciseId, niveau) {
  var tips = {
    tractions: {
      debutant:      'Commence avec un élastique. Focus sur la descente lente (3s).',
      novice:        'Vise 3×8 strict. Introduis le lest dès 3×10.',
      intermediaire: 'Vise 3×10 lestés. Quand tu arrives à 3×12, ajoute 2.5 kg.',
      avance:        'Travaille les variantes : prise large, neutre, lestée +20 kg.',
      elite:         'Tractions lestées + one-arm progressions (archer pull-ups).'
    },
    dips: {
      debutant:      'Poids de corps. Descends jusqu\'aux épaules sous les coudes.',
      novice:        'Vise 3×12. Garde le torse légèrement incliné vers l\'avant.',
      intermediaire: 'Ajoute 5–10 kg. Ring dips pour l\'instabilité.',
      avance:        'Dips lestés +20 kg + ring dips.',
      elite:         'Ring dips lestés + Korean dips pour les coudes.'
    },
    pompes: {
      debutant:      'Corps parfaitement aligné. Pas de fesses en l\'air.',
      novice:        'Pompes déclinées pour cibler le pectoral haut.',
      intermediaire: 'Archer push-ups pour préparer le one-arm.',
      avance:        'One-arm push-up : commence avec les pieds écartés.',
      elite:         'Clap push-ups + one-arm pour la puissance maximale.'
    }
  };
  var tip = tips[exerciseId];
  return tip ? (tip[niveau] || '') : '';
}

/* ══════════════════════════════════════
   FONCTION PRINCIPALE DE GÉNÉRATION
   ══════════════════════════════════════ */
async function generateProgram(sessionType, userProfile) {
  var niveau  = _normalizeNiveau(userProfile && userProfile.niveau);
  var config  = LEVEL_CONFIG[niveau] || LEVEL_CONFIG.debutant;
  var blessures = (userProfile && userProfile.zones_sensibles) ? userProfile.zones_sensibles : [];

  var exercises = [];

  try {
    if      (sessionType === 'full_body') exercises = await _buildFullBody(config, blessures);
    else if (sessionType === 'upper')     exercises = await _buildUpper(config, blessures);
    else if (sessionType === 'lower')     exercises = await _buildLower(config, blessures);
    else if (sessionType === 'push')      exercises = await _buildPush(config, blessures);
    else if (sessionType === 'pull')      exercises = await _buildPull(config, blessures);
    else if (sessionType === 'skills')    exercises = _buildSkills(config, niveau);
    else if (sessionType === 'core')      exercises = SW_EXERCISES.core.slice();
    else                                  exercises = _buildFallback(sessionType, config, niveau);
  } catch (err) {
    console.warn('Wger API indisponible, fallback SW :', err.message);
    exercises = _buildFallback(sessionType, config, niveau);
  }

  exercises = _filterByInjuries(exercises, blessures);

  var sessionLabel = '';
  Object.keys(SESSION_TYPES).forEach(function(k) {
    if (SESSION_TYPES[k].id === sessionType) sessionLabel = SESSION_TYPES[k].label;
  });

  return {
    type:           sessionType,
    nom:            sessionLabel || sessionType,
    niveau:         niveau,
    date:           new Date().toISOString().slice(0, 10),
    config:         config,
    echauffement:   _buildWarmup(sessionType),
    exercices:      exercises.slice(0, config.exercicesCount).map(function(ex) {
      return Object.assign({}, ex, {
        series:  config.series,
        reps:    config.repsRange[0] + '\u2013' + config.repsRange[1],
        repos:   config.reposMin,
        notes:   _getExerciseTip(ex.id, niveau)
      });
    }),
    retour_au_calme: _buildCooldown(),
    duree_estimee:   _estimateDuration(config)
  };
}

/* ── Sauvegarder le programme généré ── */
function saveGeneratedProgram(program) {
  if (typeof SW === 'undefined') return;
  var programs = SW.load('generated_programs') || [];
  programs.unshift(Object.assign({}, program, { id: Date.now() }));
  SW.save('generated_programs', programs.slice(0, 10));
}
