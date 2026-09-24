import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

    // Verify Admin Authorization
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { table, limit = 50, offset = 0, orderColumn, orderAsc = false } = await req.json()

    // Only allow querying tables that exist in the final schema
    const allowedTables = [
      'profiles',
      'user_roles',
      'waitlist',
      'site_visits',
      'security_events',
      'pricing_plans',
      'country_pricing',
      'country_access',
      'country_feature_flags',
      'app_settings',
      'content_pages',
      'refund_requests',
      'subscriptions',
      'orders',
      'transactions',
      'redemption_codes',
    ];
    if (table !== 'admin_users' && !allowedTables.includes(table)) {
      return new Response(JSON.stringify({ error: `Table '${table}' is not queryable from this endpoint.` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (table === 'admin_users') {
      const { data: users, error: authError } = await serviceRoleClient.auth.admin.listUsers({
        page: Math.floor(offset / limit) + 1,
        perPage: limit,
      })
      if (authError) throw authError

      const profilesIds = (users?.users ?? []).map((u: { id: string }) => u.id)
      const { data: profiles } = await serviceRoleClient
        .from('profiles')
        .select('id, encrypted_username, created_at')
        .in('id', profilesIds.length ? profilesIds : ['00000000-0000-0000-0000-000000000000'])

      const profileMap = new Map<string, { encrypted_username: string; created_at: string }>()
      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id, p)
        }
      }

      const { data: subscriptions } = await serviceRoleClient
        .from('subscriptions')
        .select('user_id, status')
        .in('user_id', profilesIds.length ? profilesIds : ['00000000-0000-0000-0000-000000000000'])
        .in('status', ['active', 'trialing', 'past_due'])

      const activeSubs = new Set<string>()
      if (subscriptions) {
        for (const s of subscriptions) {
          activeSubs.add(s.user_id)
        }
      }

      const data = (users?.users ?? []).map((u: { id: string; email?: string; created_at: string }) => {
        const profile = profileMap.get(u.id)
        return {
          id: u.id,
          email: u.email ?? null,
          unique_id: Math.abs(u.id.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString().substring(0, 7).padEnd(7, '0'),
          subscription_active: activeSubs.has(u.id),
          created_at: profile?.created_at ?? u.created_at,
        }
      })

      return new Response(JSON.stringify({ data, count: users?.total ?? data.length, table }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    let query = serviceRoleClient.from(table).select('*', { count: 'exact' })
    if (orderColumn) {
      query = query.order(orderColumn, { ascending: orderAsc })
    }
    query = query.range(offset, offset + limit - 1)
    const { data, count, error } = await query

    if (error) throw error

    return new Response(JSON.stringify({ data: data || [], count: count || 0, table }), {
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
