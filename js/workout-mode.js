/* ========================================
   WORKOUT-MODE.JS — v3 Refined Series Management
   Phases : Préparation → Exécution → (Validation/Échec) → (Fin d'exercice/Repos)
   RestTimer replaces circular rest timer, improved failure handling
   ======================================== */

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

var LEVEL_MODIFIER = { debutant: 1.4, novice: 1.2, intermediaire: 1.0, avance: 0.9, elite: 0.8 };
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

    if (this._timeEl) this._timeEl.textContent = Math.ceil(remaining / 1000);

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
   REST TIMER (replaces circular SVG timer)
   ══════════════════════════════════════════════ */
var RestTimer = {
  _rafId: null,
  _endTime: null,
  _totalMs: null,
  _barEl: null,
  _numEl: null,
  _onDone: null,

  start: function(seconds, barEl, numEl, onDone) {
    this.stop();
    this._totalMs = seconds * 1000;
    this._endTime = Date.now() + this._totalMs;
    this._barEl = barEl;
    this._numEl = numEl;
    this._onDone = onDone;
    this._tick();
  },

  _tick: function() {
    var self = this;
    var remaining = this._endTime - Date.now();
    if (remaining <= 0) {
      if (this._numEl) this._numEl.textContent = '0';
      if (this._barEl) this._barEl.style.width = '0%';
      if (this._onDone) this._onDone();
      return;
    }

    var ratio = remaining / this._totalMs;
    if (this._barEl) {
      this._barEl.style.width = (ratio * 100) + '%';
      this._barEl.classList.remove('warning', 'danger');
      if (ratio < 0.20) this._barEl.classList.add('danger');
      else if (ratio < 0.40) this._barEl.classList.add('warning');
    }
    if (this._numEl) this._numEl.textContent = Math.ceil(remaining / 1000);

    this._rafId = requestAnimationFrame(function() { self._tick(); });
  },

  adjust: function(deltaSeconds) {
    if (!this._endTime) return;
    this._endTime += deltaSeconds * 1000;
    var remaining = this._endTime - Date.now();
    if (remaining < 1000) this._endTime = Date.now() + 1000;
    this._totalMs = Math.max(1000, remaining);
  },

  stop: function() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  },

  skip: function() {
    this.stop();
    if (this._onDone) this._onDone();
  }
};

window.RestTimer = RestTimer;

