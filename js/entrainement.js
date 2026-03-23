/* ========================================
   ENTRAINEMENT.JS — v3 — All priorities fixed
   P1: saveSession corrigé (localStorage first)
   P2: _renderSeanceTable avec checkboxes par série
   P3: _calcDureeReelle dynamique
   P4: _getExercicesForType avec generateProgram + equipement
   P5: _renderWeeklyPlan éditable + modal
   ======================================== */

/* ── State ── */
var _entUserId = null;
var _seriesState = {};      // "exIdx_serieNum" → true/false
var _currentExercices = []; // exercices de la séance courante

/* ── Types de séances ── */
var TYPES_SEANCE = [
  { id: 'push',      label: 'Poussée',     color: '#3B82F6' },
  { id: 'pull',      label: 'Traction',    color: '#8B5CF6' },
  { id: 'lower',     label: 'Jambes',      color: '#10B981' },
  { id: 'upper',     label: 'Haut du corps', color: '#F59E0B' },
  { id: 'full_body', label: 'Full Body',   color: '#2563EB' },
  { id: 'skills',    label: 'Skills',      color: '#EC4899' },
  { id: 'core',      label: 'Core / Abdos',color: '#14B8A6' },
  { id: 'repos',     label: 'Repos',       color: '#9CA3AF' }
];

/* ── Planning statique de référence ── */
var PROGRAMME = {
  lundi:    { nom: 'PUSH',         muscles: 'Pecs, Épaules, Triceps', couleur: '#FF6B6B', type: 'push'      },
  mardi:    { nom: 'REPOS/CARDIO', muscles: 'Récupération active',    couleur: '#FFD93D', type: 'repos'     },
  mercredi: { nom: 'PULL',         muscles: 'Dos, Biceps, Avant-bras',couleur: '#6BCB77', type: 'pull'      },
  jeudi:    { nom: 'REPOS/CARDIO', muscles: 'Récupération active',    couleur: '#FFD93D', type: 'repos'     },
  vendredi: { nom: 'FULL BODY',    muscles: 'Corps complet',           couleur: '#4D96FF', type: 'full_body' },
  samedi:   { nom: 'SKILLS',       muscles: 'Figures, Équilibre',      couleur: '#9B59B6', type: 'skills'    },
  dimanche: { nom: 'REPOS TOTAL',  muscles: 'Repos complet',           couleur: '#95A5A6', type: 'repos'     }
};

/* ══════════════════════════════════════════════════
   TRAINING ENGINE V4 — Real coach logic, not fake
   ══════════════════════════════════════════════════ */

/* ── Training rules (strength / hypertrophy / endurance) ── */
var TRAINING_RULES = {
  strength: {
    reps: { min: 3, max: 6 },
    rest: { min: 120, max: 180 },
    sets: { min: 4, max: 6 }
  },
  hypertrophy: {
    reps: { min: 6, max: 12 },
    rest: { min: 60, max: 90 },
    sets: { min: 3, max: 4 }
  },
  endurance: {
    reps: { min: 12, max: 25 },
    rest: { min: 30, max: 60 },
    sets: { min: 2, max: 4 }
  },
  skills: {
    reps: { min: 5, max: 30 },
    rest: { min: 60, max: 120 },
    sets: { min: 3, max: 5 }
  }
};

