import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getBillingDb } from "../_shared/billingDb.ts"
import { getStripe } from "../_shared/stripeClient.ts"
import { normalizePlan } from "../_shared/subscriptionRules.ts"

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

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { subscriptionId, cancelImmediately = false } = await req.json()
    if (!subscriptionId) throw new Error("subscriptionId is required")

    const stripe = getStripe()
    const billingDb = getBillingDb()

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const plan = normalizePlan(
      subscription.metadata?.plan ??
        subscription.items.data[0]?.price?.recurring?.interval ??
        "monthly"
    )

    let updated
    if (plan === "yearly" || cancelImmediately) {
      updated = await stripe.subscriptions.cancel(subscriptionId)
    } else {
      updated = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    }

    await billingDb
      .from("subscriptions")
      .update({
        status: updated.status,
        end_date: new Date(updated.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId,
        status: updated.status,
        cancel_at_period_end: updated.cancel_at_period_end,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Cancel failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
