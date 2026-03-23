/* ========================================
   EXERCISEDB-API.JS — ExerciseDB RapidAPI Integration
   Requires RapidAPI key
   ======================================== */

var EXERCISEDB_API = {
  baseUrl: 'https://exercisedb.p.rapidapi.com',
  host: 'exercisedb.p.rapidapi.com',
  timeout: 5000,
  cache: {},
  cacheExpiry: 3600000, /* 1 hour */

  /**
   * Get API key from environment
   * @returns {string|null}
   */
  getApiKey: function() {
    /* Try window.__ENV first (injected by Vercel) */
    if (typeof window !== 'undefined' && window.__ENV && window.__ENV.RAPIDAPI_KEY) {
      return window.__ENV.RAPIDAPI_KEY;
    }
    /* Try localStorage for dev */
    if (typeof localStorage !== 'undefined') {
      var key = localStorage.getItem('rapidapi_key');
      if (key) return key;
    }
    return null;
  },

  /**
   * Fetch all exercises
   * @returns {Promise<Array>}
   */
  async getExercises() {
    var cacheKey = 'exercisedb_exercises';
    var now = Date.now();

    if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.cacheExpiry) {
      console.log('ExerciseDB: Using cached exercises');
      return this.cache[cacheKey].data;
    }

    var apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('ExerciseDB: No API key available (skipping)');
      return [];
    }

    try {
      var url = this.baseUrl + '/exercises?limit=100';
      var response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': this.host
        },
        timeout: this.timeout
      });

      if (!response.ok) throw new Error('ExerciseDB API error: ' + response.status);

      var exercises = await response.json();
      var mapped = (exercises || []).map(function(ex) {
        return {
          id: 'exercisedb_' + ex.id,
          nom: ex.name || '',
          description: '',
          category: ex.target || 'full_body',
          muscles: _mapExerciseDBMuscles(ex.target, ex.bodyPart),
          equipment: _mapExerciseDBEquipment(ex.equipment || []),
          difficulty: 'intermediate',
          source: 'exercisedb',
          exercisedb_id: ex.id
        };
      });

      this.cache[cacheKey] = { data: mapped, timestamp: now };
      console.log('ExerciseDB: Loaded ' + mapped.length + ' exercises');
      return mapped;
    } catch(e) {
      console.warn('ExerciseDB API failed (non-blocking):', e.message);
      return [];
    }
  },

  /**
   * Fetch exercises by body part
   * @param {string} bodyPart - body part name
   * @returns {Promise<Array>}
   */
  async getExercisesByBodyPart(bodyPart) {
    var apiKey = this.getApiKey();
    if (!apiKey) return [];

    try {
      var url = this.baseUrl + '/exercises/bodyPart/' + bodyPart;
      var response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': this.host
        },
        timeout: this.timeout
      });

      if (!response.ok) return [];

      var exercises = await response.json();
      return (exercises || []).map(function(ex) {
        return {
          id: 'exercisedb_' + ex.id,
          nom: ex.name || '',
          category: ex.target || bodyPart,
          muscles: _mapExerciseDBMuscles(ex.target, ex.bodyPart),
          equipment: _mapExerciseDBEquipment(ex.equipment || []),
          source: 'exercisedb'
        };
      });
    } catch(e) {
      console.warn('ExerciseDB bodyPart fetch failed:', e.message);
      return [];
    }
  },

  /**
   * Fetch exercises by target muscle
   * @param {string} target - muscle target
   * @returns {Promise<Array>}
   */
  async getExercisesByTarget(target) {
    var apiKey = this.getApiKey();
    if (!apiKey) return [];

    try {
      var url = this.baseUrl + '/exercises/target/' + target;
      var response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': this.host
        },
        timeout: this.timeout
      });

      if (!response.ok) return [];

      var exercises = await response.json();
      return (exercises || []).map(function(ex) {
        return {
          id: 'exercisedb_' + ex.id,
          nom: ex.name || '',
          category: ex.target || 'full_body',
          muscles: _mapExerciseDBMuscles(ex.target, ex.bodyPart),
          equipment: _mapExerciseDBEquipment(ex.equipment || []),
          source: 'exercisedb'
        };
      });
    } catch(e) {
      console.warn('ExerciseDB target fetch failed:', e.message);
      return [];
    }
  }
};

/* ── Mapping helpers ── */
function _mapExerciseDBMuscles(target, bodyPart) {
  var targetMap = {
    'abs': 'abdominaux',
    'back': 'dos',
    'biceps': 'biceps',
    'chest': 'poitrine',
    'delts': 'épaules',
    'shoulders': 'épaules',
    'forearms': 'avant-bras',
    'glutes': 'fessiers',
    'hamstrings': 'ischio-jambiers',
    'lats': 'grand-dorsal',
    'lower back': 'lombaires',
    'middle back': 'dos-milieu',
    'neck': 'cou',
    'quads': 'quadriceps',
    'quadriceps': 'quadriceps',
    'traps': 'trapèzes',
    'triceps': 'triceps',
    'calves': 'mollets'
  };

  var muscles = [];
  if (target) muscles.push(targetMap[target] || target);
  if (bodyPart) muscles.push(targetMap[bodyPart] || bodyPart);

  return Array.from(new Set(muscles)).filter(Boolean);
}

function _mapExerciseDBEquipment(equipmentList) {
  var equipMap = {
    'barbell': 'barbell',
    'dumbbell': 'dumbbell',
    'cable': 'cable',
    'band': 'bands',
    'pull-up bar': 'pullup_bar',
    'pullup bar': 'pullup_bar',
    'kettlebell': 'kettlebell',
    'medicine ball': 'medicine_ball',
    'body weight': 'bodyweight',
    'bodyweight': 'bodyweight'
  };

  return (equipmentList || []).map(function(eq) {
    return equipMap[eq.toLowerCase()] || eq.toLowerCase();
  });
}