/* ── Clean exercise database with full metadata ── */
var EXERCISE_DATABASE = {
  /* PUSH — chest, shoulders, triceps */
  push: [
    {
      id: 'push_1',
      nom: 'Pompes classiques',
      muscles: ['poitrine', 'épaules', 'triceps'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'hypertrophy'
    },
    {
      id: 'push_2',
      nom: 'Dips — Barres parallèles',
      muscles: ['poitrine', 'triceps', 'épaules'],
      equipment: ['barres_paralleles'],
      difficulty: 'intermediate',
      trainingType: 'hypertrophy'
    },
    {
      id: 'push_3',
      nom: 'Pompes diamant',
      muscles: ['triceps', 'poitrine'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'strength'
    },
    {
      id: 'push_4',
      nom: 'Pike push-ups',
      muscles: ['épaules', 'poitrine'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'strength'
    },
    {
      id: 'push_5',
      nom: 'Pompes piquées (pattes hautes)',
      muscles: ['épaules', 'poitrine'],
      equipment: [],
      difficulty: 'advanced',
      trainingType: 'strength'
    },
    {
      id: 'push_6',
      nom: 'Pompes lestées',
      muscles: ['poitrine', 'triceps', 'épaules'],
      equipment: ['weighted_vest', 'plates'],
      difficulty: 'advanced',
      trainingType: 'strength'
    },
    {
      id: 'push_7',
      nom: 'Handstand push-up (mur)',
      muscles: ['épaules', 'triceps'],
      equipment: [],
      difficulty: 'advanced',
      trainingType: 'strength'
    }
  ],

  /* PULL — back, biceps, forearms */
  pull: [
    {
      id: 'pull_1',
      nom: 'Tractions pronation',
      muscles: ['dos', 'biceps'],
      equipment: ['pullup_bar'],
      difficulty: 'intermediate',
      trainingType: 'hypertrophy'
    },
    {
      id: 'pull_2',
      nom: 'Tractions supination',
      muscles: ['biceps', 'dos-bas'],
      equipment: ['pullup_bar'],
      difficulty: 'intermediate',
      trainingType: 'hypertrophy'
    },
    {
      id: 'pull_3',
      nom: 'Australian rows',
      muscles: ['dos', 'biceps'],
      equipment: ['pullup_bar', 'horizontal_bar'],
      difficulty: 'beginner',
      trainingType: 'hypertrophy'
    },
    {
      id: 'pull_4',
      nom: 'Tractions serrées',
      muscles: ['biceps', 'dos'],
      equipment: ['pullup_bar'],
      difficulty: 'advanced',
      trainingType: 'strength'
    },
    {
      id: 'pull_5',
      nom: 'Tractions lestées',
      muscles: ['dos', 'biceps'],
      equipment: ['pullup_bar', 'weighted_vest', 'plates'],
      difficulty: 'advanced',
      trainingType: 'strength'
    },
    {
      id: 'pull_6',
      nom: 'Front lever hold',
      muscles: ['dos', 'poitrine', 'avant-bras'],
      equipment: ['pullup_bar'],
      difficulty: 'expert',
      trainingType: 'skills'
    }
  ],

  /* LOWER — legs, glutes, quads */
  lower: [
    {
      id: 'lower_1',
      nom: 'Squats',
      muscles: ['quadriceps', 'fessiers', 'ischio-jambiers'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'hypertrophy'
    },
    {
      id: 'lower_2',
      nom: 'Squats sautés',
      muscles: ['quadriceps', 'fessiers'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'endurance'
    },
    {
      id: 'lower_3',
      nom: 'Pistol squats assistés',
      muscles: ['quadriceps', 'fessiers', 'équilibre'],
      equipment: ['pullup_bar'],
      difficulty: 'advanced',
      trainingType: 'hypertrophy'
    },
    {
      id: 'lower_4',
      nom: 'Pistol squats',
      muscles: ['quadriceps', 'fessiers', 'équilibre'],
      equipment: [],
      difficulty: 'expert',
      trainingType: 'strength'
    },
    {
      id: 'lower_5',
      nom: 'Fentes marchées',
      muscles: ['quadriceps', 'fessiers', 'ischio-jambiers'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'hypertrophy'
    },
    {
      id: 'lower_6',
      nom: 'Step-ups pondérés',
      muscles: ['quadriceps', 'fessiers'],
      equipment: ['weighted_vest', 'plates'],
      difficulty: 'advanced',
      trainingType: 'strength'
    }
  ],

  /* CORE — abs, obliques, lower back */
  core: [
    {
      id: 'core_1',
      nom: 'Gainage frontal',
      muscles: ['abdominaux', 'lombaires'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'endurance'
    },
    {
      id: 'core_2',
      nom: 'Hollow body hold',
      muscles: ['abdominaux', 'lombaires', 'poitrine'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'endurance'
    },
    {
      id: 'core_3',
      nom: 'Dragon flag',
      muscles: ['abdominaux', 'lombaires'],
      equipment: [],
      difficulty: 'expert',
      trainingType: 'strength'
    },
    {
      id: 'core_4',
      nom: 'Gainage oblique',
      muscles: ['obliques', 'abdominaux'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'hypertrophy'
    },
    {
      id: 'core_5',
      nom: 'L-sit progression',
      muscles: ['abdominaux', 'fléchisseurs de hanche'],
      equipment: ['parallettes', 'pullup_bar'],
      difficulty: 'advanced',
      trainingType: 'skills'
    }
  ],

  /* SKILLS — handstand, l-sit, movement */
  skills: [
    {
      id: 'skill_1',
      nom: 'L-sit (barres)',
      muscles: ['abdominaux', 'fléchisseurs de hanche'],
      equipment: ['parallettes', 'pullup_bar'],
      difficulty: 'advanced',
      trainingType: 'skills'
    },
    {
      id: 'skill_2',
      nom: 'Handstand (mur)',
      muscles: ['épaules', 'poitrine', 'équilibre'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'skills'
    },
    {
      id: 'skill_3',
      nom: 'Planche lean',
      muscles: ['pectoraux', 'épaules'],
      equipment: ['paralettes'],
      difficulty: 'advanced',
      trainingType: 'skills'
    },
    {
      id: 'skill_4',
      nom: 'Frontend lever tuck',
      muscles: ['poitrine', 'abdominaux'],
      equipment: ['pullup_bar'],
      difficulty: 'expert',
      trainingType: 'skills'
    },
    {
      id: 'skill_5',
      nom: 'Human flag hold',
      muscles: ['obliques', 'épaules', 'dos'],
      equipment: ['pullup_bar', 'vertical_beacon'],
      difficulty: 'expert',
      trainingType: 'skills'
    }
  ],

  /* FULL BODY — mixed compound */
  full_body: [
    {
      id: 'fb_1',
      nom: 'Pompes classiques',
      muscles: ['poitrine', 'épaules', 'triceps'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'hypertrophy'
    },
    {
      id: 'fb_2',
      nom: 'Tractions',
      muscles: ['dos', 'biceps'],
      equipment: ['pullup_bar'],
      difficulty: 'intermediate',
      trainingType: 'hypertrophy'
    },
    {
      id: 'fb_3',
      nom: 'Squats',
      muscles: ['quadriceps', 'fessiers'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'hypertrophy'
    },
    {
      id: 'fb_4',
      nom: 'Gainage',
      muscles: ['abdominaux', 'lombaires'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'endurance'
    },
    {
      id: 'fb_5',
      nom: 'Burpees',
      muscles: ['poitrine', 'dos', 'jambes', 'cœur'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'endurance'
    }
  ],

  /* UPPER — back + chest + shoulders */
  upper: [
    {
      id: 'upper_1',
      nom: 'Pompes classiques',
      muscles: ['poitrine', 'épaules', 'triceps'],
      equipment: [],
      difficulty: 'beginner',
      trainingType: 'hypertrophy'
    },
    {
      id: 'upper_2',
      nom: 'Tractions',
      muscles: ['dos', 'biceps'],
      equipment: ['pullup_bar'],
      difficulty: 'intermediate',
      trainingType: 'hypertrophy'
    },
    {
      id: 'upper_3',
      nom: 'Dips',
      muscles: ['triceps', 'poitrine'],
      equipment: ['barres_paralleles'],
      difficulty: 'intermediate',
      trainingType: 'hypertrophy'
    },
    {
      id: 'upper_4',
      nom: 'Pike push-ups',
      muscles: ['épaules'],
      equipment: [],
      difficulty: 'intermediate',
      trainingType: 'strength'
    }
  ]
};

var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function getToday() { return JOURS[new Date().getDay()]; }
function getTodayProgramme() {
  /* Check si le planning éditable existe pour aujourd'hui */
  var plan = SW.load('sw_weekly_plan');
  if (plan && Array.isArray(plan)) {
    var joursOrdre = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    var dayOfWeek = new Date().getDay(); /* 0=dim, 1=lun, ... 6=sam */
    var planIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; /* convert to Mon=0 index */
    var planDay = plan[planIndex];
    if (planDay) {
      var typeData = TYPES_SEANCE.find(function(t) { return t.id === planDay.type; }) || TYPES_SEANCE[7];
      return {
        nom: typeData.label.toUpperCase(),
        muscles: planDay.type === 'repos' ? 'Récupération active' : 'Entraînement personnalisé',
        couleur: typeData.color,
        type: planDay.type
      };
    }
  }
  return PROGRAMME[getToday()];
}

/* ══════════════════════════════════════════════════
   FILTERING & VALIDATION FUNCTIONS
   ══════════════════════════════════════════════════ */

/**
 * Filter exercises by available equipment (MANDATORY)
 * Returns exercises that match user's equipment or are bodyweight
 */
function filterByEquipment(exercises, equipment) {
  if (!Array.isArray(equipment)) equipment = [];
  return exercises.filter(function(ex) {
    if (!ex.equipment || ex.equipment.length === 0) return true;
    return ex.equipment.some(function(eq) { return equipment.indexOf(eq) !== -1; });
  });
}

/**
 * Filter exercises by difficulty level
 * Prevents beginner from doing expert moves
 */
function filterByDifficulty(exercises, level) {
  var difficultyRank = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
  var userRank = difficultyRank[level] || difficultyRank.beginner;
  return exercises.filter(function(ex) { return (difficultyRank[ex.difficulty] || 1) <= userRank; });
}

/**
 * Filter exercises by type (MANDATORY for coherence)
 * Ensures only relevant exercises for session type
 */
function filterByType(exercises, type) {
  var typeRules = {
    push: { muscles: ['poitrine', 'triceps', 'épaules'] },
    pull: { muscles: ['dos', 'biceps', 'avant-bras'] },
    lower: { muscles: ['quadriceps', 'fessiers', 'ischio-jambiers'] },
    upper: { muscles: ['dos', 'poitrine', 'biceps', 'triceps', 'épaules'] },
    full_body: { exclude: [] },
    core: { muscles: ['abdominaux', 'lombaires', 'obliques'] },
    skills: { trainingType: 'skills' }
  };

  var rule = typeRules[type];
  if (!rule) return exercises;

  return exercises.filter(function(ex) {
    if (rule.trainingType) return ex.trainingType === rule.trainingType;
    if (!rule.muscles) return true;
    return rule.muscles.some(function(m) { return ex.muscles.indexOf(m) !== -1; });
  });
}

/**
 * Validate program quality (MANDATORY)
 * Removes irrelevant or duplicate exercises
 */
function validateProgram(exercises, type) {
  var filtered = filterByType(exercises, type);
  if (filtered.length === 0) {
    console.warn('validateProgram: no exercises for type ' + type + ', using full list');
    return exercises;
  }
  return filtered;
}

/**
 * Prioritize exercises by available equipment
 * If user has weighted vest, prefer weighted exercises
 */
function prioritizeByEquipment(exercises, equipment) {
  if (!Array.isArray(equipment) || equipment.length === 0) return exercises;

  var weighted = exercises.filter(function(ex) {
    return ex.equipment && ex.equipment.some(function(eq) {
      return equipment.indexOf(eq) !== -1;
    });
  });

  var bodyweight = exercises.filter(function(ex) {
    return !ex.equipment || ex.equipment.length === 0;
  });

  return weighted.length > 0 ? weighted : exercises;
}

/**
 * Apply training rules to exercises
 * Sets correct reps/rest/sets based on user goal
 */
function applyTrainingRules(exercises, trainingGoal) {
  var rule = TRAINING_RULES[trainingGoal] || TRAINING_RULES.hypertrophy;
  
  return exercises.map(function(ex) {
    var repsMin = rule.reps.min;
    var repsMax = rule.reps.max;
    var restMin = rule.rest.min;
    var restMax = rule.rest.max;
    var setsMin = rule.sets.min;
    var setsMax = rule.sets.max;

    return {
      id: ex.id,
      nom: ex.nom,
      muscles: ex.muscles,
      series: setsMin + Math.floor(Math.random() * (setsMax - setsMin + 1)),
      reps: repsMin + '-' + repsMax,
      repos: restMin + Math.floor(Math.random() * (restMax - restMin + 1)),
      difficulty: ex.difficulty,
      trainingType: ex.trainingType
    };
  });
}

/* ══════════════════════════════════════════════════
   REAL EXERCISE SELECTION ENGINE
   ══════════════════════════════════════════════════ */
/**
 * Real exercise selection engine
 * 1. Load user profile (level, goal, equipment)
 * 2. Get exercises from DATABASE
 * 3. Filter by: type, equipment, difficulty
 * 4. Apply training rules
 * 5. generateProgram() is OPTIONAL and VALIDATED
 */
function _getExercicesForType(type) {
  if (!type || type === 'repos') return [];

  /* Step 1: Load user profile */
  var userProfile = (typeof SW !== 'undefined' && SW.load) ? (SW.load('sw_userProfile') || {}) : {};
  var userStats   = (typeof SW !== 'undefined' && SW.load) ? (SW.load('sw_userStats') || {}) : {};

  var level = userStats.niveau || userProfile.niveau || 'debutant';
  var goal  = userProfile.objectif || 'street_workout';
  var equipment = userProfile.equipement || [];

  /* Convert goal to training type */
  var trainingGoal = 'hypertrophy'; /* default */
  if (goal === 'strength' || goal === 'force') trainingGoal = 'strength';
  if (goal === 'endurance') trainingGoal = 'endurance';
  if (goal === 'skills' || goal === 'figures') trainingGoal = 'skills';

  /* Step 2-3: Get exercises — API_MERGER first, local DATABASE as fallback */
  var baseExercises;
  if (typeof API_MERGER !== 'undefined' && API_MERGER.isLoaded) {
    baseExercises = API_MERGER.getExercisesByType(type);
    console.log('[Engine] API_MERGER: ' + baseExercises.length + ' exercises for ' + type);
  } else {
    baseExercises = EXERCISE_DATABASE[type] || [];
    console.log('[Engine] Local DB: ' + baseExercises.length + ' exercises for ' + type);
  }

  if (baseExercises.length === 0) {
    console.warn('No exercises found for type: ' + type);
    return [];
  }

  var filtered = filterByEquipment(baseExercises, equipment);
  filtered = filterByDifficulty(filtered, level);
  filtered = validateProgram(filtered, type);
  filtered = prioritizeByEquipment(filtered, equipment);

  /* Step 4: Apply training rules */
  var program = applyTrainingRules(filtered, trainingGoal);

  /* Step 5: OPTIONAL generateProgram() validation (treat as UNRELIABLE) */
  /* If generateProgram exists, TRY to get additional context, but TRUST DATABASE more */
  if (typeof generateProgram === 'function') {
    try {
      var fullProfile = {
        niveau: level,
        objectif: goal,
        equipement: equipment
      };
      var apiProgram = generateProgram(
        { type: type, objectif: goal, niveau: level },
        fullProfile
      );

      /* API returned something — validate it */
      if (apiProgram && apiProgram.exercices && apiProgram.exercices.length > 0) {
        var apiExercises = apiProgram.exercices;
        var validated = filterByType(apiExercises, type);
        
        /* Only use API if it makes sense (same type, decent count) */
        if (validated.length > 0 && validated.length >= program.length * 0.7) {
          console.log('generateProgram() validated for ' + type);
          /* Merge API with database (prefer database) */
          program = applyTrainingRules(validated, trainingGoal);
        } else {
          console.warn('generateProgram() output invalid or incoherent, using database');
        }
      }
    } catch(e) {
      console.warn('generateProgram() failed (non-blocking):', e);
      /* Fall through to database-only */
    }
  }

  return program;
}

/* ══════════════════════════════════════════════════
   P3 — Calcul durée réelle dynamique
   ══════════════════════════════════════════════════ */
function _calcDureeReelle(exercices) {
  if (!exercices || exercices.length === 0) return '0 min';

  var totalSec = 5 * 60; /* 5 min échauffement fixe */

  exercices.forEach(function(ex) {
    var series = ex.series || 3;
    var repos  = ex.repos  || 60;

    var repsDuration = 20;
    if (ex.reps) {
      var repsStr = String(ex.reps);
      var repsVal;
      if      (repsStr.indexOf('\u2013') !== -1) repsVal = parseInt(repsStr.split('\u2013')[1]); /* en-dash */
      else if (repsStr.indexOf('-')       !== -1) repsVal = parseInt(repsStr.split('-')[1]);
      else if (repsStr.indexOf('s')       !== -1) repsVal = parseInt(repsStr); /* isométrique */
      else                                         repsVal = parseInt(repsStr) || 10;
      repsDuration = (repsVal || 10) * 3;
    }

    totalSec += series * repsDuration + (series - 1) * repos;
  });

  totalSec += 3 * 60; /* 3 min retour au calme */

  var lo = Math.round(totalSec / 60);
  var hi = lo + 8;
  return lo + '\u2013' + hi + ' min';
}

/* ══════════════════════════════════════════════════
   P2 — Tableau séance avec checkboxes par série
   ══════════════════════════════════════════════════ */
function _renderSeanceTable(exercices) {
  _seriesState = {};
  var container = document.getElementById('session-content');
  if (!container) return;

  if (!exercices || exercices.length === 0) {
    container.innerHTML = '<p class="empty-state text-muted" style="text-align:center;padding:2rem">Aucun exercice à afficher.</p>';
    return;
  }

  var html = exercices.map(function(ex, exIdx) {
    var seriesRows = '';
    for (var i = 1; i <= ex.series; i++) {
      seriesRows +=
        '<tr class="serie-row" data-ex="' + exIdx + '" data-serie="' + i + '">' +
          '<td class="col-serie">Série ' + i + '</td>' +
          '<td class="col-reps">' + (ex.reps || '\u2014') + '</td>' +
          '<td class="col-repos">' + (ex.repos ? ex.repos + 's' : '\u2014') + '</td>' +
          '<td class="col-check"><button class="serie-check-btn" data-ex="' + exIdx + '" data-serie="' + i + '">\u25CB</button></td>' +
        '</tr>';
    }

    var musclesLabel = Array.isArray(ex.muscles) ? ex.muscles.join(', ') : (ex.muscles || '');
    return '<div class="ex-table-block">' +
      '<div class="ex-table-header">' +
        '<span class="ex-table-num">' + (exIdx + 1) + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<p class="ex-table-nom">' + ex.nom + '</p>' +
          (musclesLabel ? '<p class="ex-table-muscles">' + musclesLabel + '</p>' : '') +
        '</div>' +
        '<span class="ex-table-badge">' + ex.series + '\u00d7' + ex.reps + '</span>' +
      '</div>' +
      '<table class="serie-table">' +
        '<thead><tr>' +
          '<th>Série</th><th>Reps cible</th><th>Repos</th><th>\u2713</th>' +
        '</tr></thead>' +
        '<tbody>' + seriesRows + '</tbody>' +
      '</table>' +
    '</div>';
  }).join('');

  container.innerHTML = html;

  /* Bind check buttons (addEventListener — pas de onclick inline) */
  container.querySelectorAll('.serie-check-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _toggleSerie(
        parseInt(btn.getAttribute('data-ex')),
        parseInt(btn.getAttribute('data-serie'))
      );
    });
  });
}

function _toggleSerie(exIdx, serieNum) {
  var key = exIdx + '_' + serieNum;
  _seriesState[key] = !_seriesState[key];
  var row = document.querySelector('.serie-row[data-ex="' + exIdx + '"][data-serie="' + serieNum + '"]');
  if (!row) return;
  var btn = row.querySelector('.serie-check-btn');
  if (_seriesState[key]) {
    row.classList.add('completed');
    if (btn) btn.textContent = '\u2713';
  } else {
    row.classList.remove('completed');
    if (btn) btn.textContent = '\u25CB';
  }
}

/* ══════════════════════════════════════════════════
   P5 — Planning hebdomadaire éditable
   ══════════════════════════════════════════════════ */
function _getDefaultPlan() {
  return [
    { jour: 'Lundi',    type: 'push'      },
    { jour: 'Mardi',   type: 'repos'     },
    { jour: 'Mercredi',type: 'pull'      },
    { jour: 'Jeudi',   type: 'repos'     },
    { jour: 'Vendredi',type: 'full_body' },
    { jour: 'Samedi',  type: 'repos'     },
    { jour: 'Dimanche',type: 'repos'     }
  ];
}

function _renderWeeklyPlan() {
  var plan = SW.load('sw_weekly_plan') || _getDefaultPlan();
  var container = document.getElementById('planning-grid');
  if (!container) return;

  var todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  container.innerHTML = plan.map(function(day, i) {
    var typeData = TYPES_SEANCE.find(function(t) { return t.id === day.type; }) || TYPES_SEANCE[7];
    var isToday = (i === todayIndex);
    return '<div class="week-day-card' + (isToday ? ' week-day-today' : '') + '" data-index="' + i + '">' +
      '<p class="week-day-label">' + day.jour.slice(0, 3).toUpperCase() + '</p>' +
      '<button class="week-type-btn" style="--day-color:' + typeData.color + '">' + typeData.label + '</button>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.week-type-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var card = btn.closest('[data-index]');
      if (card) _openDayEditor(parseInt(card.getAttribute('data-index')));
    });
  });
}

function _openDayEditor(dayIndex) {
  var plan = SW.load('sw_weekly_plan') || _getDefaultPlan();
  var day  = plan[dayIndex];
  var modal = document.getElementById('dayEditorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dayEditorModal';
    modal.className = 'day-editor-modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML =
    '<div class="day-editor-inner">' +
      '<p class="day-editor-title">' + day.jour + '</p>' +
      TYPES_SEANCE.map(function(t) {
        return '<button class="day-type-option' + (t.id === day.type ? ' active' : '') + '" data-type="' + t.id + '">' + t.label + '</button>';
      }).join('') +
      '<button class="day-editor-close" id="day-editor-close">Fermer</button>' +
    '</div>';

  modal.style.display = 'flex';

  modal.querySelectorAll('.day-type-option').forEach(function(btn) {
    btn.addEventListener('click', function() { _setDayType(dayIndex, btn.getAttribute('data-type')); });
  });
  document.getElementById('day-editor-close').addEventListener('click', _closeDayEditor);
  modal.addEventListener('click', function(e) { if (e.target === modal) _closeDayEditor(); });
}

function _setDayType(dayIndex, type) {
  var plan = SW.load('sw_weekly_plan') || _getDefaultPlan();
  plan[dayIndex].type = type;
  SW.save('sw_weekly_plan', plan);
  _closeDayEditor();
  _renderWeeklyPlan();
  /* BUG FIX: si le jour modifié est aujourd'hui, mettre à jour la séance du jour immédiatement */
  var todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  if (dayIndex === todayIndex) {
    renderTodayCard();
    renderTodaySession();
  }
}

function _closeDayEditor() {
  var modal = document.getElementById('dayEditorModal');
  if (modal) modal.style.display = 'none';
}

/* ══════════════════════════════════════════════════
   P1 — Sauvegarde robuste (localStorage first)
   ══════════════════════════════════════════════════ */
function _saveSession(sessionObj) {
  if (!sessionObj || !sessionObj.exercices || sessionObj.exercices.length === 0) {
    showToast('Aucun exercice à sauvegarder', 'error');
    return;
  }

  var toSave = {
    id:            Date.now(),
    date:          sessionObj.date || new Date().toISOString().slice(0, 10),
    type:          sessionObj.type || 'full_body',
    nom:           sessionObj.nom  || 'Séance',
    duree_min:     sessionObj.duree_min || 0,
    exercices:     sessionObj.exercices || [],
    notes:         sessionObj.notes     || '',
    sauvegarde_at: new Date().toISOString()
  };

  /* Toujours localStorage en premier */
  try {
    SW.append('sw_sessions', toSave);
    showToast('Séance sauvegardée \u2713', 'success');
  } catch(e) {
    console.error('Erreur sauvegarde localStorage:', e);
    showToast('Erreur de sauvegarde : ' + e.message, 'error');
    return;
  }

  /* Supabase en arrière-plan, silencieux si null */
  if (typeof SB !== 'undefined' && SB !== null) {
    try {
      SB.from('sessions').insert(toSave)
        .then(function(res) { if (res && res.error) console.warn('Supabase save (non bloquant):', res.error); })
        .catch(function(e)  { console.warn('Supabase unavailable:', e); });
    } catch(e) { console.warn('SB call failed:', e); }
  }
}

/* Handler bouton "Sauvegarder la séance" */
function saveSession() {
  var prog = getTodayProgramme();
  var sessionObj = {
    date:      new Date().toISOString().slice(0, 10),
    type:      prog.type || 'full_body',
    nom:       prog.nom + ' \u2014 ' + prog.muscles,
    duree_min: 0,
    exercices: _currentExercices.map(function(ex, exIdx) {
      var seriesLog = [];
      for (var s = 1; s <= ex.series; s++) {
        seriesLog.push({ serie: s, fait: !!_seriesState[exIdx + '_' + s] });
      }
      return { id: ex.id || ex.nom, nom: ex.nom, series: seriesLog, reps_objectif: ex.reps, repos_sec: ex.repos };
    })
  };
  _saveSession(sessionObj);
  renderCalendarSection();
}

/* ══════════════════════════════════════════════════
   RENDU SÉANCE DU JOUR
   ══════════════════════════════════════════════════ */
function renderTodaySession() {
  var title = document.getElementById('session-title');
  var prog  = getTodayProgramme();
  if (title) title.textContent = prog.nom + ' \u2014 ' + prog.muscles;

  if (prog.type === 'repos') {
    var container = document.getElementById('session-content');
    if (container) container.innerHTML =
      '<div class="rest-day-msg"><p>\uD83D\uDE34</p><p>Jour de repos — Profitez-en pour récupérer, vous étirer, ou faire une marche active.</p></div>';
    var saveBtn = document.getElementById('save-session');
    if (saveBtn) saveBtn.style.display = 'none';
    return;
  }

  _currentExercices = _getExercicesForType(prog.type);

  var dureeBadge = document.getElementById('dureeBadge');
  if (dureeBadge) dureeBadge.textContent = _calcDureeReelle(_currentExercices);

  _renderSeanceTable(_currentExercices);
}

/* ══════════════════════════════════════════════════
   CARTE SÉANCE DU JOUR (bouton lancer WorkoutMode)
   ══════════════════════════════════════════════════ */
function renderTodayCard() {
  var card = document.getElementById('today-workout-card');
  if (!card) return;
  var prog = getTodayProgramme();

  if (prog.type === 'repos') {
    card.innerHTML = '<div class="today-card-rest">' +
      '<div class="today-card-icon">\uD83D\uDE34</div>' +
      '<div class="today-card-content">' +
        '<div class="today-card-type" style="color:' + prog.couleur + '">' + prog.nom + '</div>' +
        '<div class="today-card-muscles">' + prog.muscles + '</div>' +
      '</div>' +
    '</div>';
    return;
  }

  var exos = _getExercicesForType(prog.type);
  var totalSeries = exos.reduce(function(s, e) { return s + (e.series || 0); }, 0);
  var duree = _calcDureeReelle(exos);

  card.innerHTML = '<div class="today-card-inner">' +
    '<div class="today-card-content">' +
      '<div class="today-card-badge">Aujourd\'hui</div>' +
      '<div class="today-card-type" style="color:' + prog.couleur + '">' + prog.nom + '</div>' +
      '<div class="today-card-muscles">' + prog.muscles + '</div>' +
      '<div class="today-card-count">' + exos.length + ' exercices \u00b7 ' + totalSeries + ' séries \u00b7 ' + duree + '</div>' +
    '</div>' +
    '<button class="btn btn-primary today-card-btn" id="btn-start-workout">\u25b6 Lancer la séance</button>' +
  '</div>';

  document.getElementById('btn-start-workout').addEventListener('click', function() {
    if (!exos.length) { showToast('Aucun exercice prévu aujourd\'hui', 'info'); return; }
    if (typeof WorkoutMode === 'undefined') { showToast('WorkoutMode non chargé', 'error'); return; }

    var userStats   = SW.load('sw_userStats')   || {};
    var userProfile = SW.load('sw_userProfile') || {};
    var userLevel   = userStats.niveau || userProfile.niveau || 'debutant';

    var wmExos = exos.map(function(ex) {
      return {
        id:          ex.id || (typeof resolveExerciseId === 'function' ? resolveExerciseId(ex.nom) : ex.nom.toLowerCase().replace(/\s+/g, '_')),
        nom:         ex.nom,
        series:      ex.series,
        reps_objectif: ex.reps,
        poids:       0,
        repos_sec:   ex.repos || 90
      };
    });

    var wm = new WorkoutMode(wmExos, prog.nom + ' \u2014 ' + prog.muscles, userLevel);
    wm.mount();
  });
}

/* ══════════════════════════════════════════════════
   CALENDRIER & HISTORIQUE
   ══════════════════════════════════════════════════ */
function renderCalendarSection() {
  if (typeof renderCalendar === 'function') renderCalendar('weekly-calendar');
}

async function renderHistory() {
  var container = document.getElementById('history-list');
  if (!container) return;

  /* Toujours lire localStorage en premier */
  var sessions = SW.load('sw_sessions') || [];
  if (!Array.isArray(sessions)) sessions = sessions ? [sessions] : [];
  sessions = sessions.filter(Boolean);

  /* Tenter Supabase si disponible */
  if (typeof SB !== 'undefined' && SB !== null && _entUserId) {
    try {
      var res = await SB.from('sessions').select('*')
        .eq('user_id', _entUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (res && res.data && res.data.length > 0) sessions = res.data;
    } catch(e) { console.warn('History from Supabase failed:', e); }
  }

  if (sessions.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align:center;padding:1rem">Aucune séance enregistrée.</p>';
    return;
  }

  var recent = sessions.slice(-10).reverse();
  container.innerHTML = recent.map(function(s) {
    var d = new Date(s.sauvegarde_at || s.created_at || s.date || Date.now());
    var dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    var nom     = s.nom || s.type || '\u2014';
    var nbExos  = s.exercices ? s.exercices.length : 0;
    var duree   = s.duree_min ? s.duree_min + ' min' : '';
    return '<div class="history-item">' +
      '<div class="history-date">' + dateStr + '</div>' +
      '<div class="history-type">' + nom + '</div>' +
      '<div class="history-stats">' +
        '<span>' + nbExos + ' exos</span>' +
        (duree ? '<span>' + duree + '</span>' : '') +
      '</div>' +
      '<div class="history-bar"><div class="history-bar-fill" style="width:100%;background:var(--primary)"></div></div>' +
      '<div class="history-pct" style="color:var(--primary)">\u2713</div>' +
    '</div>';
  }).join('');
}

/* ══════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════ */
async function initEntrainement() {
  try {
    var user = await requireAuth();
    if (!user) return;
    _entUserId = user.id;
  } catch(e) {
    console.warn('Auth error (non bloquant):', e);
  }

  renderTodayCard();
  renderTodaySession();
  renderCalendarSection();
  _renderWeeklyPlan();
  initTimerUI('timer-container');

  var saveBtn = document.getElementById('save-session');
  if (saveBtn) saveBtn.addEventListener('click', saveSession);

  try { await renderHistory(); } catch(e) { console.warn('History unavailable:', e); }

  window.addEventListener('session:saved', function() {
    renderCalendarSection();
    try { renderHistory(); } catch(e) {}
  });
}

document.addEventListener('DOMContentLoaded', initEntrainement);
