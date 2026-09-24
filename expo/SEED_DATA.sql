-- ================================
-- SEED DATA FOR DEVELOPMENT
-- ================================
-- Run this AFTER SETUP_DATABASE.sql in Supabase SQL Editor.
-- This creates realistic dummy data so developers can see
-- how tables relate, what data types look like, and how
-- the app data flows end-to-end.
--
-- IMPORTANT: Replace the user_id below with a REAL auth.uid()
-- from your Supabase Auth → Users table. RLS policies require
-- the user_id to match auth.uid() for queries to return data.
--
-- STEPS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Copy a user's UUID (e.g. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
-- 3. Find & Replace ALL occurrences of 'REPLACE_WITH_AUTH_USER_ID' below
-- 4. Run this script in SQL Editor
-- ================================

-- ================================
-- HELPER: Set your test user ID here
-- ================================
DO $$
DECLARE
  test_user_id UUID := 'REPLACE_WITH_AUTH_USER_ID';
BEGIN

-- ================================
-- 1. USERS TABLE
-- ================================
-- The core user profile. Created on registration.
-- display_name: fun AI-generated nickname shown on dashboard
-- average_cycle_length/period_length: set during onboarding, updated by predictions
-- is_premium: toggled by subscription system
-- onboarded: set to true after onboarding flow completes
INSERT INTO users (id, display_name, email, is_premium, average_cycle_length, average_period_length, notifications_enabled, insights_enabled, onboarded)
VALUES (
  test_user_id,
  'Luna Spark',
  'testuser@f365.app',
  FALSE,
  28,
  5,
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  onboarded = EXCLUDED.onboarded;

-- ================================
-- 2. CUSTOM_SYMPTOMS TABLE
-- ================================
-- User-defined symptoms beyond the built-in list.
-- Linked to users via user_id (CASCADE delete).
-- These appear in the symptom picker on the log-entry screen.
INSERT INTO custom_symptoms (id, user_id, name, created_at) VALUES
  (uuid_generate_v4(), test_user_id, 'Jaw tension',        NOW() - INTERVAL '30 days'),
  (uuid_generate_v4(), test_user_id, 'Eye twitching',      NOW() - INTERVAL '25 days'),
  (uuid_generate_v4(), test_user_id, 'Restless legs',      NOW() - INTERVAL '20 days'),
  (uuid_generate_v4(), test_user_id, 'Brain fog',          NOW() - INTERVAL '10 days');

-- ================================
-- 3. SYMPTOM_LOGS TABLE
-- ================================
-- Daily health log entries. ONE row per user per date (UNIQUE constraint).
-- This is the PRIMARY data table — most features read from here.
--
-- Data flow: log-entry.tsx → store/logStore → Supabase symptom_logs
-- Read by: dashboard, calendar, AI insights, analytics, predictions
--
-- symptoms: JSONB array of symptom objects e.g. [{"name":"Headache","severity":3}]
-- moods: TEXT array e.g. {'happy','anxious'}
-- flow_intensity: 'none' | 'spotting' | 'light' | 'medium' | 'heavy'
-- discharge_type: 'none' | 'sticky' | 'creamy' | 'watery' | 'egg_white'
-- pain_level: 'none' | 'mild' | 'moderate' | 'severe'
-- cravings: TEXT array e.g. {'chocolate','salty'}
-- cycle_day: calculated from last period start, 1-based

-- Day 1-5: Period phase (menstrual)
INSERT INTO symptom_logs (id, user_id, date, cycle_day, symptoms, moods, notes, flow_intensity, discharge_type, pain_level, cravings) VALUES
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '27 days', 1,
  '[{"name":"Cramps","severity":4},{"name":"Lower back pain","severity":3},{"name":"Fatigue","severity":2}]'::jsonb,
  ARRAY['tired','irritable'],
  'Period started today. Heavy cramps in the morning, eased after lunch.',
  'heavy', 'none', 'severe', ARRAY['chocolate','warm_foods']),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '26 days', 2,
  '[{"name":"Cramps","severity":3},{"name":"Headache","severity":2}]'::jsonb,
  ARRAY['tired','calm'],
  'Cramps lighter today. Took it easy.',
  'heavy', 'none', 'moderate', ARRAY['chocolate']),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '25 days', 3,
  '[{"name":"Cramps","severity":2},{"name":"Bloating","severity":2}]'::jsonb,
  ARRAY['neutral'],
  'Flow reducing. Still some bloating.',
  'medium', 'none', 'mild', ARRAY['salty']),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '24 days', 4,
  '[{"name":"Fatigue","severity":1}]'::jsonb,
  ARRAY['calm','hopeful'],
  'Almost done. Energy coming back.',
  'light', 'none', 'none', ARRAY[]::TEXT[]),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '23 days', 5,
  '[]'::jsonb,
  ARRAY['happy','energetic'],
  'Last day of period. Feeling much better!',
  'spotting', 'none', 'none', ARRAY[]::TEXT[]),

