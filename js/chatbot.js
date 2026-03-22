/* ========================================
   CHATBOT.JS — SwBot Coach IA
   Utilise window.SB (Supabase) si disponible
   pour charger le contexte utilisateur.
   Appelle /api/chat (Vercel Edge Function)
   — la clé OpenAI n'est JAMAIS ici.
   ======================================== */

var swbot = (function() {

  var _messages   = [];
  var _isOpen     = false;
  var _isLoading  = false;
  var _userCtx    = null;

  /* ── Init ─────────────────────────────── */
  async function init() {
    await _loadUserContext();
    _render();
    _bindEvents();
    _addMessage('bot',
      'Salut\u00a0! Je suis SwBot, ton coach Street Workout\n' +
      'Pose-moi tes questions sur l\'entraînement, les progressions, ou demande-moi un programme.'
    );
  }

  /* ── Charger le profil depuis Supabase ── */
  async function _loadUserContext() {
    if (!window.SB) return;
    try {
      var sessionRes = await window.SB.auth.getSession();
      var session = sessionRes.data && sessionRes.data.session;
      if (!session) return;

      var profileRes = await window.SB
        .from('profiles')
        .select('niveau, poids, taille, pullups, pushups, dips, muscleup')
        .eq('id', session.user.id)
        .single();

      if (!profileRes.error && profileRes.data) {
        _userCtx = profileRes.data;
      }

      /* Enrich with local session history */
      var sessions = (typeof SW !== 'undefined') ? (SW.load('sessions') || []) : [];
      var consecutive = _countConsecutiveTrainingDays(sessions);
      _userCtx = Object.assign(_userCtx || {}, {
        consecutiveDays: consecutive,
        needsDeload: consecutive >= 28
      });
    } catch (e) {
      // Contexte non critique — continuer sans
    }
  }

  /* Count consecutive days with at least one session (up to today) */
  function _countConsecutiveTrainingDays(sessions) {
    if (!sessions || sessions.length === 0) return 0;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var daysWithSession = {};
    sessions.forEach(function(s) {
      if (!s.date) return;
      var d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      daysWithSession[d.getTime()] = true;
    });
    var count = 0;
    var cursor = new Date(today.getTime());
    while (true) {
      if (!daysWithSession[cursor.getTime()]) break;
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  /* ── DOM ──────────────────────────────── */
  function _render() {
    if (document.getElementById('swbot-container')) return;

    var el = document.createElement('div');
    el.id = 'swbot-container';
    el.innerHTML =
      '<button id="swbot-toggle" aria-label="Ouvrir le coach IA">' +
        '<span class="swbot-icon-open">Chat</span>' +
        '<span class="swbot-icon-close">✕</span>' +
        '<span class="swbot-badge" id="swbot-badge"></span>' +
      '</button>' +

      '<div id="swbot-box" class="swbot-box" aria-hidden="true">' +
        '<div class="swbot-header">' +
          '<div class="swbot-header-info">' +
            '<div class="swbot-avatar">SW</div>' +
            '<div>' +
              '<div class="swbot-name">SwBot</div>' +
              '<div class="swbot-status">Coach Street Workout IA</div>' +
            '</div>' +
          '</div>' +
          '<button class="swbot-close-btn" id="swbot-close" aria-label="Fermer">✕</button>' +
        '</div>' +

        '<div class="swbot-messages" id="swbot-messages" role="log" aria-live="polite"></div>' +

        '<div class="swbot-suggestions" id="swbot-suggestions">' +
          '<button type="button" data-q="Comment progresser en tractions\u00a0?">Progression tractions</button>' +
          '<button type="button" data-q="Génère-moi un programme Push">Programme Push</button>' +
          '<button type="button" data-q="Comment réussir le muscle-up\u00a0?">Muscle-up</button>' +
        '</div>' +

        '<div class="swbot-input-row">' +
          '<input type="text" id="swbot-input" placeholder="Pose ta question..." maxlength="500" autocomplete="off" aria-label="Message">' +
          '<button type="button" id="swbot-send" aria-label="Envoyer">➤</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(el);
  }

  function _bindEvents() {
    document.getElementById('swbot-toggle').addEventListener('click', toggle);
    document.getElementById('swbot-close').addEventListener('click', close);
    document.getElementById('swbot-send').addEventListener('click', send);

    document.getElementById('swbot-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    var sug = document.getElementById('swbot-suggestions');
    sug.addEventListener('click', function(e) {
      var btn = e.target.closest('button[data-q]');
      if (!btn) return;
      sug.style.display = 'none';
      _sendMessage(btn.getAttribute('data-q'));
    });
  }

  /* ── Visibility ───────────────────────── */
  function toggle() { _isOpen ? close() : open(); }

  function open() {
    _isOpen = true;
    var box = document.getElementById('swbot-box');
    box.style.display = 'flex';
    box.setAttribute('aria-hidden', 'false');
    document.querySelector('.swbot-icon-open').style.display = 'none';
    document.querySelector('.swbot-icon-close').style.display = 'block';
    document.getElementById('swbot-badge').style.display = 'none';
    document.getElementById('swbot-input').focus();
  }

  function close() {
    _isOpen = false;
    var box = document.getElementById('swbot-box');
    box.style.display = 'none';
    box.setAttribute('aria-hidden', 'true');
    document.querySelector('.swbot-icon-open').style.display = 'block';
    document.querySelector('.swbot-icon-close').style.display = 'none';
  }

  /* ── Messages ─────────────────────────── */
  function _addMessage(role, content) {
    _messages.push({
      role: role === 'bot' ? 'assistant' : 'user',
      content: content
    });

    var container = document.getElementById('swbot-messages');
    var msg = document.createElement('div');
    msg.className = 'swbot-msg swbot-msg--' + role;
    msg.textContent = content;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    if (!_isOpen && role === 'bot') {
      document.getElementById('swbot-badge').style.display = 'flex';
    }
  }

  function _showTyping() {
    var container = document.getElementById('swbot-messages');
    var el = document.createElement('div');
    el.className = 'swbot-msg swbot-msg--bot swbot-typing';
    el.id = 'swbot-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function _hideTyping() {
    var el = document.getElementById('swbot-typing');
    if (el) el.remove();
  }

  /* ── Send ─────────────────────────────── */
  function send() {
    var input = document.getElementById('swbot-input');
    var text = input.value.trim();
    if (!text || _isLoading) return;
    input.value = '';
    document.getElementById('swbot-suggestions').style.display = 'none';
    _sendMessage(text);
  }

  async function _sendMessage(text) {
    _addMessage('user', text);
    _isLoading = true;
    _showTyping();

    var recentMessages = _messages.slice(-10);

    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages,
          userContext: _userCtx
        })
      });

      var data = await res.json();
      _hideTyping();
      _addMessage('bot', data.reply || 'Pas de réponse.');

    } catch (err) {
      _hideTyping();
      _addMessage('bot', 'Connexion perdue. Vérifie ta connexion internet');
    } finally {
      _isLoading = false;
    }
  }

  /* ── Public API ───────────────────────── */
  return { init: init, open: open, close: close, toggle: toggle, send: send };

})();

document.addEventListener('DOMContentLoaded', function() { swbot.init(); });
