import { Platform, NativeModules } from 'react-native';
import { supabase } from '../lib/supabase';

interface SupabaseLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
  name?: string;
}

export interface CountryAccessResult {
  isBlocked: boolean;
  countryCode: string | null;
  reason: string | null;
}

function formatCountryAccessError(error: unknown): string {
  if (!error) {
    return 'Unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === 'object') {
    const supabaseError = error as SupabaseLikeError;
    const parts: string[] = [];

    if (supabaseError.code) {
      parts.push(`code=${supabaseError.code}`);
    }
    if (supabaseError.message) {
      parts.push(`message=${supabaseError.message}`);
    }
    if (supabaseError.details) {
      parts.push(`details=${supabaseError.details}`);
    }
    if (supabaseError.hint) {
      parts.push(`hint=${supabaseError.hint}`);
    }

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unserializable error object';
    }
  }

  return String(error);
}

export function getDeviceCountryCode(): string | null {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      const locale = settings?.AppleLocale || settings?.AppleLanguages?.[0];
      if (locale) {
        const parts = locale.replace('-', '_').split('_');
        const country = parts.find((p: string) => p.length === 2 && p === p.toUpperCase());
        return country || null;
      }
      return null;
    } else if (Platform.OS === 'android') {
      const localeId = NativeModules.I18nManager?.localeIdentifier;
      if (localeId) {
        const parts = localeId.split('_');
        return parts.length > 1 ? parts[1] : null;
      }
      return null;
    } else {
      const locale = typeof navigator !== 'undefined'
        ? (navigator.language || (navigator as any).languages?.[0])
        : null;
      if (locale) {
        const parts = locale.split('-');
        return parts.length > 1 ? parts[1].toUpperCase() : null;
      }
      return null;
    }
  } catch (error) {
    console.error('[CountryAccess] Error detecting device country:', error);
    return null;
  }
}

export async function checkCountryAccess(countryCode: string | null): Promise<CountryAccessResult> {
  if (!countryCode) {
    console.log('[CountryAccess] No country code available, allowing access');
    return { isBlocked: false, countryCode: null, reason: null };
  }

  const normalizedCode = countryCode.toUpperCase().trim();
  console.log('[CountryAccess] Checking access for country:', normalizedCode);

  try {
    const { data, error } = await supabase
      .from('country_access')
      .select('is_enabled, reason')
      .eq('country_code', normalizedCode)
      .maybeSingle();

    if (error) {
      console.error('[CountryAccess] Error querying country_access:', formatCountryAccessError(error));
      return { isBlocked: false, countryCode: normalizedCode, reason: null };
    }

    if (!data) {
      console.log('[CountryAccess] No entry for country', normalizedCode, '— allowing access (default)');
      return { isBlocked: false, countryCode: normalizedCode, reason: null };
    }

    if (data.is_enabled === false) {
      console.warn('[CountryAccess] Country BLOCKED:', normalizedCode, 'Reason:', data.reason);
      return {
        isBlocked: true,
        countryCode: normalizedCode,
        reason: data.reason || 'This app is not available in your region.',
      };
    }

    console.log('[CountryAccess] Country allowed:', normalizedCode);
    return { isBlocked: false, countryCode: normalizedCode, reason: null };
  } catch (error) {
    console.error('[CountryAccess] Unexpected error:', formatCountryAccessError(error));
    return { isBlocked: false, countryCode: normalizedCode, reason: null };
  }
}
