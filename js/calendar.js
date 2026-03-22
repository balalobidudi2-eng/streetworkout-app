/* ========================================
   CALENDAR.JS — Calendrier interactif CRUD
   Sessions stockées dans SW.load('sessions') comme
   [{date:'YYYY-MM-DD', type, nom, notes, duree_min, exercices}]
   ======================================== */

var CAL_SESSION_LABELS = {
  full_body: { label: 'Full Body',    color: '#e63946' },
  pull:      { label: 'Pull',         color: '#457b9d' },
  push:      { label: 'Push',         color: '#e9c46a' },
  lower:     { label: 'Bas du corps', color: '#2a9d8f' },
  upper:     { label: 'Haut du corps',color: '#f4a261' },
  skills:    { label: 'Skills SW',    color: '#8338ec' },
  core:      { label: 'Core / Abdos', color: '#06d6a0' },
  libre:     { label: 'Libre',        color: '#adb5bd' },
};

var _calStartOffset = 0;
var _calContainer   = '';
var _calEditDate    = null;

/* ══════════════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════════════ */
function renderCalendar(containerId) {
  _calContainer = containerId || 'calendar-container';
  var container = document.getElementById(_calContainer);
  if (!container) return;

  var today    = new Date();
  var sessions = (typeof SW !== 'undefined' && SW.load) ? (SW.load('sessions') || []) : [];

  var days = [];
  for (var i = -7; i <= 6; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() + i + (_calStartOffset * 7));
    days.push(d);
  }

  var monthLabel = _calMonthRange(days);
  var todayStr   = today.toISOString().slice(0, 10);

  var html = '<div class="calendar-header">';
  html += '<button class="cal-nav-btn" id="cal-prev">\u2039 Pr\u00e9c</button>';
  html += '<span class="cal-month-label">' + monthLabel + '</span>';
  html += '<button class="cal-nav-btn" id="cal-next">Suiv \u203a</button>';
  html += '</div>';
  html += '<div class="cal-grid">';

  days.forEach(function(d) {
    var dateStr     = d.toISOString().slice(0, 10);
    var isToday     = dateStr === todayStr;
    var dayName     = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
    var dayNum      = d.getDate();
    var daySessions = sessions.filter(function(s) { return s.date === dateStr; });

    var cls = 'cal-day';
    if (isToday) cls += ' cal-day--today';
    if (daySessions.length) cls += ' cal-day--has-session';

    html += '<div class="' + cls + '" data-date="' + dateStr + '">';
    html += '<span class="cal-day-name">' + dayName + '</span>';
    html += '<span class="cal-day-num">' + dayNum + '</span>';

    daySessions.forEach(function(s) {
      var info = CAL_SESSION_LABELS[s.type] || CAL_SESSION_LABELS.libre;
      html += '<div class="cal-session-dot" style="background:' + info.color + '" title="' + info.label + '">' + info.label.slice(0, 2) + '</div>';
    });

    html += '<div class="cal-add-dot" title="Ajouter">+</div>';
    html += '</div>';
  });

  html += '</div>';

  /* Modal CRUD */
  html += '<div class="cal-modal" id="cal-modal" style="display:none">';
  html += '<div class="cal-modal-content">';
  html += '<h3 class="cal-modal-title" id="cal-modal-title">S\u00e9ance</h3>';
  html += '<div id="cal-existing-sessions"></div>';
  html += '<div class="cal-modal-form">';
  html += '<label>Type\u00a0<select id="cal-type-select" class="cal-select">';
  Object.keys(CAL_SESSION_LABELS).forEach(function(k) {
    html += '<option value="' + k + '">' + CAL_SESSION_LABELS[k].label + '</option>';
  });
  html += '</select></label>';
  html += '<label>Notes\u00a0<input type="text" id="cal-notes-input" class="cal-input" placeholder="Notes optionnelles" maxlength="120"></label>';
  html += '<label>Dur\u00e9e (min)\u00a0<input type="number" id="cal-duree-input" class="cal-input" min="5" max="240" value="45"></label>';
  html += '</div>';
  html += '<div class="cal-modal-actions">';
  html += '<button id="cal-modal-save" class="btn btn-primary">Enregistrer</button>';
  html += '<button id="cal-modal-cancel" class="btn btn-secondary">Annuler</button>';
  html += '</div></div></div>';

  container.innerHTML = html;

  var prevBtn = document.getElementById('cal-prev');
  if (prevBtn) prevBtn.addEventListener('click', function() { _calStartOffset--; renderCalendar(_calContainer); });
  var nextBtn = document.getElementById('cal-next');
  if (nextBtn) nextBtn.addEventListener('click', function() { _calStartOffset++; renderCalendar(_calContainer); });

  container.querySelectorAll('.cal-day').forEach(function(el) {
    el.addEventListener('click', function() {
      _calOpenModal(el.getAttribute('data-date'), sessions);
    });
  });
}

