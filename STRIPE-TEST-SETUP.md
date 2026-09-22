# Stripe Test Pricing Setup Guide

## Overview
This guide will help you set up test pricing in Stripe for testing subscriptions with minimal amounts ($0.09/month and $0.99/year).

## Step-by-Step Instructions

### 1. Go to Stripe Dashboard
- Visit https://dashboard.stripe.com
- **Make sure you're in TEST MODE** (toggle in the top right)

### 2. Create Monthly Test Product
1. Click **"Products"** in the left sidebar
2. Click **"+ Add product"**
3. Fill in:
   - **Name:** "Flow365 Monthly Pro (Test)"
   - **Description:** "Test subscription for monthly pro features"
   - **Pricing:**
     - Type: **Recurring**
     - Price: **$0.09 USD**
     - Billing period: **Monthly**
4. Click **"Save product"**
5. After saving, you'll see:
   - **Payment Link:** Copy this URL (starts with `https://buy.stripe.com/test_...`)
   - **Price ID:** Copy this (starts with `price_...`)

### 3. Create Yearly Test Product
1. Click **"+ Add product"** again
2. Fill in:
   - **Name:** "Flow365 Yearly Pro (Test)"
   - **Description:** "Test subscription for yearly pro features"
   - **Pricing:**
     - Type: **Recurring**
     - Price: **$0.99 USD**
     - Billing period: **Yearly**
3. Click **"Save product"**
4. After saving, copy:
   - **Payment Link**
   - **Price ID**

### 4. Update Your .env File

Open your `env` file and replace the placeholders:

```env
# Stripe Test Mode
EXPO_PUBLIC_STRIPE_TEST_MODE=true
EXPO_PUBLIC_STRIPE_MONTHLY_TEST_LINK=https://buy.stripe.com/test_YOUR_ACTUAL_MONTHLY_LINK
EXPO_PUBLIC_STRIPE_MONTHLY_TEST_PRICE_ID=price_YOUR_ACTUAL_MONTHLY_PRICE_ID
EXPO_PUBLIC_STRIPE_YEARLY_TEST_LINK=https://buy.stripe.com/test_YOUR_ACTUAL_YEARLY_LINK
EXPO_PUBLIC_STRIPE_YEARLY_TEST_PRICE_ID=price_YOUR_ACTUAL_YEARLY_PRICE_ID
```

### 5. Restart Your Development Server

After updating the .env file, restart your Expo server:

```bash
# Stop the current server (Ctrl+C)
# Then start it again
bun start
```

### 6. Test the Subscriptions

1. Navigate to the subscription page in your app
2. Select either Monthly or Yearly plan
3. You should see the test prices ($0.09/month or $0.99/year)
4. Click "Subscribe" - it will open the Stripe checkout
5. Use a test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## How It Works

The app now checks the `EXPO_PUBLIC_STRIPE_TEST_MODE` environment variable:
- When `true`: Uses test prices ($0.09 and $0.99) and test payment links
- When `false`: Uses production prices ($9.99 and $99.99) and production links

## Switching Back to Production

When you're ready to go live:

1. Update `env`:
   ```env
   EXPO_PUBLIC_STRIPE_TEST_MODE=false
   ```
2. Make sure your production Stripe keys are set
3. Restart the server

## Important Notes

- ⚠️ **Never commit your actual .env file to git** - it contains sensitive keys
- ⚠️ The test webhook secret is different from production
- ⚠️ Test mode charges are not real - no actual money is processed
- ✅ Always test subscriptions in test mode before going live

## Testing Stripe Webhooks Locally

If you want to test webhook events:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:8081/api/webhook/stripe`
3. Update `STRIPE_WEBHOOK_SECRET` in your .env with the webhook secret from the CLI

## Need Help?

- Stripe Test Cards: https://stripe.com/docs/testing
- Stripe Dashboard: https://dashboard.stripe.com/test/dashboard
- Stripe Webhooks Guide: https://stripe.com/docs/webhooks
