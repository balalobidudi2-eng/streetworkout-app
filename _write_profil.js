const fs = require('fs');
const h = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FORGE — Profil</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/forge.css">
</head>
<body>
<script src="js/profil-loader.js"><\/script>
<script>
  (function(){
    var p=JSON.parse(localStorage.getItem('sw_profil')||'null');
    if(!p||!p.setup_done) window.location.href='onboarding.html';
  })();
<\/script>

<div class="forge-wrapper">

  <header class="forge-header">
    <div class="forge-header-inner">
      <span class="forge-logo">FORGE</span>
      <nav class="forge-nav">
        <a href="index.html">Accueil</a>
        <a href="entrainement.html">Entraînement</a>
        <a href="progression.html">Découvrir</a>
        <a href="analytics.html">Rapport</a>
        <a href="profil.html" class="active">Profil</a>
      </nav>
      <div class="forge-header-user">
        <span class="forge-user-name" data-profil="prenom"></span>
        <div class="forge-avatar" id="header-avatar">U</div>
      </div>
    </div>
  </header>

  <main>
    <div class="forge-container">
      <div class="forge-profil-layout">

        <!-- Sidebar profil -->
        <aside class="forge-profil-sidebar">
          <div class="forge-profil-avatar">
            <div class="img-placeholder" style="border-radius:50%;min-height:0;height:96px;"></div>
          </div>
          <div class="forge-profil-name" id="sidebar-name">Mon profil</div>
          <div class="forge-profil-niveau" data-profil="niveau">—</div>
          <div style="width:100%;border-top:1px solid var(--gris-moyen);padding-top:16px;margin-top:8px;">
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;color:var(--gris-texte);text-transform:uppercase;font-weight:600;letter-spacing:.5px;">Age</span>
                <span style="font-size:15px;font-weight:700;" data-profil="age">—</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;color:var(--gris-texte);text-transform:uppercase;font-weight:600;letter-spacing:.5px;">Taille</span>
                <span style="font-size:15px;font-weight:700;" id="sidebar-taille">—</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;color:var(--gris-texte);text-transform:uppercase;font-weight:600;letter-spacing:.5px;">Poids</span>
                <span style="font-size:15px;font-weight:700;" id="sidebar-poids">—</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;color:var(--gris-texte);text-transform:uppercase;font-weight:600;letter-spacing:.5px;">IMC</span>
                <span style="font-size:15px;font-weight:700;" data-profil="imc">—</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Formulaire profil -->
        <div id="profil-form-area">

          <!-- Identité -->
          <div class="forge-form-section">
            <div class="forge-form-section-title">Identité</div>
            <div class="forge-form-grid">
              <div class="forge-form-field">
                <label for="inp-prenom">Prénom</label>
                <input type="text" id="inp-prenom" data-profil="prenom" placeholder="Ton prénom">
              </div>
              <div class="forge-form-field">
                <label for="inp-nom">Nom</label>
                <input type="text" id="inp-nom" data-profil="nom" placeholder="Ton nom">
              </div>
            </div>
          </div>

          <!-- Données physiques -->
          <div class="forge-form-section">
            <div class="forge-form-section-title">Données physiques</div>
            <div class="forge-form-grid">
              <div class="forge-form-field">
                <label for="inp-poids">Poids (kg)</label>
                <input type="number" id="inp-poids" data-profil="poids" min="30" max="250" placeholder="75">
              </div>
              <div class="forge-form-field">
                <label for="inp-taille">Taille (cm)</label>
                <input type="number" id="inp-taille" data-profil="taille" min="100" max="250" placeholder="175">
              </div>
              <div class="forge-form-field">
                <label>Âge</label>
                <input type="text" readonly class="forge-form-readonly" data-profil="age" placeholder="—">
              </div>
              <div class="forge-form-field">
                <label>IMC</label>
                <input type="text" readonly class="forge-form-readonly" id="inp-imc" placeholder="—">
              </div>
            </div>
          </div>

          <!-- Objectifs -->
          <div class="forge-form-section">
            <div class="forge-form-section-title">Objectifs</div>
            <div style="display:flex;flex-direction:column;gap:16px;">
              <div class="forge-form-field">
                <label for="inp-objectif">Objectif principal</label>
                <select id="inp-objectif" data-profil="objectif">
                  <option value="">Choisir...</option>
                  <option value="Perdre du poids">Perdre du poids</option>
                  <option value="Prendre du muscle">Prendre du muscle</option>
                  <option value="Améliorer mon endurance">Améliorer mon endurance</option>
                  <option value="Maîtriser des figures">Maîtriser des figures</option>
                  <option value="Rester en forme">Rester en forme</option>
                </select>
              </div>
              <div class="forge-form-field">
                <label>Zones cibles</label>
                <div class="forge-checkboxes" id="check-zones">
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="zones" value="Corps complet">Corps complet</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="zones" value="Bras">Bras</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="zones" value="Poitrine">Poitrine</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="zones" value="Abdos">Abdos</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="zones" value="Dos">Dos</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="zones" value="Jambes">Jambes</label>
                </div>
              </div>
              <div class="forge-form-field">
                <label for="inp-frequence">Fréquence hebdomadaire</label>
                <select id="inp-frequence" data-profil="frequence">
                  <option value="">Choisir...</option>
                  <option value="1x">1x par semaine</option>
                  <option value="2x">2x par semaine</option>
                  <option value="3x">3x par semaine</option>
                  <option value="4x">4x par semaine</option>
                  <option value="5x+">5x ou plus</option>
                </select>
              </div>
              <div class="forge-form-field">
                <label>Équipement disponible</label>
                <div class="forge-checkboxes" id="check-equipement">
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="equipement" value="Aucun">Aucun</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="equipement" value="Barre de traction">Barre de traction</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="equipement" value="Anneaux">Anneaux</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="equipement" value="Haltères">Haltères</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="equipement" value="Élastiques">Élastiques</label>
                  <label class="forge-checkbox-label"><input type="checkbox" data-profil-arr="equipement" value="Salle de sport">Salle de sport</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Niveau -->
          <div class="forge-form-section">
            <div class="forge-form-section-title">Niveau</div>
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
              <span style="font-size:18px;font-family:'Barlow Condensed',sans-serif;font-weight:800;text-transform:uppercase;" data-profil="niveau">—</span>
              <a href="onboarding.html" style="font-size:13px;font-weight:600;text-decoration:underline;color:var(--gris-texte);">Refaire le test</a>
            </div>
          </div>

          <!-- Save -->
          <button class="forge-btn forge-btn-accent" id="btn-save" style="width:100%;padding:16px;font-size:16px;">
            SAUVEGARDER
          </button>

        </div><!-- /profil-form-area -->
      </div>
    </div>
  </main>

  <nav class="forge-bottom-nav">
    <a href="index.html">
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Accueil</span>
    </a>
    <a href="entrainement.html">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>Entraînement</span>
    </a>
    <a href="analytics.html">
      <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span>Rapport</span>
    </a>
    <a href="profil.html" class="active">
      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>Profil</span>
    </a>
  </nav>
