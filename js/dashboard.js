/* ========================================
   DASHBOARD.JS — Dashboard Logic (Supabase + Stats + Charts)
   ======================================== */

/* ── Cached profile & history ── */
var _profile = null;
var _history = [];

/* ==================== 5-LEVEL SYSTEM ==================== */
function calculateLevel(data) {
  var score = 0;

  if (data.pullups >= 20)      score += 25;
  else if (data.pullups >= 15) score += 20;
  else if (data.pullups >= 10) score += 14;
  else if (data.pullups >= 5)  score += 8;
  else if (data.pullups >= 1)  score += 3;

  if (data.dips >= 25)         score += 20;
  else if (data.dips >= 18)    score += 15;
  else if (data.dips >= 12)    score += 10;
  else if (data.dips >= 6)     score += 5;
  else if (data.dips >= 1)     score += 2;

  if (data.pushups >= 50)      score += 15;
  else if (data.pushups >= 35) score += 11;
  else if (data.pushups >= 20) score += 7;
  else if (data.pushups >= 10) score += 4;
  else if (data.pushups >= 1)  score += 2;

  if (data.squats >= 60)       score += 10;
  else if (data.squats >= 40)  score += 7;
  else if (data.squats >= 20)  score += 4;
  else if (data.squats >= 5)   score += 2;

  if (data.muscleup === 'oui') score += 15;
  score += (parseInt(data.frontlever) || 0) * 2;
  score += (parseInt(data.handstand) || 0) * 2;
  score += (parseInt(data.hspu) || 0) * 3;

  if (data.pullups20 >= 1)      score += 5;
  else if (data.pullups10 >= 1) score += 3;
  else if (data.pullups5 >= 1)  score += 1;

  score = Math.min(score, 100);

  if (score >= 85) return { level: 'Élite',         color: '#7C3AED', icon: '👑', score: score };
  if (score >= 65) return { level: 'Avancé',         color: '#16A34A', icon: '🔥', score: score };
  if (score >= 45) return { level: 'Intermédiaire',  color: '#0284C7', icon: '⚡', score: score };
  if (score >= 20) return { level: 'Novice',         color: '#EA580C', icon: '🌟', score: score };
  return              { level: 'Débutant',        color: '#94A3B8', icon: '🌱', score: score };
}

function getTargets(levelName) {
  var map = {
    'Élite':         { pullups: 25, dips: 30, pushups: 60, squats: 80 },
    'Avancé':        { pullups: 20, dips: 25, pushups: 50, squats: 60 },
    'Intermédiaire': { pullups: 15, dips: 18, pushups: 35, squats: 40 },
    'Novice':        { pullups: 10, dips: 12, pushups: 20, squats: 25 }
  };
  return map[levelName] || { pullups: 5, dips: 8, pushups: 10, squats: 15 };
}

/* ==================== INIT (async) ==================== */
async function initDashboard() {
  var user = await requireAuth();
  if (!user) return;

  await loadProfile(user.id);
  loadFormFromProfile();
  updateStatsCards();
  await loadHistory(user.id);
  renderCharts();

  var saveBtn = document.getElementById('save-data');
  if (saveBtn) saveBtn.addEventListener('click', function() { saveFormData(user.id); });

  /* Profile name editing */
  var editNameBtn = document.getElementById('edit-name-btn');
  var nameDisplay = document.getElementById('profile-name-display');
  var nameInput = document.getElementById('profile-name-input');
  var saveNameBtn = document.getElementById('save-name-btn');

  if (editNameBtn) {
    editNameBtn.addEventListener('click', function() {
      nameDisplay.style.display = 'none';
      editNameBtn.style.display = 'none';
      nameInput.style.display = 'block';
      saveNameBtn.style.display = 'inline-flex';
      nameInput.value = nameDisplay.textContent;
      nameInput.focus();
    });
  }

  if (saveNameBtn) {
    saveNameBtn.addEventListener('click', async function() {
      var name = nameInput.value.trim() || 'Athlète';
      await SB.from('profiles').update({ full_name: name }).eq('id', user.id);
      _profile.full_name = name;
      nameDisplay.textContent = name;
      nameDisplay.style.display = 'block';
      editNameBtn.style.display = 'inline-flex';
      nameInput.style.display = 'none';
      saveNameBtn.style.display = 'none';
      updateAvatar(name);
      showToast('Nom mis à jour !');
    });
  }

  if (nameInput) {
    nameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); saveNameBtn.click(); }
    });
  }
}

/* ==================== LOAD PROFILE FROM SUPABASE ==================== */
async function loadProfile(userId) {
  var res = await SB.from('profiles').select('*').eq('id', userId).single();
  _profile = res.data || {};
  var name = _profile.full_name || 'Athlète';
  var nameDisplay = document.getElementById('profile-name-display');
  if (nameDisplay) nameDisplay.textContent = name;
  updateAvatar(name);
}

