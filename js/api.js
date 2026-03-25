/* ═══════════════════════════════════════════════════════
   SW_API — js/api.js
   Appels ExerciseDB + OpenAI via proxies Vercel
   ═══════════════════════════════════════════════════════ */

var SW_API = (function() {

  /* Mapping objectif → bodyParts ExerciseDB */
  var BODY_MAP = {
    'FORCE':          ['back','chest','upper arms','upper legs'],
    'ENDURANCE':      ['cardio','upper legs','waist'],
    'STREET WORKOUT': ['back','chest','upper arms','shoulders'],
    'FIGURE':         ['back','upper arms','shoulders','chest','upper legs'],
    'MAINTIEN':       ['back','chest','upper arms','upper legs','shoulders','waist'],
    'PERTE DE POIDS': ['cardio','waist','upper legs'],
    'MUSCULATION':    ['chest','back','upper arms','upper legs','shoulders']
  };

  /* Exercices de progression par skill — 3 niveaux : debutant / intermediaire / avance */
  var SKILL_EXERCISES = {
    'muscle-up': {
      debutant: [
        { nom: 'Traction explosive au sternum',         series: 4, reps: '6-8',      repos: '120 sec', conseil: 'Tire jusqu\'au sternum avec force maximale — base de la puissance' },
        { nom: 'Chest-to-bar pull-up',                  series: 4, reps: '4-6',      repos: '120 sec', conseil: 'Poitrine touche la barre — amplitude maximale indispensable' },
        { nom: 'Dips barres parallèles profonds',       series: 4, reps: '10-12',    repos: '90 sec',  conseil: 'Descends aux aisselles pour travailler la phase haute du MU' }
      ],
      intermediaire: [
        { nom: 'Muscle-up négatif',                     series: 4, reps: '4-5',      repos: '120 sec', conseil: 'Monte avec un saut, contrôle la descente lentement (4 secondes)' },
        { nom: 'Transition muscle-up élastique',        series: 3, reps: '5-6',      repos: '120 sec', conseil: 'Travaille la phase de transition critique au-dessus de la barre' },
        { nom: 'Traction explosive + demi-transition',  series: 4, reps: '5-6',      repos: '120 sec', conseil: 'Tire au sternum et simule la rotation du poignet en haut' }
      ],
      avance: [
        { nom: 'Muscle-up strict',                      series: 4, reps: '3-5',      repos: '150 sec', conseil: 'Sans élan, force pure — ajoute du lest si disponible' },
        { nom: 'Muscle-up lestés',                      series: 3, reps: '3-4',      repos: '180 sec', conseil: 'Avec gilet/ceinture pour progresser au-delà du bodyweight' },
        { nom: 'Slow muscle-up (3-3)',                  series: 3, reps: '3-4',      repos: '180 sec', conseil: '3 sec montée + 3 sec descente — contrôle total de la chaîne' }
      ]
    },
    'front-lever': {
      debutant: [
        { nom: 'Front lever tuck',                      series: 4, reps: '6-8 sec',  repos: '90 sec',  conseil: 'Genoux groupés, corps horizontal, bras tendus, épaules rétractées' },
        { nom: 'Élévations de jambes à la barre',       series: 4, reps: '8-10',     repos: '90 sec',  conseil: 'Jambes tendues, amplitude complète, contrôle la descente' },
        { nom: 'Hollow body hold',                      series: 3, reps: '30 sec',   repos: '60 sec',  conseil: 'Bas du dos plat, jambes et épaules levées — base du front lever' }
      ],
      intermediaire: [
        { nom: 'Front lever tuck avancé',               series: 4, reps: '10-12 sec',repos: '90 sec',  conseil: 'Vise 15 sec — genoux progressivement plus éloignés du torse' },
        { nom: 'Front lever one leg',                   series: 4, reps: '5-8 sec',  repos: '90 sec',  conseil: 'Une jambe tendue, l\'autre fléchie — progression vers le full' },
        { nom: 'Traction prise large prono',            series: 4, reps: '5-6',      repos: '90 sec',  conseil: 'Active les dorsaux au maximum pour soutenir le front lever' }
      ],
      avance: [
        { nom: 'Front lever complet',                   series: 4, reps: '5-10 sec', repos: '120 sec', conseil: 'Corps parfaitement horizontal, jambes tendues, bras verrouillés' },
        { nom: 'Front lever raises',                    series: 3, reps: '5-8',      repos: '120 sec', conseil: 'Montée contrôlée depuis le hang jusqu\'à la position horizontale' },
        { nom: 'Front lever lestés',                    series: 3, reps: '5-8 sec',  repos: '120 sec', conseil: 'Tenue avec gilet lesté pour surcharger la progression' }
      ]
    },
    'handstand': {
      debutant: [
        { nom: 'Handstand mur dos',                     series: 4, reps: '20-30 sec',repos: '90 sec',  conseil: 'Dos au mur, pousse dans le sol, corps aligné tête-épaules-bassin' },
        { nom: 'Pike push-up',                          series: 4, reps: '8-10',     repos: '90 sec',  conseil: 'Hanche haute, tête passe entre les bras — renforce les épaules' },
        { nom: 'Hollow body hold',                      series: 3, reps: '30 sec',   repos: '60 sec',  conseil: 'Alignement du corps — pilier de la stabilité en handstand' }
      ],
      intermediaire: [
        { nom: 'Handstand kick-up libre',               series: 4, reps: '8-10',     repos: '90 sec',  conseil: 'Monte et descends contrôlé sans mur — cherche l\'équilibre' },
        { nom: 'Handstand hold libre',                  series: 4, reps: '5-15 sec', repos: '90 sec',  conseil: 'Sans appui — vise 10 sec puis 20 sec progressivement' },
        { nom: 'Shoulder tap en planche',               series: 3, reps: '10 (5/côté)', repos: '60 sec', conseil: 'Gainage parfait, corps stable — simule le shift du handstand' }
      ],
      avance: [
        { nom: 'Free handstand 30s',                    series: 4, reps: '20-30 sec',repos: '90 sec',  conseil: 'Stabilité prolongée — alignement parfait tête-épaules-bassin-pieds' },
        { nom: 'Handstand push-up',                     series: 4, reps: '5-8',      repos: '120 sec', conseil: 'Contre mur ou libre — force épaules maximale' },
        { nom: 'Pike push-up lestés',                   series: 3, reps: '6-8',      repos: '90 sec',  conseil: 'Avec gilet lesté pour renforcer les épaules au-delà du niveau actuel' }
      ]
    },
    'planche': {
      debutant: [
        { nom: 'Lean avant pompes',                     series: 4, reps: '10-15 sec',repos: '90 sec',  conseil: 'Plus tu te penches en avant, plus la tension approche la planche' },
        { nom: 'Pseudo planche pompes',                 series: 4, reps: '6-8',      repos: '120 sec', conseil: 'Mains proches des hanches, bras tendus, penche vers l\'avant' },
        { nom: 'Protraction poussée au sol',            series: 3, reps: '30 sec',   repos: '60 sec',  conseil: 'Dos rond maximal, épaules en protraction — base de la planche' }
      ],
      intermediaire: [
        { nom: 'Planche tuck hold',                     series: 4, reps: '5-8 sec',  repos: '120 sec', conseil: 'Genoux groupés, corps horizontal, bras tendus, protraction maximale' },
        { nom: 'Pseudo planche lean progressif',        series: 4, reps: '5-6',      repos: '120 sec', conseil: 'Incline progressivement le torse vers l\'avant, bras tendus' },
        { nom: 'Planche tuck avec bande',               series: 3, reps: '8-12 sec', repos: '120 sec', conseil: 'Élastique pour réduire la charge et tenir plus longtemps' }
      ],
      avance: [
        { nom: 'Planche tuck avancée',                  series: 4, reps: '8-12 sec', repos: '150 sec', conseil: 'Genoux éloignés du torse — très proche de la planche complète' },
        { nom: 'Planche one-leg',                       series: 3, reps: '5-8 sec',  repos: '150 sec', conseil: 'Une jambe étendue, l\'autre pliée — transition vers la full planche' },
        { nom: 'Planche straight tentative',            series: 3, reps: '3-5 sec',  repos: '180 sec', conseil: 'Tente la planche complète avec ou sans bande — force max' }
      ]
    },
    'dragon-flag': {
      debutant: [
        { nom: 'Hollow body hold',                      series: 4, reps: '20-30 sec',repos: '60 sec',  conseil: 'Base du dragon flag — bas du dos plat, corps aligné' },
        { nom: 'Élévations de jambes suspendues',       series: 4, reps: '10-12',    repos: '60 sec',  conseil: 'Jambes tendues, contrôle montée/descente — compression abdo max' },
        { nom: 'L-sit genoux au sol',                   series: 3, reps: '10-12 sec',repos: '60 sec',  conseil: 'Renforce le gainage isométrique nécessaire au dragon flag' }
      ],
      intermediaire: [
        { nom: 'Dragon flag négatif',                   series: 4, reps: '4-5',      repos: '90 sec',  conseil: 'Descente contrôlée 5 sec, corps parfaitement rigide' },
        { nom: 'Dragon flag genoux fléchis',            series: 3, reps: '6-8',      repos: '90 sec',  conseil: 'Version facilitée — corps presque horizontal, genoux pliés' },
        { nom: 'Windshield wipers',                     series: 3, reps: '8-10',     repos: '60 sec',  conseil: 'Rotations latérales jambes tendues — renforce toute la chaîne du tronc' }
      ],
      avance: [
        { nom: 'Dragon flag complet',                   series: 4, reps: '5-8',      repos: '90 sec',  conseil: 'Corps parfaitement rigide, contrôle total montée et descente' },
        { nom: 'Dragon flag slow (3s down)',            series: 3, reps: '4-6',      repos: '120 sec', conseil: '3 sec descente + 3 sec montée — tension abdominale maximale' },
        { nom: 'Dragon flag tenu mi-course',            series: 3, reps: '3-5 sec',  repos: '120 sec', conseil: 'Maintien en position ouverte — renforce la zone la plus difficile' }
      ]
    },
    'l-sit': {
      debutant: [
        { nom: 'L-sit genoux fléchis au sol',           series: 4, reps: '8-10 sec', repos: '60 sec',  conseil: 'Bras tendus, pousse fort sur les paumes, lève les hanches' },
        { nom: 'L-sit une jambe',                       series: 3, reps: '5-8 sec',  repos: '60 sec',  conseil: 'Une jambe tendue, l\'autre pliée — progression naturelle' },
        { nom: 'Compression ischio assis',              series: 3, reps: '10-12',    repos: '60 sec',  conseil: 'Assis au sol, lève les jambes tendues sans les mains' }
      ],
      intermediaire: [
        { nom: 'L-sit barres parallèles',               series: 4, reps: '8-12 sec', repos: '60 sec',  conseil: 'Jambes tendues, corps droit, regard droit devant' },
        { nom: 'V-sit progressif',                      series: 3, reps: '5-8 sec',  repos: '75 sec',  conseil: 'Incline légèrement les jambes vers le haut — transition vers V-sit' },
        { nom: 'L-sit dip bar tenu',                    series: 3, reps: '10-15 sec',repos: '60 sec',  conseil: 'Maintien maximum sur dip bar — vise 15 sec progressivement' }
      ],
      avance: [
        { nom: 'V-sit complet',                         series: 4, reps: '5-8 sec',  repos: '90 sec',  conseil: 'Corps en V, jambes et torse à 45° symétrique — niveau expert' },
        { nom: 'L-sit lestés',                          series: 3, reps: '8-10 sec', repos: '90 sec',  conseil: 'Avec gilet lesté — compression et force isométrique maximales' },
        { nom: 'Press to handstand depuis L-sit',       series: 3, reps: '3-5',      repos: '120 sec', conseil: 'Transition L-sit vers handstand — force de compression exceptionnelle' }
      ]
    },
    'back-lever': {
      debutant: [
        { nom: 'German hang',                           series: 4, reps: '15-20 sec',repos: '90 sec',  conseil: 'Étirement profond des épaules indispensable — ne jamais forcer' },
        { nom: 'Skin the cat',                          series: 4, reps: '6-8',      repos: '90 sec',  conseil: 'Passage complet et contrôlé — active toute la chaîne postérieure' },
        { nom: 'Traction prise supination',             series: 3, reps: '6-8',      repos: '90 sec',  conseil: 'Paumes vers toi — renforce biceps et dorsaux pour le back lever' }
      ],
      intermediaire: [
        { nom: 'Back lever tuck',                       series: 4, reps: '5-8 sec',  repos: '90 sec',  conseil: 'Poitrine vers le bas, corps horizontal, bras tendus derrière la tête' },
        { nom: 'Inverted hang tenu',                    series: 3, reps: '15-20 sec',repos: '90 sec',  conseil: 'Tête en bas — renforce la stabilité et mobilité de l\'épaule' },
        { nom: 'Skin the cat lent (4s)',                series: 3, reps: '5-6',      repos: '90 sec',  conseil: '4 sec dans chaque direction — contrôle total du mouvement' }
      ],
      avance: [
        { nom: 'Back lever one-leg',                    series: 4, reps: '5-8 sec',  repos: '120 sec', conseil: 'Une jambe tendue — transition vers le back lever complet' },
        { nom: 'Back lever complet',                    series: 3, reps: '5-8 sec',  repos: '120 sec', conseil: 'Corps horizontal face sol, bras tendus — niveau élite' },
        { nom: 'Back lever avec montée',                series: 3, reps: '4-6',      repos: '120 sec', conseil: 'Montée progressive depuis le hang en back lever — force maximale' }
      ]
    },
    'human-flag': {
      debutant: [
        { nom: 'Gainage latéral chargé',                series: 4, reps: '30 sec',   repos: '60 sec',  conseil: 'Planche latérale avec poids — renforce la chaîne latérale' },
        { nom: 'Incliné latéral poteau 45°',            series: 3, reps: '8-10 sec', repos: '90 sec',  conseil: 'Corps à 45° en appui latéral — commence la contre-force haut/bas' },
        { nom: 'Dragon flag latéral',                   series: 3, reps: '5-8 sec',  repos: '90 sec',  conseil: 'Prépare la rigidité latérale absolue nécessaire au human flag' }
      ],
      intermediaire: [
        { nom: 'Human flag tuck',                       series: 4, reps: '3-5 sec',  repos: '120 sec', conseil: 'Bras du haut en traction, bras du bas en poussée, corps groupé' },
        { nom: 'Incliné latéral poteau 30°',            series: 3, reps: '8-10 sec', repos: '90 sec',  conseil: 'Corps semi-horizontal — progressez vers l\'horizontal' },
        { nom: 'Human flag genoux',                     series: 3, reps: '5-8 sec',  repos: '90 sec',  conseil: 'Genoux fléchis pour réduire le bras de levier — progression directe' }
      ],
      avance: [
        { nom: 'Human flag straight 5s',                series: 4, reps: '3-5 sec',  repos: '150 sec', conseil: 'Corps parfaitement horizontal, jambes tendues — force latérale pure' },
        { nom: 'Human flag négatif',                    series: 3, reps: '4-6',      repos: '120 sec', conseil: 'Descente lente 5 sec depuis la position horizontale' },
        { nom: 'Human flag hold progressif',            series: 3, reps: '8-10 sec', repos: '150 sec', conseil: 'Augmente progressivement la durée chaque semaine' }
      ]
    }
  };

  function getSkillTier(skill, testDetail, manualLevels) {
    /* Prefer manual level if user selected one */
    if (manualLevels && manualLevels[skill]) {
      var ml = manualLevels[skill];
      return ml >= 4 ? 'avance' : ml >= 3 ? 'intermediaire' : 'debutant';
    }
    var tr = testDetail && testDetail.tractions ? parseInt(testDetail.tractions) : 0;
    var dp = testDetail && testDetail.dips      ? parseInt(testDetail.dips)      : 0;
    var pm = testDetail && testDetail.pompes    ? parseInt(testDetail.pompes)    : 0;
    var gn = testDetail && testDetail.gainage   ? parseInt(testDetail.gainage)   : 0;
    switch (skill) {
      case 'muscle-up':   return tr >= 18 ? 'avance' : tr >= 10 ? 'intermediaire' : 'debutant';
      case 'front-lever': return (tr >= 15 && gn >= 60) ? 'avance' : (tr >= 8 || gn >= 30) ? 'intermediaire' : 'debutant';
      case 'handstand':   return pm >= 30 ? 'avance' : pm >= 15 ? 'intermediaire' : 'debutant';
      case 'planche':     return (tr >= 18 && dp >= 18) ? 'avance' : (tr >= 12 || dp >= 12) ? 'intermediaire' : 'debutant';
      case 'dragon-flag': return gn >= 90 ? 'avance' : gn >= 45 ? 'intermediaire' : 'debutant';
      case 'l-sit':       return gn >= 90 ? 'avance' : gn >= 30 ? 'intermediaire' : 'debutant';
      case 'back-lever':  return tr >= 15 ? 'avance' : tr >= 8  ? 'intermediaire' : 'debutant';
      case 'human-flag':  return (tr >= 20 && gn >= 90) ? 'avance' : (tr >= 12 || gn >= 45) ? 'intermediaire' : 'debutant';
      default:            return 'intermediaire';
    }
  }

  function selectSkillExercises(skills, testDetail, manualLevels) {
    var result = [];
    skills.forEach(function(skill) {
      var tier = getSkillTier(skill, testDetail || {}, manualLevels);
      var skillData = SKILL_EXERCISES[skill];
      if (!skillData) return;
      var exs = skillData[tier] || skillData['intermediaire'] || skillData['debutant'] || [];
      exs.forEach(function(ex) {
        result.push({ nom: ex.nom, series: ex.series, reps: ex.reps, repos: ex.repos, conseil: ex.conseil, skill: skill, tier: tier });
      });
    });
    return result;
  }
  /* Equipements autorisés par lieu */
  var LIEU_EQUIPEMENT = {
    'maison': ['body weight'],
    'street': ['body weight', 'barbell'],
    'salle':  null /* all */
  };

  /* ── Progressions 5 niveaux par skill ── */
  var SKILL_PROGRESSIONS = {
    'muscle-up': { label: 'Muscle-up', levels: [
      { level: 1, label: 'Traction ×5',           desc: 'Traction barre stricte, 5 r\u00e9p\u00e9titions cons\u00e9cutives' },
      { level: 2, label: 'Chest-to-bar',          desc: 'La poitrine touche la barre \u2014 amplitude maximale' },
      { level: 3, label: 'Traction explosive',    desc: 'Traction au sternum avec intention explosive' },
      { level: 4, label: 'Muscle-up n\u00e9gatif',     desc: 'Monte avec \u00e9lan, contr\u00f4le la descente en 4s' },
      { level: 5, label: 'Muscle-up strict',      desc: 'Sans \u00e9lan, force pure, hips stables' }
    ]},
    'front-lever': { label: 'Front Lever', levels: [
      { level: 1, label: 'Hollow body 30s',        desc: 'Corps gain\u00e9 allong\u00e9, bras tendus, \u00e9paules actives' },
      { level: 2, label: 'Front lever tuck',       desc: 'Genoux group\u00e9s, corps horizontal, bras tendus' },
      { level: 3, label: 'Front lever one-leg',    desc: 'Une jambe tendue, l\'autre fl\u00e9chie' },
      { level: 4, label: 'Front lever straddle',   desc: 'Jambes \u00e9cart\u00e9es, presque \u00e0 l\'horizontal' },
      { level: 5, label: 'Front lever complet',    desc: 'Corps parfaitement horizontal, jambes jointes' }
    ]},
    'handstand': { label: 'Handstand', levels: [
      { level: 1, label: 'Handstand mur 30s',      desc: 'Dos au mur, corps align\u00e9, pouss\u00e9e dans le sol' },
      { level: 2, label: 'Pike push-up ×8',        desc: 'Hanche haute, t\u00eate passe entre les bras' },
      { level: 3, label: 'Kick-up libre',          desc: 'Monte sans mur, cherche l\'\u00e9quilibre' },
      { level: 4, label: 'Free handstand 10s',     desc: 'Tenue libre \u00e0 l\'\u00e9quilibre, mains stables' },
      { level: 5, label: 'Handstand push-up',      desc: 'Flexion bras compl\u00e8te en appui renvers\u00e9' }
    ]},
    'planche': { label: 'Planche', levels: [
      { level: 1, label: 'Lean avant tenu',        desc: 'Inclin\u00e9 en avant, tension sur les \u00e9paules' },
      { level: 2, label: 'Pseudo planche pompes',  desc: 'Mains pr\u00e8s des hanches, lean avant, bras tendus' },
      { level: 3, label: 'Planche tuck 8s',        desc: 'Genoux group\u00e9s, corps horizontal, protraction max' },
      { level: 4, label: 'Planche one-leg',        desc: 'Une jambe tendue, l\'autre fl\u00e9chie, tenu 5s' },
      { level: 5, label: 'Planche straight',       desc: 'Corps parfaitement horizontal, jambes jointes' }
    ]},
    'dragon-flag': { label: 'Dragon Flag', levels: [
      { level: 1, label: 'Hollow body 30s',        desc: 'Bas du dos plat, jambes et \u00e9paules lev\u00e9es' },
      { level: 2, label: '\u00c9l\u00e9vations jambes ×10',  desc: 'Jambes tendues, amplitude compl\u00e8te \u00e0 la barre' },
      { level: 3, label: 'Dragon flag n\u00e9gatif',    desc: 'Descente contr\u00f4l\u00e9e 5s depuis la position haute' },
      { level: 4, label: 'Dragon flag fl\u00e9chi',     desc: 'Genoux pli\u00e9s, corps quasi horizontal' },
      { level: 5, label: 'Dragon flag strict',     desc: 'Corps parfaitement rigide, mont\u00e9e et descente' }
    ]},
    'l-sit': { label: 'L-Sit', levels: [
      { level: 1, label: 'L-sit genoux 10s',       desc: 'Bras tendus, hanches lev\u00e9es, genoux pli\u00e9s' },
      { level: 2, label: 'L-sit une jambe 6s',     desc: 'Une jambe tendue, l\'autre fl\u00e9chie' },
      { level: 3, label: 'L-sit barre 10s',        desc: 'Jambes tendues, corps stable, regard droit' },
      { level: 4, label: 'L-sit 15s+',             desc: 'Maintien prolong\u00e9, parfaitement horizontal' },
      { level: 5, label: 'V-sit complet',          desc: 'Jambes et torse \u00e0 45\u00b0, compression maximale' }
    ]},
    'back-lever': { label: 'Back Lever', levels: [
      { level: 1, label: 'German hang 20s',        desc: '\u00c9tirement profond des \u00e9paules, ne jamais forcer' },
      { level: 2, label: 'Skin the cat ×6',        desc: 'Passage complet et contr\u00f4l\u00e9 autour de la barre' },
      { level: 3, label: 'Back lever tuck',        desc: 'Poitrine vers le bas, corps group\u00e9, bras tendus' },
      { level: 4, label: 'Back lever one-leg',     desc: 'Une jambe tendue, contr\u00f4le total' },
      { level: 5, label: 'Back lever complet',     desc: 'Corps horizontal face sol, jambes jointes' }
    ]},
    'human-flag': { label: 'Human Flag', levels: [
      { level: 1, label: 'Gainage lat\u00e9ral 30s',    desc: 'Planche lat\u00e9rale renforc\u00e9e, corps rigide' },
      { level: 2, label: 'Inclin\u00e9 45\u00b0 poteau',     desc: 'Appui lat\u00e9ral \u00e0 45\u00b0, contre-force haut/bas' },
      { level: 3, label: 'Human flag tuck',        desc: 'Corps group\u00e9 horizontal, bras oppos\u00e9s actifs' },
      { level: 4, label: 'Human flag genoux',      desc: 'Genoux fl\u00e9chis \u00e0 l\'horizontal' },
      { level: 5, label: 'Human flag strict',      desc: 'Corps horizontal complet, jambes jointes' }
    ]}
  };

  /* Pools d'exercices de qualité par objectif × lieu (fallback intelligent) */
  var QUALITY_POOLS = {
    FORCE: {
      street: ['Tractions barre fixe','Dips barres parallèles','Tractions supination','Tractions prise large','Pompes explosives','Pompes diamant','Pike push-ups','Tractions explosives','Muscle-up négatifs','L-sit barres parallèles','Gainage','Élévations jambes barre','Squat sauté','Pistol squat progressif','Tractions australiennes'],
      salle:  ['Tractions lestées','Dips lestés','Développé couché barre','Soulevé de terre','Tirage vertical câble','Développé militaire','Rowing barre','Squat barre','Pompes lestées','Gainage lesté'],
      maison: ['Pompes déclinées','Pompes diamant','Pompes explosives','Dips entre chaises','Pike push-ups','Pompes larges','Gainage','Squats bulgares','Pistol squat progressif','Élévations jambes sol']
    },
    ENDURANCE: {
      street: ['Burpees','Tractions enchaînées','Pompes en circuit','Sauts explosifs','Box jumps','Mountain climbers','Jumping jacks'],
      salle:  ['Rowing machine','Vélo elliptique','Burpees','Corde à sauter','Tractions séries courtes'],
      maison: ['Burpees','Mountain climbers','Jumping jacks','Sauts squats','Pompes enchaînées','Gainage dynamique']
    },
    MUSCULATION: {
      street: ['Tractions barre','Dips barres','Tractions supination','Pompes larges','Pompes diamant','Pike push-ups','Tractions australiennes','Gainage','Squats sautés'],
      salle:  ['Développé couché','Tirage vertical','Rowing barre','Développé militaire','Curl biceps barre','Extensions triceps câble','Squat barre','Presse à cuisse'],
      maison: ['Tractions','Pompes larges','Pompes diamant','Dips entre chaises','Pike push-ups','Squats bulgares','Élévations jambes sol']
    },
    'STREET WORKOUT': {
      street: ['Tractions barre','Dips barres','Muscle-up négatifs','Tractions explosives','Front lever tuck','L-sit barres','Tractions supination','Pike push-ups'],
      salle:  ['Tractions','Dips lestés','Front lever tuck','L-sit barres','Muscle-up négatifs','Tractions explosives'],
      maison: ['Tractions','Pompes explosives','Dips entre chaises','Pike push-ups','Gainage','L-sit sol']
    },
    'PERTE DE POIDS': {
      street: ['Burpees','Mountain climbers','Jumping jacks','Tractions enchaînées','Pompes enchaînées','Sauts explosifs','Box jumps'],
      salle:  ['Rowing machine','Vélo elliptique','Burpees','Circuit complet','Corde à sauter'],
      maison: ['Burpees','Mountain climbers','Jumping jacks','Sauts squats','Gainage dynamique']
    },
    MAINTIEN: {
      street: ['Tractions barre','Dips barres','Pompes','Gainage','Squats','Tractions australiennes','Pike push-ups'],
      salle:  ['Tractions','Développé couché','Rowing','Squats','Gainage','Pompes'],
      maison: ['Pompes','Dips entre chaises','Squats','Gainage','Élévations jambes']
    }
  };

  /* ── Fetch exercises from ExerciseDB ── */
  async function fetchExercises(objectif, lieu) {
    try {
      var res = await fetch('/api/exercisedb?path=/exercises?limit=300');
      if (!res.ok) throw new Error('API ' + res.status);
      var all = await res.json();
      if (!Array.isArray(all)) return [];

      var parts = BODY_MAP[objectif] || BODY_MAP['MAINTIEN'];
      var allowedEquip = lieu ? LIEU_EQUIPEMENT[lieu] : null;

      var filtered = all.filter(function(ex) {
        if (parts.indexOf(ex.bodyPart) === -1) return false;
        if (allowedEquip && allowedEquip.indexOf(ex.equipment) === -1) return false;
        return true;
      });

      return filtered.map(function(ex) {
        return {
          id: ex.id,
          name: ex.name,
          bodyPart: ex.bodyPart,
          target: ex.target,
          equipment: ex.equipment,
          gifUrl: ex.gifUrl || ''
        };
      });
    } catch(e) {
      console.warn('ExerciseDB error:', e);
      return [];
    }
  }

  async function generateProgramme(profil, exercices) {
    /* Prepend lested variants only for strength-type objectives */
    var _objUp = (profil.objectif || '').toUpperCase();
    var _useLeste = _objUp === 'FORCE' || _objUp === 'MUSCULATION' || _objUp === 'STREET WORKOUT' || _objUp === 'FIGURE';
    var _lk = (profil.ceinture || 0) + (profil.gilet || 0);
    var lesteSeed = (_lk > 0 && _useLeste) ? [
      { name: 'Tractions lest\u00e9es (' + _lk + 'kg)', bodyPart: 'back',       target: 'lats'      },
      { name: 'Dips lest\u00e9s ('       + _lk + 'kg)', bodyPart: 'chest',      target: 'pectorals' },
      { name: 'Pompes lest\u00e9es ('    + _lk + 'kg)', bodyPart: 'chest',      target: 'pectorals' },
      { name: 'Tractions prise large lest\u00e9es (' + _lk + 'kg)', bodyPart: 'back', target: 'lats' },
      { name: 'Gainage lest\u00e9 ('     + _lk + 'kg)', bodyPart: 'waist',      target: 'abs'       }
    ] : [];
    var exList = lesteSeed.concat(exercices).slice(0, 65).map(function(e) {
      return e.name + ' (' + e.bodyPart + ', ' + e.target + ')';
    }).join(', ');

    /* Build skill obligations using level-aware exercise selection */
    var skillsText = '';
    var skillObligations = '';
    if (profil.skills && profil.skills.length > 0) {
      skillsText = profil.skills.join(', ');
      var tierLabels = { debutant: 'DÉBUTANT', intermediaire: 'INTERMÉDIAIRE', avance: 'AVANCÉ' };
      var skillExercisesForPrompt = selectSkillExercises(profil.skills, profil.testDetail, profil.skillLevels);
      var skillAnalysisLines = profil.skills.map(function(skill) {
        var tier = getSkillTier(skill, profil.testDetail || {}, profil.skillLevels);
        return '  \u2192 ' + skill + ' : niveau ' + (tierLabels[tier] || tier) + ' \u2014 prescrire les progressions de ce niveau';
      });
      var exObligatoires = skillExercisesForPrompt.slice(0, profil.skills.length * 2).map(function(ex) {
        return '  - [' + ex.skill.toUpperCase() + '] ' + ex.nom + ' (' + ex.series + 'x' + ex.reps + ', repos: ' + ex.repos + ')';
      });
      if (exObligatoires.length > 0) {
        skillObligations =
          '\n\ud83c\udfaf ANALYSE NIVEAUX SKILLS :\n' + skillAnalysisLines.join('\n') + '\n' +
          '\n\u26a0\ufe0f EXERCICES DE PROGRESSION OBLIGATOIRES (au moins 2 par séance) :\n' +
          exObligatoires.join('\n') + '\n';
      }
    }

    /* Build context: temps, lieu, matériel lesté */
    var dureeMin   = profil.dureeSeance || 60;
    var lieuLabel  = { salle: 'Salle de sport (machines disponibles)', street: 'Street workout (barres, anneaux, poids du corps)', maison: 'Maison (poids du corps uniquement)' }[profil.lieu] || 'Non précisé';
    var lesteText  = '';
    if (profil.ceinture > 0) lesteText += 'Ceinture lestée : ' + profil.ceinture + ' kg. ';
    if (profil.gilet    > 0) lesteText += 'Gilet lesté : '    + profil.gilet    + ' kg. ';

    /* Nombre d’exercices selon durée + structure en blocs */
    var nbExercices = dureeMin <= 30 ? 5 : dureeMin <= 60 ? 6 : dureeMin <= 90 ? 8 : 10;
    var seanceStructure = dureeMin <= 45
      ? 'Bloc unique : ' + nbExercices + ' exercices'
      : dureeMin <= 60
        ? 'Bloc 1 Skills+Force (25 min) | Bloc 2 Assistance (20 min) | Bloc 3 Core (15 min)'
        : dureeMin <= 90
          ? 'Bloc 1 Skill/Technique (20 min) | Bloc 2 Force (35 min) | Bloc 3 Accessoires (20 min) | Bloc 4 Core+Finisher (15 min)'
          : 'Bloc 1 Skill (25 min) | Bloc 2 Force (40 min) | Bloc 3 Hypertrophie (30 min) | Bloc 4 Core+Finisher (25 min)';

    /* Obligation matériel lesté (uniquement si objectif compatible) */
    var lesteObligation = '';
    if (_useLeste && (profil.ceinture > 0 || profil.gilet > 0)) {
      var lesteKg = (profil.ceinture || 0) + (profil.gilet || 0);
      lesteObligation = '\n\u26a0\ufe0f MATÉRIEL LESTÉ OBLIGATOIRE (' + lesteText.trim() + ') :\n' +
        '  \u2192 NOMMER le lest dans le nom : "Tractions lest\u00e9es (' + lesteKg + 'kg)", "Dips lest\u00e9s (' + lesteKg + 'kg)", "Pompes lest\u00e9es (' + lesteKg + 'kg)".\n' +
        '  \u2192 AU MOINS 3 exercices lest\u00e9s par s\u00e9ance.\n' +
        '  \u2192 Avec ' + lesteKg + ' kg suppl., r\u00e9duire les reps de 30\u201340% vs poids du corps seul.\n';
    }

    /* Schéma d’entraînement selon objectif */
    var objectifScheme = '';
    if ((profil.objectif || '').toUpperCase() === 'FORCE') {
      objectifScheme = '\n\ud83d\udcaa SCH\u00c9MA FORCE OBLIGATOIRE : 3\u20136 reps par s\u00e9rie, 4\u20135 s\u00e9ries, repos 2\u20133 min. Exercices compos\u00e9s lourds uniquement. INTERDIT : Russian twist, mountain climbers, jumping jacks, cardio l\u00e9ger.\n';
    } else if ((profil.objectif || '').toUpperCase() === 'ENDURANCE') {
      objectifScheme = '\n\ud83c\udfc3 SCH\u00c9MA ENDURANCE : 15\u201325 reps, 3\u20134 s\u00e9ries, repos 30\u201360 sec. Circuit training privil\u00e9gi\u00e9.\n';
    } else if ((profil.objectif || '').toUpperCase() === 'MUSCULATION') {
      objectifScheme = '\n\ud83d\udcaa SCH\u00c9MA HYPERTROPHIE : 8\u201312 reps, 3\u20134 s\u00e9ries, repos 60\u201390 sec.\n';
    }

    /* Performances mesurées pour calibrage précis de l'IA */
    var testContext = '';
    if (profil.testScore || profil.testDetail) {
      var _td = profil.testDetail || {};
      testContext = '\n\ud83e\uddea PERFORMANCES R\u00c9ELLES MESUR\u00c9ES :\n';
      if (profil.testScore)  testContext += '  Score global : ' + profil.testScore + '/100\n';
      if (_td.tractions) testContext += '  - Tractions max (60s) : ' + _td.tractions + ' reps \u2192 calibre les charges de traction\n';
      if (_td.dips)      testContext += '  - Dips max (60s) : '      + _td.dips     + ' reps \u2192 calibre les dips et pousses\n';
      if (_td.pompes)    testContext += '  - Pompes max (60s) : '    + _td.pompes   + ' reps \u2192 calibre l\u2019endurance de poussee\n';
      if (_td.gainage)   testContext += '  - Gainage max : '         + _td.gainage  + 's \u2192 calibre le core et skills isometriques\n';
      testContext += '  \u26a0\ufe0f N\u2019indique JAMAIS une charge sup\u00e9rieure aux performances mesur\u00e9es.\n';
    }

    /* Build history context */
    var historiqueText = '';
    if (profil.historique && profil.historique.length > 0) {
      historiqueText =
        '\n\ud83d\udcca Historique r\u00e9cent (adapter la difficult\u00e9 en cons\u00e9quence) :\n' +
        profil.historique.map(function(h) { return '  - ' + h; }).join('\n') + '\n';
    }

    var systemPrompt =
      'Tu es un coach de street workout expert et spécialiste en calisthenics et entraînement fonctionnel. ' +
      'RÈGLES ABSOLUES : ' +
      '(1) FILTRAGE MATÉRIEL : n’utilise JAMAIS un exercice nécessitant du matériel absent du lieu indiqué. ' +
      '(2) OBJECTIF FORCE → zéro cardio (burpees, mountain climbers, jumping jacks, sauts). Séries 3–6 reps uniquement. ' +
      '(3) NIVEAUX SKILLS : prescris exactement le niveau détaillé dans l’analyse (DÉBUTANT/INTERMÉDIAIRE/AVANCÉ). ' +
      '(4) CHARGES RÉALISTES : n’indique jamais une charge ou reps supérieure aux performances mesurées de l’utilisateur. ' +
      '(5) CHAMP skill : pour chaque exercice ciblant un skill, mets le nom du skill dans le champ "skill" (ex: "muscle-up"), sinon "null". ' +
      '(6) DURÉE : calibre séries, reps et repos pour tenir dans la durée totale indiquée. ' +      '(7) POMPES/PUSH : pour tout exercice de type pompes ou push-up lesté, n'indique JAMAIS plus de 20 kg — la limite absolue est 20 kg pour ces mouvements. ' +      'Réponds UNIQUEMENT en JSON valide, aucun texte en dehors du JSON.';

    var userPrompt =
      'Crée un programme d’entraînement personnalisé et progressif :\n\n' +
      '\ud83d\udc64 PROFIL :\n' +
      '- Objectif : ' + (profil.objectif || 'MAINTIEN') + '\n' +
      '- Niveau : ' + (profil.niveau || 'Débutant') + '\n' +
      '- Âge : ' + (profil.age || 25) + ' ans | Poids : ' + (profil.poids || 75) + ' kg | Taille : ' + (profil.taille || 175) + ' cm\n' +
      '- Fréquence : ' + (profil.frequence || 3) + ' j/semaine | Jours : ' + (profil.jours ? profil.jours.join(', ') : 'Lundi, Mercredi, Vendredi') + '\n' +
      '- Durée séance : ' + dureeMin + ' min → EXACTEMENT ' + nbExercices + ' exercices par séance (CHAQUE jour, sans exception)\n' +
      '- Structure : ' + seanceStructure + '\n' +
      '- Lieu : ' + lieuLabel + '\n' +
      (lesteText ? '- Équipement lesté : ' + lesteText + '\n' : '') +
      (skillsText ? '- \ud83c\udfaf Skills visés : ' + skillsText + '\n' : '') +
      lesteObligation +
      objectifScheme +
      testContext +
      skillObligations +
      historiqueText +
      '\n\ud83d\udccb SUGGESTIONS EXERCICES (tu peux et dois cr\u00e9er des variantes lest\u00e9es : "Tractions lest\u00e9es", "Dips lest\u00e9s", etc.) :\n' + exList + '\n\n' +
      '\u26a0\ufe0f R\u00c8GLES STRICTES :\n' +
      (profil.skills && profil.skills.length > 0
        ? '1. Chaque s\u00e9ance DOIT contenir au moins 2 exercices de progression directe pour : ' + skillsText + '\n2. INTERDIT : box jumps, lunges, calf raises sauf si li\u00e9 directement au skill\n'
        : '1. Programme adapt\u00e9 au niveau et objectif\n') +
      '3. EXACTEMENT ' + nbExercices + ' exercices par s\u00e9ance sur ' + dureeMin + ' min (TOUTES les s\u00e9ances, pas d\u2019exception)\n' +
      '   Structure : ' + seanceStructure + '\n' +
      '4. S\u00e9ries et reps : respecter STRICTEMENT le SCH\u00c9MA d\u2019objectif indiqu\u00e9 ci-dessus\n' +
      '5. Lieu "' + lieuLabel + '" : utiliser UNIQUEMENT le mat\u00e9riel disponible\n' +
      '6. Pour objectif FORCE : aucun exercice cardio l\u00e9ger\n\n' +
      'FORMAT JSON OBLIGATOIRE :\n' +
      '{\n' +
      '  "programme": [\n' +
      '    {\n' +
      '      "jour": "Lundi",\n' +
      '      "type": "Progression Muscle-up",\n' +
      '      "duree": "' + dureeMin + ' min",\n' +
      '      "exercices": [\n' +
      '        {\n' +
      '          "nom": "...",\n' +
      '          "series": 4,\n' +
      '          "reps": "5-6",\n' +
      '          "repos": "120 sec",\n' +
      '          "conseil": "..."\n' +
      '        }\n' +
      '      ]\n' +
      '    }\n' +
      '  ],\n' +
      '  "conseil_global": "..."\n' +
      '}';

    try {
      var res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4500
        })
      });

      if (!res.ok) throw new Error('OpenAI ' + res.status);
      var data = await res.json();
      var content = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content : '';

      /* Remove markdown fences if present */
      content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      return JSON.parse(content);
    } catch(e) {
      console.warn('OpenAI error:', e);
      return null;
    }
  }

  /* ── Fallback programme (no AI) ── */
  function generateFallback(profil, exercices) {
    var jours    = profil.jours || ['Lundi','Mercredi','Vendredi'];
    var freq     = jours.length;
    var skills   = profil.skills || [];
    var obj      = (profil.objectif || 'MAINTIEN').toUpperCase();
    var lieu     = profil.lieu || 'street';
    var lesteKg  = (profil.ceinture || 0) + (profil.gilet || 0);
    var dur      = profil.dureeSeance || 60;
    /* Min exercises to guarantee target duration is met */
    var perDay   = dur <= 30 ? 5 : dur <= 60 ? 6 : dur <= 90 ? 8 : 10;

    /* Parse a reps/time string into an average duration in seconds */
    function parseDuration(repsStr, series) {
      var r = String(repsStr);
      /* isometric hold: "20-30 sec", "10 sec", "5-8 sec" */
      var secMatch = r.match(/(\d+)(?:-(\d+))?\s*sec/i);
      if (secMatch) {
        var avg = secMatch[2] ? (parseInt(secMatch[1]) + parseInt(secMatch[2])) / 2 : parseInt(secMatch[1]);
        return series * avg;
      }
      /* reps range: "8-10", "4-6", "3-5" */
      var repMatch = r.match(/(\d+)(?:-(\d+))?/);
      if (repMatch) {
        var avgRep = repMatch[2] ? (parseInt(repMatch[1]) + parseInt(repMatch[2])) / 2 : parseInt(repMatch[1]);
        return series * avgRep * 4; /* ~4 sec/rep average */
      }
      return series * 10 * 3; /* fallback: 3 reps × 10s */
    }

    /* Calculate total time in seconds for a list of exercises */
    function calcSeanceTime(exList) {
      return exList.reduce(function(total, ex) {
        var repsSecs = parseDuration(ex.reps || '10', ex.series || 3);
        var reposSecs = parseInt((ex.repos || '90 sec').replace(/[^0-9]/g, '')) || 90;
        var reposTimes = Math.max(0, (ex.series || 3) - 1);
        return total + repsSecs + reposSecs * reposTimes;
      }, 0);
    }

    function formatEstTime(ex) {
      var secs = parseDuration(ex.reps || '10', ex.series || 3) +
        (parseInt((ex.repos || '90 sec').replace(/[^0-9]/g,'')) || 90) * Math.max(0, (ex.series || 3) - 1);
      var m = Math.round(secs / 60); return (m < 1 ? 1 : m) + ' min';
    }
    var isForce     = obj === 'FORCE';
    var isEndurance = obj === 'ENDURANCE';

    /* Build mandatory skill exercises at the right progression level */
    var skillExs = selectSkillExercises(skills, profil.testDetail, profil.skillLevels);

    /* Add leste suffix to compound exercises */
    var lesteKeys = ['traction','dip','pompe','pull','chin','gainage','squat','fente','pistol','rows'];
    function applyLeste(nom) {
      var useLesteHere = obj === 'FORCE' || obj === 'MUSCULATION' || obj === 'STREET WORKOUT' || obj === 'FIGURE';
      if (lesteKg <= 0 || !useLesteHere) return nom;
      var low = nom.toLowerCase();
      return lesteKeys.some(function(k) { return low.indexOf(k) !== -1; })
        ? nom + ' (' + lesteKg + 'kg)' : nom;
    }

    /* Rep / set scheme per objectif */
    function scheme() {
      if (isForce)     return { s: 4 + Math.floor(Math.random()*2), r: ['3-5','4-6','5-6'][~~(Math.random()*3)],      p: ['120 sec','150 sec','180 sec'][~~(Math.random()*3)] };
      if (isEndurance) return { s: 3,                               r: ['15-20','20-25','12-15'][~~(Math.random()*3)], p: ['30 sec','45 sec','60 sec'][~~(Math.random()*3)]   };
                       return { s: 3 + Math.floor(Math.random()*2), r: ['8-10','10-12','12-15','6-8'][~~(Math.random()*4)], p: ['60 sec','90 sec','120 sec'][~~(Math.random()*3)] };
    }

    /* Build name pool: quality pool first, then ExerciseDB extras */
    var qPool = (QUALITY_POOLS[obj] && QUALITY_POOLS[obj][lieu])
      ? QUALITY_POOLS[obj][lieu].slice()
      : (QUALITY_POOLS[obj] && QUALITY_POOLS[obj]['street'] ? QUALITY_POOLS[obj]['street'].slice() : []);
    var usedLow = qPool.map(function(n) { return n.toLowerCase(); });
    exercices.forEach(function(e) {
      var n = e.name || e.nom || '';
      if (n && usedLow.indexOf(n.toLowerCase()) === -1) { qPool.push(n); usedLow.push(n.toLowerCase()); }
    });
    if (qPool.length === 0) qPool = ['Tractions','Dips','Pompes','Gainage','Squat sauté','Pike push-ups'];

    /* Shuffle */
    for (var i = qPool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = qPool[i]; qPool[i] = qPool[j]; qPool[j] = tmp;
    }

    /* Day type labels */
    var DTYPES = {
      FORCE:           ['Force Haut du corps','Force Bas du corps','Force Full Body','Force Explosif'],
      ENDURANCE:       ['Endurance Circuit','HIIT','Cardio Force','Circuit Full Body'],
      MUSCULATION:     ['Hypertrophie Haut','Hypertrophie Bas','Full Body','Épaules & Bras'],
      'STREET WORKOUT':['Skills & Force','Explosif','Technique','Full Body'],
      'PERTE DE POIDS':['HIIT','Circuit cardio','Force & Cardio','Cardio'],
      MAINTIEN:        ['Full Body','Haut du corps','Bas du corps','Core & Mobilité']
    };
    var dayTypes = skills.length > 0
      ? ['Progression ' + skills[0],'Force & Skills','Calisthenics avancé','Full Body']
      : (DTYPES[obj] || ['Séance 1','Séance 2','Séance 3','Séance 4']);

    var targetSecs = dur * 60;
    var slackSecs  = 5 * 60; /* ±5 min tolerance */

    var programme = [];
    for (var d = 0; d < freq; d++) {
      var dayExs = [];
      /* Rotate skill exercises per day so each session has different ones */
      if (skillExs.length > 0) {
        var sk = (d * 2) % skillExs.length;
        for (var s2 = 0; s2 < 2 && dayExs.length < perDay; s2++) {
          var _sx = Object.assign({}, skillExs[(sk + s2) % skillExs.length]);
                _sx.temps_estime = formatEstTime(_sx);
                dayExs.push(_sx);
        }
      }
      /* Fill with pool exercises — each day gets its own offset for variety */
      var dayPoolStart = d * perDay;
      var pidx = dayPoolStart % Math.max(qPool.length, 1);
      while (dayExs.length < perDay) {
        var sc = scheme();
        var _qx = { nom: applyLeste(qPool[pidx % qPool.length]), series: sc.s, reps: sc.r, repos: sc.p, conseil: '' };
                _qx.temps_estime = formatEstTime(_qx);
                dayExs.push(_qx);
        pidx++;
      }
      /* Time-adjust: add or trim until within target ±5 min */
      var elapsed = calcSeanceTime(dayExs);
      /* If under target, add more exercises */
      var extra = (dayPoolStart + perDay) % Math.max(qPool.length, 1);
      while (elapsed < targetSecs - slackSecs && qPool.length > 0) {
        var sc2 = scheme();
        var ex2 = { nom: applyLeste(qPool[extra % qPool.length]), series: sc2.s, reps: sc2.r, repos: sc2.p, conseil: '' };
                ex2.temps_estime = formatEstTime(ex2);
        dayExs.push(ex2);
        elapsed += calcSeanceTime([ex2]);
        extra++;
      }
      /* If over target, trim last exercises (but keep minimum 4) */
      while (elapsed > targetSecs + slackSecs && dayExs.length > 5) {
        var removed = dayExs.pop();
        elapsed -= calcSeanceTime([removed]);
      }
      programme.push({ jour: jours[d], type: dayTypes[d % dayTypes.length], duree: '~' + dur + ' min', exercices: dayExs });
    }

    var conseil = isForce
      ? 'Programme force : charges maximales sur 3-5 reps. Repos complets 2-3 min entre séries. Progressez de 5% par semaine.'
      : skills.length > 0
        ? 'Programme axé sur la progression vers : ' + skills.join(', ') + '. Régularité et patience !'
        : 'Programme adapté à votre profil. Ajustez les charges selon vos sensations.';

    return { programme: programme, conseil_global: conseil };
  }

  return {
    fetchExercises: fetchExercises,
    generateProgramme: generateProgramme,
    generateFallback: generateFallback,
    SKILL_PROGRESSIONS: SKILL_PROGRESSIONS,
    getSkillTier: getSkillTier,
    QUALITY_POOLS: QUALITY_POOLS
  };

})();
