import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Basic IP geolocation via ip-api.com
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const cleanIp = ip.split(',')[0].trim();

    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === 'localhost') {
      return new Response(JSON.stringify({ country: 'AU' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const response = await fetch(`http://ip-api.com/json/${cleanIp}`);
    const data = await response.json();

    return new Response(JSON.stringify({ country: data.countryCode || 'AU' }), {
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
