/* ========================================
   ANALYTICS.JS — Analytics Page (Supabase + Chart.js)
   ======================================== */

var _anCharts = {};

async function initAnalytics() {
  var user = await requireAuth();
  if (!user) return;

  /* Load data in parallel */
  var results = await Promise.all([
    SB.from('profiles').select('*').eq('id', user.id).single(),
    SB.from('mesures').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(30),
    SB.from('sessions').select('id').eq('user_id', user.id),
    SB.from('performances').select('id').eq('user_id', user.id),
    SB.from('progression_skills').select('skill_id, status').eq('user_id', user.id)
  ]);

  var profile = results[0].data || {};
  var mesures = results[1].data || [];
  var sessions = results[2].data || [];
  var perfs = results[3].data || [];
  var skills = results[4].data || [];

  var masteredCount = 0;
  skills.forEach(function(s) { if (s.status === 'mastered') masteredCount++; });

  /* Overview cards */
  var scoreEl = document.getElementById('an-score');
  if (scoreEl) {
    var score = calculateScoreFromProfile(profile);
    scoreEl.textContent = score + '/100';
  }

  var sessEl = document.getElementById('an-sessions');
  if (sessEl) sessEl.textContent = sessions.length;

  var recEl = document.getElementById('an-records');
  if (recEl) recEl.textContent = perfs.length;

  var skillEl = document.getElementById('an-skills');
  if (skillEl) skillEl.textContent = masteredCount;

  /* Performance evolution chart */
  renderEvolutionChart(mesures);

  /* Radar chart */
  renderRadarChart(profile);

  /* Measures table */
  renderMeasuresTable(mesures);

  /* Graphiques avancés depuis localStorage */
  var localSessions = (typeof SW !== 'undefined' ? SW.load('sessions') : null) || [];
  renderWeeklyVolumeChart(localSessions);
  renderFrequencyHeatmap(localSessions);
  renderComparisonRadar(profile);
  renderComparisonTable(profile);
}

/* Calculate score from profile (same logic as dashboard) */
function calculateScoreFromProfile(data) {
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

  if (data.pullups_20 >= 1)      score += 5;
  else if (data.pullups_10 >= 1) score += 3;
  else if (data.pullups_5 >= 1)  score += 1;

  return Math.min(score, 100);
}

