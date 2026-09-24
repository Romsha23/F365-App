# F365 Advanced - AWS Migration: Compliance & Code Activities Checklist

**Last Updated:** 2026-03-08
**Status:** Pre-Migration Planning
**Current Platform:** Supabase + Rork + Expo
**Target Platform:** AWS

---

## STATUS LEGEND

- DONE = Already implemented in current codebase
- TODO = Must be done before/during migration
- CRITICAL = Blocking for production launch
- NICE = Important but can follow after launch

---

## 1. HARDCODED SECRETS & CREDENTIALS (CRITICAL)

| # | Item | Status | Details |
|---|------|--------|---------|
| 1.1 | Supabase URL hardcoded in `lib/supabase.ts` (line 5) | TODO | `https://dibuhpxjzgaxvvrbkofk.supabase.co` is hardcoded. Move to env var `EXPO_PUBLIC_SUPABASE_URL` |
| 1.2 | Supabase Anon Key hardcoded in `lib/supabase.ts` (line 6) | TODO | Full JWT key exposed in source code. Move to env var `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| 1.3 | Mixpanel token hardcoded in `utils/mixpanel.ts` (line 3) | TODO | Token `b2bfb68cd0008c6f1a3c496bc438c9b2` hardcoded. Move to env var `EXPO_PUBLIC_MIXPANEL_TOKEN` |
| 1.4 | Supabase project ID in `docs/DATABASE_MIGRATION.md` | TODO | Remove or redact from docs before public repo |
| 1.5 | Remove all hardcoded URLs from docs (dashboard links, etc.) | TODO | `DATABASE_MIGRATION.md` contains direct Supabase dashboard URLs |
| 1.6 | Env vars already configured in Rork platform | DONE | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, Stripe keys, etc. |

**Action:** Replace all hardcoded values in `lib/supabase.ts` and `utils/mixpanel.ts` with `process.env.*` references. Verify no other files contain hardcoded secrets.

---

## 2. AUTHENTICATION MIGRATION (CRITICAL)

| # | Item | Status | Details |
|---|------|--------|---------|
| 2.1 | Supabase Auth -> Amazon Cognito | TODO | All auth calls in `store/user-store.ts`, `app/login.tsx`, `app/onboarding.tsx`, `app/reset-password.tsx` |
| 2.2 | Session storage adapter | DONE | `lib/supabase.ts` uses AsyncStorage adapter. Reuse pattern for Cognito tokens |
| 2.3 | Auth state listener (`onAuthStateChange`) | TODO | Replace Supabase listener with Cognito Hub events |
| 2.4 | Token refresh logic | DONE | Supabase `autoRefreshToken: true`. Cognito SDK handles this natively |
| 2.5 | Password reset flow | TODO | `app/reset-password.tsx` uses `supabase.auth.resetPasswordForEmail()`. Replace with Cognito |
| 2.6 | Demo mode (no-auth path) | DONE | `isDemoMode` flag in user-store prevents Supabase calls. Keep as-is |
| 2.7 | Use expo-secure-store for auth tokens on native | TODO | Currently using AsyncStorage. Switch to `expo-secure-store` for token storage on native (already polyfilled for web) |
| 2.8 | Backend auth middleware (tRPC routes have NO auth) | TODO | All tRPC routes are currently public. Add JWT validation middleware |

**Files to modify:**
- `lib/supabase.ts` -> `lib/auth.ts` (new Cognito client)
- `store/user-store.ts` (all auth method calls)
- `app/login.tsx`, `app/onboarding.tsx`, `app/reset-password.tsx`
- `backend/trpc/create-context.ts` (add auth context)
- All backend route files (add auth checks)

---

## 3. DATABASE MIGRATION (CRITICAL)

| # | Item | Status | Details |
|---|------|--------|---------|
| 3.1 | Schema is standard PostgreSQL | DONE | Can migrate directly to RDS/Aurora. Schema in `SETUP_DATABASE.sql` |
| 3.2 | Supabase client calls -> AWS SDK / Prisma / raw SQL | TODO | `lib/supabase-service.ts` + all stores that call `supabase.from(...)` |
| 3.3 | RLS policies -> Application-level authorization | TODO | Supabase RLS won't exist on RDS. Must enforce `user_id` checks in API layer |
| 3.4 | Database connection string management | TODO | Use AWS Secrets Manager, not env vars |
| 3.5 | Connection pooling | TODO | Use RDS Proxy or PgBouncer (Supabase did this automatically) |
| 3.6 | Indexes and performance | DONE | All indexes defined in `SETUP_DATABASE.sql`. Transfer as-is |
| 3.7 | Data migration script | TODO | Export Supabase data -> import to RDS. Use `pg_dump`/`pg_restore` |
| 3.8 | UUID generation (`uuid_generate_v4()`) | DONE | Standard PostgreSQL extension. Enable `uuid-ossp` on RDS |
| 3.9 | Automated backups + PITR | TODO | Configure RDS automated backups (Supabase had basic backups) |

**Tables to migrate (17+):**
`users`, `symptom_logs`, `custom_symptoms`, `mood_logs`, `lifestyle_logs`, `predictions`, `ai_insights`, `ai_predictions`, `redemption_codes`, `subscriptions`, `subscription_orders`, `cancellation_requests`, `daily_checkins`, `sexual_activity_logs`, `partner_education_progress`, `reminder_preferences`, `country_feature_flags`

**Files to modify:**
- `lib/supabase.ts` -> `lib/database.ts`
- `lib/supabase-service.ts` -> rewrite for new DB client
- All stores that import from `lib/supabase`

---

## 4. BACKEND / API MIGRATION (CRITICAL)

| # | Item | Status | Details |
|---|------|--------|---------|
| 4.1 | Hono + tRPC server is portable | DONE | Can deploy to Lambda, ECS, or EC2 with minimal changes |
| 4.2 | Replace `@rork-ai/toolkit-sdk` (chat) | TODO | `backend/trpc/routes/ai/chat/route.ts` uses Rork SDK. Replace with direct OpenAI API or AWS Bedrock |
| 4.3 | OpenAI GPT-4o integration | DONE | `backend/trpc/routes/ai/predictions/route.ts` uses standard OpenAI API. Keep or migrate to Bedrock |
| 4.4 | `db.migrate` route uses Supabase service key | TODO | Replace with direct PostgreSQL connection in migration scripts |
| 4.5 | API Gateway + Lambda deployment | TODO | Package Hono for Lambda using `@hono/aws-lambda` adapter |
| 4.6 | Rate limiting | TODO | No rate limiting exists. Add API Gateway throttling |
| 4.7 | CORS configuration | DONE | Already configured in `backend/hono.ts` |
| 4.8 | Health check endpoint | DONE | `GET /api/` returns `{ status: "ok" }` |

---

## 5. ENCRYPTION & DATA SECURITY (CRITICAL)

| # | Item | Status | Details |
|---|------|--------|---------|
| 5.1 | Email encryption (app-level XOR + SHA-256 keystream) | **DONE** | `utils/email-encryption.ts` encrypts emails before DB storage using `EXPO_PUBLIC_EMAIL_ENCRYPTION_KEY`. See `docs/EMAIL_ENCRYPTION.md` for full details |
| 5.2 | Upgrade to AES-256-GCM on AWS | TODO | Move encryption key to AWS Secrets Manager. Use KMS for envelope encryption. Replace client-side XOR with server-side AES-256-GCM via Lambda |
| 5.3 | Encryption at rest (database) | TODO | Enable RDS encryption (uses AWS KMS). Supabase encryption status unknown |
| 5.4 | TLS 1.3 in transit | TODO | Configure ALB/API Gateway with ACM certificates |
| 5.5 | Secure store for auth tokens | TODO | Switch from AsyncStorage to `expo-secure-store` for native token storage |
| 5.6 | PII anonymization utility | DONE | `utils/encryption.ts` `anonymizeData()` function works correctly |
| 5.7 | Password hashing uses SHA-256 only | **TODO - CRITICAL** | `utils/encryption.ts` `hashPassword()` uses plain SHA-256. Needs bcrypt/argon2 (but Supabase Auth handles passwords, so this may be unused) |
| 5.8 | `store/secure-store.ts` uses the fake encryption | TODO | Zustand secure storage middleware uses `encryptObject`/`decryptObject` which is just Base64 |

---

## 6. HIPAA COMPLIANCE (CRITICAL)

| # | Item | Status | Details |
|---|------|--------|---------|
| 6.1 | BAA (Business Associate Agreement) | TODO | Must sign BAA with AWS. Supabase BAA status unclear |
| 6.2 | Use only HIPAA-eligible AWS services | TODO | RDS, Lambda, S3, Cognito, KMS, CloudWatch, SNS are HIPAA-eligible |
| 6.3 | No PII in user profiles | PARTIAL | App uses anonymous 7-digit IDs. Email is now encrypted in DB (`enc:` prefix). `display_name` is AI-generated, not real names. For full compliance, move encryption to server-side on AWS |
| 6.4 | Audit logging | PARTIAL | `utils/audit-logger.ts` exists but logs are **in-memory only** (lost on app restart). Must persist to server |
| 6.5 | Audit log persistence to database | TODO | Create `audit_logs` table in RDS. Sync logs from client + server-side logging |
| 6.6 | Audit log retention (7 years for HIPAA) | TODO | Configure S3 lifecycle policies for archived logs |
| 6.7 | Access controls / RBAC | TODO | No role system exists. Need admin, user, provider roles |
| 6.8 | Breach notification capability | TODO | Need alerting system (CloudWatch Alarms + SNS) |
| 6.9 | Data encryption at rest and in transit | TODO | See Section 5 above |
| 6.10 | Minimum necessary access principle | TODO | Backend routes have no auth middleware; all data accessible |
| 6.11 | Automatic session timeout | TODO | No session timeout implemented. Add idle timeout logic |
| 6.12 | Data residency controls | TODO | Choose specific AWS region for all resources |

---

## 7. GDPR COMPLIANCE

| # | Item | Status | Details |
|---|------|--------|---------|
| 7.1 | Consent collection screen | DONE | `app/consent.tsx` with granular toggles |
| 7.2 | Consent timestamp tracking | DONE | `aiConsentDate` stored in user record |
| 7.3 | Right to access (data export) | DONE | `app/data-export.tsx` exports JSON/CSV |
| 7.4 | Right to erasure (data deletion) | PARTIAL | `deleteAllData()` exists but needs verification it covers ALL tables |
| 7.5 | Right to portability | DONE | Data export in standard formats |
| 7.6 | Privacy policy | DONE | `app/privacy-policy.tsx` |
| 7.7 | Terms of service | DONE | `app/terms-of-service.tsx` |
| 7.8 | Consent controls analytics (Mixpanel) | DONE | Consent toggles control Mixpanel tracking |
| 7.9 | Cookie/tracking consent for web | TODO | No web-specific consent banner for cookies |

---

## 8. ANALYTICS / MIXPANEL

| # | Item | Status | Details |
|---|------|--------|---------|
| 8.1 | Mixpanel token moved to env var | TODO | Currently hardcoded in `utils/mixpanel.ts` |
| 8.2 | No health data sent to Mixpanel | DONE | Only event types/counts, no actual health content |
| 8.3 | Consent toggles control tracking | DONE | User can disable analytics |
| 8.4 | Consider migrating to CloudWatch/Amplitude | NICE | Mixpanel works fine, but consolidating on AWS reduces vendors |
| 8.5 | Server-side event validation | TODO | Events are client-side only; easy to spoof |

---

## 9. PAYMENTS / STRIPE

| # | Item | Status | Details |
|---|------|--------|---------|
| 9.1 | Stripe integration (hosted checkout) | DONE | Works via redirect links |
| 9.2 | Stripe webhook handler | **TODO - CRITICAL** | `STRIPE_WEBHOOK_SECRET` configured but NO webhook handler exists. Payments can't be confirmed server-side |
| 9.3 | Webhook signature verification | TODO | Must verify Stripe signatures in Lambda handler |
| 9.4 | Switch from test to live Stripe keys | TODO | Currently using test mode (`$0.09` / `$0.99`) |
| 9.5 | PCI compliance | DONE | Using Stripe hosted checkout means PCI scope is minimal |
| 9.6 | Refund logic | DONE | Pro-rated yearly refund calculation in `store/subscription-store.ts` |
| 9.7 | Subscription status sync | TODO | Without webhooks, subscription status relies on client-side state only |

---

## 10. AI SAFETY & GUARDRAILS

| # | Item | Status | Details |
|---|------|--------|---------|
| 10.1 | Medical disclaimers on all AI screens | DONE | `DisclaimerBanner.tsx` |
| 10.2 | Crisis safety footer with hotlines | DONE | `CrisisSafetyFooter.tsx` (6 regions) |
| 10.3 | AI confidence badges | DONE | `ConfidenceBadge.tsx` |
| 10.4 | Consent gate for AI features | DONE | `app/consent.tsx` |
| 10.5 | Zod input validation on all tRPC routes | DONE | All backend routes validated |
| 10.6 | Safe fallback responses on AI failure | DONE | All AI routes return graceful fallbacks |
| 10.7 | AI response toxicity/content filtering | TODO | No filtering of AI output. Add AWS Bedrock Guardrails or OpenAI moderation API |
| 10.8 | Block medication dosage advice | TODO | Needs NLP filtering pipeline |
| 10.9 | Suicidal ideation detection in chat | TODO | Needs real-time classification + alert system |
| 10.10 | AI response logging for audit trail | TODO | Currently `console.log` only. Persist to CloudWatch + S3 |
| 10.11 | Model version pinning | TODO | Currently uses latest GPT-4o. Pin to specific version |
| 10.12 | Cost controls / budget caps for AI calls | TODO | No cost monitoring. Add AWS Budgets + circuit breaker |

---

## 11. PUSH NOTIFICATIONS

| # | Item | Status | Details |
|---|------|--------|---------|
| 11.1 | Local scheduled notifications | DONE | `utils/notifications.ts` uses Expo Notifications |
| 11.2 | Server-side push notifications | TODO | Need SNS + FCM/APNs for reliable delivery |
| 11.3 | Notification permission handling | DONE | Permission request flow exists |
| 11.4 | Web push support | TODO | Currently skipped on web |

---

## 12. MONITORING & OBSERVABILITY

| # | Item | Status | Details |
|---|------|--------|---------|
| 12.1 | Error monitoring (Sentry) | TODO | `SENTRY_DSN` placeholder exists but not implemented |
| 12.2 | CloudWatch Logs for backend | TODO | Replace `console.log` with structured logging |
| 12.3 | CloudWatch Dashboards | TODO | API latency, error rates, AI call frequency |
| 12.4 | Anomaly detection | TODO | Unusual data patterns, potential breaches |
| 12.5 | Uptime monitoring | TODO | Health check endpoint exists, need monitoring service |
| 12.6 | Error boundary | DONE | `components/RorkErrorBoundary.tsx` catches React errors |

---

## 13. INFRASTRUCTURE / DEVOPS

| # | Item | Status | Details |
|---|------|--------|---------|
| 13.1 | Infrastructure as Code (Terraform/CDK) | TODO | Define all AWS resources in IaC |
| 13.2 | CI/CD pipeline | TODO | GitHub Actions or AWS CodePipeline for automated deployments |
| 13.3 | Staging environment | TODO | Separate AWS account/VPC for staging |
| 13.4 | Environment variable management | TODO | AWS Secrets Manager + SSM Parameter Store |
| 13.5 | Custom domain + SSL | TODO | Route 53 + ACM for API and app domains |
| 13.6 | VPC configuration | TODO | Private subnets for RDS, public for Lambda/ALB |
| 13.7 | WAF (Web Application Firewall) | TODO | Protect API Gateway from common attacks |
| 13.8 | DDoS protection | TODO | AWS Shield Standard (free) + consider Shield Advanced |

---

## 14. CODE CLEANUP / TECH DEBT

| # | Item | Status | Details |
|---|------|--------|---------|
| 14.1 | Remove Rork platform dependencies | TODO | `@rork-ai/toolkit-sdk`, Rork DB endpoints, Rork API base URL |
| 14.2 | Pregnancy module screens are stubs | NICE | 9 stub screens (19-40 LOC each). Build out or remove |
| 14.3 | `deleteAllData()` completeness | TODO | Verify it deletes from ALL 15+ tables |
| 14.4 | Unused env var placeholders | NICE | Remove Pinecone, LangChain, Firebase placeholders if not using |
| 14.5 | Mood prediction uses heuristic algorithm | NICE | Not ML-based. Consider SageMaker pipeline |
| 14.6 | Mock data in telehealth | NICE | Doctor directory uses mock data. Connect to real API or remove |
| 14.7 | `email` field encrypted in users table | **DONE** | Email is now app-level encrypted with `enc:` prefix. Display name is AI-generated. See `docs/EMAIL_ENCRYPTION.md` |
| 14.8 | `redemption_codes` table stores `created_for_email` and `redeemed_by_email` | TODO | PII in database — documented for future encryption in `docs/EMAIL_ENCRYPTION.md` |

---

## 15. TESTING

| # | Item | Status | Details |
|---|------|--------|---------|
| 15.1 | Unit tests | TODO | No test files exist in the project |
| 15.2 | Integration tests for API routes | TODO | Test all tRPC endpoints with auth |
| 15.3 | E2E tests | TODO | Test critical flows: login, onboarding, logging, export |
| 15.4 | Load testing | TODO | Verify performance under expected user load |
| 15.5 | Security penetration testing | TODO | Required for HIPAA. Test for OWASP Top 10 |
| 15.6 | Accessibility testing | NICE | Ensure WCAG compliance |

---

## PRIORITY ORDER FOR MIGRATION

### Phase 1: Pre-Migration (Do Now)
1. Remove all hardcoded secrets (1.1-1.3)
2. ~~Fix PII contradiction~~ — DONE: Email encrypted, display_name is AI-generated (14.7)
3. ~~Fix fake encryption~~ — DONE: App-level encryption implemented (5.1). Upgrade to AES-256 on AWS (5.2)
4. Complete `deleteAllData()` for all tables (7.4)
5. Build Stripe webhook handler (9.2)

### Phase 2: Core Migration
6. Set up AWS infrastructure (IaC) (13.1)
7. Migrate PostgreSQL database to RDS (3.1-3.9)
8. Deploy Hono backend to Lambda (4.5)
9. Migrate Supabase Auth to Cognito (2.1-2.8)
10. Replace RLS with application-level auth (3.3)
11. Add backend auth middleware to all routes (2.8)

### Phase 3: Security & Compliance
12. Sign AWS BAA for HIPAA (6.1)
13. Enable RDS encryption at rest (5.3)
14. Persist audit logs to database (6.5)
15. Set up CloudWatch logging (12.2)
16. Add rate limiting (4.6)
17. Implement session timeout (6.11)
18. Switch auth token storage to expo-secure-store (2.7)

### Phase 4: AI & Safety
19. Add AI content filtering (10.7)
20. AI response audit logging (10.10)
21. Replace @rork-ai/toolkit-sdk (4.2)
22. Pin AI model versions (10.11)

### Phase 5: Production Readiness
23. Set up Sentry error monitoring (12.1)
24. Build CI/CD pipeline (13.2)
25. Create staging environment (13.3)
26. Write tests (15.1-15.5)
27. Switch Stripe to live mode (9.4)
28. Set up server-side push notifications (11.2)

---

## 16. COUNTRY FEATURE FLAGS (NEW)

| # | Item | Status | Details |
|---|------|--------|----------|
| 16.1 | `country_feature_flags` table created | DONE | SQL in `docs/COUNTRY_FEATURE_FLAGS_SETUP.sql` |
| 16.2 | Feature gate store (`store/feature-gate-store.ts`) | DONE | Zustand store fetches flags per user country |
| 16.3 | FeatureGate UI component | DONE | Greyed-out overlay with lock badge when blocked |
| 16.4 | 41 feature keys mapped to all screens | DONE | Defined in `constants/feature-keys.ts` |
| 16.5 | Searchable country picker (195 countries) | DONE | `components/CountryPicker.tsx` with search, flags, scroll |
| 16.6 | Loveable admin prompts for admin panel | DONE | `docs/LOVEABLE_ADMIN_PROMPTS.md` |
| 16.7 | RLS policies for admin-only writes | DONE | In SQL setup script |
| 16.8 | Cache flags in Redis/ElastiCache | TODO | For production performance on AWS |
| 16.9 | Feature flag audit log table | TODO | Track admin changes to flags |

---

## 17. COUNTRY-LEVEL APP DISABLE (NEW)

| # | Item | Status | Details |
|---|------|--------|--------|
| 17.1 | `country_access` table created in Supabase | DONE | `country_code` (PK), `is_enabled`, `reason`, `updated_by`, `updated_at` |
| 17.2 | RLS: public read, service_role write | DONE | Anyone can read; only service role can manage |
| 17.3 | Device locale detection (pre-login) | DONE | `utils/country-access.ts` — detects country from iOS/Android/web locale |
| 17.4 | Profile country check (post-login) | DONE | `app/_layout.tsx` — checks user's profile country after session restore |
| 17.5 | Blocking screen UI | DONE | `components/CountryBlockedScreen.tsx` — generic "not available in your region" |
| 17.6 | Admin management via Supabase/admin portal | DONE | Insert/update rows in `country_access` to block/unblock countries |
| 17.7 | Default behavior (no row = allowed) | DONE | If no entry exists for a country, access is granted |
| 17.8 | Migrate to AWS API Gateway geo-blocking | TODO | Use CloudFront geo-restriction or API Gateway for infrastructure-level blocking |

**How to block a country:**
```sql
INSERT INTO country_access (country_code, is_enabled, reason, updated_by)
VALUES ('XX', false, 'Regulatory requirement', 'admin@flow365.com')
ON CONFLICT (country_code) DO UPDATE SET
  is_enabled = false, reason = EXCLUDED.reason, updated_by = EXCLUDED.updated_by, updated_at = NOW();
