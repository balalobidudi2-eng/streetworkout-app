/* ========================================
   PROFIL.JS — Page Profil Logic
   Street Workout App
   ======================================== */

/* ── Couleurs disponibles pour l'avatar */
var AVATAR_COLORS = [
  { bg: '#2563EB', text: '#FFFFFF', label: 'Bleu' },
  { bg: '#0284C7', text: '#FFFFFF', label: 'Bleu' },
  { bg: '#EA580C', text: '#FFFFFF', label: 'Orange' },
  { bg: '#DC2626', text: '#FFFFFF', label: 'Rouge' },
  { bg: '#7C3AED', text: '#FFFFFF', label: 'Violet' },
  { bg: '#D97706', text: '#FFFFFF', label: 'Or' },
  { bg: '#1E293B', text: '#FFFFFF', label: 'Sombre' },
  { bg: '#CBD5E1', text: '#0F172A', label: 'Clair' },
];

/* ── Objectifs disponibles */
var OBJECTIFS_LIST = [
  { id: 'force',         label: 'Force maximale',    icon: '', desc: 'Soulever lourd, progresser en lestés' },
  { id: 'esthetique',    label: 'Esthétique',         icon: '', desc: 'Prise de masse, définition musculaire' },
  { id: 'skills',        label: 'Skills & figures',   icon: '', desc: 'Planche, front lever, muscle-up' },
  { id: 'endurance',     label: 'Endurance',          icon: '', desc: 'Tenir plus longtemps, récupérer vite' },
  { id: 'perte_poids',   label: 'Perte de poids',     icon: '', desc: 'Brûler des calories, rester actif' },
  { id: 'flexibilite',   label: 'Flexibilité',        icon: '', desc: 'Mobilité, prévention blessures' },
  { id: 'streetlifting', label: 'Streetlifting',      icon: '', desc: 'Compétition, charges maximales' },
];

