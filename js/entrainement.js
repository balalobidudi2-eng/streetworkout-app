/* ========================================
   ENTRAINEMENT.JS — Weekly Training (Supabase)
   ======================================== */

var _entUserId = null;

var PROGRAMME = {
  lundi:    { nom: 'PUSH', muscles: 'Pecs, Épaules, Triceps', couleur: '#FF6B6B' },
  mardi:    { nom: 'REPOS / CARDIO', muscles: 'Récupération active', couleur: '#FFD93D' },
  mercredi: { nom: 'PULL', muscles: 'Dos, Biceps, Avant-bras', couleur: '#6BCB77' },
  jeudi:    { nom: 'REPOS / CARDIO', muscles: 'Récupération active', couleur: '#FFD93D' },
  vendredi: { nom: 'LEGS', muscles: 'Quadriceps, Ischio, Mollets', couleur: '#4D96FF' },
  samedi:   { nom: 'SKILLS', muscles: 'Figures, Équilibre, Gainage', couleur: '#9B59B6' },
  dimanche: { nom: 'REPOS TOTAL', muscles: 'Repos complet', couleur: '#95A5A6' }
};

var EXERCICES = {
  PUSH: [
    { nom: 'Pompes classiques', series: 4, reps: '12-15' },
    { nom: 'Dips', series: 4, reps: '8-12' },
    { nom: 'Pompes diamant', series: 3, reps: '10-12' },
    { nom: 'Pike push-ups', series: 3, reps: '8-10' },
    { nom: 'Pompes déclinées', series: 3, reps: '10-12' }
  ],
  PULL: [
    { nom: 'Tractions pronation', series: 4, reps: '6-10' },
    { nom: 'Tractions supination', series: 4, reps: '6-10' },
    { nom: 'Australian rows', series: 3, reps: '10-12' },
    { nom: 'Tractions serrées', series: 3, reps: '6-8' },
    { nom: 'Dead hangs', series: 3, reps: '30s' }
  ],
  LEGS: [
    { nom: 'Squats', series: 4, reps: '15-20' },
    { nom: 'Fentes marchées', series: 3, reps: '12/jambe' },
    { nom: 'Pistol squats (assistés)', series: 3, reps: '5-8/jambe' },
    { nom: 'Squats sautés', series: 3, reps: '10-12' },
    { nom: 'Mollets debout', series: 4, reps: '15-20' }
  ],
  SKILLS: [
    { nom: 'L-sit', series: 5, reps: '10-20s' },
    { nom: 'Handstand (mur)', series: 5, reps: '20-30s' },
    { nom: 'Planche lean', series: 4, reps: '10-15s' },
    { nom: 'Front lever tuck', series: 4, reps: '10-15s' },
    { nom: 'Human flag (assist.)', series: 3, reps: '5-10s' }
  ]
};

var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function getToday() { return JOURS[new Date().getDay()]; }
function getTodayProgramme() { return PROGRAMME[getToday()]; }

/* ==================== INIT (async) ==================== */
async function initEntrainement() {
  try {
    var user = await requireAuth();
    if (!user) return;
    _entUserId = user.id;
  } catch(e) {
    console.error('Auth error:', e);
    window.location.href = 'login.html';
    return;
  }

  renderPlanning();
  renderTodaySession();
  initTimerUI();

  var saveBtn = document.getElementById('save-session');
  if (saveBtn) saveBtn.addEventListener('click', saveSession);

  try { await renderHistory(); } catch(e) { console.warn('History unavailable:', e); }
}

/* Render Weekly Planning Grid */
function renderPlanning() {
  var grid = document.getElementById('planning-grid');
  if (!grid) return;

  var today = getToday();
  var html = '';
  var joursOrdre = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  joursOrdre.forEach(function(jour) {
    var prog = PROGRAMME[jour];
    var isToday = jour === today;
    html += '<div class="planning-card' + (isToday ? ' planning-today' : '') + '">';
    html += '<div class="planning-jour">' + jour.charAt(0).toUpperCase() + jour.slice(1) + '</div>';
    html += '<div class="planning-type" style="color:' + prog.couleur + '">' + prog.nom + '</div>';
    html += '<div class="planning-muscles">' + prog.muscles + '</div>';
    if (isToday) html += '<span class="badge badge-primary">Aujourd\'hui</span>';
    html += '</div>';
  });

  grid.innerHTML = html;
}

