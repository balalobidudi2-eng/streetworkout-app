/* ═══════════════════════════════════════════════════════
   ENTRAÎNEMENT — js/entrainement.js
   Objectif, Planning, Calendrier, Programme, Test, Séances
   ═══════════════════════════════════════════════════════ */

var SW_ENTRAINEMENT = (function() {

  var calYear, calMonth;

  /* ── Test exercice config ── */
  var TEST_EXERCISES = [
    { id: 'tractions', nom: 'Tractions',  unite: 'reps',     duree: 60,  max: 50,  poids: 0.40 },
    { id: 'dips',      nom: 'Dips',       unite: 'reps',     duree: 60,  max: 40,  poids: 0.25 },
    { id: 'pompes',    nom: 'Pompes',     unite: 'reps',     duree: 60,  max: 80,  poids: 0.20 },
    { id: 'gainage',   nom: 'Gainage',    unite: 'secondes', duree: 120, max: 300, poids: 0.15 }
  ];
  var REST_DEFAULT = 240; // 4 minutes

  function init() {
    initObjectif();
    initSkills();
    initPlanning();
    initPlanningExtra();
    initCalendar();
    initLevel();
    initTestModal();
    initSeanceModal();
    initStatsModal();
    initNiveauModal();
    initSuivi();
    bindGenerate();
    recalculerNiveau();
    initExEditor();
  }

  /* ═══════ A. OBJECTIF ═══════ */
  function initObjectif() {
    var profil = SW_STORAGE.load('sw_profil') || {};
    var cards = document.querySelectorAll('.obj-card');
    cards.forEach(function(c) {
      if (c.dataset.obj === profil.objectif) c.classList.add('active');
      c.addEventListener('click', function() {
        cards.forEach(function(x) { x.classList.remove('active'); });
        c.classList.add('active');
        SW_STORAGE.update('sw_profil', { objectif: c.dataset.obj });
        refreshGenerateBtn();
        checkStaleProgramme();
      });
    });
  }

  /* ═══════ A2. SKILLS ═══════ */
  function initSkills() {
    var profil = SW_STORAGE.load('sw_profil') || {};
    var savedSkills = profil.skills || [];
    var btns = document.querySelectorAll('.skill-pill');
    btns.forEach(function(b) {
      if (savedSkills.indexOf(b.dataset.skill) !== -1) b.classList.add('active');
      b.addEventListener('click', function() {
        b.classList.toggle('active');
        var sel = [];
        document.querySelectorAll('.skill-pill.active').forEach(function(s) {
          sel.push(s.dataset.skill);
        });
        SW_STORAGE.update('sw_profil', { skills: sel });
        checkSkillsWarning(sel.length);
        updateSkillProgressionPanel(sel.length > 0 ? sel[0] : null);
        checkStaleProgramme();
      });
    });
    /* Check on load */
    checkSkillsWarning(savedSkills.length);
    updateSkillProgressionPanel(savedSkills.length > 0 ? savedSkills[0] : null);
  }

  function updateSkillProgressionPanel(skill) {
    var panel = document.getElementById('skill-progression-panel');
    if (!panel) return;
    if (!skill || !SW_API.SKILL_PROGRESSIONS || !SW_API.SKILL_PROGRESSIONS[skill]) {
      panel.style.display = 'none';
      return;
    }
    var prog = SW_API.SKILL_PROGRESSIONS[skill];
    var nameEl = document.getElementById('skill-prog-name');
    if (nameEl) nameEl.textContent = prog.label;

    /* Determine current level: prefer manual selection, fallback to test-based */
    var profil = SW_STORAGE.load('sw_profil') || {};
    var manualLevels = profil.skillLevels || {};
    var manualLevel = manualLevels[skill] || 0;
    var testDetail = profil.testDetail || {};
    var tier = SW_API.getSkillTier ? SW_API.getSkillTier(skill, testDetail) : 'debutant';
    var autoLevel = tier === 'avance' ? 5 : tier === 'intermediaire' ? 3 : 1;
    var currentLevel = manualLevel || autoLevel;

    var levelsEl = document.getElementById('skill-prog-levels');
    if (levelsEl) {
      var icons = ['\uD83D\uDCAA', '\uD83D\uDCAA', '\u2699\uFE0F', '\u2B50', '\uD83C\uDFC6'];
      levelsEl.innerHTML = prog.levels.map(function(lvl) {
        var isCurrent = lvl.level === currentLevel;
        var isBelow = lvl.level < currentLevel;
        var cls = 'skill-prog-step';
        if (isCurrent) cls += ' current';
        if (isBelow)   cls += ' completed';
        return '<div class="' + cls + '" data-skill="' + skill + '" data-level="' + lvl.level + '">' +
          '<span class="skill-step-num">' + lvl.level + '</span>' +
          '<div class="skill-step-img">' + (icons[lvl.level - 1] || lvl.level) + '</div>' +
          '<div class="skill-step-label">' + lvl.label + '</div>' +
          '<div class="skill-step-desc">' + lvl.desc + '</div>' +
        '</div>';
      }).join('<div class="skill-prog-arrow">\u203A</div>');

      /* Bind click to select level */
      levelsEl.querySelectorAll('.skill-prog-step').forEach(function(step) {
        step.style.cursor = 'pointer';
        step.addEventListener('click', function() {
          var sk  = step.dataset.skill;
          var lv  = parseInt(step.dataset.level);
          var p   = SW_STORAGE.load('sw_profil') || {};
          if (!p.skillLevels) p.skillLevels = {};
          p.skillLevels[sk] = lv;
          SW_STORAGE.save('sw_profil', p);
          updateSkillProgressionPanel(sk);
          checkStaleProgramme();
          SW_PROFIL.showToast(prog.label + ' : niveau ' + lv + ' sélectionné');
        });
      });
    }

    /* Show info about selection */
    var infoEl = document.getElementById('skill-prog-info');
    if (!infoEl) {
      infoEl = document.createElement('p');
      infoEl.id = 'skill-prog-info';
      infoEl.className = 'skill-prog-info';
      var card = panel.querySelector('.skill-prog-card');
      if (card) card.appendChild(infoEl);
    }
    if (manualLevel) {
      infoEl.textContent = 'Niveau sélectionné manuellement. Le programme s\'adaptera à ce niveau.';
    } else {
      infoEl.textContent = 'Niveau estimé depuis ton test. Clique sur un niveau pour le définir manuellement.';
    }

    panel.style.display = 'block';
  }

  function checkSkillsWarning(count) {
    var warn = document.getElementById('skills-warning');
    if (warn) warn.style.display = count > 2 ? 'flex' : 'none';
  }

  /* ═══════ B. PLANNING ═══════ */
  function initPlanning() {
    var profil = SW_STORAGE.load('sw_profil') || {};
    var pills = document.querySelectorAll('.freq-pill');
    var daysRow = document.getElementById('days-row');
    var dayBtns = daysRow ? daysRow.querySelectorAll('.day-check') : [];

    var savedFreq = profil.frequence || 0;
    var savedDays = profil.jours || [];

    pills.forEach(function(p) {
      if (parseInt(p.dataset.freq) === savedFreq) p.classList.add('active');
      p.addEventListener('click', function() {
        pills.forEach(function(x) { x.classList.remove('active'); });
        p.classList.add('active');
        var freq = parseInt(p.dataset.freq);
        enableDays(freq);
      });
    });

    if (savedFreq > 0) enableDays(savedFreq, true /* keepDays */);
    /* Check warnings on load */
    checkConsecutiveDays(savedDays, savedFreq);

    dayBtns.forEach(function(d) {
      if (savedDays.indexOf(d.dataset.day) !== -1) d.classList.add('active');
      d.addEventListener('click', function() {
        if (d.classList.contains('disabled')) return;
        var freq = getSelectedFreq();
        var activeDays = daysRow.querySelectorAll('.day-check.active');
        if (!d.classList.contains('active') && activeDays.length >= freq) return;
        d.classList.toggle('active');
        saveDays();
        refreshGenerateBtn();
      });
    });

    /* Restore generate button state with saved days */
    if (savedFreq > 0 && savedDays.length > 0) refreshGenerateBtn();

    function enableDays(freq, keepDays) {
      dayBtns.forEach(function(d) {
        d.classList.remove('disabled', 'active');
      });
      if (keepDays) {
        SW_STORAGE.update('sw_profil', { frequence: freq });
      } else {
        SW_STORAGE.update('sw_profil', { frequence: freq, jours: [] });
      }
      refreshGenerateBtn();
      checkStaleProgramme();
    }

    function getSelectedFreq() {
      var active = document.querySelector('.freq-pill.active');
      return active ? parseInt(active.dataset.freq) : 0;
    }

    function saveDays() {
      var sel = [];
      daysRow.querySelectorAll('.day-check.active').forEach(function(d) {
        sel.push(d.dataset.day);
      });
      SW_STORAGE.update('sw_profil', { jours: sel });
      checkConsecutiveDays(sel, getSelectedFreq());
      checkStaleProgramme();
    }
  }

  var DAY_ORDER = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

  /* ═══════ B2. PLANNING EXTRA (temps, lieu, lesté) ═══════ */
  function initPlanningExtra() {
    var profil = SW_STORAGE.load('sw_profil') || {};

    /* — Durée séance — */
    var dureePills = document.querySelectorAll('.duree-pill');
    dureePills.forEach(function(p) {
      if (parseInt(p.dataset.duree) === profil.dureeSeance) p.classList.add('active');
      p.addEventListener('click', function() {
        dureePills.forEach(function(x) { x.classList.remove('active'); });
        p.classList.add('active');
        SW_STORAGE.update('sw_profil', { dureeSeance: parseInt(p.dataset.duree) });
        checkStaleProgramme();
      });
    });

    /* — Lieu — */
    var lieuPills = document.querySelectorAll('.lieu-pill');
    lieuPills.forEach(function(p) {
      if (p.dataset.lieu === profil.lieu) p.classList.add('active');
      p.addEventListener('click', function() {
        lieuPills.forEach(function(x) { x.classList.remove('active'); });
        p.classList.add('active');
        SW_STORAGE.update('sw_profil', { lieu: p.dataset.lieu });
        checkStaleProgramme();
      });
    });

    /* — Ceinture lestée (0 / 20 / 40 kg) — */
    var ceintureSteps = [0, 20, 40];
    var ceintureIdx = ceintureSteps.indexOf(profil.ceinture || 0);
    if (ceintureIdx < 0) ceintureIdx = 0;
    function updateCeinture() {
      var val = ceintureSteps[ceintureIdx];
      var el = document.getElementById('ceinture-val');
      if (el) el.textContent = val + ' kg';
      SW_STORAGE.update('sw_profil', { ceinture: val });
      checkStaleProgramme();
    }
    updateCeinture();
    var ceintureMinus = document.getElementById('ceinture-minus');
    var ceintureplus  = document.getElementById('ceinture-plus');
    if (ceintureMinus) ceintureMinus.addEventListener('click', function() {
      if (ceintureIdx > 0) { ceintureIdx--; updateCeinture(); }
    });
    if (ceintureplus) ceintureplus.addEventListener('click', function() {
      if (ceintureIdx < ceintureSteps.length - 1) { ceintureIdx++; updateCeinture(); }
    });

    /* — Gilet lesté (0–20 kg, pas de 1 kg) — */
    var giletVal = profil.gilet || 0;
    function updateGilet() {
      var el = document.getElementById('gilet-val');
      if (el) el.textContent = giletVal + ' kg';
      SW_STORAGE.update('sw_profil', { gilet: giletVal });
      checkStaleProgramme();
    }
    updateGilet();
    var giletMinus = document.getElementById('gilet-minus');
    var giletPlus  = document.getElementById('gilet-plus');
    if (giletMinus) giletMinus.addEventListener('click', function() {
      if (giletVal > 0) { giletVal--; updateGilet(); }
    });
    if (giletPlus) giletPlus.addEventListener('click', function() {
      if (giletVal < 20) { giletVal++; updateGilet(); }
    });
  }

  function checkConsecutiveDays(days, freq) {
    var warn = document.getElementById('days-warning');
    if (!warn) return;
    /* Only warn for freq 2 or 3 */
    if (freq > 3 || days.length < 2) { warn.style.display = 'none'; return; }
    var indices = days.map(function(d) { return DAY_ORDER.indexOf(d); }).filter(function(i) { return i !== -1; });
    indices.sort(function(a, b) { return a - b; });
    var hasConsecutive = false;
    for (var i = 0; i < indices.length - 1; i++) {
      if (indices[i + 1] - indices[i] === 1) { hasConsecutive = true; break; }
    }
    /* Also check Sunday → Monday wrap */
    if (!hasConsecutive && indices.indexOf(6) !== -1 && indices.indexOf(0) !== -1) {
      hasConsecutive = true;
    }
    warn.style.display = hasConsecutive ? 'flex' : 'none';
  }

  function refreshGenerateBtn() {
    var btn = document.getElementById('btn-generate');
    if (!btn) return;
    var profil = SW_STORAGE.load('sw_profil') || {};
    var ok = profil.objectif && profil.jours && profil.jours.length > 0 &&
             profil.frequence && profil.jours.length === profil.frequence;
    btn.disabled = !ok;
  }

  /* ═══════ C. CALENDRIER ═══════ */
  function initCalendar() {
    var now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendar();

    var prev = document.getElementById('cal-prev');
    var next = document.getElementById('cal-next');
    if (prev) prev.addEventListener('click', function() {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar();
    });
    if (next) next.addEventListener('click', function() {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar();
    });
  }

  function renderCalendar() {
    var title = document.getElementById('cal-title');
    var grid = document.getElementById('cal-grid');
    if (!title || !grid) return;

    var months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    title.textContent = months[calMonth] + ' ' + calYear;

    var seances = SW_STORAGE.load('sw_seances') || [];
    var seanceDates = {};
    seances.forEach(function(s) {
      if (s.statut === 'effectuee' && s.date) seanceDates[s.date] = true;
    });

    var first = new Date(calYear, calMonth, 1);
    var startDay = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    var html = '';
    for (var e = 0; e < startDay; e++) {
      html += '<div class="cal-day empty"></div>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = calYear + '-' +
        String(calMonth + 1).padStart(2, '0') + '-' +
        String(d).padStart(2, '0');
      var cls = 'cal-day';
      if (dateStr === todayStr) cls += ' today';
      if (seanceDates[dateStr]) cls += ' done';
      html += '<div class="' + cls + '">' + d + '</div>';
    }
    grid.innerHTML = html;
  }

  /* ═══════ C2. LEVEL ═══════ */
  function initLevel() {
    renderLevel();
    /* Make level card clickable */
    var card = document.querySelector('.level-card');
    if (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function(e) {
        if (e.target.closest('#btn-open-test')) return; // don't intercept test button
        afficherDetailsNiveau();
      });
    }
  }

  function renderLevel() {
    var profil = SW_STORAGE.load('sw_profil') || {};
    var niv = profil.niveau || 'Débutant';

    var seances = SW_STORAGE.load('sw_seances') || [];
    var done = seances.filter(function(s) { return s.statut === 'effectuee'; }).length;

    var levels = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
    var idx = levels.indexOf(niv);
    if (idx < 0) idx = 0;
    var pct = ((idx) / 3) * 100;

    var next = idx < 3 ? levels[idx + 1] : null;

    var badge = document.getElementById('level-badge');
    var bar = document.getElementById('level-bar');
    var info = document.getElementById('level-info');

    if (badge) badge.textContent = niv;
    if (bar) bar.style.width = Math.min(pct, 100) + '%';
    if (info) info.textContent = next
      ? 'Continue pour atteindre ' + next
      : 'Niveau maximum atteint !';
  }

  /* ═══════ RECALCULER NIVEAU ═══════ */
  function recalculerNiveau() {
    var testData = SW_STORAGE.load('sw_test');
    var seances = SW_STORAGE.load('sw_seances') || [];
    var done = seances.filter(function(s) { return s.statut === 'effectuee'; }).length;

    var niv;

    if (testData && typeof testData.score === 'number') {
      /* Priority 1: test score */
      var score = testData.score;
      if      (score >= 90) niv = 'Expert';
      else if (score >= 65) niv = 'Avancé';
      else if (score >= 35) niv = 'Intermédiaire';
      else                  niv = 'Débutant';
    } else {
      /* Priority 2: session count */
      if      (done >= 31) niv = 'Expert';
      else if (done >= 16) niv = 'Avancé';
      else if (done >= 6)  niv = 'Intermédiaire';
      else                 niv = 'Débutant';
    }

    SW_STORAGE.update('sw_profil', { niveau: niv });
    renderLevel();
    SW_PROFIL.renderStats();
  }

  /* ═══════ C3. TEST DE NIVEAU (interactif chronométré) ═══════ */
  var testState = {};

  function initTestModal() {
    var openBtn = document.getElementById('btn-open-test');
    var overlay = document.getElementById('test-overlay');
    var closeBtn = document.getElementById('test-close');

    if (!openBtn || !overlay) return;

    openBtn.addEventListener('click', function() { ouvrirTest(); });
    closeBtn.addEventListener('click', function() { fermerTest(); });

    /* Intro start */
    var startBtn = document.getElementById('test-btn-start');
    if (startBtn) startBtn.addEventListener('click', function() { lancerExercice(0); });

    /* Score next */
    var nextBtn = document.getElementById('test-btn-next');
    if (nextBtn) nextBtn.addEventListener('click', function() { validerScore(); });

    /* Rest controls */
    var minusBtn = document.getElementById('rest-minus');
    var plusBtn = document.getElementById('rest-plus');
    var skipBtn = document.getElementById('rest-skip');
    if (minusBtn) minusBtn.addEventListener('click', function() { ajusterRepos(-60); });
    if (plusBtn)  plusBtn.addEventListener('click', function()  { ajusterRepos(60); });
    if (skipBtn)  skipBtn.addEventListener('click', function()  { skipRepos(); });

    /* Results close */
    var resultsClose = document.getElementById('results-close');
    if (resultsClose) resultsClose.addEventListener('click', function() { fermerTest(); });
  }

  function ouvrirTest() {
    var overlay = document.getElementById('test-overlay');
    if (!overlay) return;

    testState = { exIndex: 0, scores: {}, timerId: null, restTimerId: null, restSeconds: 0 };

    /* Build intro exercises list */
    var list = document.getElementById('test-exercises-list');
    if (list) {
      var html = '';
      TEST_EXERCISES.forEach(function(ex) {
        html += '<div class="test-ex-item"><span>' + esc(ex.nom) + '</span><span>' +
                ex.duree + 's — ' + ex.unite + '</span></div>';
      });
      list.innerHTML = html;
    }

    showTestScreen('intro');
    overlay.classList.add('open');
  }

  function fermerTest() {
    var overlay = document.getElementById('test-overlay');
    if (overlay) overlay.classList.remove('open');
    if (testState.timerId) clearInterval(testState.timerId);
    if (testState.restTimerId) clearInterval(testState.restTimerId);
    testState = {};
  }

  function showTestScreen(name) {
    var screens = document.querySelectorAll('.test-screen');
    screens.forEach(function(s) { s.classList.remove('active'); });
    var target = document.getElementById('test-screen-' + name);
    if (target) target.classList.add('active');
  }

  function lancerExercice(index) {
    testState.exIndex = index;
    var ex = TEST_EXERCISES[index];
    if (!ex) return;

    var nameEl = document.getElementById('test-ex-name');
    var infoEl = document.getElementById('test-ex-info');
    var scoreWrap = document.getElementById('score-input-wrap');
    var scoreInput = document.getElementById('score-input');
    var timerText = document.getElementById('timer-text');
    var timerCircle = document.getElementById('timer-circle');

    if (nameEl) nameEl.textContent = ex.nom;
    if (infoEl) infoEl.textContent = 'Max en ' + ex.duree + ' secondes (' + ex.unite + ')';
    if (scoreWrap) scoreWrap.style.display = 'none';
    if (scoreInput) scoreInput.value = '';
    if (timerText) timerText.textContent = ex.duree;

    var circumference = 2 * Math.PI * 90; // ~565.49
    if (timerCircle) {
      timerCircle.style.strokeDasharray = circumference;
      timerCircle.style.strokeDashoffset = '0';
    }

    showTestScreen('exercise');

    /* Start countdown */
    var remaining = ex.duree;
    var total = ex.duree;

    testState.timerId = setInterval(function() {
      remaining--;
      if (timerText) timerText.textContent = remaining;
      var offset = ((total - remaining) / total) * circumference;
      if (timerCircle) timerCircle.style.strokeDashoffset = offset;

      if (remaining <= 0) {
        clearInterval(testState.timerId);
        testState.timerId = null;
        /* Play beep */
        playBeep();
        /* Show score input */
        var label = document.getElementById('score-label');
        if (label) label.textContent = ex.unite === 'secondes' ? 'Secondes tenues :' : 'Répétitions :';
        if (scoreWrap) scoreWrap.style.display = 'flex';
        if (scoreInput) scoreInput.focus();
      }
    }, 1000);
  }

  function validerScore() {
    var ex = TEST_EXERCISES[testState.exIndex];
    if (!ex) return;
    var scoreInput = document.getElementById('score-input');
    var val = parseInt(scoreInput ? scoreInput.value : 0) || 0;
    testState.scores[ex.id] = val;

    var nextIndex = testState.exIndex + 1;
    if (nextIndex < TEST_EXERCISES.length) {
      /* Show rest screen */
      lancerRepos(nextIndex);
    } else {
      /* Show results */
      afficherResultats();
    }
  }

  function lancerRepos(nextIndex) {
    testState.restSeconds = REST_DEFAULT;
    var nextEx = TEST_EXERCISES[nextIndex];

    var subEl = document.getElementById('rest-sub');
    if (subEl && nextEx) subEl.textContent = 'Prochain : ' + nextEx.nom;

    showTestScreen('rest');
    updateRestDisplay();

    testState.restTimerId = setInterval(function() {
      testState.restSeconds--;
      updateRestDisplay();
      if (testState.restSeconds <= 0) {
        clearInterval(testState.restTimerId);
        testState.restTimerId = null;
        playBeep();
        lancerExercice(nextIndex);
      }
    }, 1000);
  }

  function updateRestDisplay() {
    var el = document.getElementById('rest-time');
    if (!el) return;
    var m = Math.floor(testState.restSeconds / 60);
    var s = testState.restSeconds % 60;
    el.textContent = m + ':' + String(s).padStart(2, '0');
  }

  function ajusterRepos(delta) {
    testState.restSeconds = Math.max(0, testState.restSeconds + delta);
    updateRestDisplay();
  }

  function skipRepos() {
    if (testState.restTimerId) clearInterval(testState.restTimerId);
    testState.restTimerId = null;
    var nextIndex = testState.exIndex + 1;
    lancerExercice(nextIndex);
  }

  function afficherResultats() {
    var totalScore = 0;
    var detailHtml = '';

    TEST_EXERCISES.forEach(function(ex) {
      var val = testState.scores[ex.id] || 0;
      var partial = Math.min(val / ex.max, 1) * ex.poids * 100;
      totalScore += partial;
      detailHtml += '<div class="results-row"><span>' + esc(ex.nom) + '</span><span>' +
                    val + ' ' + ex.unite + '</span></div>';
    });

    var score = Math.round(totalScore);
    var niv;
    if      (score >= 90) niv = 'Expert';
    else if (score >= 65) niv = 'Avancé';
    else if (score >= 35) niv = 'Intermédiaire';
    else                  niv = 'Débutant';

    /* Save test results */
    SW_STORAGE.save('sw_test', {
      score: score,
      niveau: niv,
      details: testState.scores,
      date: new Date().toISOString().slice(0, 10)
    });
    /* Push to history for evolution tracking */
    var testHistory = SW_STORAGE.load('sw_test_history') || [];
    testHistory.push({
      score: score,
      niveau: niv,
      details: testState.scores,
      date: new Date().toISOString().slice(0, 10)
    });
    SW_STORAGE.save('sw_test_history', testHistory);

    /* Display */
    var scoreEl = document.getElementById('results-score');
    var levelEl = document.getElementById('results-level');
    var detailEl = document.getElementById('results-detail');

    if (scoreEl) scoreEl.textContent = score;
    if (levelEl) levelEl.textContent = 'Niveau : ' + niv;
    if (detailEl) detailEl.innerHTML = detailHtml;

    showTestScreen('results');

    /* Recalculate global level */
    recalculerNiveau();
    SW_PROFIL.showToast('Niveau : ' + niv + ' (' + score + '/100)');
  }

  function playBeep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) { /* silent fallback */ }
  }

  /* ═══════ D. GENERATE ═══════ */

  function profilHash(profil) {
    return [profil.objectif, profil.niveau, profil.frequence,
            (profil.jours || []).join(','), profil.dureeSeance,
            profil.lieu, profil.ceinture, profil.gilet,
            (profil.skills || []).join(',')].join('|');
  }

  function checkStaleProgramme() {
    var saved = SW_STORAGE.load('sw_programme');
    if (!saved || !saved.programme) return;
    var profil = SW_STORAGE.load('sw_profil') || {};
    var currentHash = profilHash(profil);
    var banner = document.getElementById('stale-banner');
    if (banner) banner.style.display = (saved._profilHash && saved._profilHash !== currentHash) ? 'flex' : 'none';
  }

  function bindGenerate() {
    var btn = document.getElementById('btn-generate');
    if (btn) btn.addEventListener('click', doGenerate);
    refreshGenerateBtn();

    /* Show saved programme if exists */
    var saved = SW_STORAGE.load('sw_programme');
    if (saved && saved.programme) {
      renderProgramme(saved, false);
      checkStaleProgramme();
    }
  }

  async function doGenerate() {
    var profil = SW_STORAGE.load('sw_profil') || {};
    var section = document.getElementById('programme-section');
    var loader = document.getElementById('programme-loader');
    var result = document.getElementById('programme-result');

    if (section) section.style.display = 'block';
    if (loader) loader.style.display = 'block';
    if (result) result.innerHTML = '';

    /* Attach history & test data to profil for AI */
    var seancesHist = SW_STORAGE.load('sw_seances') || [];
    var recents = seancesHist.filter(function(s) { return s.statut === 'effectuee'; }).slice(-6);
    profil.historique = recents.map(function(s) {
      var part = (s.jour || '') + (s.type ? ' — ' + s.type : '');
      if (s.stats) {
        part += ' : réussite ' + s.stats.taux + '%, reps ' + s.stats.totalActual + '/' + s.stats.totalPlanned;
      }
      return part;
    });

    var testData = SW_STORAGE.load('sw_test');
    if (testData) {
      profil.testScore  = testData.score;
      profil.testDetail = testData.details;
    }

    /* Hide stale banner */
    var staleBanner = document.getElementById('stale-banner');
    if (staleBanner) staleBanner.style.display = 'none';

    var exercices = await SW_API.fetchExercises(profil.objectif || 'MAINTIEN', profil.lieu);

    var programme = null;
    var isAI = true;
    if (exercices.length > 0) {
      programme = await SW_API.generateProgramme(profil, exercices);
    }

    if (!programme || !programme.programme) {
      isAI = false;
      if (exercices.length === 0) {
        exercices = buildHardFallback();
      }
      programme = SW_API.generateFallback(profil, exercices);
    }

    if (loader) loader.style.display = 'none';
    renderProgramme(programme, !isAI);

    /* Save with profil hash so we can detect stale state */
    var profilSnap = SW_STORAGE.load('sw_profil') || {};
    programme._profilHash = profilHash(profilSnap);
    SW_STORAGE.save('sw_programme', programme);
  }

  function buildHardFallback() {
    return []; /* Context-aware exercise pool is handled in SW_API.generateFallback via QUALITY_POOLS */
  }

  function renderProgramme(data, isFallback) {
    var result = document.getElementById('programme-result');
    var section = document.getElementById('programme-section');
    if (!result) return;
    if (section) section.style.display = 'block';

    /* Load existing séances to show validate state */
    var seances = SW_STORAGE.load('sw_seances') || [];
    var doneMap = {};
    seances.forEach(function(s) {
      if (s.statut === 'effectuee') doneMap[s.jour] = s;
    });

    /* Progression */
    var doneCount = seances.filter(function(s) { return s.statut === 'effectuee'; }).length;
    var totalCount = data.programme ? data.programme.length : 0;

    var html = '';

    /* Progression bar */
    if (totalCount > 0) {
      var pct = Math.min((doneCount / totalCount) * 100, 100);
      html += '<div class="progression-wrap">';
      html += '<div class="progression-header">';
      html += '<span class="progression-label">Progression</span>';
      html += '<span class="progression-count">' + doneCount + ' / ' + totalCount + ' séances</span>';
      html += '</div>';
      html += '<div class="progression-track"><div class="progression-fill" style="width:' + pct + '%"></div></div>';
      html += '</div>';
    }

    if (isFallback) {
      html += '<div class="banner-info">Programme généré sans IA</div>';
    }

    if (data.programme) {
      data.programme.forEach(function(day, idx) {
        var isDone = !!doneMap[day.jour];
        html += '<div class="prog-card">';
        html += '<div class="prog-card-header">';
        html += '<span class="prog-day">' + esc(day.jour) + '</span>';
        html += '<span class="prog-meta">' + esc(day.type || '') + ' — ' + esc(day.duree || '') + '</span>';
        html += '</div>';

        if (day.exercices) {
          day.exercices.forEach(function(ex, exIdx) {
            html += '<div class="prog-exercise">';
            var skillBadge = (ex.skill && ex.skill !== 'null') ? ' <span class="skill-badge">🎯 ' + esc(ex.skill) + '</span>' : '';
            html += '<div class="prog-ex-name-row">';
            html += '<div class="prog-ex-name">' + esc(ex.nom) + skillBadge + '</div>';
            if (!isDone) {
              html += '<button class="btn-edit-ex" data-day-idx="' + idx + '" data-ex-idx="' + exIdx + '" title="Modifier cet exercice">✏️</button>';
            }
            html += '</div>';
            html += '<div class="prog-ex-sets">' + (ex.series || 3) + ' x ' + esc(String(ex.reps || '10')) + '</div>';
            if (ex.repos) html += '<div class="prog-ex-rest">Repos : ' + esc(ex.repos) + '</div>';
            if (ex.temps_estime) html += '<div class="prog-ex-time">⏱ ' + esc(ex.temps_estime) + '</div>';
            if (ex.conseil) html += '<div class="prog-ex-tip">' + esc(ex.conseil) + '</div>';
            html += '</div>';
          });
        }

        /* Validate button */
        if (doneMap[day.jour]) {
          html += '<button class="btn-valider done" disabled>SÉANCE VALIDÉE</button>';
          if (doneMap[day.jour].stats) {
            html += '<button class="btn-stats" data-seance-jour="' + esc(day.jour) + '">📊 Voir statistiques</button>';
          }
        } else {
          html += '<div class="seance-actions">';
          html += '<button class="btn-demarrer" data-seance-idx="' + idx + '">▶ DÉMARRER LA SÉANCE</button>';
          html += '<button class="btn-deja-faite" data-seance-idx="' + idx + '">SÉANCE DÉJÀ FAITE</button>';
          html += '</div>';
        }

        html += '</div>';
      });
    }

    if (data.conseil_global) {
      html += '<div class="conseil-global">' + esc(data.conseil_global) + '</div>';
    }

    html += '<div style="display:flex;gap:12px;margin-top:20px;">';
    html += '<button class="btn-primary" id="btn-save-prog" style="flex:1">ENREGISTRER</button>';
    html += '<button class="btn-secondary" id="btn-regen" style="flex:1">RÉGÉNÉRER</button>';
    html += '</div>';
    html += '<div id="prog-save-msg" class="success-msg" style="text-align:center;margin-top:8px;"></div>';

    /* Feedback section */
    html += '<div class="feedback-section">';
    html += '<p class="feedback-title">Votre retour sur ce programme</p>';
    html += '<div class="feedback-pills">';
    ['😊 Parfaite', '😓 Difficile', '😴 Trop facile', '❌ Exercices inadaptés'].forEach(function(f, i) {
      html += '<button class="feedback-pill" data-fb="' + i + '">' + f + '</button>';
    });
    html += '</div>';
    html += '<div id="feedback-msg" class="success-msg" style="text-align:center;margin-top:8px;"></div>';
    html += '</div>';

    result.innerHTML = html;

    /* Bind save */
    var saveBtn = document.getElementById('btn-save-prog');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        SW_STORAGE.save('sw_programme', data);

        /* Auto-generate séances from programme + jours */
        genererSeances(data);

        var msg = document.getElementById('prog-save-msg');
        var profil = SW_STORAGE.load('sw_profil') || {};
        var nextDay = profil.jours && profil.jours.length > 0 ? profil.jours[0] : '';
        if (msg) msg.textContent = 'Programme enregistré ! Prochaine séance : ' + nextDay;
        SW_PROFIL.showToast('Programme enregistré');
      });
    }

    /* Bind regen */
    var regenBtn = document.getElementById('btn-regen');
    if (regenBtn) {
      regenBtn.addEventListener('click', doGenerate);
    }

    /* Bind validate buttons */
    result.querySelectorAll('.btn-demarrer').forEach(function(btn) {
      btn.addEventListener('click', function() {
        ouvrirSeanceGuidee(parseInt(btn.dataset.seanceIdx), data);
      });
    });

    result.querySelectorAll('.btn-deja-faite').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.dataset.seanceIdx);
        validerSeanceComplete(idx, data);
        SW_PROFIL.showToast('Séance validée !');
      });
    });

    /* Bind stats buttons */
    result.querySelectorAll('.btn-stats').forEach(function(btn) {
      btn.addEventListener('click', function() {
        ouvrirStats(btn.dataset.seanceJour);
      });
    });

    /* Bind feedback */
    var feedbackLabels = ['Parfaite', 'Difficile', 'Trop facile', 'Exercices inadaptés'];
    result.querySelectorAll('.feedback-pill').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var feedbacks = SW_STORAGE.load('sw_feedback') || [];
        feedbacks.push({ feedback: feedbackLabels[parseInt(btn.dataset.fb)] || '', date: new Date().toISOString().slice(0, 10) });
        SW_STORAGE.save('sw_feedback', feedbacks);
        result.querySelectorAll('.feedback-pill').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var msg = document.getElementById('feedback-msg');
        if (msg) msg.textContent = 'Merci pour votre retour !';
        SW_PROFIL.showToast('Feedback enregistré 👍');
      });
    });

    /* Bind exercise edit buttons */
    result.querySelectorAll('.btn-edit-ex').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        ouvrirExEditor(parseInt(btn.dataset.dayIdx), parseInt(btn.dataset.exIdx), data);
      });
    });
  }

  /* ═══════ E. SÉANCES ═══════ */
  function genererSeances(data) {
    if (!data || !data.programme) return;

    var profil = SW_STORAGE.load('sw_profil') || {};
    var jours = profil.jours || [];
    var jourMap = { 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4,
                    'Vendredi': 5, 'Samedi': 6, 'Dimanche': 0 };

    var today = new Date();
    var seances = [];

    data.programme.forEach(function(day, i) {
      /* Find the next date matching the day's jour in profil.jours */
      var targetDow = jourMap[day.jour];
      var date = new Date(today);

      if (typeof targetDow === 'number') {
        /* Find next occurrence of this weekday */
        var currentDow = date.getDay();
        var diff = targetDow - currentDow;
        if (diff <= 0) diff += 7;
        date.setDate(date.getDate() + diff);
      } else {
        /* Fallback: space out by i days */
        date.setDate(date.getDate() + i + 1);
      }

      var dateStr = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');

      seances.push({
        id: i,
        jour: day.jour,
        type: day.type || '',
        date: dateStr,
        statut: 'planifiee',
        exercices: day.exercices || []
      });
    });

    SW_STORAGE.save('sw_seances', seances);
    renderCalendar();
    recalculerNiveau();
  }

  function validerSeanceComplete(idx, data, stats) {
    var seances = SW_STORAGE.load('sw_seances') || [];
    var todayStr = new Date().toISOString().slice(0, 10);

    if (seances[idx]) {
      seances[idx].statut = 'effectuee';
      seances[idx].date = todayStr;
      seances[idx].date_effectuee = todayStr;
      if (stats) seances[idx].stats = stats;
    } else {
      var day = data.programme && data.programme[idx] ? data.programme[idx] : {};
      seances.push({
        id: idx,
        jour: day.jour || '',
        type: day.type || '',
        date: todayStr,
        statut: 'effectuee',
        date_effectuee: todayStr,
        exercices: day.exercices || [],
        stats: stats || null
      });
    }

    SW_STORAGE.save('sw_seances', seances);
    renderCalendar();
    recalculerNiveau();
    renderProgramme(data, false);
  }

  /* ═══════ F. SÉANCE GUIDÉE ═══════ */
  var seanceState = {};

  function initSeanceModal() {
    var overlay       = document.getElementById('seance-overlay');
    var closeBtn      = document.getElementById('seance-close');
    var startBtn      = document.getElementById('seance-btn-start');
    var valBtn        = document.getElementById('seance-btn-valider-serie');
    var echecBtn      = document.getElementById('seance-btn-echec');
    var confirmerBtn  = document.getElementById('seance-btn-confirmer-echec');
    var skipRest      = document.getElementById('seance-rest-skip');
    var minusRest     = document.getElementById('seance-rest-minus');
    var plusRest      = document.getElementById('seance-rest-plus');
    var skipInter     = document.getElementById('seance-interex-skip');
    var doneBtn       = document.getElementById('seance-btn-done');

    if (!overlay) return;

    if (closeBtn)     closeBtn.addEventListener('click',     fermerSeanceGuidee);
    if (startBtn)     startBtn.addEventListener('click',     demarrerSeanceGuidee);
    if (valBtn)       valBtn.addEventListener('click',       validerSerieSeance);
    if (echecBtn)     echecBtn.addEventListener('click',     validerSerieEchec);
    if (confirmerBtn) confirmerBtn.addEventListener('click', confirmerEchec);
    if (skipRest)     skipRest.addEventListener('click',     skipReposSeance);
    if (minusRest)    minusRest.addEventListener('click',    function() { ajusterReposSeance(-15); });
    if (plusRest)     plusRest.addEventListener('click',     function() { ajusterReposSeance(15); });
    if (skipInter)    skipInter.addEventListener('click',    skipInterExRepos);
    if (doneBtn)      doneBtn.addEventListener('click',      confirmerFinSeance);
  }

  function ouvrirSeanceGuidee(idx, data) {
    var day = data.programme && data.programme[idx];
    if (!day || !day.exercices || day.exercices.length === 0) {
      SW_PROFIL.showToast('Aucun exercice dans cette séance');
      return;
    }

    seanceState = {
      seanceIdx: idx,
      programmeData: data,
      exercices: day.exercices,
      exIndex: 0,
      serieIndex: 0,
      totalSeries: 0,
      restTimerId: null,
      restSeconds: 0,
      restCallback: null,
      interExTimerId: null,
      startTime: Date.now(),
      performance: []
    };

    /* Build intro list */
    var titleEl = document.getElementById('seance-intro-title');
    var listEl  = document.getElementById('seance-exercises-list');
    if (titleEl) titleEl.textContent = 'Séance ' + (day.jour || '');
    if (listEl) {
      var html = '';
      day.exercices.forEach(function(ex) {
        html += '<div class="test-ex-item"><span>' + esc(ex.nom) + '</span>';
        html += '<span>' + (ex.series || 3) + ' × ' + esc(String(ex.reps || '10')) + '</span></div>';
      });
      listEl.innerHTML = html;
    }

    updateSeanceBlocCounter();
    showSeanceScreen('intro');
    var overlay = document.getElementById('seance-overlay');
    if (overlay) overlay.classList.add('open');
  }

  function fermerSeanceGuidee() {
    var overlay = document.getElementById('seance-overlay');
    if (overlay) overlay.classList.remove('open');
    if (seanceState.restTimerId)    clearInterval(seanceState.restTimerId);
    if (seanceState.interExTimerId) clearInterval(seanceState.interExTimerId);
    seanceState = {};
  }

  function showSeanceScreen(name) {
    document.querySelectorAll('#seance-overlay .test-screen').forEach(function(s) {
      s.classList.remove('active');
    });
    var target = document.getElementById('seance-screen-' + name);
    if (target) target.classList.add('active');
  }

  function updateSeanceBlocCounter() {
    var total   = seanceState.exercices ? seanceState.exercices.length : 0;
    var current = seanceState.exIndex || 0;
    var counterEl = document.getElementById('seance-bloc-counter');
    var fillEl    = document.getElementById('seance-progress-fill');
    if (counterEl) counterEl.textContent = current + ' / ' + total;
    if (fillEl)    fillEl.style.width = (total > 0 ? Math.round(current / total * 100) : 0) + '%';
  }

  function demarrerSeanceGuidee() {
    seanceState.exIndex = 0;
    initExerciceSeance(0);
  }

  function initExerciceSeance(exIndex) {
    seanceState.exIndex   = exIndex;
    var ex = seanceState.exercices[exIndex];
    if (!ex) return;
    seanceState.serieIndex  = 0;
    seanceState.totalSeries = parseInt(ex.series) || 3;
    afficherExerciceSeance();
  }

  function afficherExerciceSeance() {
    var exIndex = seanceState.exIndex;
    var ex      = seanceState.exercices[exIndex];
    if (!ex) return;

    var nameEl  = document.getElementById('seance-ex-name');
    var infoEl  = document.getElementById('seance-ex-info');
    var blocEl  = document.getElementById('seance-ex-bloc');
    var repsEl  = document.getElementById('seance-reps-info');

    if (nameEl) nameEl.textContent = ex.nom;
    if (infoEl) infoEl.textContent = ex.conseil || '';
    if (blocEl) blocEl.textContent = 'Bloc ' + (exIndex + 1) + ' / ' + seanceState.exercices.length;
    if (repsEl) repsEl.textContent = 'Faire ' + String(ex.reps || '10') + ' répétitions';

    updateSerieDisplay();
    showSeanceScreen('exercise');
  }

  function updateSerieDisplay() {
    var total   = seanceState.totalSeries;
    var current = seanceState.serieIndex + 1;

    var serieEl = document.getElementById('seance-serie-info');
    if (serieEl) serieEl.textContent = 'Série ' + current + ' / ' + total;

    var setsEl = document.getElementById('seance-sets-display');
    if (setsEl) {
      var html = '';
      for (var i = 0; i < total; i++) {
        if (i < seanceState.serieIndex) {
          html += '<div class="serie-dot done">✓</div>';
        } else if (i === seanceState.serieIndex) {
          html += '<div class="serie-dot active">' + (i + 1) + '</div>';
        } else {
          html += '<div class="serie-dot">' + (i + 1) + '</div>';
        }
      }
      setsEl.innerHTML = html;
    }
  }

  function validerSerieSeance() {
    cacherEchecInput();
    var ex = seanceState.exercices[seanceState.exIndex];
    procederApresSerie(parsePlanReps(ex), true);
  }

  function validerSerieEchec() {
    var inputWrap = document.getElementById('seance-echec-input');
    var echecBtn  = document.getElementById('seance-btn-echec');
    if (inputWrap) inputWrap.style.display = 'block';
    if (echecBtn)  echecBtn.style.display = 'none';
    var input = document.getElementById('seance-reps-echec');
    if (input) { input.value = ''; input.focus(); }
  }

  function confirmerEchec() {
    var input = document.getElementById('seance-reps-echec');
    var val = parseInt(input ? input.value : 0) || 0;
    cacherEchecInput();
    procederApresSerie(val, false);
  }

  function cacherEchecInput() {
    var inputWrap = document.getElementById('seance-echec-input');
    var echecBtn  = document.getElementById('seance-btn-echec');
    if (inputWrap) inputWrap.style.display = 'none';
    if (echecBtn)  echecBtn.style.display = '';
  }

  function parsePlanReps(ex) {
    if (!ex) return 10;
    var r = String(ex.reps || '10');
    if (r.indexOf('-') !== -1) {
      var parts = r.split('-');
      return Math.round((parseInt(parts[0]) + parseInt(parts[1])) / 2);
    }
    return parseInt(r) || 10;
  }

  function procederApresSerie(actualReps, success) {
    var exIdx = seanceState.exIndex;
    var ex    = seanceState.exercices[exIdx];
    var planReps = parsePlanReps(ex);

    /* Record performance */
    if (!seanceState.performance[exIdx]) {
      seanceState.performance[exIdx] = { nom: ex ? ex.nom : '', series: [] };
    }
    seanceState.performance[exIdx].series.push({
      planned: planReps,
      actual: actualReps,
      success: success
    });

    seanceState.serieIndex++;

    if (seanceState.serieIndex >= seanceState.totalSeries) {
      var doneExIdx = exIdx;
      seanceState.exIndex++;
      updateSeanceBlocCounter();

      if (seanceState.exIndex >= seanceState.exercices.length) {
        terminerSeanceGuidee();
      } else {
        afficherFinExercice(doneExIdx);
      }
    } else {
      var reposSeconds = parseRepos(ex ? ex.repos : null) || 60;
      lancerReposSeance(reposSeconds, function() {
        afficherExerciceSeance();
      });
    }
  }

  function parseRepos(reposStr) {
    if (!reposStr) return 60;
    var num = parseInt(reposStr);
    if (isNaN(num)) return 60;
    if (/min/i.test(reposStr)) return num * 60;
    return num;
  }

  function lancerReposSeance(seconds, callback) {
    seanceState.restSeconds  = seconds;
    seanceState.restCallback = callback;

    var subEl = document.getElementById('seance-rest-sub');
    if (subEl) subEl.textContent = 'Série suivante dans…';

    showSeanceScreen('rest');
    updateSeanceRestDisplay();

    seanceState.restTimerId = setInterval(function() {
      seanceState.restSeconds--;
      updateSeanceRestDisplay();
      if (seanceState.restSeconds <= 0) {
        clearInterval(seanceState.restTimerId);
        seanceState.restTimerId = null;
        playBeep();
        if (seanceState.restCallback) seanceState.restCallback();
      }
    }, 1000);
  }

  function updateSeanceRestDisplay() {
    var el = document.getElementById('seance-rest-time');
    if (!el) return;
    var s = seanceState.restSeconds;
    if (s >= 60) {
      var m = Math.floor(s / 60);
      el.textContent = m + ':' + String(s % 60).padStart(2, '0');
    } else {
      el.textContent = s;
    }
  }

  function skipReposSeance() {
    if (seanceState.restTimerId) clearInterval(seanceState.restTimerId);
    seanceState.restTimerId = null;
    if (seanceState.restCallback) seanceState.restCallback();
  }

  function ajusterReposSeance(delta) {
    seanceState.restSeconds = Math.max(0, seanceState.restSeconds + delta);
    updateSeanceRestDisplay();
  }

  function afficherFinExercice(doneExIdx) {
    var ex      = seanceState.exercices[doneExIdx];
    var doneEl  = document.getElementById('seance-ex-done-title');
    var blocEl  = document.getElementById('seance-done-bloc');
    var restEl  = document.getElementById('seance-interex-rest');

    if (doneEl) doneEl.textContent = (ex ? ex.nom : '') + ' terminé !';
    if (blocEl) blocEl.textContent = seanceState.exIndex + ' / ' + seanceState.exercices.length + ' blocs terminés';

    var restSeconds = 90;
    seanceState.restSeconds = restSeconds;
    showSeanceScreen('ex-done');
    updateInterExRestDisplay();

    seanceState.interExTimerId = setInterval(function() {
      seanceState.restSeconds--;
      updateInterExRestDisplay();
      if (seanceState.restSeconds <= 0) {
        clearInterval(seanceState.interExTimerId);
        seanceState.interExTimerId = null;
        playBeep();
        initExerciceSeance(seanceState.exIndex);
      }
    }, 1000);
  }

  function updateInterExRestDisplay() {
    var el = document.getElementById('seance-interex-rest');
    if (!el) return;
    var s = seanceState.restSeconds;
    if (s >= 60) {
      var m = Math.floor(s / 60);
      el.textContent = m + ':' + String(s % 60).padStart(2, '0');
    } else {
      el.textContent = s;
    }
  }

  function skipInterExRepos() {
    if (seanceState.interExTimerId) clearInterval(seanceState.interExTimerId);
    seanceState.interExTimerId = null;
    initExerciceSeance(seanceState.exIndex);
  }

  function terminerSeanceGuidee() {
    updateSeanceBlocCounter();

    /* Calculate stats */
    var totalPlanned = 0, totalActual = 0, exReussisCount = 0;
    seanceState.performance.forEach(function(perf) {
      if (!perf) return;
      var exReussi = true;
      perf.series.forEach(function(s) {
        totalPlanned += s.planned;
        totalActual  += s.actual;
        if (!s.success) exReussi = false;
      });
      if (exReussi) exReussisCount++;
    });
    var totalEx     = seanceState.exercices.length;
    var durationSec = Math.round((Date.now() - (seanceState.startTime || Date.now())) / 1000);
    var dMin        = Math.floor(durationSec / 60);
    var dSec        = durationSec % 60;
    var taux        = totalPlanned > 0 ? Math.round(totalActual / totalPlanned * 100) : 100;

    seanceState.stats = {
      duration: durationSec,
      totalPlanned: totalPlanned,
      totalActual: totalActual,
      taux: taux,
      exReussisCount: exReussisCount,
      totalEx: totalEx,
      performance: seanceState.performance
    };

    /* Build summary */
    var html = '<div class="seance-summary-grid">';
    html += '<div class="sum-row"><span>⏱️ Durée</span><span>' + dMin + 'min ' + dSec + 's</span></div>';
    html += '<div class="sum-row"><span>✅ Exercices réussis</span><span>' + exReussisCount + ' / ' + totalEx + '</span></div>';
    html += '<div class="sum-row"><span>🔢 Répétitions</span><span>' + totalActual + ' / ' + totalPlanned + '</span></div>';
    html += '<div class="sum-row highlight"><span>📈 Taux de réussite</span><span>' + taux + '%</span></div>';
    html += '</div>';
    html += '<p class="seance-taux-info">' + (taux >= 100 ? 'Objectif atteint ! Toutes les reps ont été faites.' : taux >= 80 ? 'Bon travail ! Tu es proche de l\'objectif.' : 'Continue tes efforts, tu progresseras !') + '</p>';

    /* Per-exercise detail */
    if (seanceState.performance && seanceState.performance.length > 0) {
      html += '<div class="seance-detail-title">Détail par exercice</div>';
      seanceState.performance.forEach(function(perf) {
        if (!perf) return;
        var exA = 0, exP = 0;
        perf.series.forEach(function(sr) { exA += sr.actual; exP += sr.planned; });
        var exTaux = exP > 0 ? Math.round(exA / exP * 100) : 100;
        var cls = exTaux >= 100 ? 'sum-ex-green' : exTaux >= 80 ? 'sum-ex-orange' : 'sum-ex-red';
        html += '<div class="sum-ex-row ' + cls + '">';
        html += '<span class="sum-ex-name">' + esc(perf.nom) + '</span>';
        html += '<span class="sum-ex-reps">' + exA + '/' + exP + ' reps</span>';
        html += '<span class="sum-ex-pct">' + exTaux + '%</span>';
        html += '</div>';
      });
    }

    var summaryEl = document.getElementById('seance-summary');
    if (summaryEl) summaryEl.innerHTML = html;

    showSeanceScreen('done');
  }

  function confirmerFinSeance() {
    var idx   = seanceState.seanceIdx;
    var data  = seanceState.programmeData;
    var stats = seanceState.stats || null;
    fermerSeanceGuidee();
    validerSeanceComplete(idx, data, stats);
    SW_PROFIL.showToast('Séance terminée ! Bravo 💪');
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ═══════ G. STATISTIQUES ═══════ */
  function initStatsModal() {
    var closeBtn = document.getElementById('stats-close');
    var doneBtn  = document.getElementById('stats-btn-close');
    if (closeBtn) closeBtn.addEventListener('click', fermerStats);
    if (doneBtn)  doneBtn.addEventListener('click',  fermerStats);
  }

  /* ═══════ NIVEAU MODAL ═══════ */
  function initNiveauModal() {
    var closeBtn = document.getElementById('niveau-close');
    if (closeBtn) closeBtn.addEventListener('click', function() {
      var overlay = document.getElementById('niveau-overlay');
      if (overlay) overlay.classList.remove('open');
    });
  }

  function afficherDetailsNiveau() {
    var profil   = SW_STORAGE.load('sw_profil') || {};
    var testData = SW_STORAGE.load('sw_test');
    var seances  = SW_STORAGE.load('sw_seances') || [];
    var done     = seances.filter(function(s) { return s.statut === 'effectuee'; });
    var niv      = profil.niveau || 'Débutant';

    var levels    = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
    var lvlIndex  = Math.max(0, levels.indexOf(niv));
    var thresholds = [0, 25, 55, 85];
    var nextLevel  = levels[lvlIndex + 1] || null;

    var html = '<h2 style="margin-bottom:16px;font-size:1.2rem;color:var(--or);">Mon niveau</h2>';

    /* Badge actuel */
    html += '<div style="text-align:center;margin-bottom:20px;">';
    html += '<div class="level-badge" style="font-size:1.3rem;padding:12px 28px;">' + esc(niv) + '</div>';
    html += '</div>';

    /* Test score */
    if (testData) {
      html += '<div class="stats-card" style="margin-bottom:14px;">';
      html += '<div class="stats-row"><span>🏆 Score du test</span><span>' + (testData.score || 0) + ' pts</span></div>';
      if (testData.details) {
        Object.keys(testData.details).forEach(function(k) {
          html += '<div class="stats-row"><span>' + esc(k) + '</span><span>' + esc(String(testData.details[k])) + '</span></div>';
        });
      }
      html += '</div>';
    } else {
      html += '<p style="color:rgba(255,255,255,.5);font-size:.85rem;margin-bottom:14px;">Aucun test effectué. Passe le test de niveau pour affiner tes recommandations.</p>';
    }

    /* Séances effectuées */
    html += '<div class="stats-card" style="margin-bottom:14px;">';
    html += '<div class="stats-row"><span>✅ Séances effectuées</span><span>' + done.length + '</span></div>';
    if (done.length > 0) {
      var totalTaux = 0, count = 0;
      done.forEach(function(s) { if (s.stats) { totalTaux += s.stats.taux; count++; } });
      if (count > 0) {
        html += '<div class="stats-row"><span>🎯 Taux de réussite moyen</span><span>' + Math.round(totalTaux / count) + '%</span></div>';
      }
    }
    html += '</div>';

    /* Progression vers niveau suivant */
    if (nextLevel) {
      var scoreTest = testData ? (testData.score || 0) : 0;
      var progress  = Math.min(100, Math.max(0, Math.round((scoreTest - thresholds[lvlIndex]) / (thresholds[lvlIndex + 1] - thresholds[lvlIndex]) * 100)));
      html += '<div class="stats-card">';
      html += '<div class="stats-row"><span>Prochain niveau</span><span style="color:var(--or);">' + esc(nextLevel) + '</span></div>';
      html += '<div class="level-bar-track" style="margin:8px 0;"><div class="level-bar-fill" style="width:' + progress + '%"></div></div>';
      html += '<p style="font-size:.8rem;color:rgba(255,255,255,.5);">' + progress + '% vers ' + esc(nextLevel) + '</p>';
      html += '</div>';
    } else {
      html += '<div class="stats-card"><div class="stats-row"><span>🏅 Niveau maximum atteint !</span><span>⭐</span></div></div>';
    }

    var content = document.getElementById('niveau-content');
    if (content) content.innerHTML = html;
    var overlay = document.getElementById('niveau-overlay');
    if (overlay) overlay.classList.add('open');
  }

  function fermerStats() {
    var overlay = document.getElementById('stats-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function ouvrirStats(jour) {
    var seances = SW_STORAGE.load('sw_seances') || [];
    /* Find seance by jour */
    var seance = null;
    for (var i = 0; i < seances.length; i++) {
      if (seances[i].jour === jour && seances[i].statut === 'effectuee' && seances[i].stats) {
        seance = seances[i];
        break;
      }
    }
    if (!seance) {
      SW_PROFIL.showToast('Aucune statistique disponible');
      return;
    }
    var s       = seance.stats;
    var dMin    = Math.floor(s.duration / 60);
    var dSec    = s.duration % 60;

    var html = '<div class="stats-card">';
    html += '<div class="stats-row"><span>⏱️ Durée totale</span><span>' + dMin + 'min ' + dSec + 's</span></div>';
    html += '<div class="stats-row"><span>📈 Exercices complétés</span><span>' + s.exReussisCount + ' / ' + s.totalEx + '</span></div>';
    html += '<div class="stats-row"><span>🔢 Répétitions</span><span>' + s.totalActual + ' / ' + s.totalPlanned + '</span></div>';
    html += '<div class="stats-row highlight"><span>🎯 Taux de réussite</span><span class="stats-taux">' + s.taux + '%</span></div>';
    html += '</div>';

    if (s.performance && s.performance.length > 0) {
      html += '<div class="stats-exercises-title">Détail par exercice</div>';
      s.performance.forEach(function(perf) {
        if (!perf) return;
        var exActual = 0, exPlanned = 0;
        perf.series.forEach(function(sr) { exActual += sr.actual; exPlanned += sr.planned; });
        var exTaux = exPlanned > 0 ? Math.round(exActual / exPlanned * 100) : 100;
        html += '<div class="stats-ex-card">';
        html += '<div class="stats-ex-name">' + esc(perf.nom) + ' <span class="stats-ex-pct">' + exTaux + '%</span></div>';
        perf.series.forEach(function(sr, si) {
          var icon = sr.success ? '✓' : '✗';
          var cls  = sr.success ? 'green' : 'red';
          html += '<div class="stats-serie stats-' + cls + '">Série ' + (si + 1) + ': ' + icon + '  ' + sr.actual + ' / ' + sr.planned + ' reps</div>';
        });
        html += '</div>';
      });
    }

    var contentEl = document.getElementById('stats-content');
    if (contentEl) contentEl.innerHTML = html;
    var overlay = document.getElementById('stats-overlay');
    if (overlay) overlay.classList.add('open');
  }

  /* ═══════════════════════════════════════════════════════
     ONGLET SUIVI
     ═══════════════════════════════════════════════════════ */

  function initSuivi() {
    /* Period tab buttons */
    document.querySelectorAll('.suivi-period-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.suivi-period-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderSuivi(btn.dataset.period);
      });
    });

    /* Trigger render when Suivi tab is clicked */
    var suiviTab = document.querySelector('[data-tab="suivi"]');
    if (suiviTab) {
      suiviTab.addEventListener('click', function() {
        checkTestReminder();
        renderNiveauEvolution();
        renderSuivi('jour');
      });
    }

    /* Bind test button in reminder card */
    var testBtn = document.getElementById('suivi-btn-test');
    if (testBtn) {
      testBtn.addEventListener('click', function() {
        /* Activate Entraînement tab first, then open test overlay */
        var entBtn = document.querySelector('[data-tab="entrainement"]');
        if (entBtn) entBtn.click();
        setTimeout(function() {
          var openTest = document.getElementById('btn-open-test');
          if (openTest) openTest.click();
        }, 150);
      });
    }
  }

  function checkTestReminder() {
    var testData = SW_STORAGE.load('sw_test');
    var reminder = document.getElementById('suivi-test-reminder');
    var daysEl   = document.getElementById('reminder-days-text');
    if (!reminder) return;

    if (!testData) {
      reminder.style.display = 'block';
      if (daysEl) daysEl.textContent = 'Fais ton premier test pour calibrer tes recommandations.';
      return;
    }

    if (testData.date) {
      var daysSince = Math.floor((new Date() - new Date(testData.date)) / 86400000);
      if (daysSince >= 30) {
        reminder.style.display = 'block';
        if (daysEl) daysEl.textContent = 'Dernier test : il y a ' + daysSince + ' jours — niveau actuel : ' + (testData.niveau || '?');
      } else {
        reminder.style.display = 'none';
      }
    } else {
      /* Old test entry without date */
      reminder.style.display = 'block';
      if (daysEl) daysEl.textContent = 'Refais le test pour actualiser ta progression.';
    }
  }

  function renderNiveauEvolution() {
    var history = SW_STORAGE.load('sw_test_history') || [];
    var el = document.getElementById('suivi-niveau-evolution');
    if (!el) return;

    if (history.length < 2) { el.innerHTML = ''; return; }

    var last = history[history.length - 1];
    var prev = history[history.length - 2];
    var diff = last.score - prev.score;

    var icon, msg, cls;
    if (diff > 5) {
      icon = '📈'; msg = 'Tu as progressé depuis le dernier test ! +' + diff + ' pts'; cls = 'evolution-up';
    } else if (diff < -5) {
      icon = '📉'; msg = 'Tes performances ont diminué (' + diff + ' pts)'; cls = 'evolution-down';
    } else {
      icon = '➡️'; msg = 'Tu es resté stable (' + (diff >= 0 ? '+' : '') + diff + ' pts)'; cls = 'evolution-stable';
    }

    el.innerHTML =
      '<div class="evolution-card ' + cls + '">' +
        '<div class="evolution-icon">' + icon + '</div>' +
        '<div>' +
          '<p class="evolution-text">' + esc(msg) + '</p>' +
          '<p class="evolution-detail">' +
            'Test précédent : ' + prev.score + '/100 (' + esc(prev.niveau) + ') — ' + esc(prev.date) + '<br>' +
            'Dernier test : ' + last.score + '/100 (' + esc(last.niveau) + ') — ' + esc(last.date) +
          '</p>' +
        '</div>' +
      '</div>';
  }

  function renderSuivi(period) {
    var seances  = SW_STORAGE.load('sw_seances') || [];
    /* Include ALL effectuee seances, with or without guided stats */
    var done     = seances.filter(function(s) { return s.statut === 'effectuee'; });
    var today    = new Date();
    var todayStr = today.toISOString().slice(0, 10);
    var filtered, periodLabel;

    if (period === 'jour') {
      filtered = done.filter(function(s) { return (s.date_effectuee || s.date) === todayStr; });
      periodLabel = "Aujourd'hui — " + todayStr;

    } else if (period === 'semaine') {
      var dow      = (today.getDay() + 6) % 7; /* 0=Lun, 6=Dim */
      var monday   = new Date(today); monday.setDate(today.getDate() - dow);
      var sunday   = new Date(monday); sunday.setDate(monday.getDate() + 6);
      var monStr   = monday.toISOString().slice(0, 10);
      var sunStr   = sunday.toISOString().slice(0, 10);
      filtered     = done.filter(function(s) { var d = s.date_effectuee || s.date; return d >= monStr && d <= sunStr; });
      periodLabel  = 'Semaine du ' + monStr + ' au ' + sunStr;

    } else { /* mois */
      var monthStr   = todayStr.slice(0, 7);
      var monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      filtered       = done.filter(function(s) { var d = s.date_effectuee || s.date; return d && d.slice(0, 7) === monthStr; });
      periodLabel    = monthNames[today.getMonth()] + ' ' + today.getFullYear();
    }

    renderSuiviContent(filtered, period, periodLabel);
  }

  function renderSuiviContent(seances, period, periodLabel) {
    var content = document.getElementById('suivi-content');
    if (!content) return;

    if (seances.length === 0) {
      var periodTxt = period === 'jour' ? "aujourd'hui" : period === 'semaine' ? 'cette semaine' : 'ce mois';
      content.innerHTML = '<div class="suivi-empty"><p>Aucune séance effectuée ' + periodTxt + '.</p></div>';
      return;
    }

    /* Aggregate — use only real performance data where available */
    var totalReps = 0, totalPlanned = 0, totalDuration = 0, totalSeancesAvecStats = 0;
    var exerciceMap = {};

    seances.forEach(function(s) {
      var st = s.stats;
      if (st) {
        totalSeancesAvecStats++;
        totalReps     += st.totalActual  || 0;
        totalPlanned  += st.totalPlanned || 0;
        totalDuration += st.duration     || 0;

        (st.performance || []).forEach(function(perf) {
          if (!perf || !perf.nom) return;
          if (!exerciceMap[perf.nom]) exerciceMap[perf.nom] = { reps: 0, planned: 0, sets: 0, source: 'reel' };
          (perf.series || []).forEach(function(sr) {
            exerciceMap[perf.nom].reps    += sr.actual  || 0;
            exerciceMap[perf.nom].planned += sr.planned || 0;
            exerciceMap[perf.nom].sets++;
          });
        });
      } else {
        /* Session validated via "déjà faite" — only show planned data tagged as programme */
        (s.exercices || []).forEach(function(ex) {
          if (!ex || !ex.nom) return;
          if (!exerciceMap[ex.nom]) exerciceMap[ex.nom] = { reps: 0, planned: 0, sets: 0, source: 'programme' };
          var plannedReps = parseInt(String(ex.reps).split('-')[1] || String(ex.reps).split('-')[0]) || 0;
          exerciceMap[ex.nom].planned += (ex.series || 3) * plannedReps;
          exerciceMap[ex.nom].sets    += ex.series || 3;
        });
      }
    });

    var globalTaux = totalPlanned > 0 ? Math.round(totalReps / totalPlanned * 100) : null;
    var totalMin   = Math.floor(totalDuration / 60);

    var html = '<p class="suivi-period-label">' + esc(periodLabel) + '</p>';

    html += '<div class="suivi-summary-grid">';
    html += '<div class="suivi-stat-card"><div class="suivi-stat-value">' + seances.length + '</div><div class="suivi-stat-lbl">Séances</div></div>';
    html += '<div class="suivi-stat-card"><div class="suivi-stat-value">' + totalReps + '</div><div class="suivi-stat-lbl">Reps réelles</div></div>';
    if (globalTaux !== null) {
      html += '<div class="suivi-stat-card"><div class="suivi-stat-value">' + globalTaux + '%</div><div class="suivi-stat-lbl">Réussite</div></div>';
    } else {
      html += '<div class="suivi-stat-card"><div class="suivi-stat-value">—</div><div class="suivi-stat-lbl">Réussite</div></div>';
    }
    html += '<div class="suivi-stat-card"><div class="suivi-stat-value">' + (totalMin > 0 ? totalMin + ' min' : '—') + '</div><div class="suivi-stat-lbl">Durée totale</div></div>';
    html += '</div>';

    /* Explain what "taux de réussite" means */
    if (totalSeancesAvecStats > 0) {
      html += '<p class="suivi-taux-explain">📊 Réussite = reps réellement faites ÷ reps prévues. Utilise "Démarrer la séance" pour enregistrer tes performances en temps réel.</p>';
    } else {
      html += '<p class="suivi-taux-explain">💡 Lance tes séances avec le bouton "▶ Démarrer" pour suivre tes reps en temps réel et voir ta progression détaillée.</p>';
    }

    /* Note if sessions without guided stats are included */
    var sansStat = seances.length - totalSeancesAvecStats;
    if (sansStat > 0) {
      html += '<p style="font-size:11px;color:rgba(255,255,255,.35);margin-bottom:12px;">'
        + sansStat + ' séance' + (sansStat > 1 ? 's' : '') + ' validée' + (sansStat > 1 ? 's' : '') + ' sans guidage (données programme uniquement)</p>';
    }

    var exKeys = Object.keys(exerciceMap);
    if (exKeys.length > 0) {
      /* Sort: guided (reel) first, then by reps */
      exKeys.sort(function(a, b) {
        if (exerciceMap[a].source !== exerciceMap[b].source)
          return exerciceMap[a].source === 'reel' ? -1 : 1;
        return exerciceMap[b].reps - exerciceMap[a].reps;
      });

      html += '<p class="suivi-table-title">Volume par exercice</p>';
      html += '<div class="suivi-table">';
      html += '<div class="suivi-table-head">';
      html += '<div class="suivi-th suivi-th-ex">Exercice</div>';
      html += '<div class="suivi-th">Séries</div>';
      html += '<div class="suivi-th">Reps</div>';
      html += '<div class="suivi-th">Obj.</div>';
      html += '<div class="suivi-th">Taux</div>';
      html += '</div>';

      exKeys.forEach(function(nom) {
        var ex   = exerciceMap[nom];
        var isReel = ex.source === 'reel';
        var taux = ex.planned > 0 ? Math.round(ex.reps / ex.planned * 100) : null;
        var displayTaux = isReel && taux !== null ? taux + '%' : '—';
        var cls = (isReel && taux !== null)
          ? (taux >= 80 ? 'suivi-td-green' : taux >= 50 ? 'suivi-td-orange' : 'suivi-td-red')
          : '';
        var nomDisplay = isReel ? esc(nom) : esc(nom) + ' <span style="font-size:10px;opacity:.45;">(obj.)</span>';
        html += '<div class="suivi-table-row">';
        html += '<div class="suivi-td suivi-td-ex">' + nomDisplay + '</div>';
        html += '<div class="suivi-td">' + ex.sets + '</div>';
        html += '<div class="suivi-td">' + (isReel ? ex.reps : '—') + '</div>';
        html += '<div class="suivi-td">' + ex.planned + '</div>';
        html += '<div class="suivi-td ' + cls + '">' + displayTaux + '</div>';
        html += '</div>';
      });

      html += '</div>';
    }

    content.innerHTML = html;
  }

  /* ═══════ EXERCISE EDITOR ═══════ */
  var exerciceEditorState = {};

  function initExEditor() {
    var overlay    = document.getElementById('ex-editor-overlay');
    var closeBtn   = document.getElementById('ex-editor-close');
    var searchInput = document.getElementById('ex-editor-search');
    var saveBtn    = document.getElementById('ex-editor-save');
    if (!overlay) return;

    if (closeBtn) closeBtn.addEventListener('click', function() {
      overlay.classList.remove('open');
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    if (searchInput) {
      searchInput.addEventListener('input', function() {
        renderExPickerList(searchInput.value);
      });
    }

    if (saveBtn) saveBtn.addEventListener('click', saveExEditor);
  }

  function getExPickerPool() {
    var all = {};
    var pools = SW_API.QUALITY_POOLS || {};
    Object.keys(pools).forEach(function(obj) {
      Object.keys(pools[obj]).forEach(function(lieu) {
        pools[obj][lieu].forEach(function(nom) { all[nom] = true; });
      });
    });
    return Object.keys(all).sort(function(a, b) { return a.localeCompare(b); });
  }

  function renderExPickerList(query) {
    var listEl = document.getElementById('ex-picker-list');
    if (!listEl) return;
    var q = (query || '').trim().toLowerCase();
    if (!q) { listEl.innerHTML = ''; return; }

    var pool = getExPickerPool();
    var filtered = pool.filter(function(n) { return n.toLowerCase().includes(q); });
    var html = filtered.slice(0, 20).map(function(nom) {
      return '<div class="ex-picker-item" data-name="' + esc(nom) + '">' + esc(nom) + '</div>';
    }).join('');
    /* Always offer typed text as custom option */
    var customName = query.trim();
    if (customName && !filtered.includes(customName)) {
      html += '<div class="ex-picker-item ex-picker-custom" data-name="' + esc(customName) + '">' + esc(customName) + ' <em style="opacity:.6;font-size:11px;">(personnalisé)</em></div>';
    }
    if (!html) {
      listEl.innerHTML = '<p style="font-size:12px;color:var(--gris-texte);padding:8px;">Aucun résultat — tape ton exercice et sélectionne-le ci-dessous.</p>';
      return;
    }
    listEl.innerHTML = html;
    listEl.querySelectorAll('.ex-picker-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var nom = item.dataset.name;
        exerciceEditorState.selectedName = nom;
        var selEl = document.getElementById('ex-editor-selected');
        if (selEl) { selEl.textContent = nom; selEl.style.display = 'block'; }
        var si = document.getElementById('ex-editor-search');
        if (si) si.value = nom;
        listEl.innerHTML = '';
      });
    });
  }

  function ouvrirExEditor(dayIdx, exIdx, programmeData) {
    var overlay = document.getElementById('ex-editor-overlay');
    if (!overlay) return;
    var day = programmeData.programme && programmeData.programme[dayIdx];
    var ex = day && day.exercices && day.exercices[exIdx];
    if (!ex) return;

    exerciceEditorState = { dayIdx: dayIdx, exIdx: exIdx, programmeData: programmeData, selectedName: ex.nom };

    var searchInput = document.getElementById('ex-editor-search');
    var selEl       = document.getElementById('ex-editor-selected');
    var seriesEl    = document.getElementById('ex-editor-series');
    var repsEl      = document.getElementById('ex-editor-reps');
    var reposEl     = document.getElementById('ex-editor-repos');
    var errEl       = document.getElementById('ex-editor-error');
    var pickerList  = document.getElementById('ex-picker-list');

    if (searchInput) searchInput.value = ex.nom;
    if (selEl)       { selEl.textContent = ex.nom; selEl.style.display = 'block'; }
    if (seriesEl)    seriesEl.value = ex.series || 3;
    if (repsEl)      repsEl.value   = ex.reps   || '10';
    if (reposEl)     reposEl.value  = ex.repos  || '60 sec';
    if (errEl)       errEl.style.display = 'none';
    if (pickerList)  pickerList.innerHTML = '';

    overlay.classList.add('open');
  }

  function isPushExercise(nom) {
    var n = (nom || '').toLowerCase();
    return n.includes('pompe') || n.includes('push');
  }

  function saveExEditor() {
    var errEl    = document.getElementById('ex-editor-error');
    var seriesEl = document.getElementById('ex-editor-series');
    var repsEl   = document.getElementById('ex-editor-reps');
    var reposEl  = document.getElementById('ex-editor-repos');
    var nom = exerciceEditorState.selectedName;

    if (!nom) {
      if (errEl) { errEl.textContent = 'Sélectionne un exercice'; errEl.style.display = 'block'; }
      return;
    }

    var series = parseInt(seriesEl ? seriesEl.value : 3) || 3;
    var reps   = ((repsEl   ? repsEl.value   : '10') || '10').trim();
    var repos  = ((reposEl  ? reposEl.value  : '60 sec') || '60 sec').trim();

    /* Push cap: if name is a push exercise and includes a >20 kg weight label */
    var weightMatch = nom.match(/\((\d+)\s*kg\)/i);
    if (isPushExercise(nom) && weightMatch && parseInt(weightMatch[1]) > 20) {
      if (errEl) { errEl.textContent = 'Max 20 kg pour les pompes / push-ups (limite de sécurité)'; errEl.style.display = 'block'; }
      return;
    }
    if (errEl) errEl.style.display = 'none';

    var data   = exerciceEditorState.programmeData;
    var dayIdx = exerciceEditorState.dayIdx;
    var exIdx  = exerciceEditorState.exIdx;
    var ex = data.programme[dayIdx].exercices[exIdx];
    ex.nom    = nom;
    ex.series = series;
    ex.reps   = reps;
    ex.repos  = repos;

    SW_STORAGE.save('sw_programme', data);
    var overlay = document.getElementById('ex-editor-overlay');
    if (overlay) overlay.classList.remove('open');
    renderProgramme(data, false);
    SW_PROFIL.showToast('Exercice modifié ✏️');
  }

  return { init: init, recalculerNiveau: recalculerNiveau };

})();
