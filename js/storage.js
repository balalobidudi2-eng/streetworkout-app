var SW_STORAGE = (function() {
  /* Namespace key for current user when auth is available */
  function _k(key) {
    if (typeof SW_AUTH !== 'undefined' && SW_AUTH.isLoggedIn()) {
      return SW_AUTH.key(key);
    }
    return key;
  }

  return {
    save: function(key, value) {
      localStorage.setItem(_k(key), JSON.stringify(value));
      /* Async server sync — fire and forget */
      this._sync(_k(key), value);
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
    /* Sync a key/value to server (best-effort, no error surfacing) */
    _sync: function(nsKey, value) {
      var email = (typeof SW_AUTH !== 'undefined') ? SW_AUTH.getCurrentEmail() : null;
      if (!email) return;
      try {
        fetch('/api/userdata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, key: nsKey, data: value })
        }).catch(function() {});
      } catch(e) {}
    },
    /* Pull all user data from server into localStorage (call on login) */
    pullFromServer: async function() {
      var email = (typeof SW_AUTH !== 'undefined') ? SW_AUTH.getCurrentEmail() : null;
      if (!email) return;
      try {
        var res = await fetch('/api/userdata?email=' + encodeURIComponent(email));
        if (!res.ok) return;
        var all = await res.json();
        if (all && typeof all === 'object') {
          Object.keys(all).forEach(function(k) {
            localStorage.setItem(k, typeof all[k] === 'string' ? all[k] : JSON.stringify(all[k]));
          });
        }
      } catch(e) {}
    }
  };
})();
