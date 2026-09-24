# Loveable Admin Panel — Country Feature Flags Management

## Database Table: `country_feature_flags`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Auto-generated primary key |
| country_code | TEXT | Country name (e.g. "Pakistan", "Australia") |
| feature_key | TEXT | Feature identifier from the list below |
| is_enabled | BOOLEAN | true = enabled, false = blocked |
| reason | TEXT | Message shown to user when blocked |
| updated_by | TEXT | Admin who made the change |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-set |

**Unique constraint:** `(country_code, feature_key)` — one row per country+feature combo.

**Logic:** If NO row exists for a country+feature, the feature is ENABLED by default. Only insert rows to DISABLE features.

---

## All Feature Keys (41 total)

### Core Features
| Key | Label | Screen/Route |
|-----|-------|-------------|
| `home_dashboard` | Home Dashboard | `/(tabs)/index` |
| `calendar` | Calendar | `/(tabs)/calendar` |
| `insights_tab` | Insights Tab | `/(tabs)/insights` |
| `log_entry` | Daily Log Entry | `/log-entry` |
| `daily_checkin` | Daily Check-In | Modal on home |
| `reminders` | Reminders | `/reminders` |

### AI Features
| Key | Label | Screen/Route |
|-----|-------|-------------|
| `mood_ai_tab` | Mood AI Tab | `/(tabs)/predictive-mood` |
| `ai_insights` | AI Insights | `/ai-insights` |
| `ai_chatbot` | AI Chatbot | `/ai-chatbot` |
| `ai_mood_forecast` | AI Mood Forecast | `/ai-insights` (mood section) |
| `advanced_analytics` | Advanced Analytics | `/advanced-analytics` |
| `symptom_checker` | Symptom Checker | `/symptom-checker` |

### Pregnancy Features
| Key | Label | Screen/Route |
|-----|-------|-------------|
| `pregnancy_mode` | Pregnancy Mode | Mode switch on home |
| `pregnancy_dashboard` | Pregnancy Dashboard | `/pregnancy-dashboard` |
| `pregnancy_calendar` | Pregnancy Calendar | `/pregnancy-calendar` |
| `pregnancy_log` | Pregnancy Log | `/pregnancy-log` |
| `pregnancy_setup` | Pregnancy Setup | `/pregnancy-setup` |
| `pregnancy_appointments` | Pregnancy Appointments | `/pregnancy-appointments` |
| `baby_development` | Baby Development | `/baby-development` |
| `kick_counter` | Kick Counter | `/kick-counter` |
| `contraction_timer` | Contraction Timer | `/contraction-timer` |
| `postpartum_dashboard` | Postpartum Dashboard | `/postpartum-dashboard` |

### Partner Features
| Key | Label | Screen/Route |
|-----|-------|-------------|
| `partner_sharing` | Partner Sharing | `/partner-sharing` |
| `partner_link` | Partner Link | `/partner-link` |
| `partner_summary` | Partner Summary | `/partner-summary` |
| `partner_education` | Partner Education | `/partner-education` |
| `relationship_dashboard` | Relationship Dashboard | `/relationship-dashboard` |

### Health Services
| Key | Label | Screen/Route |
|-----|-------|-------------|
| `telehealth` | Telehealth | `/telehealth` |
| `book_appointment` | Book Appointment | `/book-appointment` |
| `my_appointments` | My Appointments | `/my-appointments` |
| `consultation` | Consultation | `/consultation` |
| `emergency_contacts` | Emergency Contacts | `/emergency-contacts` |

### Account & Settings
| Key | Label | Screen/Route |
|-----|-------|-------------|
| `profile_tab` | Profile Tab | `/(tabs)/profile` |
| `data_export` | Data Export | `/data-export` |
| `subscription_management` | Subscription Management | `/subscription-management` |
| `redeem_code` | Redeem Code | `/redeem-code` |
| `edit_profile` | Edit Profile | `/edit-profile` |
| `help_support` | Help & Support | `/help` |

### Legal & Compliance
| Key | Label | Screen/Route |
|-----|-------|-------------|
| `privacy_policy` | Privacy Policy | `/privacy-policy` |
| `terms_of_service` | Terms of Service | `/terms-of-service` |
| `consent_management` | Consent Management | `/consent` |

---

## Loveable Prompts for Admin Panel

### Prompt 1: Create the Feature Flags Admin Page

