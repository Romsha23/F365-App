# Country Feature Flags — Admin Guide

## Overview

The `country_feature_flags` table controls which features are visible/accessible per country and per subscription tier. This gives you full flexibility to:

- **Disable** a feature entirely for a country (regulatory, legal, or business reasons)
- **Restrict** a feature to paid users only in certain countries
- **Allow** a feature for everyone (free + paid) in a country

## Database Table: `country_feature_flags`

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Auto-generated primary key |
| `country_code` | TEXT | ISO 2-letter country code (e.g., `AU`, `PK`, `IN`, `US`) |
| `feature_key` | TEXT | Feature identifier (see full list below) |
| `is_enabled` | BOOLEAN | Master switch — `false` = blocked for everyone |
| `access_tier` | TEXT | `all` = everyone, `paid` = paid only, `disabled` = nobody |
| `reason` | TEXT | Custom message shown to user (optional) |
| `updated_by` | TEXT | Admin email/name who last changed it |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### How `is_enabled` + `access_tier` Work Together

| `is_enabled` | `access_tier` | Free User Sees | Paid User Sees | Use Case |
|---|---|---|---|---|
| `true` | `all` | Feature works | Feature works | Available to everyone |
| `true` | `paid` | "Upgrade to unlock" (gold badge) | Feature works | Premium feature in this country |
| `false` | `disabled` | "Not available in your region" (grey badge) | "Not available in your region" | Regulatory/legal block |
| `false` | `all` | "Not available in your region" | "Not available in your region" | Same as disabled |

**Rule: If `is_enabled = false`, it overrides `access_tier` — nobody gets access.**

### Default Behavior (No Row Exists)

If there is **no row** for a country + feature combination, the feature is **enabled for everyone** by default. You only need to insert rows for features you want to restrict or block.

## Complete Feature Keys

### Core Features
| Feature Key | Label | Description |
|---|---|---|
| `home_dashboard` | Home Dashboard | Main cycle tracking dashboard |
| `calendar` | Calendar | Period and cycle calendar view |
| `insights_tab` | Insights Tab | Cycle insights and pattern analysis |
| `mood_ai_tab` | Mood AI Tab | AI-powered mood prediction tab |
| `profile_tab` | Profile Tab | User profile and settings |
| `log_entry` | Daily Log Entry | Log symptoms, mood, flow, and lifestyle |
| `daily_checkin` | Daily Check-In | Quick daily mood and symptom check-in |
| `reminders` | Reminders | Custom health reminders |

### AI Features
| Feature Key | Label | Description |
|---|---|---|
| `ai_insights` | AI Insights | AI-generated health insights and predictions |
| `ai_chatbot` | AI Chatbot | Conversational AI health assistant |
| `ai_mood_forecast` | AI Mood Forecast | Predictive mood forecasting using AI |
| `advanced_analytics` | Advanced Analytics | Detailed cycle analytics and trends |
| `symptom_checker` | Symptom Checker | AI-powered symptom analysis |

### Pregnancy Features
| Feature Key | Label | Description |
|---|---|---|
| `pregnancy_mode` | Pregnancy Mode | Switch to pregnancy tracking |
| `pregnancy_dashboard` | Pregnancy Dashboard | Pregnancy progress and milestones |
| `pregnancy_calendar` | Pregnancy Calendar | Week-by-week pregnancy calendar |
| `pregnancy_log` | Pregnancy Log | Log pregnancy symptoms and notes |
| `pregnancy_setup` | Pregnancy Setup | Initial pregnancy information setup |
| `pregnancy_appointments` | Pregnancy Appointments | Track prenatal appointments |
| `baby_development` | Baby Development | Weekly baby growth tracker |
| `kick_counter` | Kick Counter | Track baby movements |
| `contraction_timer` | Contraction Timer | Time contractions during labor |
| `postpartum_dashboard` | Postpartum Dashboard | Postpartum recovery tracking |

### Partner Features
| Feature Key | Label | Description |
|---|---|---|
| `partner_sharing` | Partner Sharing | Share cycle data with partner |
| `partner_link` | Partner Link | Link partner account |
| `partner_summary` | Partner Summary | Partner view of cycle summary |
| `partner_education` | Partner Education | Educational content for partners |
| `relationship_dashboard` | Relationship Dashboard | Relationship insights and tips |

### Health Services
| Feature Key | Label | Description |
|---|---|---|
| `telehealth` | Telehealth | Virtual health consultations |
| `book_appointment` | Book Appointment | Book telehealth appointments |
| `my_appointments` | My Appointments | View scheduled appointments |
| `consultation` | Consultation | In-app health consultation |
| `emergency_contacts` | Emergency Contacts | Manage emergency contacts |

### Account & Settings
| Feature Key | Label | Description |
|---|---|---|
| `data_export` | Data Export | Export personal health data |
| `subscription_management` | Subscription Management | Manage subscription plan |
| `redeem_code` | Redeem Code | Redeem promotional codes |
| `edit_profile` | Edit Profile | Edit user profile details |
| `help_support` | Help & Support | Help center and FAQ |

