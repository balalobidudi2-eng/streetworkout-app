/* ========================================
   WGER-CLIENT.JS — Client API Wger via proxy Vercel
   Toutes les fonctions sont globales (pas d'ES modules)
   ======================================== */

var WGER_CACHE = new Map();

/* ── Fetch générique via proxy ── */
async function wgerFetch(endpoint, params) {
  var cacheKey = endpoint + ':' + (params || '');
  if (WGER_CACHE.has(cacheKey)) return WGER_CACHE.get(cacheKey);

  var url = '/api/wger?endpoint=' + endpoint +
    (params ? '&params=' + encodeURIComponent(params) : '');

  var response = await fetch(url);
  if (!response.ok) throw new Error('Wger proxy error: ' + response.status);

  var data = await response.json();
  WGER_CACHE.set(cacheKey, data);
  return data;
}

/* ── Catégories d'exercices ── */
async function getCategories() {
  var data = await wgerFetch('exercisecategory');
  return data.results || [];
}

/* ── Muscles ── */
async function getMuscles() {
  var data = await wgerFetch('muscle');
  return data.results || [];
}

/* ── Exercices par catégorie ──
   Catégories utiles :
   8 = Épaules, 10 = Dos, 11 = Abdos, 12 = Jambes, 13 = Poitrine, 14 = Bras */
async function getExercisesByCategory(categoryId, limit) {
  limit = limit || 20;
  var data = await wgerFetch('exerciseinfo', 'category=' + categoryId + '&limit=' + limit);
  return data.results || [];
}

/* ── Exercices par muscle ── */
async function getExercisesByMuscle(muscleId, limit) {
  limit = limit || 15;
  var data = await wgerFetch('exerciseinfo', 'muscles=' + muscleId + '&limit=' + limit);
  return data.results || [];
}

/* ── Recherche par nom ── */
async function searchExercise(term) {
  var data = await wgerFetch('exercisesearch',
    'term=' + encodeURIComponent(term) + '&language=english&format=json');
  return data.suggestions || [];
}

/* ── Infos complètes d'un exercice ── */
async function getExerciseInfo(exerciseId) {
  var data = await wgerFetch('exerciseinfo', 'id=' + exerciseId);
  return (data.results && data.results[0]) ? data.results[0] : null;
}

/* ── Mapping catégories Wger → types SW ── */
var WGER_CATEGORIES = {
  CHEST:     13,   // Poitrine → Push
  BACK:      10,   // Dos → Pull
  SHOULDERS:  8,   // Épaules → Push/Overhead
  ARMS:      14,   // Bras → Pull/Push
  LEGS:      12,   // Jambes → Legs
  ABS:       11    // Abdos → Core
};

/* ── Muscles Wger (IDs réels) ── */
var WGER_MUSCLES = {
  LATS:      12,
  BICEPS:     1,
  TRICEPS:    5,
  CHEST:      4,
  SHOULDERS:  2,
  TRAPEZIUS:  9,
  ABS:        6,
  QUADS:     10,
  GLUTES:     8
};

/* ── Pré-charger tous les exercices utiles ── */
async function preloadExercises() {
  var categories = [
    WGER_CATEGORIES.CHEST,
    WGER_CATEGORIES.BACK,
    WGER_CATEGORIES.SHOULDERS,
    WGER_CATEGORIES.ARMS,
    WGER_CATEGORIES.LEGS,
    WGER_CATEGORIES.ABS
  ];

  var results = await Promise.allSettled(
    categories.map(function(id) { return getExercisesByCategory(id, 15); })
  );

  var exerciseMap = {};
  results.forEach(function(r, i) {
    if (r.status === 'fulfilled') {
      exerciseMap[categories[i]] = r.value;
    }
  });

  return exerciseMap;
}
