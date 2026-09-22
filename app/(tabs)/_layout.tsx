import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Tabs, router } from 'expo-router';
import { Calendar, Home, BarChart2, User, Brain } from 'lucide-react-native';
import { View, Text, ActivityIndicator, AppState } from 'react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
      import { useUserStore } from '@/store/user-store';
      import { useCycleStore } from '@/store/cycle-store';
      import { Logo } from '@/components/Logo';
import { DailyCheckInModal } from '@/components/DailyCheckInModal';
import { useDailyCheckInStore } from '@/store/daily-checkin-store';
import { useFeatureGateStore } from '@/store/feature-gate-store';

export default function TabLayout() {
  const [isReady, setIsReady] = useState(false);
  const shouldShowCheckIn = useDailyCheckInStore((s) => s.shouldShowCheckIn);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('[TabLayout] Initializing app data...');
        
        const currentUser = useUserStore.getState().user;
        if (currentUser) {
          // login.tsx (or session restore in _layout.tsx) already populated
          // the store — skip the profile fetch entirely to avoid a race
          // condition where both paths call register() concurrently.
          console.log('[TabLayout] User already in store:', currentUser.id);
          if (currentUser.country) {
            console.log('[TabLayout] Loading feature flags for country:', currentUser.country);
            void useFeatureGateStore.getState().loadFlags(currentUser.country);
          }
        } else {
          // Reached tabs without a user in the store (e.g. direct URL
          // navigation on web, or a cold start with a persisted session).
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log('[TabLayout] No active session, redirecting to login');
            router.replace('/login');
            return;
          }

          // Guard: another path (onAuthStateChange SIGNED_IN) may already be
          // mid-way through register().  Re-check the store after getSession
          // returns, which yields the microtask queue.
          const userAfterSessionCheck = useUserStore.getState().user;
          if (userAfterSessionCheck) {
            console.log('[TabLayout] Store populated while checking session — skipping re-fetch');
          } else {
            console.log('[TabLayout] Session found but no user store data — fetching profile...');
            const { data: profileData } = await supabase.functions.invoke('get-profile', {
              body: { userId: session.user.id },
            });
            if (!profileData?.profile) {
              console.log('[TabLayout] No profile found, redirecting to onboarding');
              router.replace('/onboarding');
              return;
            }
            const p = profileData.profile;
            useUserStore.getState().setAuthId(session.user.id);
            await useUserStore.getState().register({
              id: p.id,
              uniqueId: p.id,
              displayName: p.username,
              role: 'user',
              onboarded: p.onboarded ?? false,
              lifeStage: p.life_stage,
            });
            if (!p.onboarded) {
              router.replace('/onboarding');
              return;
            }
          }
        }
        
        console.log('[TabLayout] Loading cycles in background...');
        useCycleStore.getState().loadCycles().catch(err => console.warn('[TabLayout] Error loading cycles:', err));
        
        await useDailyCheckInStore.getState().initialize();
        
        console.log('[TabLayout] Initialization complete, shouldShowCheckIn:', useDailyCheckInStore.getState().shouldShowCheckIn);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsReady(true);
      }
    };

    void initializeData();
  }, []);

  const appState = useRef(AppState.currentState);

  const recheckCheckIn = useCallback(() => {
    console.log('[TabLayout] Re-checking daily check-in eligibility...');
    useDailyCheckInStore.getState().initialize().catch(err => 
      console.warn('[TabLayout] Re-init check-in failed:', err)
    );
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[TabLayout] App came to foreground, re-checking check-in');
        recheckCheckIn();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [recheckCheckIn]);

  useEffect(() => {
    console.log('[TabLayout] Check-in effect: isReady=', isReady, 'shouldShowCheckIn=', shouldShowCheckIn);
    if (isReady && shouldShowCheckIn) {
      const timer = setTimeout(() => {
        console.log('[TabLayout] Showing daily check-in modal');
        setShowCheckIn(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isReady, shouldShowCheckIn]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
    <DailyCheckInModal
      visible={showCheckIn}
      onClose={() => setShowCheckIn(false)}
    />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.inactive,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,

        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerShadowVisible: true,
        headerTitle: () => <Logo size={36} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={26} color={color} strokeWidth={2.5} />,
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Calendar size={26} color={color} strokeWidth={2.5} />,
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <BarChart2 size={26} color={color} strokeWidth={2.5} />,
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen
        name="predictive-mood"
        options={{
          title: 'Mood AI',
          tabBarIcon: ({ color }) => <Brain size={26} color={color} strokeWidth={2.5} />,
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={26} color={color} strokeWidth={2.5} />,
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 11,
          },
        }}
      />
    </Tabs>
    </>
  );
}