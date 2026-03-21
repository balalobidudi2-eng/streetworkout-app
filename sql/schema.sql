-- ========================================
-- STREETWORKOUT-APP — Supabase Schema
-- Coller ce SQL dans : Supabase → SQL Editor → New Query → Run
-- ========================================

-- Table profils utilisateur
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  prenom TEXT,
  email TEXT,
  avatar_url TEXT,
  poids NUMERIC(5,2),
  taille INTEGER,
  age INTEGER,
  sexe TEXT CHECK (sexe IN ('homme','femme','autre')),
  imc NUMERIC(4,2),
  masse_grasse_pct NUMERIC(4,1),
  masse_musculaire_kg NUMERIC(5,2),
  tour_taille INTEGER,
  tour_hanches INTEGER,
  tour_poitrine INTEGER,
  annees_pratique NUMERIC(4,1),
  frequence_semaine INTEGER CHECK (frequence_semaine BETWEEN 1 AND 7),
  duree_seance_min INTEGER,
  objectifs TEXT[],
  objectif_poids_cible NUMERIC(5,2),
  blessures TEXT,
  zones_sensibles TEXT[],
  restrictions TEXT,
  mobilite_epaules INTEGER CHECK (mobilite_epaules BETWEEN 1 AND 5),
  mobilite_hanches INTEGER CHECK (mobilite_hanches BETWEEN 1 AND 5),
  mobilite_poignets INTEGER CHECK (mobilite_poignets BETWEEN 1 AND 5),
  niveau TEXT DEFAULT 'debutant'
    CHECK (niveau IN ('debutant','novice','intermediaire','avance','elite')),
  score_global INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'gratuit' CHECK (plan IN ('gratuit','standard','premium'))
);

-- Table performances (records personnels)
CREATE TABLE performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exercice TEXT NOT NULL,
  reps INTEGER,
  poids_ajoute NUMERIC(6,2) DEFAULT 0,
  poids_total NUMERIC(6,2),
  type_lest TEXT,
  notes TEXT,
  fatigue INTEGER CHECK (fatigue BETWEEN 1 AND 5),
  qualite INTEGER CHECK (qualite BETWEEN 1 AND 5),
  est_record BOOLEAN DEFAULT FALSE
);

-- Table sessions d'entraînement
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  type_seance TEXT,
  nom_custom TEXT,
  duree_min INTEGER,
  volume_total NUMERIC(8,2),
  notes TEXT,
  humeur INTEGER CHECK (humeur BETWEEN 1 AND 5),
  exercices JSONB DEFAULT '[]'::jsonb
);

-- Table progression skills
CREATE TABLE progression_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exercice TEXT NOT NULL,
  etape_index INTEGER NOT NULL,
  statut TEXT DEFAULT 'non_acquis'
    CHECK (statut IN ('non_acquis','en_cours','maitrise')),
  date_maitrise DATE,
  notes TEXT,
  UNIQUE(user_id, exercice, etape_index)
);

-- Table mesures corporelles (historique)
CREATE TABLE mesures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  poids NUMERIC(5,2),
  masse_grasse_pct NUMERIC(4,1),
  tour_taille INTEGER,
  tour_hanches INTEGER,
  tour_bras INTEGER,
  tour_cuisse INTEGER,
  notes TEXT
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own performances" ON performances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own sessions" ON sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own progression" ON progression_skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own mesures" ON mesures FOR ALL USING (auth.uid() = user_id);

-- Trigger auto-création profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, prenom)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
