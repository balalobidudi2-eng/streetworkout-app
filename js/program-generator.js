/* ========================================
   PROGRAM-GENERATOR.JS — v2
   Generation basee sur SW_DB (sw-database.js)
   Sources : NSCA Guidelines + Schoenfeld 2017
   Depend de : sw-database.js (SW_DB global)
   ======================================== */

/* -- Types de seances (global pour programme.js) -- */
var SESSION_TYPES = {
  push:      { id: 'push',      label: 'Poussée',      icon: '💪' },
  pull:      { id: 'pull',      label: 'Traction',      icon: '🏋️' },
  lower:     { id: 'lower',     label: 'Jambes',        icon: '🦵' },
  upper:     { id: 'upper',     label: 'Haut du corps', icon: '🔝' },
  full_body: { id: 'full_body', label: 'Full Body',     icon: '⚡' },
  skills:    { id: 'skills',    label: 'Skills',        icon: '🤸' },
  core:      { id: 'core',      label: 'Core / Abdos',  icon: '🎯' }
};

/* -- Normaliser le niveau -- */
function _getNiveau(raw) {
  var map = {
    '\u00c9lite': 'elite', 'Elite': 'elite', 'elite': 'elite',
    'Avanc\u00e9': 'avance', 'Avance': 'avance', 'avance': 'avance',
    'Interm\u00e9diaire': 'intermediaire', 'Intermediaire': 'intermediaire', 'intermediaire': 'intermediaire',
    'Novice': 'novice', 'novice': 'novice',
    'D\u00e9butant': 'debutant', 'Debutant': 'debutant', 'debutant': 'debutant'
  };
  if (!raw) return 'debutant';
  return map[raw] || raw.toLowerCase() || 'debutant';
}

/* -- Equipement par defaut -- */
function _defaultEquipement() {
  return ['barre_traction', 'barres_paralleles', 'barre_basse'];
}

/* -- Modifier les reps selon l objectif -- */
function _applyRepsModifier(repsStr, modifier) {
  if (!modifier || modifier === 0) return repsStr;
  if (typeof repsStr === 'string' && repsStr.indexOf('s') !== -1) return repsStr;
  if (repsStr === 'max') return repsStr;
  if (typeof repsStr === 'string' && repsStr.indexOf('\u2013') !== -1) {
    var parts = repsStr.split('\u2013');
    var lo = Math.max(1, parseInt(parts[0]) + modifier);
    var hi = Math.max(lo, parseInt(parts[1]) + modifier);
    return lo + '\u2013' + hi;
  }
  if (typeof repsStr === 'string' && repsStr.indexOf('/') !== -1) {
    var slash = repsStr.indexOf('/');
    var numPart = repsStr.substring(0, slash);
    var suffix = repsStr.substring(slash);
    if (numPart.indexOf('\u2013') !== -1) {
      var pts = numPart.split('\u2013');
      var a = Math.max(1, parseInt(pts[0]) + modifier);
      var b = Math.max(a, parseInt(pts[1]) + modifier);
      return a + '\u2013' + b + suffix;
    }
    return Math.max(1, parseInt(numPart) + modifier) + suffix;
  }
  return repsStr;
}

/* -- Echauffement contextuel -- */
function _buildWarmup(type) {
  var warmups = {
    pull: [
      { nom: 'Suspension passive barre',   duree: '30s',     desc: 'D\u00e9compresser les \u00e9paules' },
      { nom: 'Rotations \u00e9paules',           duree: '60s',     desc: '10 rotations avant + arri\u00e8re' },
      { nom: 'Rang\u00e9e australienne l\u00e9g\u00e8re', duree: '8 reps',  desc: '\u00c9chauffement grand dorsal' }
    ],
    push: [
      { nom: 'Rotations poignets',         duree: '60s',     desc: '10 rotations dans chaque sens' },
      { nom: 'Pompes lentes',              duree: '10 reps', desc: 'Amplitude compl\u00e8te, tempo 3-0-3' },
      { nom: 'Pike push-up l\u00e9ger',         duree: '8 reps',  desc: 'Activer les delto\u00efdes' }
    ],
    upper: [
      { nom: 'Rotations \u00e9paules',           duree: '60s',     desc: '10 rotations avant + arri\u00e8re' },
      { nom: 'Pompes lentes',              duree: '10 reps', desc: 'Activation pectoraux et delto\u00efdes' },
      { nom: 'Suspension passive barre',   duree: '30s',     desc: 'D\u00e9compresser les \u00e9paules' }
    ],
    full_body: [
      { nom: 'Jumping jacks',              duree: '60s',     desc: '\u00c9lever la temp\u00e9rature corporelle' },
      { nom: 'Rotations articulaires',     duree: '90s',     desc: '\u00c9paules - poignets - hanches - chevilles' },
      { nom: 'Squats lents',               duree: '8 reps',  desc: 'Activer tout le corps, amplitude compl\u00e8te' }
    ],
    lower: [
      { nom: 'Jumping jacks',              duree: '60s',     desc: '\u00c9lever la temp\u00e9rature corporelle' },
      { nom: 'Leg swings',                 duree: '30s',     desc: '10 balancements par jambe' },
      { nom: 'Squats lents',               duree: '10 reps', desc: 'Amplitude compl\u00e8te' }
    ],
    skills: [
      { nom: 'Suspension passive barre',   duree: '30s',     desc: 'D\u00e9compresser les \u00e9paules' },
      { nom: 'Rotations poignets',         duree: '60s',     desc: 'Pr\u00e9parer les articulations' },
      { nom: 'Hollow body l\u00e9ger',           duree: '20s',     desc: 'Activer le core' }
    ],
    core: [
      { nom: 'Jumping jacks',              duree: '45s',     desc: '\u00c9lever la temp\u00e9rature corporelle' },
      { nom: 'Rotations articulaires',     duree: '60s',     desc: '\u00c9paules - hanches' },
      { nom: 'Gainage l\u00e9ger',               duree: '15s',     desc: 'Activer le core' }
    ]
  };
  return warmups[type] || warmups.full_body;
}

