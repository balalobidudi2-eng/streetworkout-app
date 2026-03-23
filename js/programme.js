/* ========================================
   PROGRAMME.JS — Logique page génération
   Dépend de : program-generator.js, wger-client.js,
               workout-mode.js, exercise-visuals.js, storage.js
   ======================================== */

var selectedType    = null;
var currentProgram  = null;
var _progUserProfile = {};

/* ══ Init ══════════════════════════════════════════ */
async function initProgramPage() {
  if (typeof requireAuth === 'function') {
    var user = await requireAuth();
    if (!user) return; // requireAuth redirige vers login si non authentifié
    await _loadProgramUserProfile(user.id);
  }
  _renderSessionTypeGrid();
  _renderDaysSelector();
  _renderHistory();

  var btnGenerate   = document.getElementById('btn-generate');
  var btnStart      = document.getElementById('btn-start-program');
  var btnSave       = document.getElementById('btn-save-program');
  var btnRegenerate = document.getElementById('btn-regenerate');

  if (btnGenerate)   btnGenerate.addEventListener('click', _handleGenerate);
  if (btnStart)      btnStart.addEventListener('click', _handleStartProgram);
  if (btnSave)       btnSave.addEventListener('click', _handleSaveProgram);
  if (btnRegenerate) btnRegenerate.addEventListener('click', _handleGenerate);
}

/* ── Charger le profil utilisateur depuis Supabase ── */
async function _loadProgramUserProfile(userId) {
  if (!window.SB) return;
  try {
    var res = await window.SB.from('profiles').select('*').eq('id', userId).single();
    if (res.data) _progUserProfile = res.data;
  } catch (e) { /* profil non critique */ }
}

/* ══ Grille de types de séance ══ */
function _renderSessionTypeGrid() {
  var grid = document.getElementById('session-type-grid');
  if (!grid) return;

  var html = '';
  Object.keys(SESSION_TYPES).forEach(function(key) {
    var type = SESSION_TYPES[key];
    html += '<button class="session-type-btn" data-type="' + type.id + '">' +
      (type.icon ? '<span class="session-type-icon">' + type.icon + '</span>' : '') +
      '<span class="session-type-label">' + type.label + '</span>' +
      '</button>';
  });
  grid.innerHTML = html;

  grid.querySelectorAll('.session-type-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { _selectSessionType(btn.dataset.type); });
  });
}

function _selectSessionType(type) {
  selectedType = type;

  document.querySelectorAll('.session-type-btn').forEach(function(b) {
    b.classList.toggle('session-type-btn--active', b.dataset.type === type);
  });

  var paramsSection = document.getElementById('section-params');
  if (paramsSection) {
    paramsSection.style.display = 'block';
    paramsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ══ Sélecteur de jours ══ */
function _renderDaysSelector() {
  var container = document.getElementById('days-selector');
  if (!container) return;

  var days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  container.innerHTML = days.map(function(d, i) {
    return '<button class="day-btn" data-day="' + i + '">' + d + '</button>';
  }).join('');

  container.querySelectorAll('.day-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      btn.classList.toggle('day-btn--active');
    });
  });
}