-- Day 6-13: Follicular phase (post-period, pre-ovulation)
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '20 days', 8,
  '[]'::jsonb,
  ARRAY['happy','energetic','confident'],
  'Great energy today. Went for a run.',
  'none', 'sticky', 'none', ARRAY[]::TEXT[]),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '17 days', 11,
  '[{"name":"Mild cramp","severity":1}]'::jsonb,
  ARRAY['energetic','happy'],
  'Skin looks great. High energy continues.',
  'none', 'creamy', 'none', ARRAY['fruits']),

-- Day 14-16: Ovulation phase
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '14 days', 14,
  '[{"name":"Ovulation pain","severity":2},{"name":"Breast tenderness","severity":1}]'::jsonb,
  ARRAY['energetic','happy','romantic'],
  'Felt a twinge on right side — likely ovulation. High libido.',
  'none', 'egg_white', 'mild', ARRAY[]::TEXT[]),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '13 days', 15,
  '[{"name":"Bloating","severity":1}]'::jsonb,
  ARRAY['happy','calm'],
  'Slight bloating but overall feeling good.',
  'none', 'watery', 'none', ARRAY[]::TEXT[]),

-- Day 17-28: Luteal phase (post-ovulation, pre-period)
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '10 days', 18,
  '[{"name":"Breast tenderness","severity":2},{"name":"Bloating","severity":2}]'::jsonb,
  ARRAY['anxious','irritable'],
  'PMS starting. Feeling more emotional.',
  'none', 'creamy', 'mild', ARRAY['chocolate','salty']),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '7 days', 21,
  '[{"name":"Headache","severity":3},{"name":"Fatigue","severity":3},{"name":"Mood swings","severity":2}]'::jsonb,
  ARRAY['sad','anxious','irritable'],
  'Tough day. Bad headache. Emotional.',
  'none', 'sticky', 'moderate', ARRAY['chocolate','sweets','carbs']),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '4 days', 24,
  '[{"name":"Cramps","severity":2},{"name":"Acne","severity":2},{"name":"Bloating","severity":3}]'::jsonb,
  ARRAY['tired','irritable'],
  'Breakout on chin. Cramps starting. Period probably in a few days.',
  'none', 'sticky', 'mild', ARRAY['chocolate','warm_foods']),

(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '1 day', 27,
  '[{"name":"Cramps","severity":3},{"name":"Lower back pain","severity":2},{"name":"Breast tenderness","severity":3}]'::jsonb,
  ARRAY['tired','anxious'],
  'Period expected tomorrow. Heavy PMS.',
  'spotting', 'none', 'moderate', ARRAY['comfort_food']),

-- Today
(uuid_generate_v4(), test_user_id, CURRENT_DATE, 28,
  '[{"name":"Cramps","severity":4},{"name":"Fatigue","severity":3}]'::jsonb,
  ARRAY['tired','relieved'],
  'Period started. Cycle complete.',
  'medium', 'none', 'moderate', ARRAY['chocolate','warm_foods']);


