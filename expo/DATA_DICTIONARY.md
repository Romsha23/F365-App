# Data Dictionary — f365.app

## How to Use This Document
This explains every Supabase table, what each column means, how tables relate to each other, and which app screens read/write to them. Use this alongside `SEED_DATA.sql` to understand the full data flow.

---

## Table Relationship Diagram (Text)

```
users (1)
  │
  ├──< custom_symptoms (many)        — user-defined symptom names
  ├──< symptom_logs (many)           — daily health logs (1 per day)
  ├──< mood_logs (many)              — mood entries (multiple per day)
  ├──< lifestyle_logs (many)         — sleep/exercise/water (1 per day)
  ├──< predictions (many)            — cycle predictions (updated periodically)
  ├──< ai_insights (many)            — AI-generated health insights
  ├──< ai_predictions (many)         — AI mood/energy forecasts
  ├──< partner_education_progress (many) — education card completion
  ├──< reminder_preferences (1)      — notification settings
  └──< sexual_activity_logs (many)   — intimacy tracking (1 per day)
```

All child tables have `ON DELETE CASCADE` — deleting a user removes all their data.

---

## Tables

### 1. `users`
**Purpose:** Core user profile. Created on registration/onboarding.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | `a1b2c3d4-...` | Set to `auth.uid()` automatically |
| created_at | TIMESTAMPTZ | `2026-03-01 10:00:00+11` | Auto-set |
| display_name | TEXT | `Luna Spark` | AI-generated fun nickname |
| email | TEXT | `user@f365.app` | Encrypted at rest (AES-256) + in transit (TLS) |
| is_premium | BOOLEAN | `false` | Toggled by subscription system |
| average_cycle_length | INTEGER | `28` | Set in onboarding, refined by predictions |
| average_period_length | INTEGER | `5` | Set in onboarding, refined by predictions |
| notifications_enabled | BOOLEAN | `true` | Master notification toggle |
| insights_enabled | BOOLEAN | `true` | AI insights on/off |
| onboarded | BOOLEAN | `true` | Set after onboarding flow completes |

**Written by:** `onboarding.tsx`, `edit-profile.tsx`, `subscription.tsx`
**Read by:** Dashboard, profile, all features that check premium status

---

### 2. `custom_symptoms`
**Purpose:** User-created symptom names (beyond built-in symptoms like Cramps, Headache, etc.)

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto-generated | |
| user_id | UUID (FK → users) | matches auth user | |
| name | TEXT | `Brain fog` | Free text symptom name |
| created_at | TIMESTAMPTZ | auto | |

**Written by:** `log-entry.tsx` (add custom symptom button)
**Read by:** `log-entry.tsx` (symptom picker list)

---

### 3. `symptom_logs` ⭐ PRIMARY DATA TABLE
**Purpose:** The main daily health log. One entry per user per day. This is the most important table — most features derive data from here.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | |
| date | DATE | `2026-03-07` | UNIQUE with user_id |
| cycle_day | INTEGER | `14` | 1-based, calculated from last period start |
| symptoms | JSONB | `[{"name":"Cramps","severity":3}]` | Array of objects with name + severity (1-5) |
| moods | TEXT[] | `{happy,anxious}` | Postgres text array |
| notes | TEXT | `Felt great today` | Free text journal |
| flow_intensity | TEXT | `heavy` | `none`/`spotting`/`light`/`medium`/`heavy` |
| discharge_type | TEXT | `egg_white` | `none`/`sticky`/`creamy`/`watery`/`egg_white` |
| pain_level | TEXT | `moderate` | `none`/`mild`/`moderate`/`severe` |
| cravings | TEXT[] | `{chocolate,salty}` | Postgres text array |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | Updated on edit |

**Written by:** `log-entry.tsx`, `DailyCheckInModal.tsx`
**Read by:** Dashboard, calendar, AI insights, analytics, predictions, charts
**Joins with:** `lifestyle_logs` (on user_id + date), `mood_logs` (on user_id + date), `sexual_activity_logs` (on user_id + date)

---

