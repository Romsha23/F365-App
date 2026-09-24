-- ================================
-- PREGNANCY & POSTPARTUM DATABASE TABLES
-- ================================
-- Run this in Supabase SQL Editor after SETUP_DATABASE.sql
-- Dashboard: https://supabase.com/dashboard/project/dibuhpxjzgaxvvrbkofk/sql

-- ================================
-- PREGNANCY PROFILES
-- ================================
CREATE TABLE IF NOT EXISTS pregnancy_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  last_period_date DATE,
  conception_date DATE,
  current_week INTEGER DEFAULT 1,
  blood_type TEXT,
  rh_factor TEXT CHECK (rh_factor IN ('positive', 'negative')),
  complications TEXT[] DEFAULT ARRAY[]::TEXT[],
  medications TEXT[] DEFAULT ARRAY[]::TEXT[],
  doctor_name TEXT,
  doctor_phone TEXT,
  hospital TEXT,
  birth_plan TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_profiles_user ON pregnancy_profiles(user_id);
ALTER TABLE pregnancy_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pregnancy profile" ON pregnancy_profiles;
DROP POLICY IF EXISTS "Users can insert own pregnancy profile" ON pregnancy_profiles;
DROP POLICY IF EXISTS "Users can update own pregnancy profile" ON pregnancy_profiles;
DROP POLICY IF EXISTS "Users can delete own pregnancy profile" ON pregnancy_profiles;

CREATE POLICY "Users can view own pregnancy profile" ON pregnancy_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pregnancy profile" ON pregnancy_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pregnancy profile" ON pregnancy_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pregnancy profile" ON pregnancy_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- PREGNANCY DAY LOGS
-- ================================
CREATE TABLE IF NOT EXISTS pregnancy_day_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  week INTEGER NOT NULL,
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  mood TEXT NOT NULL,
  weight NUMERIC(5,2),
  blood_pressure TEXT,
  kick_count INTEGER,
  water_intake INTEGER,
  sleep NUMERIC(3,1),
  exercise TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_day_logs_user_date ON pregnancy_day_logs(user_id, date DESC);
ALTER TABLE pregnancy_day_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pregnancy logs" ON pregnancy_day_logs;
DROP POLICY IF EXISTS "Users can insert own pregnancy logs" ON pregnancy_day_logs;
DROP POLICY IF EXISTS "Users can update own pregnancy logs" ON pregnancy_day_logs;
DROP POLICY IF EXISTS "Users can delete own pregnancy logs" ON pregnancy_day_logs;

CREATE POLICY "Users can view own pregnancy logs" ON pregnancy_day_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pregnancy logs" ON pregnancy_day_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pregnancy logs" ON pregnancy_day_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pregnancy logs" ON pregnancy_day_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- PREGNANCY APPOINTMENTS
-- ================================
CREATE TABLE IF NOT EXISTS pregnancy_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ultrasound', 'checkup', 'lab', 'specialist', 'other')),
  provider TEXT NOT NULL,
  notes TEXT,
  weight NUMERIC(5,2),
  blood_pressure TEXT,
  baby_heart_rate INTEGER,
  fundal_height NUMERIC(4,1),
  estimated_weight NUMERIC(6,1),
  next_appointment DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_appointments_user ON pregnancy_appointments(user_id, date DESC);
ALTER TABLE pregnancy_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pregnancy appointments" ON pregnancy_appointments;
DROP POLICY IF EXISTS "Users can insert own pregnancy appointments" ON pregnancy_appointments;
DROP POLICY IF EXISTS "Users can update own pregnancy appointments" ON pregnancy_appointments;
DROP POLICY IF EXISTS "Users can delete own pregnancy appointments" ON pregnancy_appointments;

CREATE POLICY "Users can view own pregnancy appointments" ON pregnancy_appointments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pregnancy appointments" ON pregnancy_appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pregnancy appointments" ON pregnancy_appointments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pregnancy appointments" ON pregnancy_appointments
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- KICK COUNT SESSIONS
-- ================================
CREATE TABLE IF NOT EXISTS kick_count_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  kick_count INTEGER DEFAULT 0,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kick_count_sessions_user ON kick_count_sessions(user_id, date DESC);
ALTER TABLE kick_count_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own kick sessions" ON kick_count_sessions;
DROP POLICY IF EXISTS "Users can insert own kick sessions" ON kick_count_sessions;
DROP POLICY IF EXISTS "Users can update own kick sessions" ON kick_count_sessions;
DROP POLICY IF EXISTS "Users can delete own kick sessions" ON kick_count_sessions;

