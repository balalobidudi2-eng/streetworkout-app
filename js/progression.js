/* ========================================
   PROGRESSION.JS — Exercise Progression (Supabase)
   ======================================== */

/* ── Cached user ID and progression data ── */
var _progUserId = null;
var _progData = {};

/* Exercise data — 14 exercises organized by category */
var EXERCISES = [
  /* ── PULL ── */
  {
    id: 'pullups', name: 'Tractions', icon: '💪', color: '#00FF87', category: 'pull',
    steps: [
      { id: 'pullups-1', name: 'Suspension active', desc: 'Maintien bras tendus à la barre, 20s+' },
      { id: 'pullups-2', name: 'Rangée australienne', desc: 'Inverted row sous une barre basse' },
      { id: 'pullups-3', name: 'Traction assistée élastique', desc: 'Bande de résistance pour alléger le poids' },
      { id: 'pullups-4', name: 'Traction stricte', desc: 'Chin-up puis pull-up menton au-dessus de la barre' },
      { id: 'pullups-5', name: 'Traction lestée', desc: 'Gilet ou ceinture lestée avec charge additionnelle' },
      { id: 'pullups-6', name: 'Traction à une main', desc: 'Objectif ultime — contrôle total unilatéral' }
    ]
  },
  {
    id: 'muscleup', name: 'Muscle-up', icon: '🚀', color: '#FF3D5A', category: 'pull',
    steps: [
      { id: 'muscleup-1', name: 'Tractions explosives', desc: 'Tête au-dessus de la barre à chaque rep' },
      { id: 'muscleup-2', name: 'Sortie de buste', desc: 'Partial muscle-up — monter le torse au-dessus' },
      { id: 'muscleup-3', name: 'Muscle-up avec élastique', desc: 'Bande d\'assistance pour la transition' },
      { id: 'muscleup-4', name: 'Muscle-up kipping', desc: 'Utilisation de l\'élan contrôlé pour passer' },
      { id: 'muscleup-5', name: 'Muscle-up strict', desc: 'Objectif — transition fluide sans élan' }
    ]
  },
  {
    id: 'frontlever', name: 'Front Lever', icon: '🏋️', color: '#00B4FF', category: 'pull',
    steps: [
      { id: 'frontlever-1', name: 'Compression abdominale', desc: 'Hollow body hold — dos plaqué au sol' },
      { id: 'frontlever-2', name: 'Front lever groupé', desc: 'Genoux ramenés vers la poitrine suspendu' },
      { id: 'frontlever-3', name: 'Front lever une jambe', desc: 'Une jambe tendue, une repliée' },
      { id: 'frontlever-4', name: 'Front lever straddle', desc: 'Deux jambes tendues écartées horizontalement' },
      { id: 'frontlever-5', name: 'Front lever planche complète', desc: 'Position horizontale parfaite' }
    ]
  },
  {
    id: 'backlever', name: 'Back Lever', icon: '🏊', color: '#EA580C', category: 'pull',
    steps: [
      { id: 'backlever-1', name: 'German hang passif', desc: 'Suspension épaules en arrière, corps tombant' },
      { id: 'backlever-2', name: 'Back lever groupé', desc: 'Genoux ramenés, dos horizontal' },
      { id: 'backlever-3', name: 'Back lever une jambe', desc: 'Une jambe tendue, une repliée' },
      { id: 'backlever-4', name: 'Back lever straddle', desc: 'Deux jambes tendues écartées horizontalement' },
      { id: 'backlever-5', name: 'Back lever planche', desc: 'Position horizontale dos au sol' }
    ]
  },
  /* ── PUSH ── */
  {
    id: 'dips', name: 'Dips', icon: '🔥', color: '#00B4FF', category: 'push',
    steps: [
      { id: 'dips-1', name: 'Dips sur chaise', desc: 'Position assise, mains sur le rebord, descente contrôlée' },
      { id: 'dips-2', name: 'Dips barres parallèles', desc: 'Poids de corps uniquement, amplitude complète' },
      { id: 'dips-3', name: 'Dips lestés gilet', desc: 'Ajout progressif de charge avec un gilet' },
      { id: 'dips-4', name: 'Dips ceinture + disques', desc: 'Charges lourdes suspendues à la ceinture' },
      { id: 'dips-5', name: 'Dips explosifs', desc: 'Poussée dynamique avec temps de vol' }
    ]
  },
  {
    id: 'pushups', name: 'Pompes', icon: '⚡', color: '#FF6B35', category: 'push',
    steps: [
      { id: 'pushups-1', name: 'Pompes sur genoux', desc: 'Version allégée pour construire la base' },
      { id: 'pushups-2', name: 'Pompes normales', desc: 'Position planche, amplitude complète' },
      { id: 'pushups-3', name: 'Pompes diamant', desc: 'Mains rapprochées pour cibler les triceps' },
      { id: 'pushups-4', name: 'Pompes déclinées', desc: 'Pieds surélevés pour augmenter la difficulté' },
      { id: 'pushups-5', name: 'Pompes claquées', desc: 'Poussée explosive avec claquement des mains' },
      { id: 'pushups-6', name: 'Pompes en appui renversé', desc: 'Handstand push-up contre le mur' }
    ]
  },
  {
    id: 'handstand', name: 'Handstand / HSPU', icon: '🤸', color: '#7C3AED', category: 'push',
    steps: [
      { id: 'handstand-1', name: 'Planche inclinée sur mur', desc: 'Pieds sur le mur, corps incliné à 45°' },
      { id: 'handstand-2', name: 'Kick-up contre le mur', desc: 'Monter en équilibre contre le mur 20-30s' },
      { id: 'handstand-3', name: 'Handstand contre mur (tendu)', desc: 'Corps parfaitement aligné, maintien 30s+' },
      { id: 'handstand-4', name: 'HSPU partiel contre mur', desc: 'Descente partielle du crâne vers le sol' },
      { id: 'handstand-5', name: 'HSPU complet contre mur', desc: 'Amplitude totale crâne-sol-bras tendus' },
      { id: 'handstand-6', name: 'Handstand libre 5s+', desc: 'Équilibre libre sans support' },
      { id: 'handstand-7', name: 'Handstand libre 30s+', desc: 'Équilibre libre maîtrisé' }
    ]
  },
  {
    id: 'planche', name: 'Planche', icon: '🤾', color: '#16A34A', category: 'push',
    steps: [
      { id: 'planche-1', name: 'Planche lean', desc: 'Penché en avant sur les paumes, pieds au sol' },
      { id: 'planche-2', name: 'Tuck planche', desc: 'Genoux contre la poitrine, pieds décollés' },
      { id: 'planche-3', name: 'Advanced tuck planche', desc: 'Genoux éloignés du corps, dos horizontal' },
      { id: 'planche-4', name: 'Straddle planche', desc: 'Jambes écartées et tendues' },
      { id: 'planche-5', name: 'Full planche', desc: 'Corps horizontal parfait, jambes jointes' }
    ]
  },
  /* ── SKILLS ── */
  {
    id: 'humanflag', name: 'Human Flag', icon: '🚩', color: '#0284C7', category: 'skills',
    steps: [
      { id: 'humanflag-1', name: 'Side plank vertical', desc: 'Gainage latéral sur poteau / mur' },
      { id: 'humanflag-2', name: 'Flag groupé', desc: 'Corps en boule, position latérale sur poteau' },
      { id: 'humanflag-3', name: 'Flag avec assistance', desc: 'Un élastique ou un appui pour l\'horizontale' },
      { id: 'humanflag-4', name: 'Flag straddle', desc: 'Jambes écartées pour réduire le bras de levier' },
      { id: 'humanflag-5', name: 'Human flag complet', desc: 'Corps horizontal parfait 3s+' }
    ]
  },
  {
    id: 'lsit', name: 'L-sit', icon: '🪑', color: '#FFD93D', category: 'skills',
    steps: [
      { id: 'lsit-1', name: 'Tuck L-sit au sol', desc: 'Genoux rentrés, fesses décollées du sol' },
      { id: 'lsit-2', name: 'L-sit une jambe', desc: 'Une jambe tendue, une repliée' },
      { id: 'lsit-3', name: 'L-sit complet au sol', desc: 'Deux jambes tendues parallèles au sol' },
      { id: 'lsit-4', name: 'L-sit aux barres parallèles', desc: 'Maintien L-sit 15s+ aux barres' },
      { id: 'lsit-5', name: 'V-sit', desc: 'Jambes au-dessus de l\'horizontale' }
    ]
  },
  {
    id: 'maltese', name: 'Maltese / Iron Cross', icon: '✝️', color: '#DC2626', category: 'skills',
    steps: [
      { id: 'maltese-1', name: 'Support aux anneaux', desc: 'Maintien stable bras tendus 30s+' },
      { id: 'maltese-2', name: 'Croix de fer assistée', desc: 'Élastique ou assistance partielle' },
      { id: 'maltese-3', name: 'Croix de fer 3s', desc: 'Maintien statique sans aide' },
      { id: 'maltese-4', name: 'Maltese assistée', desc: 'Position horizontale à plat aux anneaux' },
      { id: 'maltese-5', name: 'Maltese complète', desc: 'Maintien maltese 3s+' }
    ]
  },
  /* ── LEGS ── */
  {
    id: 'squats', name: 'Squats', icon: '🦵', color: '#00FF87', category: 'legs',
    steps: [
      { id: 'squats-1', name: 'Squat assisté', desc: 'Avec TRX ou appui sur une chaise' },
      { id: 'squats-2', name: 'Goblet squat', desc: 'Sans charge, focus sur la mobilité' },
      { id: 'squats-3', name: 'Squat air', desc: 'Parfaite exécution pieds parallèles' },
      { id: 'squats-4', name: 'Squat lesté', desc: 'Gilet ou sac lesté pour résistance' },
      { id: 'squats-5', name: 'Pistol squat progressions', desc: 'Travail unilatéral progressif' },
      { id: 'squats-6', name: 'Pistol squat complet', desc: 'Squat une jambe complet et contrôlé' }
    ]
  },
  {
    id: 'nordic', name: 'Nordic Curl', icon: '🔻', color: '#F97316', category: 'legs',
    steps: [
      { id: 'nordic-1', name: 'Négatif assisté', desc: 'Descente lente avec appui sur les mains' },
      { id: 'nordic-2', name: 'Négatif complet', desc: 'Descente contrôlée sans aide' },
      { id: 'nordic-3', name: 'Nordic partiel', desc: 'Descente et remontée sur 50% de l\'amplitude' },
      { id: 'nordic-4', name: 'Nordic complet', desc: 'Amplitude totale avec remontée' },
      { id: 'nordic-5', name: 'Nordic lesté', desc: 'Ajout de charge sur le torse' }
    ]
  },
  {
    id: 'calfpress', name: 'Mollets', icon: '🦶', color: '#06B6D4', category: 'legs',
    steps: [
      { id: 'calfpress-1', name: 'Élévation bilatérale', desc: 'Montée sur pointes, deux pieds au sol' },
      { id: 'calfpress-2', name: 'Élévation sur marche', desc: 'Talon plus bas que les orteils pour amplitude' },
      { id: 'calfpress-3', name: 'Élévation unilatérale', desc: 'Un pied à la fois, poids de corps' },
      { id: 'calfpress-4', name: 'Élévation lestée', desc: 'Haltère ou gilet pour résistance' },
      { id: 'calfpress-5', name: 'Drop set explosif', desc: 'Séries dégressives rapides et dynamiques' }
    ]
  }
];

