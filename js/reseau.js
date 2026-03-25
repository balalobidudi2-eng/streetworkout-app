/* js/reseau.js — Module réseau/social de FORGE
   Dépendances : SW_AUTH, SW_STORAGE, SW_PROFIL (pour showToast)
*/
var SW_RESEAU = (function () {
  'use strict';

  var myEmail      = null;
  var currentChat  = null;   /* { type:'dm'|'group', with: email|groupId, title: string } */
  var pollTimer    = null;
  var lastMsgCount = 0;

  /* ── Public entry point ── */
  function init() {
    myEmail = SW_AUTH.getCurrentEmail();
    if (!myEmail) return;

    _bindSearch();
    _bindChat();
    _bindGroups();

    /* Load home panel when réseau tab is clicked */
    var reseauBtn = document.querySelector('[data-tab="reseau"]');
    if (reseauBtn) {
      reseauBtn.addEventListener('click', async function () {
        await ensureRegistered();
        loadMainPanel();
        _startPolling();
      });
    }

    /* Stop polling when leaving réseau */
    document.querySelectorAll('.tab-btn:not([data-tab="reseau"])').forEach(function (btn) {
      btn.addEventListener('click', _stopPolling);
    });
  }

  var kvAvailable = null; /* null = unknown, true/false after first check */

  /* ── Public: update profile when user saves it ── */
  function refreshProfile(prenom, nom, username) {
    if (myEmail) registerPublicProfile(prenom, nom, username);
  }

  /* ════════════════════════════════════════
     SERVER HELPERS
  ════════════════════════════════════════ */
  async function registerPublicProfile(prenom, nom, username) {
    try {
      var users = JSON.parse(localStorage.getItem('sw_users') || '{}');
      var since = (users[myEmail] && users[myEmail].since) ? users[myEmail].since : new Date().toISOString().slice(0, 10);
      var r = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email: myEmail, prenom: prenom || '', nom: nom || '', username: username || '', since: since })
      });
      kvAvailable = r.status !== 503;
    } catch (e) {
      kvAvailable = false;
    }
  }

  async function apiGet(params) {
    try {
      var qs = Object.entries(params).map(function (kv) {
        return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]);
      }).join('&');
      var r = await fetch('/api/social?' + qs);
      if (r.status === 503) return { _kvError: true };
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  }

  async function apiPost(body) {
    try {
      var r = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  }

  /* ════════════════════════════════════════
     SEARCH
  ════════════════════════════════════════ */
  function _bindSearch() {
    var btn   = document.getElementById('reseau-search-btn');
    var input = document.getElementById('reseau-search-input');
    if (btn)   btn.addEventListener('click', _doSearch);
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') _doSearch(); });
  }

  async function _doSearch() {
    var q = (document.getElementById('reseau-search-input').value || '').trim();
    var el = document.getElementById('reseau-search-results');
    if (!el) return;
    if (q.length < 2) { el.innerHTML = ''; return; }

    el.innerHTML = '<p class="reseau-empty">Recherche…</p>';
    var results = await apiGet({ action: 'search', q: q, caller: myEmail });

    if (results && results._kvError) {
      el.innerHTML = '<p class="reseau-empty reseau-kv-warn">⚠️ Service réseau non disponible. Activez <strong>Vercel KV</strong> dans votre dashboard Vercel pour utiliser cette fonctionnalité.</p>';
      return;
    }
    if (!results || !results.length) {
      el.innerHTML = '<p class="reseau-empty">Aucun résultat. L\'utilisateur doit ouvrir l\'onglet Réseau au moins une fois pour être trouvable.</p>';
      return;
    }

    el.innerHTML = results.map(function (u) {
      var name = _displayName(u);
      var initials = name[0] ? name[0].toUpperCase() : '?';
      return (
        '<div class="reseau-user-row">' +
        '<div class="reseau-avatar">' + esc(initials) + '</div>' +
        '<div class="reseau-user-info"><div class="reseau-user-name">' + esc(name) + '</div>' +
        '<div class="reseau-user-email">' + esc(u.email) + '</div></div>' +
        '<button class="btn-add-friend" data-email="' + esc(u.email) + '">+ Ajouter</button>' +
        '</div>'
      );
    }).join('');

    el.querySelectorAll('.btn-add-friend').forEach(function (btn) {
      btn.addEventListener('click', function () { _sendFriendRequest(btn.dataset.email, btn); });
    });
  }

  async function _sendFriendRequest(toEmail, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    var r = await apiPost({ action: 'friend_request', from: myEmail, to: toEmail });
    if (btn) {
      if (r && r.ok) { btn.textContent = '✓ Envoyée'; btn.style.color = 'var(--accent)'; }
      else           { btn.disabled = false; btn.textContent = '+ Ajouter'; }
    }
  }

  /* ════════════════════════════════════════
     MAIN PANEL
  ════════════════════════════════════════ */
  function loadMainPanel() {
    var banner = document.getElementById('reseau-kv-banner');
    if (banner) banner.style.display = (kvAvailable === false) ? 'block' : 'none';
    _loadRequests();
    _loadFriends();
    _loadGroups();
  }

  async function _loadRequests() {
    var section = document.getElementById('reseau-requests-section');
    var listEl  = document.getElementById('reseau-requests-list');
    var data    = await apiGet({ action: 'get_requests', email: myEmail });

    if (!data || data._kvError || !data.length) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = 'block';

    listEl.innerHTML = data.map(function (req) {
      var p = req.profile || {};
      var name = _displayName(p) || req.from;
      return (
        '<div class="reseau-user-row">' +
        '<div class="reseau-avatar">' + esc((name[0] || '?').toUpperCase()) + '</div>' +
        '<div class="reseau-user-info"><div class="reseau-user-name">' + esc(name) + '</div>' +
        '<div class="reseau-user-email">Demande reçue</div></div>' +
        '<button class="btn-accept reseau-req-accept" data-from="' + esc(req.from) + '">✓</button>' +
        '<button class="btn-reject reseau-req-reject" data-from="' + esc(req.from) + '">✗</button>' +
        '</div>'
      );
    }).join('');

    listEl.querySelectorAll('.reseau-req-accept').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await apiPost({ action: 'accept_friend', email: myEmail, from: btn.dataset.from });
        _toast('Ami ajouté !');
        loadMainPanel();
      });
    });
    listEl.querySelectorAll('.reseau-req-reject').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await apiPost({ action: 'reject_friend', email: myEmail, from: btn.dataset.from });
        _loadRequests();
      });
    });
  }

  async function _loadFriends() {
    var listEl  = document.getElementById('reseau-friends-list');
    if (!listEl) return;
    var friends = await apiGet({ action: 'get_friends', email: myEmail });

    if (friends && friends._kvError) {
      listEl.innerHTML = '<p class="reseau-empty reseau-kv-warn">⚠️ Service réseau non disponible — activez Vercel KV.</p>';
      return;
    }
    if (!friends || !friends.length) {
      listEl.innerHTML = '<p class="reseau-empty">Aucun ami pour l\'instant. Recherche des utilisateurs ci-dessus.</p>';
      return;
    }

    listEl.innerHTML = friends.map(function (f) {
      var name = _displayName(f);
      return (
        '<div class="reseau-friend-row">' +
        '<div class="reseau-avatar">' + esc((name[0] || '?').toUpperCase()) + '</div>' +
        '<div class="reseau-user-info"><div class="reseau-user-name">' + esc(name) + '</div></div>' +
        '<button class="btn-dm" data-email="' + esc(f.email) + '" data-name="' + esc(name) + '">💬</button>' +
        '</div>'
      );
    }).join('');

    listEl.querySelectorAll('.btn-dm').forEach(function (btn) {
      btn.addEventListener('click', function () { openDM(btn.dataset.email, btn.dataset.name); });
    });
  }

  async function _loadGroups() {
    var listEl = document.getElementById('reseau-convos-list');
    if (!listEl) return;
    var groups = await apiGet({ action: 'get_groups', email: myEmail });

    if (groups && groups._kvError) { listEl.innerHTML = ''; return; }
    if (!groups || !groups.length) {
      listEl.innerHTML = '<p class="reseau-empty">Aucune conversation de groupe.</p>';
      return;
    }

    listEl.innerHTML = groups.map(function (g) {
      if (!g) return '';
      return (
        '<div class="reseau-group-row">' +
        '<div class="reseau-avatar reseau-avatar-group">👥</div>' +
        '<div class="reseau-user-info"><div class="reseau-user-name">' + esc(g.name) + '</div>' +
        '<div class="reseau-user-email">' + g.members.length + ' membres</div></div>' +
        '<button class="btn-dm" data-id="' + esc(g.id) + '" data-name="' + esc(g.name) + '">💬</button>' +
        '</div>'
      );
    }).join('');

    listEl.querySelectorAll('.btn-dm').forEach(function (btn) {
      btn.addEventListener('click', function () { openGroup(btn.dataset.id, btn.dataset.name); });
    });
  }

  /* ════════════════════════════════════════
     CHAT
  ════════════════════════════════════════ */
  function _bindChat() {
    var backBtn  = document.getElementById('chat-back');
    var sendBtn  = document.getElementById('chat-send');
    var inputEl  = document.getElementById('chat-input');
    if (backBtn) backBtn.addEventListener('click', showMainPanel);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (inputEl) inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(); });
  }

  function openDM(email, displayName) {
    currentChat  = { type: 'dm', with: email, title: displayName };
    lastMsgCount = 0;
    var t = document.getElementById('chat-title');
    if (t) t.textContent = displayName;
    _showPanel('chat');
    loadChatMessages(true);
    _startPolling();
  }

  function openGroup(id, name) {
    currentChat  = { type: 'group', with: id, title: name };
    lastMsgCount = 0;
    var t = document.getElementById('chat-title');
    if (t) t.textContent = name;
    _showPanel('chat');
    loadChatMessages(true);
    _startPolling();
  }

  async function loadChatMessages(scroll) {
    if (!currentChat) return;
    var msgs = null;
    if (currentChat.type === 'dm') {
      msgs = await apiGet({ action: 'get_dm', email: myEmail, with: currentChat.with });
    } else {
      msgs = await apiGet({ action: 'get_group_msgs', email: myEmail, group: currentChat.with });
    }

    var container = document.getElementById('chat-messages');
    if (!container) return;

    if (!msgs || !msgs.length) {
      container.innerHTML = '<p class="reseau-empty" style="margin:24px 0;">Aucun message. Commencez la conversation !</p>';
      lastMsgCount = 0;
      return;
    }

    if (msgs.length !== lastMsgCount || scroll) {
      lastMsgCount = msgs.length;
      container.innerHTML = msgs.map(function (msg) {
        var mine = (msg.from === myEmail);
        var time = new Date(msg.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        var fromLabel = (!mine && currentChat.type === 'group')
          ? '<div class="chat-from">' + esc(msg.from) + '</div>' : '';
        return (
          '<div class="chat-msg ' + (mine ? 'mine' : 'other') + '">' +
          fromLabel +
          '<div class="chat-bubble">' + esc(msg.text) + '</div>' +
          '<div class="chat-time">' + time + '</div>' +
          '</div>'
        );
      }).join('');
      if (scroll) container.scrollTop = container.scrollHeight;
    }
  }

  async function sendMessage() {
    if (!currentChat) return;
    var input = document.getElementById('chat-input');
    if (!input) return;
    var text = (input.value || '').trim();
    if (!text) return;
    input.value = '';

    var r = null;
    if (currentChat.type === 'dm') {
      r = await apiPost({ action: 'send_message', from: myEmail, to: currentChat.with, text: text });
    } else {
      r = await apiPost({ action: 'send_group_msg', group: currentChat.with, from: myEmail, text: text });
    }
    if (r && r.ok) loadChatMessages(true);
    else           input.value = text; /* restore if failed */
  }

  /* ════════════════════════════════════════
     GROUP CREATION
  ════════════════════════════════════════ */
  function _bindGroups() {
    var createBtn = document.getElementById('reseau-create-group');
    var groupBack = document.getElementById('group-back');
    var groupOk   = document.getElementById('group-create-btn');
    if (createBtn) createBtn.addEventListener('click', _showCreateGroup);
    if (groupBack) groupBack.addEventListener('click', showMainPanel);
    if (groupOk)   groupOk.addEventListener('click', _doCreateGroup);
  }

  async function _showCreateGroup() {
    _showPanel('group');
    /* Populate friend checkboxes */
    var listEl  = document.getElementById('group-member-list');
    var friends = await apiGet({ action: 'get_friends', email: myEmail });
    if (!listEl) return;
    if (!friends || friends._kvError || !friends.length) {
      listEl.innerHTML = '<p class="reseau-empty">Ajoutez des amis pour créer un groupe.</p>';
      return;
    }
    listEl.innerHTML = friends.map(function (f) {
      var name = _displayName(f);
      return (
        '<label class="group-member-row">' +
        '<input type="checkbox" class="group-member-check" value="' + esc(f.email) + '">' +
        '<span>' + esc(name) + '</span></label>'
      );
    }).join('');
  }

  async function _doCreateGroup() {
    var nameInput = document.getElementById('group-name-input');
    var name      = nameInput ? (nameInput.value || '').trim() : '';
    if (!name) { _toast('Entrez un nom de groupe'); return; }

    var checked = Array.from(document.querySelectorAll('.group-member-check:checked'));
    if (!checked.length) { _toast('Sélectionnez au moins un membre'); return; }

    var members = checked.map(function (c) { return c.value; });
    var r = await apiPost({ action: 'create_group', creator: myEmail, name: name, members: members });
    if (r && r.ok) { _toast('Groupe créé !'); showMainPanel(); }
    else           { _toast('Erreur lors de la création'); }
  }

  /* ════════════════════════════════════════
     PANEL NAVIGATION
  ════════════════════════════════════════ */
  function _showPanel(name) {
    document.querySelectorAll('.reseau-panel').forEach(function (p) { p.style.display = 'none'; });
    var target = document.getElementById('reseau-panel-' + name);
    if (target) target.style.display = 'block';
  }

  function showMainPanel() {
    _stopPolling();
    currentChat = null;
    _showPanel('main');
    loadMainPanel();
  }

  /* ════════════════════════════════════════
     POLLING
  ════════════════════════════════════════ */
  function _startPolling() {
    _stopPolling();
    if (currentChat) {
      pollTimer = setInterval(function () { loadChatMessages(false); }, 5000);
    }
  }

  function _stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  /* ════════════════════════════════════════
     UTILITIES
  ════════════════════════════════════════ */
  function _displayName(u) {
    if (!u) return '';
    return ((u.prenom || '') + ' ' + (u.nom || '')).trim() || u.email || '';
  }

  function _toast(msg) {
    if (typeof SW_PROFIL !== 'undefined' && SW_PROFIL.showToast) {
      SW_PROFIL.showToast(msg);
    }
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = String(str || '');
    return d.innerHTML;
  }

  /* ── Public: force-register current user in KV with latest profile data ── */
  async function ensureRegistered() {
    if (!myEmail) return;
    /* Read from form fields first (most current), fall back to localStorage */
    var prenomEl    = document.getElementById('input-prenom');
    var nomEl       = document.getElementById('input-nom');
    var usernameEl  = document.getElementById('input-username');
    var p           = SW_STORAGE.load('sw_profil') || {};
    var prenom      = (prenomEl   && prenomEl.value.trim())   || p.prenom   || '';
    var nom         = (nomEl      && nomEl.value.trim())      || p.nom      || '';
    var username    = (usernameEl && usernameEl.value.trim()) || p.username || '';
    await registerPublicProfile(prenom, nom, username);
  }

  return {
    init:             init,
    refreshProfile:   refreshProfile,
    ensureRegistered: ensureRegistered,
    showMainPanel:    showMainPanel,
    loadChatMessages: loadChatMessages,
  };
})();
