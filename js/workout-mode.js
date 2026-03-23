/* ========================================
   WORKOUT-MODE.JS — Mode séance immersif v2
   Phases : Préparation → Exécution → Résultat → Repos
   Dépend de : exercise-visuals.js, timer.js, storage.js (globals)
   ======================================== */

/* -- Durée estimée par type d exercice -- */
var REP_DURATION = {
  pompes: 2.5, pompes_standard: 2.5, pompes_genoux: 2.5, pompes_declin: 2.5,
  pike_pushup: 3, hspu_mur: 3.5,
  tractions: 3, pull_up: 3, chin_up: 3, pull_up_leste: 3.5,
  tractions_bande: 3, australian_row: 2.5,
  dips: 2.5, dips_barres: 2.5, dips_chaise: 2.5, dips_lestes: 3,
  squat: 3, squat_standard: 3, jump_squat: 2.5,
  pistol_squat: 4, pistol_squat_assist: 3.5,
  muscle_up: 5, muscle_up_strict: 5, muscle_up_kipping: 4.5, muscle_up_negatif: 5,
  gainage_planche: 1, hollow_body: 1, l_sit_sol: 1, planche: 1, handstand: 1,
  default: 3
};

var LEVEL_MODIFIER = {
  debutant: 1.4, novice: 1.2, intermediaire: 1.0, avance: 0.9, elite: 0.8
};

var ISOMETRIC_EXERCISES = ['gainage_planche', 'hollow_body', 'l_sit_sol', 'planche', 'handstand', 'l_sit', 'gainage'];

function getEstimatedDuration(exercise, repsTarget, userLevel) {
  var exId = (exercise && exercise.id) ? exercise.id : (typeof exercise === 'string' ? exercise : 'default');
  var repDuration = REP_DURATION[exId] || REP_DURATION.default;
  var levelMod = LEVEL_MODIFIER[userLevel] || 1.0;
  var reps = parseInt(repsTarget) || 10;
  if (ISOMETRIC_EXERCISES.indexOf(exId) !== -1) return reps + 3;
  return Math.ceil(reps * repDuration * levelMod) + 3;
}

window.getEstimatedDuration = getEstimatedDuration;

/* ══════════════════════════════════════════════
   EXERCISE TIMER BAR (requestAnimationFrame)
   ══════════════════════════════════════════════ */
var ExerciseTimerBar = {
  _rafId: null,
  _startTime: null,
  _duration: null,
  _onComplete: null,
  _barEl: null,
  _timeEl: null,
  _totalSeconds: null,

  start: function(durationSeconds, barElement, timeElement, onComplete) {
    this.stop();
    this._duration = durationSeconds * 1000;
    this._totalSeconds = durationSeconds;
    this._startTime = performance.now();
    this._barEl = barElement;
    this._timeEl = timeElement;
    this._onComplete = onComplete;
    this._tick();
  },

  _tick: function() {
    var self = this;
    var elapsed = performance.now() - this._startTime;
    var remaining = Math.max(0, this._duration - elapsed);
    var ratio = remaining / this._duration;

    if (this._barEl) {
      this._barEl.style.width = (ratio * 100) + '%';
      this._barEl.classList.remove('warning', 'danger');
      if (ratio < 0.10) this._barEl.classList.add('danger');
      else if (ratio < 0.33) this._barEl.classList.add('warning');
    }

    if (this._timeEl) {
      this._timeEl.textContent = Math.ceil(remaining / 1000);
    }

    if (remaining > 0) {
      this._rafId = requestAnimationFrame(function() { self._tick(); });
    } else {
      if (this._barEl) { this._barEl.style.width = '0%'; this._barEl.classList.add('danger'); }
      if (this._timeEl) this._timeEl.textContent = '0';
      if (this._onComplete) this._onComplete();
    }
  },

  stop: function() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  },

  reset: function(barElement) {
    this.stop();
    var el = barElement || this._barEl;
    if (el) { el.style.width = '100%'; el.classList.remove('warning', 'danger'); }
    if (this._timeEl) this._timeEl.textContent = this._totalSeconds || '';
  }
};

window.ExerciseTimerBar = ExerciseTimerBar;

/* ══════════════════════════════════════════════
   WORKOUT MODE — Classe principale
   ══════════════════════════════════════════════ */
