import type { SubscriptionRow } from "./billingDb.ts"
import type { CheckoutPlan } from "./stripePrices.ts"

export class SubscriptionConflictError extends Error {
  code: string
  constructor(message: string, code: string = "CONFLICT") {
    super(message)
    this.name = "SubscriptionConflictError"
    this.code = code
  }
}

function isPeriodEnded(endDate?: string | null): boolean {
  if (!endDate) return true
  return new Date(endDate).getTime() < Date.now()
}

/** 8-rule conflict matrix before Stripe checkout / redeem. */
export function assertCanPurchasePlan(
  existing: SubscriptionRow | null,
  requested: CheckoutPlan
): void {
  if (!existing) return

  const status = (existing.status || "").toLowerCase()
  const currentPlan = normalizePlan(existing.plan)
  const hasQueued = Boolean(existing.queued_plan)

  if (hasQueued) {
    throw new SubscriptionConflictError("A plan is already queued. Wait until it starts before changing plans.")
  }

  const isActiveLike = ["active", "trialing", "past_due"].includes(status)
  const cancelledGrace =
    status === "cancelled" && !isPeriodEnded(existing.end_date)

  if (!isActiveLike && !cancelledGrace) {
    return
  }

  if (currentPlan === requested) {
    throw new SubscriptionConflictError(
      `You are already on the ${requested} plan. Visit your subscription page to manage or change your plan.`,
      "ALREADY_ON_PLAN"
    )
  }

  if (currentPlan === "yearly" && requested === "monthly") {
    throw new SubscriptionConflictError("You have an active annual plan. Monthly is not available until it ends.")
  }

  // Monthly → yearly: allowed (will queue in webhook / post-checkout handler)
  // Cancelled but period not ended: allowed (queue)
}

export function normalizePlan(plan: string): CheckoutPlan {
  const p = plan.toLowerCase()
  if (p.includes("year") || p === "annual" || p === "yearly") return "yearly"
  return "monthly"
}

export function stripeIntervalToPlan(interval?: string): CheckoutPlan {
  return interval === "year" ? "yearly" : "monthly"
}
