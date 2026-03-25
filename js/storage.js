var SW_STORAGE = (function() {
  'use strict';

  function _email() {
    return (typeof SW_AUTH !== 'undefined') ? SW_AUTH.getCurrentEmail() : null;
  }
  function _userId() {
    return (typeof SW_AUTH !== 'undefined') ? SW_AUTH.getCurrentUserId() : null;
  }
  function _supa() {
    return (typeof SW_AUTH !== 'undefined') ? SW_AUTH.getSupa() : null;
  }
  function _k(base) {
    if (typeof SW_AUTH !== 'undefined' && SW_AUTH.isLoggedIn()) {
      return SW_AUTH.key(base);
    }
    return base;
  }

  return {
    save: function(key, value) {
      localStorage.setItem(_k(key), JSON.stringify(value));
      this._sync(key, value);
    },

    load: function(key) {
      try {
        var raw = localStorage.getItem(_k(key));
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    },

    update: function(key, patch) {
      var current = this.load(key) || {};
      var merged = Object.assign({}, current, patch);
      this.save(key, merged);
      return merged;
    },

    clear: function(key) {
      localStorage.removeItem(_k(key));
    },

    /* Sync une cle vers Supabase (fire and forget) */
    _sync: function(baseKey, value) {
      var userId = _userId();
      var supa   = _supa();

      if (userId && supa) {
        /* Essaie la table user_data, si elle n'existe pas → user_metadata */
        supa.from('user_data').upsert({
          user_id:    userId,
          key:        baseKey,
          value:      value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,key' })
        .then(function(r) {
          if (r && r.error) {
            /* Table inexistante ou erreur → stocker dans user_metadata */
            var patch = {}; patch[baseKey] = value;
            supa.auth.updateUser({ data: patch }).catch(function() {});
          }
        })
        .catch(function() {
          var patch = {}; patch[baseKey] = value;
          supa.auth.updateUser({ data: patch }).catch(function() {});
        });
        return;
      }

      /* Fallback : API /api/userdata */
      var email = _email();
      if (!email) return;
      var nsKey = _k(baseKey);
      try {
        fetch('/api/userdata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, key: nsKey, data: value }),
          keepalive: true
        }).catch(function() {});
      } catch(e) {}
    },

    /* Charge toutes les donnees depuis Supabase au login */
    pullFromServer: async function() {
      var userId = _userId();
      var supa   = _supa();
      var email  = _email();

      var safe = (email || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();

      /* 1ere priorite : table user_data Supabase */
      if (userId && supa) {
        try {
          var r = await supa.from('user_data').select('key, value').eq('user_id', userId);
          if (!r.error && r.data && r.data.length > 0) {
            r.data.forEach(function(row) {
              var nsKey = row.key + (safe ? '__' + safe : '');
              localStorage.setItem(nsKey, JSON.stringify(row.value));
            });
            return;
          }
        } catch(e) {}

        /* 2e priorite : user_metadata (fonctionne sans table) */
        try {
          var ur = await supa.auth.getUser();
          if (!ur.error && ur.data && ur.data.user) {
            var meta = ur.data.user.user_metadata || {};
            var restored = 0;
            Object.keys(meta).forEach(function(k) {
              if (k.match(/^sw_/) && meta[k] !== null && typeof meta[k] === 'object') {
                var nsKey2 = safe ? k + '__' + safe : k;
                localStorage.setItem(nsKey2, JSON.stringify(meta[k]));
                restored++;
              }
            });
            if (restored > 0) return;
          }
        } catch(e) {}
      }

      /* Fallback API */
      if (!email) return;
      try {
        var res = await fetch('/api/userdata?email=' + encodeURIComponent(email));
        if (!res.ok) return;
        var all = await res.json();
        if (all && typeof all === 'object' && !all.error) {
          Object.keys(all).forEach(function(k) {
            localStorage.setItem(k, typeof all[k] === 'string' ? all[k] : JSON.stringify(all[k]));
          });
        }
      } catch(e) {}
    }
  };
})();
