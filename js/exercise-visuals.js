/* ========================================
   EXERCISE-VISUALS.JS — SVG Illustrations
   Silhouettes stylisées — zéro dépendance externe
   ======================================== */

var EXERCISE_VISUALS = {

  tractions: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="20" y="30" width="160" height="6" rx="3" fill="#00FF87" opacity="0.9"/>' +
      '<circle cx="65" cy="33" r="7" fill="#00FF87" opacity="0.7"/>' +
      '<circle cx="135" cy="33" r="7" fill="#00FF87" opacity="0.7"/>' +
      '<line x1="65" y1="40" x2="70" y2="65" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="135" y1="40" x2="130" y2="65" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="100" cy="72" r="12" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="100" y1="84" x2="100" y2="130" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="70" y1="65" x2="88" y2="95" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="130" y1="65" x2="112" y2="95" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="130" x2="88" y2="170" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="130" x2="112" y2="170" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#00FF87" font-size="11" font-family="Inter,sans-serif" font-weight="600">TRACTION</text>' +
      '</svg>',
    color: '#00FF87'
  },

  dips: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="30" y="70" width="8" height="80" rx="4" fill="#A0A0B8" opacity="0.6"/>' +
      '<rect x="162" y="70" width="8" height="80" rx="4" fill="#A0A0B8" opacity="0.6"/>' +
      '<rect x="25" y="65" width="50" height="8" rx="4" fill="#00FF87" opacity="0.9"/>' +
      '<rect x="125" y="65" width="50" height="8" rx="4" fill="#00FF87" opacity="0.9"/>' +
      '<circle cx="100" cy="55" r="12" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="100" y1="67" x2="100" y2="110" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="55" y1="69" x2="88" y2="90" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="145" y1="69" x2="112" y2="90" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="110" x2="85" y2="145" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="85" y1="145" x2="90" y2="170" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="100" y1="110" x2="115" y2="145" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="115" y1="145" x2="110" y2="170" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#00FF87" font-size="11" font-family="Inter,sans-serif" font-weight="600">DIPS</text>' +
      '</svg>',
    color: '#00FF87'
  },

  pompes: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="10" y="155" width="180" height="4" rx="2" fill="#A0A0B8" opacity="0.3"/>' +
      '<circle cx="155" cy="105" r="11" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="144" y1="110" x2="55" y2="125" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="144" y1="113" x2="138" y2="138" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="138" y1="138" x2="145" y2="153" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="95" y1="122" x2="89" y2="147" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="89" y1="147" x2="96" y2="155" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="55" y1="125" x2="45" y2="153" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="55" y1="125" x2="38" y2="150" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#00FF87" font-size="11" font-family="Inter,sans-serif" font-weight="600">POMPES</text>' +
      '</svg>',
    color: '#00FF87'
  },

  squat: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="10" y="175" width="180" height="4" rx="2" fill="#A0A0B8" opacity="0.3"/>' +
      '<circle cx="100" cy="50" r="12" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="100" y1="62" x2="95" y2="110" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="98" y1="80" x2="60" y2="90" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="98" y1="80" x2="140" y2="90" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="95" cy="112" r="5" fill="#00FF87" opacity="0.8"/>' +
      '<line x1="95" y1="115" x2="70" y2="148" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="70" y1="148" x2="65" y2="175" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="95" y1="115" x2="120" y2="148" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="120" y1="148" x2="125" y2="175" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<text x="100" y="198" text-anchor="middle" fill="#00FF87" font-size="11" font-family="Inter,sans-serif" font-weight="600">SQUAT</text>' +
      '</svg>',
    color: '#00FF87'
  },

  muscle_up: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="20" y="25" width="160" height="6" rx="3" fill="#FF6B35" opacity="0.9"/>' +
      '<circle cx="100" cy="45" r="11" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="100" y1="56" x2="100" y2="95" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="75" y1="28" x2="88" y2="70" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="125" y1="28" x2="112" y2="70" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="75" cy="28" r="6" fill="#FF6B35" opacity="0.7"/>' +
      '<circle cx="125" cy="28" r="6" fill="#FF6B35" opacity="0.7"/>' +
      '<line x1="100" y1="95" x2="88" y2="140" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="95" x2="112" y2="140" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M160 80 L160 50 M155 55 L160 50 L165 55" stroke="#FF6B35" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#FF6B35" font-size="11" font-family="Inter,sans-serif" font-weight="600">MUSCLE-UP</text>' +
      '</svg>',
    color: '#FF6B35'
  },

  front_lever: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="85" y="20" width="30" height="6" rx="3" fill="#00B4FF" opacity="0.9"/>' +
      '<circle cx="100" cy="50" r="11" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="100" y1="26" x2="100" y2="61" stroke="#00B4FF" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="75" x2="40" y2="75" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="100" y1="65" x2="100" y2="80" stroke="#E0E0E0" stroke-width="3"/>' +
      '<line x1="40" y1="75" x2="15" y2="75" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="10" y1="75" x2="180" y2="75" stroke="#00B4FF" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#00B4FF" font-size="11" font-family="Inter,sans-serif" font-weight="600">FRONT LEVER</text>' +
      '</svg>',
    color: '#00B4FF'
  },

  handstand: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="60" y="15" width="80" height="4" rx="2" fill="#A0A0B8" opacity="0.4"/>' +
      '<circle cx="85" cy="22" r="7" fill="#00FF87" opacity="0.8"/>' +
      '<circle cx="115" cy="22" r="7" fill="#00FF87" opacity="0.8"/>' +
      '<line x1="85" y1="29" x2="90" y2="55" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="115" y1="29" x2="110" y2="55" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="90" y1="55" x2="110" y2="55" stroke="#E0E0E0" stroke-width="3"/>' +
      '<line x1="100" y1="55" x2="100" y2="110" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="100" y1="110" x2="100" y2="145" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="100" y1="145" x2="95" y2="175" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="145" x2="105" y2="175" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="100" cy="115" r="10" fill="none" stroke="#E0E0E0" stroke-width="2"/>' +
      '<text x="100" y="198" text-anchor="middle" fill="#00FF87" font-size="11" font-family="Inter,sans-serif" font-weight="600">HANDSTAND</text>' +
      '</svg>',
    color: '#00FF87'
  },

  l_sit: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="40" y="100" width="120" height="6" rx="3" fill="#00B4FF" opacity="0.8"/>' +
      '<rect x="40" y="95" width="8" height="35" rx="3" fill="#A0A0B8" opacity="0.5"/>' +
      '<rect x="152" y="95" width="8" height="35" rx="3" fill="#A0A0B8" opacity="0.5"/>' +
      '<circle cx="100" cy="72" r="11" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="100" y1="83" x2="100" y2="102" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="55" y1="100" x2="88" y2="100" stroke="#00B4FF" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="145" y1="100" x2="112" y2="100" stroke="#00B4FF" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="100" y1="102" x2="165" y2="102" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="165" y1="102" x2="172" y2="98" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M110 108 L110 102 L116 102" fill="none" stroke="#00B4FF" stroke-width="1.5" opacity="0.7"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#00B4FF" font-size="11" font-family="Inter,sans-serif" font-weight="600">L-SIT</text>' +
      '</svg>',
    color: '#00B4FF'
  },

  planche: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="60" y="130" width="80" height="6" rx="3" fill="#A0A0B8" opacity="0.3"/>' +
      '<circle cx="80" cy="132" r="7" fill="#00FF87" opacity="0.8"/>' +
      '<circle cx="120" cy="132" r="7" fill="#00FF87" opacity="0.8"/>' +
      '<line x1="80" y1="125" x2="78" y2="95" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="120" y1="125" x2="122" y2="95" stroke="#00FF87" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="80" y1="95" x2="120" y2="95" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="80" y1="95" x2="35" y2="90" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="120" y1="95" x2="165" y2="92" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="130" cy="88" r="10" fill="none" stroke="#E0E0E0" stroke-width="2"/>' +
      '<line x1="20" y1="92" x2="180" y2="92" stroke="#00FF87" stroke-width="1" stroke-dasharray="4,4" opacity="0.25"/>' +
      '<text x="100" y="165" text-anchor="middle" fill="#00FF87" font-size="11" font-family="Inter,sans-serif" font-weight="600">PLANCHE</text>' +
      '</svg>',
    color: '#00FF87'
  },

  human_flag: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="30" y="10" width="8" height="180" rx="4" fill="#A0A0B8" opacity="0.6"/>' +
      '<circle cx="95" cy="90" r="11" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="84" y1="93" x2="38" y2="95" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="84" y1="93" x2="165" y2="88" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="38" y1="95" x2="38" y2="60" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="38" y1="95" x2="38" y2="130" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="38" cy="60" r="6" fill="#FF6B35" opacity="0.8"/>' +
      '<circle cx="38" cy="130" r="6" fill="#FF6B35" opacity="0.8"/>' +
      '<line x1="20" y1="92" x2="180" y2="92" stroke="#FF6B35" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/>' +
      '<text x="105" y="195" text-anchor="middle" fill="#FF6B35" font-size="11" font-family="Inter,sans-serif" font-weight="600">HUMAN FLAG</text>' +
      '</svg>',
    color: '#FF6B35'
  },

  back_lever: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="85" y="20" width="30" height="6" rx="3" fill="#00B4FF" opacity="0.9"/>' +
      '<line x1="100" y1="26" x2="100" y2="55" stroke="#00B4FF" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="100" cy="65" r="11" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="100" y1="76" x2="100" y2="115" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="100" y1="115" x2="165" y2="115" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="165" y1="115" x2="172" y2="111" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="20" y1="115" x2="180" y2="115" stroke="#00B4FF" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#00B4FF" font-size="11" font-family="Inter,sans-serif" font-weight="600">BACK LEVER</text>' +
      '</svg>',
    color: '#00B4FF'
  },

  dragon_flag: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="10" y="130" width="90" height="8" rx="4" fill="#A0A0B8" opacity="0.4"/>' +
      '<circle cx="30" cy="115" r="11" fill="none" stroke="#E0E0E0" stroke-width="2.5"/>' +
      '<line x1="18" y1="120" x2="15" y2="135" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="42" y1="120" x2="45" y2="135" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="30" y1="104" x2="170" y2="95" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="170" y1="95" x2="182" y2="88" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="20" y1="100" x2="185" y2="100" stroke="#FF6B35" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/>' +
      '<text x="100" y="175" text-anchor="middle" fill="#FF6B35" font-size="11" font-family="Inter,sans-serif" font-weight="600">DRAGON FLAG</text>' +
      '</svg>',
    color: '#FF6B35'
  },

  hspu: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="160" y="10" width="8" height="185" rx="2" fill="#A0A0B8" opacity="0.3"/>' +
      '<rect x="50" y="15" width="110" height="4" rx="2" fill="#A0A0B8" opacity="0.4"/>' +
      '<circle cx="80" cy="22" r="7" fill="#00FF87" opacity="0.8"/>' +
      '<circle cx="120" cy="22" r="7" fill="#00FF87" opacity="0.8"/>' +
      '<line x1="80" y1="29" x2="85" y2="55" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="120" y1="29" x2="115" y2="55" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="100" cy="62" r="11" fill="none" stroke="#00FF87" stroke-width="2"/>' +
      '<line x1="100" y1="73" x2="100" y2="130" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="100" y1="130" x2="158" y2="125" stroke="#E0E0E0" stroke-width="2.5" stroke-linecap="round"/>' +
      '<text x="100" y="195" text-anchor="middle" fill="#00FF87" font-size="11" font-family="Inter,sans-serif" font-weight="600">HSPU</text>' +
      '</svg>',
    color: '#00FF87'
  },

  repos: {
    svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="100" cy="85" r="45" fill="none" stroke="#A0A0B8" stroke-width="2" opacity="0.4"/>' +
      '<text x="100" y="78" text-anchor="middle" fill="#A0A0B8" font-size="32" font-family="Inter,sans-serif">&#9646;&#9646;</text>' +
      '<text x="100" y="140" text-anchor="middle" fill="#A0A0B8" font-size="13" font-family="Inter,sans-serif">REPOS</text>' +
      '</svg>',
    color: '#A0A0B8'
  }
};

