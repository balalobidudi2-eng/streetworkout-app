/* ========================================
   EXERCISEDB-API.JS — ExerciseDB via Vercel Proxy
   Cle API stockee server-side dans Vercel ENV
   Le client appelle /api/exercisedb (jamais RapidAPI directement)
   ======================================== */

var EXERCISEDB_API = {
  _cache: {},
  _ready: false,
  _exercises: [],

  init: async function() {
    if (this._ready) return true;
    try {
      console.log('[ExerciseDB] Chargement...');
      var res = await fetch('/api/exercisedb?path=/exercises?limit=300');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (data && data.error) throw new Error(data.error);
      if (!Array.isArray(data) || data.length === 0) throw new Error('Reponse vide');
      var self = this;
      self._exercises = data.map(function(ex) {
        return {
          id:        ex.id,
          nom:       ex.name,
          muscles:   [ex.target].concat(ex.secondaryMuscles || []).filter(Boolean),
          bodyPart:  ex.bodyPart,
          equipment: ex.equipment,
          gif:       ex.gifUrl || null,
          series:    3,
          reps:      '8-12',
          repos:     90,
          source:    'exercisedb'
        };
      });
      self._ready = true;
      console.log('[ExerciseDB] OK ' + self._exercises.length + ' exercices charges');
      return true;
    } catch(e) {
      console.warn('[ExerciseDB] Echec:', e.message);
      this._ready = false;
      return false;
    }
  },

  getByMuscle: function(muscle) {
    if (!this._ready) return [];
    var m = muscle.toLowerCase();
    return this._exercises.filter(function(ex) {
      return ex.muscles.some(function(mu) { return mu.toLowerCase().indexOf(m) !== -1; }) ||
             ex.bodyPart.toLowerCase().indexOf(m) !== -1;
    });
  },

  getByBodyPart: function(part) {
    if (!this._ready) return [];
    var p = part.toLowerCase();
    return this._exercises.filter(function(ex) {
      return ex.bodyPart.toLowerCase() === p;
    });
  },

  getForType: function(type) {
    if (!this._ready) return [];
    var MAP = {
      push:      ['chest', 'shoulders', 'triceps'],
      pull:      ['back', 'biceps', 'upper arms'],
      lower:     ['upper legs', 'lower legs', 'glutes'],
      full_body: ['chest', 'back', 'upper legs'],
      upper:     ['chest', 'back', 'shoulders'],
      core:      ['waist', 'abs'],
      skills:    ['back', 'shoulders', 'upper arms']
    };
    var parts = MAP[type] || MAP.full_body;
    var results = [];
    var self = this;
    parts.forEach(function(part) {
      var exos = self.getByBodyPart(part).slice(0, 3);
      results = results.concat(exos);
    });
    return results.slice(0, 8);
  },

  isReady: function() { return this._ready; }
};
