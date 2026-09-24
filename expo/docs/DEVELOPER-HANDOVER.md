# F365 Advanced - Developer Handover Document

**App Name:** F365 Advanced
**Platform:** React Native (Expo SDK 54) - iOS, Android, Web
**Bundle ID (iOS):** app.rork.f365-advanced
**Package (Android):** app.rork.f365_advanced
**Last Updated:** 2026-02-14

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend - Screens & Features](#2-frontend---screens--features)
3. [Backend - API & Server Logic](#3-backend---api--server-logic)
4. [Database - Tables, Columns & Security](#4-database---tables-columns--security)
5. [Authentication Flow](#5-authentication-flow)
6. [State Management](#6-state-management)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Business Logic](#8-business-logic)
9. [AI Guardrails - Implemented vs Planned for AWS](#9-ai-guardrails---implemented-vs-planned-for-aws)
10. [Environment Variables & Secrets](#10-environment-variables--secrets)
11. [Migration Plan Summary](#11-migration-plan-summary)

---

## 1. ARCHITECTURE OVERVIEW

```
Frontend (React Native / Expo Router)
    |
    |-- Zustand (client state management)
    |-- AsyncStorage (local persistence)
    |-- Supabase JS Client (direct DB access from client)
    |
    |-- tRPC Client --> Hono Server (backend API)
    |                      |
    |                      |-- tRPC Router
    |                      |     |-- ai/predictions (OpenAI GPT-4o)
    |                      |     |-- ai/chat (@rork-ai/toolkit-sdk)
    |                      |     |-- ai/predict-mood (cycle-based algo)
    |                      |     |-- ai/explain-mood (template-based)
    |                      |     |-- db/migrate (Supabase schema)
    |                      |
    |                      |-- Supabase (PostgreSQL)
    |
    |-- Mixpanel (analytics)
    |-- Stripe (payments via hosted checkout)
    |-- Expo Notifications (push)
```

**Tech Stack:**
- **Framework:** Expo SDK 54, React Native 0.81.5, React 19.1
- **Routing:** Expo Router v6 (file-based, tabs + stack)
- **State:** Zustand v5 (9 stores, some with persist middleware)
- **Backend:** Hono + tRPC (deployed via Rork platform)
- **Database:** Supabase (PostgreSQL) with RLS
- **AI:** OpenAI GPT-4o (predictions), @rork-ai/toolkit-sdk (chat)
- **Payments:** Stripe (hosted checkout links, test mode)
- **Analytics:** Mixpanel (custom HTTP implementation)
- **Notifications:** Expo Notifications
- **Fonts:** Cormorant Garamond + DM Sans (Google Fonts)
- **Icons:** lucide-react-native
- **Charts:** react-native-chart-kit

---

## 2. FRONTEND - SCREENS & FEATURES

### 2.1 Tab Screens (Main Navigation)

| Tab | File | Purpose |
|-----|------|---------|
| **Home** | `app/(tabs)/index.tsx` | Main dashboard. Cycle status ring, period/fertile predictions, quick-log button, streak banner, daily check-in modal trigger, irregularity alerts, AI tip card, storytelling insights |
| **Calendar** | `app/(tabs)/calendar.tsx` | Monthly calendar view. Color-coded days (period/fertile/ovulation/predicted). Day selection opens log entry. Cycle phase indicators |
| **Insights** | `app/(tabs)/insights.tsx` | AI-generated insights cards, health analysis summary, cycle charts (CycleChart), mood charts (MoodChart), streak card, symptom correlation data |
| **Mood AI** | `app/(tabs)/predictive-mood.tsx` | Predictive mood timeline (7-30 days ahead). Mood score graph (MoodTimelineChart). Tap for AI explanation. Confidence badges. tRPC integration for predictions |
| **Profile** | `app/(tabs)/profile.tsx` | User profile display, subscription status, navigation to edit-profile, settings, help, data export, consent, privacy, terms, subscription management, pregnancy mode toggle |

### 2.2 Authentication Screens

| Screen | File | Purpose |
|--------|------|---------|
| **Login** | `app/login.tsx` | Email/password login via Supabase Auth. Demo mode button (no auth). Social login UI (not connected). Redirect to onboarding if new user |
| **Welcome** | `app/welcome.tsx` | First-time welcome screen with app overview |
| **Onboarding** | `app/onboarding.tsx` | Multi-step onboarding (1909 LOC). Collects: birth month/year, gender, ethnicity, activity level, diet, sleep pattern, stress, health conditions, contraceptive type, climate, cycle length, period length. Saves to Supabase users table |
| **Reset Password** | `app/reset-password.tsx` | Supabase password reset flow |
| **Consent** | `app/consent.tsx` | GDPR/privacy consent collection. AI processing consent with date stamp |

### 2.3 Core Feature Screens

| Screen | File | Purpose |
|--------|------|---------|
| **Log Entry** | `app/log-entry.tsx` | Modal for daily logging. Flow intensity, mood, symptoms (with intensity slider), discharge type, pain level, cravings, sexual activity, notes, stress, sleep, exercise, water intake, temperature, weight, medications. Uses multiple picker components |
| **AI Chatbot** | `app/ai-chatbot.tsx` | Chat interface. Messages sent via tRPC `ai.chat` mutation. System prompt includes health assistant context. Message history maintained in state |
| **AI Insights** | `app/ai-insights.tsx` | Detailed AI analysis. Calls tRPC `ai.getPredictions`. Displays next period prediction, ovulation window, health tip. Storytelling insights component. Health analysis sections |
| **Advanced Analytics** | `app/advanced-analytics.tsx` | Charts and statistics. Cycle length trends, symptom frequency, mood patterns, flow intensity distribution. Uses react-native-chart-kit |
| **Symptom Checker** | `app/symptom-checker.tsx` | Guided symptom assessment. Severity evaluation. Suggests when to see a doctor. Disclaimer banner |
| **Data Export** | `app/data-export.tsx` | Export user data as JSON/CSV. GDPR right-to-access compliance. Cycle data, predictions, insights, profile data. Delete all data option |

### 2.4 Subscription & Payment Screens

| Screen | File | Purpose |
|--------|------|---------|
| **Subscription** | `app/subscription.tsx` | Paywall. Plan comparison (Free vs Monthly vs Yearly). Links to Stripe hosted checkout |
| **Subscription Management** | `app/subscription-management.tsx` | View current plan, cancel, reactivate. Refund calculation for yearly. Cancellation reason collection |
| **Subscription Success** | `app/subscription-success.tsx` | Post-payment confirmation |
| **Redeem Code** | `app/redeem-code.tsx` | Redemption code entry. Validates against `redemption_codes` Supabase table. Product types: supermoon, full_moon, starter |

### 2.5 Telehealth Screens

| Screen | File | Purpose |
|--------|------|---------|
| **Telehealth** | `app/telehealth.tsx` | Doctor directory (mock data). Specialty filters. Doctor cards with ratings |
| **Book Appointment** | `app/book-appointment.tsx` | Time slot selection. Consultation type (video/voice/chat). Symptom pre-fill |
| **My Appointments** | `app/my-appointments.tsx` | List of scheduled/completed/cancelled appointments |
| **Consultation** | `app/consultation.tsx` | Active consultation session UI. Session URL display |

### 2.6 Pregnancy Module Screens

| Screen | File | Purpose |
|--------|------|---------|
| **Pregnancy Dashboard** | `app/pregnancy-dashboard.tsx` | Stub/redirect. Week tracker, baby size, maternal changes |
| **Pregnancy Setup** | `app/pregnancy-setup.tsx` | Stub/redirect. Due date, LMP, blood type entry |
| **Pregnancy Calendar** | `app/pregnancy-calendar.tsx` | Stub. Trimester calendar view |
| **Pregnancy Log** | `app/pregnancy-log.tsx` | Stub. Daily pregnancy symptom logging |
| **Kick Counter** | `app/kick-counter.tsx` | Stub. Fetal movement tracking |
| **Contraction Timer** | `app/contraction-timer.tsx` | Stub. Labor contraction tracking |
| **Pregnancy Appointments** | `app/pregnancy-appointments.tsx` | Stub. OB/GYN appointment tracker |
| **Baby Development** | `app/baby-development.tsx` | Stub. Weekly development milestones |
| **Postpartum Dashboard** | `app/postpartum-dashboard.tsx` | Stub. Postpartum recovery tracking |

> **Note:** Pregnancy module screens are currently stubs (36-60 LOC each). The full data model and store (pregnancy-store.ts) are implemented with persistence, but the UI screens need to be built out.

### 2.7 Utility/Settings Screens

| Screen | File | Purpose |
|--------|------|---------|
| **Edit Profile** | `app/edit-profile.tsx` | Edit all onboarding fields. Syncs to Supabase |
| **Profile** | `app/profile.tsx` | Read-only profile view with navigation |
| **Help** | `app/help.tsx` | FAQ accordion, contact support via email |
| **Reminders** | `app/reminders.tsx` | Period, fertile window, daily log reminders. Uses expo-notifications |
| **Privacy Policy** | `app/privacy-policy.tsx` | Static privacy policy text |
| **Terms of Service** | `app/terms-of-service.tsx` | Static terms text |
| **Test Database** | `app/test-database.tsx` | Dev tool. Tests Supabase connection, runs migrations, verifies tables |

### 2.8 Reusable Components

| Component | Purpose |
|-----------|---------|
| `DailyCheckInModal` | 5-step daily check-in popup (mood, energy, stress, sleep, symptoms). Bridges data to cycle store |
| `DailyStreakBanner` | Animated streak counter with fire icon |
| `StreakCard` | Streak statistics display |
| `DisclaimerBanner` | Medical disclaimer with AI safety warnings |
| `CrisisSafetyFooter` | Emergency resources footer (crisis hotlines) |
| `ConfidenceBadge` | AI prediction confidence indicator |
| `PredictionCard` | Period/fertility prediction display |
| `InsightCard` | AI insight card with read/unread state |
| `IrregularityAlert` | Cycle irregularity warning banner |
| `StorytellingInsights` | Narrative-style health insights |
| `SubscriptionPaywall` | Inline paywall component |
| `MoodPicker` | Mood selection with emoji icons |
| `SymptomPicker` | Multi-select symptom picker with intensity |
| `FlowPicker` | Flow intensity selector |
| `DischargePicker` | Discharge type selector |
| `PainLevelPicker` | Pain level selector |
| `CravingsPicker` | Cravings multi-select |
| `SexualActivityPicker` | Protected/unprotected activity logger |
| `MoodChart` | Mood trend visualization |
| `MoodTimelineChart` | Predictive mood timeline graph |
| `CycleChart` | Cycle length trend chart |
| `CalendarDay` | Individual calendar day cell with status indicators |
| `Logo` | App logo component |
| `CosmicBackground` | Animated cosmic gradient background |
| `Card` | Reusable card container |
| `Button` | Styled button with variants |
| `RorkErrorBoundary` | Error boundary wrapper |

---

## 3. BACKEND - API & SERVER LOGIC

### 3.1 Server Setup

- **Framework:** Hono (mounted at `/api`)
- **RPC:** tRPC (mounted at `/api/trpc`)
- **Transformer:** superjson
- **CORS:** Enabled for all routes
- **Health Check:** `GET /api/` returns `{ status: "ok" }`

### 3.2 tRPC Router Structure

```
appRouter
  |-- example
  |     |-- hi (GET) - Health check / test endpoint
  |
  |-- ai
  |     |-- getPredictions (MUTATION) - OpenAI GPT-4o cycle predictions
  |     |-- chat (MUTATION) - AI health chatbot via @rork-ai/toolkit-sdk
  |     |-- predictMood (MUTATION) - Cycle-phase-based mood predictions
  |     |-- explainMood (MUTATION) - Template-based mood explanation
  |
  |-- db
        |-- migrate (QUERY) - Database schema migration
```

### 3.3 API Route Details

#### `ai.getPredictions`
- **Input:** userId, cycles[], currentEntry, age?, averageCycleLength?
- **Process:** Formats last 60 days of cycle data, sends to OpenAI GPT-4o with system prompt
- **Output:** `{ success, predictions: { nextPeriodStart, ovulationWindow, tip }, timestamp }`
- **Fallback:** Safe fallback response on any error (never throws to client)
- **AI Model:** GPT-4o via direct OpenAI API call (uses OPENAI_API_KEY)

#### `ai.chat`
- **Input:** messages[] (role: system/user/assistant, content: string)
- **Process:** Forwards to @rork-ai/toolkit-sdk `generateText()`
- **Output:** `{ success, completion }`
- **Fallback:** Returns apologetic message on error

#### `ai.predictMood`
- **Input:** datesAhead (1-30), userId, context (cycle info, recent data)
- **Process:** Algorithmic prediction based on cycle phase (period week, ovulation week, mid-cycle)
- **Output:** `{ success, predictions[], timeline[], confidence, generatedAt }`
- **Note:** Currently uses heuristic algorithm, NOT a trained ML model

#### `ai.explainMood`
- **Input:** date, prediction, context, userId
- **Process:** Template-based explanation using prediction factors and cycle data
- **Output:** `{ success, explanation, tips, reasoning, timestamp }`
- **Note:** No actual AI call - purely template-based string generation

#### `db.migrate`
- **Input:** None
- **Process:** Executes SQL DDL statements against Supabase via service key
- **Output:** `{ success, message, tables[], executed }`
- **Note:** Creates all 8 core tables with RLS policies

---

## 4. DATABASE - TABLES, COLUMNS & SECURITY

### 4.1 Database Provider
- **Provider:** Supabase (PostgreSQL)
- **Project:** dibuhpxjzgaxvvrbkofk
- **Region:** (Check Supabase dashboard)

### 4.2 Table Schema

#### `users`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | auth.uid() | PK, auto from auth |
| auth_id | TEXT | - | Supabase auth user ID |
| unique_id | TEXT | - | 7-digit app-generated ID |
| created_at | TIMESTAMPTZ | NOW() | |
| is_premium | BOOLEAN | FALSE | |
| birth_month | INTEGER | NULL | |
| birth_year | INTEGER | NULL | |
| gender | TEXT | NULL | |
| country | TEXT | NULL | |
| ethnicity | TEXT | NULL | |
| activity_level | TEXT | NULL | |
| diet_type | TEXT | NULL | |
| sleep_pattern | TEXT | NULL | |
| stress_level | TEXT | NULL | |
| health_conditions | TEXT[] | NULL | |
| contraceptive_type | TEXT | NULL | |
| climate_type | TEXT | NULL | |
| common_symptoms | TEXT[] | NULL | |
| average_cycle_length | INTEGER | 28 | |
| average_period_length | INTEGER | 5 | |
| notifications_enabled | BOOLEAN | TRUE | |
| insights_enabled | BOOLEAN | TRUE | |
| onboarded | BOOLEAN | FALSE | |
| consent_given | BOOLEAN | NULL | |
| ai_processing_consent | BOOLEAN | NULL | |
| ai_consent_date | TEXT | NULL | |
| subscription_active | BOOLEAN | NULL | |

#### `symptom_logs`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | uuid_generate_v4() | PK |
| user_id | UUID | - | FK -> users.id, CASCADE |
| date | DATE | - | NOT NULL |
| cycle_day | INTEGER | NULL | |
| symptoms | JSONB | '[]' | Array of {id, intensity, isCustom} |
| moods | TEXT[] | ARRAY[] | |
| notes | TEXT | NULL | |
| flow_intensity | TEXT | NULL | |
| discharge_type | TEXT | NULL | |
| pain_level | TEXT | NULL | |
| cravings | TEXT[] | ARRAY[] | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |
| **UNIQUE** | (user_id, date) | | |

#### `custom_symptoms`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | uuid_generate_v4() | PK |
| user_id | UUID | - | FK -> users.id, CASCADE |
| name | TEXT | - | NOT NULL |
| created_at | TIMESTAMPTZ | NOW() | |

#### `mood_logs`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | uuid_generate_v4() | PK |
| user_id | UUID | - | FK -> users.id, CASCADE |
| date | DATE | - | NOT NULL |
| mood_type | TEXT | - | NOT NULL |
| mood_score | INTEGER | - | CHECK 0-100 |
| intensity | INTEGER | - | CHECK 1-5 |
| notes | TEXT | NULL | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

#### `lifestyle_logs`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | uuid_generate_v4() | PK |
| user_id | UUID | - | FK -> users.id, CASCADE |
| date | DATE | - | NOT NULL |
| stress_level | INTEGER | - | CHECK 1-5 |
| sleep_hours | NUMERIC(3,1) | NULL | |
| exercise_minutes | INTEGER | NULL | |
| water_intake_ml | INTEGER | NULL | |
| notes | TEXT | NULL | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |
| **UNIQUE** | (user_id, date) | | |

#### `predictions`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | uuid_generate_v4() | PK |
| user_id | UUID | - | FK -> users.id, CASCADE |
| next_period_date | DATE | - | NOT NULL |
| fertile_window_start | DATE | - | NOT NULL |
| fertile_window_end | DATE | - | NOT NULL |
| average_cycle_length | INTEGER | - | NOT NULL |
| average_period_length | INTEGER | - | NOT NULL |
| confidence | NUMERIC(3,2) | 0.8 | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

#### `ai_insights`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | uuid_generate_v4() | PK |
| user_id | UUID | - | FK -> users.id, CASCADE |
| type | TEXT | - | NOT NULL (prediction/health/tip/alert) |
| title | TEXT | - | NOT NULL |
| description | TEXT | - | NOT NULL |
| icon | TEXT | - | NOT NULL |
| color | TEXT | - | NOT NULL |
| read | BOOLEAN | FALSE | |
| created_at | TIMESTAMPTZ | NOW() | |

#### `ai_predictions`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | uuid_generate_v4() | PK |
| user_id | UUID | - | FK -> users.id, CASCADE |
| predicted_mood | NUMERIC(3,1) | NULL | |
| confidence | NUMERIC(3,2) | NULL | |
| prediction_date | DATE | - | NOT NULL |
| prediction_type | TEXT | - | NOT NULL |
| metadata | JSONB | '{}' | mood, reason, factors, symptoms, suggestions |
| created_at | TIMESTAMPTZ | NOW() | |

#### `redemption_codes` (defined in Supabase types, may need manual creation)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | - | PK |
| code | TEXT | - | Unique redemption code |
| product_type | TEXT | - | 'supermoon' / 'full_moon' / 'starter' |
| product_name | TEXT | - | |
| status | TEXT | 'available' | 'available' / 'redeemed' / 'expired' |
| created_for_email | TEXT | NULL | |
| redeemed_by_user_id | TEXT | NULL | |
| redeemed_by_email | TEXT | NULL | |
| redeemed_at | TIMESTAMPTZ | NULL | |
| expires_at | TIMESTAMPTZ | NULL | |
| partner_id | TEXT | NULL | |
| created_at | TIMESTAMPTZ | NOW() | |

#### `subscriptions` (defined in Supabase types, may need manual creation)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | - | PK |
| user_id | UUID | - | FK -> users |
| stripe_subscription_id | TEXT | NULL | |
| stripe_customer_id | TEXT | NULL | |
| plan | TEXT | - | 'free' / 'monthly' / 'yearly' |
| status | TEXT | 'active' | Standard Stripe statuses |
| amount | NUMERIC | - | |
| currency | TEXT | 'USD' | |
| current_period_start | TIMESTAMPTZ | - | |
| current_period_end | TIMESTAMPTZ | - | |
| cancel_at_period_end | BOOLEAN | FALSE | |
| canceled_at | TIMESTAMPTZ | NULL | |
| cancellation_reason | TEXT | NULL | |
| refund_amount | NUMERIC | NULL | |
| refund_status | TEXT | NULL | 'pending' / 'processed' / 'failed' |
| refund_processed_at | TIMESTAMPTZ | NULL | |
| source | TEXT | - | 'stripe' / 'redemption_code' |
| redemption_code_id | TEXT | NULL | |
| created_at | TIMESTAMPTZ | NOW() | |
| updated_at | TIMESTAMPTZ | NOW() | |

#### `subscription_orders` (defined in types)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK |
| subscription_id | UUID | FK |
| stripe_payment_intent_id | TEXT | NULL |
| amount | NUMERIC | |
| currency | TEXT | 'USD' |
| status | TEXT | 'completed'/'pending'/'failed'/'refunded' |
| refund_amount | NUMERIC | NULL |
| created_at | TIMESTAMPTZ | |

#### `cancellation_requests` (defined in types)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK |
| subscription_id | UUID | FK |
| reason | TEXT | NULL |
| plan_type | TEXT | 'monthly'/'yearly' |
| refund_amount | NUMERIC | NULL |
| refund_status | TEXT | |
| effective_date | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| processed_at | TIMESTAMPTZ | NULL |

#### `daily_checkins` (used in store, may need manual creation)
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | FK |
| date | DATE | |
| mood | TEXT | |
| energy_level | INTEGER | |
| stress_level | INTEGER | |
| sleep_quality | INTEGER | |
| symptoms | TEXT[] | |
| created_at | TIMESTAMPTZ | |
| **UNIQUE** | (user_id, date) | |

### 4.3 Row Level Security (RLS)

ALL tables have RLS enabled. Policies enforce `auth.uid() = user_id` (or `auth.uid() = id` for users table):

- **SELECT:** User can only read own data
- **INSERT:** User can only insert data with own user_id
- **UPDATE:** User can only update own data
- **DELETE:** User can only delete own data (where applicable)

### 4.4 Database Indexes

```sql
idx_symptom_logs_user_date ON symptom_logs(user_id, date DESC)
idx_custom_symptoms_user ON custom_symptoms(user_id)
idx_predictions_user ON predictions(user_id)
idx_ai_insights_user ON ai_insights(user_id, read)
idx_mood_logs_user_date ON mood_logs(user_id, date DESC)
idx_lifestyle_logs_user_date ON lifestyle_logs(user_id, date DESC)
idx_ai_predictions_user_date ON ai_predictions(user_id, prediction_date DESC)
```

---

## 5. AUTHENTICATION FLOW

### 5.1 Provider
- **Supabase Auth** (email/password)
- Session persisted via AsyncStorage adapter
- Auto-refresh tokens enabled

### 5.2 Flow

```
App Open
  |
  |-- Check Supabase session (4s timeout)
  |     |
  |     |-- Session found --> Fetch user from `users` table by auth_id
  |     |     |-- User onboarded --> Navigate to /(tabs)
  |     |     |-- User not onboarded --> Navigate to /onboarding
  |     |
  |     |-- No session --> Show /login
  |
Login Screen
  |-- Email/password --> supabase.auth.signInWithPassword()
  |-- Demo mode --> loadMockUser() (no auth, local-only data)
  |
Register (during onboarding)
  |-- supabase.auth.signUp()
  |-- Insert into `users` table with auth_id
  |-- Collect profile data over onboarding steps
  |-- Mark onboarded = true on completion
  |
Logout
  |-- supabase.auth.signOut()
  |-- Clear Zustand stores
  |-- Navigate to /login
  |
Auth State Listener
  |-- supabase.auth.onAuthStateChange()
  |-- SIGNED_OUT event --> redirect to /login
```

### 5.3 Demo Mode
- Triggered from login screen "Try Demo" button
- Creates mock user in Zustand (no Supabase)
- All data operations store locally only
- `isDemoMode` flag in user-store prevents Supabase calls

---

## 6. STATE MANAGEMENT

### 6.1 Zustand Stores

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useUserStore` | `store/user-store.ts` | No (session-based) | User profile, auth state, demo mode |
| `useCycleStore` | `store/cycle-store.ts` | No (Supabase-synced) | Cycles, predictions, insights, health analysis, streaks, irregularity alerts |
| `useDailyCheckInStore` | `store/daily-checkin-store.ts` | Yes (AsyncStorage) | Daily check-in state, last 30 check-ins, bridges to cycle store |
| `useMoodPredictionStore` | `store/mood-prediction-store.ts` | No | Mood predictions, timeline, AI explanations, mood history |
| `usePregnancyStore` | `store/pregnancy-store.ts` | Yes (AsyncStorage) | Full pregnancy/postpartum data model. Profile, logs, appointments, kicks, contractions, baby data |
| `useSubscriptionStore` | `store/subscription-store.ts` | Yes (AsyncStorage) | Subscription state, plan, feature checks, refund logic |
| `useSymptomStore` | `store/symptom-store.ts` | Yes (AsyncStorage, partial) | Custom symptoms (Supabase-synced) |
| `useTelehealthStore` | `store/telehealth-store.ts` | Yes (AsyncStorage) | Mock doctors, appointments, consultation sessions |
| Secure Store | `store/secure-store.ts` | Yes (encrypted AsyncStorage) | Helper for encrypted Zustand persistence (HIPAA compliance pattern) |

### 6.2 Data Flow Pattern

```
User Action (UI)
  |
  v
Zustand Store (optimistic update)
  |
  v
Supabase Client (async sync)
  |
  v
On error: data stays in local store with warning
```

### 6.3 Caching & Offline

- **React Query** is initialized but used primarily for tRPC calls
- **Query defaults:** retry: 2, staleTime: 5 minutes
- **Offline-first:** Cycle store falls back to local if Supabase unavailable
- **Daily check-ins:** Stored locally (AsyncStorage), synced to Supabase when available
- **Pregnancy data:** Fully local (AsyncStorage persisted via Zustand)

---

## 7. THIRD-PARTY INTEGRATIONS

### 7.1 Supabase
- **Purpose:** Authentication + PostgreSQL database
- **Client:** `@supabase/supabase-js` v2.84
- **Config:** `lib/supabase.ts` (URL + anon key hardcoded)
- **Service Layer:** `lib/supabase-service.ts` (CRUD operations for cycles, predictions, insights, mood predictions)

### 7.2 Stripe
- **Purpose:** Subscription payments
- **Mode:** Test mode (configurable)
- **Integration:** Hosted checkout links (redirect to Stripe, not embedded)
- **Library:** `stripe` v20 (backend), no @stripe/stripe-react-native
- **Plans:**
  - Monthly: $9.99/mo (test: $0.09)
  - Yearly: $99.99/yr (test: $0.99)
- **Webhook:** STRIPE_WEBHOOK_SECRET configured but webhook handler NOT implemented in current backend
- **Status:** Test price IDs and checkout links are configured in env vars

### 7.3 OpenAI
- **Purpose:** Cycle predictions (next period, ovulation, health tips)
- **Model:** GPT-4o
- **Endpoint:** Direct API call from backend (`ai/predictions/route.ts`)
- **Prompt:** System prompt as women's health expert, returns structured JSON

### 7.4 @rork-ai/toolkit-sdk
- **Purpose:** AI chatbot responses
- **Usage:** `generateText()` function in `ai/chat/route.ts`
- **Note:** This is a Rork platform SDK - will need replacement when migrating

### 7.5 Mixpanel
- **Purpose:** Product analytics
- **Token:** b2bfb68cd0008c6f1a3c496bc438c9b2
- **Implementation:** Custom HTTP class (`utils/mixpanel.ts`), not official SDK
- **Events tracked:** 40+ events (login, logout, log entry, predictions, subscriptions, etc.)
- **User properties:** Subscription plan, cycle length, last log date, etc.

### 7.6 Expo Notifications
- **Purpose:** Push notifications
- **Types:** Period reminders, fertile window reminders, daily log reminders
- **Config:** Scheduled local notifications (not server-push)
- **Platform:** Native only (web skipped)

### 7.7 Expo Crypto
- **Purpose:** Data encryption for HIPAA compliance pattern
- **Usage:** SHA-256 hashing, Base64 encoding/decoding for "encryption"
- **Note:** Current encryption is Base64 + hash verification (not true AES encryption). Suitable for demo but needs proper encryption for production

---

## 8. BUSINESS LOGIC

### 8.1 Subscription Plans & Features

| Feature | Free | Monthly ($9.99) | Yearly ($99.99) |
|---------|------|-----------------|-----------------|
| Max Cycles | 3 | Unlimited | Unlimited |
| AI Insights | No | Yes | Yes |
| AI Chatbot | No | Yes | Yes |
| Data Export | No | Yes | Yes |
| Priority Support | No | Yes | Yes |
| Advanced Analytics | No | Yes | Yes |
| Advanced Predictions | No | Yes | Yes |
| Custom Reminders | No | Yes | Yes |
| Emergency Contacts | 1 | 5 | 10 |
| Data Retention (days) | 90 | 365 | Unlimited |
| Symptom Correlation | No | Yes | Yes |
| Telehealth Integration | No | Yes | Yes |

### 8.2 Redemption Code Logic
- Code types: `supermoon`, `full_moon`, `starter`
- Status flow: `available` -> `redeemed` -> (or `expired`)
- Validated against Supabase `redemption_codes` table
- On redemption: marks code as redeemed, creates subscription for user
- Partner ID tracking for affiliate attribution

### 8.3 Refund Logic (Yearly Plans)
- Monthly plans: No refund, access until end of billing period
- Yearly plans: Pro-rated refund calculated as:
  - `monthlyRate = amountPaid / 12`
  - `monthsRemaining = 12 - monthsElapsed`
  - `refundAmount = monthsRemaining * monthlyRate`
- Effective end date: End of current calendar month

### 8.4 Cycle Prediction Algorithm
- **Period Prediction:** Based on average cycle length (default 28 days)
- **Fertile Window:** Calculated as cycle day 14-16 from period start
- **AI Enhancement:** OpenAI GPT-4o analyzes last 60 days of symptom/mood data for refined predictions
- **Confidence:** Increases with more tracked cycles

### 8.5 Irregularity Detection
- **Cycle Length Variation:** Alert if last cycle differs >7 days from average (needs 3+ cycles)
- **Short Cycle:** Alert if cycle <21 days
- **Missed Period:** Alert if >45 days since last period
- **Extended Period:** Alert if period >7 days
- Alerts are dismissible and persisted in store

### 8.6 Daily Check-In Bridge
- Check-in data (mood, stress, sleep, symptoms) automatically merges into active cycle's day data
- Existing day data is preserved (check-in overwrites mood/stress/sleep but preserves flow/discharge/etc.)
- Stored locally + synced to Supabase `daily_checkins` table

---

## 9. AI GUARDRAILS - IMPLEMENTED vs PLANNED FOR AWS

### 9.1 IMPLEMENTED (In Current Codebase)

| Category | Guardrail | Location | Status |
|----------|-----------|----------|--------|
| **Medical Disclaimers** | Disclaimer banner on all AI screens | `components/DisclaimerBanner.tsx` | DONE |
| **Medical Disclaimers** | "Not a substitute for medical advice" warnings | AI Insights, Symptom Checker, Chatbot | DONE |
| **Crisis Safety** | Crisis hotline footer on health screens | `components/CrisisSafetyFooter.tsx` | DONE |
| **Crisis Safety** | Emergency resource links | Symptom Checker, AI Chatbot | DONE |
| **Input Validation** | Zod schema validation on all tRPC inputs | All backend routes | DONE |
| **Input Validation** | Date range validation (1900-2100) | `utils/date-utils.ts`, backend routes | DONE |
| **Input Validation** | Cycle length clamping (21-35 days) | `ai/predictions/route.ts` | DONE |
| **Output Safety** | Safe fallback responses on AI failure | All AI routes return graceful fallbacks | DONE |
| **Output Safety** | JSON parsing with multiple fallback strategies | `ai/predictions/route.ts` (safeJsonParse) | DONE |
| **Output Safety** | Never throws to client - always returns structured error | All tRPC AI routes | DONE |
| **Data Privacy** | PII anonymization utility | `utils/encryption.ts` (anonymizeData) | DONE |
| **Data Privacy** | No PII stored (uses 7-digit ID, no name/email in profile) | `types/user.ts` | DONE |
| **Data Privacy** | Audit logging for HIPAA compliance | `utils/audit-logger.ts` | DONE |
| **Data Privacy** | Encrypted storage middleware | `store/secure-store.ts` | DONE (Base64, not AES) |
| **Data Privacy** | RLS on all database tables | `SETUP_DATABASE.sql` | DONE |
| **Consent** | AI processing consent with timestamp | Consent screen, user store | DONE |
| **Consent** | GDPR data export | Data Export screen | DONE |
| **Consent** | GDPR data deletion | Data Export screen | DONE |
| **AI Chat Safety** | System prompt scoped to women's health | `ai/chat/route.ts` | DONE |
| **Confidence Scores** | Confidence badges on predictions | `components/ConfidenceBadge.tsx` | DONE |
| **Demo Mode** | Prevents Supabase calls in demo mode | All stores check auth state | DONE |
| **Error Boundaries** | Global error boundary | `components/RorkErrorBoundary.tsx` | DONE |

### 9.2 PLANNED FOR AWS MIGRATION (Not Implemented Here)

| Category | Guardrail | Why Deferred | AWS Component |
|----------|-----------|--------------|---------------|
| **Content Filtering** | AI response toxicity/harmful content detection | Requires AWS Bedrock Guardrails or OpenAI moderation API at scale | AWS Bedrock Guardrails / Amazon Comprehend |
| **Content Filtering** | Block AI from giving specific medication dosages | Needs robust NLP filtering pipeline | AWS Lambda + Amazon Comprehend Medical |
| **Content Filtering** | Detect and escalate suicidal ideation in chat | Needs real-time classification model | Amazon Comprehend + SNS alerts |
| **Rate Limiting** | Per-user API rate limits | Current backend has no rate limiting | API Gateway throttling |
| **Rate Limiting** | AI call cost controls / budget caps | No cost monitoring currently | AWS Budgets + Lambda circuit breaker |
| **Model Governance** | AI model version pinning and A/B testing | Currently uses latest GPT-4o | AWS Bedrock model management |
| **Model Governance** | Prediction accuracy tracking and drift detection | No feedback loop implemented | SageMaker Model Monitor |
| **Model Governance** | AI response logging for audit trail | Logs are console.log only | CloudWatch Logs + S3 archival |
| **Data Encryption** | AES-256 encryption at rest | Current "encryption" is Base64 | AWS KMS + RDS encryption |
| **Data Encryption** | TLS 1.3 for all data in transit | Supabase handles this, but needs verification on AWS | ACM + ALB |
| **Access Control** | JWT validation middleware on backend | Current tRPC routes are all public (no auth middleware) | API Gateway authorizer + Cognito |
| **Access Control** | Role-based access control (admin, user, provider) | No roles implemented | Cognito groups + IAM policies |
| **Monitoring** | Real-time AI safety monitoring dashboard | No monitoring | CloudWatch Dashboards + Grafana |
| **Monitoring** | Anomaly detection on user data patterns | Not implemented | CloudWatch Anomaly Detection |
| **Compliance** | HIPAA BAA with cloud provider | Supabase may not have BAA | AWS HIPAA-eligible services |
| **Compliance** | SOC 2 audit trail | Audit logger is in-memory only | CloudTrail + S3 immutable logs |
| **Compliance** | Data residency controls | No control over Supabase region | AWS region selection |
| **Backup** | Automated database backups with PITR | Supabase has basic backups | RDS automated backups |
| **Webhook Security** | Stripe webhook signature verification | STRIPE_WEBHOOK_SECRET exists but no handler | Lambda webhook handler with signature verification |
| **Push Notifications** | Server-side push (not local-only) | Currently only local scheduled notifications | SNS + FCM/APNs |
| **ML Pipeline** | Trained mood prediction model (replace heuristics) | Current mood predictions are random + cycle phase | SageMaker training pipeline |
| **ML Pipeline** | Personalized prediction model per user | Currently one-size-fits-all algorithm | SageMaker endpoints |
| **Vector Search** | RAG for AI chatbot (health knowledge base) | Env vars exist for Pinecone/LangChain but not implemented | OpenSearch / Pinecone + Bedrock |

---

## 10. ENVIRONMENT VARIABLES & SECRETS

### 10.1 Currently Used (Values Required)

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `OPENAI_API_KEY` | GPT-4o API access | Backend: ai/predictions |
| `OPENAI_MODEL` | Model selection (default: gpt-4o) | Backend: config/env.ts |
| `SUPABASE_URL` | Database endpoint | Backend + Frontend (hardcoded in lib/supabase.ts) |
| `SUPABASE_ANON_KEY` | Client-side DB access | Frontend (hardcoded in lib/supabase.ts) |
| `SUPABASE_SERVICE_KEY` | Server-side DB access (bypasses RLS) | Backend: db/migrate |
| `SUPABASE_JWT_SECRET` | JWT verification | Backend config (not actively used) |
| `STRIPE_SECRET_KEY` | Stripe API | Backend config |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Backend config (handler not built) |
| `EXPO_PUBLIC_STRIPE_TEST_MODE` | Toggle test/live Stripe | Frontend |
| `EXPO_PUBLIC_STRIPE_MONTHLY_TEST_LINK` | Test checkout URL | Frontend: subscription screen |
| `EXPO_PUBLIC_STRIPE_MONTHLY_TEST_PRICE_ID` | Test price ID | Frontend |
| `EXPO_PUBLIC_STRIPE_YEARLY_TEST_LINK` | Test checkout URL | Frontend: subscription screen |
| `EXPO_PUBLIC_STRIPE_YEARLY_TEST_PRICE_ID` | Test price ID | Frontend |
| `MIXPANEL_TOKEN` | Analytics (hardcoded in mixpanel.ts) | Frontend |

### 10.2 Configured But Not Actively Used

| Variable | Purpose | Status |
|----------|---------|--------|
| `PREDICTION_API_URL` | Custom prediction API | Placeholder - not connected |
| `PREDICTION_API_KEY` | Custom prediction API | Placeholder - not connected |
| `VECTOR_DB_URL` | Vector database | Placeholder for RAG |
| `VECTOR_DB_API_KEY` | Vector database | Placeholder for RAG |
| `LANGCHAIN_API_KEY` | LangChain | Placeholder for RAG |
| `EMBEDDING_MODEL` | Embedding model | Placeholder for RAG |
| `PINECONE_API_KEY` | Pinecone vector DB | Placeholder for RAG |
| `PINECONE_INDEX_NAME` | Pinecone index | Placeholder for RAG |
| `APPLE_SHARED_SECRET` | Apple IAP verification | Not implemented |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play IAP | Not implemented |
| `FIREBASE_SERVER_KEY` | Push notifications | Not implemented (using Expo) |
| `FIREBASE_SENDER_ID` | Push notifications | Not implemented |
| `FIREBASE_API_KEY` | Push notifications | Not implemented |
| `APNS_KEY_ID` | Apple push | Not implemented |
| `APNS_TEAM_ID` | Apple push | Not implemented |
| `APNS_AUTH_KEY` | Apple push | Not implemented |
| `SENTRY_DSN` | Error monitoring | Not implemented |

### 10.3 System Variables (Auto-set by Rork Platform)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_RORK_DB_ENDPOINT` | Rork DB endpoint |
| `EXPO_PUBLIC_RORK_DB_NAMESPACE` | Rork DB namespace |
| `EXPO_PUBLIC_RORK_DB_TOKEN` | Rork DB token |
| `EXPO_PUBLIC_RORK_API_BASE_URL` | Backend API base URL |
| `EXPO_PUBLIC_TOOLKIT_URL` | AI toolkit URL |
| `EXPO_PUBLIC_PROJECT_ID` | Project ID |
| `EXPO_PUBLIC_TEAM_ID` | Team ID |

---

## 11. MIGRATION PLAN SUMMARY

### 11.1 What Must Be Migrated

| Component | Current | Target (AWS) | Effort |
|-----------|---------|-------------|--------|
| Database | Supabase PostgreSQL | RDS PostgreSQL or Aurora Serverless | Medium - schema is SQL-standard |
| Auth | Supabase Auth | Amazon Cognito | High - client code changes needed |
| Backend API | Hono + tRPC on Rork | Lambda + API Gateway (or ECS) | Medium - Hono is portable |
| AI Chat | @rork-ai/toolkit-sdk | Direct OpenAI API or AWS Bedrock | Low - simple replacement |
| AI Predictions | OpenAI GPT-4o (direct) | Keep OpenAI or migrate to Bedrock | Low - already standard API |
| File Storage | Not used | S3 (for future image uploads) | N/A |
| Push Notifications | Expo local | SNS + FCM/APNs | Medium |
| Analytics | Mixpanel (custom HTTP) | Keep Mixpanel or migrate to CloudWatch/Amplitude | Low |
| Payments | Stripe (hosted checkout) | Keep Stripe + add webhook Lambda | Low |

### 11.2 What Can Stay As-Is

- React Native frontend code (Expo)
- All Zustand stores and data models
- All UI components and screens
- Type definitions
- Encryption/audit utilities (upgrade encryption algo)
- Mixpanel integration
- All business logic (subscription, refunds, predictions)

### 11.3 Critical Security Items for Migration

1. **Move Supabase URL + keys out of hardcoded frontend** (`lib/supabase.ts` line 5-6)
2. **Implement proper backend auth middleware** (current tRPC routes have no auth)
3. **Replace Base64 "encryption" with AES-256** (`utils/encryption.ts`)
4. **Build Stripe webhook handler** for payment confirmation
5. **Add rate limiting** to all API endpoints
6. **Implement server-side AI content filtering**
7. **Set up proper audit log persistence** (currently in-memory only)

---

*Document generated from codebase audit on 2026-02-14*
*App version: 1.0.0 | Expo SDK: 54 | React Native: 0.81.5*
