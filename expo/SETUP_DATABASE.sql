-- ================================
-- SUPABASE DATABASE SETUP
-- ================================
-- Copy this entire script and run it in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/dibuhpxjzgaxvvrbkofk/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,
  email TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  average_cycle_length INTEGER DEFAULT 28,
  average_period_length INTEGER DEFAULT 5,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  insights_enabled BOOLEAN DEFAULT TRUE,
  onboarded BOOLEAN DEFAULT FALSE
);

-- Safety net: If table already existed, add missing columns
-- (CREATE TABLE IF NOT EXISTS won't add columns to an existing table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_cycle_length INTEGER DEFAULT 28;
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_period_length INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS insights_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;

-- NOTE: Email is stored encrypted at rest by Supabase (AES-256)
-- and encrypted in transit via TLS/SSL.
-- To add the email column to an existing table, run:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- Create custom_symptoms table
CREATE TABLE IF NOT EXISTS custom_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create symptom_logs table
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

-- Create mood_logs table
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_type TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 0 AND mood_score <= 100),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lifestyle_logs table
CREATE TABLE IF NOT EXISTS lifestyle_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  sleep_hours NUMERIC(3,1),
  exercise_minutes INTEGER,
  water_intake_ml INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create predictions table
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

-- Create ai_insights table
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

