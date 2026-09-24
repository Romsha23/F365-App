# Flow 365 — Competitive Analysis & Product Maturity Report

**Prepared for Investor Review | March 2026**
**Confidential**

---

## Executive Summary

Flow 365 is a next-generation women's health platform that combines comprehensive cycle tracking with AI-powered insights, HIPAA-aligned privacy architecture, partner engagement tools, and telehealth integration — all in a single mobile experience. While incumbents like **Flo** (420M+ users) and **Clue** (12M+ users) dominate user acquisition, Flow 365 has been architected from day one to address the critical gaps these platforms still have not closed: **true data sovereignty, relationship-aware health intelligence, and clinical-grade compliance without sacrificing UX**.

---

## Product Lifecycle Stage Assessment

| Dimension | Flow 365 | Flo | Clue |
|---|---|---|---|
| **Stage** | Late MVP / Early Growth | Mature / Market Leader | Growth / Established |
| **Founded** | 2025 | 2015 | 2013 |
| **Users** | Pre-launch | 420M+ | 12M+ |
| **Revenue Model** | Activation codes + Subscription tiers | Freemium + Premium ($49.99/yr) | Freemium + Clue Plus ($29.99/yr) |
| **Platform** | iOS, Android, Web (React Native) | iOS, Android | iOS, Android, watchOS |
| **AI Integration** | Native (built-in AI engine) | Limited (content recommendations) | None (algorithm-based only) |
| **Telehealth** | Built-in | No | No |
| **Partner Tools** | Full dashboard + education | Basic sharing | Basic sharing (Clue Connect) |
| **Privacy Architecture** | HIPAA-aligned + pseudonymous IDs | Anonymous Mode + ISO 27001/27701 | GDPR compliant, EU servers |

---

## Feature-by-Feature Comparison

### 1. Core Cycle Tracking

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| Period logging | ✅ Full (flow, discharge, pain levels) | ✅ Full | ✅ Full |
| Symptom tracking | ✅ 12+ symptoms with intensity levels | ✅ 70+ symptoms | ✅ 30+ categories |
| Mood tracking | ✅ Multi-dimensional (mood + energy + sleep quality) | ✅ Basic mood | ✅ Basic mood |
| Flow intensity picker | ✅ Visual, color-coded, accessible | ✅ Standard | ✅ Standard |
| Discharge tracking | ✅ Detailed types with visual picker | ✅ Basic | ✅ Basic |
| Cravings tracking | ✅ Dedicated picker | ❌ No | ❌ No |
| Sexual activity logging | ✅ With privacy lock (never shared) | ✅ Basic | ✅ Basic |
| Pain level granularity | ✅ Multi-level with body area | ✅ Basic scale | ✅ Basic |
| Custom date logging (past 45 days) | ✅ With validation | ✅ Yes | ✅ Yes |
| Daily check-in modal | ✅ Guided multi-step wizard | ❌ No | ❌ No |
| Daily streak tracking | ✅ Gamified with streaks | ❌ No | ❌ No |

**Flow 365 Advantage:** Guided daily check-in wizard reduces friction and improves data consistency. Gamified streaks increase retention. Granular pain, cravings, and sexual activity tracking provide richer data for AI models.

---

### 2. AI & Intelligence Layer

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| AI chatbot (health assistant) | ✅ Conversational, context-aware | ❌ No (FAQ-style) | ❌ No |
| AI mood forecast | ✅ Predictive mood timeline | ❌ No | ❌ No |
| AI wellness insights | ✅ Personalized weekly narratives | ❌ No | ❌ No |
| AI symptom checker | ✅ Cycle-phase-aware analysis | ❌ No | ❌ No |
| AI-generated predictions | ✅ With confidence scoring | ✅ Basic algorithm | ✅ Algorithm-based |
| Confidence badges | ✅ Transparent accuracy indicators | ❌ No | ❌ No |
| Pattern change alerts | ✅ Automatic detection | ❌ No | ❌ No |
| Cause-effect pattern analysis | ✅ Cross-correlates symptoms, mood, cycle phase | ❌ No | ❌ No |
| Storytelling insights (weekly narrative) | ✅ Natural language health summaries | ❌ No | ❌ No |
| Reflection prompts | ✅ Personalized self-awareness prompts | ❌ No | ❌ No |
| AI audit logging | ✅ Every AI interaction logged | ❌ No | ❌ No |
| AI consent management | ✅ Granular opt-in/out | ❌ No | ❌ No |
| Medical disclaimers on all AI output | ✅ Master disclaimer + contextual banners | N/A | N/A |