/* Update avatar with initials */
function updateAvatar(name) {
  var avatar = document.getElementById('profile-avatar');
  if (!avatar) return;
  var parts = name.trim().split(/\s+/);
  var initials = parts.map(function(p) { return p.charAt(0).toUpperCase(); }).join('').substring(0, 2);
  avatar.textContent = initials || 'A';
}

/* ==================== LOAD FORM FROM PROFILE ==================== */
var FORM_FIELDS = ['weight','height','age','pullups','pullups5','pullups10','pullups20','dips','dips5','dips10','dips20','pushups','pushups-explo','squats','squats-weighted'];

function loadFormFromProfile() {
  if (!_profile) return;
  var data = _profile;

  /* Map Supabase column names to form field ids */
  var mapping = {
    'weight': data.poids,
    'height': data.taille,
    'age': data.age,
    'pullups': data.pullups,
    'pullups5': data.pullups_5,
    'pullups10': data.pullups_10,
    'pullups20': data.pullups_20,
    'dips': data.dips,
    'dips5': data.dips_5,
    'dips10': data.dips_10,
    'dips20': data.dips_20,
    'pushups': data.pushups,
    'pushups-explo': data.pushups_explo,
    'squats': data.squats,
    'squats-weighted': data.squats_weighted
  };

  Object.keys(mapping).forEach(function(f) {
    var el = document.getElementById('input-' + f);
    if (el && mapping[f] !== undefined && mapping[f] !== null && mapping[f] !== 0) el.value = mapping[f];
  });

  if (data.muscleup) {
    var radio = document.querySelector('input[name="muscleup"][value="' + data.muscleup + '"]');
    if (radio) radio.checked = true;
  }

  var selects = { frontlever: data.frontlever, handstand: data.handstand, hspu: data.hspu };
  Object.keys(selects).forEach(function(key) {
    var el = document.getElementById('input-' + key);
    if (el && selects[key] !== undefined && selects[key] !== null) el.value = selects[key];
  });
}

/* ==================== SAVE FORM DATA TO SUPABASE ==================== */
async function saveFormData(userId) {
  var poids = parseFloat(document.getElementById('input-weight').value) || 0;
  var taille = parseInt(document.getElementById('input-height').value) || 0;
  var imc = (poids > 0 && taille > 0) ? parseFloat((poids / Math.pow(taille / 100, 2)).toFixed(1)) : null;

  var updates = {
    poids:           poids,
    taille:          taille,
    age:             parseInt(document.getElementById('input-age').value) || 0,
    imc:             imc,
    pullups:         parseInt(document.getElementById('input-pullups').value) || 0,
    pullups_5:       parseInt(document.getElementById('input-pullups5').value) || 0,
    pullups_10:      parseInt(document.getElementById('input-pullups10').value) || 0,
    pullups_20:      parseInt(document.getElementById('input-pullups20').value) || 0,
    dips:            parseInt(document.getElementById('input-dips').value) || 0,
    dips_5:          parseInt(document.getElementById('input-dips5').value) || 0,
    dips_10:         parseInt(document.getElementById('input-dips10').value) || 0,
    dips_20:         parseInt(document.getElementById('input-dips20').value) || 0,
    pushups:         parseInt(document.getElementById('input-pushups').value) || 0,
    pushups_explo:   parseInt(document.getElementById('input-pushups-explo').value) || 0,
    squats:          parseInt(document.getElementById('input-squats').value) || 0,
    squats_weighted: parseInt(document.getElementById('input-squats-weighted').value) || 0,
    muscleup:        (document.querySelector('input[name="muscleup"]:checked') || {}).value || 'non',
    frontlever:      parseInt(document.getElementById('input-frontlever').value) || 0,
    handstand:       parseInt(document.getElementById('input-handstand').value) || 0,
    hspu:            parseInt(document.getElementById('input-hspu').value) || 0,
    updated_at:      new Date().toISOString()
  };

  var res = await SB.from('profiles').update(updates).eq('id', userId);
  if (res.error) { showToast('Erreur sauvegarde : ' + res.error.message, 'error'); return; }

  /* Merge into local cache */
  Object.keys(updates).forEach(function(k) { _profile[k] = updates[k]; });

  /* Save a measure snapshot */
  await SB.from('mesures').insert({
    user_id: userId,
    poids: updates.poids,
    taille: updates.taille,
    imc: updates.imc,
    pullups: updates.pullups,
    dips: updates.dips,
    pushups: updates.pushups,
    squats: updates.squats
  });

  /* Reload history for charts */
  await loadHistory(userId);

  updateStatsCards();
  renderCharts();
  showToast('Données sauvegardées ! 💾');
}

