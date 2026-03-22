/* ========================================
   TIMER.JS — 3 modes : Compte à rebours | Chronomètre | Séries intelligent
   Deps : storage.js (SW global)
   Backward-compat : TIMER.start/stop/pause/resume/reset, TIMER.running,
                     TIMER.remaining, timerBeep(), getRestPreset(), initTimerUI()
   ======================================== */

/* ══════════════════════════════════════════════════
   PRESETS REPOS
   ══════════════════════════════════════════════════ */
var EXERCISE_REST_PRESETS = {
  default:       { duration: 90,  label: '1m30' },
  pullups:       { duration: 120, label: '2min'  },
  dips:          { duration: 90,  label: '1m30'  },
  squats:        { duration: 90,  label: '1m30'  },
  muscle_up:     { duration: 180, label: '3min'  },
  front_lever:   { duration: 180, label: '3min'  },
  handstand:     { duration: 120, label: '2min'  },
  pistol_squat:  { duration: 120, label: '2min'  },
};

function getRestPreset(exerciseId) {
  return EXERCISE_REST_PRESETS[exerciseId] || EXERCISE_REST_PRESETS.default;
}

/* ── Bip audio ── */
function timerBeep(type) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'end') {
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } else {
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch(e) { /* audio not supported */ }
}

function formatTime(seconds) {
  var s = Math.max(0, Math.floor(seconds));
  var m = Math.floor(s / 60);
  var r = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}

/* ══════════════════════════════════════════════════
   TIMER — compte à rebours (backward-compatible)
   ══════════════════════════════════════════════════ */
var TIMER = (function() {
  var _duration  = 0;
  var _remaining = 0;
  var _interval  = null;
  var _onTick    = null;
  var _onEnd     = null;
  var _pub = {
    running:   false,
    remaining: 0,          /* public — lecture par workout-mode.js */

    start: function(duration, onTick, onEnd) {
      _duration   = duration;
      _remaining  = duration;
      _pub.remaining = duration;
      _onTick     = onTick || null;
      _onEnd      = onEnd  || null;
      _pub.running = true;
      clearInterval(_interval);
      _pub._updateUI();
      _interval = setInterval(function() {
        _remaining--;
        _pub.remaining = _remaining;
        _pub._updateUI();
        if (_onTick) _onTick(_remaining);
        if (_remaining <= 3 && _remaining > 0) timerBeep('tick');
        if (_remaining <= 0) {
          _pub.running = false;
          clearInterval(_interval);
          timerBeep('end');
          if (_onEnd) _onEnd();
          _pub._updateUI();
        }
      }, 1000);
    },

    pause: function() {
      if (!_pub.running) return;
      _pub.running = false;
      clearInterval(_interval);
    },

    resume: function() {
      if (_pub.running || _remaining <= 0) return;
      _pub.running = true;
      _interval = setInterval(function() {
        _remaining--;
        _pub.remaining = _remaining;
        _pub._updateUI();
        if (_onTick) _onTick(_remaining);
        if (_remaining <= 3 && _remaining > 0) timerBeep('tick');
        if (_remaining <= 0) {
          _pub.running = false;
          clearInterval(_interval);
          timerBeep('end');
          if (_onEnd) _onEnd();
          _pub._updateUI();
        }
      }, 1000);
    },

    stop: function() {
      _pub.running = false;
      clearInterval(_interval);
      _remaining = 0;
      _pub.remaining = 0;
      _pub._updateUI();
    },

    reset: function() {
      _pub.stop();
      _remaining = _duration;
      _pub.remaining = _duration;
      _pub._updateUI();
    },

    /* ── Mise à jour UI compte à rebours ── */
    _updateUI: function() {
      var display = document.getElementById('timer-display-cd');
      var circle  = document.getElementById('timer-circle-fill-cd');
      var btn     = document.getElementById('timer-start-cd');
      if (!display) {
        /* Legacy IDs (si HTML pas encore mis à jour) */
        display = document.getElementById('timer-display');
        circle  = document.getElementById('timer-circle-fill');
        btn     = document.getElementById('timer-start');
      }
      if (display) display.textContent = formatTime(_remaining);
      if (circle) {
        var pct = _duration > 0 ? _remaining / _duration : 0;
        var circ = 2 * Math.PI * 54;
        circle.style.strokeDashoffset = circ * (1 - pct);
      }
      if (btn) btn.textContent = _pub.running ? '⏸ Pause' : (_remaining > 0 && _remaining < _duration ? '▶ Reprendre' : '▶ Démarrer');
    },
  };
  return _pub;
})();

/* ══════════════════════════════════════════════════
   STOPWATCH — chronomètre
   ══════════════════════════════════════════════════ */