-- ================================
-- 4. MOOD_LOGS TABLE
-- ================================
-- Granular mood tracking with scores (0-100) and intensity (1-5).
-- Multiple moods can be logged per day (no UNIQUE on user+date).
--
-- Data flow: DailyCheckInModal / log-entry.tsx → Supabase mood_logs
-- Read by: MoodChart, MoodTimelineChart, AI insights, analytics
--
-- mood_type: 'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'energetic' | etc.
-- mood_score: 0-100 overall wellness score
-- intensity: 1-5 how strongly the mood is felt

INSERT INTO mood_logs (id, user_id, date, mood_type, mood_score, intensity, notes) VALUES
-- Period phase: lower mood scores
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '27 days', 'tired',     30, 4, 'Period day 1 — exhausted'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '27 days', 'irritable', 25, 3, NULL),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '26 days', 'tired',     35, 3, 'Slightly better than yesterday'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '25 days', 'neutral',   50, 2, 'Coasting through'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '24 days', 'calm',      60, 2, 'Period winding down'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '23 days', 'happy',     70, 3, 'Period over! Relieved'),

-- Follicular phase: mood rises
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '20 days', 'happy',     80, 4, 'Great energy, went for a run'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '20 days', 'energetic', 85, 4, NULL),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '17 days', 'energetic', 82, 3, 'Productive day at work'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '17 days', 'confident', 78, 3, NULL),

-- Ovulation phase: peak mood
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '14 days', 'happy',     90, 5, 'Feeling amazing! Peak energy'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '14 days', 'energetic', 88, 5, NULL),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '13 days', 'happy',     85, 4, 'Still riding high'),

-- Luteal phase: mood drops
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '10 days', 'anxious',   45, 3, 'PMS creeping in'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '10 days', 'irritable', 40, 3, NULL),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '7 days',  'sad',       30, 4, 'Really tough day emotionally'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '7 days',  'anxious',   28, 4, NULL),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '4 days',  'irritable', 35, 3, 'Snapped at a friend. Feel bad.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '1 day',   'anxious',   32, 3, 'Waiting for period to start'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE,                       'tired',     38, 3, 'Period started. At least the wait is over.');


-- ================================
-- 5. LIFESTYLE_LOGS TABLE
-- ================================
-- Daily lifestyle metrics. ONE row per user per date.
--
-- Data flow: log-entry.tsx (lifestyle section) → Supabase lifestyle_logs
-- Read by: dashboard stats, analytics, AI insights correlation engine
--
-- stress_level: 1 (low) to 5 (high)
-- sleep_hours: decimal e.g. 7.5
-- exercise_minutes: integer
-- water_intake_ml: integer (1 glass ≈ 250ml)

INSERT INTO lifestyle_logs (id, user_id, date, stress_level, sleep_hours, exercise_minutes, water_intake_ml, notes) VALUES
-- Period phase: less activity, more stress
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '27 days', 4, 6.0,  0,   1500, 'Could not sleep well due to cramps'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '26 days', 3, 7.0,  15,  1750, 'Short walk helped'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '25 days', 3, 7.5,  0,   2000, 'Rested today'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '24 days', 2, 8.0,  20,  2000, 'Getting back to normal'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '23 days', 2, 8.0,  30,  2250, 'Period over, back to gym'),

-- Follicular phase: high activity
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '20 days', 1, 7.5,  45,  2500, 'Great run! 5km'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '17 days', 1, 8.0,  60,  2750, 'Yoga + strength training'),

-- Ovulation phase: peak performance
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '14 days', 1, 7.5,  50,  2500, 'High energy workout'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '13 days', 2, 7.0,  40,  2250, 'Lighter day'),

-- Luteal phase: decreasing activity
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '10 days', 3, 6.5,  30,  2000, 'Feeling sluggish'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '7 days',  4, 5.5,  10,  1500, 'Barely slept. Stressed about work.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '4 days',  4, 6.0,  15,  1750, 'Short walk only'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '1 day',   3, 6.5,  0,   1500, 'Too crampy to exercise'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE,                       3, 7.0,  0,   2000, 'Resting today, period started');


