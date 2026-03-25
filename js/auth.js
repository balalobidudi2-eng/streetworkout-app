/* ═══════════════════════════════════════════════════════
   FORGE Auth — js/auth.js
   Simple client-side login/logout with user namespacing.
   Admin: 1@gmail.com
   ═══════════════════════════════════════════════════════ */

var SW_AUTH = (function() {
  var ADMIN_EMAIL = '1@gmail.com';
  var SESSION_KEY = 'sw_session';
  var USERS_KEY   = 'sw_users';

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

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch(e) { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /* Login — existing users only. Returns {ok, err}. */
  async function login(email, pwd) {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return { ok: false, err: 'Email invalide' };
    if (!pwd || pwd.length < 4) return { ok: false, err: 'Mot de passe trop court (4 car. min)' };

    var hash  = await hashPwd(pwd);
    var users = getUsers();

    if (!users[email]) return { ok: false, err: 'Aucun compte avec cet email' };
    if (users[email].hash !== hash) return { ok: false, err: 'Mot de passe incorrect' };

    saveSession(email);
    return { ok: true };
  }

  /* Register — new users only. Returns {ok, err}. */
  async function register(email, pwd) {
    email = (email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return { ok: false, err: 'Email invalide' };
    if (!pwd || pwd.length < 4) return { ok: false, err: 'Mot de passe trop court (4 car. min)' };

    var users = getUsers();
    if (users[email]) return { ok: false, err: 'Un compte existe déjà avec cet email' };

    var hash = await hashPwd(pwd);
    users[email] = { hash: hash, since: new Date().toISOString().slice(0, 10) };
    saveUsers(users);
    saveSession(email);
    return { ok: true };
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

  /* Namespace a localStorage key for the current user.
     E.g. 'sw_profil' → 'sw_profil__user_at_example_com' */
  function key(base) {
    var s = getSession();
    if (!s || !s.email) return base;
    var safe = s.email.replace(/[^a-z0-9]/gi, '_');
    return base + '__' + safe;
  }

  /* Return list of all registered user emails (admin use) */
  function listUsers() {
    return Object.keys(getUsers());
  }

  return {
    login: login,
    register: register,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getCurrentEmail: getCurrentEmail,
    isAdmin: isAdmin,
    key: key,
    listUsers: listUsers,
    getUsers: getUsers,
    ADMIN_EMAIL: ADMIN_EMAIL
  };
})();
