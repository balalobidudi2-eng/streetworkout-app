/* ========================================
   STREETLIFTING.JS — Weight Tracking (Supabase)
   ======================================== */

var _slUserId = null;

var EQUIPMENT = [
  { id: 'vest', name: 'Gilet lesté', icon: '', maxKg: 40 },
  { id: 'belt', name: 'Ceinture lestée', icon: '', maxKg: 150 },
  { id: 'plates20', name: 'Disques 20 kg', icon: '', maxKg: 40 },
  { id: 'plates25', name: 'Disques 25 kg', icon: '', maxKg: 50 }
];

var SL_EXERCISES = [
  { id: 'weighted-pullups', name: 'Tractions lestées', icon: '' },
  { id: 'weighted-dips', name: 'Dips lestés', icon: '' }
];

async function initStreetlifting() {
  var user = await requireAuth();
  if (!user) return;
  _slUserId = user.id;

  renderEquipmentToggles();
  renderRecordForms();
  await renderRecordsTables();
  await renderProgressChart();
}

/* Render equipment toggles */
function renderEquipmentToggles() {
  var container = document.getElementById('equipment-list');
  if (!container) return;

  var saved = SW.load('equipment') || {};
  var html = '';

  EQUIPMENT.forEach(function(eq) {
    var checked = saved[eq.id] ? ' checked' : '';
    html += '<label class="equipment-item">' +
      '<div class="equipment-info">' +
      '<span class="equipment-icon">' + eq.icon + '</span>' +
      '<div>' +
      '<div class="equipment-name">' + eq.name + '</div>' +
      '<div class="equipment-max">Max ' + eq.maxKg + ' kg</div>' +
      '</div>' +
      '</div>' +
      '<label class="toggle">' +
      '<input type="checkbox" data-equip="' + eq.id + '"' + checked + ' onchange="saveEquipment()">' +
      '<span class="toggle-slider"></span>' +
      '</label>' +
      '</label>';
  });

  container.innerHTML = html;
}

function saveEquipment() {
  var checkboxes = document.querySelectorAll('[data-equip]');
  var data = {};
  checkboxes.forEach(function(cb) {
    data[cb.getAttribute('data-equip')] = cb.checked;
  });
  SW.save('equipment', data);
}

/* Render record forms */
function renderRecordForms() {
  var container = document.getElementById('record-forms');
  if (!container) return;

  var today = new Date().toISOString().split('T')[0];
  var html = '';

  SL_EXERCISES.forEach(function(ex) {
    html += '<div class="card record-form-card">' +
      '<h3>' + ex.icon + ' ' + ex.name + '</h3>' +
      '<div class="record-form-grid">' +
      '<div class="form-field">' +
      '<label>Date</label>' +
      '<input type="date" id="date-' + ex.id + '" value="' + today + '" class="form-input">' +
      '</div>' +
      '<div class="form-field">' +
      '<label>Charge ajoutée (kg)</label>' +
      '<input type="number" id="charge-' + ex.id + '" min="0" max="200" step="0.5" placeholder="Ex: 20" class="form-input">' +
      '</div>' +
      '<div class="form-field">' +
      '<label>Répétitions</label>' +
      '<input type="number" id="reps-' + ex.id + '" min="1" max="50" placeholder="Ex: 5" class="form-input">' +
      '</div>' +
      '<div class="form-field">' +
      '<label>Équipement</label>' +
      '<select id="equip-' + ex.id + '" class="form-input">' +
      '<option value="">Sélectionner...</option>';

    EQUIPMENT.forEach(function(eq) {
      html += '<option value="' + eq.id + '">' + eq.icon + ' ' + eq.name + '</option>';
    });

    html += '</select>' +
      '</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm" style="animation:none;margin-top:12px;" onclick="addRecord(\'' + ex.id + '\')">' +
      '<span class="btn-text">Enregistrer ce record</span>' +
      '</button>' +
      '<div class="table-container" style="margin-top:20px;" id="table-' + ex.id + '"></div>' +
      '</div>';
  });

  container.innerHTML = html;
}

