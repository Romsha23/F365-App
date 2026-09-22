import Stripe from "./stripeDep.ts"
import {
  getBillingDb,
  insertOrder,
  insertTransaction,
  setUserSubscriptionActive,
} from "./billingDb.ts"
import {
  recordInitialSubscriptionPayment,
  resolvePaymentRefs,
  resolveUserFromInvoice,
} from "./billingPayment.ts"
import { planFromStripeSubscription, syncStripeSubscriptionToDb } from "./syncSubscription.ts"
import { normalizePlan } from "./subscriptionRules.ts"
import type { CheckoutPlan } from "./stripePrices.ts"

function metadataUserId(obj: { metadata?: Stripe.Metadata | null }): string | null {
  return obj.metadata?.user_id ?? obj.metadata?.userId ?? null
}

function metadataUserEmail(obj: { metadata?: Stripe.Metadata | null }): string | null {
  return obj.metadata?.user_email ?? obj.metadata?.userEmail ?? null
}

async function transactionExists(db: ReturnType<typeof getBillingDb>, stripeId: string): Promise<boolean> {
  const { data } = await db.from("transactions").select("id").eq("stripe_id", stripeId).maybeSingle()
  return Boolean(data?.id)
}

export async function handleCheckoutSessionCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = metadataUserId(session)
  if (!userId) {
    console.warn("[webhook] checkout.session.completed missing user_id metadata")
    return
  }

  const userEmail =
    metadataUserEmail(session) ?? session.customer_email ?? session.customer_details?.email ?? ""
  const plan = normalizePlan((session.metadata?.plan as string) || "yearly")

  if (session.mode === "subscription" && session.subscription) {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id

    const subscription = await stripe.subscriptions.retrieve(subId, {
      expand: ["latest_invoice.payment_intent"],
    })
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
      return
    }

    await syncStripeSubscriptionToDb(subscription, { userId, userEmail, plan })

    const refs = await resolvePaymentRefs(stripe, session, subscription)
    await recordInitialSubscriptionPayment(db, {
      userId,
      userEmail,
      plan: plan as CheckoutPlan,
      refs,
    })
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = metadataUserId(subscription)
  if (!userId) return

  await syncStripeSubscriptionToDb(subscription)
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = metadataUserId(subscription)
  if (!userId) return

  const db = getBillingDb()
  const { data: row } = await db
    .from("subscriptions")
    .select("queued_plan, stripe_customer_id, user_email")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle()

  await db
    .from("subscriptions")
    .update({
      status: "cancelled",
      end_date: new Date().toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)

  await setUserSubscriptionActive(db, userId, false)

  // Queued yearly after monthly ends — flagged for admin/portal; full swap requires new checkout
  if (row?.queued_plan) {
    console.log(
      `[webhook] User ${userId} has queued plan ${row.queued_plan} — prompt new checkout or portal upgrade`
    )
  }
}

export async function handleInvoicePaid(
  stripe: Stripe,
  invoice: Stripe.Invoice
): Promise<void> {
  const db = getBillingDb()
  const resolved = await resolveUserFromInvoice(stripe, invoice, db)
  if (!resolved) {
    console.warn(
      `[webhook] invoice.paid ${invoice.id}: could not resolve user_id — skip`
    )
    return
  }

  const { userId, userEmail } = resolved

  let subscription: Stripe.Subscription | null = null
  if (invoice.subscription) {
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id
    subscription = await stripe.subscriptions.retrieve(subId)
  }
  const billingReason = invoice.billing_reason ?? ""
  const isRenewal =
    billingReason === "subscription_cycle" ||
    billingReason === "subscription_update"

  if (subscription) {
    await syncStripeSubscriptionToDb(subscription, {
      userId,
      userEmail: userEmail ?? "",
    })
  }

  if (await transactionExists(db, invoice.id)) {
    return
  }

  const plan = subscription ? planFromStripeSubscription(subscription) : "monthly"
  const txType = isRenewal
    ? `auto_renew_${plan}`
    : `payment_${plan}`

  await insertTransaction(db, {
    user_id: userId,
    user_email: userEmail,
    type: txType,
    amount: (invoice.amount_paid ?? 0) / 100,
    currency: (invoice.currency ?? "aud").toUpperCase(),
    status: "completed",
    stripe_id: invoice.id,
  })

  const paymentIntentId =
    typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent?.id ?? null

  if (isRenewal && (invoice.amount_paid ?? 0) > 0) {
    await insertOrder(db, {
      user_id: userId,
      user_email: userEmail,
      type: `subscription_${plan}_renewal`,
      amount: (invoice.amount_paid ?? 0) / 100,
      currency: (invoice.currency ?? "aud").toUpperCase(),
      status: "completed",
      stripe_payment_id:
        paymentIntentId ?? (invoice.id ? `invoice:${invoice.id}` : null),
    })
  } else if (
    !isRenewal &&
    (invoice.amount_paid ?? 0) > 0 &&
    billingReason === "subscription_create"
  ) {
    // First invoice — backup if checkout.session.completed ran before invoice existed
    const refs = {
      paymentIntentId,
      invoiceId: invoice.id,
      amount: (invoice.amount_paid ?? 0) / 100,
      currency: (invoice.currency ?? "aud").toUpperCase(),
    }
    await recordInitialSubscriptionPayment(db, {
      userId,
      userEmail,
      plan,
      refs,
    })
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id

  if (!subId) return

  const db = getBillingDb()
  await db
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId)
}
