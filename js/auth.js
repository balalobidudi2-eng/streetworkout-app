/* -------------------------------------------------------
   FORGE Auth � js/auth.js
   Authentication via Supabase (email/password)
   Fallback localStorage si Supabase indisponible
   Admin: balalobidudi2@gmail.com
   ------------------------------------------------------- */

var SW_AUTH = (function() {
  'use strict';

  var SUPABASE_URL  = 'https://tahuyewnuizejbkmqlcb.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaHV5ZXdudWl6ZWpia21xbGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzUyOTUsImV4cCI6MjA4OTcxMTI5NX0.1f2SN95exMgVv9d1HWd6WmkkAYPgPx5blxDC4e6aTRc';
  var ADMIN_EMAIL   = 'balalobidudi2@gmail.com';
  var SESSION_KEY   = 'sw_session';

  /* Supabase client (lazy init) */
  var _supa = null;
  function getSupa() {
    if (!_supa && typeof window !== 'undefined' && window.supabase) {
      _supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: true, storageKey: 'forge_auth' }
      });
    }
    return _supa;
  }

  /* Session locale (cache rapide) */
  var _mem = null;
  function getSession() {
    if (_mem) return _mem;
    try { _mem = JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch(e) { _mem = null; }
    return _mem;
  }
  function saveSession(email, userId) {
    _mem = { email: email, userId: userId || null };
    localStorage.setItem(SESSION_KEY, JSON.stringify(_mem));
  }
  function clearSession() {
    _mem = null;
    localStorage.removeItem(SESSION_KEY);
  }

  /* Fallback localStorage helpers */
  function getUsersLocal() {
    try { return JSON.parse(localStorage.getItem('sw_users')) || {}; } catch(e) { return {}; }
  }
  function saveUsersLocal(users) {
    localStorage.setItem('sw_users', JSON.stringify(users));
  }
  async function hashPwd(pwd) {
    var enc = new TextEncoder();
    var buf = await crypto.subtle.digest('SHA-256', enc.encode(pwd || ''));
    return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  /* Initialise la session depuis Supabase au demarrage */
  async function initFromSupabase() {
    var supa = getSupa();
    if (!supa) return;
    try {
      var r = await supa.auth.getSession();
      if (r.data && r.data.session && r.data.session.user) {
        var u = r.data.session.user;
        saveSession(u.email, u.id);
      }
    } catch(e) {}
    try {
      supa.auth.onAuthStateChange(function(event, session) {
        if (session && session.user) {
          saveSession(session.user.email, session.user.id);
          /* Enregistrement silencieux dans KV (pour Google OAuth et autres providers) */
          if (event === 'SIGNED_IN') {
            var uEmail = session.user.email;
            var uId    = session.user.id;
            hashPwd('supabase:' + uId).then(function(h) {
              fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'register', email: uEmail, hash: h }),
                keepalive: true
              }).catch(function() {});
            }).catch(function() {});
          }
        } else if (event === 'SIGNED_OUT') {
          clearSession();
        }
      });
    } catch(e) {}
  }

  /* Login */
  async function login(email, pwd) {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return { ok: false, err: 'Email invalide' };
    if (!pwd || pwd.length < 6) return { ok: false, err: 'Mot de passe trop court (6 car. min)' };

    var supa = getSupa();
    if (supa) {
      try {
        var r = await supa.auth.signInWithPassword({ email: email, password: pwd });
        if (!r.error && r.data && r.data.user) {
          saveSession(r.data.user.email, r.data.user.id);
          return { ok: true };
        }
        if (r.error) {
          var msg = r.error.message || '';
          if (msg.toLowerCase().indexOf('invalid') !== -1 || msg.toLowerCase().indexOf('credentials') !== -1) {
            return { ok: false, err: 'Email ou mot de passe incorrect' };
          }
          if (msg.toLowerCase().indexOf('not confirmed') !== -1 || msg.toLowerCase().indexOf('confirm') !== -1) {
            return { ok: false, err: 'Confirme ton email avant de te connecter' };
          }
          return { ok: false, err: msg };
        }
      } catch(e) {
        return loginLocal(email, await hashPwd(pwd));
      }
    }
    return loginLocal(email, await hashPwd(pwd));
  }

  async function loginLocal(email, hash) {
    var users = getUsersLocal();
    if (!users[email]) return { ok: false, err: 'Aucun compte avec cet email' };
    if (users[email].hash !== hash) return { ok: false, err: 'Mot de passe incorrect' };
    saveSession(email, null);
    return { ok: true };
  }

  /* Register */
  async function register(email, pwd) {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return { ok: false, err: 'Email invalide' };
    if (!pwd || pwd.length < 6) return { ok: false, err: 'Mot de passe trop court (6 car. min)' };

    var supa = getSupa();
    if (supa) {
      try {
        var r = await supa.auth.signUp({ email: email, password: pwd });
        if (!r.error && r.data && r.data.user) {
          var u = r.data.user;
          saveSession(u.email, u.id);
          /* Tentative d'insertion dans profiles (si la table existe) */
          try {
            await supa.from('profiles').upsert({
              user_id: u.id, email: u.email, prenom: '', nom: '', username: '',
              since: new Date().toISOString().slice(0, 10)
            }, { onConflict: 'user_id' });
          } catch(e) {}
          var hash = await hashPwd(pwd);
          var local = getUsersLocal();
          local[email] = { hash: hash, since: new Date().toISOString().slice(0, 10) };
          saveUsersLocal(local);
          /* Enregistrement dans KV pour que l'admin puisse voir l'utilisateur */
          try {
            fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'register', email: email, hash: hash }),
              keepalive: true
            }).catch(function() {});
          } catch(e) {}
          if (!r.data.session) {
            clearSession();
            return { ok: false, needsConfirm: true, err: 'Compte cree ! Verifie ta boite mail pour confirmer, puis connecte-toi.' };
          }
          return { ok: true };
        }
        if (r.error) {
          var msg = r.error.message || '';
          if (msg.toLowerCase().indexOf('already registered') !== -1 || msg.toLowerCase().indexOf('already') !== -1) {
            return { ok: false, err: 'Un compte existe deja avec cet email' };
          }
          return { ok: false, err: msg };
        }
      } catch(e) {
        return registerLocal(email, await hashPwd(pwd));
      }
    }
    return registerLocal(email, await hashPwd(pwd));
  }

  async function registerLocal(email, hash) {
    var users = getUsersLocal();
    if (users[email]) return { ok: false, err: 'Un compte existe deja avec cet email' };
    users[email] = { hash: hash, since: new Date().toISOString().slice(0, 10) };
    saveUsersLocal(users);
    saveSession(email, null);
    return { ok: true };
  }

  /* Logout */
  async function logout() {
    var supa = getSupa();
    if (supa) { try { await supa.auth.signOut(); } catch(e) {} }
    clearSession();
  }

  function isLoggedIn() { return !!getSession(); }
  function getCurrentEmail() { var s = getSession(); return s ? s.email : null; }
  function getCurrentUserId() { var s = getSession(); return s ? (s.userId || null) : null; }
  function isAdmin() { var s = getSession(); return !!(s && s.email === ADMIN_EMAIL); }

  function key(base) {
    var s = getSession();
    if (!s || !s.email) return base;
    return base + '__' + s.email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  async function getUsers() {
    var supa = getSupa();
    if (supa) {
      try {
        var r = await supa.from('profiles').select('email');
        if (!r.error && r.data && r.data.length > 0) return r.data.map(function(u) { return u.email; });
      } catch(e) {}
    }
    /* Fallback : liste depuis KV (cross-browser) */
    try {
      var resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_users', adminEmail: getCurrentEmail() })
      });
      if (resp.ok) {
        var data = await resp.json();
        if (data && !data.error && Array.isArray(data.users)) {
          return data.users.map(function(u) { return u.email || u; });
        }
      }
    } catch(e) {}
    return Object.keys(getUsersLocal());
  }

  async function getFullProfiles() {
    var supa = getSupa();
    if (supa && isAdmin()) {
      try {
        var r = await supa.from('profiles').select('*').order('since', { ascending: false });
        if (!r.error && r.data) return r.data;
      } catch(e) {}
    }
    return [];
  }

  /* Google OAuth (Supabase) */
  async function loginWithGoogle() {
    var supa = getSupa();
    if (!supa) return { ok: false, err: 'Supabase indisponible' };
    try {
      var r = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (r.error) return { ok: false, err: r.error.message || 'Erreur Google' };
      /* Supabase redirige vers Google — pas de retour synchrone ici */
      return { ok: true };
    } catch(e) {
      return { ok: false, err: e.message || 'Erreur Google' };
    }
  }

  return {
    login: login, register: register, logout: logout,
    loginWithGoogle: loginWithGoogle,
    initFromSupabase: initFromSupabase,
    isLoggedIn: isLoggedIn, getCurrentEmail: getCurrentEmail,
    getCurrentUserId: getCurrentUserId, isAdmin: isAdmin,
    key: key, getUsers: getUsers, getFullProfiles: getFullProfiles,
    getSupa: getSupa, ADMIN_EMAIL: ADMIN_EMAIL
  };
})();