-- Create ai_predictions table for mood predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  predicted_mood NUMERIC(3,1),
  confidence NUMERIC(3,2),
  prediction_date DATE NOT NULL,
  prediction_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON symptom_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_symptoms_user ON custom_symptoms(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id, read);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_lifestyle_logs_user_date ON lifestyle_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_date ON ai_predictions(user_id, prediction_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can view own symptoms" ON custom_symptoms;
DROP POLICY IF EXISTS "Users can insert own symptoms" ON custom_symptoms;
DROP POLICY IF EXISTS "Users can update own symptoms" ON custom_symptoms;
DROP POLICY IF EXISTS "Users can delete own symptoms" ON custom_symptoms;
DROP POLICY IF EXISTS "Users can view own logs" ON symptom_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON symptom_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON symptom_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON symptom_logs;
DROP POLICY IF EXISTS "Users can view own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can insert own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can update own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can view own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can insert own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can update own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can delete own mood logs" ON mood_logs;
DROP POLICY IF EXISTS "Users can view own lifestyle logs" ON lifestyle_logs;
DROP POLICY IF EXISTS "Users can insert own lifestyle logs" ON lifestyle_logs;
DROP POLICY IF EXISTS "Users can update own lifestyle logs" ON lifestyle_logs;
DROP POLICY IF EXISTS "Users can delete own lifestyle logs" ON lifestyle_logs;
DROP POLICY IF EXISTS "Users can view own ai predictions" ON ai_predictions;
DROP POLICY IF EXISTS "Users can insert own ai predictions" ON ai_predictions;

-- Create RLS policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for custom_symptoms
CREATE POLICY "Users can view own symptoms" ON custom_symptoms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms" ON custom_symptoms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptoms" ON custom_symptoms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptoms" ON custom_symptoms
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for symptom_logs
CREATE POLICY "Users can view own logs" ON symptom_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON symptom_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON symptom_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON symptom_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for predictions
CREATE POLICY "Users can view own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for ai_insights
CREATE POLICY "Users can view own insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON ai_insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for mood_logs
CREATE POLICY "Users can view own mood logs" ON mood_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood logs" ON mood_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs" ON mood_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs" ON mood_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for lifestyle_logs
CREATE POLICY "Users can view own lifestyle logs" ON lifestyle_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lifestyle logs" ON lifestyle_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lifestyle logs" ON lifestyle_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lifestyle logs" ON lifestyle_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ai_predictions
CREATE POLICY "Users can view own ai predictions" ON ai_predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai predictions" ON ai_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================
-- PARTNER EDUCATION PROGRESS
-- ================================
CREATE TABLE IF NOT EXISTS partner_education_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_education_progress_user ON partner_education_progress(user_id);

ALTER TABLE partner_education_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own education progress" ON partner_education_progress;
DROP POLICY IF EXISTS "Users can insert own education progress" ON partner_education_progress;
DROP POLICY IF EXISTS "Users can delete own education progress" ON partner_education_progress;

CREATE POLICY "Users can view own education progress" ON partner_education_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education progress" ON partner_education_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own education progress" ON partner_education_progress
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- REMINDER PREFERENCES
-- ================================
CREATE TABLE IF NOT EXISTS reminder_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  period_start BOOLEAN DEFAULT TRUE,
  period_end BOOLEAN DEFAULT FALSE,
  ovulation BOOLEAN DEFAULT TRUE,
  fertile_window BOOLEAN DEFAULT TRUE,
  medication BOOLEAN DEFAULT FALSE,
  hydration BOOLEAN DEFAULT FALSE,
  reminder_time TEXT DEFAULT '09:00',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_reminder_prefs_user ON reminder_preferences(user_id);

ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;

-- Create sexual_activity_logs table
CREATE TABLE IF NOT EXISTS sexual_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  protected BOOLEAN DEFAULT FALSE,
  protection_type TEXT,
  libido TEXT CHECK (libido IN ('low', 'moderate', 'high')),
  comfort TEXT CHECK (comfort IN ('comfortable', 'some_discomfort', 'painful')),
  orgasm BOOLEAN,
  notes TEXT,
  cycle_phase TEXT CHECK (cycle_phase IN ('menstrual', 'follicular', 'ovulation', 'luteal', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sexual_activity_user ON sexual_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sexual_activity_date ON sexual_activity_logs(user_id, date);

ALTER TABLE sexual_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sexual activity" ON sexual_activity_logs;
DROP POLICY IF EXISTS "Users can insert own sexual activity" ON sexual_activity_logs;
DROP POLICY IF EXISTS "Users can update own sexual activity" ON sexual_activity_logs;
DROP POLICY IF EXISTS "Users can delete own sexual activity" ON sexual_activity_logs;

CREATE POLICY "Users can view own sexual activity" ON sexual_activity_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sexual activity" ON sexual_activity_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own sexual activity" ON sexual_activity_logs
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own sexual activity" ON sexual_activity_logs
  FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own reminder prefs" ON reminder_preferences;
DROP POLICY IF EXISTS "Users can insert own reminder prefs" ON reminder_preferences;
DROP POLICY IF EXISTS "Users can update own reminder prefs" ON reminder_preferences;

CREATE POLICY "Users can view own reminder prefs" ON reminder_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder prefs" ON reminder_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder prefs" ON reminder_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- COUNTRY FEATURE FLAGS
-- ================================
-- Controls feature visibility per country + subscription tier
-- access_tier: 'all' = everyone, 'paid' = paid only, 'disabled' = nobody
CREATE TABLE IF NOT EXISTS country_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  access_tier TEXT NOT NULL DEFAULT 'all' CHECK (access_tier IN ('all', 'paid', 'disabled')),
  reason TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_country_feature_flags_country ON country_feature_flags(country_code);
CREATE INDEX IF NOT EXISTS idx_country_feature_flags_key ON country_feature_flags(feature_key);

-- RLS: Allow all authenticated users to READ flags (needed for app to check)
-- Only service_role or admin can INSERT/UPDATE/DELETE
ALTER TABLE country_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read feature flags" ON country_feature_flags;
CREATE POLICY "Anyone can read feature flags" ON country_feature_flags
  FOR SELECT USING (true);

-- Admin-only write (use service_role key or Supabase dashboard)
DROP POLICY IF EXISTS "Service role can manage feature flags" ON country_feature_flags;
CREATE POLICY "Service role can manage feature flags" ON country_feature_flags
  FOR ALL USING (auth.role() = 'service_role');

-- ================================
-- COUNTRY-LEVEL APP ACCESS CONTROL
-- ================================
-- Master kill switch per country. If is_enabled = FALSE, the entire app is disabled for that country.
-- Admin can set this via Supabase dashboard or admin portal.
CREATE TABLE IF NOT EXISTS country_access (
  country_code TEXT PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT TRUE,
  reason TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE country_access ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (app needs to check on launch)
DROP POLICY IF EXISTS "Anyone can read country access" ON country_access;
CREATE POLICY "Anyone can read country access" ON country_access
  FOR SELECT USING (true);

-- Only service_role / admin can write
DROP POLICY IF EXISTS "Service role can manage country access" ON country_access;
CREATE POLICY "Service role can manage country access" ON country_access
  FOR ALL USING (auth.role() = 'service_role');

-- ================================
-- DAILY CHECK-INS
-- ================================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON daily_checkins;

CREATE POLICY "Users can view own checkins" ON daily_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON daily_checkins
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON daily_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- PARTNER RELATIONSHIPS
-- ================================
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invite_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_partner_view_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_relationships_owner ON relationships(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_partner ON relationships(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_invite ON relationships(invite_code);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can insert own relationships" ON relationships;
DROP POLICY IF EXISTS "Users can update own relationships" ON relationships;

CREATE POLICY "Users can view own relationships" ON relationships
  FOR SELECT USING (auth.uid() = owner_user_id OR auth.uid() = partner_user_id);
CREATE POLICY "Users can insert own relationships" ON relationships
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own relationships" ON relationships
  FOR UPDATE USING (auth.uid() = owner_user_id OR auth.uid() = partner_user_id);

-- ================================
-- SHARING SETTINGS
-- ================================
CREATE TABLE IF NOT EXISTS sharing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  partner_gender TEXT,
  permissions JSONB DEFAULT '{}'::jsonb,
  consent_granted_at TIMESTAMPTZ,
  partner_consent_at TIMESTAMPTZ,
  consent_revoked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(relationship_id)
);

CREATE INDEX IF NOT EXISTS idx_sharing_settings_rel ON sharing_settings(relationship_id);

ALTER TABLE sharing_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sharing settings" ON sharing_settings;
DROP POLICY IF EXISTS "Users can insert sharing settings" ON sharing_settings;
DROP POLICY IF EXISTS "Users can update sharing settings" ON sharing_settings;

CREATE POLICY "Users can view sharing settings" ON sharing_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE r.id = sharing_settings.relationship_id
      AND (r.owner_user_id = auth.uid() OR r.partner_user_id = auth.uid())
    )
  );
CREATE POLICY "Users can insert sharing settings" ON sharing_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE r.id = sharing_settings.relationship_id
      AND r.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update sharing settings" ON sharing_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE r.id = sharing_settings.relationship_id
      AND r.owner_user_id = auth.uid()
    )
  );

-- ================================
-- SHARED SNAPSHOTS
-- ================================
CREATE TABLE IF NOT EXISTS shared_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  snapshot JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(relationship_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_snapshots_rel ON shared_snapshots(relationship_id);

ALTER TABLE shared_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared snapshots" ON shared_snapshots;
DROP POLICY IF EXISTS "Users can insert shared snapshots" ON shared_snapshots;
DROP POLICY IF EXISTS "Users can update shared snapshots" ON shared_snapshots;

CREATE POLICY "Users can view shared snapshots" ON shared_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE r.id = shared_snapshots.relationship_id
      AND (r.owner_user_id = auth.uid() OR r.partner_user_id = auth.uid())
    )
  );