-- ================================
-- 6. PREDICTIONS TABLE
-- ================================
-- AI/algorithm-generated cycle predictions.
-- Updated each time enough data is available.
--
-- Data flow: prediction algorithm (runs after log entries) → Supabase predictions
-- Read by: dashboard (next period countdown), calendar (highlighted dates), fertility window
--
-- confidence: 0.00 to 1.00 (higher = more historical data available)

INSERT INTO predictions (id, user_id, next_period_date, fertile_window_start, fertile_window_end, average_cycle_length, average_period_length, confidence) VALUES
-- Current prediction (most recent)
(uuid_generate_v4(), test_user_id, CURRENT_DATE, CURRENT_DATE - INTERVAL '16 days', CURRENT_DATE - INTERVAL '12 days', 28, 5, 0.82),

-- Historical prediction (from last cycle) — shows prediction accuracy over time
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '44 days', CURRENT_DATE - INTERVAL '40 days', 28, 5, 0.75);


-- ================================
-- 7. AI_INSIGHTS TABLE
-- ================================
-- AI-generated health insights based on logged data patterns.
-- Generated periodically by the AI analysis engine.
--
-- Data flow: AI engine analyses symptom_logs + mood_logs + lifestyle_logs → ai_insights
-- Read by: ai-insights.tsx, dashboard insight cards
--
-- type: 'pattern' | 'recommendation' | 'alert' | 'correlation' | 'wellness'
-- icon: lucide icon name used in the UI
-- color: hex color for the insight card accent
-- read: toggled when user views the insight

INSERT INTO ai_insights (id, user_id, type, title, description, icon, color, read, created_at) VALUES
(uuid_generate_v4(), test_user_id, 'pattern',
  'PMS Pattern Detected',
  'Your data shows a consistent pattern of increased anxiety and irritability starting around cycle day 18-20. This aligns with the luteal phase when progesterone peaks. Consider scheduling lighter workloads during this time and incorporating calming activities like yoga or meditation.',
  'TrendingUp', '#E07C5A', FALSE, NOW() - INTERVAL '2 days'),

(uuid_generate_v4(), test_user_id, 'correlation',
  'Sleep-Mood Connection',
  'When you sleep less than 7 hours, your mood scores drop by an average of 25 points the next day. Over the past 3 cycles, nights with 7.5+ hours of sleep were followed by mood scores above 70. Prioritising sleep during your luteal phase could significantly improve your experience.',
  'Moon', '#6B7FD7', FALSE, NOW() - INTERVAL '3 days'),

(uuid_generate_v4(), test_user_id, 'recommendation',
  'Hydration During Period',
  'Your water intake drops to ~1500ml during menstruation (vs 2500ml during follicular phase). Dehydration can worsen cramps and fatigue. Try setting a hydration reminder during your period days — even an extra 500ml could help.',
  'Droplets', '#4DBBEB', TRUE, NOW() - INTERVAL '5 days'),

(uuid_generate_v4(), test_user_id, 'alert',
  'Cycle Length Variation',
  'Your last 3 cycles were 28, 30, and 27 days. While some variation is normal (up to 7 days), keep logging — if cycles become more irregular, this data will be valuable for a healthcare provider consultation.',
  'AlertCircle', '#E0A05A', TRUE, NOW() - INTERVAL '7 days'),

(uuid_generate_v4(), test_user_id, 'wellness',
  'Exercise Boosts Your Follicular Phase',
  'You logged the highest mood scores (80-90) on days when you exercised 45+ minutes during your follicular phase (days 6-13). Your body responds particularly well to cardio during this time due to rising oestrogen levels.',
  'Heart', '#5ABF8A', TRUE, NOW() - INTERVAL '10 days'),

(uuid_generate_v4(), test_user_id, 'pattern',
  'Chocolate Cravings Predictor',
  'Your chocolate cravings consistently start 3-4 days before your period. This is linked to dropping serotonin levels. Having dark chocolate (70%+) on hand around cycle day 24-25 can help satisfy cravings with less sugar impact.',
  'Cookie', '#C07AB8', FALSE, NOW() - INTERVAL '1 day');


