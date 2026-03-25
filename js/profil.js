/* ═══════════════════════════════════════════════════════
   PROFIL — js/profil.js
   ═══════════════════════════════════════════════════════ */

var SW_PROFIL = (function() {

  function init() {
    loadForm();
    bindForm();
    renderStats();
    updateAvatar();
  }

  /* ── Load saved data into form ── */
  function loadForm() {
    var p = SW_STORAGE.load('sw_profil');
    if (!p) return;
    setVal('input-username', p.username);
    setVal('input-prenom', p.prenom);
    setVal('input-nom', p.nom);
    setVal('input-annee', p.annee);
    setVal('input-taille', p.taille);
    setVal('input-poids', p.poids);
    if (p.age) showHint('hint-age', p.age + ' ans');
    if (p.imc) showImc(p.imc);
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  }

  /* ── Bind form events ── */
  function bindForm() {
    var annee = document.getElementById('input-annee');
    var taille = document.getElementById('input-taille');
    var poids = document.getElementById('input-poids');

    if (annee) annee.addEventListener('input', function() {
      var y = parseInt(this.value);
      if (y > 1940 && y <= new Date().getFullYear()) {
        showHint('hint-age', (new Date().getFullYear() - y) + ' ans');
      }
    });

    function recalcImc() {
      var t = parseFloat(taille ? taille.value : 0);
      var w = parseFloat(poids ? poids.value : 0);
      if (t > 0 && w > 0) {
        showImc(w / Math.pow(t / 100, 2));
      }
    }

    if (taille) taille.addEventListener('input', recalcImc);
    if (poids)  poids.addEventListener('input', recalcImc);

    var btn = document.getElementById('btn-save-profil');
    if (btn) btn.addEventListener('click', saveProfil);
  }

  function showHint(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showImc(imc) {
    var v = parseFloat(imc.toFixed(1));
    var label, cls;
    if      (v < 18.5) { label = 'Insuffisant'; cls = 'imc-under'; }
    else if (v < 25)   { label = 'Normal';       cls = 'imc-normal'; }
    else if (v < 30)   { label = 'Surpoids';     cls = 'imc-over'; }
    else               { label = 'Obésité';      cls = 'imc-obese'; }

    var el = document.getElementById('hint-imc');
    if (el) {
      el.innerHTML = v + ' — <span class="imc-indicator ' + cls + '">' + label + '</span>';
    }
  }

  /* ── Save profil ── */
  function saveProfil() {
    var username = (document.getElementById('input-username').value || '').trim().replace(/\s+/g, '');
    var prenom = (document.getElementById('input-prenom').value || '').trim();
    var nom    = (document.getElementById('input-nom').value || '').trim();
    var annee  = parseInt(document.getElementById('input-annee').value) || 0;
    var taille = parseFloat(document.getElementById('input-taille').value) || 0;
    var poids  = parseFloat(document.getElementById('input-poids').value) || 0;
    var age    = annee > 0 ? new Date().getFullYear() - annee : 0;
    var imc    = taille > 0 && poids > 0 ? poids / Math.pow(taille / 100, 2) : 0;

    SW_STORAGE.update('sw_profil', {
      username: username,
      prenom: prenom,
      nom: nom,
      annee: annee,
      age: age,
      taille: taille,
      poids: poids,
      imc: parseFloat(imc.toFixed(1))
    });

    showToast('Profil sauvegardé');
    try { updateAvatar(); } catch(e) {}
    try { renderStats(); } catch(e) {}
    /* Refresh social public profile (best-effort) */
    if (typeof SW_RESEAU !== 'undefined') SW_RESEAU.refreshProfile(prenom, nom, username);
  }

  /* ── Avatar ── */
  function updateAvatar() {
    var p = SW_STORAGE.load('sw_profil');
    var initial = (p && p.prenom) ? p.prenom.charAt(0).toUpperCase() : '?';

    var header = document.getElementById('header-avatar');
    if (header) header.textContent = initial;

    var big = document.getElementById('profil-avatar');
    if (big) big.textContent = initial;

    var greeting = document.getElementById('profil-greeting');
    if (greeting && p && p.prenom) {
      greeting.textContent = 'Bonjour ' + p.prenom;
    }
  }

  /* ── Stats ── */
  function renderStats() {
    var p = SW_STORAGE.load('sw_profil') || {};
    var seancesRaw = SW_STORAGE.load('sw_seances');
    var seances = Array.isArray(seancesRaw) ? seancesRaw : [];

    var imcEl = document.getElementById('stat-imc');
    if (imcEl) imcEl.textContent = p.imc ? p.imc.toFixed(1) : '—';

    var nivEl = document.getElementById('stat-niveau');
    if (nivEl) {
      nivEl.textContent = p.niveau || 'Débutant';
    }

    var sesEl = document.getElementById('stat-seances');
    if (sesEl) {
      var done = seances.filter(function(s) { return s.statut === 'effectuee'; }).length;
      sesEl.textContent = done;
    }
  }

  /* ── Toast ── */
  function showToast(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 2200);
  }

  return { init: init, updateAvatar: updateAvatar, renderStats: renderStats, showToast: showToast };

})();