var STOPWATCH = (function() {
  var _elapsed  = 0;
  var _interval = null;
  var _pub = {
    running: false,
    elapsed: 0,

    start: function() {
      if (_pub.running) return;
      _pub.running = true;
      _interval = setInterval(function() {
        _elapsed++;
        _pub.elapsed = _elapsed;
        _pub._updateUI();
      }, 1000);
    },

    pause: function() {
      _pub.running = false;
      clearInterval(_interval);
    },

    reset: function() {
      _pub.pause();
      _elapsed = 0;
      _pub.elapsed = 0;
      _pub._updateUI();
    },

    _updateUI: function() {
      var display = document.getElementById('timer-display-sw');
      if (display) display.textContent = formatTime(_elapsed);
      var btn = document.getElementById('timer-start-sw');
      if (btn) btn.textContent = _pub.running ? '⏸ Pause' : '▶ Reprendre';
    },
  };
  return _pub;
})();

/* ══════════════════════════════════════════════════
   SERIES TIMER — séries intelligent
   ══════════════════════════════════════════════════ */
var SERIES_TIMER = (function() {
  var _totalSeries = 4;
  var _workSec     = 40;
  var _restSec     = 90;
  var _currentSet  = 0;
  var _phase       = 'idle';   /* idle | work | rest | done */
  var _remaining   = 0;
  var _interval    = null;

  function _tick() {
    _remaining--;
    _pub._updateUI();
    if (_remaining <= 3 && _remaining > 0) timerBeep('tick');
    if (_remaining <= 0) {
      clearInterval(_interval);
      if (_phase === 'work') {
        if (_currentSet >= _totalSeries) {
          _phase = 'done';
          timerBeep('end');
          _pub._updateUI();
          return;
        }
        _phase     = 'rest';
        _remaining = _restSec;
        timerBeep('end');
        _pub._updateUI();
        _interval = setInterval(_tick, 1000);
      } else if (_phase === 'rest') {
        _currentSet++;
        _phase     = 'work';
        _remaining = _workSec;
        timerBeep('tick');
        _pub._updateUI();
        _interval = setInterval(_tick, 1000);
      }
    }
  }

  var _pub = {
    start: function() {
      if (_phase !== 'idle') return;
      _totalSeries = parseInt((document.getElementById('series-count') || {}).value || 4);
      _workSec     = parseInt((document.getElementById('series-work') || {}).value  || 40);
      _restSec     = parseInt((document.getElementById('series-rest') || {}).value  || 90);
      _currentSet  = 1;
      _phase       = 'work';
      _remaining   = _workSec;
      _pub._updateUI();
      _interval = setInterval(_tick, 1000);
    },

    stop: function() {
      clearInterval(_interval);
      _phase      = 'idle';
      _currentSet = 0;
      _remaining  = 0;
      _pub._updateUI();
    },

    _updateUI: function() {
      var display = document.getElementById('timer-display-st');
      var phaseEl = document.getElementById('series-phase');
      var setEl   = document.getElementById('series-set');
      var bar     = document.getElementById('series-phase-bar');

      if (display) {
        display.textContent = _phase === 'done' ? '✅ Terminé !' : (_phase === 'idle' ? '--:--' : formatTime(_remaining));
      }
      if (phaseEl) {
        var labels = { idle:'En attente', work:'💪 Effort', rest:'😮‍💨 Repos', done:'✅ Terminé' };
        phaseEl.textContent = labels[_phase] || '';
        phaseEl.className = 'series-phase series-phase--' + _phase;
      }
      if (setEl) {
        setEl.textContent = _phase === 'done' || _phase === 'idle' ? '' : ('Série ' + _currentSet + ' / ' + _totalSeries);
      }
      if (bar) {
        var total = _phase === 'work' ? _workSec : _restSec;
        var pct   = total > 0 ? (_remaining / total) * 100 : 0;
        bar.style.width = pct + '%';
        bar.style.background = _phase === 'work' ? 'var(--accent)' : 'var(--secondary, #4caf50)';
      }
      var startBtn = document.getElementById('series-start');
      if (startBtn) startBtn.disabled = (_phase !== 'idle');
      var stopBtn = document.getElementById('series-stop');
      if (stopBtn) stopBtn.disabled = (_phase === 'idle' || _phase === 'done');
    },
  };
  return _pub;
})();

/* ══════════════════════════════════════════════════
   initTimerUI(containerId) — injecte le HTML + branche les events
   ══════════════════════════════════════════════════ */
