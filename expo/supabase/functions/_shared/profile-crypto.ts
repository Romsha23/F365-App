import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { uniqueNamesGenerator, adjectives, animals } from "https://esm.sh/unique-names-generator@4.7.1"

export const PLACEHOLDER_EMAIL = 'default_encrypted_email'
export const PLACEHOLDER_USERNAME = 'default_encrypted_user'

export function isPlaceholderProfile(profile: {
  encrypted_email?: string | null
  encrypted_username?: string | null
}) {
  return (
    profile.encrypted_email === PLACEHOLDER_EMAIL ||
    profile.encrypted_username === PLACEHOLDER_USERNAME
  )
}

export async function encrypt(text: string, secret: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const secretBuffer = encoder.encode(secret)
  const keyHash = await crypto.subtle.digest("SHA-256", secretBuffer)

  const key = await crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)

  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(encryptedBase64: string, secret: string) {
  const encoder = new TextEncoder()
  const secretBuffer = encoder.encode(secret)
  const keyHash = await crypto.subtle.digest("SHA-256", secretBuffer)

  const key = await crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  )

  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
  return new TextDecoder().decode(decrypted)
}

export async function setupEncryptedProfile(
  supabaseClient: SupabaseClient,
  userId: string,
  email: string,
  encryptionSecret: string
) {
  const { data: existing, error: existingError } = await supabaseClient
    .from('profiles')
    .select('encrypted_email, encrypted_username')
    .eq('id', userId)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing && !isPlaceholderProfile(existing)) {
    return { skipped: true as const, username: null }
  }

  const baseUsername = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: '_',
    style: 'lowercase',
  })
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const username = `${baseUsername}_${randomSuffix}`

  const encryptedEmail = await encrypt(email, encryptionSecret)
  const encryptedUsername = await encrypt(username, encryptionSecret)

  const { error: upsertError } = await supabaseClient
    .from('profiles')
    .upsert(
      {
        id: userId,
        encrypted_username: encryptedUsername,
        encrypted_email: encryptedEmail,
      },
      { onConflict: 'id' }
    )

  if (upsertError) throw upsertError

  return { skipped: false as const, username }
}
