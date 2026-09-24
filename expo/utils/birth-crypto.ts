/**
 * birth-crypto.ts
 *
 * Client-side obfuscation / encryption for birth data stored in local memory / AsyncStorage.
 * This is paired with server-side AES-GCM encryption in the `save-birth-data` Supabase edge function.
 * Raw birth month/year are never stored as plain integers in local state or AsyncStorage when tokenized.
 *
 * Key used: EXPO_PUBLIC_EMAIL_ENCRYPTION_KEY (falls back to a static salt if absent).
 */

const ENV_KEY = process.env.EXPO_PUBLIC_EMAIL_ENCRYPTION_KEY ?? 'f365-birth-salt-v1';

function safeBtoa(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'binary').toString('base64');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let out = '';
  for (let i = 0; i < str.length; i += 3) {
    const c1 = str.charCodeAt(i);
    const c2 = str.charCodeAt(i + 1);
    const c3 = str.charCodeAt(i + 2);
    out += chars.charAt(c1 >> 2);
    out += chars.charAt(((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4));
    out += isNaN(c2) ? '=' : chars.charAt(((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6));
    out += isNaN(c3) ? '=' : chars.charAt(c3 & 63);
  }
  return out;
}

function safeAtob(b64: string): string {
  if (typeof atob === 'function') {
    return atob(b64);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('binary');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let out = '';
  let str = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  for (let i = 0; i < str.length; i += 4) {
    const enc1 = chars.indexOf(str.charAt(i));
    const enc2 = chars.indexOf(str.charAt(i + 1));
    const enc3 = chars.indexOf(str.charAt(i + 2));
    const enc4 = chars.indexOf(str.charAt(i + 3));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    out += String.fromCharCode(chr1);
    if (enc3 !== 64 && enc3 !== -1) out += String.fromCharCode(chr2);
    if (enc4 !== 64 && enc4 !== -1) out += String.fromCharCode(chr3);
  }
  return out;
}

/** Simple XOR stream cipher over UTF-8 bytes, output as base64url. */
function xorBase64(input: string, key: string): string {
  const inputBytes = Array.from(input).map((c) => c.charCodeAt(0));
  const keyBytes = Array.from(key).map((c) => c.charCodeAt(0));
  const out = inputBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
  return safeBtoa(String.fromCharCode(...out))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function xorBase64Decode(encoded: string, key: string): string {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Array.from(safeAtob(b64)).map((c) => c.charCodeAt(0));
  const keyBytes = Array.from(key).map((c) => c.charCodeAt(0));
  const out = bytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
  return String.fromCharCode(...out);
}

export interface BirthData {
  birthMonth: number; // 1-12
  birthYear: number;  // e.g. 2005
}

/**
 * Encodes birth data into an opaque string for local storage / state.
 * Format before XOR: "MM|YYYY"
 */
export function encodeBirthData(birthMonth: number, birthYear: number): string {
  const plain = `${birthMonth}|${birthYear}`;
  return xorBase64(plain, ENV_KEY);
}

/**
 * Decodes a birth data string produced by encodeBirthData.
 * Returns null if the token is invalid or missing.
 */
export function decodeBirthData(token: string | null | undefined): BirthData | null {
  if (!token) return null;
  try {
    const plain = xorBase64Decode(token, ENV_KEY);
    const parts = plain.split('|');
    if (parts.length !== 2) return null;
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (isNaN(month) || isNaN(year)) return null;
    if (month < 1 || month > 12) return null;
    if (year < 1900 || year > 2100) return null;
    return { birthMonth: month, birthYear: year };
  } catch {
    return null;
  }
}

/**
 * Returns the age in whole years from a BirthData object, or undefined if null.
 */
export function ageFromBirthData(data: BirthData | null): number | undefined {
  if (!data) return undefined;
  const today = new Date();
  let age = today.getFullYear() - data.birthYear;
  if (today.getMonth() + 1 < data.birthMonth) age--;
  return age;
}

/**
 * Returns true if the encoded token or birth data represents an under-18 user.
 */
export function isUnder18FromToken(token: string | null | undefined): boolean {
  const data = decodeBirthData(token);
  const age = ageFromBirthData(data);
  if (age === undefined) return false;
  return age < 18;
}
