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
  { id: 'push',      label: 'Push',      color: '#3B82F6' },
  { id: 'pull',      label: 'Pull',      color: '#8B5CF6' },
  { id: 'lower',     label: 'Jambes',    color: '#10B981' },
  { id: 'upper',     label: 'Upper',     color: '#F59E0B' },
  { id: 'full_body', label: 'Full Body', color: '#2563EB' },
  { id: 'skills',    label: 'Skills',    color: '#EC4899' },
  { id: 'core',      label: 'Core',      color: '#14B8A6' },
  { id: 'repos',     label: 'Repos',     color: '#9CA3AF' }
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

/* ── Exercices de secours (planning hebdo éditable peut changer les types) ── */
var EXERCICES_FALLBACK = {
  push: [
    { nom: 'Pompes classiques',  series: 4, reps: '12-15', repos: 60  },
    { nom: 'Dips',               series: 4, reps: '8-12',  repos: 90  },
    { nom: 'Pompes diamant',     series: 3, reps: '10-12', repos: 60  },
    { nom: 'Pike push-ups',      series: 3, reps: '8-10',  repos: 90  }
  ],
  pull: [
    { nom: 'Tractions pronation',  series: 4, reps: '6-10',  repos: 120 },
    { nom: 'Tractions supination', series: 4, reps: '6-10',  repos: 120 },
    { nom: 'Australian rows',      series: 3, reps: '10-12', repos: 60  },
    { nom: 'Tractions serrées',    series: 3, reps: '6-8',   repos: 120 }
  ],
  full_body: [
    { nom: 'Pompes classiques',   series: 3, reps: '12-15', repos: 60 },
    { nom: 'Tractions pronation', series: 3, reps: '6-10',  repos: 90 },
    { nom: 'Dips',                series: 3, reps: '8-12',  repos: 90 },
    { nom: 'Squats',              series: 3, reps: '15-20', repos: 60 }
  ],
  upper: [
    { nom: 'Pompes classiques',   series: 4, reps: '12-15', repos: 60  },
    { nom: 'Tractions pronation', series: 4, reps: '6-10',  repos: 90  },
    { nom: 'Dips',                series: 3, reps: '8-12',  repos: 90  },
    { nom: 'Australian rows',     series: 3, reps: '10-12', repos: 60  }
  ],
  lower: [
    { nom: 'Squats',                   series: 4, reps: '15-20',    repos: 60 },
    { nom: 'Fentes marchées',          series: 3, reps: '12/jambe', repos: 75 },
    { nom: 'Pistol squats assistés',   series: 3, reps: '5-8',      repos: 90 },
    { nom: 'Squats sautés',            series: 3, reps: '10-12',    repos: 60 }
  ],
  skills: [
    { nom: 'L-sit',            series: 5, reps: '10-20s', repos: 90  },
    { nom: 'Handstand (mur)',  series: 5, reps: '20-30s', repos: 90  },
    { nom: 'Planche lean',     series: 4, reps: '10-15s', repos: 120 },
    { nom: 'Front lever tuck', series: 4, reps: '10-15s', repos: 120 }
  ],
  core: [
    { nom: 'Gainage',       series: 4, reps: '45s',   repos: 45 },
    { nom: 'Hollow body',   series: 4, reps: '30s',   repos: 45 },
    { nom: 'Dragon flag',   series: 3, reps: '5-8',   repos: 90 },
    { nom: 'Obliques',      series: 3, reps: '15-20', repos: 45 }
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
   P4 — Exercices avec profil utilisateur + generateProgram
   ══════════════════════════════════════════════════ */
function _getExercicesForType(type) {
  if (!type || type === 'repos') return [];

  /* Tenter generateProgram avec profil complet */
  if (typeof generateProgram === 'function') {
    try {
      var userProfile = (typeof SW !== 'undefined' && SW.load) ? (SW.load('sw_userProfile') || {}) : {};
      var userStats   = (typeof SW !== 'undefined' && SW.load) ? (SW.load('sw_userStats')   || {}) : {};
      var fullProfile = {
        niveau:     userStats.niveau || userProfile.niveau || 'debutant',
        objectif:   userProfile.objectif || 'street_workout',
        equipement: userProfile.equipement || ['barre_traction', 'barres_paralleles']
      };
      var program = generateProgram(
        { type: type, objectif: fullProfile.objectif, niveau: fullProfile.niveau },
        fullProfile
      );
      if (program && program.exercices && program.exercices.length > 0) {
        return program.exercices.map(function(ex) {
          return {
            id:      ex.id,
            nom:     ex.nom,
            muscles: ex.muscles || [],
            series:  ex.series  || 3,
            reps:    ex.reps    || '10',
            repos:   ex.repos   || 60
          };
        });
      }
    } catch(e) {
      console.warn('generateProgram failed, using fallback:', e);
    }
  }

  /* Fallback hardcodé */
  var fallback = EXERCICES_FALLBACK[type] || EXERCICES_FALLBACK.full_body;
  return fallback.map(function(ex) {
    return Object.assign({ id: null, muscles: [] }, ex);
  });
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
