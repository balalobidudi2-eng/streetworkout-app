/* ========================================
   WORKOUT-MODE.JS — Mode séance immersif
   Overlay plein écran guidé exercice par exercice
   Dépend de : exercise-visuals.js, timer.js, storage.js (globals)
   ======================================== */

var WorkoutMode = (function() {

  function WorkoutMode(exercises, sessionName) {
    this.exercises = exercises || [];
    this.sessionName = sessionName || 'Séance';
    this.currentExIndex = 0;
    this.currentSerieIndex = 0;
    this.phase = 'exercise'; // 'exercise' | 'rest' | 'done'
    this.seriesLog = [];
    this.startTime = Date.now();
  }

  WorkoutMode.prototype.mount = function() {
    var overlay = document.createElement('div');
    overlay.id = 'workout-mode-overlay';
    overlay.innerHTML = this._renderHTML();
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    this._bindEvents();
    this._render();
  };

  WorkoutMode.prototype.unmount = function() {
    var el = document.getElementById('workout-mode-overlay');
    if (el) el.remove();
    document.body.style.overflow = '';
    if (typeof TIMER !== 'undefined') TIMER.reset();
  };

  WorkoutMode.prototype._renderHTML = function() {
    return '<div class="wm-container">' +
      '<div class="wm-header">' +
        '<div class="wm-session-name">' + this.sessionName + '</div>' +
        '<div class="wm-progress-bar"><div class="wm-progress-fill" id="wm-progress"></div></div>' +
        '<button class="wm-quit-btn" id="wm-quit">&#10005; Terminer</button>' +
      '</div>' +
      '<div class="wm-visual" id="wm-visual"></div>' +
      '<div class="wm-exercise-info">' +
        '<div class="wm-exercise-name" id="wm-ex-name"></div>' +
        '<div class="wm-serie-info" id="wm-serie-info"></div>' +
      '</div>' +
      '<div class="wm-phase" id="wm-phase-exercise">' +
        '<div class="wm-input-row">' +
          '<div class="wm-input-group">' +
            '<label>Reps r\u00e9alis\u00e9es</label>' +
            '<input type="number" id="wm-reps" min="0" max="99" placeholder="0">' +
          '</div>' +
          '<div class="wm-input-group">' +
            '<label>Charge (kg)</label>' +
            '<input type="number" id="wm-poids" min="0" max="999" step="0.5" placeholder="0">' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary wm-validate-btn" id="wm-validate">Valider la s\u00e9rie \u2192</button>' +
      '</div>' +
      '<div class="wm-phase" id="wm-phase-rest" style="display:none">' +
        '<div class="wm-rest-label">Repos</div>' +
        '<div class="wm-timer-circle">' +
          '<svg viewBox="0 0 100 100">' +
            '<circle cx="50" cy="50" r="44" fill="none" stroke="var(--bg-elevated)" stroke-width="8"/>' +
            '<circle id="wm-timer-arc" cx="50" cy="50" r="44" fill="none"' +
              ' stroke="#00FF87" stroke-width="8" stroke-linecap="round"' +
              ' stroke-dasharray="276.5" stroke-dashoffset="0"' +
              ' transform="rotate(-90 50 50)"/>' +
          '</svg>' +
          '<div class="wm-timer-text" id="wm-timer-text">90</div>' +
        '</div>' +
        '<div class="wm-rest-actions">' +
          '<button class="btn btn-secondary" id="wm-skip-rest">Passer \u2192</button>' +
        '</div>' +
      '</div>' +
      '<div class="wm-phase" id="wm-phase-done" style="display:none">' +
        '<div class="wm-done-icon">\ud83c\udfc6</div>' +
        '<div class="wm-done-title">S\u00e9ance termin\u00e9e\u00a0!</div>' +
        '<div class="wm-done-stats" id="wm-done-stats"></div>' +
        '<button class="btn btn-primary" id="wm-save-session">\ud83d\udcbe Sauvegarder</button>' +
      '</div>' +
    '</div>';
  };

  WorkoutMode.prototype._render = function() {
    if (this.phase === 'done') { this._showDone(); return; }

    var ex = this.exercises[this.currentExIndex];
    if (!ex) { this._finishSession(); return; }

    var totalSeries = ex.series || 3;
    var progress = (this.currentExIndex / this.exercises.length) * 100;

    document.getElementById('wm-progress').style.width = progress + '%';

    // SVG visuel
    var visualContainer = document.getElementById('wm-visual');
    var visualId = ex.id || resolveExerciseId(ex.nom);
    var visual = getExerciseVisual(visualId);
    visualContainer.innerHTML = visual.svg;

    // Infos texte
    document.getElementById('wm-ex-name').textContent = ex.nom;
    document.getElementById('wm-serie-info').textContent =
      'S\u00e9rie ' + (this.currentSerieIndex + 1) + ' / ' + totalSeries +
      ' \u00b7 Objectif\u00a0: ' + (ex.reps_objectif || '?') + ' reps';

    if (ex.poids) document.getElementById('wm-poids').value = ex.poids;

    if (this.phase === 'exercise') {
      document.getElementById('wm-phase-exercise').style.display = 'flex';
      document.getElementById('wm-phase-rest').style.display = 'none';
      var repsInput = document.getElementById('wm-reps');
      if (repsInput) repsInput.focus();
    }
  };

  WorkoutMode.prototype._bindEvents = function() {
    var self = this;
    document.getElementById('wm-validate').addEventListener('click', function() { self._validateSerie(); });
    document.getElementById('wm-skip-rest').addEventListener('click', function() { self._nextSerie(); });
    document.getElementById('wm-quit').addEventListener('click', function() {
      if (confirm('Terminer la s\u00e9ance maintenant\u00a0?')) {
        self._finishSession();
      }
    });
    document.getElementById('wm-save-session').addEventListener('click', function() {
      self._saveSession();
      self.unmount();
    });
    document.getElementById('wm-reps').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') self._validateSerie();
    });
  };

  WorkoutMode.prototype._validateSerie = function() {
    var reps = parseInt(document.getElementById('wm-reps').value) || 0;
    var poids = parseFloat(document.getElementById('wm-poids').value) || 0;
    var ex = this.exercises[this.currentExIndex];

    this.seriesLog.push({
      exercice: ex.id || resolveExerciseId(ex.nom),
      nom: ex.nom,
      serie: this.currentSerieIndex + 1,
      reps: reps,
      poids: poids
    });

    document.getElementById('wm-reps').value = '';

    var totalSeries = ex.series || 3;
    var exId = ex.id || resolveExerciseId(ex.nom);
    if (this.currentSerieIndex < totalSeries - 1) {
      this._startRest(ex.repos_sec || getRestPreset(exId), false);
    } else {
      this.currentExIndex++;
      this.currentSerieIndex = 0;
      if (this.currentExIndex >= this.exercises.length) {
        this._finishSession();
      } else {
        this._startRest(ex.repos_sec || getRestPreset(exId), true);
      }
    }
  };

  WorkoutMode.prototype._startRest = function(seconds, nextExercise) {
    var self = this;
    this.phase = 'rest';
    document.getElementById('wm-phase-exercise').style.display = 'none';
    document.getElementById('wm-phase-rest').style.display = 'flex';

    var arc = document.getElementById('wm-timer-arc');
    var circumference = 276.5;

    if (!nextExercise && 'speechSynthesis' in window) {
      try {
        var utt = new SpeechSynthesisUtterance('Bien ! Repose-toi.');
        utt.lang = 'fr-FR';
        utt.volume = 0.5;
        speechSynthesis.speak(utt);
      } catch(e) {}
    }

    if (typeof TIMER !== 'undefined') {
      TIMER.reset();
      TIMER.start(seconds,
        function(remaining) {
          var el = document.getElementById('wm-timer-text');
          if (el) el.textContent = remaining;
          var arcEl = document.getElementById('wm-timer-arc');
          if (arcEl) {
            var offset = circumference * (remaining / seconds);
            arcEl.style.strokeDashoffset = offset;
            arcEl.style.stroke = remaining <= 10 ? '#FF3D5A' : '#00FF87';
          }
        },
        function() {
          self._beep();
          self._nextSerie();
        }
      );
    }
  };

  WorkoutMode.prototype._nextSerie = function() {
    if (typeof TIMER !== 'undefined') TIMER.reset();
    this.phase = 'exercise';
    if (this.currentExIndex < this.exercises.length) {
      this.currentSerieIndex++;
      this._render();
    }
  };

  WorkoutMode.prototype._finishSession = function() {
    this.phase = 'done';
    if (typeof TIMER !== 'undefined') TIMER.reset();
    document.getElementById('wm-phase-exercise').style.display = 'none';
    document.getElementById('wm-phase-rest').style.display = 'none';
    this._showDone();
  };

  WorkoutMode.prototype._showDone = function() {
    var donePhase = document.getElementById('wm-phase-done');
    if (donePhase) donePhase.style.display = 'flex';
    var progEl = document.getElementById('wm-progress');
    if (progEl) progEl.style.width = '100%';

    var duration = Math.round((Date.now() - this.startTime) / 60000);
    var totalReps = this.seriesLog.reduce(function(s, l) { return s + l.reps; }, 0);
    var totalVolume = this.seriesLog.reduce(function(s, l) { return s + l.reps * (l.poids || 0); }, 0);

    var statsEl = document.getElementById('wm-done-stats');
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="done-stat"><span>' + duration + '</span>min de s\u00e9ance</div>' +
        '<div class="done-stat"><span>' + totalReps + '</span>reps au total</div>' +
        '<div class="done-stat"><span>' + Math.round(totalVolume) + '</span>kg de volume</div>';
    }
  };

  WorkoutMode.prototype._saveSession = function() {
    var duration = Math.round((Date.now() - this.startTime) / 60000);
    var volume = this.seriesLog.reduce(function(s, l) { return s + l.reps * (l.poids || 1); }, 0);
    if (typeof SW !== 'undefined') {
      SW.append('sessions', {
        date: new Date().toISOString().slice(0, 10),
        nom: this.sessionName,
        duree_min: duration,
        exercices: this.seriesLog,
        volume_total: Math.round(volume)
      });
    }
    if (typeof showToast !== 'undefined') showToast('S\u00e9ance sauvegard\u00e9e ! \ud83d\udcaa');
    window.dispatchEvent(new CustomEvent('session:saved', { detail: { log: this.seriesLog } }));
  };

  WorkoutMode.prototype._beep = function() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  };

  return WorkoutMode;
})();