-- ================================
-- 8. AI_PREDICTIONS TABLE
-- ================================
-- AI-generated mood/wellness predictions for upcoming days.
-- Used to show "predicted mood" on the calendar and dashboard.
--
-- Data flow: AI prediction model → ai_predictions
-- Read by: calendar (predicted mood overlay), dashboard forecast section
--
-- predicted_mood: 0.0-10.0 scale
-- confidence: 0.00-1.00
-- prediction_type: 'mood' | 'energy' | 'symptom_risk'
-- metadata: flexible JSONB for model-specific data

INSERT INTO ai_predictions (id, user_id, predicted_mood, confidence, prediction_date, prediction_type, metadata) VALUES
-- Mood predictions for the next 7 days
(uuid_generate_v4(), test_user_id, 3.5, 0.78, CURRENT_DATE + INTERVAL '1 day',  'mood', '{"phase":"menstrual","day":2,"factors":["cramps","fatigue"]}'::jsonb),
(uuid_generate_v4(), test_user_id, 4.0, 0.75, CURRENT_DATE + INTERVAL '2 days', 'mood', '{"phase":"menstrual","day":3,"factors":["cramps_reducing"]}'::jsonb),
(uuid_generate_v4(), test_user_id, 5.5, 0.72, CURRENT_DATE + INTERVAL '3 days', 'mood', '{"phase":"menstrual","day":4,"factors":["period_ending"]}'::jsonb),
(uuid_generate_v4(), test_user_id, 6.5, 0.70, CURRENT_DATE + INTERVAL '4 days', 'mood', '{"phase":"late_menstrual","day":5,"factors":["energy_returning"]}'::jsonb),
(uuid_generate_v4(), test_user_id, 7.5, 0.68, CURRENT_DATE + INTERVAL '5 days', 'mood', '{"phase":"follicular","day":6,"factors":["oestrogen_rising"]}'::jsonb),
(uuid_generate_v4(), test_user_id, 8.0, 0.65, CURRENT_DATE + INTERVAL '6 days', 'mood', '{"phase":"follicular","day":7,"factors":["peak_energy_approaching"]}'::jsonb),
(uuid_generate_v4(), test_user_id, 8.5, 0.62, CURRENT_DATE + INTERVAL '7 days', 'mood', '{"phase":"follicular","day":8,"factors":["high_energy","confidence"]}'::jsonb),

-- Energy predictions
(uuid_generate_v4(), test_user_id, 3.0, 0.80, CURRENT_DATE + INTERVAL '1 day',  'energy', '{"expected_sleep":6.5,"exercise_likelihood":"low"}'::jsonb),
(uuid_generate_v4(), test_user_id, 5.0, 0.76, CURRENT_DATE + INTERVAL '3 days', 'energy', '{"expected_sleep":7.0,"exercise_likelihood":"moderate"}'::jsonb),
(uuid_generate_v4(), test_user_id, 8.0, 0.70, CURRENT_DATE + INTERVAL '6 days', 'energy', '{"expected_sleep":7.5,"exercise_likelihood":"high"}'::jsonb),

-- Symptom risk predictions
(uuid_generate_v4(), test_user_id, 7.5, 0.82, CURRENT_DATE + INTERVAL '1 day',  'symptom_risk', '{"top_risks":["cramps","fatigue","headache"],"severity":"moderate"}'::jsonb),
(uuid_generate_v4(), test_user_id, 3.0, 0.75, CURRENT_DATE + INTERVAL '5 days', 'symptom_risk', '{"top_risks":["none_expected"],"severity":"low"}'::jsonb);


-- ================================
-- 9. PARTNER_EDUCATION_PROGRESS TABLE
-- ================================
-- Tracks which educational cards a user (or their partner) has completed.
-- Used in the partner education feature.
--
-- Data flow: partner-education.tsx → Supabase partner_education_progress
-- Read by: partner-education.tsx (progress tracking), partner-summary.tsx
--
-- topic_id: matches topic IDs in the app's education content
-- card_id: individual card within a topic