```
Create an admin page called "Country Feature Flags" that manages the `country_feature_flags` Supabase table.

Requirements:
1. At the top, show a country dropdown (searchable) to select a country.
2. When a country is selected, fetch all rows from `country_feature_flags` WHERE country_code = selected country.
3. Display ALL 41 features grouped by category (Core, AI, Pregnancy, Partner, Health, Account, Legal).
4. Each feature shows:
   - Feature label and description
   - A toggle switch (ON = enabled, OFF = disabled)
   - A text field for "reason" (shown to user when disabled)
   - Features with NO database row default to ON (enabled)
5. When admin toggles OFF: UPSERT into country_feature_flags with is_enabled=false
6. When admin toggles ON: DELETE the row from country_feature_flags (reverts to default enabled)
7. Add a "Bulk Actions" section:
   - "Disable all AI features" button
   - "Disable all Pregnancy features" button
   - "Enable all features" button (deletes all rows for that country)
8. Show last updated timestamp and updated_by for each flag.
9. Only users with role='admin' in the users table can access this page.

The feature keys are:
Core: home_dashboard, calendar, insights_tab, log_entry, daily_checkin, reminders
AI: mood_ai_tab, ai_insights, ai_chatbot, ai_mood_forecast, advanced_analytics, symptom_checker
Pregnancy: pregnancy_mode, pregnancy_dashboard, pregnancy_calendar, pregnancy_log, pregnancy_setup, pregnancy_appointments, baby_development, kick_counter, contraction_timer, postpartum_dashboard
Partner: partner_sharing, partner_link, partner_summary, partner_education, relationship_dashboard
Health: telehealth, book_appointment, my_appointments, consultation, emergency_contacts
Account: profile_tab, data_export, subscription_management, redeem_code, edit_profile, help_support
Legal: privacy_policy, terms_of_service, consent_management

Table schema:
- id: UUID (auto)
- country_code: TEXT (country name like "Pakistan")
- feature_key: TEXT
- is_enabled: BOOLEAN
- reason: TEXT (nullable)
- updated_by: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- UNIQUE(country_code, feature_key)
```

### Prompt 2: Add Country Flags Overview Dashboard

```
Create a dashboard page called "Feature Flags Overview" that shows:

1. A summary table with columns: Country | Total Disabled | AI Disabled | Pregnancy Disabled | Last Updated
2. Data comes from `country_feature_flags` WHERE is_enabled = false, grouped by country_code
3. Click a country row to navigate to the detailed feature flags editor for that country
4. Add a search/filter bar at the top
5. Show a "Countries with restrictions" count badge
6. Add an "Add Country Restriction" button that opens the country selector

This page should be the entry point in the admin sidebar under "Feature Management".
```

### Prompt 3: Add Audit Log for Feature Flag Changes

```
Add audit logging for feature flag changes:
1. Create a table `feature_flag_audit_log` with columns:
   - id UUID, admin_user_id TEXT, country_code TEXT, feature_key TEXT, 
   - old_value BOOLEAN, new_value BOOLEAN, reason TEXT, created_at TIMESTAMPTZ
2. When any flag is changed in the admin panel, insert an audit row
3. Add an "Audit Log" tab on the feature flags page showing recent changes
4. Show: timestamp, admin email, country, feature, old->new value, reason
```

---

## Supabase Dashboard Quick Reference

To manage directly in Supabase Table Editor:

1. Go to **Table Editor** > `country_feature_flags`
2. To disable a feature: Click **Insert Row**, fill in:
   - `country_code`: e.g. `Pakistan`
   - `feature_key`: e.g. `ai_mood_forecast`
   - `is_enabled`: `false`
   - `reason`: e.g. `AI features not available in this region`
   - `updated_by`: your admin email
3. To re-enable: Delete the row, or set `is_enabled` to `true`
4. To bulk disable: Use SQL Editor with the INSERT statements from `COUNTRY_FEATURE_FLAGS_SETUP.sql`

---

## AWS Migration Notes

When migrating to AWS:
1. The `country_feature_flags` table is standard PostgreSQL — migrate with `pg_dump`/`pg_restore`
2. RLS policies need to be converted to application-level authorization in the API layer
3. The admin panel queries can be exposed via a protected admin API endpoint
4. Consider caching feature flags in Redis/ElastiCache for performance (country flags rarely change)
5. Add CloudWatch alarms for unexpected bulk flag changes
