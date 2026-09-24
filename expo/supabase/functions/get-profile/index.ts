import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { decrypt, isPlaceholderProfile } from "../_shared/profile-crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const encryptionSecret = Deno.env.get('ENCRYPTION_SECRET')
    if (!encryptionSecret) {
      throw new Error('ENCRYPTION_SECRET not set in environment');
    }

    const { data: profile, error: profileError } = await serviceRoleClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    if (isPlaceholderProfile(profile)) {
      return new Response(JSON.stringify({ success: false, needsSetup: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const decryptedUsername = await decrypt(profile.encrypted_username, encryptionSecret);
    const decryptedEmail = await decrypt(profile.encrypted_email, encryptionSecret);

    return new Response(JSON.stringify({
      success: true,
      profile: {
        id: profile.id,
        username: decryptedUsername,
        email: decryptedEmail,
        onboarded: profile.onboarded,
        life_stage: profile.life_stage,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Get profile error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