/* Status options */
var STATUS_OPTIONS = [
  { value: 'not-acquired', label: '⬜ Non acquis' },
  { value: 'in-progress', label: '🔄 En cours' },
  { value: 'mastered', label: '✅ Maîtrisé' }
];

async function initProgression() {
  var user = await requireAuth();
  if (!user) return;
  _progUserId = user.id;

  /* Load progression data from Supabase */
  var res = await SB.from('progression_skills').select('skill_id, status').eq('user_id', user.id);
  _progData = {};
  if (res.data) {
    res.data.forEach(function(row) { _progData[row.skill_id] = row.status; });
  }

  renderOverview();
  renderAccordions();
  updateGlobalScore();
}

/* Render overview circles at top */
function renderOverview() {
  var container = document.getElementById('overview-circles');
  if (!container) return;

  var html = '';
  EXERCISES.forEach(function(ex) {
    var stats = getExerciseStats(ex);
    var pct = ex.steps.length > 0 ? Math.round((stats.mastered / ex.steps.length) * 100) : 0;
    var circumference = 2 * Math.PI * 34;
    var offset = circumference - (pct / 100) * circumference;

    html += '<div class="overview-circle">' +
      '<div class="progress-circle">' +
      '<svg width="80" height="80" viewBox="0 0 80 80">' +
      '<circle class="progress-circle-bg" cx="40" cy="40" r="34"/>' +
      '<circle class="progress-circle-fill" cx="40" cy="40" r="34" ' +
      'stroke="' + ex.color + '" ' +
      'stroke-dasharray="' + circumference + '" ' +
      'stroke-dashoffset="' + offset + '"/>' +
      '</svg>' +
      '<span class="progress-circle-text" style="font-size:0.75rem;">' + pct + '%</span>' +
      '</div>' +
      '<span class="overview-label">' + ex.icon + ' ' + ex.name + '</span>' +
      '</div>';
  });

  container.innerHTML = html;
}