CREATE POLICY "Users can insert shared snapshots" ON shared_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE r.id = shared_snapshots.relationship_id
      AND r.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update shared snapshots" ON shared_snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM relationships r
      WHERE r.id = shared_snapshots.relationship_id
      AND r.owner_user_id = auth.uid()
    )
  );

-- ================================
-- PCOS SYMPTOM LOGS
-- ================================
CREATE TABLE IF NOT EXISTS pcos_symptom_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symptoms JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_pcos_symptom_logs_user_date ON pcos_symptom_logs(user_id, date DESC);

ALTER TABLE pcos_symptom_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pcos logs" ON pcos_symptom_logs;
DROP POLICY IF EXISTS "Users can insert own pcos logs" ON pcos_symptom_logs;
DROP POLICY IF EXISTS "Users can update own pcos logs" ON pcos_symptom_logs;
DROP POLICY IF EXISTS "Users can delete own pcos logs" ON pcos_symptom_logs;

CREATE POLICY "Users can view own pcos logs" ON pcos_symptom_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pcos logs" ON pcos_symptom_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pcos logs" ON pcos_symptom_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pcos logs" ON pcos_symptom_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- SUBSCRIPTIONS
-- ================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'expired', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- SYMPTOM CHECKER LOGS
-- ================================
CREATE TABLE IF NOT EXISTS symptom_checker_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptom TEXT NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symptom_checker_logs_user ON symptom_checker_logs(user_id);

