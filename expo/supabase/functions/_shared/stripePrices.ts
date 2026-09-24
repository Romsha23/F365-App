import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export type CheckoutPlan = "monthly" | "yearly"

const ENV_MONTHLY = "STRIPE_PRICE_MONTHLY"
const ENV_YEARLY = "STRIPE_PRICE_YEARLY"
const DEFAULT_MONTHLY = "price_1SXuFd7fQuFoYSVZvgZSOTWJ"
const DEFAULT_YEARLY = "price_1SXtPK7fQuFoYSVZjaZ6RyV2"

export async function resolveStripePriceId(
  db: SupabaseClient,
  plan: CheckoutPlan,
  detectedCountry?: string | null
): Promise<string> {
  const planKey = plan === "yearly" ? "plus_annual" : "plus_monthly"

  if (detectedCountry) {
    const code = detectedCountry.toUpperCase()
    const { data: regional } = await db
      .from("country_pricing")
      .select("monthly_stripe_price_id, yearly_stripe_price_id, is_free")
      .eq("country_code", code)
      .maybeSingle()

    if (regional?.is_free) {
      throw new Error("FREE_PLAN_REGION")
    }

    const regionalPriceId =
      plan === "yearly"
        ? regional?.yearly_stripe_price_id
        : regional?.monthly_stripe_price_id
    if (regionalPriceId) return regionalPriceId
  }

  const { data: pricingPlan } = await db
    .from("pricing_plans")
    .select("stripe_price_id")
    .eq("plan_key", planKey)
    .eq("is_active", true)
    .maybeSingle()

  if (pricingPlan?.stripe_price_id) {
    return pricingPlan.stripe_price_id
  }

  const fromEnv =
    plan === "yearly"
      ? Deno.env.get(ENV_YEARLY) ?? DEFAULT_YEARLY
      : Deno.env.get(ENV_MONTHLY) ?? DEFAULT_MONTHLY

  return fromEnv
}