/* ── Système de badges */
var BADGES_LIST = [
  {
    id: 'first_session',
    icon: '', label: 'Première séance',
    desc: 'Complète ta première séance',
    condition: function(data) { return (SW.load('sessions') || []).length >= 1; },
    color: '#16A34A'
  },
  {
    id: 'five_sessions',
    icon: '', label: 'En feu',
    desc: '5 séances complétées',
    condition: function(data) { return (SW.load('sessions') || []).length >= 5; },
    color: '#EA580C'
  },
  {
    id: 'ten_sessions',
    icon: '', label: 'Régularité',
    desc: '10 séances complétées',
    condition: function(data) { return (SW.load('sessions') || []).length >= 10; },
    color: '#0284C7'
  },
  {
    id: 'first_pullup',
    icon: '', label: 'Premier pull-up',
    desc: 'Enregistre tes premières tractions',
    condition: function(data) { return (data.pullups || 0) >= 1; },
    color: '#16A34A'
  },
  {
    id: 'ten_pullups',
    icon: '', label: 'Pulling Power',
    desc: "10 tractions d'affilée",
    condition: function(data) { return (data.pullups || 0) >= 10; },
    color: '#D97706'
  },
  {
    id: 'twenty_pullups',
    icon: '', label: 'Pull-up King',
    desc: '20 tractions ou plus',
    condition: function(data) { return (data.pullups || 0) >= 20; },
    color: '#D97706'
  },
  {
    id: 'muscleup',
    icon: '', label: 'Muscle-up',
    desc: 'Muscle-up maîtrisé',
    condition: function(data) { return data.muscleup === 'oui'; },
    color: '#EA580C'
  },
  {
    id: 'intermediaire',
    icon: '', label: 'Niveau Intermédiaire',
    desc: 'Atteindre le niveau Intermédiaire',
    condition: function(data) {
      var lvl = getLevelResult(data).level;
      return lvl === 'Intermédiaire' || lvl === 'Avancé' || lvl === 'Élite';
    },
    color: '#0284C7'
  },
  {
    id: 'avance',
    icon: '', label: 'Niveau Avancé',
    desc: 'Atteindre le niveau Avancé',
    condition: function(data) {
      var lvl = getLevelResult(data).level;
      return lvl === 'Avancé' || lvl === 'Élite';
    },
    color: '#EA580C'
  },
  {
    id: 'elite',
    icon: '', label: 'Élite',
    desc: 'Atteindre le niveau Élite',
    condition: function(data) { return getLevelResult(data).level === 'Élite'; },
    color: '#D97706'
  },
  {
    id: 'profile_complete',
    icon: '', label: 'Profil complet',
    desc: 'Renseigner prénom, pseudo et bio',
    condition: function(data) {
      var p = SW.load('userProfile') || {};
      return !!(p.prenom && p.pseudo && p.bio);
    },
    color: '#16A34A'
  },
  {
    id: 'objectifs_set',
    icon: '', label: 'Objectifs définis',
    desc: 'Sélectionner au moins 2 objectifs',
    condition: function(data) {
      var p = SW.load('userProfile') || {};
      return (p.objectifs || []).length >= 2;
    },
    color: '#7C3AED'
  },
  {
    id: 'first_program',
    icon: '', label: 'Premier programme',
    desc: 'Générer et sauvegarder un programme',
    condition: function(data) { return (SW.load('generated_programs') || []).length >= 1; },
    color: '#0284C7'
  },
  {
    id: 'skills_5',
    icon: '', label: 'Apprenti Skills',
    desc: '5 étapes de progression maîtrisées',
    condition: function(data) {
      var prog = SW.load('progression') || {};
      return Object.values(prog).filter(function(v) { return v === 'maitrise'; }).length >= 5;
    },
    color: '#7C3AED'
  },
  {
    id: 'skills_15',
    icon: '', label: 'Maître des Skills',
    desc: '15 étapes de progression maîtrisées',
    condition: function(data) {
      var prog = SW.load('progression') || {};
      return Object.values(prog).filter(function(v) { return v === 'maitrise'; }).length >= 15;
    },
    color: '#D97706'
  },
];

/* ── Supabase profile cache */
var _profilData = {};

/* ════════════════════════════════════════
   INITIALISATION
   ════════════════════════════════════════ */
async function initProfil() {
  var user = await requireAuth();
  if (!user) return;

  /* Load profile from Supabase */
  var res = await SB.from('profiles').select('*').eq('id', user.id).single();
  _profilData = res.data || {};

  var profile = SW.load('userProfile') || {};

  loadHero(_profilData, profile);
  loadIdentityView(profile);
  renderAvatarColors(profile.avatarColor || AVATAR_COLORS[0].bg);
  loadObjectifPrincipal(profile);
  renderObjectifs(profile.objectifs || []);
  renderBadges(_profilData);
  bindProfilEvents(_profilData);
}

/* ════════════════════════════════════════
   HERO
   ════════════════════════════════════════ */
function loadHero(supaData, profile) {
  var prenom = profile.prenom || supaData.full_name || 'Athlète';
  var pseudo = profile.pseudo ? ('@' + profile.pseudo) : '';
  var initial = prenom.charAt(0).toUpperCase();
  var color = profile.avatarColor || AVATAR_COLORS[0].bg;

  document.getElementById('hero-avatar').textContent = initial;
  document.getElementById('hero-avatar').style.background = color;
  document.getElementById('hero-name').textContent = prenom;
  document.getElementById('hero-pseudo').textContent = pseudo;

  var levelResult = getLevelResult(supaData);
  var heroBadge = document.getElementById('hero-badge');
  heroBadge.textContent = levelResult.emoji + ' ' + levelResult.level;
  heroBadge.style.color = levelResult.color;

  document.getElementById('stat-score').textContent = levelResult.score;
  document.getElementById('stat-seances').textContent = (SW.load('sessions') || []).length;

  var prog = SW.load('progression') || {};
  var skillsCount = Object.values(prog).filter(function(v) { return v === 'maitrise'; }).length;
  document.getElementById('stat-skills').textContent = skillsCount;

  var unlockedCount = BADGES_LIST.filter(function(b) { return b.condition(supaData); }).length;
  document.getElementById('stat-badges').textContent = unlockedCount;
}