function initTimerUI(containerId) {
  var container = document.getElementById(containerId || 'timer-container');
  if (!container) return;

  container.innerHTML = [
    '<div class="timer-tabs">',
    '  <button class="timer-tab timer-tab--active" data-tab="cd">⏱ Compte à rebours</button>',
    '  <button class="timer-tab" data-tab="sw">⏲ Chronomètre</button>',
    '  <button class="timer-tab" data-tab="st">🔁 Séries</button>',
    '</div>',

    /* ── Panel Compte à rebours ── */
    '<div class="timer-panel timer-panel--active" id="panel-cd">',
    '  <svg class="timer-arc-svg" viewBox="0 0 120 120">',
    '    <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border,#2a2a2a)" stroke-width="8"/>',
    '    <circle id="timer-circle-fill-cd" cx="60" cy="60" r="54" fill="none"',
    '      stroke="var(--accent,#e63946)" stroke-width="8" stroke-linecap="round"',
    '      stroke-dasharray="339.3" stroke-dashoffset="0"',
    '      transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 0.8s linear"/>',
    '  </svg>',
    '  <div id="timer-display" class="timer-display" style="display:none"></div>',
    '  <div id="timer-display-cd" class="timer-display">00:00</div>',
    '  <div class="timer-presets">',
    '    <button class="preset-btn" data-timer-duration="30">30s</button>',
    '    <button class="preset-btn" data-timer-duration="60">1min</button>',
    '    <button class="preset-btn" data-timer-duration="90">1m30</button>',
    '    <button class="preset-btn" data-timer-duration="120">2min</button>',
    '    <button class="preset-btn" data-timer-duration="180">3min</button>',
    '  </div>',
    '  <div class="timer-controls">',
    '    <button id="timer-start-cd" class="btn btn-primary">▶ Démarrer</button>',
    '    <button id="timer-reset-cd" class="btn btn-secondary">↺ Reset</button>',
    '  </div>',
    '</div>',

    /* ── Panel Chronomètre ── */
    '<div class="timer-panel" id="panel-sw">',
    '  <div id="timer-display-sw" class="timer-display">00:00</div>',
    '  <div class="timer-controls">',
    '    <button id="timer-start-sw" class="btn btn-primary">▶ Démarrer</button>',
    '    <button id="timer-reset-sw" class="btn btn-secondary">↺ Reset</button>',
    '  </div>',
    '</div>',

    /* ── Panel Séries ── */
    '<div class="timer-panel" id="panel-st">',
    '  <div class="series-config">',
    '    <label>Séries <input id="series-count" type="number" min="1" max="20" value="4" class="series-input"></label>',
    '    <label>Effort (s) <input id="series-work" type="number" min="5" max="300" value="40" class="series-input"></label>',
    '    <label>Repos (s) <input id="series-rest" type="number" min="5" max="600" value="90" class="series-input"></label>',
    '  </div>',
    '  <div class="series-phase-bar-wrap"><div id="series-phase-bar" class="series-phase-bar"></div></div>',
    '  <div id="series-phase" class="series-phase series-phase--idle">En attente</div>',
    '  <div id="timer-display-st" class="timer-display">--:--</div>',
    '  <div id="series-set" class="series-set-label"></div>',
    '  <div class="timer-controls">',
    '    <button id="series-start" class="btn btn-primary">▶ Lancer</button>',
    '    <button id="series-stop"  class="btn btn-secondary" disabled>⏹ Stop</button>',
    '  </div>',
    '</div>',
  ].join('\n');

  /* ── Branchement onglets ── */
  container.querySelectorAll('.timer-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.getAttribute('data-tab');
      container.querySelectorAll('.timer-tab').forEach(function(t) { t.classList.remove('timer-tab--active'); });
      container.querySelectorAll('.timer-panel').forEach(function(p) { p.classList.remove('timer-panel--active'); });
      tab.classList.add('timer-tab--active');
      var panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('timer-panel--active');
    });
  });

  /* ── Compte à rebours ── */
  var selectedDuration = 90;
  container.querySelectorAll('[data-timer-duration]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('[data-timer-duration]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      selectedDuration = parseInt(btn.getAttribute('data-timer-duration'));
      if (!TIMER.running) {
        TIMER._remaining_local = selectedDuration;
        var disp = document.getElementById('timer-display-cd');
        if (disp) disp.textContent = formatTime(selectedDuration);
      }
    });
  });
  var startCd = document.getElementById('timer-start-cd');
  if (startCd) {
    startCd.addEventListener('click', function() {
      if (TIMER.running) {
        TIMER.pause();
        startCd.textContent = '▶ Reprendre';
      } else if (TIMER.remaining > 0) {
        TIMER.resume();
        startCd.textContent = '⏸ Pause';
      } else {
        TIMER.start(selectedDuration);
        startCd.textContent = '⏸ Pause';
      }
    });
  }
  var resetCd = document.getElementById('timer-reset-cd');
  if (resetCd) {
    resetCd.addEventListener('click', function() {
      TIMER.stop();
      if (startCd) startCd.textContent = '▶ Démarrer';
    });
  }

  /* ── Chronomètre ── */
  var startSw = document.getElementById('timer-start-sw');
  if (startSw) {
    startSw.addEventListener('click', function() {
      if (STOPWATCH.running) {
        STOPWATCH.pause();
        startSw.textContent = '▶ Reprendre';
      } else {
        STOPWATCH.start();
        startSw.textContent = '⏸ Pause';
      }
    });
  }
  var resetSw = document.getElementById('timer-reset-sw');
  if (resetSw) {
    resetSw.addEventListener('click', function() {
      STOPWATCH.reset();
      if (startSw) startSw.textContent = '▶ Démarrer';
    });
  }

  /* ── Séries ── */
  var seriesStart = document.getElementById('series-start');
  if (seriesStart) seriesStart.addEventListener('click', function() { SERIES_TIMER.start(); });
  var seriesStop = document.getElementById('series-stop');
  if (seriesStop) seriesStop.addEventListener('click', function() { SERIES_TIMER.stop(); });

  /* Sélectionner preset 1m30 par défaut */
  var defaultPreset = container.querySelector('[data-timer-duration="90"]');
  if (defaultPreset) defaultPreset.click();
}
