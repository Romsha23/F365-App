import * as SplashScreen from 'expo-splash-screen';
import { Stack, router } from "expo-router";
import React, { ReactNode, useEffect, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import Colors from '../constants/colors';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mixpanel, MixpanelEvents } from '../utils/mixpanel';
import { RorkErrorBoundary } from '../components/RorkErrorBoundary';
import { useDatabaseSetup } from '../hooks/useDatabaseSetup';
import { registerForPushNotifications } from '../utils/notifications';
import { Logo } from '../components/Logo';
import { CosmicBackground } from '../components/CosmicBackground';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/user-store';
import { useSubscriptionStore } from '../store/subscription-store';
import { getDeviceCountryCode, checkCountryAccess, CountryAccessResult } from '../utils/country-access';
import { CountryBlockedScreen } from '../components/CountryBlockedScreen';

export const unstable_settings = {
  initialRouteName: "login",
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false
    }
  }
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

// Suppress React Native Web SVG warnings
if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (
        message.includes('A text node cannot be a child of a <View>') ||
        message.includes('Unexpected text node')
      )
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (
        message.includes('Unknown event handler property') ||
        message.includes('Invalid DOM property') ||
        message.includes('transform-origin') ||
        message.includes('onStartShouldSetResponder') ||
        message.includes('onResponderGrant') ||
        message.includes('onResponderMove') ||
        message.includes('onResponderRelease') ||
        message.includes('onResponderTerminate') ||
        message.includes('onResponderTerminationRequest') ||
        message.includes('A text node cannot be a child of a <View>') ||
        message.includes('Unexpected text node')
      )
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function RootLayout() {
  return <RootLayoutNav />;
}

function AppLoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <Logo size={64} />
      <Text style={{ marginTop: 20, color: Colors.subtext, fontSize: 14, fontWeight: '400' as const }}>Loading...</Text>
    </View>
  );
}