/* Add a record to Supabase */
async function addRecord(exerciseId) {
  var date = document.getElementById('date-' + exerciseId).value;
  var charge = parseFloat(document.getElementById('charge-' + exerciseId).value);
  var reps = parseInt(document.getElementById('reps-' + exerciseId).value);
  var equip = document.getElementById('equip-' + exerciseId).value;

  if (!date || !charge || !reps) {
    showToast('Remplis tous les champs requis.', 'error');
    return;
  }
  if (charge <= 0 || reps <= 0) {
    showToast('Valeurs invalides.', 'error');
    return;
  }

  var equipName = '';
  EQUIPMENT.forEach(function(eq) {
    if (eq.id === equip) equipName = eq.icon + ' ' + eq.name;
  });

  var record = {
    user_id: _slUserId,
    exercise_id: exerciseId,
    date_perf: date,
    charge: charge,
    reps: reps,
    equip: equip || null,
    equip_name: equipName || 'Non spécifié',
    volume: charge * reps
  };

  var res = await SB.from('performances').insert(record);
  if (res.error) { showToast('Erreur : ' + res.error.message, 'error'); return; }

  document.getElementById('charge-' + exerciseId).value = '';
  document.getElementById('reps-' + exerciseId).value = '';

  await renderRecordTable(exerciseId);
  await renderProgressChart();
  showToast('Record enregistré');
}

/* Render all record tables */
async function renderRecordsTables() {
  for (var i = 0; i < SL_EXERCISES.length; i++) {
    await renderRecordTable(SL_EXERCISES[i].id);
  }
}

