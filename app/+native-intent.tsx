/**
 * +native-intent.tsx
 *
 * Handles deep links coming into the app on native (iOS/Android).
 *
 * After Google OAuth, Supabase redirects to:
 *   flo365://auth/callback?code=xxxx  (PKCE)
 * or
 *   flo365://auth/callback#access_token=xxxx  (implicit)
 *
 * Expo Router calls this function to determine which in-app route to
 * navigate to based on the incoming URL.
 */

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    // Normalise: strip the scheme prefix so we work with just the path+query
    // e.g. "flo365://auth/callback?code=abc" → "/auth/callback?code=abc"
    const withoutScheme = path.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, '/');

    // OAuth callback — route to the in-app handler
    if (withoutScheme.includes('auth/callback') ||
        withoutScheme.includes('access_token') ||
        withoutScheme.includes('code=')) {
      console.log('[NativeIntent] OAuth callback detected, routing to /auth/callback');
      // Preserve query string / hash so the callback screen can read the tokens
      return withoutScheme.startsWith('/auth/callback')
        ? withoutScheme
        : `/auth/callback${withoutScheme.includes('?') ? withoutScheme.slice(withoutScheme.indexOf('?')) : ''}`;
    }

    // Password reset
    if (withoutScheme.includes('reset-password') ||
        withoutScheme.includes('type=recovery')) {
      console.log('[NativeIntent] Password reset deep link detected');
      return withoutScheme;
    }

    // Default — go to the home screen
    return '/';
  } catch {
    return '/';
  }
}