/* ── Calcul du niveau depuis le profil Supabase (même logique que dashboard.js) */
function getLevelResult(data) {
  var poids = parseFloat(data.poids) || 75;

  function relStr(reps, added) {
    if (!reps || reps <= 0) return 0;
    return ((poids + (added || 0)) * (1 + reps / 30)) / poids;
  }

  var pullAdded = (data.pullups_20 > 0) ? 20 : (data.pullups_10 > 0) ? 10 : (data.pullups_5 > 0) ? 5 : 0;
  var pullReps  = pullAdded === 20 ? (data.pullups_20 || 0)
                : pullAdded === 10 ? (data.pullups_10 || 0)
                : pullAdded ===  5 ? (data.pullups_5  || 0)
                : (data.pullups || 0);
  var pullRatio = relStr(pullReps, pullAdded);

  var dipsAdded = (data.dips_20 > 0) ? 20 : (data.dips_10 > 0) ? 10 : (data.dips_5 > 0) ? 5 : 0;
  var dipsReps  = dipsAdded === 20 ? (data.dips_20 || 0)
                : dipsAdded === 10 ? (data.dips_10 || 0)
                : dipsAdded ===  5 ? (data.dips_5  || 0)
                : (data.dips || 0);
  var dipsRatio = relStr(dipsReps, dipsAdded);

  var pushupsRatio = data.pushups > 0 ? (poids * 0.64 * (1 + data.pushups / 30)) / poids : 0;

  var score = 0;
  if      (pullRatio >= 2.1) score += 35;
  else if (pullRatio >= 1.7) score += 27;
  else if (pullRatio >= 1.3) score += 18;
  else if (pullRatio >= 1.0) score += 10;
  else if (pullRatio >= 0.5) score +=  4;

  if      (dipsRatio >= 2.2) score += 25;
  else if (dipsRatio >= 1.8) score += 19;
  else if (dipsRatio >= 1.4) score += 13;
  else if (dipsRatio >= 1.0) score +=  7;
  else if (dipsRatio >= 0.5) score +=  3;

  if      (pushupsRatio >= 0.9)      score += 15;
  else if (pushupsRatio >= 0.7)      score += 11;
  else if (pushupsRatio >= 0.5)      score +=  7;
  else if (pushupsRatio >= 0.3)      score +=  4;
  else if ((data.pushups || 0) >= 1) score +=  2;

  if (data.muscleup === 'oui') score += 15;

  if (score >= 75) return { level: 'Élite',         emoji: '', color: '#D97706',  score: score };
  if (score >= 55) return { level: 'Avancé',        emoji: '', color: '#16A34A',  score: score };
  if (score >= 35) return { level: 'Intermédiaire', emoji: '', color: '#0284C7',  score: score };
  if (score >= 15) return { level: 'Novice',        emoji: '', color: '#EA580C',  score: score };
  return              { level: 'Débutant',      emoji: '', color: '#94A3B8',  score: score };
}

/* ════════════════════════════════════════
   IDENTITÉ
   ════════════════════════════════════════ */
function loadIdentityView(profile) {
  document.getElementById('view-prenom').textContent = profile.prenom || 'Non renseigné';
  document.getElementById('view-pseudo').textContent = profile.pseudo ? ('@' + profile.pseudo) : 'Non renseigné';
  document.getElementById('view-bio').textContent = profile.bio || 'Pas encore de bio.';
  document.getElementById('identity-avatar').textContent = (profile.prenom || 'A').charAt(0).toUpperCase();
  document.getElementById('identity-avatar').style.background = profile.avatarColor || AVATAR_COLORS[0].bg;
}

