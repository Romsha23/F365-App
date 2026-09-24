import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getStripe } from "../_shared/stripeClient.ts"
import { syncCheckoutSessionToDb } from "../_shared/syncSubscription.ts"
import { getBillingDb } from "../_shared/billingDb.ts"
import {
  recordInitialSubscriptionPayment,
  resolvePaymentRefs,
} from "../_shared/billingPayment.ts"
import { normalizePlan } from "../_shared/subscriptionRules.ts"
import type { CheckoutPlan } from "../_shared/stripePrices.ts"

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

    const { sessionId } = await req.json()
    if (!sessionId) throw new Error("sessionId is required")

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription.latest_invoice.payment_intent", "invoice", "line_items"],
    })

    const sessionUserId =
      session.metadata?.user_id ?? session.metadata?.userId
    if (sessionUserId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (session.payment_status === "unpaid") {
      return new Response(
        JSON.stringify({
          success: false,
          pending: true,
          paymentStatus: session.payment_status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    const subscriptionObject =
      session.subscription && typeof session.subscription === "object"
        ? session.subscription
        : null

    await syncCheckoutSessionToDb(stripe, session)

    const billingDb = getBillingDb()
    const planFromSession = normalizePlan(
      (session.metadata?.plan as string) || "yearly"
    ) as CheckoutPlan

    if (session.payment_status === "paid") {
      const refs = await resolvePaymentRefs(stripe, session, subscriptionObject)
      await recordInitialSubscriptionPayment(billingDb, {
        userId: user.id,
        userEmail: user.email ?? "",
        plan: planFromSession,
        refs,
      })
    }

    const { data: subscription } = await billingDb
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const plan = subscription?.plan
      ? normalizePlan(subscription.plan)
      : normalizePlan((session.metadata?.plan as string) || "yearly")

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: session.payment_status,
        subscription,
        plan,
        autoRenew: subscription?.status === "active" && !subscription?.cancel_at_period_end,
        nextBillingDate: subscription?.end_date ?? null,
        billingInterval: subscription?.billing_interval ?? (plan === "yearly" ? "year" : "month"),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Confirmation failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