/* ══ Générer ══ */
async function _handleGenerate() {
  if (!selectedType) {
    showToast('Sélectionne un type de séance', 'error');
    return;
  }

  var durationSel = document.getElementById('duration-select');
  var objectifSel = document.getElementById('objectif-select');
  var niveauSel   = document.getElementById('niveau-select');
  var duree   = durationSel ? parseInt(durationSel.value) : 45;
  var objectif = objectifSel ? objectifSel.value : 'street_workout';
  var niveau   = niveauSel ? niveauSel.value : '';

  var btn = document.getElementById('btn-generate');
  if (btn) { btn.disabled = true; btn.textContent = 'Génération...'; }

  try {
    currentProgram = await generateProgram({ type: selectedType, duree: duree, objectif: objectif, niveau: niveau }, _progUserProfile);
    _renderProgram(currentProgram);
  } catch (err) {
    showToast('Erreur de génération. Réessaie.', 'error');
    console.error(err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Générer mon programme'; }
  }
}

/* ══ Carte exercice ══ */
function _renderExerciceCard(ex, index) {
  var musclesHtml = '';
  if (ex.muscles && ex.muscles.length) {
    musclesHtml = '<div class="ex-muscles">' +
      ex.muscles.slice(0, 3).map(function(m) {
        return '<span class="muscle-tag">' + m + '</span>';
      }).join('') +
      '</div>';
  }
  var noteHtml = ex.note
    ? '<div class="ex-note">' + ex.note + '</div>'
    : '';

  return '<div class="ex-card">' +
    '<div class="ex-card-num">' + (index + 1) + '</div>' +
    '<div class="ex-card-body">' +
      '<div class="ex-card-name">' + ex.nom + '</div>' +
      '<div class="ex-card-params">' +
        '<span class="ex-param">' + ex.series + ' s\u00e9ries</span>' +
        '<span class="ex-param-sep">\u00d7</span>' +
        '<span class="ex-param">' + ex.reps + '</span>' +
        '<span class="ex-param-sep">\u00b7</span>' +
        '<span class="ex-param">' + ex.repos + 's repos</span>' +
      '</div>' +
      musclesHtml +
      noteHtml +
    '</div>' +
    '</div>';
}

/* ══ Rendu du programme ══ */
function _renderProgram(program) {
  var section = document.getElementById('section-result');
  if (!section) return;
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });

  /* En-tête */
  var header = document.getElementById('program-header');
  if (header) {
    header.innerHTML =
      '<div class="program-title">' + program.nom + '</div>' +
      '<div class="program-meta">' +
        '<span class="badge">' + program.niveau + '</span>' +
        (program.objectif_label ? '<span class="badge badge--secondary">' + program.objectif_label + '</span>' : '') +
        '<span class="program-duration">\u23f1 ' + (program.label_duree || '') + ' \u2014 ' + program.duree_estimee + '</span>' +
        '<span class="program-date">' + program.date + '</span>' +
      '</div>';
  }

  /* Échauffement */
  var warmupEl = document.getElementById('warmup-list');
  if (warmupEl) {
    warmupEl.innerHTML = program.echauffement.map(function(w) {
      return '<div class="warmup-item">' +
        '<span class="warmup-name">' + w.nom + '</span>' +
        '<span class="warmup-duration">' + w.duree + '</span>' +
        '<p class="warmup-desc">' + w.desc + '</p>' +
        '</div>';
    }).join('');
  }

  /* Exercices */
  var exEl = document.getElementById('exercises-list');
  if (exEl) {
    exEl.innerHTML = program.exercices.map(function(ex, i) {
      return _renderExerciceCard(ex, i);
    }).join('');
  }

  /* Retour au calme */
  var cooldownEl = document.getElementById('cooldown-list');
  if (cooldownEl) {
    cooldownEl.innerHTML = program.retour_au_calme.map(function(c) {
      return '<div class="warmup-item">' +
        '<span class="warmup-name">' + c.nom + '</span>' +
        '<span class="warmup-duration">' + c.duree + '</span>' +
        '<p class="warmup-desc">' + c.desc + '</p>' +
        '</div>';
    }).join('');
  }
}

/* ══ Démarrer séance avec WorkoutMode ══ */
function _handleStartProgram() {
  if (!currentProgram) return;
  if (typeof WorkoutMode === 'undefined') {
    showToast('Mode séance non disponible.', 'error');
    return;
  }
  var wm = new WorkoutMode(currentProgram.exercices, currentProgram.nom);
  wm.mount();
}

/* ══ Sauvegarder ══ */
function _handleSaveProgram() {
  if (!currentProgram) return;
  saveGeneratedProgram(currentProgram);
  showToast('Programme sauvegardé');
  _renderHistory();
}

/* ══ Historique ══ */
function _renderHistory() {
  var container = document.getElementById('programs-history');
  if (!container) return;

  var programs = (typeof SW !== 'undefined') ? (SW.load('generated_programs') || []) : [];

  if (!programs.length) {
    container.innerHTML = '<p class="empty-state">Aucun programme sauvegardé</p>';
    return;
  }

  container.innerHTML = programs.slice(0, 5).map(function(p) {
    return '<div class="history-program-card">' +
      '<div class="history-program-info">' +
        '<div class="history-program-name">' + p.nom + '</div>' +
        '<div class="history-program-meta">' + p.date + ' \u00b7 ' + p.niveau + ' \u00b7 ' + p.duree_estimee + '</div>' +
      '</div>' +
      '<button class="btn btn-secondary history-load-btn" data-id="' + p.id + '">Charger</button>' +
      '</div>';
  }).join('');

  container.querySelectorAll('.history-load-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = parseInt(btn.dataset.id);
      var p = programs.find ? programs.find(function(x) { return x.id === id; })
        : (function() { for (var i = 0; i < programs.length; i++) { if (programs[i].id === id) return programs[i]; } return null; })();
      if (p) { currentProgram = p; _renderProgram(p); }
    });
  });
}

document.addEventListener('DOMContentLoaded', initProgramPage);