function AppInitializer({ children }: { children: ReactNode }) {
  const { isChecking } = useDatabaseSetup();
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [countryBlock, setCountryBlock] = useState<CountryAccessResult | null>(null);
  const [isCheckingCountry, setIsCheckingCountry] = useState(true);
  const { register, setAuthId } = useUserStore();
  const { validateSubscription } = useSubscriptionStore();
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsReady = fontsLoaded;

  useEffect(() => {
    const checkDeviceCountry = async () => {
      try {
        console.log('[CountryCheck] Checking device country pre-login...');
        const deviceCountry = getDeviceCountryCode();
        console.log('[CountryCheck] Device country detected:', deviceCountry);
        if (deviceCountry) {
          const result = await checkCountryAccess(deviceCountry);
          if (result.isBlocked) {
            console.warn('[CountryCheck] Device country BLOCKED:', deviceCountry);
            setCountryBlock(result);
          }
        }
      } catch (error) {
        console.error('[CountryCheck] Pre-login country check error:', error);
      } finally {
        setIsCheckingCountry(false);
      }
    };
    void checkDeviceCountry();
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('[Session] Restoring session...');

        // On web OAuth callback (?code= in URL), Supabase's detectSessionInUrl
        // automatically calls exchangeCodeForSession internally and fires
        // SIGNED_IN when done. Calling getSession() here races with that exchange
        // and may return null. We defer entirely to onAuthStateChange below.
        if (Platform.OS === 'web' &&
            (window.location.search.includes('code=') ||
             window.location.hash.includes('access_token='))) {
          console.log('[Session] OAuth callback — deferring to onAuthStateChange SIGNED_IN');
          // isRestoringSession stays true; onAuthStateChange SIGNED_IN will
          // call setIsRestoringSession(false) once the exchange completes.
          return;
        }
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => {
          console.warn('[Session] Session restore timed out after 4s');
          resolve(null);
        }, 4000));
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!result || !('data' in result)) {
          console.log('[Session] Timed out or no result, showing login');
          setIsRestoringSession(false);
          return;
        }
        
        const { data: { session } } = result;
        
        if (session?.user) {
          console.log('[Session] Found for user:', session.user.id);
          setAuthId(session.user.id);
          
          const { data: profileData, error: fetchError } = await supabase.functions.invoke('get-profile', {
            body: { userId: session.user.id },
          });
          
          if (fetchError) {
            console.error('[Session] Error fetching user:', fetchError);
          }
          
          if (profileData?.profile) {
            const p = profileData.profile;
            console.log('[Session] User data restored:', p.id, 'username:', p.username);
            await register({
              id: p.id,
              uniqueId: p.id,
              displayName: p.username,
              role: 'user',
              onboarded: p.onboarded ?? false,
              lifeStage: p.life_stage,
            });
            
            validateSubscription(session.user.id).catch(err => {
              console.warn('[Session] Subscription validation error:', err);
            });
            
            if (p.onboarded) {
              router.replace('/(tabs)');
            } else {
              router.replace('/onboarding' as any);
            }
          } else {
            console.log('[Session] No user profile found, redirecting to onboarding');
            router.replace('/onboarding' as any);
          }
        } else {
          console.log('[Session] No active session found');
        }
        
        console.log('[Session] Restore complete');
      } catch (error) {
        console.error('[Session] Error restoring session:', error);
      } finally {
        setIsRestoringSession(false);
      }
    };
    
    void restoreSession();

    // Safety net for OAuth callback: if SIGNED_IN never fires within 12s
    // (bad/expired code, network error), release loading and show login.
    let oauthSafetyTimer: ReturnType<typeof setTimeout> | null = null;
    if (Platform.OS === 'web' &&
        (window.location.search.includes('code=') ||
         window.location.hash.includes('access_token='))) {
      oauthSafetyTimer = setTimeout(() => {
        console.warn('[Session] OAuth SIGNED_IN never fired — falling back to login');
        setIsRestoringSession(false);
        router.replace('/login' as any);
      }, 12000);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_OUT') {
        router.replace('/login' as any);
        return;
      }

      // On web, detectSessionInUrl fires SIGNED_IN after parsing tokens
      // from the URL (OAuth callback, magic link, etc.).  Route the user
      // forward exactly as restoreSession does — but only when the store
      // is still empty (i.e. restoreSession didn't already handle it).
      if (event === 'SIGNED_IN' && session?.user) {
        if (oauthSafetyTimer) clearTimeout(oauthSafetyTimer);

        const existingUser = useUserStore.getState().user;
        if (existingUser) {
          // restoreSession or login.tsx already hydrated the store — skip.
          // But still release the loading screen if we're on an OAuth callback.
          setIsRestoringSession(false);
          return;
        }

        console.log('[AuthStateChange] SIGNED_IN, hydrating store for user:', session.user.id);
        setAuthId(session.user.id);

        try {
          const { data: profileData } = await supabase.functions.invoke('get-profile', {
            body: { userId: session.user.id },
          });

          if (profileData?.profile) {
            const p = profileData.profile;
            await register({
              id: p.id,
              uniqueId: p.id,
              displayName: p.username,
              role: 'user',
              onboarded: p.onboarded ?? false,
              lifeStage: p.life_stage,
            });

            if (p.onboarded) {
              router.replace('/(tabs)');
            } else {
              router.replace('/onboarding' as any);
            }
          } else {
            router.replace('/onboarding' as any);
          }
        } catch (err) {
          console.error('[AuthStateChange] Error handling SIGNED_IN:', err);
        } finally {
          setIsRestoringSession(false);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
      if (oauthSafetyTimer) clearTimeout(oauthSafetyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isChecking && fontsReady && !isRestoringSession && !isCheckingCountry) {
      void SplashScreen.hideAsync();
    }
  }, [isChecking, fontsReady, isRestoringSession, isCheckingCountry]);

  if (!fontsReady || isRestoringSession || isCheckingCountry) {
    return <AppLoadingScreen />;
  }

  if (countryBlock?.isBlocked) {
    return (
      <CountryBlockedScreen
        countryCode={countryBlock.countryCode}
        reason={countryBlock.reason}
      />
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  React.useEffect(() => {
    mixpanel.init();
    mixpanel.track(MixpanelEvents.APP_OPENED);
    
    void registerForPushNotifications().then((token) => {
      if (token) {
        console.log('Registered for push notifications with token:', token);
      }
    });
  }, []);

  return (
    <RorkErrorBoundary>
      <QueryClientProvider client={queryClient}>
          <AppInitializer>
            <View style={{ flex: 1 }}>
              <CosmicBackground />
              <StatusBar style="dark" translucent={false} backgroundColor="#F5F0FF" />
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: 'transparent',
                  },
                  headerShadowVisible: false,
                  headerTitleStyle: {
                    color: Colors.foreground,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 20,
                  },
                  headerTintColor: Colors.primary,
                  contentStyle: {
                    backgroundColor: 'transparent',
                  },
                  headerTitle: () => <Logo size={32} />,
                }}
              >
              <Stack.Screen name="login" options={{ headerShown: true }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: true }} />
              <Stack.Screen name="onboarding" options={{ headerShown: true }} />
              <Stack.Screen name="reset-password" options={{ headerShown: true }} />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
              <Stack.Screen name="log-entry" options={{ presentation: 'modal' }} />
              <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="emergency-contacts" options={{ headerShown: true }} />
              <Stack.Screen name="help" options={{ headerShown: true }} />
              <Stack.Screen name="reminders" options={{ headerShown: true }} />
              <Stack.Screen name="data-export" options={{ headerShown: true }} />
              <Stack.Screen name="consent" options={{ headerShown: true }} />
              <Stack.Screen name="partner-sharing" options={{ headerShown: true, title: 'Partner Sharing' }} />
              <Stack.Screen name="partner-link" options={{ headerShown: true, title: 'Partner Invite' }} />
              <Stack.Screen name="partner-summary" options={{ headerShown: true, title: 'Partner Summary' }} />
              <Stack.Screen name="partner-education" options={{ headerShown: true, title: 'Partner Education' }} />
              <Stack.Screen name="relationship-dashboard" options={{ headerShown: true, title: 'Relationship Dashboard' }} />
              <Stack.Screen name="privacy-policy" options={{ headerShown: true }} />
              <Stack.Screen name="terms-of-service" options={{ headerShown: true }} />
              
              {/* Subscription related screens */}
              <Stack.Screen name="subscription" options={{ headerShown: true, title: 'Upgrade to Pro' }} />
              <Stack.Screen name="subscription-success" options={{ headerShown: true, title: 'Welcome to Pro!' }} />
              <Stack.Screen name="subscription-management" options={{ headerShown: true, title: 'Manage Subscription' }} />
              <Stack.Screen name="symptom-checker" options={{ headerShown: true, title: 'Symptom Checker' }} />
              <Stack.Screen name="telehealth" options={{ headerShown: true, title: 'Telehealth' }} />
              <Stack.Screen name="book-appointment" options={{ headerShown: true, title: 'Book Appointment' }} />
              <Stack.Screen name="my-appointments" options={{ headerShown: true, title: 'My Appointments' }} />
              <Stack.Screen name="consultation" options={{ headerShown: true, title: 'Consultation' }} />
              <Stack.Screen name="ai-chatbot" options={{ headerShown: true, title: 'AI Health Assistant' }} />
              <Stack.Screen name="advanced-analytics" options={{ headerShown: true, title: 'Advanced Analytics' }} />
              <Stack.Screen name="ai-insights" options={{ headerShown: true, title: 'AI Insights' }} />

              {/* Pregnancy related screens */}
              <Stack.Screen name="pregnancy-dashboard" options={{ headerShown: true, title: 'Pregnancy Dashboard' }} />
              <Stack.Screen name="pregnancy-setup" options={{ headerShown: true, title: 'Pregnancy Setup' }} />
              <Stack.Screen name="pregnancy-calendar" options={{ headerShown: true, title: 'Pregnancy Calendar' }} />
              <Stack.Screen name="pregnancy-log" options={{ headerShown: true, title: 'Pregnancy Log' }} />
              <Stack.Screen name="kick-counter" options={{ headerShown: true, title: 'Kick Counter' }} />
              <Stack.Screen name="contraction-timer" options={{ headerShown: true, title: 'Contraction Timer' }} />
              <Stack.Screen name="pregnancy-appointments" options={{ headerShown: true, title: 'Appointments' }} />
              <Stack.Screen name="baby-development" options={{ headerShown: true, title: 'Baby Development' }} />
              <Stack.Screen name="postpartum-dashboard" options={{ headerShown: true, title: 'Postpartum' }} />
              <Stack.Screen name="postpartum-knowledge" options={{ headerShown: true, title: 'Knowledge Base' }} />
              <Stack.Screen name="postpartum-assessment" options={{ headerShown: true, title: 'Symptom Check' }} />
              <Stack.Screen name="secret-name-reveal" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="redeem-code" options={{ headerShown: true, title: 'Redeem Code' }} />
              <Stack.Screen name="fertility-predictions" options={{ headerShown: true, title: 'Fertility Predictions' }} />
              <Stack.Screen name="pcos-insights" options={{ headerShown: true, title: 'PCOS Insights' }} />

              {/* IVF Readiness screens */}
              <Stack.Screen name="ivf-assessment" options={{ headerShown: true, title: 'IVF Readiness Assessment' }} />
              <Stack.Screen name="ivf-results" options={{ headerShown: true, title: 'IVF Readiness Results' }} />

              {/* Clinic Finder screens */}
              <Stack.Screen name="clinic-finder" options={{ headerShown: true, title: 'Find a Clinic' }} />
              <Stack.Screen name="clinic-detail" options={{ headerShown: true, title: 'Clinic Details' }} />
              <Stack.Screen name="clinic-consent" options={{ headerShown: true, title: 'Share Your Details' }} />

              {/* Fertility Pathway screens */}
              <Stack.Screen name="fertility-pathway" options={{ headerShown: true, title: 'Fertility Pathway' }} />
              <Stack.Screen name="cost-estimator" options={{ headerShown: true, title: 'Cost Estimator' }} />
              <Stack.Screen name="ivf-roadmap" options={{ headerShown: true, title: 'IVF Roadmap' }} />
              <Stack.Screen name="doctor-questions" options={{ headerShown: true, title: 'Doctor Questions' }} />

              {/* Perimenopause screens */}
              <Stack.Screen name="perimenopause-dashboard" options={{ headerShown: true, title: 'Perimenopause' }} />
              <Stack.Screen name="perimenopause-symptoms" options={{ headerShown: true, title: 'Symptom Tracker' }} />
              <Stack.Screen name="perimenopause-education" options={{ headerShown: true, title: 'Education' }} />
              </Stack>
            </View>
          </AppInitializer>
      </QueryClientProvider>
    </RorkErrorBoundary>
  );
}