**Flow 365 Advantage:** The only period tracker with a native AI health assistant, mood forecasting, symptom analysis, and storytelling insights — all with transparent confidence scoring and full audit trails. Competitors rely on basic algorithms with no AI conversation capability.

---

### 3. Privacy, Compliance & Data Sovereignty

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| Pseudonymous user IDs | ✅ System-generated unique IDs | ✅ Anonymous Mode (opt-in) | ❌ Email-based accounts |
| Secret display names | ✅ Fun generated nicknames (e.g., "IvyStar") | ❌ No | ❌ No |
| HIPAA-aligned architecture | ✅ Audit logs, encryption, consent management | ❌ Not HIPAA (ISO certified) | ❌ Not HIPAA (GDPR only) |
| Granular consent toggles | ✅ Data processing, AI, analytics, marketing, research — each independent | ❌ All-or-nothing | ❌ Basic consent |
| Audit logging | ✅ Every data access/create/update/delete logged | ❌ Internal only | ❌ No |
| AI-specific audit trail | ✅ Every AI query/response logged with metadata | ❌ No | ❌ No |
| Data encryption | ✅ At rest + in transit | ✅ At rest + in transit | ✅ At rest + in transit |
| Secure token storage | ✅ expo-secure-store (native keychain) | ✅ Platform keychain | ✅ Platform keychain |
| Full data export | ✅ JSON + PDF with analytics | ❌ Limited (Apple Health sync) | ❌ Apple Health only |
| Right to deletion | ✅ Complete deleteAllData() | ✅ Yes | ✅ Yes |
| Privacy policy | ✅ In-app, always accessible | ✅ In-app | ✅ In-app |
| Terms of service | ✅ In-app, comprehensive | ✅ In-app | ✅ In-app |
| ISO 27001 / 27701 certified | ❌ Not yet (planned for AWS migration) | ✅ Dual certified | ❌ No |
| GDPR compliant | ✅ Yes | ✅ Yes | ✅ Yes |
| No health data sent to analytics | ✅ Mixpanel receives only non-health events | ❌ Unclear separation | ✅ Limited analytics |
| Never sells user data | ✅ Confirmed | ✅ Confirmed | ✅ Confirmed |

**Flow 365 Advantage:** HIPAA-aligned from day one with granular consent, complete audit trails, and AI-specific logging. Flo added Anonymous Mode reactively post-Roe v. Wade. Flow 365 was built privacy-first. The secret display name system adds a delightful UX layer that also serves a privacy function — users never need to expose their real identity inside the app.

---

### 4. Partner & Relationship Intelligence

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| Partner sharing with permissions | ✅ Granular (mood, cycle, symptoms, pregnancy) | ✅ Basic sharing | ✅ Clue Connect (basic) |
| Hard-locked private fields | ✅ Notes, AI chat, sexual activity NEVER shared | ❌ No granularity | ❌ No granularity |
| Partner education hub | ✅ Full curriculum (cycle phases, hormones, support tips) | ❌ No | ❌ No |
| Relationship dashboard | ✅ Conflict risk forecast, energy levels, libido confidence, stress | ❌ No | ❌ No |
| Partner summary view | ✅ Curated snapshot for partner | ❌ No | ❌ No |
| Partner gender selection | ✅ He/Him, She/Her, Other | ❌ No | ❌ No |
| Invite link with rotation | ✅ Secure invite codes, rotatable | ❌ No | ✅ Basic link |
| Partner audit log | ✅ Tracks when partner views data | ❌ No | ❌ No |
| Shared snapshot refresh | ✅ Manual refresh control | ❌ No | ❌ No |

**Flow 365 Advantage:** The only period tracker with a full relationship intelligence layer. The relationship dashboard with conflict risk forecasting and partner education is completely unique in the market. This opens an entirely new user segment: partners who want to be supportive but don't know how.

---

### 5. Pregnancy & Maternal Health

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| Pregnancy mode | ✅ Full dashboard | ✅ Full | ✅ Clue Pregnancy |
| Week-by-week tracking | ✅ With milestone descriptions | ✅ Detailed | ✅ Detailed |
| Trimester progression | ✅ Visual | ✅ Visual | ✅ Visual |
| Pregnancy appointments | ✅ Built-in scheduling | ✅ Basic | ❌ No |
| Kick counter | 🔜 Coming soon | ✅ Yes | ❌ No |
| Contraction timer | 🔜 Coming soon | ✅ Yes | ❌ No |
| Pregnancy day logging | ✅ Daily logs | ✅ Daily logs | ✅ Weekly |
| Postpartum dashboard | 🔜 Coming soon | ✅ Yes | ❌ No |
| Baby development info | 🔜 Coming soon | ✅ Detailed | ✅ Basic |

