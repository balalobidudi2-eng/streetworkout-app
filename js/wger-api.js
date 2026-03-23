/* ========================================
   WGER-API.JS — Wger.de API Integration
   Free API (no key needed)
   ======================================== */

var WGER_API = {
  baseUrl: 'https://wger.de/api/v2',
  timeout: 5000,
  cache: {},
  cacheExpiry: 3600000, /* 1 hour */

  /**
   * Fetch exercises from Wger
   * @param {string} language - Language code (fr, en, de)
   * @returns {Promise<Array>}
   */
  async getExercises(language = 'fr') {
    var cacheKey = 'wger_exercises_' + language;
    var now = Date.now();

    /* Return cached if valid */
    if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.cacheExpiry) {
      console.log('WGER: Using cached exercises');
      return this.cache[cacheKey].data;
    }

    try {
      var url = this.baseUrl + '/exercise/?language=' + language + '&limit=100';
      var response = await fetch(url, { timeout: this.timeout });

      if (!response.ok) throw new Error('Wger API error: ' + response.status);

      var data = await response.json();
      var exercises = (data.results || []).map(function(ex) {
        return {
          id: 'wger_' + ex.id,
          nom: ex.name,
          description: ex.description || '',
          category: _mapWgerCategory(ex.category),
          muscles: _mapWgerMuscles(ex.muscles || []),
          equipment: _mapWgerEquipment(ex.equipment || []),
          difficulty: 'intermediate', /* Wger doesn't provide difficulty niveau */
          source: 'wger',
          wger_id: ex.id
        };
      });

      /* Cache results */
      this.cache[cacheKey] = { data: exercises, timestamp: now };
      console.log('WGER: Loaded ' + exercises.length + ' exercises');
      return exercises;
    } catch(e) {
      console.warn('WGER API failed (non-blocking):', e.message);
      return []; /* Return empty, fall back to local */
    }
  },

  /**
   * Fetch muscle groups from Wger
   * @returns {Promise<Object>}
   */
  async getMuscles() {
    var cacheKey = 'wger_muscles';
    var now = Date.now();

    if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.cacheExpiry) {
      return this.cache[cacheKey].data;
    }

    try {
      var url = this.baseUrl + '/muscle/';
      var response = await fetch(url, { timeout: this.timeout });

      if (!response.ok) throw new Error('Wger muscles API error');

      var data = await response.json();
      var muscles = {};
      (data.results || []).forEach(function(m) {
        muscles['wger_' + m.id] = { id: m.id, nom: m.name };
      });

      this.cache[cacheKey] = { data: muscles, timestamp: now };
      return muscles;
    } catch(e) {
      console.warn('WGER muscles API failed:', e.message);
      return {};
    }
  }
};

/* ── Mapping helpers ── */
function _mapWgerCategory(category) {
  if (!category) return 'full_body';
  var categoryMap = {
    1: 'abs', 2: 'back', 3: 'biceps', 4: 'calves', 5: 'chest',
    6: 'forearms', 7: 'glutes', 8: 'hamstrings', 9: 'lats',
    10: 'lower_back', 11: 'middle_back', 12: 'neck', 13: 'quadriceps',
    14: 'shoulders', 15: 'traps', 16: 'triceps'
  };
  return categoryMap[category] || 'full_body';
}

function _mapWgerMuscles(muscleIds) {
  var muscleMap = {
    1: 'abdominaux', 2: 'dos', 3: 'biceps', 4: 'mollets', 5: 'poitrine',
    6: 'avant-bras', 7: 'fessiers', 8: 'ischio-jambiers', 9: 'grand-dorsal',
    10: 'lombaires', 11: 'dos-milieu', 12: 'cou', 13: 'quadriceps',
    14: 'épaules', 15: 'trapèzes', 16: 'triceps'
  };
  return (muscleIds || []).map(function(id) { return muscleMap[id] || 'unknown'; });
}

function _mapWgerEquipment(equipmentIds) {
  var equipMap = {
    1: 'barbell', 2: 'dumbbell', 3: 'cable', 4: 'bench', 5: 'pullup_bar',
    6: 'bands', 7: 'kettlebell', 8: 'medicine_ball', 9: 'bodyweight'
  };
  return (equipmentIds || []).map(function(id) { return equipMap[id] || 'unknown'; });
}
