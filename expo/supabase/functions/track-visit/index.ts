import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseUserAgent(ua: string): { browser: string; os: string; device_type: string } {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device_type = 'desktop'

  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge'
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera'

  if (ua.includes('Windows NT')) os = 'Windows'
  else if (ua.includes('Mac OS X') && !ua.includes('iPhone') && !ua.includes('iPad')) os = 'macOS'
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS'

  if (ua.includes('iPad') || ua.includes('Tablet') || ua.includes('PlayBook') || ua.includes('Silk')) device_type = 'tablet'
  else if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPod')) device_type = 'mobile'

  return { browser, os, device_type }
}

async function geoLocate(ip: string): Promise<{ country: string; city: string }> {
  const cleanIp = ip.split(',')[0].trim()
  if (!cleanIp || cleanIp === 'unknown' || cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
    return { country: 'AU', city: '' }
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=countryCode,city`)
    const data = await res.json()
    return { country: data.countryCode || '', city: data.city || '' }
  } catch {
    return { country: '', city: '' }
  }
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

    const payload = await req.json()
    const userAgent = req.headers.get('user-agent') || ''
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(ip))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedIp = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { browser, os, device_type } = parseUserAgent(userAgent)
    const { country, city } = await geoLocate(ip)

    const { error } = await supabaseClient.from('site_visits').insert({
      ...payload,
      user_agent: userAgent,
      ip_hash: hashedIp,
      browser,
      os,
      device_type,
      country,
      city,
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
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