**Assessment:** Pregnancy features are functional but still developing. Flo leads here with 10 years of content. Flow 365's architecture supports rapid expansion, and the AI layer can provide personalized pregnancy insights that Flo cannot.

---

### 6. Telehealth & Clinical Integration

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| In-app telehealth directory | ✅ Searchable by specialty | ❌ No | ❌ No |
| Doctor specialty filter | ✅ GYN, OB, Endocrinology, Fertility, Mental Health, GP | N/A | N/A |
| Video/phone/chat consultation | ✅ Multi-modal booking | ❌ No | ❌ No |
| Appointment booking | ✅ Built-in | ❌ External referral only | ❌ No |
| Appointment management | ✅ My Appointments screen | ❌ No | ❌ No |
| Premium doctor access | ✅ Gated by subscription tier | N/A | N/A |
| PDF health report for doctors | ✅ Export + email | ❌ No | ❌ No |

**Flow 365 Advantage:** The only period tracker with built-in telehealth. This creates a closed loop: track → analyze → consult → treat. Competitors require users to leave the app to seek medical care, breaking the health journey.

---

### 7. Mental Health & Crisis Safety

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| Crisis safety footer | ✅ Multi-country emergency resources (US, UK, CA, AU, IN, DE) | ❌ No | ❌ No |
| Suicide/crisis hotline integration | ✅ One-tap call (988, Samaritans, etc.) | ❌ No | ❌ No |
| Domestic violence resources | ✅ Integrated (National DV Hotline) | ❌ No | ❌ No |
| Mental health specialist access | ✅ Via telehealth | ❌ No | ❌ No |
| Crisis text line | ✅ Direct link | ❌ No | ❌ No |

**Flow 365 Advantage:** No competitor integrates mental health crisis resources directly into the app. Given that mood disorders are closely linked to menstrual cycles, this is a critical safety feature that demonstrates clinical responsibility.

---

### 8. Analytics & Data Visualization

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| Advanced analytics dashboard | ✅ Cycle trends, symptom correlations, AI insights | ✅ Basic charts | ✅ Analysis tab (Plus) |
| Cycle length trend charts | ✅ Yes | ✅ Yes | ✅ Yes |
| Mood timeline charts | ✅ Visual timeline | ❌ No | ❌ No |
| Irregularity detection & alerts | ✅ Automatic (cycle length, missed period, short cycle) | ✅ Basic | ❌ No |
| Confidence scoring on predictions | ✅ Transparent % with explanation | ❌ No | ❌ No |
| PDF report generation | ✅ Rich HTML-to-PDF with full analytics | ❌ No | ❌ No |
| Email export | ✅ Direct from app | ❌ No | ❌ No |
| Wearable integration | ❌ Not yet | ❌ No | ✅ Fitbit, Oura, Whoop, Withings |

**Assessment:** Flow 365 leads in AI-powered analytics and transparent confidence scoring. Clue leads in wearable integrations. Wearable support is on Flow 365's roadmap.

---

### 9. Engagement & Retention Features

| Feature | Flow 365 | Flo | Clue |
|---|---|---|---|
| Daily check-in wizard | ✅ Animated multi-step flow | ❌ No | ❌ No |
| Daily streak banner | ✅ Gamified, persistent | ❌ No | ❌ No |
| Smart reminders | ✅ Period, logging, fertile window, appointment | ✅ Period reminders | ✅ Period reminders |
| Secret name reveal (onboarding) | ✅ Animated, delightful | ❌ No | ❌ No |
| Haptic feedback | ✅ Throughout app | ❌ Limited | ❌ No |
| Redemption code system | ✅ Code-based activation | ❌ No | ❌ No |

**Flow 365 Advantage:** Micro-interactions, haptics, and gamification create emotional engagement. The secret name reveal during onboarding creates a memorable first impression that competitors lack entirely.

---

### 10. Technical Architecture

