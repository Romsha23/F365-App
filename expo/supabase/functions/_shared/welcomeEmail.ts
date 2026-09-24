const BRAND_EMAIL = "hello@f365.app"
const SUPPORT_EMAIL = "support@f365.app"
const APP_NAME = "f365"
const WEBSITE_URL = Deno.env.get("EXPO_PUBLIC_WEBSITE_URL") ?? "https://f365.app"
// Strip trailing path so we get just the origin (e.g. https://staging.f365.app)
const WEBSITE_ORIGIN = WEBSITE_URL.replace(/\/[^/]*$/, "")

function wrapEmail(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f0ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(139,92,246,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);padding:36px 40px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 12px;display:inline-block;line-height:64px;">
                <span style="font-size:32px;font-weight:bold;color:#ffffff;">f</span>
              </div>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${APP_NAME}</h1>
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Your Personal Cycle Companion</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf8ff;padding:24px 40px;border-top:1px solid #ede9fe;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">
                You're receiving this because you created an account with ${APP_NAME}.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Questions? Email us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#8b5cf6;text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#c4b5fd;text-align:center;">
                © ${new Date().getFullYear()} ${APP_NAME}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Builds the welcome email HTML sent to new users on signup.
 *
 * @param email     The user's email address (used as their login credential)
 * @param username  The generated privacy username (e.g. happy_panda_3821)
 */
export function buildWelcomeEmail(email: string, username: string): string {
  const websiteLoginUrl = `${WEBSITE_ORIGIN}/login`

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1f1f2e;">
      Welcome to ${APP_NAME}! 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Your account has been created. Here's everything you need to get started.
    </p>

    <!-- Credentials card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#f5f0ff;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #ede9fe;">
      <tr>
        <td>
          <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#8b5cf6;text-transform:uppercase;letter-spacing:0.5px;">
            Your Login Credentials
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #ede9fe;">
                <span style="font-size:13px;color:#9ca3af;display:block;">Email</span>
                <span style="font-size:15px;font-weight:600;color:#1f1f2e;">${email}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0 0;">
                <span style="font-size:13px;color:#9ca3af;display:block;">Password</span>
                <span style="font-size:15px;font-weight:600;color:#1f1f2e;">The password you set during signup</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Privacy username card -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#fff7ed;border-radius:12px;padding:20px 24px;margin-bottom:28px;border:1px solid #fed7aa;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#ea580c;text-transform:uppercase;letter-spacing:0.5px;">
            🔒 Your Privacy Username
          </p>
          <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f1f2e;letter-spacing:1px;">
            ${username}
          </p>
          <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.5;">
            We use a unique username instead of your real name to protect your privacy.
            Your health data is never linked to your identity.
          </p>
        </td>
      </tr>
    </table>

    <!-- Website login info -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:32px;border:1px solid #bbf7d0;">
      <tr>
        <td>
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;">
            💻 Access on the Web
          </p>
          <p style="margin:0 0 12px;font-size:14px;color:#15803d;line-height:1.6;">
            You can also sign in to ${APP_NAME} from your browser using the same email and password.
          </p>
          <a href="${websiteLoginUrl}"
            style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;">
            Sign in on the web →
          </a>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="${WEBSITE_ORIGIN}"
        style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 32px;border-radius:12px;margin-bottom:16px;">
        Open ${APP_NAME}
      </a>
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Or download the app on your phone to get started.
      </p>
    </div>
  `

  return wrapEmail(body)
}

/**
 * Sends the welcome email via the send-notification-email edge function.
 */
export async function sendWelcomeEmail(
  email: string,
  username: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !serviceKey) {
    console.warn("[welcomeEmail] Missing SUPABASE_URL or service key — skipping send")
    return
  }

  const html = buildWelcomeEmail(email, username)
  const subject = `Welcome to ${APP_NAME}! Your account is ready 🎉`

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: email, subject, html }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("[welcomeEmail] Failed to send welcome email:", text)
    } else {
      console.log("[welcomeEmail] Welcome email sent to:", email)
    }
  } catch (err) {
    // Non-fatal — signup still succeeds even if email fails
    console.error("[welcomeEmail] Unexpected error:", err)
  }
}