/* -- Retour au calme -- */
function _buildCooldown() {
  return [
    { nom: '\u00c9tirement grand dorsal',  duree: '30s',       desc: 'Bras tendu au-dessus, pencher lat\u00e9ralement' },
    { nom: '\u00c9tirement pectoral',      duree: '30s/c\u00f4t\u00e9', desc: 'Bras en croix contre un mur' },
    { nom: 'Respiration 4-4-4',       duree: '1 min',    desc: '4s inspirer, 4s tenir, 4s expirer' }
  ];
}

/* -- Duree estimee -- */
function _estimateDuration(exercices) {
  var total = 5;
  for (var i = 0; i < exercices.length; i++) {
    var ex = exercices[i];
    var sets = ex.series || 3;
    var repos = ex.repos || 60;
    total += sets * (0.67 + repos / 60);
  }
  total += 3;
  var lo = Math.round(total);
  return lo + '\u2013' + (lo + 10) + ' min';
}

/* -- Formater un ID en label lisible -- */
function _formatId(id) {
  var labels = {};
  if (typeof SW_DB !== 'undefined' && SW_DB.exercices) {
    for (var key in SW_DB.exercices) {
      if (SW_DB.exercices.hasOwnProperty(key)) {
        labels[key] = SW_DB.exercices[key].nom;
      }
    }
  }
  return labels[id] || id.replace(/_/g, ' ');
}

/* ======================================================
   FONCTION PRINCIPALE DE GENERATION
   ====================================================== */
function generateProgram(config, userProfile) {
  var type     = (config && config.type) || 'full_body';
  var objectif = (config && config.objectif) || 'street_workout';
  var rawNiveau = (config && config.niveau) || (userProfile && userProfile.niveau) || 'debutant';
  var niveau   = _getNiveau(rawNiveau);

  var template = SW_DB.templates[type];
  if (!template) template = SW_DB.templates.full_body;

  var structure = template.structure[niveau];
  if (!structure) structure = template.structure.debutant;

  var equipement = (userProfile && userProfile.equipement) || _defaultEquipement();
  var filtered = SW_DB.filterByEquipement(structure, equipement);
  if (filtered.length === 0) filtered = structure;

  var objMod = SW_DB.objectif_modifiers[objectif] || SW_DB.objectif_modifiers.street_workout;

  var exercices = filtered.map(function(item, i) {
    var exData = SW_DB.exercices[item.ex] || {};
    var series = (item.sets || 3) + (objMod.sets_modifier || 0);
    if (series < 1) series = 1;
    var reps = _applyRepsModifier(item.reps, objMod.reps_modifier);
    var repos = (item.repos || 60) + (objMod.repos_modifier || 0);
    if (repos < 15) repos = 15;

    return {
      id:            item.ex,
      nom:           exData.nom || _formatId(item.ex),
      muscles:       exData.muscles_principaux || [],
      description:   exData.description || '',
      points_forme:  exData.points_forme || [],
      series:        series,
      reps:          reps,
      repos:         repos,
      note:          item.note || '',
      superset_with: item.superset_with || null,
      source:        'sw_db'
    };
  });

  var SESSION_LABELS = {
    pull: 'Traction', push: 'Poussée', lower: 'Jambes',
    upper: 'Haut du corps', full_body: 'Full Body',
    skills: 'Skills', core: 'Core / Abdos'
  };

  return {
    type:            type,
    nom:             SESSION_LABELS[type] || type,
    niveau:          niveau,
    objectif:        objectif,
    objectif_label:  objMod.label,
    date:            new Date().toISOString().slice(0, 10),
    echauffement:    _buildWarmup(type),
    exercices:       exercices,
    retour_au_calme: _buildCooldown(),
    duree_estimee:   _estimateDuration(exercices),
    conseil:         objMod.conseil || ''
  };
}

/* -- Sauvegarder le programme genere -- */
function saveGeneratedProgram(program) {
  if (typeof SW === 'undefined') return;
  var programs = SW.load('generated_programs') || [];
  var filtered = programs.filter(function(p) {
    return !(p.type === program.type && p.date === program.date);
  });
  filtered.unshift(Object.assign({}, program, { id: Date.now() }));
  SW.save('generated_programs', filtered.slice(0, 10));
}
