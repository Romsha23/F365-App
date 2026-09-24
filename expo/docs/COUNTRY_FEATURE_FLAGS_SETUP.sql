-- ================================
-- COUNTRY FEATURE FLAGS TABLE
-- ================================
-- Table: country_feature_flags
-- Purpose: Controls feature visibility per country. Admin-managed via Supabase dashboard or Loveable admin panel.
-- If a feature_key has NO row for a country, it defaults to ENABLED.
-- Only insert rows to DISABLE features for specific countries.

CREATE TABLE IF NOT EXISTS country_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reason TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_cff_country ON country_feature_flags(country_code);
CREATE INDEX IF NOT EXISTS idx_cff_feature ON country_feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_cff_country_enabled ON country_feature_flags(country_code, is_enabled);

ALTER TABLE country_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON country_feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin insert" ON country_feature_flags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Allow admin update" ON country_feature_flags
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Allow admin delete" ON country_feature_flags
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ================================
-- VALID FEATURE KEYS REFERENCE
-- ================================
-- Use these exact keys when inserting rows:
--
-- CORE FEATURES:
--   home_dashboard, calendar, insights_tab, log_entry, daily_checkin, reminders
--
-- AI FEATURES:
--   mood_ai_tab, ai_insights, ai_chatbot, ai_mood_forecast, advanced_analytics, symptom_checker
--
-- PREGNANCY FEATURES:
--   pregnancy_mode, pregnancy_dashboard, pregnancy_calendar, pregnancy_log,
--   pregnancy_setup, pregnancy_appointments, baby_development, kick_counter,
--   contraction_timer, postpartum_dashboard
--
-- PARTNER FEATURES:
--   partner_sharing, partner_link, partner_summary, partner_education, relationship_dashboard
--
-- HEALTH SERVICES:
--   telehealth, book_appointment, my_appointments, consultation, emergency_contacts
--
-- ACCOUNT & SETTINGS:
--   profile_tab, data_export, subscription_management, redeem_code, edit_profile, help_support
--
-- LEGAL & COMPLIANCE:
--   privacy_policy, terms_of_service, consent_management

-- ================================
-- EXAMPLE: Disable AI features for Pakistan
-- ================================
-- INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, reason, updated_by)
-- VALUES
--   ('Pakistan', 'ai_mood_forecast', false, 'AI features not available in this region', 'admin'),
--   ('Pakistan', 'ai_chatbot', false, 'AI features not available in this region', 'admin'),
--   ('Pakistan', 'ai_insights', false, 'AI features not available in this region', 'admin');

-- ================================
-- EXAMPLE: Disable telehealth for countries without provider network
-- ================================
-- INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, reason, updated_by)
-- VALUES
--   ('Afghanistan', 'telehealth', false, 'No telehealth providers available', 'admin'),
--   ('Afghanistan', 'book_appointment', false, 'No telehealth providers available', 'admin'),
--   ('Afghanistan', 'consultation', false, 'No telehealth providers available', 'admin');

-- ================================
-- HELPER QUERIES FOR ADMIN
-- ================================

-- View all disabled features grouped by country:
-- SELECT country_code, array_agg(feature_key) as disabled_features
-- FROM country_feature_flags WHERE is_enabled = false
-- GROUP BY country_code ORDER BY country_code;

-- Enable a previously disabled feature:
-- UPDATE country_feature_flags SET is_enabled = true, updated_at = NOW(), updated_by = 'admin'
-- WHERE country_code = 'Pakistan' AND feature_key = 'ai_mood_forecast';

-- Bulk disable all AI features for a country:
-- INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, reason, updated_by)
-- VALUES
--   ('Iran', 'ai_insights', false, 'Regional restriction', 'admin'),
--   ('Iran', 'ai_chatbot', false, 'Regional restriction', 'admin'),
--   ('Iran', 'ai_mood_forecast', false, 'Regional restriction', 'admin'),
--   ('Iran', 'advanced_analytics', false, 'Regional restriction', 'admin'),
--   ('Iran', 'symptom_checker', false, 'Regional restriction', 'admin')
-- ON CONFLICT (country_code, feature_key) DO UPDATE SET is_enabled = false, reason = EXCLUDED.reason, updated_at = NOW();

-- Delete a restriction (reverts to default enabled):
-- DELETE FROM country_feature_flags WHERE country_code = 'Pakistan' AND feature_key = 'ai_mood_forecast';
