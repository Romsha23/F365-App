import Stripe from "./stripeDep.ts"
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  getBillingDb,
  setUserSubscriptionActive,
  upsertSubscription,
  type SubscriptionRow,
} from "./billingDb.ts"
import { normalizePlan, stripeIntervalToPlan } from "./subscriptionRules.ts"
import type { CheckoutPlan } from "./stripePrices.ts"

function metadataUserId(obj: { metadata?: Stripe.Metadata | null }): string | null {
  return obj.metadata?.user_id ?? obj.metadata?.userId ?? null
}

function metadataUserEmail(obj: { metadata?: Stripe.Metadata | null }): string | null {
  return obj.metadata?.user_email ?? obj.metadata?.userEmail ?? null
}

function periodIso(unix?: number | null): string | null {
  if (unix == null || !Number.isFinite(unix)) return null
  return new Date(unix * 1000).toISOString()
}

async function resolveSubscriptionContext(
  db: SupabaseClient,
  subscription: Stripe.Subscription,
  overrides?: { userId?: string; userEmail?: string }
): Promise<{ userId: string; userEmail: string } | null> {
  let userId = overrides?.userId ?? metadataUserId(subscription)
  let userEmail = overrides?.userEmail ?? metadataUserEmail(subscription) ?? ""

  if (!userId) {
    const { data } = await db
      .from("subscriptions")
      .select("user_id, user_email")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle()

    if (data?.user_id) {
      userId = data.user_id as string
      userEmail = (data.user_email as string) ?? userEmail
    }
  }

  if (!userId) return null
  return { userId, userEmail }
}

export function planFromStripeSubscription(sub: Stripe.Subscription): CheckoutPlan {
  const metaPlan = sub.metadata?.plan
  if (metaPlan) return normalizePlan(metaPlan)
  return stripeIntervalToPlan(sub.items.data[0]?.price?.recurring?.interval)
}

export async function syncStripeSubscriptionToDb(
  subscription: Stripe.Subscription,
  overrides?: { userId?: string; userEmail?: string; plan?: CheckoutPlan }
): Promise<SubscriptionRow | null> {
  const db = getBillingDb()
  const ctx = await resolveSubscriptionContext(db, subscription, overrides)

  if (!ctx) {
    console.warn(
      `[syncSubscription] No user_id for subscription ${subscription.id} — skip sync`
    )
    return null
  }

  const { userId, userEmail } = ctx
  const plan = overrides?.plan ?? planFromStripeSubscription(subscription)
  const price = subscription.items.data[0]?.price
  const unitAmount = price?.unit_amount
  const amount = unitAmount != null ? unitAmount / 100 : 0
  const currency = price?.currency?.toUpperCase() ?? "AUD"
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null

  const row: SubscriptionRow = {
    user_id: userId,
    user_email: userEmail,
    plan,
    status: subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    start_date: periodIso(subscription.current_period_start),
    end_date: periodIso(subscription.current_period_end),
    amount,
    currency,
    queued_plan: null,
    queued_start_date: null,
  }

  await upsertSubscription(db, row)

  const { error: renewError } = await db
    .from("subscriptions")
    .update({
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      billing_interval: plan === "yearly" ? "year" : "month",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)

  if (renewError) {
    console.warn(
      "[syncSubscription] renewal fields update:",
      renewError.message,
      "(run migration 0006 if columns are missing)"
    )
  }

  const active = ["active", "trialing"].includes(subscription.status)
  await setUserSubscriptionActive(db, userId, active)

  return row
}

export async function syncCheckoutSessionToDb(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<SubscriptionRow | null> {
  const userId = metadataUserId(session)
  if (!userId) return null

  const userEmail =
    metadataUserEmail(session) ??
    session.customer_email ??
    session.customer_details?.email ??
    ""
  const requestedPlan = (session.metadata?.plan as string) || "yearly"
  const plan = normalizePlan(requestedPlan)

  if (session.mode !== "subscription" || !session.subscription) {
    return null
  }

  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id

  const subscription = await stripe.subscriptions.retrieve(subId)
  const db = getBillingDb()

  const { data: existing } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle()

  const currentPlan = existing ? normalizePlan(existing.plan) : null
  const shouldQueue =
    existing &&
    currentPlan === "monthly" &&
    plan === "yearly" &&
    ["active", "trialing"].includes(existing.status)

  if (shouldQueue) {
    await db
      .from("subscriptions")
      .update({
        queued_plan: "yearly",
        queued_start_date: existing.end_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
    return existing as SubscriptionRow
  }

  return syncStripeSubscriptionToDb(subscription, { userId, userEmail, plan })
}
