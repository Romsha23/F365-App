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

    const body = await req.json()
    const couponDetails = body.couponDetails ?? body
    const id = couponDetails.id ?? couponDetails.code
    const percentOff = couponDetails.percent_off ?? couponDetails.percentOff
    const amountOff = couponDetails.amount_off ?? couponDetails.amountOff
    const duration = couponDetails.duration ?? "once"

    if (!id) throw new Error("Coupon id/code is required")

    const stripe = getStripe()
    const params: Record<string, unknown> = {
      id: String(id).toUpperCase(),
      duration,
      name: couponDetails.name ?? String(id),
    }

    if (percentOff != null) {
      params.percent_off = Number(percentOff)
    } else if (amountOff != null) {
      params.amount_off = Math.round(Number(amountOff) * 100)
      params.currency = couponDetails.currency ?? "aud"
    } else {
      throw new Error("percent_off or amount_off is required")
    }

    const coupon = await stripe.coupons.create(params)

    return new Response(JSON.stringify({ success: true, coupon }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Create coupon failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
