-- ============================================
-- Flow 365 - Complete Database Migration Script
-- Database: Supabase (PostgreSQL)
-- Privacy: NO PII (No names, emails, phones)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- DROP EXISTING TABLES (if re-running migration)
-- ============================================
-- Uncomment these lines if you want to start fresh
-- DROP TABLE IF EXISTS ai_insights CASCADE;
-- DROP TABLE IF EXISTS ai_predictions CASCADE;
-- DROP TABLE IF EXISTS predictions CASCADE;
-- DROP TABLE IF EXISTS lifestyle_logs CASCADE;
-- DROP TABLE IF EXISTS custom_symptoms CASCADE;
-- DROP TABLE IF EXISTS symptom_logs CASCADE;
-- DROP TABLE IF EXISTS mood_logs CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1️⃣ USERS TABLE (NO PII)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_premium BOOLEAN DEFAULT FALSE,
  average_cycle_length INTEGER DEFAULT 28,
  average_period_length INTEGER DEFAULT 5,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  insights_enabled BOOLEAN DEFAULT TRUE,
  onboarded BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- ============================================
-- 2️⃣ MOOD LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 100),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  emoji TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_logs_score ON mood_logs(user_id, mood_score);

-- ============================================
-- 3️⃣ SYMPTOM LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS symptom_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cycle_day INTEGER,
  symptoms JSONB DEFAULT '[]'::jsonb,
  moods TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  flow_intensity TEXT,
  discharge_type TEXT,
  pain_level TEXT,
  cravings TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_cycle ON symptom_logs(user_id, cycle_day);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_symptoms_gin ON symptom_logs USING GIN (symptoms);

-- ============================================
-- 4️⃣ CUSTOM SYMPTOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS custom_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_symptoms_user ON custom_symptoms(user_id);

-- ============================================
-- 5️⃣ LIFESTYLE LOGS TABLE (Optional - Future)
-- ============================================
CREATE TABLE IF NOT EXISTS lifestyle_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sleep_hours FLOAT,
  exercise_minutes INTEGER,
  water_intake_ml INTEGER,
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_lifestyle_logs_user_date ON lifestyle_logs(user_id, date DESC);

-- ============================================
-- 6️⃣ AI PREDICTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  predicted_mood INTEGER CHECK (predicted_mood >= 0 AND predicted_mood <= 100),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  prediction_date DATE NOT NULL,
  prediction_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_date ON ai_predictions(user_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(user_id, prediction_type);

-- ============================================
-- 7️⃣ CYCLE PREDICTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  next_period_date DATE NOT NULL,
  fertile_window_start DATE NOT NULL,
  fertile_window_end DATE NOT NULL,
  average_cycle_length INTEGER NOT NULL,
  average_period_length INTEGER NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_next_period ON predictions(user_id, next_period_date DESC);

-- ============================================
-- 8️⃣ AI INSIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_read ON ai_insights(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(user_id, type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (if re-running)
-- ============================================
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can manage own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can manage own symptom logs" ON symptom_logs;
DROP POLICY IF EXISTS "Users can manage own custom symptoms" ON custom_symptoms;
DROP POLICY IF EXISTS "Users can manage own lifestyle logs" ON lifestyle_logs;
DROP POLICY IF EXISTS "Users can view own predictions" ON ai_predictions;
DROP POLICY IF EXISTS "System can insert predictions" ON ai_predictions;
DROP POLICY IF EXISTS "Users can manage own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can update own insights" ON ai_insights;
DROP POLICY IF EXISTS "System can insert insights" ON ai_insights;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Mood logs
CREATE POLICY "Users can manage own mood logs" ON mood_logs
  FOR ALL USING (auth.uid() = user_id);

-- Symptom logs  
CREATE POLICY "Users can manage own symptom logs" ON symptom_logs
  FOR ALL USING (auth.uid() = user_id);

-- Custom symptoms
CREATE POLICY "Users can manage own custom symptoms" ON custom_symptoms
  FOR ALL USING (auth.uid() = user_id);

-- Lifestyle logs
CREATE POLICY "Users can manage own lifestyle logs" ON lifestyle_logs
  FOR ALL USING (auth.uid() = user_id);

-- AI predictions
CREATE POLICY "Users can view own predictions" ON ai_predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert predictions" ON ai_predictions
  FOR INSERT WITH CHECK (true);

-- Cycle predictions
CREATE POLICY "Users can manage own predictions" ON predictions
  FOR ALL USING (auth.uid() = user_id);

-- AI insights
CREATE POLICY "Users can view own insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON ai_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights" ON ai_insights
  FOR INSERT WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Created 8 tables with proper indexes';
  RAISE NOTICE '🔐 Row Level Security enabled';
  RAISE NOTICE '🚀 Database ready for production';
  RAISE NOTICE '⚠️  NO PII collected (privacy-first design)';
END $$;
