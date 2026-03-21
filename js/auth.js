/* ========================================
   AUTH.JS — Supabase Authentication
   ======================================== */

/* ── Current user cache ── */
var _currentUser = null;

/* ── Protection de page (async) ── */
async function requireAuth() {
  if (!SB) { window.location.href = 'login.html'; return null; }
  var result = await SB.auth.getSession();
  if (!result.data.session) {
    window.location.href = 'login.html';
    return null;
  }
  _currentUser = result.data.session.user;
  return _currentUser;
}

/* ── Check if logged in (non-blocking) ── */
async function isLoggedIn() {
  if (!SB) return false;
  var result = await SB.auth.getSession();
  return !!result.data.session;
}

/* ── Login email/password ── */
async function loginWithEmail(email, password) {
  var result = await SB.auth.signInWithPassword({ email: email, password: password });
  if (result.error) throw result.error;
  return result.data;
}

/* ── Inscription email/password ── */
async function signupWithEmail(email, password, prenom) {
  var result = await SB.auth.signUp({
    email: email,
    password: password,
    options: { data: { full_name: prenom } }
  });
  if (result.error) throw result.error;
  return result.data;
}

/* ── Login Google OAuth ── */
async function loginWithGoogle() {
  var result = await SB.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/auth-callback.html' }
  });
  if (result.error) throw result.error;
}

/* ── Déconnexion ── */
async function logout() {
  if (SB) await SB.auth.signOut();
  _currentUser = null;
  window.location.href = 'index.html';
}

/* ── Écouter les changements de session ── */
if (typeof SB !== 'undefined' && SB) {
  SB.auth.onAuthStateChange(function(event, session) {
    if (event === 'SIGNED_OUT') {
      _currentUser = null;
    }
  });
}

/* ── Initialize login / signup form ── */
function initLoginForm() {
  var loginForm = document.getElementById('login-form');
  var signupForm = document.getElementById('signup-form');
  var googleBtn = document.getElementById('google-login-btn');
  var tabs = document.querySelectorAll('.auth-tab');

  /* If already logged in, redirect */
  (async function() {
    if (await isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return;
    }
  })();

  /* Tab switching */
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var target = tab.getAttribute('data-tab');
      document.querySelectorAll('.auth-panel').forEach(function(p) {
        p.classList.remove('active');
      });
      var panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');
    });
  });

  /* Login form submit */
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('login-email').value.trim();
      var password = document.getElementById('login-password').value.trim();
      var errorEl = document.getElementById('login-error');
      var submitBtn = loginForm.querySelector('button[type="submit"]');

      if (errorEl) { errorEl.style.display = 'none'; }
      if (!email || !password) { showLoginError('login-error', 'Remplis tous les champs.'); return; }

      submitBtn.classList.add('btn-loading');
      try {
        await loginWithEmail(email, password);
        window.location.href = 'dashboard.html';
      } catch (err) {
        submitBtn.classList.remove('btn-loading');
        var msg = 'Erreur de connexion.';
        if (err.message) {
          if (err.message.includes('Invalid login')) msg = 'Email ou mot de passe incorrect.';
          else if (err.message.includes('Email not confirmed')) msg = 'Confirme ton email avant de te connecter.';
          else msg = err.message;
        }
        showLoginError('login-error', msg);
      }
    });
  }

  /* Signup form submit */
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var prenom = document.getElementById('signup-prenom').value.trim();
      var email = document.getElementById('signup-email').value.trim();
      var password = document.getElementById('signup-password').value.trim();
      var confirm = document.getElementById('signup-confirm').value.trim();
      var errorEl = document.getElementById('signup-error');
      var successEl = document.getElementById('signup-success');
      var submitBtn = signupForm.querySelector('button[type="submit"]');

      if (errorEl) errorEl.style.display = 'none';
      if (successEl) successEl.style.display = 'none';

      if (!prenom || !email || !password || !confirm) {
        showLoginError('signup-error', 'Remplis tous les champs.'); return;
      }
      if (password.length < 6) {
        showLoginError('signup-error', 'Le mot de passe doit contenir au moins 6 caractères.'); return;
      }
      if (password !== confirm) {
        showLoginError('signup-error', 'Les mots de passe ne correspondent pas.'); return;
      }

      submitBtn.classList.add('btn-loading');
      try {
        await signupWithEmail(email, password, prenom);
        submitBtn.classList.remove('btn-loading');
        if (successEl) {
          successEl.textContent = '✅ Compte créé ! Vérifie tes emails pour confirmer ton inscription.';
          successEl.style.display = 'block';
        }
        signupForm.reset();
      } catch (err) {
        submitBtn.classList.remove('btn-loading');
        var msg = 'Erreur lors de l\'inscription.';
        if (err.message) {
          if (err.message.includes('already registered')) msg = 'Cet email est déjà utilisé.';
          else msg = err.message;
        }
        showLoginError('signup-error', msg);
      }
    });
  }

  /* Google OAuth */
  if (googleBtn) {
    googleBtn.addEventListener('click', async function() {
      try { await loginWithGoogle(); }
      catch (err) { showLoginError('login-error', 'Erreur Google : ' + (err.message || 'inconnue')); }
    });
  }
}

function showLoginError(elId, msg) {
  var errorEl = document.getElementById(elId);
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    errorEl.classList.remove('shake');
    void errorEl.offsetWidth;
    errorEl.classList.add('shake');
  }
}