INSERT INTO partner_education_progress (id, user_id, topic_id, card_id, completed_at) VALUES
(uuid_generate_v4(), test_user_id, 'understanding_cycles',  'what_is_menstruation',   NOW() - INTERVAL '14 days'),
(uuid_generate_v4(), test_user_id, 'understanding_cycles',  'cycle_phases',            NOW() - INTERVAL '14 days'),
(uuid_generate_v4(), test_user_id, 'understanding_cycles',  'hormones_explained',      NOW() - INTERVAL '13 days'),
(uuid_generate_v4(), test_user_id, 'emotional_support',     'mood_changes',            NOW() - INTERVAL '10 days'),
(uuid_generate_v4(), test_user_id, 'emotional_support',     'how_to_help',             NOW() - INTERVAL '10 days'),
(uuid_generate_v4(), test_user_id, 'physical_symptoms',     'common_symptoms',         NOW() - INTERVAL '7 days'),
(uuid_generate_v4(), test_user_id, 'physical_symptoms',     'pain_management',         NOW() - INTERVAL '7 days');


-- ================================
-- 10. REMINDER_PREFERENCES TABLE
-- ================================
-- User notification preferences. ONE row per user.
--
-- Data flow: reminders.tsx → Supabase reminder_preferences
-- Read by: notification scheduler, reminders.tsx settings screen
--
-- reminder_time: 24h format string e.g. '09:00', '20:30'

INSERT INTO reminder_preferences (id, user_id, notifications_enabled, period_start, period_end, ovulation, fertile_window, medication, hydration, reminder_time)
VALUES (
  uuid_generate_v4(),
  test_user_id,
  TRUE,   -- notifications on
  TRUE,   -- remind before period starts
  FALSE,  -- don't remind when period ends
  TRUE,   -- remind on ovulation day
  TRUE,   -- remind when fertile window opens
  FALSE,  -- no medication reminders
  TRUE,   -- hydration reminders enabled
  '08:30' -- remind at 8:30 AM
)
ON CONFLICT (user_id) DO UPDATE SET
  notifications_enabled = EXCLUDED.notifications_enabled,
  hydration = EXCLUDED.hydration,
  reminder_time = EXCLUDED.reminder_time;


-- ================================
-- 11. SEXUAL_ACTIVITY_LOGS TABLE
-- ================================
-- Sexual activity tracking with cycle phase correlation.
-- ONE row per user per date.
--
-- Data flow: log-entry.tsx (sexual activity section) → Supabase sexual_activity_logs
-- Read by: analytics, AI insights (libido-cycle correlation), relationship dashboard
--
-- NOTE: user_id is TEXT (not UUID) in this table — uses auth.uid()::text
-- libido: 'low' | 'moderate' | 'high'
-- comfort: 'comfortable' | 'some_discomfort' | 'painful'
-- cycle_phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown'

INSERT INTO sexual_activity_logs (id, user_id, date, protected, protection_type, libido, comfort, orgasm, notes, cycle_phase) VALUES
(uuid_generate_v4(), test_user_id::text, CURRENT_DATE - INTERVAL '20 days', TRUE,  'condom',     'high',     'comfortable',     TRUE,  'Follicular phase — high energy',            'follicular'),
(uuid_generate_v4(), test_user_id::text, CURRENT_DATE - INTERVAL '14 days', TRUE,  'condom',     'high',     'comfortable',     TRUE,  'Ovulation day — peak libido',               'ovulation'),
(uuid_generate_v4(), test_user_id::text, CURRENT_DATE - INTERVAL '13 days', FALSE, NULL,         'high',     'comfortable',     TRUE,  'Day after ovulation, still feeling great',   'ovulation'),
(uuid_generate_v4(), test_user_id::text, CURRENT_DATE - INTERVAL '10 days', TRUE,  'condom',     'moderate', 'comfortable',     FALSE, 'Luteal phase — lower energy',               'luteal'),
(uuid_generate_v4(), test_user_id::text, CURRENT_DATE - INTERVAL '4 days',  TRUE,  'condom',     'low',      'some_discomfort',  FALSE, 'PMS — not really in the mood but tried',    'luteal');


