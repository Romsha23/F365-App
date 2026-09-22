import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getStripe } from "../_shared/stripeClient.ts"

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

    const { chargeId, paymentIntentId, amount, reason } = await req.json()
    const stripe = getStripe()

    let refund
    if (paymentIntentId) {
      const params: { payment_intent: string; amount?: number; reason?: string } = {
        payment_intent: paymentIntentId,
      }
      if (amount != null) params.amount = Math.round(Number(amount) * 100)
      if (reason) params.reason = reason as "duplicate" | "fraudulent" | "requested_by_customer"
      refund = await stripe.refunds.create(params)
    } else if (chargeId) {
      const params: { charge: string; amount?: number; reason?: string } = {
        charge: chargeId,
      }
      if (amount != null) params.amount = Math.round(Number(amount) * 100)
      if (reason) params.reason = reason as "duplicate" | "fraudulent" | "requested_by_customer"
      refund = await stripe.refunds.create(params)
    } else {
      throw new Error("chargeId or paymentIntentId is required")
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund,
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
