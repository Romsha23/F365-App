# Email Encryption — Implementation Guide

**Last Updated:** 2026-03-16
**Status:** Implemented (App-Level Encryption)

---

## Overview

Email addresses stored in the `users` table are encrypted at the application level using a key-stretched XOR cipher with SHA-256 keystream generation. This prevents a database breach from directly exposing user emails via SQL joins to health data.

## Threat Model

| Threat | Mitigated? | Notes |
|--------|-----------|-------|
| DB breach → SQL join email to health data | YES | Email is encrypted; attacker needs the encryption key |
| DB breach + app source decompilation | PARTIAL | Key is in EXPO_PUBLIC env var (visible in JS bundle). For full protection, move to server-side encryption on AWS |
| Man-in-the-middle | YES | Supabase uses TLS. All traffic is encrypted in transit |
| Insider DB access | YES | Cannot read emails without the key |

## How It Works

### Encryption Flow
1. Email is normalized (trim + lowercase)
2. A keystream is generated using SHA-256(key + counter) — repeated to match email length
3. Each byte of the email is XORed with the corresponding keystream byte
4. Result is hex-encoded with `enc:` prefix

### Decryption Flow
1. Check for `enc:` prefix (if absent, treat as plaintext for backward compatibility)
2. Decode hex to bytes
3. Regenerate same keystream using SHA-256(key + counter)
4. XOR to recover plaintext

### Hashing (for future lookups)
- `hashEmail()` produces a SHA-256 hash of the normalized email
- Useful for adding an `email_hash` column for lookups without decryption

## Files

| File | Purpose |
|------|---------|
| `utils/email-encryption.ts` | Core encrypt/decrypt/hash functions |
| `store/user-store.ts` | Encrypts before DB write, decrypts after DB read |
| `app/login.tsx` | Decrypts email when loading existing user from DB |

## Environment Variable

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_EMAIL_ENCRYPTION_KEY` | YES | The encryption key. Must be the same across all app instances. Minimum 32 characters recommended. |

**CRITICAL:** If you lose or change this key, all previously encrypted emails become unrecoverable.

## Backward Compatibility

The implementation handles plaintext emails gracefully:
- `decryptEmail()` checks for `enc:` prefix — if absent, returns the string as-is
- `isEncryptedEmail()` checks whether a value is encrypted
- Existing plaintext emails will work but won't be encrypted until the next profile update

## Migration Script (Encrypt Existing Plaintext Emails)

To encrypt existing plaintext emails in the database, you need a one-time server-side script. This CANNOT be done from the app because the encryption is async and per-user.

**Recommended approach:**
1. Create a backend tRPC route or standalone script
2. Fetch all users where `email` does NOT start with `enc:`
3. Encrypt each email using the same key
4. Update the row

```sql
-- To identify unencrypted emails:
SELECT id, email FROM users WHERE email IS NOT NULL AND email NOT LIKE 'enc:%';
```

## Redemption Codes Table (Future Work)

The `redemption_codes` table contains `created_for_email` and `redeemed_by_email` columns that are currently stored as plaintext. These should be encrypted in a future iteration using the same approach.

**Fields to encrypt:**
- `redemption_codes.created_for_email`
- `redemption_codes.redeemed_by_email`

## AWS Migration Path

When migrating to AWS:

1. **Replace EXPO_PUBLIC key with server-side encryption:**
   - Store the encryption key in AWS Secrets Manager (not in client bundle)
   - Create a Lambda function or API endpoint for encrypt/decrypt operations
   - The app calls the API to encrypt/decrypt — the key never leaves the server

2. **Upgrade to AES-256-GCM:**
   - Use AWS KMS to manage encryption keys
   - Use `@aws-sdk/client-kms` for envelope encryption
   - Store encrypted data as: `kms_key_id:iv:ciphertext:auth_tag`

3. **Add email_hash column:**
   - `ALTER TABLE users ADD COLUMN email_hash TEXT;`
   - `CREATE INDEX idx_users_email_hash ON users(email_hash);`
   - Populate with SHA-256 hashes for lookup capability

4. **Enable RDS encryption at rest** for defense-in-depth

## Testing

To verify encryption is working:
1. Sign up or log in with a real email
2. Check the `users` table in Supabase — the `email` column should show `enc:` followed by hex
3. In the app, the email should display correctly (decrypted in memory)
4. If `EXPO_PUBLIC_EMAIL_ENCRYPTION_KEY` is not set, emails fall back to plaintext storage with a console warning
