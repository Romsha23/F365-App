import * as SplashScreen from 'expo-splash-screen';
import { Stack, router, useSegments } from 'expo-router';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import Colors from '../constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { TeenGuard } from '../components/TeenGuard';
import { getAgeGateResult, isScreenBlockedForTeen } from '../utils/age-gate';
import { encodeBirthData } from '../utils/birth-crypto';

export const unstable_settings = {
  initialRouteName: 'login',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

void SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'web') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('A text node cannot be a child of a <View>') ||
        msg.includes('Unexpected text node'))
    )
      return;
    originalWarn.apply(console, args);
  };
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('Unknown event handler property') ||
        msg.includes('Invalid DOM property') ||
        msg.includes('transform-origin') ||
        msg.includes('onStartShouldSetResponder') ||
        msg.includes('onResponderGrant') ||
        msg.includes('onResponderMove') ||
        msg.includes('onResponderRelease') ||
        msg.includes('onResponderTerminate') ||
        msg.includes('onResponderTerminationRequest') ||
        msg.includes('A text node cannot be a child of a <View>') ||
        msg.includes('Unexpected text node'))
    )
      return;
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
      <Text style={{ marginTop: 20, color: Colors.subtext, fontSize: 14 }}>
        Loading...
      </Text>
    </View>
  );
}

function buildProfileFromRow(p: any) {
  const birthMonth = p.birth_month ?? undefined;
  const birthYear  = p.birth_year  ?? undefined;
  const birthToken = (birthMonth && birthYear)
    ? encodeBirthData(birthMonth, birthYear)
    : undefined;
  return {
    id: p.id as string,
    uniqueId: p.id as string,
    displayName: (p.username ?? undefined) as string | undefined,
    role: 'user' as const,
    onboarded: Boolean(p.onboarded),
    lifeStage: p.life_stage ?? undefined,
    birthMonth,
    birthYear,
    birthToken,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    notificationsEnabled: true,
    emergencyAlertsEnabled: true,
    insightsEnabled: true,
    subscriptionPlan: undefined,
  };
}

