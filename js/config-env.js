/* ========================================
   CONFIG-ENV.JS — Environment variable loader
   Loads API keys from Vercel ENV (production) or localStorage (dev)
   ======================================== */

/* Initialize window.__ENV from Vercel environment */
if (typeof window !== 'undefined') {
  window.__ENV = window.__ENV || {};

  /* In Vercel, environment variables are injected */
  /* For local dev, they need to be set manually or via .env.local */

  /* Try to get from injected Vercel env */
  if (typeof process !== 'undefined' && process.env) {
    window.__ENV.RAPIDAPI_KEY = window.__ENV.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY;
    window.__ENV.WGER_API_KEY = window.__ENV.WGER_API_KEY || process.env.WGER_API_KEY;
  }

  /* Try to get from localStorage (development) */
  if (typeof localStorage !== 'undefined') {
    window.__ENV.RAPIDAPI_KEY = window.__ENV.RAPIDAPI_KEY || localStorage.getItem('env_rapidapi_key');
    window.__ENV.WGER_API_KEY = window.__ENV.WGER_API_KEY || localStorage.getItem('env_wger_key');
  }

  /* Log what we loaded */
  console.log('[CONFIG_ENV]', {
    hasRapidAPI: !!window.__ENV.RAPIDAPI_KEY,
    hasWger: !!window.__ENV.WGER_API_KEY
  });
}
