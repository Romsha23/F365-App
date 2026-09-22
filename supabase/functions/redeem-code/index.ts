import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { assertCountryFeatureAllowed } from "../_shared/countryFeatures.ts"
import { getStripe } from "../_shared/stripeClient.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { code, detectedCountry } = await req.json()
    if (!code || typeof code !== 'string') {
      throw new Error('Redemption code is required')
    }

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    await assertCountryFeatureAllowed(serviceRoleClient, detectedCountry, 'code_redemption')

    const trimmedCode = code.trim()
    const upperCode = trimmedCode.toUpperCase()

    // 1. Try local redemption_codes table first
    const { data: localCode } = await serviceRoleClient
      .from('redemption_codes')
      .select('*')
      .ilike('code', trimmedCode)
      .maybeSingle()

    if (localCode) {
      if (localCode.status !== 'available') {
        throw new Error('This code has already been used.')
      }

      if (localCode.expires_at && new Date(localCode.expires_at) < new Date()) {
        throw new Error('This code has expired.')
      }

      const userEmail = user.email ?? ''
      const now = new Date().toISOString()

      // Mark code as redeemed
      const { error: updateError } = await serviceRoleClient
        .from('redemption_codes')
        .update({
          status: 'redeemed',
          redeemed_by_email: userEmail,
          redeemed_at: now,
        })
        .eq('id', localCode.id)

      if (updateError) {
        throw new Error('Failed to redeem code. Please try again.')
      }

      // Map product_type to plan and billing_interval
      const planMap: Record<string, { plan: string; interval: string }> = {
        supermoon: { plan: 'yearly', interval: 'year' },
        full_moon: { plan: 'monthly', interval: 'month' },
      }
      const planMeta = planMap[localCode.product_type] ?? { plan: 'monthly', interval: 'month' }

      // Cancel any existing active subscription for this user
      await serviceRoleClient
        .from('subscriptions')
        .update({ status: 'cancelled', end_date: now, updated_at: now })
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])

      // Create a new free subscription
      const { error: subError } = await serviceRoleClient
        .from('subscriptions')
        .insert({
          user_id: user.id,
          user_email: userEmail,
          plan: planMeta.plan,
          status: 'active',
          start_date: now,
          end_date: null,
          amount: 0,
          currency: 'AUD',
          billing_interval: planMeta.interval,
        })

      if (subError) {
        throw new Error('Failed to activate subscription.')
      }

      // Record order for audit trail
      try {
        await serviceRoleClient.from('orders').insert({
          user_id: user.id,
          user_email: userEmail,
          type: `free_redemption_${planMeta.plan}`,
          amount: 0,
          currency: 'AUD',
          status: 'completed',
        })
      } catch {
        // non-critical — subscription is already active
      }

      return new Response(JSON.stringify({
        success: true,
        product_name: localCode.product_name || upperCode,
        discount: '',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Fall back to Stripe coupon
    const stripe = getStripe()

    let coupon: Awaited<ReturnType<typeof stripe.coupons.retrieve>>
    try {
      coupon = await stripe.coupons.retrieve(upperCode)
    } catch {
      throw new Error('Invalid or expired code')
    }

    if (coupon.deleted) {
      throw new Error('This code has been removed')
    }

    if (coupon.valid === false) {
      throw new Error('This code is no longer valid')
    }

    if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
      throw new Error('This code has expired')
    }

    if (coupon.max_redemptions != null && coupon.times_redeemed >= coupon.max_redemptions) {
      throw new Error('This code has reached its maximum uses')
    }

    // Check user hasn't already redeemed this Stripe coupon
    const { data: existing } = await serviceRoleClient
      .from('pending_coupons')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('coupon_id', upperCode)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('You already have a pending discount. Use it at checkout first.')
      }
      throw new Error('You have already used this code.')
    }

    const { error: insertError } = await serviceRoleClient
      .from('pending_coupons')
      .insert({ user_id: user.id, coupon_id: upperCode })

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('You have already used this code.')
      }
      throw new Error('Failed to save coupon. Please try again.')
    }

    let discount = ''
    if (coupon.percent_off != null) {
      discount = `${coupon.percent_off}% off`
    } else if (coupon.amount_off != null) {
      const currency = (coupon.currency || 'USD').toUpperCase()
      const amount = (coupon.amount_off / 100).toFixed(2)
      discount = `${currency} $${amount} off`
    }

    return new Response(JSON.stringify({
      success: true,
      product_name: coupon.name || upperCode,
      discount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