async function fetchProfile(userId: string): Promise<any | null> {
  try {
    const result = await Promise.race([
      supabase.functions.invoke('get-profile', { body: { userId } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (!result || !('data' in result)) return null;
    return result.data?.profile ?? null;
  } catch {
    return null;
  }
}

function AppInitializer({ children }: { children: ReactNode }) {
  const { isChecking } = useDatabaseSetup();
  const [ready, setReady] = useState(false);
  const [countryBlock, setCountryBlock] = useState<CountryAccessResult | null>(null);
  const { setAuthId } = useUserStore();
  const { validateSubscription } = useSubscriptionStore();
  const doneRef = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // release() is called exactly once — sets ready=true and routes
  const release = (route?: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setReady(true);
    if (route) {
      setTimeout(() => router.replace(route as any), 0);
    }
  };

  // Country check — non-blocking
  useEffect(() => {
    (async () => {
      try {
        const code = getDeviceCountryCode();
        if (code) {
          const result = await checkCountryAccess(code);
          if (result.isBlocked) setCountryBlock(result);
        }
      } catch { /* non-fatal */ }
    })();
  }, []);

  useEffect(() => {
    // Hard cap: 3 s max, then show login
    const hardCap = setTimeout(() => {
      console.warn('[Session] Hard cap fired — routing to login');
      release('/login');
    }, 3000);

    const run = async () => {
      try {
        if (
          Platform.OS === 'web' &&
          (window.location.search.includes('code=') ||
            window.location.hash.includes('access_token='))
        ) {
          return; // defer to onAuthStateChange
        }

        const sessionRes = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);

        if (!sessionRes || !('data' in sessionRes)) {
          clearTimeout(hardCap);
          release('/login');
          return;
        }

        const session = sessionRes.data.session;

        if (!session?.user) {
          clearTimeout(hardCap);
          release('/login');
          return;
        }

        setAuthId(session.user.id);
        validateSubscription(session.user.id).catch(() => {});

        const profile = await fetchProfile(session.user.id);
        clearTimeout(hardCap);

        if (profile) {
          useUserStore.setState({
            user: buildProfileFromRow(profile),
            authId: session.user.id,
          });
          release(profile.onboarded ? '/(tabs)' : '/onboarding');
        } else {
          release('/onboarding');
        }
      } catch (err) {
        console.error('[Session] error:', err);
        clearTimeout(hardCap);
        release('/login');
      }
    };

    void run();

    let oauthCap: ReturnType<typeof setTimeout> | null = null;
    if (
      Platform.OS === 'web' &&
      (window.location.search.includes('code=') ||
        window.location.hash.includes('access_token='))
    ) {
      oauthCap = setTimeout(() => release('/login'), 10000);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        release('/login');
        return;
      }
      if (event === 'SIGNED_IN' && session?.user) {
        if (oauthCap) clearTimeout(oauthCap);
        clearTimeout(hardCap);
        if (doneRef.current) return;
        setAuthId(session.user.id);
        // Restore subscription from Supabase on every sign-in
        validateSubscription(session.user.id).catch(() => {});
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          useUserStore.setState({ user: buildProfileFromRow(profile), authId: session.user.id });
          release(profile.onboarded ? '/(tabs)' : '/onboarding');
        } else {
          release('/onboarding');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(hardCap);
      if (oauthCap) clearTimeout(oauthCap);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && (fontsLoaded || fontError) && !isChecking) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready, fontsLoaded, fontError, isChecking]);

  if (!ready) return <AppLoadingScreen />;

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

function TeenScreenGuard() {
  const { user } = useUserStore();
  const segments = useSegments();
  const currentScreen = (segments[segments.length - 1] ?? '') as string;
  const ageGate = getAgeGateResult(
    user?.birthMonth,
    user?.birthYear,
    user?.lifeStage,
    user?.birthToken,
  );
  if (!ageGate.isTeen || !isScreenBlockedForTeen(currentScreen)) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <TeenGuard featureName="This feature" />
    </View>
  );
}

function RootLayoutNav() {
  React.useEffect(() => {
    mixpanel.init();
    mixpanel.track(MixpanelEvents.APP_OPENED);
    void registerForPushNotifications().then((token) => {
      if (token) console.log('[Push] Token:', token);
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
                headerStyle: { backgroundColor: 'transparent' },
                headerShadowVisible: false,
                headerTitleStyle: {
                  color: Colors.foreground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 20,
                },
                headerTintColor: Colors.primary,
                contentStyle: { backgroundColor: 'transparent' },
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
              <Stack.Screen name="ivf-assessment" options={{ headerShown: true, title: 'IVF Readiness Assessment' }} />
              <Stack.Screen name="ivf-results" options={{ headerShown: true, title: 'IVF Readiness Results' }} />
              <Stack.Screen name="clinic-finder" options={{ headerShown: true, title: 'Find a Clinic' }} />
              <Stack.Screen name="clinic-detail" options={{ headerShown: true, title: 'Clinic Details' }} />
              <Stack.Screen name="clinic-consent" options={{ headerShown: true, title: 'Share Your Details' }} />
              <Stack.Screen name="fertility-pathway" options={{ headerShown: true, title: 'Fertility Pathway' }} />
              <Stack.Screen name="cost-estimator" options={{ headerShown: true, title: 'Cost Estimator' }} />
              <Stack.Screen name="ivf-roadmap" options={{ headerShown: true, title: 'IVF Roadmap' }} />
              <Stack.Screen name="doctor-questions" options={{ headerShown: true, title: 'Doctor Questions' }} />
              <Stack.Screen name="perimenopause-dashboard" options={{ headerShown: true, title: 'Perimenopause' }} />
              <Stack.Screen name="perimenopause-symptoms" options={{ headerShown: true, title: 'Symptom Tracker' }} />
              <Stack.Screen name="perimenopause-education" options={{ headerShown: true, title: 'Education' }} />
            </Stack>
            <TeenScreenGuard />
          </View>
        </AppInitializer>
      </QueryClientProvider>
    </RorkErrorBoundary>
  );
}