### Legal & Compliance
| Feature Key | Label | Description |
|---|---|---|
| `privacy_policy` | Privacy Policy | View privacy policy |
| `terms_of_service` | Terms of Service | View terms of service |
| `consent_management` | Consent Management | Manage data processing consent |

## Example SQL — Admin Scenarios

### Scenario 1: Block AI Mood Forecast in Pakistan for everyone
```sql
INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, access_tier, reason, updated_by)
VALUES ('PK', 'ai_mood_forecast', false, 'disabled', 'Not available in this region', 'admin@flow365.com')
ON CONFLICT (country_code, feature_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  access_tier = EXCLUDED.access_tier,
  reason = EXCLUDED.reason,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();
```

### Scenario 2: Make AI Chatbot paid-only in India
```sql
INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, access_tier, reason, updated_by)
VALUES ('IN', 'ai_chatbot', true, 'paid', 'Upgrade to premium to access AI Chatbot', 'admin@flow365.com')
ON CONFLICT (country_code, feature_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  access_tier = EXCLUDED.access_tier,
  reason = EXCLUDED.reason,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();
```

### Scenario 3: Make Telehealth free for everyone in Australia
```sql
INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, access_tier, reason, updated_by)
VALUES ('AU', 'telehealth', true, 'all', NULL, 'admin@flow365.com')
ON CONFLICT (country_code, feature_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  access_tier = EXCLUDED.access_tier,
  reason = EXCLUDED.reason,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();
```

### Scenario 4: Re-enable a previously blocked feature
```sql
UPDATE country_feature_flags
SET is_enabled = true, access_tier = 'all', reason = NULL, updated_by = 'admin@flow365.com', updated_at = NOW()
WHERE country_code = 'PK' AND feature_key = 'ai_mood_forecast';
```

### Scenario 5: Bulk-disable all AI features for a country
```sql
INSERT INTO country_feature_flags (country_code, feature_key, is_enabled, access_tier, reason, updated_by)
VALUES
  ('PK', 'ai_insights', false, 'disabled', 'AI features unavailable in this region', 'admin@flow365.com'),
  ('PK', 'ai_chatbot', false, 'disabled', 'AI features unavailable in this region', 'admin@flow365.com'),
  ('PK', 'ai_mood_forecast', false, 'disabled', 'AI features unavailable in this region', 'admin@flow365.com'),
  ('PK', 'advanced_analytics', false, 'disabled', 'AI features unavailable in this region', 'admin@flow365.com'),
  ('PK', 'symptom_checker', false, 'disabled', 'AI features unavailable in this region', 'admin@flow365.com')
ON CONFLICT (country_code, feature_key) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  access_tier = EXCLUDED.access_tier,
  reason = EXCLUDED.reason,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();
```

## Loveable Admin Panel Prompts

Use these prompts in your Loveable admin app to build a management UI:

### Prompt 1: Feature Flag List View
```
Create a page called "Feature Flags" that displays all rows from the Supabase table 
"country_feature_flags". Show columns: country_code, feature_key, is_enabled (toggle), 
access_tier (dropdown: all/paid/disabled), reason (editable text), updated_by, updated_at.
Add filters for country_code and feature_key. Allow inline editing. 
Use the Supabase client to read/write data.
```

### Prompt 2: Bulk Feature Editor
```
Create a "Bulk Feature Editor" page. User selects a country from a dropdown. 
Then show ALL 42 feature keys as a table with columns: Feature Key, Label, Enabled (toggle), 
Access Tier (dropdown: all/paid/disabled), Reason (text input). 
Pre-populate from "country_feature_flags" table. If no row exists for a feature, 
show default as enabled + all. Save button upserts all changes to Supabase using 
ON CONFLICT (country_code, feature_key) DO UPDATE.
```

### Prompt 3: Country Overview Dashboard
```
Create a dashboard that shows a grid of all countries. For each country, show a 
count of: total flags, disabled features, paid-only features. Clicking a country 
opens the Bulk Feature Editor for that country.
```

## Supabase Dashboard (Manual Editing)

You can also manage flags directly in Supabase Table Editor:
1. Go to https://supabase.com/dashboard → your project → Table Editor
2. Select `country_feature_flags`
3. Add/edit rows directly
4. Key columns: `country_code`, `feature_key`, `is_enabled`, `access_tier`, `reason`

## AWS Migration Notes

If migrating to AWS (RDS PostgreSQL):
1. Export the `country_feature_flags` table: `pg_dump --table=country_feature_flags`
2. The table has no RLS dependency — it uses simple read-all policy
3. In AWS, implement access control at API layer (e.g., API Gateway + Lambda)
4. The app fetches flags via Supabase client — update the endpoint to your AWS API
5. Cache flags in CloudFront or ElastiCache for performance

## App Logic Flow

```
User opens app
  → App reads user.country from profile
  → loadFlags(country) fetches country_feature_flags for that country
  → setUserIsPaid(subscription.status === 'active') from subscription store
  → Each screen/card wrapped in <FeatureGate featureKey="xxx">
    → Checks: is_enabled? access_tier vs userIsPaid?
    → Result:
       ✅ Show feature normally
       🔒 Grey badge: "Not available in your region" (is_enabled=false)
       👑 Gold badge: "Upgrade to unlock" (access_tier=paid, user is free)
```
