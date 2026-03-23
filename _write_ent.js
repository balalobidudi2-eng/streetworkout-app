const fs = require('fs');
const h = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FORGE — Entraînement</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/forge.css">
  <style>
    .week-row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px;}
    .week-row::-webkit-scrollbar{display:none}
    .day-item{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 12px;border-radius:10px;background:var(--gris-clair);min-width:44px;}
    .day-item.today{background:var(--noir);color:#fff;}
    .day-item.done .day-num{position:relative;}
    .day-item.done .day-num::after{content:'';display:block;width:6px;height:6px;background:#C8FF00;border-radius:50%;margin:2px auto 0;}
    .day-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--gris-texte);}
    .day-item.today .day-label{color:rgba(255,255,255,.6);}
    .day-num{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:18px;color:var(--noir);}
    .day-item.today .day-num{color:#fff;}
    .motivation-card{display:flex;align-items:center;gap:12px;background:var(--gris-clair);border-radius:12px;padding:16px;margin-top:16px;}
    .motivation-card svg{flex-shrink:0;width:28px;height:28px;stroke:var(--noir);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    .motivation-card span{font-size:14px;font-weight:500;color:var(--noir);}
    .exercise-list{display:flex;flex-direction:column;gap:10px;}
    .exercise-item{display:flex;align-items:center;gap:14px;padding:14px;background:#fff;border:1px solid var(--gris-moyen);border-radius:12px;cursor:pointer;transition:border-color .18s ease,box-shadow .18s ease;}
    .exercise-item:hover{border-color:var(--noir);box-shadow:0 2px 10px rgba(0,0,0,.07);}
    .exercise-thumb{width:70px;height:70px;border-radius:8px;object-fit:cover;background:var(--gris-clair);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .exercise-info h3{font-size:15px;font-weight:700;color:var(--noir);margin-bottom:2px;}
    .exercise-info p{font-size:12px;color:var(--gris-texte);}
    .search-bar{display:flex;align-items:center;gap:10px;background:var(--gris-clair);border-radius:12px;padding:12px 16px;margin-bottom:24px;}
    .search-bar svg{flex-shrink:0;stroke:var(--gris-texte);fill:none;width:18px;height:18px;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    .search-bar input{border:none;background:transparent;font-size:15px;color:var(--noir);outline:none;width:100%;}
    .search-bar input::placeholder{color:var(--gris-texte);}
    .week-counter{font-size:13px;font-weight:600;color:var(--gris-texte);}
  </style>
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
        <a href="entrainement.html" class="active">Entraînement</a>
        <a href="progression.html">Découvrir</a>
        <a href="analytics.html">Rapport</a>
        <a href="profil.html">Profil</a>
      </nav>
      <div class="forge-header-user">
        <span class="forge-user-name" data-profil="prenom"></span>
        <div class="forge-avatar" id="header-avatar">U</div>
      </div>
    </div>
  </header>

  <main style="padding:32px 0 40px;">
    <div class="forge-container">

      <div class="search-bar">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="searchInput" placeholder="Rechercher un exercice ou un programme..." autocomplete="off">
      </div>

      <section style="margin-bottom:40px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <h2 class="forge-section-title" style="margin-bottom:0;">Objectif hebdomadaire</h2>
          <span class="week-counter" id="weeklyCounter">0/3</span>
        </div>
        <div class="week-row" id="weekRow"></div>
        <div class="motivation-card">
          <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span id="motivationText">Pour te reconstruire, le meilleur moment est MAINTENANT !</span>
        </div>
      </section>

      <section style="margin-bottom:40px;">
        <h2 class="forge-section-title">Défis</h2>
        <div class="forge-defi-grid">
          <div class="forge-defi-card">
            <div class="img-placeholder" style="position:absolute;inset:0;border-radius:0;border:none;opacity:.35;min-height:0;"></div>
            <div class="forge-defi-content">
              <div class="forge-defi-duration">28 JOURS</div>
              <div class="forge-defi-title">Corps entier</div>
              <button class="forge-btn forge-btn-outline">DÉBUT</button>
            </div>
          </div>
          <div class="forge-defi-card">
            <div class="img-placeholder" style="position:absolute;inset:0;border-radius:0;border:none;opacity:.35;min-height:0;"></div>
            <div class="forge-defi-content">
              <div class="forge-defi-duration">14 JOURS</div>
              <div class="forge-defi-title">Brûle la graisse</div>
              <button class="forge-btn forge-btn-outline">DÉBUT</button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="forge-section-title">Exercices ciblés</h2>
        <div class="forge-pills" id="pillsRow">
          <button class="forge-pill active" data-part="waist">Abdos</button>
          <button class="forge-pill" data-part="upper arms">Bras</button>
          <button class="forge-pill" data-part="chest">Poitrine</button>
          <button class="forge-pill" data-part="upper legs">Jambes</button>
          <button class="forge-pill" data-part="back">Épaules et dos</button>
        </div>
        <div class="exercise-list" id="exerciseList">
          <p style="padding:24px;color:var(--gris-texte);text-align:center;">Chargement...</p>
        </div>
      </section>

    </div>
  </main>

  <nav class="forge-bottom-nav">
    <a href="index.html">
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Accueil</span>
    </a>
    <a href="entrainement.html" class="active">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>Entraînement</span>
    </a>
    <a href="analytics.html">
      <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span>Rapport</span>
    </a>
    <a href="profil.html">
      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>Profil</span>
    </a>
  </nav>
</div>

<script src="js/storage.js"><\/script>
<script src="js/exercisedb-api.js"><\/script>
<script>
(function buildWeek(){
  var row=document.getElementById('weekRow');
  if(!row) return;
  var today=new Date();
  var sw=new Date(today); sw.setDate(today.getDate()-((today.getDay()+6)%7));
  var labels=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  var seances=JSON.parse(localStorage.getItem('sw_seances')||'[]');
  var allDates=new Set(); seances.forEach(function(s){if(s.date)allDates.add(s.date.substring(0,10));});
  var html='',done=0;
  for(var i=0;i<7;i++){
    var d=new Date(sw); d.setDate(sw.getDate()+i);
    var ds=d.toISOString().slice(0,10);
    var isT=d.toDateString()===today.toDateString();
    var isDone=allDates.has(ds); if(isDone) done++;
    html+='<div class="day-item'+(isT?' today':'')+(isDone?' done':'')+'"><div class="day-label">'+labels[i]+'</div><div class="day-num">'+d.getDate()+'</div></div>';
  }
  row.innerHTML=html;
  var p2=JSON.parse(localStorage.getItem('sw_profil')||'{}');
  var freq=parseInt((p2.frequence||'3x').replace(/[^0-9]/g,''))||3;
  var counter=document.getElementById('weeklyCounter'); if(counter) counter.textContent=done+'/'+freq;
  var prenom=p2.prenom||''; var mt=document.getElementById('motivationText');
  if(mt&&prenom) mt.textContent='Salut '+prenom+' ! Continue comme ca !';
})();

var FALLBACK={'waist':[{nom:'Crunch',muscles:'Abdominaux'},{nom:'Planche',muscles:'Core complet'},{nom:'Mountain Climber',muscles:'Core, cardio'},{nom:'Relevé de jambes',muscles:'Abdos inférieurs'}],'upper arms':[{nom:'Curl biceps',muscles:'Biceps'},{nom:'Dips (chaise)',muscles:'Triceps'},{nom:'Extension triceps',muscles:'Triceps'}],'chest':[{nom:'Pompes',muscles:'Pectoraux'},{nom:'Pompes diamant',muscles:'Pectoraux, triceps'},{nom:'Pompes inclinées',muscles:'Pectoraux supérieurs'}],'upper legs':[{nom:'Squats',muscles:'Quadriceps'},{nom:'Fentes avant',muscles:'Quadriceps'},{nom:'Pistol squat',muscles:'Équilibre'}],'back':[{nom:'Tractions',muscles:'Dorsaux, biceps'},{nom:'Superman',muscles:'Lombaires'},{nom:'Rowing au sol',muscles:'Dos moyen'}]};
var _cur='waist',_ready=false;
function render(part){
  var list=document.getElementById('exerciseList'); if(!list) return;
  var exs=[];
  if(_ready&&typeof EXERCISEDB_API!=='undefined'&&EXERCISEDB_API.isReady())
    exs=part==='back'?EXERCISEDB_API.getByBodyPart('back').concat(EXERCISEDB_API.getByBodyPart('shoulders')).slice(0,10):EXERCISEDB_API.getByBodyPart(part).slice(0,12);
  if(!exs.length) exs=(FALLBACK[part]||[]).map(function(f){return{nom:f.nom,muscles:[f.muscles],gif:null};});
  if(!exs.length){list.innerHTML='<p style="padding:20px;color:var(--gris-texte);text-align:center;">Aucun exercice</p>';return;}
  list.innerHTML=exs.map(function(ex){
    var th=ex.gif?'<img class="exercise-thumb" src="'+ex.gif+'" alt="" loading="lazy">':'<div class="exercise-thumb"></div>';
    var m=Array.isArray(ex.muscles)?ex.muscles.slice(0,2).join(', '):(ex.muscles||'');
    var n=ex.nom?ex.nom.charAt(0).toUpperCase()+ex.nom.slice(1):'';
    return '<div class="exercise-item">'+th+'<div class="exercise-info"><h3>'+n+'</h3><p>'+m+'</p></div></div>';
  }).join('');
}
var pr=document.getElementById('pillsRow');
if(pr) pr.addEventListener('click',function(e){var b=e.target.closest('.forge-pill');if(!b)return;pr.querySelectorAll('.forge-pill').forEach(function(x){x.classList.remove('active');});b.classList.add('active');_cur=b.dataset.part;render(_cur);});
var si=document.getElementById('searchInput');
if(si) si.addEventListener('input',function(){
  var q=this.value.trim().toLowerCase(); if(!q){render(_cur);return;}
  var pool=Object.values(FALLBACK).reduce(function(a,b){return a.concat(b.map(function(f){return{nom:f.nom,muscles:[f.muscles],gif:null};}));} ,[]);
  var filtered=pool.filter(function(ex){var m=Array.isArray(ex.muscles)?ex.muscles.join(' '):(ex.muscles||'');return ex.nom.toLowerCase().indexOf(q)!==-1||m.toLowerCase().indexOf(q)!==-1;}).slice(0,15);
  var list=document.getElementById('exerciseList'); if(!list) return;
  if(!filtered.length){list.innerHTML='<p style="padding:20px;color:var(--gris-texte);text-align:center;">Aucun résultat</p>';return;}
  list.innerHTML=filtered.map(function(ex){var th=ex.gif?'<img class="exercise-thumb" src="'+ex.gif+'" loading="lazy">':'<div class="exercise-thumb"></div>';var m=Array.isArray(ex.muscles)?ex.muscles.slice(0,2).join(', '):(ex.muscles||'');var n=ex.nom?ex.nom.charAt(0).toUpperCase()+ex.nom.slice(1):'';return '<div class="exercise-item">'+th+'<div class="exercise-info"><h3>'+n+'</h3><p>'+m+'</p></div></div>';}).join('');
});
document.addEventListener('DOMContentLoaded',function(){
  render(_cur);
  if(typeof EXERCISEDB_API!=='undefined') EXERCISEDB_API.init().then(function(ok){if(ok){_ready=true;render(_cur);}}).catch(function(){});
});
<\/script>
</body>
</html>`;
fs.writeFileSync('entrainement.html', h, 'utf8');
console.log('entrainement.html written, len:'+h.length);