```

**How to unblock:**
```sql
UPDATE country_access SET is_enabled = true, updated_at = NOW() WHERE country_code = 'XX';
-- Or simply: DELETE FROM country_access WHERE country_code = 'XX';
```

---

## 18. EMAIL ENCRYPTION — AWS UPGRADE PATH

| # | Item | Status | Details |
|---|------|--------|--------|
| 18.1 | Current: client-side XOR with EXPO_PUBLIC key | DONE | Works but key is in JS bundle |
| 18.2 | Move key to AWS Secrets Manager | TODO | Remove `EXPO_PUBLIC_EMAIL_ENCRYPTION_KEY` from client |
| 18.3 | Create encrypt/decrypt Lambda | TODO | API Gateway → Lambda with KMS access |
| 18.4 | Use AES-256-GCM via AWS KMS | TODO | Envelope encryption: KMS generates data key, Lambda uses it |
| 18.5 | Add `email_hash` column for lookups | TODO | SHA-256 hash column + index for searching without decryption |
| 18.6 | Encrypt `redemption_codes` email fields | TODO | Same pattern for `created_for_email`, `redeemed_by_email` |
| 18.7 | Re-encrypt existing data with new key | TODO | One-time migration: decrypt with old XOR key, re-encrypt with AES-256 |

**Architecture on AWS:**
```
App → API Gateway → Lambda (encrypt/decrypt) → Secrets Manager (key) → RDS (encrypted data)
                                              → KMS (envelope encryption)
