import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const WEBSITE_TABLES = [
  "profiles",
  "user_roles",
  "waitlist",
  "site_visits",
  "security_events",
  "pricing_plans",
  "country_pricing",
  "country_access",
  "country_feature_flags",
  "app_settings",
  "content_pages",
  "refund_requests",
  "subscriptions",
  "orders",
  "transactions",
]

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

    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (roleError || roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const appStats: Record<string, number> = {}
    const { data: authList } = await serviceRoleClient.auth.admin.listUsers({ page: 1, perPage: 1 })
    appStats["admin_users"] = authList?.total ?? 0

    const websiteStats: Record<string, number> = {}

    for (const table of WEBSITE_TABLES) {
      const { count } = await serviceRoleClient
        .from(table)
        .select("*", { count: "exact", head: true })
      websiteStats[table] = count ?? 0
    }

    const { count: activeSubscriptions } = await serviceRoleClient
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trialing"])

    const { count: pendingRefundRequests } = await serviceRoleClient
      .from("refund_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    const billingStats = {
      activeSubscriptions: activeSubscriptions ?? 0,
      totalOrders: websiteStats.orders ?? 0,
      totalTransactions: websiteStats.transactions ?? 0,
      pendingRefundRequests: pendingRefundRequests ?? 0,
    }

    return new Response(JSON.stringify({ billingStats, websiteStats, appStats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Stats failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
