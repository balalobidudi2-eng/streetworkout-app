/* ═══════════════════════════════════════════════════════
   FORGE Auth — js/auth.js
   Authentication via API serveur (Vercel KV / Redis)
   Fallback localStorage si API indisponible
   Migration automatique des anciens comptes localStorage → serveur
   Admin: balalobidudi2@gmail.com
   ═══════════════════════════════════════════════════════ */

var SW_AUTH = (function() {
  'use strict';

  var ADMIN_EMAIL = 'balalobidudi2@gmail.com';
  var SESSION_KEY = 'sw_session';

  /* Hash password with WebCrypto SHA-256 → hex string */
  async function hashPwd(pwd) {
    var enc = new TextEncoder();
    var buf = await crypto.subtle.digest('SHA-256', enc.encode(pwd || ''));
    return Array.from(new Uint8Array(buf))
      .map(function(b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) { return null; }
  }

  function saveSession(email) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: email }));
  }

  /* Comptes locaux (fallback) */
  function getUsersLocal() {
    try { return JSON.parse(localStorage.getItem('sw_users')) || {}; } catch(e) { return {}; }
  }

  function saveUsersLocal(users) {
    localStorage.setItem('sw_users', JSON.stringify(users));
  }

  /* Appel à l'API auth serveur — retourne null si l'API est injoignable */
  async function callAPI(payload) {
    try {
      var res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await res.json();
      return data;
    } catch(e) {
      return null; /* API injoignable (pas de réseau ou pas de serveur Vercel) */
    }
  }

  /* Login — API serveur en priorité, localStorage en fallback
     Migration automatique des anciens comptes localStorage vers le serveur */
  async function login(email, pwd) {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return { ok: false, err: 'Email invalide' };
    if (!pwd || pwd.length < 4) return { ok: false, err: 'Mot de passe trop court (4 car. min)' };

    var hash = await hashPwd(pwd);

    /* 1. Essayer l'API serveur */
    var result = await callAPI({ action: 'login', email: email, hash: hash });

    if (result && result.ok) {
      saveSession(result.email || email);
      return { ok: true };
    }

    /* 2. Si le compte n'existe pas côté serveur, vérifier si c'est un ancien compte localStorage */
    if (result && result.err === 'Aucun compte avec cet email') {
      var users = getUsersLocal();
      if (users[email] && users[email].hash === hash) {
        /* Migrer ce compte vers le serveur */
        var migResult = await callAPI({ action: 'register', email: email, hash: hash });
        if (migResult && migResult.ok) {
          saveSession(email);
          return { ok: true };
        }
        /* Migration impossible mais compte local valide → accès autorisé */
        saveSession(email);
        return { ok: true };
      }
      /* Vérifier aussi si le hash est correct mais compte absent */
      if (users[email] && users[email].hash !== hash) {
        return { ok: false, err: 'Mot de passe incorrect' };
      }
    }

    /* 3. Si l'API est complètement indisponible (null) → fallback localStorage */
    if (result === null || (result && result.kvAvailable === false)) {
      var localUsers = getUsersLocal();
      if (!localUsers[email]) return { ok: false, err: 'Aucun compte avec cet email' };
      if (localUsers[email].hash !== hash) return { ok: false, err: 'Mot de passe incorrect' };
      saveSession(email);
      return { ok: true };
    }

    return result || { ok: false, err: 'Erreur de connexion' };
  }

  /* Register — API serveur en priorité, localStorage en fallback */
  async function register(email, pwd) {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return { ok: false, err: 'Email invalide' };
    if (!pwd || pwd.length < 4) return { ok: false, err: 'Mot de passe trop court (4 car. min)' };

    var hash = await hashPwd(pwd);

    /* 1. Essayer l'API serveur */
    var result = await callAPI({ action: 'register', email: email, hash: hash });

    if (result && result.ok) {
      /* Enregistrer aussi en local pour le fallback futur */
      var users = getUsersLocal();
      users[email] = { hash: hash, since: new Date().toISOString().slice(0, 10) };
      saveUsersLocal(users);
      saveSession(result.email || email);
      return { ok: true };
    }

    /* 2. Si l'API est indisponible → fallback localStorage */
    if (result === null || (result && result.kvAvailable === false)) {
      var localUsers = getUsersLocal();
      if (localUsers[email]) return { ok: false, err: 'Un compte existe déjà avec cet email' };
      localUsers[email] = { hash: hash, since: new Date().toISOString().slice(0, 10) };
      saveUsersLocal(localUsers);
      saveSession(email);
      return { ok: true };
    }

    return result || { ok: false, err: 'Erreur de connexion' };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    return !!getSession();
  }

  function getCurrentEmail() {
    var s = getSession();
    return s ? s.email : null;
  }

  function isAdmin() {
    var s = getSession();
    return !!(s && s.email === ADMIN_EMAIL);
  }

  /* Namespace a localStorage key for the current user */
  function key(base) {
    var s = getSession();
    if (!s || !s.email) return base;
    var safe = s.email.replace(/[^a-z0-9]/gi, '_');
    return base + '__' + safe;
  }

  /* Get users list — via API serveur, fallback localStorage */
  async function getUsers() {
    var result = await callAPI({ action: 'get_users', adminEmail: ADMIN_EMAIL });
    if (result && result.ok && result.users) {
      return result.users.map(function(u) { return u.email; });
    }
    return Object.keys(getUsersLocal());
  }

  /* Check KV availability */
  async function checkKV() {
    var result = await callAPI({ action: 'ping' });
    return !!(result && result.kvAvailable);
  }

  return {
    login: login,
    register: register,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getCurrentEmail: getCurrentEmail,
    isAdmin: isAdmin,
    key: key,
    getUsers: getUsers,
    checkKV: checkKV,
    ADMIN_EMAIL: ADMIN_EMAIL
  };
})();