/* ── Modal ── */
function _calOpenModal(date, sessions) {
  _calEditDate = date;
  var modal = document.getElementById('cal-modal');
  if (!modal) return;
  var title = document.getElementById('cal-modal-title');
  if (title) title.textContent = 'S\u00e9ance du ' + _calFormatDate(date);

  var existingEl  = document.getElementById('cal-existing-sessions');
  var daySessions = sessions.filter(function(s) { return s.date === date; });
  if (existingEl) {
    existingEl.innerHTML = '';
    daySessions.forEach(function(s, i) {
      var info = CAL_SESSION_LABELS[s.type] || CAL_SESSION_LABELS.libre;
      var row  = document.createElement('div');
      row.className = 'cal-existing-row';
      row.innerHTML = '<span style="color:' + info.color + '">\u25cf ' + info.label + '</span>' +
        (s.notes ? ' \u2014 ' + _escHtml(s.notes) : '') +
        '<button class="cal-del-btn" data-idx="' + i + '">\uD83D\uDDD1</button>';
      (function(idx) {
        row.querySelector('.cal-del-btn').addEventListener('click', function(e) {
          e.stopPropagation();
          _calDeleteSession(date, idx);
        });
      })(i);
      existingEl.appendChild(row);
    });
  }

  var typeSelect = document.getElementById('cal-type-select');
  if (typeSelect) typeSelect.value = 'full_body';
  var notesInput = document.getElementById('cal-notes-input');
  if (notesInput) notesInput.value = '';
  var dureeInput = document.getElementById('cal-duree-input');
  if (dureeInput) dureeInput.value = 45;

  modal.style.display = 'flex';
  modal.onclick = function(e) { if (e.target === modal) _calCloseModal(); };

  var saveBtn   = document.getElementById('cal-modal-save');
  var cancelBtn = document.getElementById('cal-modal-cancel');
  if (saveBtn)   saveBtn.onclick   = _calSaveSession;
  if (cancelBtn) cancelBtn.onclick = _calCloseModal;
}

function _calCloseModal() {
  var modal = document.getElementById('cal-modal');
  if (modal) modal.style.display = 'none';
}

function _calSaveSession() {
  if (!_calEditDate) return;
  if (typeof SW === 'undefined' || !SW.load) { _calCloseModal(); return; }

  var typeSelect = document.getElementById('cal-type-select');
  var notesInput = document.getElementById('cal-notes-input');
  var dureeInput = document.getElementById('cal-duree-input');

  var type  = typeSelect ? typeSelect.value : 'libre';
  var notes = notesInput ? notesInput.value.trim() : '';
  var duree = dureeInput ? (parseInt(dureeInput.value) || 45) : 45;
  var info  = CAL_SESSION_LABELS[type] || CAL_SESSION_LABELS.libre;

  var sessions = SW.load('sessions') || [];
  sessions.push({
    date:       _calEditDate,
    type:       type,
    nom:        info.label,
    notes:      notes,
    duree_min:  duree,
    exercices:  [],
    created_at: new Date().toISOString(),
  });
  SW.save('sessions', sessions);
  _calCloseModal();
  renderCalendar(_calContainer);
  if (typeof showToast === 'function') showToast('S\u00e9ance ajout\u00e9e !', 'success');
}

function _calDeleteSession(date, idx) {
  if (typeof SW === 'undefined' || !SW.load) return;
  var sessions    = SW.load('sessions') || [];
  var daySessions = sessions.filter(function(s) { return s.date === date; });
  var toDelete    = daySessions[idx];
  if (!toDelete) return;
  var newSessions = sessions.filter(function(s) { return s !== toDelete; });
  SW.save('sessions', newSessions);
  renderCalendar(_calContainer);
  if (typeof showToast === 'function') showToast('S\u00e9ance supprim\u00e9e', 'info');
}

/* ── Marquer aujourd'hui comme fait (legacy compat) ── */
function markTodayDone() {
  if (typeof SW === 'undefined' || !SW.load) return;
  var today    = new Date().toISOString().slice(0, 10);
  var sessions = SW.load('sessions') || [];
  var exists   = sessions.some(function(s) { return s.date === today; });
  if (!exists) {
    sessions.push({ date: today, type: 'libre', nom: 'Libre', notes: '', duree_min: 45, exercices: [] });
    SW.save('sessions', sessions);
  }
  renderCalendar(_calContainer || 'calendar-container');
}

/* ── Helpers ── */
var _calMonthsFr = ['Janv','F\u00e9vr','Mars','Avr','Mai','Juin','Juil','Ao\u00fbt','Sept','Oct','Nov','D\u00e9c'];

function _calMonthRange(days) {
  var first = days[0];
  var last  = days[days.length - 1];
  if (first.getMonth() === last.getMonth()) {
    return _calMonthsFr[first.getMonth()] + ' ' + first.getFullYear();
  }
  return _calMonthsFr[first.getMonth()] + ' \u2013 ' + _calMonthsFr[last.getMonth()] + ' ' + last.getFullYear();
}

function _calFormatDate(dateStr) {
  var parts = dateStr.split('-');
  return parseInt(parts[2]) + ' ' + _calMonthsFr[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

function _escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