</div>

<script>
document.addEventListener('DOMContentLoaded', function(){
  var p = JSON.parse(localStorage.getItem('sw_profil')||'{}');

  // Sidebar name
  var nameEl = document.getElementById('sidebar-name');
  var prenom = p.prenom||''; var nom = p.nom||'';
  if(nameEl && (prenom||nom)) nameEl.textContent = (prenom+' '+nom).trim();

  // Sidebar poids/taille
  var sp = document.getElementById('sidebar-poids');
  var st = document.getElementById('sidebar-taille');
  if(sp && p.poids) sp.textContent = p.poids+' kg';
  if(st && p.taille) st.textContent = p.taille+' cm';

  // IMC display
  function updateImcDisplay(){
    var poids = parseFloat(document.getElementById('inp-poids').value)||parseFloat(p.poids)||0;
    var taille = parseFloat(document.getElementById('inp-taille').value)||parseFloat(p.taille)||0;
    var imcEl = document.getElementById('inp-imc');
    if(imcEl && poids>0 && taille>0){
      imcEl.value = (poids/Math.pow(taille/100,2)).toFixed(1);
    }
  }
  updateImcDisplay();
  document.getElementById('inp-poids').addEventListener('input', updateImcDisplay);
  document.getElementById('inp-taille').addEventListener('input', updateImcDisplay);

  // Checkbox toggle visual
  document.querySelectorAll('.forge-checkbox-label').forEach(function(lbl){
    var cb = lbl.querySelector('input[type="checkbox"]');
    if(!cb) return;
    cb.addEventListener('change', function(){
      lbl.classList.toggle('checked', cb.checked);
    });
  });

  // Sauvegarder
  document.getElementById('btn-save').addEventListener('click', function(){
    p.prenom = document.getElementById('inp-prenom').value.trim();
    p.nom = document.getElementById('inp-nom').value.trim();
    p.poids = parseFloat(document.getElementById('inp-poids').value)||p.poids;
    p.taille = parseFloat(document.getElementById('inp-taille').value)||p.taille;
    p.objectif = document.getElementById('inp-objectif').value||p.objectif;
    p.frequence = document.getElementById('inp-frequence').value||p.frequence;
    // Zones
    var zones=[];
    document.querySelectorAll('#check-zones input:checked').forEach(function(cb){zones.push(cb.value);});
    if(zones.length) p.zones=zones;
    // Équipement
    var equip=[];
    document.querySelectorAll('#check-equipement input:checked').forEach(function(cb){equip.push(cb.value);});
    if(equip.length) p.equipement=equip;
    // IMC
    if(p.poids&&p.taille) p.imc=parseFloat((p.poids/Math.pow(p.taille/100,2)).toFixed(1));
    localStorage.setItem('sw_profil', JSON.stringify(p));
    // Feedback visuel
    var btn = document.getElementById('btn-save');
    var orig = btn.textContent;
    btn.textContent = 'SAUVEGARDÉ';
    btn.style.background = '#0A0A0A';
    setTimeout(function(){btn.textContent=orig;btn.style.background='';},2000);
  });
});
<\/script>
</body>
</html>`;
fs.writeFileSync('profil.html', h, 'utf8');
console.log('profil.html written, len:'+h.length);