/* Evolution line charts */
function renderEvolutionChart(mesures) {
  var container = document.getElementById('an-chart-container');
  if (!container) return;

  if (mesures.length < 2) {
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">' +
      '<p style="font-size:2rem;"></p>' +
      '<p>Il faut au moins 2 enregistrements pour afficher les graphiques.</p></div>';
    return;
  }

  if (typeof Chart === 'undefined') return;

  var labels = mesures.map(function(m) {
    var d = new Date(m.created_at);
    return d.getDate() + '/' + (d.getMonth() + 1);
  });

  container.innerHTML =
    '<div class="charts-grid">' +
    '<div class="chart-wrap"><canvas id="an-chart-pullups"></canvas><div class="chart-label">Tractions</div></div>' +
    '<div class="chart-wrap"><canvas id="an-chart-dips"></canvas><div class="chart-label">Dips</div></div>' +
    '<div class="chart-wrap"><canvas id="an-chart-pushups"></canvas><div class="chart-label">Pompes</div></div>' +
    '<div class="chart-wrap"><canvas id="an-chart-poids"></canvas><div class="chart-label">Poids</div></div>' +
    '</div>';

  var defs = [
    { id: 'an-chart-pullups', key: 'pullups', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
    { id: 'an-chart-dips',    key: 'dips',    color: '#0284C7', bg: 'rgba(2,132,199,0.1)' },
    { id: 'an-chart-pushups', key: 'pushups', color: '#EA580C', bg: 'rgba(234,88,12,0.1)' },
    { id: 'an-chart-poids',   key: 'poids',   color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' }
  ];

  defs.forEach(function(def) {
    var canvas = document.getElementById(def.id);
    if (!canvas) return;
    if (_anCharts[def.id]) _anCharts[def.id].destroy();
    var values = mesures.map(function(m) { return m[def.key] || 0; });
    _anCharts[def.id] = new Chart(canvas, {
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

/* Radar chart */
function renderRadarChart(profile) {
  var canvas = document.getElementById('an-radar-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (_anCharts['radar']) _anCharts['radar'].destroy();

  var pullups = Math.min((profile.pullups || 0) / 25, 1) * 100;
  var dips = Math.min((profile.dips || 0) / 30, 1) * 100;
  var pushups = Math.min((profile.pushups || 0) / 60, 1) * 100;
  var squats = Math.min((profile.squats || 0) / 80, 1) * 100;
  var fl = Math.min((profile.frontlever || 0) / 5, 1) * 100;
  var hs = Math.min((profile.handstand || 0) / 7, 1) * 100;

  _anCharts['radar'] = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Tractions', 'Dips', 'Pompes', 'Squats', 'Front Lever', 'Handstand'],
      datasets: [{
        label: 'Niveau actuel (%)',
        data: [pullups, dips, pushups, squats, fl, hs],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#2563EB',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#94A3B8', stepSize: 25, backdropColor: 'transparent', font: { size: 9 } },
          grid: { color: 'rgba(15,23,42,0.08)' },
          pointLabels: { color: '#475569', font: { size: 11 } }
        }
      }
    }
  });
}

/* Measures history table */
function renderMeasuresTable(mesures) {
  var container = document.getElementById('an-measures-table');
  if (!container) return;

  if (mesures.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);">Aucune mesure enregistrée.</p>';
    return;
  }

  var last10 = mesures.slice(-10).reverse();

  var html = '<table><thead><tr>' +
    '<th>Date</th><th>Poids</th><th>IMC</th><th>Tractions</th><th>Dips</th><th>Pompes</th><th>Squats</th>' +
    '</tr></thead><tbody>';

  last10.forEach(function(m) {
    var d = new Date(m.created_at);
    var dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    html += '<tr>' +
      '<td>' + dateStr + '</td>' +
      '<td>' + (m.poids || '—') + '</td>' +
      '<td>' + (m.imc || '—') + '</td>' +
      '<td>' + (m.pullups || 0) + '</td>' +
      '<td>' + (m.dips || 0) + '</td>' +
      '<td>' + (m.pushups || 0) + '</td>' +
      '<td>' + (m.squats || 0) + '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initAnalytics);

/* ==================== GRAPHIQUES AVANCÉS ==================== */

/* Graphique 4 — Volume hebdomadaire (barres) */
function renderWeeklyVolumeChart(sessions) {
  var container = document.getElementById('an-volume-container');
  if (!container) return;

  if (!sessions || sessions.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:30px;color:var(--text-muted);">Aucune session enregistr\u00e9e via le mode s\u00e9ance.</p>';
    return;
  }

  if (typeof Chart === 'undefined') return;

  // Grouper par semaine (dernières 8 semaines)
  var weekMap = {};
  sessions.forEach(function(s) {
    if (!s.date) return;
    var d = new Date(s.date);
    // Numéro de semaine ISO simplifié
    var startOfYear = new Date(d.getFullYear(), 0, 1);
    var weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    var weekKey = d.getFullYear() + '-W' + (weekNum < 10 ? '0' : '') + weekNum;
    if (!weekMap[weekKey]) weekMap[weekKey] = 0;
    weekMap[weekKey] += (s.volume_total || 0);
  });

  var sortedWeeks = Object.keys(weekMap).sort().slice(-8);
  if (sortedWeeks.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:30px;color:var(--text-muted);">Pas assez de donn\u00e9es.</p>';
    return;
  }

  container.innerHTML = '<canvas id="an-volume-chart"></canvas>';
  var canvas = document.getElementById('an-volume-chart');
  if (!canvas) return;

  if (_anCharts['volume']) _anCharts['volume'].destroy();
  _anCharts['volume'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sortedWeeks.map(function(w) { return w.replace(/^\d{4}-/, ''); }),
      datasets: [{
        data: sortedWeeks.map(function(w) { return weekMap[w]; }),
        backgroundColor: 'rgba(37,99,235,0.25)',
        borderColor: '#00FF87',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { beginAtZero: true, ticks: { color: '#94A3B8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

/* Graphique 5 — Heatmap fréquence d'entraînement */
function renderFrequencyHeatmap(sessions) {
  var container = document.getElementById('an-heatmap-container');
  if (!container) return;

  // Construire un set des dates avec séance
  var datesWithSession = {};
  (sessions || []).forEach(function(s) {
    if (s.date) datesWithSession[s.date] = true;
  });

  var today = new Date();
  var html = '<div class="heatmap-grid">';

  // Générer les 63 derniers jours (9 semaines × 7 jours)
  var dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  html += '<div class="heatmap-labels">';
  dayLabels.forEach(function(l) { html += '<div class="heatmap-label">' + l + '</div>'; });
  html += '</div>';

  // Construire les colonnes (semaines)
  var days = [];
  for (var i = 62; i >= 0; i--) {
    var d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // Aligner sur lundi
  var paddingDays = (days[0].getDay() + 6) % 7; // 0=lundi
  html += '<div class="heatmap-weeks">';
  // Padding pour aligner
  var totalCells = paddingDays + days.length;
  var weeks = Math.ceil(totalCells / 7);
  for (var w = 0; w < weeks; w++) {
    html += '<div class="heatmap-week">';
    for (var weekDay = 0; weekDay < 7; weekDay++) {
      var cellIdx = w * 7 + weekDay - paddingDays;
      if (cellIdx < 0 || cellIdx >= days.length) {
        html += '<div class="heatmap-cell heatmap-cell--empty"></div>';
      } else {
        var dayDate = days[cellIdx];
        var dateStr = dayDate.toISOString().slice(0, 10);
        var hasSession = !!datesWithSession[dateStr];
        var isToday = dateStr === today.toISOString().slice(0, 10);
        html += '<div class="heatmap-cell' +
          (hasSession ? ' heatmap-cell--active' : '') +
          (isToday ? ' heatmap-cell--today' : '') +
          '" title="' + dateStr + '"></div>';
      }
    }
    html += '</div>';
  }
  html += '</div></div>';
  html += '<div class="heatmap-legend"><span>Moins</span><span class="heatmap-cell"></span><span class="heatmap-cell heatmap-cell--active"></span><span>Plus</span></div>';

  container.innerHTML = html;
}

/* Graphique 6 — Radar comparaison aux standards */
function renderComparisonRadar(profile) {
  var canvas = document.getElementById('an-comparison-radar');
  if (!canvas || typeof Chart === 'undefined') return;

  var standards = {
    tractions:  [3, 8, 15, 20],
    dips:       [5, 12, 20, 30],
    pompes:     [10, 25, 40, 60],
    squats:     [15, 40, 80, 120]
  };

  var pullups = profile.pullups || 0;
  var dips = profile.dips || 0;
  var pushups = profile.pushups || 0;
  var squats = profile.squats || 0;

  // Pourcentage par rapport au niveau élite
  function pct(val, elite) { return Math.min(Math.round((val / elite) * 100), 100); }

  var userData = [
    pct(pullups, 20),
    pct(dips, 30),
    pct(pushups, 60),
    pct(squats, 120)
  ];

  if (_anCharts['compRadar']) _anCharts['compRadar'].destroy();
  _anCharts['compRadar'] = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['Tractions', 'Dips', 'Pompes', 'Squats'],
      datasets: [
        {
          label: 'Ton niveau (%)',
          data: userData,
          borderColor: '#00FF87',
          backgroundColor: 'rgba(37,99,235,0.15)',
          borderWidth: 2,
          pointBackgroundColor: '#00FF87',
          pointRadius: 5
        },
        {
          label: 'Standard avanc\u00e9 (100%)',
          data: [100, 100, 100, 100],
          borderColor: 'rgba(255,107,53,0.4)',
          backgroundColor: 'rgba(255,107,53,0.06)',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [4, 4]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, labels: { color: '#94A3B8', font: { size: 11 } } }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#94A3B8', stepSize: 25, backdropColor: 'transparent', font: { size: 9 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          pointLabels: { color: '#94A3B8', font: { size: 11 } }
        }
      }
    }
  });
}

/* Tableau comparaison performances vs standards */
function renderComparisonTable(profile) {
  var container = document.getElementById('an-comparison-table');
  if (!container) return;

  /*
   * Reference thresholds (reps max, bodyweight) — MDPI Nutrients 2025 / NSCA Position Statement
   * Columns: [Débutant, Novice, Intermédiaire, Avancé, Élite]
   */
  var rows = [
    {
      nom: 'Tractions', emoji: '',
      perf: profile.pullups || 0,
      niveaux: [3, 8, 12, 18, 23],
      note: 'Epley 1RM / BW : <1.0, 1.0\u20131.3, 1.3\u20131.7, 1.7\u20132.1, >2.1'
    },
    {
      nom: 'Dips', emoji: '',
      perf: profile.dips || 0,
      niveaux: [5, 12, 18, 25, 35],
      note: 'Epley 1RM / BW : <1.0, 1.0\u20131.4, 1.4\u20131.8, 1.8\u20132.2, >2.2'
    },
    {
      nom: 'Pompes', emoji: '',
      perf: profile.pushups || 0,
      niveaux: [10, 20, 35, 50, 70],
      note: 'Charge effective ~64% BW (Winter 1990)'
    },
    {
      nom: 'Squats', emoji: '',
      perf: profile.squats || 0,
      niveaux: [15, 40, 70, 100, 140],
      note: 'Reps BW — référentiel NSCA'
    }
  ];

  var levelNames  = ['D\u00e9butant', 'Novice', 'Interm\u00e9diaire', 'Avanc\u00e9', '\u00c9lite'];
  var levelColors = ['#94A3B8',      '#EA580C', '#0284C7',         '#16A34A',  '#7C3AED'];

  function getLevel(val, niveaux) {
    for (var i = niveaux.length - 1; i >= 0; i--) {
      if (val >= niveaux[i]) return i;
    }
    return -1;
  }

  var html =
    '<div class="comparison-table-wrap">' +
    '<p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px;text-align:right">' +
    'Sources : MDPI Nutrients 2025 · NSCA 2016 · Epley 1RM / BW' +
    '</p>' +
    '<table class="comparison-table"><thead><tr>' +
    '<th>Exercice</th><th>Ta perf</th>' +
    levelNames.map(function(n, i) {
      return '<th style="color:' + levelColors[i] + '">' + n + '</th>';
    }).join('') +
    '<th>Niveau actuel</th>' +
    '</tr></thead><tbody>';

  rows.forEach(function(r) {
    var lvl = getLevel(r.perf, r.niveaux);
    var lvlLabel = lvl >= 0 ? levelNames[lvl] : 'Avant d\u00e9butant';
    var lvlColor = lvl >= 0 ? levelColors[lvl] : '#475569';

    html += '<tr title="' + r.note + '">';
    html += '<td style="font-weight:600">' + r.emoji + ' ' + r.nom + '</td>';
    html += '<td style="font-weight:700;color:var(--primary);font-size:1.05rem">' + r.perf + '</td>';
    r.niveaux.forEach(function(n, i) {
      var isCurrent = (lvl === i);
      var isNextTarget = (lvl === i - 1);
      html += '<td style="'
        + (isCurrent    ? 'background:rgba(37,99,235,0.13);font-weight:700;' : '')
        + (isNextTarget ? 'background:rgba(255,107,53,0.08);' : '')
        + '">'
        + n
        + (isNextTarget ? ' <span style="font-size:10px;color:#EA580C"></span>' : '')
        + '</td>';
    });
    html += '<td><span style="color:' + lvlColor + ';font-weight:700;font-size:12px">' + lvlLabel + '</span></td>';
    html += '</tr>';
  });

  html += '</tbody></table>' +
    '<p style="font-size:0.7rem;color:var(--text-muted);margin-top:6px">' +
    'Prochain palier à atteindre · Valeurs en reps max poids de corps' +
    '</p></div>';
  container.innerHTML = html;
}

