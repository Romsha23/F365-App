/**
 * app/auth/callback.tsx
 *
 * Landing page for OAuth redirects on web.
 *
 * Two scenarios:
 *
 * 1. POPUP flow (normal web):
 *    login.tsx opens this URL in a popup via window.open().
 *    Supabase's detectSessionInUrl exchanges the ?code= here,
 *    fires SIGNED_IN on the *parent* tab's onAuthStateChange listener
 *    (shared Supabase client in localStorage), then this popup closes itself.
 *    _layout.tsx in the parent tab handles profile fetch + navigation.
 *
 * 2. REDIRECT fallback (popup blocked):
 *    The full page navigated here. Supabase exchanges the code,
 *    fires SIGNED_IN, and _layout.tsx (which re-mounts with the app)
 *    handles routing.
 *
 * On native this route is never reached — handled by WebBrowser in login.tsx.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';
import Colors from '../../constants/colors';

export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/login' as any);
      return;
    }

    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Handling OAuth callback...');

        // detectSessionInUrl=true means the Supabase client auto-exchanges
        // the ?code= in the URL as soon as it initialises on this page load.
        // Give it up to 6 s to complete the exchange and emit SIGNED_IN.
        let resolved = false;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthCallback] Auth event:', event);

            if (event === 'SIGNED_IN' && session?.user) {
              resolved = true;
              subscription.unsubscribe();

              // If we're in a popup, just close it — the parent tab's
              // onAuthStateChange already fired SIGNED_IN and will route.
              if (window.opener && !window.opener.closed) {
                console.log('[AuthCallback] Popup: closing window');
                window.close();
                return;
              }

              // Full-page redirect fallback: _layout.tsx re-mounts and its
              // restoreSession / SIGNED_IN handler will route the user.
              // Nothing extra needed here; just show a brief success state.
              console.log('[AuthCallback] Full-page: session ready, routing...');
              // _layout.tsx onAuthStateChange handles navigation — do nothing.
            }

            if (event === 'SIGNED_OUT') {
              resolved = true;
              subscription.unsubscribe();
              setStatus('error');
              setErrorMsg('Sign in was cancelled.');
              setTimeout(() => router.replace('/login' as any), 2000);
            }
          }
        );

        // Also check if a session is already set (exchange may have completed
        // before the listener registered).
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !resolved) {
          resolved = true;
          subscription.unsubscribe();

          if (window.opener && !window.opener.closed) {
            console.log('[AuthCallback] Popup: session already set, closing');
            window.close();
            return;
          }
          // Full-page: _layout.tsx will handle routing via SIGNED_IN event.
        }

        // Safety timeout
        setTimeout(() => {
          if (!resolved) {
            subscription.unsubscribe();
            console.warn('[AuthCallback] Timed out — redirecting to login');

            if (window.opener && !window.opener.closed) {
              window.close();
              return;
            }

            router.replace('/login' as any);
          }
        }, 8000);

      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        setStatus('error');
        setErrorMsg('Something went wrong. Redirecting to login...');
        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            window.close();
          } else {
            router.replace('/login' as any);
          }
        }, 2000);
      }
    };

    void handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Logo size={64} />
      {status === 'error' ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
          <Text style={styles.message}>Completing sign in…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 20,
  },
  spinner: {
    marginTop: 8,
  },
  message: {
    fontSize: 16,
    color: Colors.subtext,
  },
  errorText: {
    fontSize: 15,
    color: '#9333EA',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