/* ==================== LOAD HISTORY (mesures) ==================== */
async function loadHistory(userId) {
  var res = await SB.from('mesures').select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(30);
  _history = res.data || [];
}

/* ==================== UPDATE STATS CARDS ==================== */
function updateStatsCards() {
  var data = _profile || {};
  if (!data.pullups && !data.dips && !data.pushups && !data.squats) {
    var badge = document.getElementById('level-badge');
    if (badge) { badge.textContent = '🌱 Débutant'; badge.style.color = '#FF6B35'; }
    return;
  }

  var result = calculateLevel(data);
  var targets = getTargets(result.level);

  var badge = document.getElementById('level-badge');
  if (badge) {
    badge.textContent = result.icon + ' ' + result.level;
    badge.style.color = result.color;
    badge.style.borderColor = result.color;
    badge.style.background = result.color + '18';
    badge.classList.add('badge-bounce');
    setTimeout(function() { badge.classList.remove('badge-bounce'); }, 600);
  }

  var scoreEl = document.getElementById('score-value');
  if (scoreEl) scoreEl.textContent = result.score + '/100';

  var exercises = [
    { key: 'pullups', target: targets.pullups },
    { key: 'dips', target: targets.dips },
    { key: 'pushups', target: targets.pushups },
    { key: 'squats', target: targets.squats }
  ];

  exercises.forEach(function(ex) {
    var valueEl = document.getElementById('stat-' + ex.key + '-value');
    var barEl = document.getElementById('stat-' + ex.key + '-bar');
    var targetEl = document.getElementById('stat-' + ex.key + '-target');

    if (valueEl) valueEl.textContent = data[ex.key] || 0;
    if (targetEl) targetEl.textContent = 'Objectif : ' + ex.target + ' reps';
    if (barEl) {
      var pct = Math.min(((data[ex.key] || 0) / ex.target) * 100, 100);
      barEl.style.width = pct + '%';
    }
  });
}

/* ==================== CHARTS ==================== */
var _charts = {};

function renderCharts() {
  var history = _history;
  var container = document.getElementById('chart-container');
  if (!container) return;

  if (history.length < 2) {
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">'
      + '<p style="font-size:2rem;margin-bottom:8px;">📊</p>'
      + '<p>Sauvegarde tes premières données pour voir ta progression.</p>'
      + '<p style="font-size:0.8rem;margin-top:4px;">Il faut au moins 2 enregistrements.</p></div>';
    return;
  }

  if (typeof Chart === 'undefined') return;

  var labels = history.map(function(h) {
    var d = new Date(h.created_at);
    return (d.getDate()) + '/' + (d.getMonth() + 1);
  });

  container.innerHTML =
    '<div class="charts-grid">'
    + '<div class="chart-wrap"><canvas id="chart-pullups"></canvas><div class="chart-label">💪 Tractions</div></div>'
    + '<div class="chart-wrap"><canvas id="chart-dips"></canvas><div class="chart-label">🔥 Dips</div></div>'
    + '<div class="chart-wrap"><canvas id="chart-pushups"></canvas><div class="chart-label">⚡ Pompes</div></div>'
    + '<div class="chart-wrap"><canvas id="chart-weight"></canvas><div class="chart-label">⚖️ Poids (kg)</div></div>'
    + '</div>';

  var defs = [
    { id: 'chart-pullups', key: 'pullups', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
    { id: 'chart-dips',    key: 'dips',    color: '#0284C7', bg: 'rgba(2,132,199,0.1)'  },
    { id: 'chart-pushups', key: 'pushups', color: '#EA580C', bg: 'rgba(234,88,12,0.1)'  },
    { id: 'chart-weight',  key: 'poids',   color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' }
  ];

  defs.forEach(function(def) {
    var canvas = document.getElementById(def.id);
    if (!canvas) return;
    if (_charts[def.id]) { _charts[def.id].destroy(); }
    var values = history.map(function(h) { return h[def.key] || 0; });
    _charts[def.id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          borderColor: def.color,
          backgroundColor: def.bg,
          borderWidth: 2.5,
          pointBackgroundColor: def.color,
          pointRadius: 4,
          tension: 0.35,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(15,23,42,0.05)' }, ticks: { color: '#94A3B8', font: { size: 10 } } },
          y: { grid: { color: 'rgba(15,23,42,0.05)' }, ticks: { color: '#94A3B8', font: { size: 10 } }, beginAtZero: true }
        }
      }
    });
  });
}

/* Run on DOM ready */
document.addEventListener('DOMContentLoaded', initDashboard);
