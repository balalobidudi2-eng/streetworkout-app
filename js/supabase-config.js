/* ========================================
   SUPABASE-CONFIG.JS — Client Supabase
   ========================================
   INSTRUCTIONS :
   1. Va sur https://supabase.com → New Project
   2. Copie ton Project URL et ta clé anon (Settings → API)
   3. Remplace les valeurs ci-dessous
   ======================================== */

var SUPABASE_URL = 'https://tahuyewnuizejbkmqlcb.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_S8w-lAydkOh95SgDADx0pw_Bf9x-Z2S';

/* Initialise le client Supabase (global) */
var SB = null;

(function() {
  /* Ne pas créer le client si les credentials sont encore des placeholders */
  var urlOk = SUPABASE_URL && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('REMPLACER');
  var keyOk = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('REMPLACER');

  if (!urlOk || !keyOk) {
    console.warn('⚠️ Supabase non configuré — mets les vraies clés dans supabase-config.js');
    return;
  }

  if (typeof supabase !== 'undefined' && supabase.createClient) {
    SB = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Supabase JS non chargé. Vérifie le CDN.');
  }
})();
