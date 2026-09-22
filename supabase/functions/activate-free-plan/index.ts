import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertCountryFeatureAllowed } from "../_shared/countryFeatures.ts"
import { getBillingDb, upsertSubscription } from "../_shared/billingDb.ts"

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

    const { plan, userId, userEmail, detectedCountry } = await req.json()

    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )
    await assertCountryFeatureAllowed(
      serviceRoleClient,
      detectedCountry,
      "subscription_checkout"
    )

    const checkoutPlan =
      plan === "yearly" || plan === "annual" ? "yearly" : "monthly"
    const email = userEmail || user.email
    if (!email) throw new Error("User email is required")

    const billingDb = getBillingDb()
    const now = new Date().toISOString()

    await upsertSubscription(billingDb, {
      user_id: userId,
      user_email: email,
      plan: checkoutPlan,
      status: "active",
      start_date: now,
      end_date: null,
      stripe_subscription_id: null,
      stripe_customer_id: null,
    })

    return new Response(
      JSON.stringify({ success: true, message: "Free subscription activated!" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Activation failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
