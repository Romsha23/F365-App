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

    const { table, operation, id, data: mutationData, onConflict, idColumn = "id" } = await req.json()

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
    if (!allowedTables.includes(table)) {
      return new Response(JSON.stringify({ error: `Table '${table}' is not mutable from this endpoint.` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let query = serviceRoleClient.from(table)
    let result;

    if (operation === 'insert') {
      result = await query.insert(mutationData).select().single()
    } else if (operation === 'update' && id) {
      result = await query.update(mutationData).eq(idColumn, id).select().single()
    } else if (operation === 'delete' && id) {
      result = await query.delete().eq(idColumn, id).select().single()
    } else if (operation === 'upsert') {
      result = await query.upsert(mutationData, { onConflict })
    } else {
      throw new Error('Invalid operation or missing id')
    }

    if (result.error) throw result.error

    return new Response(JSON.stringify({ success: true, data: result.data || mutationData }), {
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
