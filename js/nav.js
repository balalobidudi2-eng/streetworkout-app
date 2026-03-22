/* ========================================
   NAV.JS — Hamburger Menu + Navigation
   ======================================== */

function initNav() {
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  var menuBackdrop = document.getElementById('menu-backdrop');
  var closeBtn = document.getElementById('mobile-menu-close');

  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.add('open');
    if (menuBackdrop) menuBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    if (menuBackdrop) menuBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function() {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMenu);
  }

  /* Close on Escape key */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  /* Close when a link inside the menu is clicked */
  var menuLinks = mobileMenu.querySelectorAll('a');
  menuLinks.forEach(function(link) {
    link.addEventListener('click', closeMenu);
  });
}

/* Highlight active nav link based on current page */
function setActiveNav() {
  var current = window.location.pathname.split('/').pop() || 'index.html';
  
  /* Desktop nav links */
  var navLinks = document.querySelectorAll('.nav-links a, .mobile-menu-links a, .sidebar-links a, .bottom-nav a');
  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === current) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* Init on DOM ready */
document.addEventListener('DOMContentLoaded', function() {
  initNav();
  setActiveNav();
  initLogoutModal();
  if (typeof initScrollReveal === 'function') initScrollReveal();
});

/* ==================== GLOBAL LOGOUT MODAL ==================== */
function showLogoutModal() {
  var overlay = document.getElementById('logout-modal-global');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'logout-modal-global';
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal">' +
      '<div style="font-size:2rem;text-align:center;margin-bottom:12px;">🚪</div>' +
      '<h3 style="text-align:center;margin-bottom:8px;">Déconnexion</h3>' +
      '<p style="color:var(--text-secondary);text-align:center;margin-bottom:24px;">Voulez-vous vous déconnecter ?</p>' +
      '<div style="display:flex;gap:12px;">' +
      '<button class="btn btn-secondary" style="flex:1;" id="lg-cancel">Non</button>' +
      '<button class="btn btn-danger" style="flex:1;" id="lg-confirm">Oui, déconnecter</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById('lg-cancel').addEventListener('click', function() {
      overlay.classList.remove('active');
    });
    document.getElementById('lg-confirm').addEventListener('click', function() {
      if (typeof logout === 'function') logout();
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  }
  overlay.classList.add('active');
}

function initLogoutModal() {
  document.querySelectorAll('[data-action="logout"]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      showLogoutModal();
    });
  });
}
