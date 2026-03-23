/* ========================================
   API-MERGER.JS — Merge local DB + Wger + ExerciseDB
   Provides unified exercise database
   ======================================== */

var API_MERGER = {
  localDB: null,
  wgerExercises: [],
  exerciseDBExercises: [],
  merged: null,
  isLoading: false,
  isLoaded: false,

  /**
   * Initialize merger — load from all sources
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;

    console.log('[API_MERGER] Initializing...');

    /* Load local database */
    if (typeof SW_DB !== 'undefined') {
      this.localDB = SW_DB.exercices || {};
      console.log('[API_MERGER] Loaded local DB:', Object.keys(this.localDB).length, 'exercises');
    }

    /* Load from Wger (async, non-blocking) */
    if (typeof WGER_API !== 'undefined') {
      try {
        this.wgerExercises = await WGER_API.getExercises('fr');
        console.log('[API_MERGER] Loaded Wger:', this.wgerExercises.length, 'exercises');
      } catch(e) {
        console.warn('[API_MERGER] Wger load failed:', e.message);
      }
    }

    /* Load from ExerciseDB (async, non-blocking) */
    if (typeof EXERCISEDB_API !== 'undefined') {
      try {
        this.exerciseDBExercises = await EXERCISEDB_API.getExercises();
        console.log('[API_MERGER] Loaded ExerciseDB:', this.exerciseDBExercises.length, 'exercises');
      } catch(e) {
        console.warn('[API_MERGER] ExerciseDB load failed:', e.message);
      }
    }

    this.isLoading = false;
    this.isLoaded = true;
    console.log('[API_MERGER] Ready');
  },

  /**
   * Get merged exercise database
   * LOCAL + Wger + ExerciseDB
   * @returns {Array}
   */
  getMergedExercises() {
    if (!this.isLoaded) {
      console.warn('[API_MERGER] Not yet initialized, returning local DB only');
      var localExercises = [];
      for (var id in this.localDB) {
        if (this.localDB.hasOwnProperty(id)) {
          localExercises.push(this.localDB[id]);
        }
      }
      return localExercises;
    }

    var merged = [];
    var seen = {};

    /* Add local first (priority) */
    for (var localId in this.localDB) {
      if (this.localDB.hasOwnProperty(localId)) {
        var ex = this.localDB[localId];
        seen[ex.nom.toLowerCase()] = true;
        merged.push(ex);
      }
    }

    /* Add Wger (avoid duplicates) */
    this.wgerExercises.forEach(function(ex) {
      if (!seen[ex.nom.toLowerCase()]) {
        seen[ex.nom.toLowerCase()] = true;
        merged.push(ex);
      }
    });

    /* Add ExerciseDB (avoid duplicates) */
    this.exerciseDBExercises.forEach(function(ex) {
      if (!seen[ex.nom.toLowerCase()]) {
        seen[ex.nom.toLowerCase()] = true;
        merged.push(ex);
      }
    });

    console.log('[API_MERGER] Merged total:', merged.length, 'unique exercises');
    return merged;
  },

  /**
   * Get exercises by type/category
   * @param {string} type - session type (push, pull, lower, etc)
   * @returns {Array}
   */
  getExercisesByType(type) {
    var all = this.getMergedExercises();
    var typeMap = {
      push: ['poitrine', 'triceps', 'épaules'],
      pull: ['dos', 'biceps', 'avant-bras'],
      lower: ['quadriceps', 'fessiers', 'ischio-jambiers'],
      upper: ['dos', 'poitrine', 'biceps', 'triceps', 'épaules'],
      core: ['abdominaux', 'lombaires', 'obliques'],
      full_body: [] /* all exercises */
    };

    var targetMuscles = typeMap[type] || [];
    if (targetMuscles.length === 0) return all; /* full_body */

    return all.filter(function(ex) {
      var exMuscles = ex.muscles || [];
      return exMuscles.some(function(m) {
        return targetMuscles.indexOf(m) !== -1;
      });
    });
  },

  /**
   * Get exercises by equipment
   * @param {Array} equipment - user equipment list
   * @returns {Array}
   */
  getByEquipment(equipment) {
    if (!Array.isArray(equipment) || equipment.length === 0) {
      return this.getMergedExercises();
    }

    var all = this.getMergedExercises();
    return all.filter(function(ex) {
      if (!ex.equipment || ex.equipment.length === 0) return true; /* bodyweight always OK */
      return ex.equipment.some(function(eq) {
        return equipment.indexOf(eq) !== -1;
      });
    });
  },

  /**
   * Search exercises by name
   * @param {string} query
   * @returns {Array}
   */
  search(query) {
    if (!query || query.length < 2) return [];
    var q = query.toLowerCase();
    var all = this.getMergedExercises();
    return all.filter(function(ex) {
      return (ex.nom && ex.nom.toLowerCase().indexOf(q) !== -1) ||
             (ex.description && ex.description.toLowerCase().indexOf(q) !== -1);
    });
  }
};

/* Auto-initialize when DOM ready */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof API_MERGER !== 'undefined') {
      API_MERGER.init().catch(function(e) {
        console.error('[API_MERGER] Init error:', e);
      });
    }
  });
}
