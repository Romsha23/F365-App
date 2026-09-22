import * as Crypto from 'expo-crypto';

const ENCRYPTION_PREFIX = 'enc:';

function getEncryptionKey(): string {
  return process.env.EXPO_PUBLIC_EMAIL_ENCRYPTION_KEY || '';
}

async function generateKeystream(key: string, length: number): Promise<number[]> {
  const keystream: number[] = [];
  let counter = 0;

  while (keystream.length < length) {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + ':' + counter.toString()
    );
    for (let i = 0; i < hash.length; i += 2) {
      keystream.push(parseInt(hash.substring(i, i + 2), 16));
    }
    counter++;
  }

  return keystream.slice(0, length);
}

export async function encryptEmail(email: string): Promise<string> {
  return encryptText(email, true);
}

export async function encryptText(text: string, normalize = false): Promise<string> {
  const key = getEncryptionKey();
  if (!text) return text;
  if (!key) {
    console.warn('[Encryption] No encryption key configured, storing as-is');
    return text;
  }
  if (text.startsWith(ENCRYPTION_PREFIX)) {
    return text;
  }

  try {
    const input = normalize ? text.trim().toLowerCase() : text;
    const keystream = await generateKeystream(key, input.length);

    let encrypted = '';
    for (let i = 0; i < input.length; i++) {
      const byte = input.charCodeAt(i) ^ keystream[i];
      encrypted += byte.toString(16).padStart(2, '0');
    }

    return ENCRYPTION_PREFIX + encrypted;
  } catch (error) {
    console.error('[Encryption] Encryption failed:', error);
    return text;
  }
}

export async function decryptEmail(encrypted: string): Promise<string> {
  return decryptText(encrypted);
}

export async function decryptText(encrypted: string): Promise<string> {
  const key = getEncryptionKey();
  if (!encrypted) return encrypted;
  if (!key) {
    console.warn('[Encryption] No encryption key configured, returning as-is');
    return encrypted;
  }
  if (!encrypted.startsWith(ENCRYPTION_PREFIX)) {
    return encrypted;
  }

  try {
    const hex = encrypted.substring(ENCRYPTION_PREFIX.length);
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }

    const keystream = await generateKeystream(key, bytes.length);

    let decrypted = '';
    for (let i = 0; i < bytes.length; i++) {
      decrypted += String.fromCharCode(bytes[i] ^ keystream[i]);
    }

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    return encrypted;
  }
}

export async function hashEmail(email: string): Promise<string> {
  if (!email) return '';
  const normalized = email.trim().toLowerCase();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized
  );
  return hash;
}

export function isEncryptedEmail(value: string): boolean {
  return isEncrypted(value);
}

export function isEncrypted(value: string): boolean {
  return value?.startsWith(ENCRYPTION_PREFIX) ?? false;
}