/* Get stats for an exercise */
function getExerciseStats(exercise) {
  var mastered = 0;
  var inProgress = 0;
  var total = exercise.steps.length;

  exercise.steps.forEach(function(step) {
    var status = _progData[step.id] || 'not-acquired';
    if (status === 'mastered') mastered++;
    if (status === 'in-progress') inProgress++;
  });

  return { mastered: mastered, inProgress: inProgress, total: total };
}

/* Render accordion sections */
function renderAccordions() {
  var container = document.getElementById('progression-list');
  if (!container) return;

  var html = '';

  EXERCISES.forEach(function(ex, idx) {
    var stats = getExerciseStats(ex);
    var barPct = ex.steps.length > 0 ? Math.round((stats.mastered / ex.steps.length) * 100) : 0;

    html += '<div class="accordion-item card" id="accordion-' + ex.id + '">' +
      '<div class="accordion-header" onclick="toggleAccordion(\'' + ex.id + '\')">' +
      '<div class="accordion-header-left">' +
      '<span class="accordion-icon">' + ex.icon + '</span>' +
      '<div>' +
      '<div class="accordion-title">' + ex.name + '</div>' +
      '<div class="accordion-meta">' + stats.mastered + '/' + stats.total + ' étapes maîtrisées</div>' +
      '</div>' +
      '</div>' +
      '<div class="accordion-header-right">' +
      '<div class="mini-progress" style="width:60px;">' +
      '<div class="progress-bar" style="height:6px;">' +
      '<div class="progress-bar-fill" style="width:' + barPct + '%; background:' + ex.color + ';"></div>' +
      '</div>' +
      '</div>' +
      '<span class="accordion-arrow">▼</span>' +
      '</div>' +
      '</div>' +
      '<div class="accordion-content">' +
      '<div class="steps-list">';

    ex.steps.forEach(function(step, stepIdx) {
      var currentStatus = _progData[step.id] || 'not-acquired';

      html += '<div class="step-row" id="step-row-' + step.id + '">' +
        '<div class="step-info">' +
        '<div class="step-counter">' + (stepIdx + 1) + '</div>' +
        '<div>' +
        '<div class="step-name">' + step.name + '</div>' +
        '<div class="step-desc">' + step.desc + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="status-radio-group">';

      STATUS_OPTIONS.forEach(function(opt) {
        var checked = currentStatus === opt.value ? ' checked' : '';
        var inputId = step.id + '-' + opt.value;
        html += '<input type="radio" class="status-radio" name="status-' + step.id + '" ' +
          'id="' + inputId + '" value="' + opt.value + '"' + checked +
          ' onchange="updateStepStatus(\'' + step.id + '\', \'' + opt.value + '\', this)">' +
          '<label class="status-label" for="' + inputId + '">' + opt.label + '</label>';
      });

      html += '</div></div>';
    });

    html += '</div></div></div>';
  });

  container.innerHTML = html;
}

