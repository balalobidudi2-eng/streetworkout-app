/* ========================================
   SKILL-SWIPER.JS — Swiper de progression
   Navigation par niveaux pour chaque skill
   Depend de : progression.js (EXERCISES)
   ======================================== */

/* Image map for skills with visual progressions
   Front-lever dispose de fichiers .webp optimisés + .svg en fallback.
   Handstand : uniquement .svg disponible actuellement. */
var SKILL_IMAGES = {
  frontlever: {
    1: { webp: 'forme/front-lever/niveau-1.webp', svg: 'forme/front-lever/niveau-1.svg' },
    2: { webp: 'forme/front-lever/niveau-2.webp', svg: 'forme/front-lever/niveau-2.svg' },
    3: { webp: 'forme/front-lever/niveau-3.webp', svg: 'forme/front-lever/niveau-3.svg' },
    4: { webp: 'forme/front-lever/niveau-4.webp', svg: 'forme/front-lever/niveau-4.svg' },
    5: { webp: 'forme/front-lever/niveau-5.webp', svg: 'forme/front-lever/niveau-5.svg' }
  },
  handstand: {
    1: { svg: 'forme/handstand/niveau-1.svg' },
    2: { svg: 'forme/handstand/niveau-2.svg' },
    3: { svg: 'forme/handstand/niveau-3.svg' },
    4: { svg: 'forme/handstand/niveau-4.svg' },
    5: { svg: 'forme/handstand/niveau-5.svg' }
  }
};

