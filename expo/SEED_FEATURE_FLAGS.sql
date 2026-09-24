-- ============================================================
-- SEED: Default country_feature_flags for ALL countries × ALL features
-- This creates 196 countries × 41 features = 8,036 rows
-- All features default to: is_enabled=true, access_tier='all'
-- Admin can then granularly change per country/feature
-- ============================================================

-- Step 1: Clear existing data (optional - comment out if you want to keep existing overrides)
DELETE FROM country_feature_flags;

-- Step 2: Insert all country × feature combinations using cross join
INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, access_tier, reason, updated_by)
SELECT 
  c.code AS country_code,
  f.key AS feature_key,
  true AS is_enabled,
  'all' AS access_tier,
  NULL AS reason,
  'system_seed' AS updated_by
FROM (
  VALUES
    ('AF'), ('AL'), ('DZ'), ('AD'), ('AO'), ('AG'), ('AR'), ('AM'), ('AU'), ('AT'),
    ('AZ'), ('BS'), ('BH'), ('BD'), ('BB'), ('BY'), ('BE'), ('BZ'), ('BJ'), ('BT'),
    ('BO'), ('BA'), ('BW'), ('BR'), ('BN'), ('BG'), ('BF'), ('BI'), ('CV'), ('KH'),
    ('CM'), ('CA'), ('CF'), ('TD'), ('CL'), ('CN'), ('CO'), ('KM'), ('CG'), ('CD'),
    ('CR'), ('CI'), ('HR'), ('CU'), ('CY'), ('CZ'), ('DK'), ('DJ'), ('DM'), ('DO'),
    ('EC'), ('EG'), ('SV'), ('GQ'), ('ER'), ('EE'), ('SZ'), ('ET'), ('FJ'), ('FI'),
    ('FR'), ('GA'), ('GM'), ('GE'), ('DE'), ('GH'), ('GR'), ('GD'), ('GT'), ('GN'),
    ('GW'), ('GY'), ('HT'), ('HN'), ('HU'), ('IS'), ('IN'), ('ID'), ('IR'), ('IQ'),
    ('IE'), ('IL'), ('IT'), ('JM'), ('JP'), ('JO'), ('KZ'), ('KE'), ('KI'), ('KP'),
    ('KR'), ('KW'), ('KG'), ('LA'), ('LV'), ('LB'), ('LS'), ('LR'), ('LY'), ('LI'),
    ('LT'), ('LU'), ('MG'), ('MW'), ('MY'), ('MV'), ('ML'), ('MT'), ('MH'), ('MR'),
    ('MU'), ('MX'), ('FM'), ('MD'), ('MC'), ('MN'), ('ME'), ('MA'), ('MZ'), ('MM'),
    ('NA'), ('NR'), ('NP'), ('NL'), ('NZ'), ('NI'), ('NE'), ('NG'), ('MK'), ('NO'),
    ('OM'), ('PK'), ('PW'), ('PS'), ('PA'), ('PG'), ('PY'), ('PE'), ('PH'), ('PL'),
    ('PT'), ('QA'), ('RO'), ('RU'), ('RW'), ('KN'), ('LC'), ('VC'), ('WS'), ('SM'),
    ('ST'), ('SA'), ('SN'), ('RS'), ('SC'), ('SL'), ('SG'), ('SK'), ('SI'), ('SB'),
    ('SO'), ('ZA'), ('SS'), ('ES'), ('LK'), ('SD'), ('SR'), ('SE'), ('CH'), ('SY'),
    ('TW'), ('TJ'), ('TZ'), ('TH'), ('TL'), ('TG'), ('TO'), ('TT'), ('TN'), ('TR'),
    ('TM'), ('TV'), ('UG'), ('UA'), ('AE'), ('GB'), ('US'), ('UY'), ('UZ'), ('VU'),
    ('VA'), ('VE'), ('VN'), ('YE'), ('ZM'), ('ZW')
) AS c(code)
CROSS JOIN (
  VALUES
    ('home_dashboard'),
    ('calendar'),
    ('insights_tab'),
    ('mood_ai_tab'),
    ('profile_tab'),
    ('log_entry'),
    ('daily_checkin'),
    ('ai_insights'),
    ('ai_chatbot'),
    ('ai_mood_forecast'),
    ('advanced_analytics'),
    ('symptom_checker'),
    ('pregnancy_mode'),
    ('pregnancy_dashboard'),
    ('pregnancy_calendar'),
    ('pregnancy_log'),
    ('pregnancy_setup'),
    ('pregnancy_appointments'),
    ('baby_development'),
    ('kick_counter'),
    ('contraction_timer'),
    ('postpartum_dashboard'),
    ('partner_sharing'),
    ('partner_link'),
    ('partner_summary'),
    ('partner_education'),
    ('relationship_dashboard'),
    ('telehealth'),
    ('book_appointment'),
    ('my_appointments'),
    ('consultation'),
    ('emergency_contacts'),
    ('reminders'),
    ('data_export'),
    ('subscription_management'),
    ('redeem_code'),
    ('edit_profile'),
    ('help_support'),
    ('privacy_policy'),
    ('terms_of_service'),
    ('consent_management'),
    ('fertility_predictions'),
    ('pcos_insights')
) AS f(key);

-- ============================================================
-- VERIFY: Check row count (should be 8,036)
-- ============================================================
SELECT COUNT(*) AS total_rows FROM country_feature_flags;

-- Check distinct countries and features
SELECT COUNT(DISTINCT country_code) AS total_countries, COUNT(DISTINCT feature_key) AS total_features FROM country_feature_flags;

-- Sample: View Pakistan's flags
SELECT country_code, feature_key, is_enabled, access_tier, reason FROM country_feature_flags WHERE country_code = 'PK' ORDER BY feature_key;