ALTER TABLE symptom_checker_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own symptom checker logs" ON symptom_checker_logs;
DROP POLICY IF EXISTS "Users can insert own symptom checker logs" ON symptom_checker_logs;

CREATE POLICY "Users can view own symptom checker logs" ON symptom_checker_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own symptom checker logs" ON symptom_checker_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================
-- PERIMENOPAUSE PROFILES
-- ================================
CREATE TABLE IF NOT EXISTS perimenopause_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_period_date DATE,
  period_pattern TEXT CHECK (period_pattern IN ('regular', 'irregular', 'skipping', 'stopped')),
  months_since_last_period INTEGER,
  hrt_type TEXT DEFAULT 'none' CHECK (hrt_type IN ('none', 'estrogen', 'combined', 'other')),
  supplements TEXT[] DEFAULT ARRAY[]::TEXT[],
  doctor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_perimenopause_profiles_user ON perimenopause_profiles(user_id);

ALTER TABLE perimenopause_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own perimenopause profile" ON perimenopause_profiles;
DROP POLICY IF EXISTS "Users can insert own perimenopause profile" ON perimenopause_profiles;
DROP POLICY IF EXISTS "Users can update own perimenopause profile" ON perimenopause_profiles;

CREATE POLICY "Users can view own perimenopause profile" ON perimenopause_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own perimenopause profile" ON perimenopause_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own perimenopause profile" ON perimenopause_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- PERIMENOPAUSE DAY LOGS
-- ================================
CREATE TABLE IF NOT EXISTS perimenopause_day_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  mood TEXT,
  hot_flash_count INTEGER DEFAULT 0,
  hot_flash_intensity TEXT CHECK (hot_flash_intensity IN ('mild', 'moderate', 'severe')),
  night_sweats_count INTEGER DEFAULT 0,
  sleep_hours NUMERIC(3,1),
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  had_period BOOLEAN DEFAULT FALSE,
  period_flow TEXT CHECK (period_flow IN ('spotting', 'light', 'moderate', 'heavy')),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_perimenopause_day_logs_user_date ON perimenopause_day_logs(user_id, date DESC);

ALTER TABLE perimenopause_day_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own perimenopause logs" ON perimenopause_day_logs;
DROP POLICY IF EXISTS "Users can insert own perimenopause logs" ON perimenopause_day_logs;
DROP POLICY IF EXISTS "Users can update own perimenopause logs" ON perimenopause_day_logs;
DROP POLICY IF EXISTS "Users can delete own perimenopause logs" ON perimenopause_day_logs;

CREATE POLICY "Users can view own perimenopause logs" ON perimenopause_day_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own perimenopause logs" ON perimenopause_day_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own perimenopause logs" ON perimenopause_day_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own perimenopause logs" ON perimenopause_day_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- PREGNANCY PROFILES
-- ================================
CREATE TABLE IF NOT EXISTS pregnancy_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  conception_date DATE,
  last_period_date DATE NOT NULL,
  current_week INTEGER DEFAULT 0,
  blood_type TEXT,
  rh_factor TEXT CHECK (rh_factor IN ('positive', 'negative')),
  complications TEXT[] DEFAULT ARRAY[]::TEXT[],
  medications TEXT[] DEFAULT ARRAY[]::TEXT[],
  doctor_name TEXT,
  doctor_phone TEXT,
  hospital TEXT,
  birth_plan TEXT,
  partners TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_profiles_user ON pregnancy_profiles(user_id);