/* Toggle accordion */
function toggleAccordion(exerciseId) {
  var el = document.getElementById('accordion-' + exerciseId);
  if (el) el.classList.toggle('open');
}

/* Update step status — save to Supabase */
async function updateStepStatus(stepId, newValue, inputEl) {
  var oldValue = _progData[stepId] || 'not-acquired';
  _progData[stepId] = newValue;

  /* Upsert to Supabase */
  await SB.from('progression_skills').upsert({
    user_id: _progUserId,
    skill_id: stepId,
    status: newValue
  }, { onConflict: 'user_id,skill_id' });

  /* Confetti if mastered */
  if (newValue === 'mastered' && oldValue !== 'mastered') {
    var rect = inputEl.parentElement.getBoundingClientRect();
    launchConfetti(rect.left + rect.width / 2, rect.top);
    showToast('Étape maîtrisée ! 🎉');
  }

  renderOverview();
  updateGlobalScore();
  updateAccordionMeta();
}

/* Update accordion meta without full re-render */
function updateAccordionMeta() {
  EXERCISES.forEach(function(ex) {
    var stats = getExerciseStats(ex);
    var barPct = ex.steps.length > 0 ? Math.round((stats.mastered / ex.steps.length) * 100) : 0;
    var accordion = document.getElementById('accordion-' + ex.id);
    if (accordion) {
      var meta = accordion.querySelector('.accordion-meta');
      if (meta) meta.textContent = stats.mastered + '/' + stats.total + ' étapes maîtrisées';
      var barFill = accordion.querySelector('.accordion-header .progress-bar-fill');
      if (barFill) barFill.style.width = barPct + '%';
    }
  });
}

/* Update global score */
function updateGlobalScore() {
  var totalSteps = 0;
  var totalMastered = 0;

  EXERCISES.forEach(function(ex) {
    var stats = getExerciseStats(ex);
    totalSteps += stats.total;
    totalMastered += stats.mastered;
  });

  var pct = totalSteps > 0 ? Math.round((totalMastered / totalSteps) * 100) : 0;
  var globalEl = document.getElementById('global-score');
  if (globalEl) globalEl.textContent = pct + '% du parcours complet';

  var globalCount = document.getElementById('global-count');
  if (globalCount) globalCount.textContent = totalMastered + '/' + totalSteps + ' étapes';
}

/* Initialize on load */
document.addEventListener('DOMContentLoaded', initProgression);