/* Render Today's Session */
function renderTodaySession() {
  var container = document.getElementById('session-content');
  var title = document.getElementById('session-title');
  if (!container) return;

  var prog = getTodayProgramme();
  if (title) title.textContent = prog.nom + ' — ' + prog.muscles;

  var exos = EXERCICES[prog.nom];
  if (!exos) {
    container.innerHTML = '<div class="rest-day-msg"><p>🧘 Jour de repos</p><p>Profitez-en pour récupérer, vous étirer, ou faire une marche active.</p></div>';
    var saveBtn = document.getElementById('save-session');
    if (saveBtn) saveBtn.style.display = 'none';
    return;
  }

  var html = '<table class="session-table"><thead><tr>';
  html += '<th>Exercice</th><th>Séries</th><th>Reps</th><th>Fait</th>';
  html += '</tr></thead><tbody>';

  exos.forEach(function(ex, i) {
    html += '<tr>';
    html += '<td>' + ex.nom + '</td>';
    html += '<td>';
    for (var s = 0; s < ex.series; s++) {
      html += '<span class="serie-dot" data-exo="' + i + '" data-serie="' + s + '">●</span>';
    }
    html += '</td>';
    html += '<td>' + ex.reps + '</td>';
    html += '<td><input type="checkbox" class="exo-check" data-exo="' + i + '"></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('.serie-dot').forEach(function(dot) {
    dot.addEventListener('click', function() { dot.classList.toggle('done'); });
  });
}

/* Save Session to Supabase */
async function saveSession() {
  var checks = document.querySelectorAll('.exo-check');
  var total = checks.length;
  var done = 0;
  checks.forEach(function(c) { if (c.checked) done++; });

  var dots = document.querySelectorAll('.serie-dot');
  var totalSeries = dots.length;
  var doneSeries = 0;
  dots.forEach(function(d) { if (d.classList.contains('done')) doneSeries++; });

  var session = {
    user_id: _entUserId,
    jour: getToday(),
    type: getTodayProgramme().nom,
    exercices_faits: done + '/' + total,
    series_faites: doneSeries + '/' + totalSeries,
    completion: total > 0 ? Math.round((done / total) * 100) : 0
  };

  var res = await SB.from('sessions').insert(session);
  if (res.error) { showToast('Erreur sauvegarde session.', 'error'); return; }

  showToast('Session sauvegardée ! 💪');
  if (session.completion >= 80) launchConfetti();
  await renderHistory();
}

/* Render Session History (last 10) from Supabase */
async function renderHistory() {
  var container = document.getElementById('history-list');
  if (!container) return;

  var res = await SB.from('sessions').select('*').eq('user_id', _entUserId).order('created_at', { ascending: false }).limit(10);
  var sessions = res.data || [];

  if (sessions.length === 0) {
    container.innerHTML = '<p class="text-muted">Aucune session enregistrée.</p>';
    return;
  }

  var html = '';
  sessions.forEach(function(s) {
    var d = new Date(s.created_at);
    var dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    var pct = s.completion || 0;
    var color = pct >= 80 ? 'var(--primary)' : pct >= 50 ? '#FFD93D' : '#FF6B6B';

    html += '<div class="history-item">';
    html += '<div class="history-date">' + dateStr + '</div>';
    html += '<div class="history-type">' + (s.type || '—') + '</div>';
    html += '<div class="history-stats">';
    html += '<span>Exos: ' + (s.exercices_faits || '—') + '</span>';
    html += '<span>Séries: ' + (s.series_faites || '—') + '</span>';
    html += '</div>';
    html += '<div class="history-bar"><div class="history-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
    html += '<div class="history-pct" style="color:' + color + '">' + pct + '%</div>';
    html += '</div>';
  });

  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initEntrainement);
