# Mixpanel Analytics Tracking Documentation

## Overview
This document describes all Mixpanel analytics events and user properties tracked in the Flow 365 app.

## Setup
Mixpanel is initialized in `app/_layout.tsx` when the app starts. The service automatically tracks users and sends events to Mixpanel.

## Core Events

### Authentication & Onboarding
- `App Opened` - Tracked every time the app starts
- `User Registered` - When a user creates an account
  - Properties: `method` (email/mock)
- `User Login` - When a user logs in
  - Properties: `method` (email/mock)
- `User Logout` - When a user logs out
- `Onboarding Completed` - When onboarding flow is finished
- `Onboarding Step Completed` - Each step of onboarding
  - Properties: `step` (1, 2, 3, 4)

### Logging & Tracking
- `Log Entry Created` - When user creates a new log entry
  - Properties: `hasFlow`, `hasMood`, `hasSymptoms`, `hasPainLevel`, `hasDischarge`, `hasCravings`, `hasNotes`, `symptomCount`
- `Log Entry Updated` - When user updates an existing log
- `Mood Logged` - When user tracks mood
  - Properties: `mood`, `source` (quick-log/log-entry)
- `Symptom Logged` - When user tracks symptoms
  - Properties: `symptom`, `intensity`, `symptomCount`
- `Flow Logged` - When user tracks period flow
  - Properties: `flowIntensity`, `source` (quick-log/log-entry)
- `Intimacy Logged` - When user tracks intimacy
- `Medication Logged` - When user tracks medication
- `Pain Level Logged` - When user tracks pain level
  - Properties: `painLevel`
- `Discharge Logged` - When user tracks discharge
  - Properties: `dischargeType`
- `Cravings Logged` - When user tracks cravings
  - Properties: `cravings`, `cravingCount`
- `Note Added` - When user adds notes

### Period Tracking
- `Period Started` - When user marks period start
  - Properties: `cycleDay`, `cycleLength`
- `Period Ended` - When user marks period end
  - Properties: `periodLength`, `cycleDay`

### Predictions & Insights
- `Predictions Viewed` - When user views predictions card
- `Predictions Generated` - When predictions are generated
  - Properties: `confidence`, `nextPeriodInDays`, `method` (ai/local)
- `Insight Viewed` - When user views an insight
  - Properties: `insightType`, `insightTitle`
- `Insight Read` - When user marks insight as read
  - Properties: `insightType`
- `AI Tip Viewed` - When AI tip is displayed

### Navigation & Features
- `Calendar Viewed` - When user opens calendar screen
- `Calendar Day Selected` - When user selects a day on calendar
  - Properties: `hasData`, `date`
- `Profile Viewed` - When user views profile
- `Profile Updated` - When user updates profile
  - Properties: `fieldsUpdated`
- `Emergency Contacts Viewed` - When user views emergency contacts
- `Emergency Contact Added` - When user adds emergency contact
- `Reminders Viewed` - When user views reminders screen
- `Reminder Created` - When user creates a reminder
  - Properties: `reminderType`
- `Reminder Deleted` - When user deletes a reminder

### Data Management
- `Data Exported` - When user exports their data
  - Properties: `format` (json/csv)
- `Data Deleted` - When user deletes their data

### Subscription & Revenue
- `Subscription Paywall Viewed` - When paywall is shown
  - Properties: `trigger` (feature/upgrade-button)
- `Subscription Initiated` - When user starts subscription flow
  - Properties: `plan` (premium/pro)
- `Subscription Completed` - When subscription purchase succeeds
  - Properties: `plan`, `price`, `currency`
- `Subscription Cancelled` - When user cancels subscription
- `Subscription Restored` - When user restores previous purchase

### AI Features
- `AI Chatbot Opened` - When user opens AI chatbot
- `AI Chatbot Message Sent` - When user sends message to AI
  - Properties: `messageLength`, `hasImage`
- `AI Chatbot Message Received` - When AI responds
  - Properties: `responseLength`, `hasToolCall`
- `Symptom Checker Opened` - When user opens symptom checker
- `Symptom Checker Completed` - When user completes symptom check
  - Properties: `symptomCount`, `riskLevel`

### Telehealth
- `Telehealth Viewed` - When user views telehealth options
- `Appointment Booked` - When user books an appointment
  - Properties: `appointmentType`, `provider`
- `Appointment Cancelled` - When user cancels appointment
- `Consultation Started` - When consultation begins
- `Consultation Ended` - When consultation ends
  - Properties: `duration`

### Analytics
- `Advanced Analytics Viewed` - When user views analytics screen
- `Chart Viewed` - When user views a specific chart
  - Properties: `chartType`

### Help & Legal
- `Help Viewed` - When user views help screen
- `Privacy Policy Viewed` - When user views privacy policy
- `Terms of Service Viewed` - When user views terms

### Errors
- `Error Occurred` - When an error happens
  - Properties: `errorType`, `errorMessage`, `screen`

### General
- `Screen Viewed` - Generic screen view tracking
  - Properties: `screenName`, `previousScreen`

## User Properties

### Profile Information
- `Subscription Plan` - Current subscription level (free/premium/pro)
- `Subscription Active` - Boolean if subscription is active
- `Average Cycle Length` - User's average cycle length in days
- `Average Period Length` - User's average period length in days
- `Notifications Enabled` - Boolean for notification settings
- `Insights Enabled` - Boolean for AI insights setting
- `Onboarded` - Boolean if user completed onboarding
- `First Seen` - Timestamp of first app use

### Usage Statistics
- `Total Cycles Tracked` - Number of cycles tracked
- `Total Logs` - Total number of log entries
- `Most Frequent Mood` - User's most common mood
- `Most Frequent Symptoms` - Array of most common symptoms
- `Last Log Date` - Date of last log entry
- `Days Since Last Log` - Number of days since last log

### Incremental Properties
These properties are incremented when events occur:
- `Total Logs Created`
- `Total Predictions Generated`
- `Total Insights Read`
- `Total AI Messages Sent`

## Revenue Tracking

### Subscription Charges
When a subscription is completed, we track the charge:
```typescript
mixpanel.trackCharge(amount, {
  plan: 'premium',
  currency: 'USD',
  billingPeriod: 'monthly'
});
```

## Funnel Analysis

### Subscription Funnel
1. `Subscription Paywall Viewed`
2. `Subscription Initiated`
3. `Subscription Completed`

### Onboarding Funnel
1. `App Opened` (first time)
2. `Onboarding Step Completed` (step 1)
3. `Onboarding Step Completed` (step 2)
4. `Onboarding Step Completed` (step 3)
5. `Onboarding Step Completed` (step 4)
6. `Onboarding Completed`
7. `User Registered`

### Engagement Funnel
1. `App Opened`
2. `Log Entry Created`
3. `Predictions Viewed`
4. `Insight Read`

## Retention Cohorts

Track user retention based on:
- Days since first log
- Cycle day (which days users are most active)
- Notification opt-in status
- Feature usage patterns

## A/B Testing

Track which features drive conversion:
- Free users who view premium features
- Users who engage with AI vs manual tracking
- Calendar users vs Insights users
- Daily loggers vs weekly loggers

## Implementation Notes

1. All tracking is web-compatible using Mixpanel HTTP API
2. Events are sent asynchronously to not block UI
3. User identification happens on login/register
4. User properties are updated on profile changes
5. Failed events are logged to console but don't throw errors

## Privacy

- No PII (Personally Identifiable Information) beyond user ID
- No health data content in events (only counts/types)
- All data respects user consent settings
- Users can opt-out of analytics in settings
