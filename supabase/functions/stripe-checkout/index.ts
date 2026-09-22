import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertCountryFeatureAllowed } from "../_shared/countryFeatures.ts"
import {
  getActiveSubscriptionForUser,
  getBillingDb,
} from "../_shared/billingDb.ts"
import { getSiteUrl, getStripe } from "../_shared/stripeClient.ts"
import { resolveStripePriceId, type CheckoutPlan } from "../_shared/stripePrices.ts"
import {
  assertCanPurchasePlan,
  SubscriptionConflictError,
} from "../_shared/subscriptionRules.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error("Unauthorized")

    const {
      plan,
      userId,
      userEmail,
      detectedCountry,
      successUrl,
      cancelUrl,
    } = await req.json()

    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const checkoutPlan = (plan === "monthly" ? "monthly" : "yearly") as CheckoutPlan
    const email = userEmail || user.email
    if (!email) throw new Error("User email is required")

    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )
    await assertCountryFeatureAllowed(
      serviceRoleClient,
      detectedCountry,
      "subscription_checkout"
    )

    const billingDb = getBillingDb()
    const existing = await getActiveSubscriptionForUser(billingDb, userId)
    assertCanPurchasePlan(existing, checkoutPlan)

    // Look up any pending coupon for this user
    let pendingCouponId: string | undefined
    const { data: pending } = await serviceRoleClient
      .from("pending_coupons")
      .select("coupon_id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle()
    if (pending) {
      pendingCouponId = pending.coupon_id
    }

    let priceId: string
    try {
      priceId = await resolveStripePriceId(
        serviceRoleClient,
        checkoutPlan,
        detectedCountry
      )
    } catch (e) {
      if (e instanceof Error && e.message === "FREE_PLAN_REGION") {
        return new Response(
          JSON.stringify({
            error:
              "This region uses free activation. Use the free plan flow instead of checkout.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }
      throw e
    }

    const stripe = getStripe()
    const siteUrl = getSiteUrl()

    let customerId: string | undefined
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id
    } else {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { user_id: userId },
        })
        customerId = customer.id
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        successUrl ??
        `${siteUrl}/account/subscription?session_id={CHECKOUT_SESSION_ID}&success=true&tab=subscription`,
      cancel_url: cancelUrl ?? `${siteUrl}/pricing?canceled=true`,
      metadata: {
        user_id: userId,
        user_email: email,
        plan: checkoutPlan,
        detected_country: detectedCountry ?? "",
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          user_email: email,
          plan: checkoutPlan,
        },
      },
      payment_method_collection: "always",
      ...(pendingCouponId
        ? { discounts: [{ coupon: pendingCouponId }] }
        : { allow_promotion_codes: true }),
    })

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL")
    }

    if (pendingCouponId) {
      await serviceRoleClient
        .from("pending_coupons")
        .update({ status: "used", used_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("coupon_id", pendingCouponId)
        .eq("status", "pending")
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed"
    const status =
      error instanceof SubscriptionConflictError ? 409 : 400
    const body: Record<string, unknown> = { error: message }
    if (error instanceof SubscriptionConflictError) {
      body.code = error.code
    }
    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    })
  }
})
