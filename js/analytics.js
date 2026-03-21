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
      '<p style="font-size:2rem;">📊</p>' +
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
    '<div class="chart-wrap"><canvas id="an-chart-pullups"></canvas><div class="chart-label">💪 Tractions</div></div>' +
    '<div class="chart-wrap"><canvas id="an-chart-dips"></canvas><div class="chart-label">🔥 Dips</div></div>' +
    '<div class="chart-wrap"><canvas id="an-chart-pushups"></canvas><div class="chart-label">⚡ Pompes</div></div>' +
    '<div class="chart-wrap"><canvas id="an-chart-poids"></canvas><div class="chart-label">⚖️ Poids</div></div>' +
    '</div>';

  var defs = [
    { id: 'an-chart-pullups', key: 'pullups', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
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
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22,163,74,0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#16A34A',
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