-- ================================
-- 12. DAILY CHECK-INS TABLE
-- ================================
INSERT INTO daily_checkins (id, user_id, date, mood, energy_level, stress_level, sleep_quality, symptoms) VALUES
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '3 days', 'tired',    2, 4, 3, ARRAY['cramps','fatigue']),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '2 days', 'anxious',  3, 3, 3, ARRAY['headache']),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '1 day',  'tired',    2, 3, 2, ARRAY['cramps','back_pain']),
(uuid_generate_v4(), test_user_id, CURRENT_DATE,                      'neutral',  3, 3, 3, ARRAY['fatigue']);


-- ================================
-- 13. PCOS SYMPTOM LOGS TABLE
-- ================================
INSERT INTO pcos_symptom_logs (id, user_id, date, symptoms, history, updated_at) VALUES
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '7 days',
  '[{"id":"irregular_periods","name":"Irregular Periods","severity":"moderate","tracked":true},{"id":"acne","name":"Acne & Skin Changes","severity":"mild","tracked":true}]'::jsonb,
  '[]'::jsonb, NOW() - INTERVAL '7 days'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE,
  '[{"id":"irregular_periods","name":"Irregular Periods","severity":"moderate","tracked":true},{"id":"fatigue","name":"Fatigue & Low Energy","severity":"mild","tracked":true}]'::jsonb,
  '[]'::jsonb, NOW());


-- ================================
-- 14. SYMPTOM CHECKER LOGS TABLE
-- ================================
INSERT INTO symptom_checker_logs (id, user_id, symptom, analysis, created_at) VALUES
(uuid_generate_v4(), test_user_id, 'Sharp lower abdominal pain on one side',
  'This could be ovulation pain (mittelschmerz), which is common mid-cycle. If pain is severe, persistent, or accompanied by fever or heavy bleeding, consult a healthcare provider.',
  NOW() - INTERVAL '5 days'),
(uuid_generate_v4(), test_user_id, 'Headache and fatigue before period',
  'Pre-menstrual headaches and fatigue are common PMS symptoms caused by hormonal fluctuations. Staying hydrated, getting adequate sleep, and managing stress may help. Consider tracking these patterns.',
  NOW() - INTERVAL '2 days');


-- ================================
-- 15. PERIMENOPAUSE SAMPLE DATA
-- ================================
-- Note: Only insert if user has perimenopause life stage
-- These serve as reference data structure examples

-- Perimenopause day logs (sample)
INSERT INTO perimenopause_day_logs (id, user_id, date, symptoms, mood, hot_flash_count, hot_flash_intensity, night_sweats_count, sleep_hours, sleep_quality, energy_level, notes) VALUES
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '5 days',
  ARRAY['hot_flashes','sleep_issues','mood_changes'], 'low', 3, 'moderate', 1, 5.5, 'poor', 4,
  'Woke up twice from night sweats. Feeling drained.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '3 days',
  ARRAY['brain_fog','fatigue','joint_pain'], 'okay', 1, 'mild', 0, 6.5, 'fair', 5,
  'Better sleep but still foggy at work.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '1 day',
  ARRAY['hot_flashes','anxiety'], 'anxious', 4, 'severe', 2, 5.0, 'poor', 3,
  'Bad day. Multiple hot flashes during a meeting.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE,
  ARRAY['fatigue','mood_changes'], 'good', 1, 'mild', 0, 7.0, 'good', 6,
  'Better today. Yoga seemed to help.');


-- ================================
-- 16. PREGNANCY / POSTPARTUM SAMPLE DATA
-- ================================
-- Pregnancy day logs (sample)
INSERT INTO pregnancy_day_logs (id, user_id, date, week, symptoms, mood, weight, water_intake, sleep, notes) VALUES
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '4 days', 12,
  ARRAY['nausea','fatigue','food_aversions'], 'tired', 62.5, 2000, 7.0,
  'Morning sickness still present but easing up.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '2 days', 12,
  ARRAY['breast_tenderness','frequent_urination'], 'happy', 62.7, 2200, 7.5,
  'Felt the first flutter! So exciting.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE, 13,
  ARRAY['fatigue','heartburn'], 'peaceful', 63.0, 2100, 6.5,
  'Entering second trimester. Energy slowly returning.');