| Dimension | Flow 365 | Flo | Clue |
|---|---|---|---|
| Framework | React Native (Expo SDK 54) | Native (Swift/Kotlin) | Native (Swift/Kotlin) |
| Cross-platform | ✅ iOS + Android + Web | ✅ iOS + Android | ✅ iOS + Android + watchOS |
| Backend | Hono + tRPC + Supabase | Proprietary | Proprietary |
| State management | Zustand + React Query | Unknown | Unknown |
| AI infrastructure | Rork AI Toolkit SDK | Unknown | None |
| Type safety | ✅ Strict TypeScript | N/A | N/A |
| Error boundaries | ✅ Implemented | Unknown | Unknown |
| Test IDs | ✅ UI testing ready | Unknown | Unknown |

---

## Competitive Positioning Matrix

```
                    HIGH PRIVACY
                        │
                        │    ★ Flow 365
                        │    (HIPAA-aligned + AI + Telehealth)
                        │
                 Flo ●  │
           (ISO certs)  │
                        │
    ───────────────────────────────────── HIGH AI/INTELLIGENCE
                        │
              Clue ●    │
           (GDPR only)  │
                        │
                   LOW PRIVACY
```

---

## Market Opportunity & Differentiation Summary

| Differentiator | Why It Matters | Market Gap |
|---|---|---|
| **AI Health Assistant** | First conversational AI in period tracking | No competitor offers this |
| **Relationship Dashboard** | Partners actively engaged in health journey | No competitor offers this |
| **Built-in Telehealth** | Track → Analyze → Consult in one app | No competitor offers this |
| **Crisis Safety Resources** | Duty of care for mental health | No competitor offers this |
| **HIPAA-aligned Architecture** | Enterprise/clinical partnerships possible | Flo has ISO; Clue has GDPR only |
| **Transparent AI Confidence** | Trust through transparency | No competitor shows confidence scores |
| **PDF Health Reports** | Bridge between self-tracking and clinical care | No competitor generates clinical-grade PDFs |
| **Partner Education** | Reduces relationship friction around cycles | No competitor educates partners |
| **Secret Identity System** | Privacy + delight in one feature | No competitor has this |

---

## Maturity Scorecard (1-10 Scale)

| Category | Flow 365 | Flo | Clue |
|---|---|---|---|
| Core tracking depth | 8 | 9 | 8 |
| AI & intelligence | **9** | 3 | 2 |
| Privacy & compliance | **9** | 8 | 7 |
| Partner features | **10** | 3 | 3 |
| Pregnancy features | 5 | 9 | 7 |
| Telehealth integration | **8** | 0 | 0 |
| Crisis/safety features | **9** | 0 | 0 |
| Analytics & visualization | 8 | 6 | 7 |
| Engagement & retention | **8** | 6 | 5 |
| Data portability | **9** | 4 | 4 |
| Wearable integration | 0 | 0 | 7 |
| Content library | 4 | 9 | 8 |
| **TOTAL (out of 120)** | **87** | **57** | **58** |

---

## What Flow 365 Needs to Reach Parity on Remaining Gaps

| Gap | Priority | Effort | Impact |
|---|---|---|---|
| Kick counter & contraction timer | High | Low | Pregnancy completeness |
| Postpartum dashboard | High | Medium | Full maternal lifecycle |
| Content library / articles | Medium | Medium | Engagement + SEO |
| Wearable integrations (Oura, Fitbit, Apple Health) | High | Medium | Data richness |
| ISO 27001/27701 certification | High | High | Enterprise trust |
| Baby development week-by-week content | Medium | Low | Pregnancy engagement |
| watchOS companion | Low | Medium | Apple ecosystem |
| Multi-language support | Medium | Medium | Global expansion |

---

## Investment Thesis

> **Flow 365 is not playing catch-up. It is playing a fundamentally different game.**
>
> While Flo and Clue compete on content volume and user acquisition, Flow 365 competes on **intelligence, trust, and clinical integration**. The platform has 4 category-exclusive features (AI assistant, relationship dashboard, telehealth, crisis safety) that neither incumbent offers. The HIPAA-aligned architecture opens doors to B2B healthcare partnerships that Flo and Clue cannot pursue without significant re-architecture.
>
> The total addressable market for FemTech is projected to reach **$75B by 2030**. Flow 365 is positioned at the intersection of consumer health, AI, and telehealth — three of the fastest-growing segments in digital health.

---

*Document Version 1.0 | Generated March 2026*
*Source: Flow 365 codebase analysis + public competitor research*
*File: docs/INVESTOR_COMPETITIVE_ANALYSIS.md*