ALTER TABLE pregnancy_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pregnancy profile" ON pregnancy_profiles;
DROP POLICY IF EXISTS "Users can insert own pregnancy profile" ON pregnancy_profiles;
DROP POLICY IF EXISTS "Users can update own pregnancy profile" ON pregnancy_profiles;

CREATE POLICY "Users can view own pregnancy profile" ON pregnancy_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pregnancy profile" ON pregnancy_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pregnancy profile" ON pregnancy_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- POSTPARTUM PROFILES
-- ================================
CREATE TABLE IF NOT EXISTS postpartum_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baby_id TEXT,
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
-- PREGNANCY DAY LOGS
-- ================================
CREATE TABLE IF NOT EXISTS pregnancy_day_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  week INTEGER,
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  mood TEXT,
  weight NUMERIC(5,2),
  blood_pressure TEXT,
  kick_count INTEGER,
  water_intake INTEGER,
  sleep NUMERIC(3,1),
  exercise TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
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
-- POSTPARTUM DAY LOGS
-- ================================
CREATE TABLE IF NOT EXISTS postpartum_day_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weeks_postpartum INTEGER,
  symptoms TEXT[] DEFAULT ARRAY[]::TEXT[],
  mood TEXT,
  weight NUMERIC(5,2),
  blood_pressure TEXT,
  bleeding_level TEXT CHECK (bleeding_level IN ('spotting', 'light', 'moderate', 'heavy')),
  sleep NUMERIC(3,1),
  exercise TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_postpartum_day_logs_user_date ON postpartum_day_logs(user_id, date DESC);

ALTER TABLE postpartum_day_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own postpartum logs" ON postpartum_day_logs;
DROP POLICY IF EXISTS "Users can insert own postpartum logs" ON postpartum_day_logs;
DROP POLICY IF EXISTS "Users can update own postpartum logs" ON postpartum_day_logs;
DROP POLICY IF EXISTS "Users can delete own postpartum logs" ON postpartum_day_logs;

CREATE POLICY "Users can view own postpartum logs" ON postpartum_day_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own postpartum logs" ON postpartum_day_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own postpartum logs" ON postpartum_day_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own postpartum logs" ON postpartum_day_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ================================
-- PREGNANCY APPOINTMENTS
-- ================================
CREATE TABLE IF NOT EXISTS pregnancy_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ultrasound', 'checkup', 'lab', 'specialist', 'other')),
  provider TEXT,
  notes TEXT,
  weight NUMERIC(5,2),
  blood_pressure TEXT,
  baby_heart_rate INTEGER,
  fundal_height NUMERIC(5,2),
  estimated_weight NUMERIC(5,2),
  next_appointment DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_appointments_user ON pregnancy_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_appointments_date ON pregnancy_appointments(user_id, date DESC);

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

DROP POLICY IF EXISTS "Users can view own kick counts" ON kick_count_sessions;
DROP POLICY IF EXISTS "Users can insert own kick counts" ON kick_count_sessions;
DROP POLICY IF EXISTS "Users can update own kick counts" ON kick_count_sessions;

CREATE POLICY "Users can view own kick counts" ON kick_count_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kick counts" ON kick_count_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kick counts" ON kick_count_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- CONTRACTION TIMERS
-- ================================
CREATE TABLE IF NOT EXISTS contraction_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  contractions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contraction_timers_user ON contraction_timers(user_id, date DESC);

ALTER TABLE contraction_timers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contraction timers" ON contraction_timers;
DROP POLICY IF EXISTS "Users can insert own contraction timers" ON contraction_timers;
DROP POLICY IF EXISTS "Users can update own contraction timers" ON contraction_timers;