-- Postpartum day logs (sample)
INSERT INTO postpartum_day_logs (id, user_id, date, weeks_postpartum, symptoms, mood, bleeding_level, sleep, notes) VALUES
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '6 days', 2,
  ARRAY['bleeding','cramping','fatigue','breast_engorgement'], 'tired', 'moderate', 4.0,
  'Baby feeding every 2-3 hours. Exhausted but happy.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '3 days', 3,
  ARRAY['fatigue','mood_swings','nipple_soreness'], 'emotional', 'light', 5.0,
  'Crying at everything. Lactation consultant helped with latch.'),
(uuid_generate_v4(), test_user_id, CURRENT_DATE, 3,
  ARRAY['fatigue','back_pain'], 'happy', 'spotting', 5.5,
  'Getting into a rhythm. Baby smiled today!');

-- Postpartum assessment (sample)
INSERT INTO postpartum_assessments (id, user_id, date, responses, score, level, warnings, weeks_postpartum) VALUES
(uuid_generate_v4(), test_user_id, CURRENT_DATE - INTERVAL '7 days',
  '{"q1":1,"q2":2,"q3":1,"q4":0,"q5":1,"q6":1,"q7":0,"q8":0,"q9":0,"q10":0}'::jsonb,
  6, 'low', ARRAY[]::TEXT[], 2);


END $;


-- ================================
-- VERIFICATION QUERIES
-- ================================
-- Run these after seeding to verify data was inserted correctly.
-- Each should return rows.

-- Check all tables have data:
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'custom_symptoms', COUNT(*) FROM custom_symptoms
UNION ALL SELECT 'symptom_logs', COUNT(*) FROM symptom_logs
UNION ALL SELECT 'mood_logs', COUNT(*) FROM mood_logs
UNION ALL SELECT 'lifestyle_logs', COUNT(*) FROM lifestyle_logs
UNION ALL SELECT 'predictions', COUNT(*) FROM predictions
UNION ALL SELECT 'ai_insights', COUNT(*) FROM ai_insights
UNION ALL SELECT 'ai_predictions', COUNT(*) FROM ai_predictions
UNION ALL SELECT 'partner_education_progress', COUNT(*) FROM partner_education_progress
UNION ALL SELECT 'reminder_preferences', COUNT(*) FROM reminder_preferences
UNION ALL SELECT 'sexual_activity_logs', COUNT(*) FROM sexual_activity_logs
UNION ALL SELECT 'daily_checkins', COUNT(*) FROM daily_checkins
UNION ALL SELECT 'pcos_symptom_logs', COUNT(*) FROM pcos_symptom_logs
UNION ALL SELECT 'symptom_checker_logs', COUNT(*) FROM symptom_checker_logs
UNION ALL SELECT 'perimenopause_day_logs', COUNT(*) FROM perimenopause_day_logs
UNION ALL SELECT 'pregnancy_day_logs', COUNT(*) FROM pregnancy_day_logs
UNION ALL SELECT 'postpartum_day_logs', COUNT(*) FROM postpartum_day_logs
UNION ALL SELECT 'postpartum_assessments', COUNT(*) FROM postpartum_assessments
ORDER BY table_name;

-- Sample cross-table query: Show a day's complete picture
-- This is how the app joins data for the daily view
SELECT
  sl.date,
  sl.cycle_day,
  sl.flow_intensity,
  sl.moods,
  sl.symptoms,
  sl.cravings,
  ll.sleep_hours,
  ll.exercise_minutes,
  ll.water_intake_ml,
  ll.stress_level
FROM symptom_logs sl
LEFT JOIN lifestyle_logs ll ON sl.user_id = ll.user_id AND sl.date = ll.date
ORDER BY sl.date DESC
LIMIT 5;