/* ══════════════════════════════════════════════
   WORKOUT MODE — Main class
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

    /* Current series state */
    this._serieStartTime = null;
    this._estimatedDuration = 0;
    this._currentReps = 0;
    this._currentRessenti = 'moyen';
    this._currentSucces = true;
    this._prepCountdownInterval = null;

    /* Series per-exercise */
    this._seriesData = [];

    /* End-of-exercise state */
    this._ressentiFin = 'ok';
    this._difficulte = 3;

    /* Default rest time */
    this._defaultRestSeconds = 60;
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
    RestTimer.stop();
    this._clearPrepCountdown();
    var el = document.getElementById('workout-mode-overlay');
    if (el) el.remove();
    document.body.style.overflow = '';
  };

  WorkoutMode.prototype._renderHTML = function() {
    return '<div class="wm-container">' +
      '<div class="wm-header">' +
        '<div class="wm-session-name">' + this.sessionName + '</div>' +
        '<div class="wm-progress-bar"><div class="wm-progress-fill" id="wm-progress"></div></div>' +
        '<button class="wm-quit-btn" id="wm-quit">✕ Terminer</button>' +
      '</div>' +
      '<div class="wm-visual" id="wm-visual"></div>' +
      '<div class="wm-exercise-info">' +
        '<div class="wm-exercise-name" id="wm-ex-name"></div>' +
        '<div class="wm-serie-info" id="wm-serie-info"></div>' +
      '</div>' +

      /* PREPARATION */
      '<div class="wm-phase" id="wm-phase-preparation" style="display:none">' +
        '<div class="prep-label" id="prep-label">Prêts ?</div>' +
        '<div class="prep-countdown" id="prep-countdown">3</div>' +
        '<button class="btn-skip-prep" id="btn-skip-prep">Commencer maintenant</button>' +
      '</div>' +

      /* EXECUTION */
      '<div class="wm-phase execution-phase" id="wm-phase-execution" style="display:none">' +
        '<p class="objectif-label">Objectif : <strong id="repsObjectif">12 reps</strong></p>' +
        '<div class="execution-timer-bar-container">' +
          '<div class="execution-timer-bar" id="execTimerBar"></div>' +
        '</div>' +
        '<p class="time-remaining"><span id="timeRemaining">20</span>s</p>' +
        '<div class="execution-actions">' +
          '<button class="btn-valider" id="btnValider">✓ Valider la série</button>' +
          '<button class="btn-ratee" id="btnRatee">✗ Série ratée</button>' +
        '</div>' +
      '</div>' +

      /* FAILURE STATE */
      '<div class="wm-phase phase-echec" id="wm-phase-echec" style="display:none">' +
        '<div class="echec-header">' +
          '<span class="echec-icon">✗</span>' +
          '<h3>Série non réussie</h3>' +
          '<p class="echec-sub">Série <span id="echecSerieNum">2</span> / <span id="echecSerieTotal">4</span></p>' +
        '</div>' +
        '<label class="field-label">Reps réalisées</label>' +
        '<div class="reps-stepper">' +
          '<button id="echecMinus">−</button>' +
          '<span id="echecRepsVal">8</span>' +
          '<button id="echecPlus">+</button>' +
        '</div>' +
        '<label class="field-label">Ressenti</label>' +
        '<div class="ressenti-row">' +
          '<button class="ressenti-btn" data-v="difficile" id="res-difficile">😰 Difficile</button>' +
          '<button class="ressenti-btn active" data-v="moyen" id="res-moyen">😐 Moyen</button>' +
          '<button class="ressenti-btn" data-v="facile" id="res-facile">😊 Facile</button>' +
        '</div>' +
        '<button class="btn-confirm-echec" id="btn-confirm-echec">Enregistrer →</button>' +
      '</div>' +

      /* END OF EXERCISE */
      '<div class="wm-phase phase-fin-exercice" id="wm-phase-fin-exercice" style="display:none">' +
        '<div class="fin-ex-header">' +
          '<span class="fin-ex-check">✓</span>' +
          '<h3 id="finExNom">Pompes</h3>' +
          '<p class="fin-ex-sub"><span id="finExSeriesOk">3</span>/4 séries réussies</p>' +
        '</div>' +
        '<label class="field-label">Ressenti global</label>' +
        '<div class="ressenti-row">' +
          '<button class="ressenti-btn" data-v="difficile" id="resf-difficile">😰 Difficile</button>' +
          '<button class="ressenti-btn active" data-v="ok" id="resf-ok">😊 OK</button>' +
          '<button class="ressenti-btn" data-v="facile" id="resf-facile">💪 Facile</button>' +
        '</div>' +
        '<label class="field-label">Difficulté perçue</label>' +
        '<div class="difficulte-row" id="difficulteRow">' +
          '<button class="star-btn active" data-v="1">★</button>' +
          '<button class="star-btn active" data-v="2">★</button>' +
          '<button class="star-btn active" data-v="3">★</button>' +
          '<button class="star-btn" data-v="4">★</button>' +
          '<button class="star-btn" data-v="5">★</button>' +
        '</div>' +
        '<button class="btn-next-exercise" id="btn-next-exercise">Exercice suivant →</button>' +
      '</div>' +

      /* REST */
      '<div class="wm-phase phase-repos" id="wm-phase-repos" style="display:none">' +
        '<p class="repos-label">Repos</p>' +
        '<div class="repos-time-display">' +
          '<span id="reposTimeNum">60</span>' +
          '<span class="repos-time-unit">s</span>' +
        '</div>' +
        '<div class="repos-bar-wrap">' +
          '<div class="repos-bar" id="reposBar"></div>' +
        '</div>' +
        '<div class="repos-controls">' +
          '<button class="btn-repos-minus" id="btnReposMinus">−15s</button>' +
          '<button class="btn-repos-plus" id="btnReposPlus">+15s</button>' +
        '</div>' +
        '<button class="btn-skip-repos" id="btn-skip-repos">Sauter le repos →</button>' +
        '<p class="repos-next">Prochaine série : <strong id="reposNextSerie">2</strong> / <span id="reposSerieTotal">4</span></p>' +
      '</div>' +

      /* DONE */
      '<div class="wm-phase" id="wm-phase-done" style="display:none">' +
        '<div class="wm-done-icon">🏆</div>' +
        '<div class="wm-done-title">Séance terminée !</div>' +
        '<div class="wm-done-stats" id="wm-done-stats"></div>' +
        '<button class="btn btn-primary" id="wm-save-session">💾 Sauvegarder</button>' +
      '</div>' +

    '</div>';
  };

  /* ── Show/hide phases ── */
  WorkoutMode.prototype._hideAllPhases = function() {
    var phases = ['preparation', 'execution', 'echec', 'fin-exercice', 'repos', 'done'];
    for (var i = 0; i < phases.length; i++) {
      var el = document.getElementById('wm-phase-' + phases[i]);
      if (el) el.style.display = 'none';
    }
  };

  WorkoutMode.prototype._showPhase = function(id) {
    this._hideAllPhases();
    var el = document.getElementById('wm-phase-' + id);
    if (el) el.style.display = 'flex';
  };

  /* ── Helpers ── */
  WorkoutMode.prototype._updateHeader = function() {
    var ex = this._getCurrentExercice();
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
      infoEl.textContent = 'Série ' + (this.currentSerieIndex + 1) + ' / ' + totalSeries + ' · Objectif : ' + (ex.reps || ex.reps_objectif || '?');
    }
  };

  WorkoutMode.prototype._getCurrentExercice = function() {
    return this.exercises[this.currentExIndex] || null;
  };

  WorkoutMode.prototype._parseRepsMin = function(repsStr) {
    if (!repsStr) return 10;
    if (typeof repsStr === 'number') return repsStr;
    if (typeof repsStr === 'string') {
      if (repsStr.indexOf('–') !== -1) return parseInt(repsStr.split('–')[0]) || 10;
      if (repsStr.indexOf('-') !== -1) return parseInt(repsStr.split('-')[0]) || 10;
      return parseInt(repsStr) || 10;
    }
    return 10;
  };

  /* PREPARATION */
  WorkoutMode.prototype._showPreparation = function() {
    this.phase = 'preparation';
    this._clearPrepCountdown();
    this._updateHeader();
    this._showPhase('preparation');

    var self = this;
    var ex = this._getCurrentExercice();
    if (!ex) { this._finishSession(); return; }
    var totalSeries = ex.series || 3;

    var labelEl = document.getElementById('prep-label');
    var countEl = document.getElementById('prep-countdown');
    if (labelEl) labelEl.textContent = 'Série ' + (this.currentSerieIndex + 1) + ' / ' + totalSeries + ' — Prêts ?';

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

  /* EXECUTION */
  WorkoutMode.prototype._showExecution = function() {
    this.phase = 'execution';
    this._clearPrepCountdown();
    this._showPhase('execution');

    var ex = this._getCurrentExercice();
    if (!ex) return;

    var repsStr = ex.reps || ex.reps_objectif || '10';
    var repsNum = this._parseRepsMin(repsStr);

    this._estimatedDuration = getEstimatedDuration(ex, repsNum, this.userLevel);
    this._serieStartTime = Date.now();
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
      });
    }
  };

  /* VALIDATION (success) */
  WorkoutMode.prototype._onValider = function() {
    ExerciseTimerBar.stop();
    var temps = Math.round((Date.now() - this._serieStartTime) / 1000);
    var ex = this._getCurrentExercice();
    var repsMin = this._parseRepsMin(ex ? (ex.reps || ex.reps_objectif) : '10');

    this._seriesData.push({
      serie: this.currentSerieIndex + 1,
      reps: repsMin,
      succes: true,
      ressenti: null,
      temps_execution: temps
    });

    this._afterSerie();
  };

  /* FAILURE */
  WorkoutMode.prototype._onRatee = function() {
    ExerciseTimerBar.stop();
    var ex = this._getCurrentExercice();
    var repsMin = this._parseRepsMin(ex ? (ex.reps || ex.reps_objectif) : '10');
    this._currentReps = Math.max(0, repsMin - 2);
    this._currentRessenti = 'moyen';

    document.getElementById('echecRepsVal').textContent = this._currentReps;
    document.getElementById('echecSerieNum').textContent = this.currentSerieIndex + 1;
    var totalSeries = ex ? (ex.series || 3) : 3;
    document.getElementById('echecSerieTotal').textContent = totalSeries;

    this._updateRessentiBtns('res-moyen');
    this._showPhase('echec');
  };

  WorkoutMode.prototype._adjustEchecReps = function(delta) {
    this._currentReps = Math.max(0, this._currentReps + delta);
    document.getElementById('echecRepsVal').textContent = this._currentReps;
  };

  WorkoutMode.prototype._confirmEchec = function() {
    var temps = Math.round((Date.now() - this._serieStartTime) / 1000);
    this._seriesData.push({
      serie: this.currentSerieIndex + 1,
      reps: this._currentReps,
      succes: false,
      ressenti: this._currentRessenti,
      temps_execution: temps
    });
    this._afterSerie();
  };

  /* COMMON POST-SERIES LOGIC */
  WorkoutMode.prototype._afterSerie = function() {
    var ex = this._getCurrentExercice();
    if (!ex) return;
    this.currentSerieIndex++;

    if (this.currentSerieIndex >= (ex.series || 3)) {
      /* End of exercise */
      this._showFinExercice();
    } else {
      /* More series → rest */
      var restSec = ex.repos || ex.repos_sec || this._defaultRestSeconds;
      this._showRest(restSec);
    }
  };

  /* REST PHASE */
  WorkoutMode.prototype._showRest = function(seconds) {
    this.phase = 'repos';
    var ex = this._getCurrentExercice();
    var nextSerie = this.currentSerieIndex + 1;
    var totalSeries = ex ? (ex.series || 3) : 3;

    document.getElementById('reposNextSerie').textContent = nextSerie;
    document.getElementById('reposSerieTotal').textContent = totalSeries;
    this._showPhase('repos');

    var self = this;
    RestTimer.start(
      seconds,
      document.getElementById('reposBar'),
      document.getElementById('reposTimeNum'),
      function() { self._startNextSerie(); }
    );
  };

  WorkoutMode.prototype._adjustRest = function(delta) {
    RestTimer.adjust(delta);
  };

  WorkoutMode.prototype._skipRest = function() {
    RestTimer.skip();
  };

  WorkoutMode.prototype._startNextSerie = function() {
    RestTimer.stop();
    this._showPreparation();
  };

  /* END OF EXERCISE */
  WorkoutMode.prototype._showFinExercice = function() {
    var ex = this._getCurrentExercice();
    if (!ex) { this._finishSession(); return; }

    var seriesOk = this._seriesData.filter(function(s) { return s.succes; }).length;
    document.getElementById('finExNom').textContent = ex.nom;
    document.getElementById('finExSeriesOk').textContent = seriesOk;

    this._ressentiFin = 'ok';
    this._difficulte = 3;
    this._updateRessentiFin('resf-ok');
    this._updateStars(3);

    this._showPhase('fin-exercice');
  };

  WorkoutMode.prototype._updateRessentiBtns = function(activeDataV) {
    var btns = document.querySelectorAll('.phase-echec .ressenti-btn');
    var selected = 'moyen';
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove('active');
      if (btns[i].id === activeDataV) {
        btns[i].classList.add('active');
        selected = btns[i].getAttribute('data-v');
      }
    }
    this._currentRessenti = selected;
  };

  WorkoutMode.prototype._updateRessentiFin = function(activeId) {
    var btns = document.querySelectorAll('.phase-fin-exercice .ressenti-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove('active');
      if (btns[i].id === activeId) {
        btns[i].classList.add('active');
        this._ressentiFin = btns[i].getAttribute('data-v');
      }
    }
  };

  WorkoutMode.prototype._updateStars = function(val) {
    this._difficulte = val;
    var stars = document.querySelectorAll('.star-btn');
    for (var i = 0; i < stars.length; i++) {
      stars[i].classList.toggle('active', i < val);
    }
  };

  WorkoutMode.prototype._nextExercise = function() {
    /* Save exercise data */
    var ex = this._getCurrentExercice();
    if (ex) {
      ex._series = this._seriesData;
      ex._ressenti_global = this._ressentiFin;
      ex._difficulte = this._difficulte;
    }

    /* Reset for next */
    this._seriesData = [];
    this.currentSerieIndex = 0;
    this.currentExIndex++;

    if (this.currentExIndex >= this.exercises.length) {
      this._finishSession();
    } else {
      this._showPreparation();
    }
  };

  /* SESSION END */
  WorkoutMode.prototype._finishSession = function() {
    ExerciseTimerBar.stop();
    RestTimer.stop();
    this._clearPrepCountdown();
    this._hideAllPhases();
    this._showDone();
  };

  WorkoutMode.prototype._showDone = function() {
    var donePhase = document.getElementById('wm-phase-done');
    if (donePhase) donePhase.style.display = 'flex';
    var progEl = document.getElementById('wm-progress');
    if (progEl) progEl.style.width = '100%';

    /* Calculate stats */
    var duration = Math.round((Date.now() - this.startTime) / 60000);
    var totalReps = 0, totalVolume = 0;
    for (var i = 0; i < this.exercises.length; i++) {
      var ex = this.exercises[i];
      if (ex._series) {
        for (var j = 0; j < ex._series.length; j++) {
          totalReps += ex._series[j].reps;
        }
      }
    }

    var statsEl = document.getElementById('wm-done-stats');
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="done-stat"><span>' + duration + '</span>min de séance</div>' +
        '<div class="done-stat"><span>' + totalReps + '</span>reps au total</div>' +
        '<div class="done-stat"><span>' + Math.round(totalVolume) + '</span>kg de volume</div>';
    }
  };

  WorkoutMode.prototype._saveSession = function() {
    var duration = Math.round((Date.now() - this.startTime) / 60000);

    /* Build exercise data with series info */
    var exercisesData = [];
    for (var i = 0; i < this.exercises.length; i++) {
      var ex = this.exercises[i];
      exercisesData.push({
        id: ex.id,
        nom: ex.nom,
        series_objectif: ex.series || 3,
        reps_objectif: ex.reps || ex.reps_objectif,
        repos_objectif: ex.repos || ex.repos_sec || 60,
        ressenti_global: ex._ressenti_global || '',
        difficulte: ex._difficulte || 0,
        series: ex._series || []
      });
    }

    if (typeof SW !== 'undefined') {
      SW.append('sw_sessions', {
        date: new Date().toISOString().slice(0, 10),
        nom: this.sessionName,
        duree_min: duration,
        exercices: exercisesData,
        volume_total: 0
      });
    }

    if (typeof showToast !== 'undefined') showToast('Séance sauvegardée ! 💪');
    window.dispatchEvent(new CustomEvent('session:saved', { detail: { exercices: exercisesData } }));
  };

  /* EVENTS */
  WorkoutMode.prototype._bindEvents = function() {
    var self = this;

    /* Preparation */
    document.getElementById('btn-skip-prep').addEventListener('click', function() {
      self._clearPrepCountdown();
      self._showExecution();
    });

    /* Execution */
    document.getElementById('btnValider').addEventListener('click', function() { self._onValider(); });
    document.getElementById('btnRatee').addEventListener('click', function() { self._onRatee(); });

    /* Failure state */
    document.getElementById('echecMinus').addEventListener('click', function() { self._adjustEchecReps(-1); });
    document.getElementById('echecPlus').addEventListener('click', function() { self._adjustEchecReps(+1); });

    var ressentiBtns = document.querySelectorAll('.phase-echec .ressenti-btn');
    for (var i = 0; i < ressentiBtns.length; i++) {
      ressentiBtns[i].addEventListener('click', function() {
        self._updateRessentiBtns(this.id);
      });
    }

    document.getElementById('btn-confirm-echec').addEventListener('click', function() { self._confirmEchec(); });

    /* End of exercise */
    var ressentiFin = document.querySelectorAll('.phase-fin-exercice .ressenti-btn');
    for (var j = 0; j < ressentiFin.length; j++) {
      ressentiFin[j].addEventListener('click', function() {
        self._updateRessentiFin(this.id);
      });
    }

    var starBtns = document.querySelectorAll('.star-btn');
    for (var k = 0; k < starBtns.length; k++) {
      starBtns[k].addEventListener('click', function() {
        self._updateStars(parseInt(this.getAttribute('data-v')));
      });
    }

    document.getElementById('btn-next-exercise').addEventListener('click', function() { self._nextExercise(); });

    /* Rest */
    document.getElementById('btnReposMinus').addEventListener('click', function() { self._adjustRest(-15); });
    document.getElementById('btnReposPlus').addEventListener('click', function() { self._adjustRest(+15); });
    document.getElementById('btn-skip-repos').addEventListener('click', function() { self._skipRest(); });

    /* Session */
    document.getElementById('wm-quit').addEventListener('click', function() {
      if (confirm('Terminer la séance maintenant ?')) {
        ExerciseTimerBar.stop();
        RestTimer.stop();
        self._clearPrepCountdown();
        self._finishSession();
      }
    });

    document.getElementById('wm-save-session').addEventListener('click', function() {
      self._saveSession();
      self.unmount();
    });
  };

  /* UTILS */
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
