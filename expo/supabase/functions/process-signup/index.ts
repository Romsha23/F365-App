import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { setupEncryptedProfile } from "../_shared/profile-crypto.ts"
import { sendWelcomeEmail } from "../_shared/welcomeEmail.ts"

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, email } = await req.json()

    const encryptionSecret = Deno.env.get('ENCRYPTION_SECRET')
    if (!encryptionSecret) {
      throw new Error('ENCRYPTION_SECRET not set in environment')
    }

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing userId or email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const result = await setupEncryptedProfile(supabaseClient, userId, email, encryptionSecret)

    // Send welcome email only for brand-new users (skipped=false means profile
    // was just created for the first time, not a re-login or duplicate call).
    if (!result.skipped && result.username && email) {
      console.log('[process-signup] New user — sending welcome email to:', email)
      // Non-blocking — don't await so signup response is fast
      sendWelcomeEmail(email, result.username).catch((err) => {
        console.error('[process-signup] Welcome email error (non-fatal):', err)
      })
    } else {
      console.log('[process-signup] Existing user — skipping welcome email')
    }

    return new Response(JSON.stringify({
      success: true,
      skipped: result.skipped,
      username: result.username,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Signup process error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