```

---

## WHAT IS ALREADY DONE (NO CHANGES NEEDED)

These items are production-ready and can transfer directly to AWS:

| Category | Items |
|----------|-------|
| **UI/UX** | All 30+ screens, all components, tab navigation, calendar, charts |
| **State Management** | All 10 Zustand stores, data flow patterns, offline-first architecture |
| **Country Feature Gating** | 41 feature keys, country_feature_flags table, greyed-out UI, searchable country picker (195 countries) |
| **Business Logic** | Subscription plans, refund logic, redemption codes, cycle predictions, irregularity detection |
| **Type System** | All TypeScript types and interfaces |
| **AI Guardrails** | Disclaimers, confidence badges, crisis footer, consent gate, safe fallbacks |
| **GDPR** | Consent screen, data export, privacy policy, terms of service |
| **Analytics Architecture** | Mixpanel event tracking structure (just move token to env var) |
| **RLS Policies** | SQL scripts ready to recreate on RDS (adapt as app-level checks) |
| **Database Schema** | Standard PostgreSQL, fully indexed, ready for RDS |

---

## COST ESTIMATE CONSIDERATIONS

| AWS Service | Purpose | Estimated Monthly Cost |
|-------------|---------|----------------------|
| RDS PostgreSQL (db.t3.micro) | Database | $15-30 |
| Lambda | Backend API | $0-10 (low traffic) |
| API Gateway | API routing | $3-10 |
| Cognito | Authentication | Free tier (50K MAU) |
| KMS | Encryption keys | $1/key/month |
| CloudWatch | Logging/monitoring | $5-15 |
| S3 | Audit log archival, backups | $1-5 |
| ACM | SSL certificates | Free |
| SNS | Push notifications | $1-5 |
| **Total (low traffic)** | | **~$30-80/month** |

---

*Document generated from codebase audit on 2026-03-08*
*Updated: 2026-03-16 — Added email encryption (Section 18), country-level app disable (Section 17), updated encryption status (5.1), PII status (6.3, 14.7)*
*Source: DEVELOPER-HANDOVER.md, AI_GUARDRAILS.md, DATABASE_MIGRATION.md, EMAIL_ENCRYPTION.md, and full codebase review*