### 4. `mood_logs`
**Purpose:** Granular mood tracking with numeric scores. Multiple entries per day allowed (e.g., morning happy, evening anxious).

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | |
| date | DATE | `2026-03-07` | NOT unique — multiple moods per day |
| mood_type | TEXT | `happy` | `happy`/`sad`/`anxious`/`angry`/`calm`/`energetic`/`tired`/`irritable`/`confident`/`neutral` |
| mood_score | INTEGER (0-100) | `85` | Overall wellness score for this entry |
| intensity | INTEGER (1-5) | `4` | How strongly the mood is felt |
| notes | TEXT | `Great energy today` | Optional |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

**Written by:** `log-entry.tsx`, `DailyCheckInModal.tsx`
**Read by:** `MoodChart.tsx`, `MoodTimelineChart.tsx`, AI insights, analytics

**Key insight for developers:** `mood_logs` captures *individual* mood types with scores, while `symptom_logs.moods` is a simple array of mood labels. Both are written together from `log-entry.tsx`. The mood_logs table enables charting and AI analysis with numeric data.

---

### 5. `lifestyle_logs`
**Purpose:** Daily lifestyle metrics — sleep, exercise, hydration, stress.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | |
| date | DATE | `2026-03-07` | UNIQUE with user_id |
| stress_level | INTEGER (1-5) | `3` | 1=low, 5=high |
| sleep_hours | NUMERIC(3,1) | `7.5` | Decimal hours |
| exercise_minutes | INTEGER | `45` | |
| water_intake_ml | INTEGER | `2500` | 1 glass ≈ 250ml |
| notes | TEXT | `Went for a run` | Optional |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

**Written by:** `log-entry.tsx` (lifestyle section)
**Read by:** Dashboard stats, analytics, AI insights (correlates sleep/exercise with mood/symptoms)

---

### 6. `predictions`
**Purpose:** Algorithm-generated cycle predictions. Updated when enough new data is available.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | |
| next_period_date | DATE | `2026-04-04` | Predicted next period start |
| fertile_window_start | DATE | `2026-03-19` | |
| fertile_window_end | DATE | `2026-03-23` | |
| average_cycle_length | INTEGER | `28` | Calculated from user's history |
| average_period_length | INTEGER | `5` | Calculated from user's history |
| confidence | NUMERIC(3,2) | `0.82` | 0.00-1.00, higher = more data |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

**Written by:** Prediction algorithm (runs after log entries with period data)
**Read by:** Dashboard (countdown to next period), calendar (highlighted dates), fertility window display

---

### 7. `ai_insights`
**Purpose:** AI-generated insights about the user's health patterns.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | |
| type | TEXT | `pattern` | `pattern`/`recommendation`/`alert`/`correlation`/`wellness` |
| title | TEXT | `PMS Pattern Detected` | Short headline |
| description | TEXT | `Your data shows...` | Full insight text (can be long) |
| icon | TEXT | `TrendingUp` | Lucide icon name for UI |
| color | TEXT | `#E07C5A` | Hex color for card accent |
| read | BOOLEAN | `false` | Toggled when user views it |
| created_at | TIMESTAMPTZ | auto | |

**Written by:** AI analysis engine (triggered periodically or after sufficient new logs)
**Read by:** `ai-insights.tsx`, dashboard insight cards

---

### 8. `ai_predictions`
**Purpose:** Forward-looking AI predictions for mood, energy, and symptom risk.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | |
| predicted_mood | NUMERIC(3,1) | `7.5` | 0.0-10.0 scale |
| confidence | NUMERIC(3,2) | `0.78` | 0.00-1.00 |
| prediction_date | DATE | `2026-03-08` | The date being predicted |
| prediction_type | TEXT | `mood` | `mood`/`energy`/`symptom_risk` |
| metadata | JSONB | `{"phase":"follicular",...}` | Model-specific context |
| created_at | TIMESTAMPTZ | auto | |

**Written by:** AI prediction model
**Read by:** Calendar (predicted mood overlay), dashboard forecast

---

### 9. `partner_education_progress`
**Purpose:** Tracks which educational cards have been completed in the partner education feature.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | |
| topic_id | TEXT | `understanding_cycles` | Matches app content IDs |
| card_id | TEXT | `cycle_phases` | Individual card within topic |
| completed_at | TIMESTAMPTZ | auto | UNIQUE(user_id, topic_id, card_id) |

**Written by:** `partner-education.tsx`
**Read by:** `partner-education.tsx` (progress bars), `partner-summary.tsx`

---

