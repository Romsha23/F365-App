import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertCountryFeatureAllowed } from "../_shared/countryFeatures.ts"
import { getActiveSubscriptionForUser, getBillingDb } from "../_shared/billingDb.ts"
import {
  buildRefundReceivedEmail,
  sendRefundNotificationEmail,
} from "../_shared/refundRequestEmails.ts"

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

    const { reason, detectedCountry } = await req.json()
    const trimmedReason = typeof reason === "string" ? reason.trim() : ""
    if (!trimmedReason) throw new Error("Reason is required")

    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    await assertCountryFeatureAllowed(
      serviceRoleClient,
      detectedCountry,
      "refund_requests"
    )

    const { data: existingPending } = await serviceRoleClient
      .from("refund_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle()

    if (existingPending) {
      throw new Error(
        "You already have a pending refund request. We'll review it shortly."
      )
    }

    const billingDb = getBillingDb()
    const subscription = await getActiveSubscriptionForUser(billingDb, user.id)
    const email = user.email ?? ""

    // Block refunds for free subscriptions obtained via redemption codes
    if (subscription && !subscription.stripe_subscription_id && (subscription as Record<string, unknown>).amount === 0) {
      throw new Error("This subscription was obtained via a redemption code and is not eligible for a refund.")
    }

    const subAmount = subscription && (subscription as Record<string, unknown>).amount != null
      ? Number((subscription as Record<string, unknown>).amount)
      : 0
    const subCurrency = (subscription as Record<string, unknown>)?.currency ?? "AUD"

    const { data: row, error: insertError } = await serviceRoleClient
      .from("refund_requests")
      .insert({
        user_id: user.id,
        user_email: email,
        reason: trimmedReason,
        status: "pending",
        stripe_subscription_id: subscription?.stripe_subscription_id ?? null,
        amount: subAmount,
        currency: subCurrency,
      })
      .select()
      .single()

    if (insertError) throw insertError

    if (email) {
      const { subject, html } = buildRefundReceivedEmail(email, row.id)
      await sendRefundNotificationEmail(email, subject, html)
    }

    return new Response(JSON.stringify({ success: true, request: row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Submit failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
