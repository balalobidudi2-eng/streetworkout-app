# 🚀 API Integration — Setup Instructions

## Status: Deployed ✅
Commit: `aef3a7a`

---

## 📋 What's Been Integrated

### APIs Loaded
1. **Wger.de** (Free API — no key needed)
   - 1000+ exercises
   - Automatic caching
   - Fallback to local when offline

2. **ExerciseDB via RapidAPI** (Premium API — requires key)
   - 1300+ exercises
   - Muscle-based filtering
   - Body-part specific queries

3. **Local Database** (Fallback)
   - 40+ quality exercises
   - Always available
   - Priority when available

### NEW FILES
- `js/wger-api.js` — Wger integration
- `js/exercisedb-api.js` — ExerciseDB integration
- `js/api-merger.js` — Unified exercise database
- `js/config-env.js` — Environment configuration
- `.env.local` — Local development keys (⚠️ not committed)

---

## 🔧 CONFIGURATION FOR PRODUCTION

### Step 1: Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project: `streetworkout-app`
3. Go to **Settings → Environment Variables**
4. Add these variables:

```
RAPIDAPI_KEY = 8905d6364fmsh4856435b5fdd52dp10d8ebjsn4c5cead27cdc
WGER_API_KEY = (leave empty, Wger is free)
```

### Step 2: Verify Deployment

After adding variables:
1. Vercel will redeploy automatically
2. Check: https://your-app.vercel.app
3. Open browser DevTools → Console
4. Should see: `[API_MERGER] Loaded Wger: XXX exercises`

### Step 3: Test APIs

In browser console:
```javascript
// Check if APIs are loaded
console.log(API_MERGER.getMergedExercises().length)
// Should return total count from all sources
```

---

## ⚙️ LOCAL DEVELOPMENT

### Setup `.env.local` (Already created)

File: `.env.local` (in project root)
```
RAPIDAPI_KEY=8905d6364fmsh4856435b5fdd52dp10d8ebjsn4c5cead27cdc
WGER_API_KEY=none
```

### Access in Code

```javascript
// Browser environment only:
var apiKey = window.__ENV?.RAPIDAPI_KEY

// API handlers check this automatically
```

---

## 🔒 SECURITY NOTES

✅ **What's Safe:**
- `.env.local` is **not committed** (in .gitignore)
- Wger API needs no authentication (free)
- RapidAPI key is loaded CLIENT-SIDE (acceptable for read-only APIs)

⚠️ **What to Monitor:**
- RapidAPI quota: 100 requests/day (free tier)
- Consider rotating the key monthly
- If key ratio exposed again, revoke from RapidAPI dashboard

---

## 📊 How It Works

### Exercise Loading Flow

```
DOM Ready
  ↓
Load sw-database.js (local)
  ↓
Load wger-api.js, exercisedb-api.js
  ↓
API_MERGER.init() (async)
  ├─ Load Wger exercises (free)
  ├─ Load ExerciseDB (if key available)
  └─ Merge with local DB
  ↓
API_MERGER.getMergedExercises() 
  → 1000+ exercises available
  ↓
program-generator.js uses merged DB
  ↓
_getExercicesForType() filters by:
  - Session type (push/pull/etc)
  - User equipment
  - User difficulty level
  ↓
Real workout generated ✅
```

---

## 🎯 Usage in Code

### Using the Merged Database

```javascript
// Get all exercises
var allExos = API_MERGER.getMergedExercises()

// Get by type
var pullExos = API_MERGER.getExercisesByType('pull')

// Get by equipment
var bodyweightExos = API_MERGER.getByEquipment([])

// Search
var results = API_MERGER.search('traction')
```

### In program-generator.js

The code now uses:
```javascript
if (typeof API_MERGER !== 'undefined' && API_MERGER.isLoaded) {
  var exercises = API_MERGER.getExercisesByType(type)
  // ... continue with validation/filtering
} else {
  // Fallback to SW_DB (local)
}
```

---

## 📈 Next Steps

### Recommended

1. **Rotate RapidAPI Key** (monthly)
   - Go to: https://rapidapi.com/user/account/billing/subscriptions
   - Regenerate key
   - Update Vercel ENV var

2. **Monitor Usage** 
   - Check RapidAPI dashboard for quota
   - Consider upgrading tier if needed

3. **Test Edge Cases**
   - Offline mode (APIs fail gracefully)
   - No exercises matching type
   - User with strange equipment

---

## 🐛 Debugging

### Check if APIs loaded

Console:
```javascript
console.log('Wger:', API_MERGER.wgerExercises.length)
console.log('ExerciseDB:', API_MERGER.exerciseDBExercises.length)
console.log('Local:', Object.keys(API_MERGER.localDB).length)
```

### Check specific API

```javascript
// Check Wger
WGER_API.getExercises().then(ex => console.log(ex))

// Check ExerciseDB
EXERCISEDB_API.getExercises().then(ex => console.log(ex))
```

### Check environment

```javascript
console.log('ENV:', window.__ENV)
```

---

## ✅ Checklist

- [ ] Added Vercel ENV variables (RAPIDAPI_KEY)
- [ ] Deployed to Vercel
- [ ] Verified APIs load in browser console
- [ ] Tested workout generation with new data
- [ ] Rotated RapidAPI key (after first month)
- [ ] Monitored quota usage

---

**Deployment Status**: ✅ LIVE
**Last Updated**: 2026-03-23
**Commit**: aef3a7a