/* Récupérer le SVG d'un exercice par nom */
function getExerciseVisual(exerciseId) {
  var key = (exerciseId || '')
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/à/g, 'a')
    .replace(/ /g, '_');

  return EXERCISE_VISUALS[key] || EXERCISE_VISUALS['tractions'];
}

/* Injecter un visuel dans un container DOM */
function renderVisual(containerId, exerciseId, size) {
  size = size || 120;
  var container = document.getElementById(containerId);
  if (!container) return;
  var visual = getExerciseVisual(exerciseId);
  container.innerHTML = visual.svg;
  container.style.width = size + 'px';
  container.style.height = size + 'px';
}

/* Mapping nom d'exercice → clé visuel */
function resolveExerciseId(nom) {
  var n = (nom || '').toLowerCase();
  if (n.includes('traction') || n.includes('pull-up') || n.includes('pullup')) return 'tractions';
  if (n.includes('dip')) return 'dips';
  if (n.includes('pompe') || n.includes('push-up') || n.includes('pushup')) return 'pompes';
  if (n.includes('squat')) return 'squat';
  if (n.includes('muscle-up') || n.includes('muscle up') || n.includes('muscleup')) return 'muscle_up';
  if (n.includes('front lever') || n.includes('frontlever')) return 'front_lever';
  if (n.includes('back lever') || n.includes('backlever')) return 'back_lever';
  if (n.includes('handstand') || n.includes('hspu')) return 'handstand';
  if (n.includes('l-sit') || n.includes('lsit') || n.includes('l sit')) return 'l_sit';
  if (n.includes('planche')) return 'planche';
  if (n.includes('human flag') || n.includes('humanflag')) return 'human_flag';
  if (n.includes('dragon flag') || n.includes('dragonflag')) return 'dragon_flag';
  if (n.includes('repos') || n.includes('rest')) return 'repos';
  return n.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}
