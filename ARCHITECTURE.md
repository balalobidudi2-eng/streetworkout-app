# 🏗️ Architecture — Street Workout App

**Date:** 23 Mars 2026  
**Commit:** `d2b2fc9` (feat: logique programmes SW_DB, swiper progression, UI exercices)  
**Stack:** Vanilla JavaScript + Supabase + Vercel  

---

## 📋 Vue d'ensemble

Application web de **progression en entraînement Street Workout** (calisthenics). Architecture **frontend-centric** avec backend Supabase pour authentification + persistance.

### Objectifs principaux
- 📊 Suivre la progression des exercices de calisthenics (skills)
- 🏋️ Générer des programmes d'entraînement personnalisés
- 📈 Analytics et tracking des performances
- 🎯 Gamification et déverrouillage de niveaux par skill

---

## 🗂️ Structure des dossiers

```
streetworkout-app/
├── 📄 Pages HTML (10 fichiers)
│   ├── index.html                 # Landing page
│   ├── login.html                 # Connexion Supabase
│   ├── auth-callback.html         # OAuth callback
│   ├── onboarding.html            # Onboarding utilisateur (v2)
│   ├── dashboard.html             # Accueil principal
│   ├── progression.html           # Progression des skills
│   ├── programme.html             # Génération de programmes
│   ├── entrainement.html          # Mode d'entraînement
│   ├── analytics.html             # Statistiques
│   ├── profil.html                # Profil utilisateur
│   ├── streetlifting.html         # Mode streetlifting
│   └── abonnement.html            # Plans d'abonnement
│
├── 🎨 CSS/ (11 fichiers + sous-dossier)
│   ├── base.css                   # Styles globaux
│   ├── base-v2.css                # Design system v2 (refondu)
│   ├── components.css             # Composants réutilisables
│   ├── layout.css                 # Layout et grilles
│   ├── animations.css             # Animations et transitions
│   ├── chatbot.css                # Chatbot IA
│   ├── workout-mode.css           # Mode entraînement
│   ├── skill-swiper.css           # Swiper progression (NEW)
│   └── pages/                     # CSS spécifique par page
│       ├── login.css
│       ├── onboarding.css
│       ├── dashboard.css
│       ├── progression.css
│       ├── programme.css
│       ├── entrainement.css
│       ├── profil.css
│       ├── streetlifting.css
│       └── landing.css
│
├── 🔧 JS/ (23 fichiers)
│   ├── ⚙️ Configuration & Auth
│   │   ├── supabase-config.js     # Connexion Supabase
│   │   ├── auth.js                # Gestion authentification
│   │   └── storage.js             # LocalStorage wrapper (SW global)
│   │
│   ├── 🎯 Core Business Logic
│   │   ├── sw-database.js         # Base de données exercices (NEW)
│   │   ├── program-generator.js   # Génération programmes (REWRITTEN)
│   │   ├── progression.js         # Logique progression + Supabase
│   │   ├── progression-v2.js      # UI skill cards + swiper
│   │   ├── skill-swiper.js        # Navigation swiper (NEW)
│   │   └── wger-client.js         # Client API Wger
│   │
│   ├── 📄 Page Logic (par page)
│   │   ├── dashboard.js
│   │   ├── programme.js
│   │   ├── entrainement.js
│   │   ├── profil.js
│   │   ├── analytics.js
│   │   ├── streetlifting.js
│   │   ├── onboarding.js
│   │   └── calendar.js
│   │
│   ├── 🛠️ Utilitaires
│   │   ├── nav.js                 # Navigation mobile/desktop
│   │   ├── timer.js               # Minuteur d'entraînement
│   │   ├── workout-mode.js        # Mode séance actif
│   │   ├── exercise-visuals.js    # SVG/visuals exercices
│   │   ├── export-pdf.js          # Export PDF
│   │   ├── chatbot.js             # Chatbot IA
│   │   └── calendar.js            # Calendrier
│   │
│   └── 📡 API Backend
│       └── api/
│           ├── chat.js            # Endpoint chat IA
│           └── wger.js            # Proxy Wger API
│
├── 📊 Autres dossiers
│   ├── assets/                    # Ressources images
│   ├── sql/                       # Fichiers migration Supabase
│   ├── .vercel/                   # Config Vercel
│   └── .git/                      # Repo Git
```

---

## 🎯 Pages principales et leurs fonctions

### 🔓 Authentification
- **`login.html`** → Connexion via Supabase (email/Google/GitHub)
- **`auth-callback.html`** → Callback OAuth
- **`onboarding.html`** → Onboarding utilisateur (NEW v2)

### 📊 Dashboards & Suivi
- **`dashboard.html`** → Accueil avec stats + quick actions
- **`progression.html`** → Progression des 14 skills (avec SkillSwiper) 
- **`analytics.html`** → Graphs + stats détaillées
- **`profil.html`** → Données utilisateur + paramètres

### 🏋️ Entraînement
- **`programme.html`** → Génération de programmes via SW_DB (NEW)
- **`entrainement.html`** → Mode séance actif (timer + exos)
- **`streetlifting.html`** → Mode compétition streetlifting
- **`calendar.html`** → Calendrier d'entraînement

