/* ========================================
   TIMER.JS — Rest Timer Between Sets
   ======================================== */

/* ==================== EXERCISE REST PRESETS (scientific, seconds) ==================== */
/* Sources : Schoenfeld 2017 (J Strength Cond Res), NSCA Position Statement 2016        */
var EXERCISE_REST_PRESETS = {
  planche:      180,
  human_flag:   180,
  front_lever:  150,
  back_lever:   150,
  l_sit:        120,
  muscle_up:    120,
  handstand:    120,
  dragon_flag:  120,
  hspu:          90,
  tractions:     90,
  dips:          90,
  squat:         60,
  pompes:        60,
  repos:           0
};

function getRestPreset(exerciseId) {
  if (!exerciseId) return 90;
  return EXERCISE_REST_PRESETS[exerciseId] !== undefined ? EXERCISE_REST_PRESETS[exerciseId] : 90;
}

var TIMER = {
  duration: 90,
  remaining: 0,
  interval: null,
  running: false,
  onTick: null,
  onEnd: null,

  start: function(seconds, onTick, onEnd) {
    if (TIMER.running) return;
    TIMER.remaining = seconds || TIMER.remaining || TIMER.duration;
    TIMER.onTick = onTick || TIMER.onTick;
    TIMER.onEnd = onEnd || TIMER.onEnd;
    TIMER.running = true;

    if (TIMER.onTick) TIMER.onTick(TIMER.remaining);

    TIMER.interval = setInterval(function() {
      TIMER.remaining--;
      if (TIMER.onTick) TIMER.onTick(TIMER.remaining);

      if (TIMER.remaining <= 0) {
        TIMER.stop();
        if (TIMER.onEnd) TIMER.onEnd();
        timerBeep();
      }
    }, 1000);
  },

  pause: function() {
    if (!TIMER.running) return;
    clearInterval(TIMER.interval);
    TIMER.interval = null;
    TIMER.running = false;
  },

  resume: function() {
    if (TIMER.running || TIMER.remaining <= 0) return;
    TIMER.start(null, null, null);
  },

  stop: function() {
    clearInterval(TIMER.interval);
    TIMER.interval = null;
    TIMER.running = false;
  },

  reset: function(seconds) {
    TIMER.stop();
    TIMER.remaining = seconds || TIMER.duration;
    if (TIMER.onTick) TIMER.onTick(TIMER.remaining);
  }
};

/* Format seconds to MM:SS */
function formatTime(s) {
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

/* Beep sound using Web Audio API */
function timerBeep() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    /* Play 3 short beeps */
    for (var i = 0; i < 3; i++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.15);
    }
  } catch (e) {
    /* Audio not supported — fail silently */
  }
}

/* Initialize timer UI */
function initTimerUI() {
  var display = document.getElementById('timer-display');
  var circle = document.getElementById('timer-circle-fill');
  var startBtn = document.getElementById('timer-start');
  var pauseBtn = document.getElementById('timer-pause');
  var resetBtn = document.getElementById('timer-reset');
  var durationBtns = document.querySelectorAll('[data-timer-duration]');
  var customInput = document.getElementById('timer-custom');

  if (!display) return;

  var totalDuration = TIMER.duration;

  function updateUI(remaining) {
    display.textContent = formatTime(remaining);
    /* Update SVG circle */
    if (circle) {
      var circumference = 2 * Math.PI * 54;
      var pct = totalDuration > 0 ? remaining / totalDuration : 0;
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = circumference * (1 - pct);
    }
  }

  function onTimerEnd() {
    if (startBtn) startBtn.style.display = '';
    if (pauseBtn) pauseBtn.style.display = 'none';
    display.style.color = 'var(--primary)';
    display.textContent = '00:00';
  }

  /* Set initial display */
  updateUI(TIMER.duration);

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      totalDuration = TIMER.remaining || TIMER.duration;
      display.style.color = '';
      startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = '';
      TIMER.start(TIMER.remaining || TIMER.duration, updateUI, onTimerEnd);
    });
  }

  if (pauseBtn) {
    pauseBtn.style.display = 'none';
    pauseBtn.addEventListener('click', function() {
      if (TIMER.running) {
        TIMER.pause();
        pauseBtn.textContent = '▶ Reprendre';
      } else {
        TIMER.resume();
        pauseBtn.textContent = '⏸ Pause';
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      TIMER.reset(TIMER.duration);
      totalDuration = TIMER.duration;
      updateUI(TIMER.duration);
      display.style.color = '';
      if (startBtn) startBtn.style.display = '';
      if (pauseBtn) {
        pauseBtn.style.display = 'none';
        pauseBtn.textContent = '⏸ Pause';
      }
    });
  }

  /* Duration presets */
  durationBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      durationBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var sec = parseInt(btn.getAttribute('data-timer-duration'));
      TIMER.duration = sec;
      TIMER.reset(sec);
      totalDuration = sec;
      updateUI(sec);
      if (startBtn) startBtn.style.display = '';
      if (pauseBtn) {
        pauseBtn.style.display = 'none';
        pauseBtn.textContent = '⏸ Pause';
      }
      if (customInput) customInput.value = '';
    });
  });

  /* Custom duration */
  if (customInput) {
    customInput.addEventListener('change', function() {
      var val = parseInt(customInput.value);
      if (val && val > 0 && val <= 600) {
        durationBtns.forEach(function(b) { b.classList.remove('active'); });
        TIMER.duration = val;
        TIMER.reset(val);
        totalDuration = val;
        updateUI(val);
        if (startBtn) startBtn.style.display = '';
        if (pauseBtn) {
          pauseBtn.style.display = 'none';
          pauseBtn.textContent = '⏸ Pause';
        }
      }
    });
  }
}
