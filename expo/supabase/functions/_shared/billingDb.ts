import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export interface SubscriptionRow {
  id?: string
  user_id: string
  user_email: string
  plan: string
  status: string
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
  start_date?: string | null
  end_date?: string | null
  queued_plan?: string | null
  queued_start_date?: string | null
  cancel_at_period_end?: boolean
  billing_interval?: string | null
  amount?: number
  currency?: string
}

/** Local Supabase project (service role) for subscriptions, orders, and transactions. */
export function getBillingDb(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for billing database")
  }
  return createClient(url, key)
}

export async function getActiveSubscriptionForUser(
  db: SupabaseClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[billingDb] getActiveSubscriptionForUser:", error.message)
    return null
  }
  return data as SubscriptionRow | null
}

export async function upsertSubscription(
  db: SupabaseClient,
  row: SubscriptionRow
): Promise<void> {
  const payload = { ...row, updated_at: new Date().toISOString() }

  if (row.stripe_subscription_id) {
    const { error } = await db
      .from("subscriptions")
      .upsert(payload, { onConflict: "stripe_subscription_id" })
    if (error) {
      throw new Error(`subscriptions upsert failed: ${error.message}`)
    }
    return
  }

  const { data: byUser } = await db
    .from("subscriptions")
    .select("id")
    .eq("user_id", row.user_id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (byUser?.id) {
    const { error } = await db.from("subscriptions").update(payload).eq("id", byUser.id)
    if (error) {
      throw new Error(`subscriptions update failed: ${error.message}`)
    }
    return
  }

  const { error } = await db.from("subscriptions").insert(payload)
  if (error) {
    throw new Error(`subscriptions insert failed: ${error.message} (${error.code ?? "unknown"})`)
  }
}

/** No-op unless a `users` table exists in this project (legacy mobile app DB). */
export async function setUserSubscriptionActive(
  db: SupabaseClient,
  userId: string,
  active: boolean
): Promise<void> {
  const { error } = await db
    .from("users")
    .update({ subscription_active: active })
    .eq("auth_id", userId)

  if (error) {
    console.warn("[billingDb] setUserSubscriptionActive:", error.message)
  }
}

export async function insertOrder(
  db: SupabaseClient,
  order: {
    user_id: string
    user_email?: string
    type: string
    amount: number
    currency?: string
    status?: string
    stripe_payment_id?: string
  }
): Promise<void> {
  const { error } = await db.from("orders").insert(order)
  if (error) {
    throw new Error(`orders insert failed: ${error.message}`)
  }
}

export async function insertTransaction(
  db: SupabaseClient,
  tx: {
    user_id: string
    user_email?: string
    type: string
    amount: number
    currency?: string
    status?: string
    stripe_id?: string
  }
): Promise<void> {
  const { error } = await db.from("transactions").insert(tx)
  if (error) {
    throw new Error(`transactions insert failed: ${error.message}`)
  }
}
