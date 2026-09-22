import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  decrypt,
  isPlaceholderProfile,
  setupEncryptedProfile,
} from "../_shared/profile-crypto.ts"

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError

    const encryptionSecret = Deno.env.get('ENCRYPTION_SECRET')
    if (!encryptionSecret) {
      throw new Error('ENCRYPTION_SECRET not set in environment');
    }

    let { data: profile, error: profileError } = await serviceRoleClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (!profile) {
      await setupEncryptedProfile(
        serviceRoleClient,
        authData.user.id,
        authData.user.email ?? email,
        encryptionSecret
      )

      const { data: newProfile, error: newProfileError } = await serviceRoleClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (newProfileError || !newProfile) {
        throw newProfileError ?? new Error('Profile not found after setup')
      }
      profile = newProfile
    } else if (isPlaceholderProfile(profile)) {
      await setupEncryptedProfile(
        serviceRoleClient,
        authData.user.id,
        authData.user.email ?? email,
        encryptionSecret
      )

      const { data: updatedProfile, error: updatedProfileError } = await serviceRoleClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (updatedProfileError || !updatedProfile) {
        throw updatedProfileError ?? new Error('Profile not found after setup')
      }
      profile = updatedProfile
    }

    const decryptedEmail = await decrypt(profile.encrypted_email, encryptionSecret);
    const decryptedUsername = await decrypt(profile.encrypted_username, encryptionSecret);

    return new Response(JSON.stringify({
      success: true,
      session: authData.session,
      profile: {
        id: profile.id,
        username: decryptedUsername,
        email: decryptedEmail,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Signin process error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
