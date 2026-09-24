import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Signs an AWS SES request using Signature Version 4
async function signRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
): Promise<Record<string, string>> {
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)

  const parsedUrl = new URL(url)
  const canonicalUri = parsedUrl.pathname
  const canonicalQueryString = ''

  const headersToSign: Record<string, string> = {
    ...headers,
    'x-amz-date': amzDate,
    'host': parsedUrl.host,
  }

  const sortedHeaderKeys = Object.keys(headersToSign).sort()
  const canonicalHeaders = sortedHeaderKeys.map(k => `${k.toLowerCase()}:${headersToSign[k]}\n`).join('')
  const signedHeaders = sortedHeaderKeys.map(k => k.toLowerCase()).join(';')

  const encoder = new TextEncoder()
  const bodyHash = await crypto.subtle.digest('SHA-256', encoder.encode(body))
  const bodyHashHex = Array.from(new Uint8Array(bodyHash)).map(b => b.toString(16).padStart(2, '0')).join('')

  const canonicalRequest = [method, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, bodyHashHex].join('\n')
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash)).map(b => b.toString(16).padStart(2, '0')).join('')

  const credentialScope = `${dateStamp}/${region}/ses/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`

  async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  }

  const kDate = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp)
  const kRegion = await hmac(kDate, region)
  const kService = await hmac(kRegion, 'ses')
  const kSigning = await hmac(kService, 'aws4_request')
  const signature = Array.from(new Uint8Array(await hmac(kSigning, stringToSign))).map(b => b.toString(16).padStart(2, '0')).join('')

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    ...headersToSign,
    'Authorization': authorizationHeader,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json()

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const accessKeyId = Deno.env.get('AWS_SES_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('AWS_SES_SECRET_ACCESS_KEY')
    const region = Deno.env.get('AWS_SES_REGION') ?? 'ap-southeast-2'
    const fromEmail = Deno.env.get('AWS_SES_FROM_EMAIL') ?? 'hello@f365.app'

    if (!accessKeyId || !secretAccessKey) {
      console.error('[send-notification-email] AWS SES credentials not set')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Build SES SendEmail request body (query string format)
    const params = new URLSearchParams({
      'Action': 'SendEmail',
      'Source': fromEmail,
      'Destination.ToAddresses.member.1': to,
      'Message.Subject.Data': subject,
      'Message.Subject.Charset': 'UTF-8',
      'Message.Body.Html.Data': html,
      'Message.Body.Html.Charset': 'UTF-8',
    })

    if (text) {
      params.set('Message.Body.Text.Data', text)
      params.set('Message.Body.Text.Charset', 'UTF-8')
    }

    const body = params.toString()
    const url = `https://email.${region}.amazonaws.com/`

    const headers = await signRequest(
      'POST',
      url,
      { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      region,
      accessKeyId,
      secretAccessKey,
    )

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error('[send-notification-email] SES error:', responseText)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: responseText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log('[send-notification-email] Email sent successfully to:', to)
    return new Response(JSON.stringify({ success: true, message: 'Email sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[send-notification-email] Unexpected error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