### 10. `reminder_preferences`
**Purpose:** Per-user notification settings. One row per user.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | UUID (FK → users) | | UNIQUE |
| notifications_enabled | BOOLEAN | `true` | Master toggle |
| period_start | BOOLEAN | `true` | Remind before period |
| period_end | BOOLEAN | `false` | Remind when period ends |
| ovulation | BOOLEAN | `true` | Ovulation day reminder |
| fertile_window | BOOLEAN | `true` | Fertile window opens |
| medication | BOOLEAN | `false` | Medication reminders |
| hydration | BOOLEAN | `true` | Water intake reminders |
| reminder_time | TEXT | `08:30` | 24h format |
| updated_at | TIMESTAMPTZ | auto | |

**Written by:** `reminders.tsx`
**Read by:** Notification scheduler, `reminders.tsx`

---

### 11. `sexual_activity_logs`
**Purpose:** Intimacy tracking correlated with cycle phases.

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| id | UUID (PK) | auto | |
| user_id | TEXT | `a1b2c3d4-...` | ⚠️ TEXT not UUID — uses `auth.uid()::text` |
| date | DATE | `2026-03-07` | UNIQUE with user_id |
| protected | BOOLEAN | `true` | Was protection used |
| protection_type | TEXT | `condom` | Free text, nullable |
| libido | TEXT | `high` | `low`/`moderate`/`high` |
| comfort | TEXT | `comfortable` | `comfortable`/`some_discomfort`/`painful` |
| orgasm | BOOLEAN | `true` | |
| notes | TEXT | `Peak energy day` | Optional |
| cycle_phase | TEXT | `ovulation` | `menstrual`/`follicular`/`ovulation`/`luteal`/`unknown` |
| created_at | TIMESTAMPTZ | auto | |

**Written by:** `log-entry.tsx` (sexual activity section)
**Read by:** Analytics, AI insights (libido-cycle correlation), `relationship-dashboard.tsx`

---

## Common Data Flow Patterns

### 1. Daily Logging Flow
```
User opens log-entry.tsx
  → Fills symptoms, mood, lifestyle, sexual activity
  → On save:
      → INSERT/UPSERT into symptom_logs (1 row)
      → INSERT into mood_logs (1+ rows)
      → INSERT/UPSERT into lifestyle_logs (1 row)
      → INSERT/UPSERT into sexual_activity_logs (1 row, if data provided)
      → Trigger prediction recalculation if period data changed
```

### 2. Dashboard Data Assembly
```
Dashboard loads:
  → SELECT latest from predictions (next period date, fertile window)
  → SELECT today's symptom_logs + lifestyle_logs (joined on date)
  → SELECT recent ai_insights WHERE read = false
  → SELECT ai_predictions for next 7 days
  → Display user.display_name from users table
```

### 3. AI Insight Generation
```
AI engine runs (periodic or after N new logs):
  → SELECT last 3 cycles of symptom_logs
  → SELECT corresponding mood_logs
  → SELECT corresponding lifestyle_logs
  → Analyse patterns, correlations, anomalies
  → INSERT new rows into ai_insights
  → INSERT prediction rows into ai_predictions
```

### 4. Calendar View
```
Calendar loads for a month:
  → SELECT symptom_logs WHERE date BETWEEN month_start AND month_end
  → SELECT mood_logs for same range
  → SELECT predictions (period + fertile window dates)
  → SELECT ai_predictions for future dates
  → Render: period days (red), fertile window (green), predicted mood (gradient)
```

---

## Key Cross-Table Joins

| Query Purpose | Tables Joined | Join Key |
|--------------|---------------|----------|
| Full daily view | symptom_logs + lifestyle_logs + mood_logs | user_id + date |
| Cycle overview | symptom_logs + predictions | user_id, date ranges |
| AI analysis input | symptom_logs + mood_logs + lifestyle_logs + sexual_activity_logs | user_id + date |
| Partner view | users + partner_education_progress | user_id |
| Notification scheduling | users + reminder_preferences + predictions | user_id |

---

## Running Seed Data

1. Run `SETUP_DATABASE.sql` first (creates tables + RLS policies)
2. Go to Supabase Auth → Users, copy a user UUID
3. In `SEED_DATA.sql`, find-replace `REPLACE_WITH_AUTH_USER_ID` with the UUID
4. Run `SEED_DATA.sql` in SQL Editor
5. Run the verification queries at the bottom to confirm all tables have data
