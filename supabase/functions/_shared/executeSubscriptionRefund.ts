import Stripe from "./stripeDep.ts"
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export interface SubscriptionRefundResult {
  refundId?: string
  subscriptionId: string
  refundAmount: number | "full"
}

export async function executeSubscriptionRefund(
  stripe: Stripe,
  billingDb: SupabaseClient,
  subscriptionId: string,
  refundAmount?: number
): Promise<SubscriptionRefundResult> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice"],
  })

  const invoice = subscription.latest_invoice
  const paymentIntentId =
    typeof invoice === "object" && invoice && "payment_intent" in invoice
      ? typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent?.id
      : undefined

  let refundId: string | undefined

  if (paymentIntentId) {
    const refundParams: { payment_intent: string; amount?: number } = {
      payment_intent: paymentIntentId,
    }
    if (refundAmount != null && typeof refundAmount === "number") {
      refundParams.amount = Math.round(refundAmount * 100)
    }
    const refund = await stripe.refunds.create(refundParams)
    refundId = refund.id
  }

  await stripe.subscriptions.cancel(subscriptionId)

  const now = new Date().toISOString()
  await billingDb
    .from("subscriptions")
    .update({
      status: "cancelled",
      end_date: now,
      cancel_at_period_end: false,
      updated_at: now,
    })
    .eq("stripe_subscription_id", subscriptionId)

  return {
    refundId,
    subscriptionId,
    refundAmount: refundAmount ?? "full",
  }
}