var SkillSwiper = {

  skill: null,
  currentIndex: 0,
  startX: 0,
  _lastDirection: null,
  _isNavigating: false,

  open: function(skillId) {
    var skill = null;
    for (var i = 0; i < EXERCISES.length; i++) {
      if (EXERCISES[i].id === skillId) { skill = EXERCISES[i]; break; }
    }
    if (!skill) return;

    this.skill = skill;
    this.currentIndex = this._findCurrentIndex();
    this._render();

    var overlay = document.getElementById('skill-swiper-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    this._bindSwipe();
  },

  _findCurrentIndex: function() {
    var steps = this.skill.steps;
    for (var i = steps.length - 1; i >= 0; i--) {
      var status = (_progData && _progData[steps[i].id]) || 'not-acquired';
      if (status === 'mastered') return Math.min(i + 1, steps.length - 1);
    }
    return 0;
  },

  _render: function() {
    var overlay = document.getElementById('skill-swiper-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'skill-swiper-overlay';
      overlay.className = 'skill-swiper-overlay';
      document.body.appendChild(overlay);
    }

    var steps = this.skill.steps;
    var total = steps.length;
    var idx = this.currentIndex;
    var step = steps[idx];
    var status = (_progData && _progData[step.id]) || 'not-acquired';
    var isDone = status === 'mastered';

    /* Déterminer le premier niveau non encore maîtrisé (= le niveau actif) */
    var activeIndex = 0;
    for (var a = 0; a < steps.length; a++) {
      if (_progData && _progData[steps[a].id] === 'mastered') {
        activeIndex = Math.min(a + 1, steps.length - 1);
      }
    }
    /* Niveau verrouillé = pas encore atteint et pas maîtrisé */
    var isLocked = !isDone && idx > activeIndex;

    /* Compteur d'etapes acquises */
    var acquiredCount = 0;
    for (var ac = 0; ac < steps.length; ac++) {
      if (_progData && _progData[steps[ac].id] === 'mastered') acquiredCount++;
    }
    var pct = Math.round((acquiredCount / total) * 100);

    /* Dots HTML */
    var dotsHtml = '';
    for (var d = 0; d < total; d++) {
      var dotStatus = (_progData && _progData[steps[d].id]) || 'not-acquired';
      var cls = 'swiper-dot';
      if (d === idx) cls += ' active';
      if (dotStatus === 'mastered') cls += ' done';
      if (!(_progData && _progData[steps[d].id] === 'mastered') && d > activeIndex) cls += ' locked';
      dotsHtml += '<span class="' + cls + '" data-idx="' + d + '"></span>';
    }

    /* Bouton d'action selon l'état du niveau */
    var actionBtn = '';
    if (isDone) {
      actionBtn = '<div class="swiper-done-banner">&#10003; Maîtrisé</div>';
    } else if (isLocked) {
      actionBtn = '<div class="swiper-locked-banner">&#128274; Niveau verrouillé — maîtrise le niveau précédent d\'abord</div>';
    } else {
      actionBtn = '<button class="swiper-validate-btn" onclick="SkillSwiper.validate()">&#10003; Valider cette étape</button>';
    }

    overlay.innerHTML =
      '<div class="swiper-backdrop" onclick="SkillSwiper.close()"></div>' +
      '<div class="swiper-panel" style="' + (this._isNavigating ? 'animation:none;' : '') + '">' +
        '<div class="swiper-header">' +
          '<span class="swiper-skill-name">' + this.skill.name + '</span>' +
          '<button class="swiper-close" onclick="SkillSwiper.close()">&times;</button>' +
        '</div>' +
        '<div class="swiper-global-bar">' +
          '<div class="swiper-global-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<div class="swiper-dots">' + dotsHtml + '</div>' +
        '<div class="swiper-card' + (isDone ? ' done' : '') + (isLocked ? ' locked' : '') + '" id="swiper-card">' +
          '<div class="swiper-card-num">' + (idx + 1) + ' / ' + total + (isLocked ? ' &#128274;' : '') + '</div>' +
          '<div class="swiper-card-illustration">' + this._getIllustration(this.skill.id, idx) + '</div>' +
          '<div class="swiper-card-content">' +
            '<h3 class="swiper-card-title">' + step.name + '</h3>' +
            '<p class="swiper-card-desc">' + step.desc + '</p>' +
          '</div>' +
          actionBtn +
        '</div>' +
        '<div class="swiper-nav">' +
          '<button class="swiper-nav-btn" onclick="SkillSwiper.prev()"' + (idx === 0 ? ' disabled' : '') + '>&larr; Précédent</button>' +
          '<button class="swiper-nav-btn" onclick="SkillSwiper.next()"' + (idx === total - 1 ? ' disabled' : '') + '>Suivant &rarr;</button>' +
        '</div>' +
      '</div>';

    /* Bind dot clicks */
    var dots = overlay.querySelectorAll('.swiper-dot');
    for (var dd = 0; dd < dots.length; dd++) {
      dots[dd].addEventListener('click', function() {
        SkillSwiper.goTo(parseInt(this.dataset.idx));
      });
    }
  },

  validate: function() {
    var step = this.skill.steps[this.currentIndex];
    if (!step) return;

    /* Marquer comme acquis */
    if (!_progData) _progData = {};
    _progData[step.id] = 'mastered';
    /* Also set the alternate key used by progression-v2 */
    var altKey = this.skill.id + '_' + this.currentIndex;
    _progData[altKey] = 'mastered';

    /* Sauvegarder dans Supabase */
    if (typeof SB !== 'undefined' && _progUserId) {
      SB.from('progression_skills').upsert({
        user_id: _progUserId,
        skill_id: step.id,
        status: 'mastered'
      }, { onConflict: 'user_id,skill_id' });
    }

    /* Animation */
    var card = document.getElementById('swiper-card');
    if (card) {
      card.classList.add('validating');
      var self = this;
      setTimeout(function() {
        /* Passer a l'etape suivante si possible */
        if (self.currentIndex < self.skill.steps.length - 1) {
          self.currentIndex++;
        }
        self._render();
      }, 600);
    }
  },

  prev: function() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._renderWithAnimation('slide-right');
    }
  },

  next: function() {
    if (this.currentIndex < this.skill.steps.length - 1) {
      this.currentIndex++;
      this._renderWithAnimation('slide-left');
    }
  },

  goTo: function(idx) {
    if (idx >= 0 && idx < this.skill.steps.length && idx !== this.currentIndex) {
      var dir = idx > this.currentIndex ? 'slide-left' : 'slide-right';
      this.currentIndex = idx;
      this._renderWithAnimation(dir);
    }
  },

  close: function() {
    var overlay = document.getElementById('skill-swiper-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    /* Rafraichir la liste des skills */
    if (typeof showSkillsList === 'function') {
      showSkillsList();
    }
  },

  _getIllustration: function(skillId, stepIdx) {
    var imgs = SKILL_IMAGES[skillId];
    if (imgs && imgs[stepIdx + 1]) {
      var entry = imgs[stepIdx + 1];
      /* Avec WebP + fallback SVG (balise <picture> responsive) */
      if (entry.webp) {
        return '<picture>' +
          '<source srcset="' + entry.webp + '" type="image/webp">' +
          '<img src="' + entry.svg + '" alt="Niveau ' + (stepIdx + 1) + '" loading="lazy" ' +
            'style="max-width:100%;height:auto;border-radius:8px;" onerror="this.style.display=\'none\'">' +
          '</picture>';
      }
      if (entry.svg) {
        return '<img src="' + entry.svg + '" alt="Niveau ' + (stepIdx + 1) + '" loading="lazy" ' +
          'style="max-width:100%;height:auto;border-radius:8px;" onerror="this.style.display=\'none\'">';
      }
      /* Compat ancienne structure (chaîne de caractères) */
      if (typeof entry === 'string') {
        return '<img src="' + entry + '" alt="Niveau ' + (stepIdx + 1) + '" loading="lazy" onerror="this.style.display=\'none\'">';
      }
    }
    return '';
  },

  _renderWithAnimation: function(direction) {
    var card = document.getElementById('swiper-card');
    var enterDir = direction === 'slide-left' ? 'entering-left' : 'entering-right';
    var self = this;
    if (card) {
      card.classList.add(direction);
      setTimeout(function() {
        self._lastDirection = enterDir;
        self._isNavigating = true;
        self._render();
        self._isNavigating = false;
        var newCard = document.getElementById('swiper-card');
        if (newCard) {
          newCard.classList.add(enterDir);
          setTimeout(function() { newCard.classList.remove(enterDir); }, 350);
        }
      }, 300);
    } else {
      this._render();
    }
  },

  _bindSwipe: function() {
    var overlay = document.getElementById('skill-swiper-overlay');
    if (!overlay) return;

    var self = this;
    overlay.addEventListener('touchstart', function(e) {
      self.startX = e.touches[0].clientX;
    }, { passive: true });

    overlay.addEventListener('touchend', function(e) {
      var diff = self.startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) self.next();
        else self.prev();
      }
    }, { passive: true });
  }
};
