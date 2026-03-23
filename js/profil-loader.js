/**
 * profil-loader.js — FORGE
 * Charge et distribue les données du profil utilisateur depuis localStorage.
 * Inclure AVANT tous les autres scripts dans chaque page.
 */

(function() {
  'use strict';

  // ── Chargement ──────────────────────────────────────────────
  window.SW_PROFIL = JSON.parse(localStorage.getItem('sw_profil') || '{}');

  function getProfilValue(key, fallback) {
    var val = window.SW_PROFIL[key];
    return (val !== undefined && val !== null && val !== '') ? val : (fallback !== undefined ? fallback : '');
  }

  function updateProfilValue(key, value) {
    window.SW_PROFIL[key] = value;
    localStorage.setItem('sw_profil', JSON.stringify(window.SW_PROFIL));
  }

  function saveProfilFull(obj) {
    window.SW_PROFIL = Object.assign(window.SW_PROFIL || {}, obj);
    localStorage.setItem('sw_profil', JSON.stringify(window.SW_PROFIL));
  }

  // Exposer les fonctions globalement
  window.getProfilValue = getProfilValue;
  window.updateProfilValue = updateProfilValue;
  window.saveProfilFull = saveProfilFull;

  // ── Injection dans les éléments data-profil ────────────────
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-profil]').forEach(function(el) {
      var key = el.dataset.profil;
      var val = getProfilValue(key, '');

      if (el.tagName === 'INPUT') {
        el.value = val;
      } else if (el.tagName === 'SELECT') {
        el.value = val;
      } else if (el.tagName === 'TEXTAREA') {
        el.value = val;
      } else {
        el.textContent = val;
      }
    });

    // Checkboxes avec data-profil-arr (tableau)
    document.querySelectorAll('[data-profil-arr]').forEach(function(el) {
      var key = el.dataset.profilArr;
      var arr = getProfilValue(key, []);
      if (!Array.isArray(arr)) arr = [];
      if (el.tagName === 'INPUT' && el.type === 'checkbox') {
        el.checked = arr.indexOf(el.value) !== -1;
        var lbl = el.closest('.forge-checkbox-label');
        if (lbl) {
          if (el.checked) lbl.classList.add('checked');
          else lbl.classList.remove('checked');
        }
      }
    });

    // Injection prénom dans l'avatar header
    var prenom = getProfilValue('prenom', '');
    var avatarEls = document.querySelectorAll('.forge-avatar');
    avatarEls.forEach(function(av) {
      if (prenom) av.textContent = prenom.charAt(0).toUpperCase();
    });

    var prenomEls = document.querySelectorAll('[data-profil="prenom"]');
    prenomEls.forEach(function(el) {
      if (prenom && el.tagName !== 'INPUT') el.textContent = prenom;
    });

    // IMC en lecture seule
    var poids = parseFloat(getProfilValue('poids', 0));
    var taille = parseFloat(getProfilValue('taille', 0));
    if (poids > 0 && taille > 0) {
      var imcVal = (poids / Math.pow(taille / 100, 2)).toFixed(1);
      document.querySelectorAll('[data-profil="imc"]').forEach(function(el) {
        el.textContent = imcVal;
      });
      updateProfilValue('imc', imcVal);
    }

    // Âge depuis annee_naissance
    var annee = parseInt(getProfilValue('annee_naissance', 0));
    if (annee > 0) {
      var age = new Date().getFullYear() - annee;
      document.querySelectorAll('[data-profil="age"]').forEach(function(el) {
        el.textContent = age;
        if (el.tagName === 'INPUT') el.value = age;
      });
      updateProfilValue('age', age);
    }
  });

})();