/* Render single record table from Supabase */
async function renderRecordTable(exerciseId) {
  var container = document.getElementById('table-' + exerciseId);
  if (!container) return;

  var res = await SB.from('performances').select('*').eq('user_id', _slUserId).eq('exercise_id', exerciseId).order('date_perf', { ascending: false }).limit(5);
  var records = res.data || [];

  if (records.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.9rem;">Aucun record enregistré.</p>';
    return;
  }

  /* Find PR */
  var maxVolume = 0;
  records.forEach(function(r) { if (r.volume > maxVolume) maxVolume = r.volume; });

  var html = '<table>' +
    '<thead><tr>' +
    '<th>Date</th><th>Charge</th><th>Reps</th><th>Équipement</th><th>Volume</th><th></th>' +
    '</tr></thead><tbody>';

  records.forEach(function(rec) {
    var prBadge = (rec.volume === maxVolume) ? ' <span class="badge badge-pr">PR</span>' : '';
    var prClass = (rec.volume === maxVolume) ? ' style="background:rgba(37,99,235,0.03);"' : '';

    html += '<tr' + prClass + '>' +
      '<td>' + rec.date_perf + '</td>' +
      '<td>' + rec.charge + ' kg</td>' +
      '<td>' + rec.reps + '</td>' +
      '<td>' + (rec.equip_name || '—') + '</td>' +
      '<td>' + rec.volume.toFixed(1) + ' kg' + prBadge + '</td>' +
      '<td><button class="btn btn-danger btn-sm" onclick="deleteRecord(\'' + rec.id + '\', \'' + exerciseId + '\')" style="padding:4px 10px;font-size:0.75rem;">✕</button></td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/* Delete a record by Supabase row id */
async function deleteRecord(recordId, exerciseId) {
  if (!confirm('Supprimer ce record ?')) return;
  await SB.from('performances').delete().eq('id', recordId).eq('user_id', _slUserId);
  await renderRecordTable(exerciseId);
  await renderProgressChart();
  showToast('Record supprimé.');
}

/* Progress chart (SVG) */
async function renderProgressChart() {
  var container = document.getElementById('sl-chart-container');
  if (!container) return;

  var resPull = await SB.from('performances').select('date_perf, volume').eq('user_id', _slUserId).eq('exercise_id', 'weighted-pullups').order('date_perf', { ascending: true });
  var resDips = await SB.from('performances').select('date_perf, volume').eq('user_id', _slUserId).eq('exercise_id', 'weighted-dips').order('date_perf', { ascending: true });

  var pullRecords = resPull.data || [];
  var dipsRecords = resDips.data || [];

  if (pullRecords.length < 2 && dipsRecords.length < 2) {
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">' +
      '<p></p><p>Enregistre au moins 2 records pour voir l\'évolution.</p></div>';
    return;
  }

  var width = container.clientWidth || 600;
  var height = 220;
  var padX = 50;
  var padY = 20;

  var allDates = [];
  var pullMap = {};
  var dipsMap = {};

  pullRecords.forEach(function(r) {
    if (allDates.indexOf(r.date_perf) === -1) allDates.push(r.date_perf);
    pullMap[r.date_perf] = (pullMap[r.date_perf] || 0) + r.volume;
  });
  dipsRecords.forEach(function(r) {
    if (allDates.indexOf(r.date_perf) === -1) allDates.push(r.date_perf);
    dipsMap[r.date_perf] = (dipsMap[r.date_perf] || 0) + r.volume;
  });

  allDates.sort();
  if (allDates.length < 2) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Besoin de plus de données.</div>';
    return;
  }

  var pullData = allDates.map(function(d) { return pullMap[d] || 0; });
  var dipsData = allDates.map(function(d) { return dipsMap[d] || 0; });
  var allVals = pullData.concat(dipsData).filter(function(v) { return v > 0; });
  var maxVal = Math.max.apply(null, allVals) || 1;
  maxVal = Math.ceil(maxVal * 1.15);

  var stepX = (width - padX * 2) / Math.max(allDates.length - 1, 1);

  function toPoint(data, i) {
    return {
      x: padX + i * stepX,
      y: height - padY - ((data[i] / maxVal) * (height - padY * 2))
    };
  }

  function buildPath(data) {
    var pts = [];
    data.forEach(function(v, i) {
      if (v > 0) pts.push(toPoint(data, i));
    });
    return pts.map(function(p, i) {
      return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');
  }

  function buildDots(data, color) {
    return data.map(function(v, i) {
      if (v <= 0) return '';
      var p = toPoint(data, i);
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4" fill="' + color + '"/>';
    }).join('');
  }

  var grid = '';
  for (var g = 0; g <= 4; g++) {
    var gy = padY + (g / 4) * (height - padY * 2);
    var gVal = Math.round(maxVal - (g / 4) * maxVal);
    grid += '<line x1="' + padX + '" y1="' + gy + '" x2="' + (width - padX) + '" y2="' + gy + '" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>';
    grid += '<text x="' + (padX - 8) + '" y="' + (gy + 4) + '" fill="var(--text-muted)" font-size="10" text-anchor="end">' + gVal + '</text>';
  }

  var svg = '<svg width="100%" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
    grid +
    '<path d="' + buildPath(pullData) + '" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + buildPath(dipsData) + '" fill="none" stroke="#00B4FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    buildDots(pullData, '#2563EB') +
    buildDots(dipsData, '#00B4FF') +
    '<circle cx="' + (width - padX - 80) + '" cy="12" r="5" fill="#2563EB"/>' +
    '<text x="' + (width - padX - 70) + '" y="16" fill="var(--text-secondary)" font-size="11">Tractions</text>' +
    '<circle cx="' + (width - padX - 80) + '" cy="28" r="5" fill="#00B4FF"/>' +
    '<text x="' + (width - padX - 70) + '" y="32" fill="var(--text-secondary)" font-size="11">Dips</text>' +
    '</svg>';

  container.innerHTML = svg;
}

document.addEventListener('DOMContentLoaded', initStreetlifting);
