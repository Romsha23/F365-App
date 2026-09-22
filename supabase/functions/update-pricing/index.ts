import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getStripe(): Stripe {
  const key = Deno.env.get("STRIPE_SECRET_KEY") ?? ""
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY")
  return new Stripe(key, { apiVersion: "2023-10-16" as const })
}

async function resolveStripeProductId(sb: SupabaseClient, stripe: Stripe): Promise<string | null> {
  const { data: plan } = await sb
    .from("pricing_plans")
    .select("stripe_product_id")
    .not("stripe_product_id", "is", null)
    .limit(1)
    .maybeSingle()
  if (plan?.stripe_product_id) return plan.stripe_product_id

  const envPriceId = Deno.env.get("STRIPE_PRICE_MONTHLY")
  if (envPriceId) {
    try {
      const price = await stripe.prices.retrieve(envPriceId)
      if (price.product) return price.product as string
    } catch { /* ignore */ }
  }

  try {
    const product = await stripe.products.create({
      name: "Flow365 Plus",
      metadata: { source: "update-pricing" },
    })
    return product.id
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error("Unauthorized")

    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (roleError || roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const payload = await req.json()
    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    if (payload.planId != null && payload.amount != null) {
      const { error } = await sb.from("pricing_plans").update({ price: payload.amount }).eq("plan_key", payload.planId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
    }

    if (!payload.action) throw new Error("Missing action or planId/amount")

    const stripe = getStripe()

    switch (payload.action) {
      case "list": {
        const { data, error } = await sb.from("pricing_plans").select("*").order("sort_order", { ascending: true })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      case "list_stripe_prices": {
        const { plan_id } = payload
        const { data: plan, error: planError } = await sb.from("pricing_plans").select("stripe_product_id, billing_interval").eq("id", plan_id).single()
        if (planError || !plan?.stripe_product_id) throw new Error("Plan has no Stripe product")

        const prices = await stripe.prices.list({
          product: plan.stripe_product_id,
          limit: 100,
          recurring: { interval: plan.billing_interval },
        })

        return new Response(JSON.stringify({ success: true, data: prices.data }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      case "delete_stripe_price": {
        const { stripe_price_id } = payload
        const price = await stripe.prices.retrieve(stripe_price_id)
        if (price.product) {
          const prod = await stripe.products.retrieve(price.product as string)
          if (prod.default_price === stripe_price_id) {
            await stripe.products.update(price.product as string, { default_price: null })
          }
        }
        await stripe.prices.update(stripe_price_id, { active: false })
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      case "delete_plan_price": {
        const { plan_id } = payload
        const { data: plan, error: planError } = await sb.from("pricing_plans").select("*").eq("id", plan_id).single()
        if (planError) throw new Error(`Plan not found: ${planError.message}`)

        if (plan.stripe_price_id) {
          let productId = plan.stripe_product_id
          if (!productId) {
            const price = await stripe.prices.retrieve(plan.stripe_price_id)
            productId = price.product as string
          }
          if (productId) {
            const prod = await stripe.products.retrieve(productId)
            if (prod.default_price === plan.stripe_price_id) {
              await stripe.products.update(productId, { default_price: null })
            }
          }
          await stripe.prices.update(plan.stripe_price_id, { active: false })
        }

        await sb.from("pricing_plans").update({ stripe_price_id: null }).eq("id", plan_id)

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      case "add_price": {
        const { plan_id, amount, interval, currency } = payload
        const { data: plan, error: planError } = await sb.from("pricing_plans").select("*").eq("id", plan_id).single()
        if (planError) throw new Error(`Plan not found: ${planError.message}`)

        let productId = plan.stripe_product_id
        if (!productId && plan.stripe_price_id) {
          const existingPrice = await stripe.prices.retrieve(plan.stripe_price_id)
          productId = existingPrice.product as string
        }
        if (!productId) {
          throw new Error("Plan has no Stripe product. Set stripe_product_id in the DB or add a Stripe price first.")
        }

        const newPrice = await stripe.prices.create({
          unit_amount: Math.round(parseFloat(amount) * 100),
          currency: (currency || "aud").toLowerCase(),
          recurring: { interval },
          product: productId,
          metadata: { plan_key: plan.plan_key },
        })

        const { error: upErr } = await sb.from("pricing_plans").update({
          stripe_product_id: productId,
          stripe_price_id: newPrice.id,
          price: parseFloat(amount),
          billing_interval: interval,
          currency: currency.toUpperCase(),
        }).eq("id", plan_id)
        if (upErr) throw upErr

        return new Response(JSON.stringify({ success: true, data: { stripe_price_id: newPrice.id } }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      case "update_plan": {
        const { plan_id, updates } = payload
        const { error } = await sb.from("pricing_plans").update(updates).eq("id", plan_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      case "save_country_pricing": {
        const { country_id, country_code, country_name, monthly_price, yearly_price, currency, is_free } = payload

        const { data: existing } = country_id
          ? await sb.from("country_pricing").select("*").eq("id", country_id).single()
          : { data: null }

        const productId = await resolveStripeProductId(sb, stripe)

        let monthlyStripeId = existing?.monthly_stripe_price_id ?? null
        let yearlyStripeId = existing?.yearly_stripe_price_id ?? null

        if (!is_free && productId) {
          if (existing?.monthly_stripe_price_id) {
            try { await stripe.prices.update(existing.monthly_stripe_price_id, { active: false }) } catch {}
          }
          if (existing?.yearly_stripe_price_id) {
            try { await stripe.prices.update(existing.yearly_stripe_price_id, { active: false }) } catch {}
          }

          const msPrice = await stripe.prices.create({
            unit_amount: Math.round(parseFloat(monthly_price) * 100),
            currency: (currency || "aud").toLowerCase(),
            recurring: { interval: "month" },
            product: productId,
            metadata: { country_code, price_type: "monthly" },
          })
          const ysPrice = await stripe.prices.create({
            unit_amount: Math.round(parseFloat(yearly_price) * 100),
            currency: (currency || "aud").toLowerCase(),
            recurring: { interval: "year" },
            product: productId,
            metadata: { country_code, price_type: "yearly" },
          })
          monthlyStripeId = msPrice.id
          yearlyStripeId = ysPrice.id
        } else {
          if (existing?.monthly_stripe_price_id) {
            try { await stripe.prices.update(existing.monthly_stripe_price_id, { active: false }) } catch {}
          }
          if (existing?.yearly_stripe_price_id) {
            try { await stripe.prices.update(existing.yearly_stripe_price_id, { active: false }) } catch {}
          }
          monthlyStripeId = null
          yearlyStripeId = null
        }

        const row = {
          country_code: country_code.toUpperCase().trim(),
          country_name: country_name.trim(),
          monthly_price: parseFloat(monthly_price) || 0,
          yearly_price: parseFloat(yearly_price) || 0,
          currency: currency.toUpperCase().trim(),
          is_free: !!is_free,
          monthly_stripe_price_id: monthlyStripeId,
          yearly_stripe_price_id: yearlyStripeId,
        }

        if (country_id) {
          const { error } = await sb.from("country_pricing").update(row).eq("id", country_id)
          if (error) throw error
        } else {
          const { error } = await sb.from("country_pricing").insert(row)
          if (error) throw error
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      case "delete_country_pricing": {
        const { country_id } = payload
        const { data: entry } = await sb.from("country_pricing").select("*").eq("id", country_id).single()
        if (entry?.monthly_stripe_price_id) {
          try { await stripe.prices.update(entry.monthly_stripe_price_id, { active: false }) } catch {}
        }
        if (entry?.yearly_stripe_price_id) {
          try { await stripe.prices.update(entry.yearly_stripe_price_id, { active: false }) } catch {}
        }
        const { error } = await sb.from("country_pricing").delete().eq("id", country_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
      }

      default:
        return new Response(JSON.stringify({ success: true, message: `Action ${payload.action} completed` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})