### 💼 Business
- **`abonnement.html`** → Plans d'abonnement
- **`index.html`** → Landing page publique

---

## 🗄️ Modèle de données

### Skills (14 exercises de progression)
Chaque skill a un **ID unique** et **liste d'étapes/niveaux** (5-7 étapes progressives) :

```
Skills = [
  {id: 'pullups', name: 'Tractions', steps: [{id: 'pullups-1', name: '...', desc: '...'}, ...]},
  {id: 'muscleup', name: 'Muscle-up', steps: [...]},
  {id: 'frontlever', name: 'Front Lever', steps: [...]},
  {id: 'planche', name: 'Planche', steps: [...]},
  ...14 total
]
```

### Exercices (23 mouvements)
Base de données `SW_DB.exercices` avec structure détaillée :
- Pull : australian_row, tractions_bande, chin_up, pull_up, pull_up_leste
- Push : pompes_genoux, pompes_standard, pompes_declin, dips_chaise, dips_barres, dips_lestes, pike_pushup, hspu_mur
- Legs : squat_standard, jump_squat, pistol_squat_assist, pistol_squat
- Core : gainage_planche, hollow_body, l_sit_sol
- Skills : muscle_up_negatif, muscle_up_kipping, muscle_up_strict

### Templates de séances (7 types)
Chaque template a **5 niveaux** (debutant → elite) avec exercices + séries/reps/repos prescrits :
- **Push** → Pectoraux, Triceps, Épaules
- **Pull** → Grand dorsal, Biceps, Trapèze
- **Lower** → Jambes (Quadriceps, Fessiers, Mollets)
- **Upper** → Haut du corps (Push + Pull équilibré)
- **Full Body** → Corps complet
- **Skills** → Progression des mouvements avancés
- **Core** → Abdominaux profonds

### Objectifs modificateurs (4 orientations)
Chaque objectif modifie reps/sets/repos :
- **Force** : peu de reps (-2), plus de repos (+60s)
- **Hypertrophie** : volume moyen (reference)
- **Endurance** : beaucoup de reps (+5), peu de repos (-30s)
- **Street Workout** : équilibre neutre

---

## 🔗 Flux de données principaux

### 1️⃣ Authentification & Initialisation
```
LOGIN → Supabase Auth → JWT → localStorage → require Auth wrapper
   ↓
DASHBOARD → Check profile → Load _progData from Supabase
   ↓
RENDER Page-specific UI
```

### 2️⃣ Génération de programme
```
USER SELECT: type (push/pull/...) + niveau (debutant/...) + objectif + duree
   ↓
generateProgram(config) → SW_DB.templates[type][niveau]
   ↓
Apply modifiers (objectif_modifiers)
   ↓
_renderProgram() → ex-cards (NEW: clean card layout)
   ↓
saveGeneratedProgram() → localStorage
```

### 3️⃣ Progression & Skills
```
CLICK skill-card → SkillSwiper.open(skillId) [NEW]
   ↓
SWIPER renders steps with dots + validation
   ↓
VALIDATE step → updateStepStatus() → Supabase upsert
   ↓
_progData update → showSkillsList() refresh
```

### 4️⃣ Entraînement actif
```
START PROGRAM from programme.html
   ↓
WorkoutMode.init(currentProgram)
   ↓
Timer + Exercise display + Controls
   ↓
Track completion → Save stats → Analytics update
```

---

## 🎨 Design System

### Colors (Variables CSS)
```css
--bg-primary        /* Fond principal */
--bg-card           /* Cartes */
--bg-elevated       /* Surélevé */
--bg-tertiary       /* Tertiaire */
--text-primary      /* Texte principal */
--text-secondary    /* Texte secondaire */
--accent            /* Accent bleu */
--success           /* Vert succès */
--danger            /* Rouge danger */
--border            /* Bordures */
```

### Composants réutilisables
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- `.card`, `.card-header`, `.card-body`
- `.badge`, `.tag`
- `.input`, `.textarea`, `.select`
- `.modal`, `.overlay`
- `.skill-card`, `.level-item` (progression)
- `.ex-card` (NEW: exercice)
- `.swiper-card`, `.swiper-dot` (NEW: skill-swiper)

---

## 🔄 État global (Globals JavaScript)

### LocalStorage (via `storage.js`)
```javascript
SW = {
  save(key, value),     // localStorage[key] = JSON
  load(key),            // parse JSON
  clear()
}
```

### Supabase (via `supabase-config.js`)
```javascript
window.SB = Supabase.createClient(url, key)
```

### Authentification (via `auth.js`)
```javascript
window.auth = SB.auth        // Supabase Auth
requireAuth()                 // Wrapper pour pages protégées
logout()                      // Déconnexion
```

### Progression (via `progression.js`)
```javascript
EXERCISES[]           // Array des 14 skills + steps
_progUserId           // ID utilisateur authentifié
_progData{}           // Cache _progData[stepId] = 'mastered' | 'in-progress' | 'not-acquired'
```

