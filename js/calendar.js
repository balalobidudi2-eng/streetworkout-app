/* ========================================
   CALENDAR.JS — Agenda hebdomadaire
   Affiche les 7 derniers jours avec marquage des séances
   Dépend de : storage.js (global SW)
   ======================================== */

function renderCalendar(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var today = new Date();
  var dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  var sessions = (typeof SW !== 'undefined' ? SW.load('sessions') : null) || [];
  var todayStr = today.toISOString().slice(0, 10);

  // Générer les 7 derniers jours (j-6 → aujourd'hui)
  var days = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    days.push(d);
  }

  var html = '<div class="calendar-strip">';
  days.forEach(function(d) {
    var dateStr = d.toISOString().slice(0, 10);
    var isToday = dateStr === todayStr;
    var hasSession = sessions.some(function(s) { return s.date === dateStr; });
    var dayClass = 'cal-day' +
      (isToday ? ' cal-day--today' : '') +
      (hasSession ? ' cal-day--done' : '');

    html += '<div class="' + dayClass + '">' +
      '<div class="cal-day-name">' + dayNames[d.getDay()] + '</div>' +
      '<div class="cal-day-num">' + d.getDate() + '</div>' +
      '<div class="cal-dot' + (hasSession ? '' : ' cal-dot--empty') + '"></div>' +
      '</div>';
  });
  html += '</div>';
  html += '<div class="calendar-legend"><span class="cal-legend-item">' +
    '<span class="cal-dot" style="display:inline-block;vertical-align:middle;margin-right:5px;"></span>' +
    'S\u00e9ance effectu\u00e9e</span></div>';

  container.innerHTML = html;
}

function markTodayDone() {
  var today = new Date().toISOString().slice(0, 10);
  if (typeof SW === 'undefined') return;
  var sessions = SW.load('sessions') || [];
  if (!sessions.find(function(s) { return s.date === today; })) {
    SW.append('sessions', {
      date: today,
      nom: 'S\u00e9ance marqu\u00e9e',
      duree_min: 0,
      exercices: [],
      volume_total: 0
    });
  }
}
