import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getBillingDb } from "../_shared/billingDb.ts"
import { getStripe } from "../_shared/stripeClient.ts"
import { executeSubscriptionRefund } from "../_shared/executeSubscriptionRefund.ts"

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

    const { subscriptionId, refundAmount } = await req.json()
    if (!subscriptionId) throw new Error("subscriptionId is required")

    const stripe = getStripe()
    const billingDb = getBillingDb()

    const result = await executeSubscriptionRefund(
      stripe,
      billingDb,
      subscriptionId,
      refundAmount && typeof refundAmount === "number" ? refundAmount : undefined
    )

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: result.subscriptionId,
        refundId: result.refundId,
        refundAmount: result.refundAmount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Refund failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
