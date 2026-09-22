import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { executeSubscriptionRefund } from "../_shared/executeSubscriptionRefund.ts"
import { getStripe } from "../_shared/stripeClient.ts"
import { getBillingDb } from "../_shared/billingDb.ts"
import {
  buildRefundProcessedEmail,
  buildRefundRejectedEmail,
  sendRefundNotificationEmail,
} from "../_shared/refundRequestEmails.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

async function requireAdmin(req: Request) {
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
    return { error: "Forbidden" as const }
  }

  const serviceRoleClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  return { user, serviceRoleClient }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const auth = await requireAdmin(req)
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { user, serviceRoleClient } = auth
    const { action, requestId, status, adminNotes, refundAmount, subscriptionId } =
      await req.json()

    if (action === "list") {
      let query = serviceRoleClient
        .from("refund_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (status && typeof status === "string") {
        query = query.eq("status", status)
      }

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify({ requests: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    if (!requestId) throw new Error("requestId is required")

    const { data: requestRow, error: fetchError } = await serviceRoleClient
      .from("refund_requests")
      .select("*")
      .eq("id", requestId)
      .single()

    if (fetchError || !requestRow) throw new Error("Refund request not found")

    if (requestRow.status !== "pending") {
      throw new Error(`Request is already ${requestRow.status}`)
    }

    const now = new Date().toISOString()
    const notes =
      typeof adminNotes === "string" && adminNotes.trim()
        ? adminNotes.trim()
        : null

    if (action === "reject") {
      const { data: updated, error } = await serviceRoleClient
        .from("refund_requests")
        .update({
          status: "rejected",
          admin_notes: notes,
          reviewed_by: user.id,
          reviewed_at: now,
        })
        .eq("id", requestId)
        .select()
        .single()

      if (error) throw error

      if (requestRow.user_email) {
        const { subject, html } = buildRefundRejectedEmail(
          requestRow.user_email,
          notes
        )
        await sendRefundNotificationEmail(requestRow.user_email, subject, html)
      }

      return new Response(JSON.stringify({ success: true, request: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    if (action === "approve") {
      const subId =
        (typeof subscriptionId === "string" && subscriptionId.trim()) ||
        requestRow.stripe_subscription_id

      if (!subId) {
        throw new Error(
          "No Stripe subscription on file. Add subscription ID when approving."
        )
      }

      const stripe = getStripe()
      const billingDb = getBillingDb()
      const amount =
        refundAmount != null && refundAmount !== ""
          ? Number(refundAmount)
          : undefined

      const refundResult = await executeSubscriptionRefund(
        stripe,
        billingDb,
        subId,
        Number.isFinite(amount) ? amount : undefined
      )

      const { data: updated, error } = await serviceRoleClient
        .from("refund_requests")
        .update({
          status: "processed",
          stripe_subscription_id: subId,
          stripe_refund_id: refundResult.refundId ?? null,
          admin_notes: notes,
          reviewed_by: user.id,
          reviewed_at: now,
        })
        .eq("id", requestId)
        .select()
        .single()

      if (error) throw error

      if (requestRow.user_email) {
        const amountLabel =
          refundResult.refundAmount === "full"
            ? "Full refund"
            : String(refundResult.refundAmount)
        const { subject, html } = buildRefundProcessedEmail(
          requestRow.user_email,
          refundResult.refundId ?? null,
          amountLabel
        )
        await sendRefundNotificationEmail(requestRow.user_email, subject, html)
      }

      return new Response(
        JSON.stringify({ success: true, request: updated, refund: refundResult }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      )
    }

    throw new Error("Invalid action. Use list, approve, or reject.")
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Request failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