var WorkoutMode = (function() {

  function WorkoutMode(exercises, sessionName, userLevel) {
    this.exercises = exercises || [];
    this.sessionName = sessionName || 'Séance';
    this.userLevel = userLevel || 'debutant';
    this.currentExIndex = 0;
    this.currentSerieIndex = 0;
    this.phase = 'preparation';
    this.seriesLog = [];
    this.startTime = Date.now();
    /* État de la série courante */
    this._serieStartTime = null;
    this._estimatedDuration = 0;
    this._currentReps = 0;
    this._currentRessenti = 'ok';
    this._currentSucces = true;
    this._prepCountdownInterval = null;
  }

  WorkoutMode.prototype.mount = function() {
    var overlay = document.createElement('div');
    overlay.id = 'workout-mode-overlay';
    overlay.innerHTML = this._renderHTML();
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    this._bindEvents();
    this._showPreparation();
  };

  WorkoutMode.prototype.unmount = function() {
    ExerciseTimerBar.stop();
    this._clearPrepCountdown();
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

      /* PHASE PREPARATION */
      '<div class="wm-phase" id="wm-phase-preparation" style="display:none">' +
        '<div class="prep-label" id="prep-label">Pr\u00eats ?</div>' +
        '<div class="prep-countdown" id="prep-countdown">3</div>' +
        '<button class="btn-skip-prep" id="btn-skip-prep">Commencer maintenant</button>' +
      '</div>' +

      /* PHASE EXECUTION */
      '<div class="wm-phase execution-phase" id="wm-phase-execution" style="display:none">' +
        '<p class="objectif-label">Objectif\u00a0: <strong id="repsObjectif">12 reps</strong></p>' +
        '<div class="execution-timer-bar-container">' +
          '<div class="execution-timer-bar" id="execTimerBar"></div>' +
        '</div>' +
        '<p class="time-remaining"><span id="timeRemaining">20</span>s</p>' +
        '<div class="execution-actions">' +
          '<button class="btn-validate-serie" id="btnValidate">\u2713 Valider la s\u00e9rie</button>' +
          '<button class="btn-fail-serie" id="btnFail">\u2717 S\u00e9rie non r\u00e9ussie</button>' +
        '</div>' +
      '</div>' +

      /* PHASE RESULTAT */
      '<div class="wm-phase result-phase" id="wm-phase-result" style="display:none">' +
        '<h3>Comment \u00e7a s\'est pass\u00e9\u00a0?</h3>' +
        '<div class="result-inputs">' +
          '<label>Reps r\u00e9alis\u00e9es</label>' +
          '<div class="reps-counter">' +
            '<button id="btn-reps-minus">\u2212</button>' +
            '<span id="resultReps">12</span>' +
            '<button id="btn-reps-plus">+</button>' +
          '</div>' +
          '<label>Ressenti</label>' +
          '<div class="ressenti-buttons">' +
            '<button class="ressenti-btn" data-value="difficile" id="ressenti-difficile">\ud83d\ude30 Difficile</button>' +
            '<button class="ressenti-btn active" data-value="ok" id="ressenti-ok">\ud83d\ude0a OK</button>' +
            '<button class="ressenti-btn" data-value="facile" id="ressenti-facile">\ud83d\udcaa Facile</button>' +
          '</div>' +
        '</div>' +
        '<button class="btn-confirm-result" id="btn-confirm-result">Confirmer \u2192</button>' +
      '</div>' +

      /* PHASE REPOS */
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

      /* PHASE DONE */
      '<div class="wm-phase" id="wm-phase-done" style="display:none">' +
        '<div class="wm-done-icon">\ud83c\udfc6</div>' +
        '<div class="wm-done-title">S\u00e9ance termin\u00e9e\u00a0!</div>' +
        '<div class="wm-done-stats" id="wm-done-stats"></div>' +
        '<button class="btn btn-primary" id="wm-save-session">\ud83d\udcbe Sauvegarder</button>' +
      '</div>' +

    '</div>';
  };

  /* ── Utilitaires phases ── */
  WorkoutMode.prototype._hideAllPhases = function() {
    var phases = ['preparation', 'execution', 'result', 'rest', 'done'];
    for (var i = 0; i < phases.length; i++) {
      var el = document.getElementById('wm-phase-' + phases[i]);
      if (el) el.style.display = 'none';
    }
  };

  WorkoutMode.prototype._showPhase = function(name) {
    this._hideAllPhases();
    var el = document.getElementById('wm-phase-' + name);
    if (el) el.style.display = 'flex';
  };

  WorkoutMode.prototype._updateHeader = function() {
    var ex = this.exercises[this.currentExIndex];
    if (!ex) return;
    var totalSeries = ex.series || 3;
    var progress = (this.currentExIndex / this.exercises.length) * 100;
    var progEl = document.getElementById('wm-progress');
    if (progEl) progEl.style.width = progress + '%';

    var visualContainer = document.getElementById('wm-visual');
    if (visualContainer && typeof getExerciseVisual === 'function') {
      var visualId = ex.id || (typeof resolveExerciseId === 'function' ? resolveExerciseId(ex.nom) : '');
      var visual = getExerciseVisual(visualId);
      visualContainer.innerHTML = visual ? visual.svg : '';
    }

    var nameEl = document.getElementById('wm-ex-name');
    if (nameEl) nameEl.textContent = ex.nom;

    var infoEl = document.getElementById('wm-serie-info');
    if (infoEl) {
      infoEl.textContent = 'S\u00e9rie ' + (this.currentSerieIndex + 1) + ' / ' + totalSeries +
        ' \u00b7 Objectif\u00a0: ' + (ex.reps || ex.reps_objectif || '?');
    }
  };

  /* ══ PHASE PRÉPARATION ══ */
  WorkoutMode.prototype._showPreparation = function() {
    this.phase = 'preparation';
    this._clearPrepCountdown();
    this._updateHeader();
    this._showPhase('preparation');

    var self = this;
    var ex = this.exercises[this.currentExIndex];
    if (!ex) { this._finishSession(); return; }
    var totalSeries = ex.series || 3;

    var labelEl = document.getElementById('prep-label');
    var countEl = document.getElementById('prep-countdown');
    if (labelEl) labelEl.textContent = 'S\u00e9rie ' + (this.currentSerieIndex + 1) + ' / ' + totalSeries + ' \u2014 Pr\u00eats ?';

    var count = 3;
    function setCount(n) {
      if (countEl) {
        countEl.textContent = n;
        countEl.style.animation = 'none';
        void countEl.offsetHeight;
        countEl.style.animation = 'countPulse 1s ease-in-out';
      }
    }
    setCount(count);
    self._prepCountdownInterval = setInterval(function() {
      count--;
      setCount(count);
      if (count <= 0) { self._clearPrepCountdown(); self._showExecution(); }
    }, 1000);
  };

  WorkoutMode.prototype._clearPrepCountdown = function() {
    if (this._prepCountdownInterval) { clearInterval(this._prepCountdownInterval); this._prepCountdownInterval = null; }
  };

  /* ══ PHASE EXÉCUTION ══ */
  WorkoutMode.prototype._showExecution = function() {
    this.phase = 'execution';
    this._clearPrepCountdown();
    this._showPhase('execution');

    var ex = this.exercises[this.currentExIndex];
    if (!ex) return;

    /* Calculer durée estimée — gérer "12-15" et "8–12" */
    var repsStr = ex.reps || ex.reps_objectif || '10';
    var repsNum = parseInt(repsStr) || 10;
    if (typeof repsStr === 'string' && /[-\u2013]/.test(repsStr)) {
      var parts = repsStr.split(/[-\u2013]/);
      repsNum = parseInt(parts[parts.length - 1]) || repsNum;
    }

    this._estimatedDuration = getEstimatedDuration(ex, repsNum, this.userLevel);
    this._serieStartTime = Date.now();
    this._currentSucces = true;
    this._currentRessenti = 'ok';
    this._currentReps = repsNum;

    var objEl = document.getElementById('repsObjectif');
    if (objEl) objEl.textContent = (ex.reps || ex.reps_objectif || '?') + ' reps';

    var barEl = document.getElementById('execTimerBar');
    var timeEl = document.getElementById('timeRemaining');
    if (timeEl) timeEl.textContent = this._estimatedDuration;

    var self = this;
    if (barEl) {
      ExerciseTimerBar.reset(barEl);
      ExerciseTimerBar.start(this._estimatedDuration, barEl, timeEl, function() {
        self._beep();
        /* Barre épuisée : simple signal sonore, ne pas forcer la validation */
      });
    }
  };

  /* ══ PHASE RÉSULTAT ══ */
  WorkoutMode.prototype._showResult = function(succes) {
    ExerciseTimerBar.stop();
    this.phase = 'result';
    this._currentSucces = succes;
    this._showPhase('result');

    var ex = this.exercises[this.currentExIndex];
    var repsStr = ex ? (ex.reps || ex.reps_objectif || '0') : '0';
    var repsNum = parseInt(repsStr) || 0;
    if (!succes) repsNum = Math.max(0, Math.round(repsNum * 0.7));

    this._currentReps = repsNum;
    this._currentRessenti = succes ? 'ok' : 'difficile';

    var repsEl = document.getElementById('resultReps');
    if (repsEl) repsEl.textContent = repsNum;

    var values = ['difficile', 'ok', 'facile'];
    for (var i = 0; i < values.length; i++) {
      var btn = document.getElementById('ressenti-' + values[i]);
      if (btn) btn.classList.toggle('active', values[i] === this._currentRessenti);
    }
  };

  WorkoutMode.prototype._onSerieValidated = function(succes) { this._showResult(succes); };

  WorkoutMode.prototype._adjustReps = function(delta) {
    this._currentReps = Math.max(0, this._currentReps + delta);
    var el = document.getElementById('resultReps');
    if (el) el.textContent = this._currentReps;
  };

  WorkoutMode.prototype._setRessenti = function(el) {
    this._currentRessenti = el.getAttribute('data-value') || '';
    var btns = document.querySelectorAll('.ressenti-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    el.classList.add('active');
  };

  WorkoutMode.prototype._confirmResult = function() {
    var ex = this.exercises[this.currentExIndex];
    if (!ex) return;

    var tempsReel = this._serieStartTime ? Math.round((Date.now() - this._serieStartTime) / 1000) : 0;

    this.seriesLog.push({
      exercice: ex.id || (typeof resolveExerciseId === 'function' ? resolveExerciseId(ex.nom) : ''),
      nom: ex.nom,
      serie: this.currentSerieIndex + 1,
      reps: this._currentReps,
      poids: 0,
      reps_objectif: parseInt(ex.reps || ex.reps_objectif) || 0,
      temps_execution: tempsReel,
      temps_estime: this._estimatedDuration,
      succes: this._currentSucces,
      ressenti: this._currentRessenti
    });

    var totalSeries = ex.series || 3;
    var exId = ex.id || (typeof resolveExerciseId === 'function' ? resolveExerciseId(ex.nom) : '');
    var repos = ex.repos || ex.repos_sec || (typeof getRestPreset === 'function' ? getRestPreset(exId) : 90);

    if (this.currentSerieIndex < totalSeries - 1) {
      this.currentSerieIndex++;
      this._startRest(repos, false);
    } else {
      this.currentExIndex++;
      this.currentSerieIndex = 0;
      if (this.currentExIndex >= this.exercises.length) {
        this._finishSession();
      } else {
        this._startRest(repos, true);
      }
    }
  };

  /* ══ EVENTS ══ */
  WorkoutMode.prototype._bindEvents = function() {
    var self = this;

    document.getElementById('btn-skip-prep').addEventListener('click', function() {
      self._clearPrepCountdown();
      self._showExecution();
    });

    document.getElementById('btnValidate').addEventListener('click', function() { self._onSerieValidated(true); });
    document.getElementById('btnFail').addEventListener('click', function() { self._onSerieValidated(false); });

    document.getElementById('btn-reps-minus').addEventListener('click', function() { self._adjustReps(-1); });
    document.getElementById('btn-reps-plus').addEventListener('click', function() { self._adjustReps(+1); });

    var ressentiBtns = document.querySelectorAll('.ressenti-btn');
    for (var i = 0; i < ressentiBtns.length; i++) {
      ressentiBtns[i].addEventListener('click', function() { self._setRessenti(this); });
    }

    document.getElementById('btn-confirm-result').addEventListener('click', function() { self._confirmResult(); });
    document.getElementById('wm-skip-rest').addEventListener('click', function() { self._nextSerie(); });

    document.getElementById('wm-quit').addEventListener('click', function() {
      if (confirm('Terminer la s\u00e9ance maintenant\u00a0?')) {
        ExerciseTimerBar.stop();
        self._clearPrepCountdown();
        self._finishSession();
      }
    });

    document.getElementById('wm-save-session').addEventListener('click', function() {
      self._saveSession();
      self.unmount();
    });
  };

  /* ══ REPOS (inchangé) ══ */
  WorkoutMode.prototype._startRest = function(seconds, nextExercise) {
    var self = this;
    this.phase = 'rest';
    this._updateHeader();
    this._showPhase('rest');
    var circumference = 276.5;

    if (!nextExercise && 'speechSynthesis' in window) {
      try {
        var utt = new SpeechSynthesisUtterance('Bien ! Repose-toi.');
        utt.lang = 'fr-FR'; utt.volume = 0.5;
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
            arcEl.style.strokeDashoffset = circumference * (remaining / seconds);
            arcEl.style.stroke = remaining <= 10 ? '#FF3D5A' : '#00FF87';
          }
        },
        function() { self._beep(); self._nextSerie(); }
      );
    }
  };

  WorkoutMode.prototype._nextSerie = function() {
    if (typeof TIMER !== 'undefined') TIMER.reset();
    if (this.currentExIndex < this.exercises.length) {
      this._showPreparation();
    } else {
      this._finishSession();
    }
  };

  WorkoutMode.prototype._finishSession = function() {
    this.phase = 'done';
    ExerciseTimerBar.stop();
    this._clearPrepCountdown();
    if (typeof TIMER !== 'undefined') TIMER.reset();
    this._hideAllPhases();
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
      SW.append('sw_sessions', {
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
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  };

  return WorkoutMode;
})();