function renderAvatarColors(currentColor) {
  var container = document.getElementById('avatar-colors');
  if (!container) return;

  container.innerHTML = AVATAR_COLORS.map(function(c) {
    return '<button class="avatar-swatch' + (c.bg === currentColor ? ' avatar-swatch--active' : '') + '"'
      + ' style="background:' + c.bg + '" data-color="' + c.bg + '"'
      + ' title="' + c.label + '"></button>';
  }).join('');

  container.querySelectorAll('.avatar-swatch').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var color = btn.dataset.color;
      document.getElementById('identity-avatar').style.background = color;
      document.getElementById('hero-avatar').style.background = color;
      container.querySelectorAll('.avatar-swatch').forEach(function(b) {
        b.classList.toggle('avatar-swatch--active', b.dataset.color === color);
      });
      var profile = SW.load('userProfile') || {};
      SW.save('userProfile', Object.assign({}, profile, { avatarColor: color }));
    });
  });
}

function bindProfilEvents(supaData) {
  /* Toggle mode édition */
  document.getElementById('btn-edit-identity').addEventListener('click', function() {
    var editSection = document.getElementById('identity-edit');
    var viewSection = document.getElementById('identity-view');
    var isEditing = editSection.style.display !== 'none';

    if (isEditing) {
      editSection.style.display = 'none';
      viewSection.style.display = 'flex';
      document.getElementById('btn-edit-identity').textContent = 'Modifier';
    } else {
      var p = SW.load('userProfile') || {};
      document.getElementById('input-prenom').value = p.prenom || '';
      document.getElementById('input-pseudo').value = p.pseudo || '';
      document.getElementById('input-bio').value = p.bio || '';
      document.getElementById('bio-count').textContent = (p.bio || '').length;

      editSection.style.display = 'flex';
      viewSection.style.display = 'none';
      document.getElementById('btn-edit-identity').textContent = 'Fermer';
      document.getElementById('input-prenom').focus();
    }
  });

  /* Compteur de caractères bio */
  document.getElementById('input-bio').addEventListener('input', function(e) {
    document.getElementById('bio-count').textContent = e.target.value.length;
  });

  /* Sauvegarder identité */
  document.getElementById('btn-save-identity').addEventListener('click', function() {
    var prenom = document.getElementById('input-prenom').value.trim();
    var pseudo = document.getElementById('input-pseudo').value.trim().replace('@', '');
    var bio = document.getElementById('input-bio').value.trim();

    var currentProfile = SW.load('userProfile') || {};
    var updated = Object.assign({}, currentProfile, { prenom: prenom, pseudo: pseudo, bio: bio });
    SW.save('userProfile', updated);

    loadIdentityView(updated);
    document.getElementById('identity-edit').style.display = 'none';
    document.getElementById('identity-view').style.display = 'flex';
    document.getElementById('btn-edit-identity').textContent = 'Modifier';

    document.getElementById('hero-name').textContent = prenom || 'Athlète';
    document.getElementById('hero-pseudo').textContent = pseudo ? ('@' + pseudo) : '';
    document.getElementById('hero-avatar').textContent = (prenom || 'A').charAt(0).toUpperCase();

    showToast('Profil mis à jour');
    _checkBadgeUnlock('profile_complete', supaData);
  });

  /* Annuler édition */
  document.getElementById('btn-cancel-identity').addEventListener('click', function() {
    document.getElementById('identity-edit').style.display = 'none';
    document.getElementById('identity-view').style.display = 'flex';
    document.getElementById('btn-edit-identity').textContent = 'Modifier';
  });

  /* Sauvegarder objectifs */
  document.getElementById('btn-save-objectifs').addEventListener('click', function() {
    var selected = Array.from(document.querySelectorAll('.objectif-card--active'))
      .map(function(el) { return el.dataset.id; });
    var profile = SW.load('userProfile') || {};
    SW.save('userProfile', Object.assign({}, profile, { objectifs: selected }));
    showToast(selected.length + ' objectif(s) sauvegardé(s)');

    renderBadges(supaData);
    _checkBadgeUnlock('objectifs_set', supaData);
  });

  /* Sauvegarder objectif principal */
  var btnObjPrincipal = document.getElementById('btn-save-objectif-principal');
  if (btnObjPrincipal) {
    btnObjPrincipal.addEventListener('click', function() {
      var cat = document.getElementById('objectif-principal-select').value;
      var detail = document.getElementById('objectif-principal-detail').value.trim();
      var profile = SW.load('userProfile') || {};
      SW.save('userProfile', Object.assign({}, profile, {
        objectif_principal: cat,
        objectif_principal_detail: detail
      }));
      showToast('Objectif principal sauvegardé');
    });
  }
}

