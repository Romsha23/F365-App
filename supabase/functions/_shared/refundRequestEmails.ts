import { getSiteUrl } from "./stripeClient.ts"

const BRAND_EMAIL = "support@flow365.app"

function wrapEmail(body: string): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1625 0%, #0f0d12 100%); color: #f5f2f0; padding: 40px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #d4a574 0%, #8b5cf6 100%); border-radius: 50%; margin: 0 auto 16px; line-height: 60px;">
          <span style="font-size: 28px; font-weight: bold; color: #0f0d12;">f</span>
        </div>
      </div>
      ${body}
      <p style="color: #6b6b6b; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
        Flow 365 · <a href="mailto:${BRAND_EMAIL}" style="color: #d4a574;">${BRAND_EMAIL}</a>
      </p>
    </div>
  `
}

export async function sendRefundNotificationEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const baseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!baseUrl || !serviceKey) {
    console.warn("[refundRequestEmails] Missing SUPABASE_URL or service key; skip send")
    return
  }

  try {
    const res = await fetch(`${baseUrl}/functions/v1/send-notification-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, html }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error("[refundRequestEmails] send failed:", text)
    }
  } catch (err) {
    console.error("[refundRequestEmails]", err)
  }
}

export function buildRefundReceivedEmail(userEmail: string, requestId: string): {
  subject: string
  html: string
} {
  const siteUrl = getSiteUrl()
  return {
    subject: "We received your refund request",
    html: wrapEmail(`
      <h1 style="margin: 0 0 16px; font-size: 24px; text-align: center;">Refund request received</h1>
      <p style="color: #a8a29e; line-height: 1.6;">Hi,</p>
      <p style="color: #a8a29e; line-height: 1.6;">We received your refund request for <strong style="color: #f5f2f0;">${userEmail}</strong>. Our team will review it and email you when there is an update.</p>
      <p style="color: #a8a29e; line-height: 1.6; font-size: 14px;">Reference: <span style="font-family: monospace; color: #f5f2f0;">${requestId}</span></p>
      <p style="text-align: center; margin-top: 28px;">
        <a href="${siteUrl}/account/subscription?tab=refund" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #8b5cf6 100%); color: #0f0d12; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 600;">View request status</a>
      </p>
    `),
  }
}

export function buildRefundProcessedEmail(
  userEmail: string,
  refundId: string | null,
  amountLabel: string
): { subject: string; html: string } {
  const siteUrl = getSiteUrl()
  return {
    subject: "Your refund has been processed",
    html: wrapEmail(`
      <h1 style="margin: 0 0 16px; font-size: 24px; text-align: center;">Refund processed</h1>
      <p style="color: #a8a29e; line-height: 1.6;">Hi,</p>
      <p style="color: #a8a29e; line-height: 1.6;">We've approved and processed your refund for <strong style="color: #f5f2f0;">${userEmail}</strong>. Funds should appear within 5–10 business days.</p>
      <div style="background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px; color: #a8a29e; font-size: 14px;">Amount: <strong style="color: #2dd4bf;">${amountLabel}</strong></p>
        ${refundId ? `<p style="margin: 0; color: #a8a29e; font-size: 14px;">Stripe refund: <span style="font-family: monospace; color: #f5f2f0;">${refundId}</span></p>` : ""}
      </div>
      <p style="text-align: center; margin-top: 28px;">
        <a href="${siteUrl}/account/subscription?tab=refund" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #8b5cf6 100%); color: #0f0d12; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 600;">View billing</a>
      </p>
    `),
  }
}

export function buildRefundRejectedEmail(
  userEmail: string,
  adminNotes: string | null
): { subject: string; html: string } {
  const siteUrl = getSiteUrl()
  const noteBlock = adminNotes
    ? `<p style="color: #a8a29e; line-height: 1.6; margin-top: 16px;"><strong style="color: #f5f2f0;">Note from our team:</strong> ${adminNotes}</p>`
    : ""
  return {
    subject: "Update on your refund request",
    html: wrapEmail(`
      <h1 style="margin: 0 0 16px; font-size: 24px; text-align: center;">Refund request update</h1>
      <p style="color: #a8a29e; line-height: 1.6;">Hi,</p>
      <p style="color: #a8a29e; line-height: 1.6;">We reviewed your refund request for <strong style="color: #f5f2f0;">${userEmail}</strong> and were unable to approve it at this time.</p>
      ${noteBlock}
      <p style="color: #a8a29e; line-height: 1.6; margin-top: 16px;">Questions? Reply to this email or contact <a href="mailto:${BRAND_EMAIL}" style="color: #d4a574;">${BRAND_EMAIL}</a>.</p>
      <p style="text-align: center; margin-top: 28px;">
        <a href="${siteUrl}/refund-policy" style="color: #d4a574;">Read refund policy</a>
      </p>
    `),
  }
}