CREATE POLICY "Users can view own contraction timers" ON contraction_timers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contraction timers" ON contraction_timers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contraction timers" ON contraction_timers
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- BABY PROFILES
-- ================================
CREATE TABLE IF NOT EXISTS baby_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_weight NUMERIC(5,2),
  birth_length NUMERIC(5,2),
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

-- ================================
-- BABY FEEDINGS
-- ================================
CREATE TABLE IF NOT EXISTS baby_feedings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baby_id UUID NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('breast', 'bottle', 'both')),
  duration INTEGER,
  amount NUMERIC(5,1),
  breast TEXT CHECK (breast IN ('left', 'right', 'both')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baby_feedings_user ON baby_feedings(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_feedings_baby ON baby_feedings(baby_id, date DESC);

ALTER TABLE baby_feedings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own baby feedings" ON baby_feedings;
DROP POLICY IF EXISTS "Users can insert own baby feedings" ON baby_feedings;

CREATE POLICY "Users can view own baby feedings" ON baby_feedings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own baby feedings" ON baby_feedings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================
-- BABY SLEEP LOGS
-- ================================
CREATE TABLE IF NOT EXISTS baby_sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baby_id UUID NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  quality TEXT CHECK (quality IN ('poor', 'fair', 'good', 'excellent')),
  location TEXT CHECK (location IN ('crib', 'bassinet', 'bed', 'arms', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baby_sleep_logs_baby ON baby_sleep_logs(baby_id, date DESC);

ALTER TABLE baby_sleep_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own baby sleep" ON baby_sleep_logs;
DROP POLICY IF EXISTS "Users can insert own baby sleep" ON baby_sleep_logs;
DROP POLICY IF EXISTS "Users can update own baby sleep" ON baby_sleep_logs;

CREATE POLICY "Users can view own baby sleep" ON baby_sleep_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own baby sleep" ON baby_sleep_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own baby sleep" ON baby_sleep_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- BABY DIAPER LOGS
-- ================================
CREATE TABLE IF NOT EXISTS baby_diaper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baby_id UUID NOT NULL REFERENCES baby_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wet', 'dirty', 'both')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baby_diaper_logs_baby ON baby_diaper_logs(baby_id, date DESC);

ALTER TABLE baby_diaper_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own baby diapers" ON baby_diaper_logs;
DROP POLICY IF EXISTS "Users can insert own baby diapers" ON baby_diaper_logs;

CREATE POLICY "Users can view own baby diapers" ON baby_diaper_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own baby diapers" ON baby_diaper_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================
-- BREASTFEEDING SESSIONS
-- ================================
CREATE TABLE IF NOT EXISTS breastfeeding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baby_id UUID,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  breast TEXT CHECK (breast IN ('left', 'right', 'both')),
  notes TEXT,
  pumped_amount NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breastfeeding_sessions_user ON breastfeeding_sessions(user_id, date DESC);

ALTER TABLE breastfeeding_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own breastfeeding sessions" ON breastfeeding_sessions;
DROP POLICY IF EXISTS "Users can insert own breastfeeding sessions" ON breastfeeding_sessions;
DROP POLICY IF EXISTS "Users can update own breastfeeding sessions" ON breastfeeding_sessions;

CREATE POLICY "Users can view own breastfeeding sessions" ON breastfeeding_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own breastfeeding sessions" ON breastfeeding_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own breastfeeding sessions" ON breastfeeding_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- ================================
-- POSTPARTUM ASSESSMENTS
-- ================================
CREATE TABLE IF NOT EXISTS postpartum_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  responses JSONB DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('low', 'moderate', 'high')),
  warnings TEXT[] DEFAULT ARRAY[]::TEXT[],
  weeks_postpartum INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_postpartum_assessments_user ON postpartum_assessments(user_id, date DESC);

ALTER TABLE postpartum_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own postpartum assessments" ON postpartum_assessments;
DROP POLICY IF EXISTS "Users can insert own postpartum assessments" ON postpartum_assessments;

CREATE POLICY "Users can view own postpartum assessments" ON postpartum_assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own postpartum assessments" ON postpartum_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