/* ════════════════════════════════════════
   OBJECTIF PRINCIPAL
   ════════════════════════════════════════ */
function loadObjectifPrincipal(profile) {
  var sel = document.getElementById('objectif-principal-select');
  var det = document.getElementById('objectif-principal-detail');
  if (sel && profile.objectif_principal) sel.value = profile.objectif_principal;
  if (det && profile.objectif_principal_detail) det.value = profile.objectif_principal_detail;
}

/* ════════════════════════════════════════
   OBJECTIFS
   ════════════════════════════════════════ */
function renderObjectifs(selectedIds) {
  var grid = document.getElementById('objectifs-grid');
  if (!grid) return;

  grid.innerHTML = OBJECTIFS_LIST.map(function(obj) {
    return '<div class="objectif-card' + (selectedIds.indexOf(obj.id) !== -1 ? ' objectif-card--active' : '') + '"'
      + ' data-id="' + obj.id + '">'
      + '<div class="objectif-icon">' + obj.icon + '</div>'
      + '<div class="objectif-label">' + obj.label + '</div>'
      + '<div class="objectif-desc">' + obj.desc + '</div>'
      + '<div class="objectif-check">✓</div>'
      + '</div>';
  }).join('');

  grid.querySelectorAll('.objectif-card').forEach(function(card) {
    card.addEventListener('click', function() {
      card.classList.toggle('objectif-card--active');
    });
  });
}

/* ════════════════════════════════════════
   BADGES
   ════════════════════════════════════════ */
function renderBadges(supaData) {
  var grid = document.getElementById('badges-grid');
  if (!grid) return;

  var results = BADGES_LIST.map(function(badge) {
    return Object.assign({}, badge, { unlocked: badge.condition(supaData) });
  });

  results.sort(function(a, b) { return b.unlocked - a.unlocked; });

  var unlockedCount = results.filter(function(b) { return b.unlocked; }).length;
  document.getElementById('badges-count').textContent = unlockedCount;
  document.getElementById('badges-total').textContent = BADGES_LIST.length;
  document.getElementById('stat-badges').textContent = unlockedCount;

  grid.innerHTML = results.map(function(badge) {
    return '<div class="badge-card ' + (badge.unlocked ? 'badge-card--unlocked' : 'badge-card--locked') + '">'
      + '<div class="badge-icon"' + (badge.unlocked ? ' style="color:' + badge.color + '"' : '') + '>'
      + (badge.unlocked ? badge.icon : '')
      + '</div>'
      + '<div class="badge-label">' + badge.label + '</div>'
      + '<div class="badge-desc">' + badge.desc + '</div>'
      + (badge.unlocked ? '<div class="badge-status">Débloqué ✓</div>' : '')
      + '</div>';
  }).join('');
}

function _checkBadgeUnlock(badgeId, supaData) {
  var badge = BADGES_LIST.find(function(b) { return b.id === badgeId; });
  if (badge && badge.condition(supaData)) {
    showToast('Badge débloqué : ' + badge.label + ' !');
    renderBadges(supaData);
  }
}

document.addEventListener('DOMContentLoaded', initProfil);
