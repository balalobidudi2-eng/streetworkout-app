/* ========================================
   AUTH.JS — Authentication Logic
   ======================================== */

var AUTH_CREDENTIALS = {
  username: 'streetworkout',
  password: 'Calisthenics2026!'
};

/* Check if user is logged in */
function isLoggedIn() {
  return sessionStorage.getItem('sw_logged') === 'true';
}

/* Protect pages — redirect to login if not authenticated */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/* Logout */
function logout() {
  sessionStorage.removeItem('sw_logged');
  window.location.href = 'index.html';
}

/* Initialize login form */
function initLoginForm() {
  var form = document.getElementById('login-form');
  if (!form) return;

  /* If already logged in, redirect to dashboard */
  if (isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  var usernameInput = document.getElementById('login-username');
  var passwordInput = document.getElementById('login-password');
  var errorEl = document.getElementById('login-error');
  var submitBtn = document.getElementById('login-submit');
  var togglePwd = document.getElementById('toggle-password');

  /* Toggle password visibility */
  if (togglePwd) {
    togglePwd.addEventListener('click', function() {
      var type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePwd.innerHTML = type === 'password'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var username = usernameInput.value.trim();
    var password = passwordInput.value.trim();

    /* Hide previous error */
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.classList.remove('shake');
    }

    /* Validate */
    if (!username || !password) {
      showLoginError('Veuillez remplir tous les champs.');
      return;
    }

    /* Show loading state */
    submitBtn.classList.add('btn-loading');

    /* Simulate loading delay */
    setTimeout(function() {
      if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
        sessionStorage.setItem('sw_logged', 'true');
        window.location.href = 'dashboard.html';
      } else {
        submitBtn.classList.remove('btn-loading');
        showLoginError('Identifiants incorrects. Réessayez.');
      }
    }, 800);
  });
}

function showLoginError(msg) {
  var errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    errorEl.classList.remove('shake');
    void errorEl.offsetWidth; /* Force reflow for animation */
    errorEl.classList.add('shake');
  }
}
