import Stripe from "./stripeDep.ts"
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getBillingDb, insertOrder, insertTransaction } from "./billingDb.ts"
import type { CheckoutPlan } from "./stripePrices.ts"

export interface PaymentRefs {
  paymentIntentId: string | null
  invoiceId: string | null
  amount: number
  currency: string
}

function paymentIntentFrom(
  value: string | Stripe.PaymentIntent | null | undefined
): string | null {
  if (!value) return null
  return typeof value === "string" ? value : value.id ?? null
}

/** Subscription Checkout often has session.payment_intent = null; use latest_invoice instead. */
export async function resolvePaymentRefs(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  subscription?: Stripe.Subscription | null
): Promise<PaymentRefs> {
  let paymentIntentId = paymentIntentFrom(session.payment_intent as string | Stripe.PaymentIntent | null)
  let invoiceId =
    typeof session.invoice === "string"
      ? session.invoice
      : session.invoice?.id ?? null

  let amount = (session.amount_total ?? 0) / 100
  let currency = (session.currency ?? "aud").toUpperCase()

  let sub = subscription ?? null
  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id

  if (!sub && subId) {
    sub = await stripe.subscriptions.retrieve(subId, {
      expand: ["latest_invoice.payment_intent"],
    })
  } else if (sub && typeof sub.latest_invoice === "string") {
    sub = await stripe.subscriptions.retrieve(sub.id, {
      expand: ["latest_invoice.payment_intent"],
    })
  }

  const invoice =
    sub?.latest_invoice && typeof sub.latest_invoice === "object"
      ? (sub.latest_invoice as Stripe.Invoice)
      : null

  if (invoice) {
    invoiceId = invoiceId ?? invoice.id
    paymentIntentId = paymentIntentId ?? paymentIntentFrom(invoice.payment_intent)
    if (amount <= 0 && (invoice.amount_paid ?? 0) > 0) {
      amount = (invoice.amount_paid ?? 0) / 100
    }
    if (invoice.currency) currency = invoice.currency.toUpperCase()
  }

  return { paymentIntentId, invoiceId, amount, currency }
}

export async function resolveUserFromInvoice(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  db: SupabaseClient
): Promise<{ userId: string; userEmail: string } | null> {
  const metaUser = invoice.metadata?.user_id ?? invoice.metadata?.userId
  let userId = metaUser ? String(metaUser) : null
  let userEmail =
    invoice.metadata?.user_email ??
    invoice.metadata?.userEmail ??
    invoice.customer_email ??
    ""

  if (invoice.subscription) {
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id
    const subscription = await stripe.subscriptions.retrieve(subId)
    userId =
      userId ??
      subscription.metadata?.user_id ??
      subscription.metadata?.userId ??
      null
    userEmail =
      userEmail ||
      subscription.metadata?.user_email ||
      subscription.metadata?.userEmail ||
      ""

    if (!userId) {
      const { data } = await db
        .from("subscriptions")
        .select("user_id, user_email")
        .eq("stripe_subscription_id", subId)
        .maybeSingle()
      if (data?.user_id) {
        userId = data.user_id as string
        userEmail = (data.user_email as string) ?? userEmail
      }
    }
  }

  if (!userId) return null
  return { userId, userEmail: String(userEmail) }
}

async function transactionExists(
  db: SupabaseClient,
  stripeId: string
): Promise<boolean> {
  const { data } = await db
    .from("transactions")
    .select("id")
    .eq("stripe_id", stripeId)
    .maybeSingle()
  return Boolean(data?.id)
}

async function orderExistsForInitial(
  db: SupabaseClient,
  userId: string,
  plan: CheckoutPlan,
  paymentIntentId: string | null
): Promise<boolean> {
  if (paymentIntentId) {
    const { data } = await db
      .from("orders")
      .select("id")
      .eq("stripe_payment_id", paymentIntentId)
      .maybeSingle()
    if (data?.id) return true
  }
  const { data } = await db
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("type", `subscription_${plan}_initial`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return Boolean(data?.id)
}

/** Record first payment in orders + transactions (idempotent). */
export async function recordInitialSubscriptionPayment(
  db: SupabaseClient,
  params: {
    userId: string
    userEmail: string
    plan: CheckoutPlan
    refs: PaymentRefs
  }
): Promise<void> {
  const { userId, userEmail, plan, refs } = params
  if (refs.amount <= 0) return

  const stripePaymentId =
    refs.paymentIntentId ?? (refs.invoiceId ? `invoice:${refs.invoiceId}` : null)

  if (refs.invoiceId && !(await transactionExists(db, refs.invoiceId))) {
    await insertTransaction(db, {
      user_id: userId,
      user_email: userEmail,
      type: `payment_${plan}`,
      amount: refs.amount,
      currency: refs.currency,
      status: "completed",
      stripe_id: refs.invoiceId,
    })
  }

  if (!(await orderExistsForInitial(db, userId, plan, stripePaymentId))) {
    await insertOrder(db, {
      user_id: userId,
      user_email: userEmail,
      type: `subscription_${plan}_initial`,
      amount: refs.amount,
      currency: refs.currency,
      status: "completed",
      stripe_payment_id: stripePaymentId,
    })
  }
}