### Programmes (via `program-generator.js` + `sw-database.js`)
```javascript
SW_DB                 // Exercices + Templates + Modifiers
SESSION_TYPES{}       // Types de séances: push, pull, lower, upper, full_body, skills, core
generateProgram()     // Sync function → retourne program object
```

### UI Progression (via `progression-v2.js` + `skill-swiper.js`)
```javascript
showSkillsList()      // Render cartes skills
SkillSwiper.open()    // Ouvre le swiper [NEW]
SkillSwiper.validate()// Valide une étape
```

---

## 📡 Intégrations externes

### Supabase (Backend)
- **Auth** : Authentification + JWT
- **Database** : 
  - `profiles` table (user data)
  - `progression_skills` table (étapes acquises)
  - Autres données (historique, etc.)
- **Real-time** : Optionnel pour sync multi-device

### Wger API (Exercice library)
- Client: `wger-client.js`
- Endpoint: `https://wger.de/api/v2/...`
- Usage: Optionnel pour enrichir l'exercice library

### Chat API (Internal)
- Endpoint: `api/chat.js`
- Chatbot IA pour conseils entraînement

### Vercel (Hosting)
- Déploiement automatique depuis GitHub
- Serverless functions (api/)

---

## 🔧 Architecture technique détaillée

### Layer 1: HTML Pages
Chaque page HTML :
- Charge `base.css` + `base-v2.css` (design system)
- Charge `layout.css` + `components.css` (composants)
- Charge `pages/[page].css` (styles spécifiques)
- Charge `supabase-config.js` (init)
- Charge `auth.js` (protège avec `requireAuth()`)
- Charge page-specific `.js` file
- Load helpers: `nav.js`, `storage.js`, etc.

### Layer 2: JS Modules (No bundler)
- **Vanilla JS** (pas de framework)
- **Globals** : Variables de fenêtre pour communication inter-modules
- **Sync + Async** : Mélange (await pour Supabase, Promise for fetch)
- **Pattern** : Module pattern (IIFE) ou simple globals

### Layer 3: CSS Architecture
- **Cascade** : base → components → layout → pages
- **Variables CSS** : Thème via `--var-name`
- **Responsive** : Mobile-first avec media queries
- **Animations** : Via CSS + @keyframes (animations.css)

### Layer 4: Backend (Supabase)
- **Auth** : JWT + session management
- **PostgreSQL DB** : Tables + RLS (Row Level Security)
- **Real-time Subscriptions** : Optional
- **Storage** : Fichiers (images, exports)

---

## 🚀 Flux de déploiement

```
Git Push → GitHub
   ↓
Vercel Detected → Build (js/css minify via Vercel)
   ↓
Deploy to vercel.app domain
   ↓
LIVE → Users access app
```

---

## 📊 Statistiques du projet

| Métrique | Valeur |
|----------|--------|
| Pages HTML | 10 |
| Fichiers CSS | 11 + 9 pages = 20 |
| Fichiers JS | 23 |
| Exercices (SW_DB) | 23 |
| Skills de progression | 14 |
| Templates de séances | 7 |
| Niveaux (par template) | 5 (debutant → elite) |
| Lignes code approx. | ~2500 JS + ~3500 CSS |

---

## 🎯 Fonctionnalités clés (post-refontes)

### ✅ Complétées (Phase 11 + REFONTE)
- [x] Authentification Supabase
- [x] Dashboard avec stats
- [x] 14 Skills avec progression (niveaux)
- [x] UI cards + accordion (progression-v2)
- [x] Design system v2 (base-v2.css)
- [x] Onboarding refactorisé
- [x] Chatbot IA intégré
- [x] PDF export
- [x] **NOUVEAU** : SW_DB (23 exercices réels + structure métier)
- [x] **NOUVEAU** : Program-generator v2 (templates par niveau)
- [x] **NOUVEAU** : SkillSwiper (navigation par etapes)
- [x] **NOUVEAU** : Ex-cards UI (affichage exercices)

### 🔲 TODO (futures phases)
- [ ] Synchronisation real-time Supabase (multi-device)
- [ ] Analyse vidéo (form check)
- [ ] Leaderboard communauté
- [ ] Workouts offline (Service Worker)
- [ ] Push notifications
- [ ] Wger API advanced (custom exos)

---

## 🔍 Points d'entrée clés

### Pour ajouter une nouvelle page
1. Créer `newpage.html`
2. Créer `css/pages/newpage.css`
3. Créer `js/newpage.js`
4. Importer dans HTML : `<link>` + `<script>`
5. Wrapper avec `requireAuth()` si protégée

### Pour modifier programme generation
- Éditer `js/sw-database.js` (exercices/templates)
- Éditer `js/program-generator.js` (logique)
- Test dans `programme.html`

### Pour modifier progression/skills
- Éditer `js/progression.js` (logique + Supabase)
- Éditer `js/progression-v2.js` (UI cards)
- Éditer `js/skill-swiper.js` (swiper modal)

---

**Dernière mise à jour:** 23 Mars 2026 — Commit `d2b2fc9`
