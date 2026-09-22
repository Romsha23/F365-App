import Stripe from "./stripeDep.ts"

const STRIPE_API_VERSION = "2023-10-16" as const

/** Supports STRIPE_SECRET_KEY, SECRET_KEY_STRIPE, and sk_* passed directly. */
export function getStripeSecretKey(): string {
  const key =
    Deno.env.get("STRIPE_SECRET_KEY") ??
    Deno.env.get("SECRET_KEY_STRIPE") ??
    ""
  if (!key) {
    throw new Error(
      "Missing Stripe secret key. Set STRIPE_SECRET_KEY (or SECRET_KEY_STRIPE) on edge function secrets."
    )
  }
  return key
}

export function getStripeWebhookSecret(): string {
  const secret =
    Deno.env.get("STRIPE_WEBHOOK_SECRET") ??
    Deno.env.get("WEBHOOK_SECRET_STRIPE") ??
    ""
  if (!secret) {
    throw new Error(
      "Missing STRIPE_WEBHOOK_SECRET. Create a webhook in Stripe Dashboard pointing to stripe-billing-webhook."
    )
  }
  return secret
}

export function getStripe(): Stripe {
  return new Stripe(getStripeSecretKey(), { apiVersion: STRIPE_API_VERSION })
}

export function getSiteUrl(): string {
  return (
    Deno.env.get("SITE_URL") ??
    Deno.env.get("FRONTEND_URL") ??
    Deno.env.get("VITE_SITE_URL") ??
    "http://localhost:5173"
  ).replace(/\/$/, "")
}