CREATE POLICY "Users can view own kick sessions" ON kick_count_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kick sessions" ON kick_count_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kick sessions" ON kick_count_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kick sessions" ON kick_count_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- CONTRACTION TIMERS
-- ================================
CREATE TABLE IF NOT EXISTS contraction_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timer_id UUID NOT NULL REFERENCES contraction_timers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  intensity TEXT CHECK (intensity IN ('mild', 'moderate', 'strong')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contraction_timers_user ON contraction_timers(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_contractions_timer ON contractions(timer_id);
ALTER TABLE contraction_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contraction timers" ON contraction_timers;
DROP POLICY IF EXISTS "Users can insert own contraction timers" ON contraction_timers;
DROP POLICY IF EXISTS "Users can delete own contraction timers" ON contraction_timers;
DROP POLICY IF EXISTS "Users can view own contractions" ON contractions;
DROP POLICY IF EXISTS "Users can insert own contractions" ON contractions;
DROP POLICY IF EXISTS "Users can update own contractions" ON contractions;

CREATE POLICY "Users can view own contraction timers" ON contraction_timers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contraction timers" ON contraction_timers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own contraction timers" ON contraction_timers
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own contractions" ON contractions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contractions" ON contractions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contractions" ON contractions
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- POSTPARTUM PROFILES
-- ================================
CREATE TABLE IF NOT EXISTS postpartum_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('vaginal', 'c_section', 'vbac')),
  complications TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_breastfeeding BOOLEAN DEFAULT FALSE,
  is_pumping BOOLEAN DEFAULT FALSE,
  six_week_checkup DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_postpartum_profiles_user ON postpartum_profiles(user_id);
ALTER TABLE postpartum_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own postpartum profile" ON postpartum_profiles;
DROP POLICY IF EXISTS "Users can insert own postpartum profile" ON postpartum_profiles;
DROP POLICY IF EXISTS "Users can update own postpartum profile" ON postpartum_profiles;

CREATE POLICY "Users can view own postpartum profile" ON postpartum_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own postpartum profile" ON postpartum_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own postpartum profile" ON postpartum_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- POSTPARTUM DAY LOGS
-- ================================
CREATE TABLE IF NOT EXISTS postpartum_day_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weeks_postpartum INTEGER NOT NULL,
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  mood TEXT NOT NULL,
  weight NUMERIC(5,2),
  blood_pressure TEXT,
  bleeding_level TEXT CHECK (bleeding_level IN ('spotting', 'light', 'moderate', 'heavy')),
  sleep NUMERIC(3,1),
  exercise TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_postpartum_day_logs_user ON postpartum_day_logs(user_id, date DESC);
ALTER TABLE postpartum_day_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own postpartum logs" ON postpartum_day_logs;
DROP POLICY IF EXISTS "Users can insert own postpartum logs" ON postpartum_day_logs;
DROP POLICY IF EXISTS "Users can update own postpartum logs" ON postpartum_day_logs;

CREATE POLICY "Users can view own postpartum logs" ON postpartum_day_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own postpartum logs" ON postpartum_day_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own postpartum logs" ON postpartum_day_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- EMERGENCY CONTACTS
-- ================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Users can insert own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Users can update own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Users can delete own emergency contacts" ON emergency_contacts;

CREATE POLICY "Users can view own emergency contacts" ON emergency_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emergency contacts" ON emergency_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emergency contacts" ON emergency_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emergency contacts" ON emergency_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- BABY PROFILES
-- ================================
CREATE TABLE IF NOT EXISTS baby_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_weight NUMERIC(5,2),
  birth_length NUMERIC(4,1),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baby_profiles_user ON baby_profiles(user_id);
ALTER TABLE baby_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own baby profiles" ON baby_profiles;
DROP POLICY IF EXISTS "Users can insert own baby profiles" ON baby_profiles;
DROP POLICY IF EXISTS "Users can update own baby profiles" ON baby_profiles;

CREATE POLICY "Users can view own baby profiles" ON baby_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own baby profiles" ON baby_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own baby profiles" ON baby_profiles
  FOR UPDATE USING (auth.uid() = user_id);
