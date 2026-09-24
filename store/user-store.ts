import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, generate7DigitId } from '../types/user';
import { logDataUpdate } from '../utils/audit-logger';
import { mixpanel, MixpanelEvents, MixpanelUserProperties } from '../utils/mixpanel';
import { supabase } from '../lib/supabase';
import { generateAICoolName, generateQuickCoolName } from '../utils/display-name-generator';
import { encodeBirthData } from '../utils/birth-crypto';


const AUTH_ID_STORAGE_KEY = 'flo365-auth-id';

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticating: boolean;
  authId: string | null;
  isDemoMode: boolean;
  profileUsername: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Partial<UserProfile>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  loadMockUser: () => void;
  setAuthId: (authId: string) => void;
  setProfileUsername: (username: string) => void;
  checkSession: () => Promise<boolean>;
  exitDemoMode: () => void;
  deleteAllData: () => Promise<void>;
  generateAndSetDisplayName: () => Promise<string>;
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticating: false,
  authId: null,
  isDemoMode: false,
  profileUsername: null,
  
  setProfileUsername: (username: string) => {
    console.log('[UserStore] Setting profile username:', username);
    set({ profileUsername: username });
  },
  
  setAuthId: (authId: string) => {
    console.log('[UserStore] Setting authId:', authId);
    set({ authId });
    AsyncStorage.setItem(AUTH_ID_STORAGE_KEY, authId).catch((error) => {
      console.warn('[UserStore] Failed to persist authId:', error);
    });
  },
  
  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ authId: session.user.id });
        await AsyncStorage.setItem(AUTH_ID_STORAGE_KEY, session.user.id);
        return true;
      }

      const storedAuthId = await AsyncStorage.getItem(AUTH_ID_STORAGE_KEY);
      if (storedAuthId) {
        console.log('[UserStore] Recovered authId from AsyncStorage:', storedAuthId);
        set({ authId: storedAuthId });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Check session error:', error);
      return false;
    }
  },
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('=== USER STORE LOGIN START ===');
      
      const { data: fnData, error: fnError } = await supabase.functions.invoke('signin', {
        body: { email: email.trim().toLowerCase(), password },
      });
      
      if (fnError || !fnData?.success) {
        throw new Error(fnData?.error || fnError?.message || 'Login failed');
      }
      
      await supabase.auth.setSession(fnData.session);
      
      set({ authId: fnData.profile.id });
      
      const { data: profileData, error: fetchError } = await supabase.functions.invoke('get-profile', {
        body: { userId: fnData.profile.id },
      });
      
      if (fetchError) {
        console.error('Error fetching user data:', fetchError);
      }
      
      if (profileData?.profile) {
        const p = profileData.profile;
        const userProfile: UserProfile = {
          id: p.id,
          uniqueId: p.unique_id || generate7DigitId(),
          displayName: p.username || undefined,
          email: p.email || undefined,
          role: 'user',
          onboarded: p.onboarded ?? false,
          lifeStage: p.life_stage,
        };
        
        mixpanel.identify(userProfile.uniqueId);
        mixpanel.track(MixpanelEvents.USER_LOGIN, { method: 'email' });
        mixpanel.setUserProperties({
          [MixpanelUserProperties.SUBSCRIPTION_PLAN]: userProfile.subscriptionPlan,
          [MixpanelUserProperties.SUBSCRIPTION_ACTIVE]: userProfile.subscriptionPlan !== 'free',
        });
        
        set({ user: userProfile, isLoading: false });

        // Restore subscription from Supabase immediately after login
        // so the UI reflects Pro status without waiting for _layout.tsx
        try {
          const { useSubscriptionStore } = await import('../store/subscription-store');
          await useSubscriptionStore.getState().validateSubscription(fnData.profile.id);
        } catch (subErr) {
          console.warn('[UserStore] Post-login subscription validation failed:', subErr);
        }
      } else {
        set({ isLoading: false });
      }
      
      console.log('=== USER STORE LOGIN COMPLETE ===');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      console.log('=== USER STORE LOGOUT START ===');
      const { isDemoMode } = get();
      if (!isDemoMode) {
        await supabase.auth.signOut();
      }
      mixpanel.track(MixpanelEvents.USER_LOGOUT);
      mixpanel.reset();
      await AsyncStorage.removeItem(AUTH_ID_STORAGE_KEY);
      set({ user: null, authId: null, isDemoMode: false });
      console.log('=== USER STORE LOGOUT COMPLETE ===');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  register: async (userData) => {
    const state = get();
    if (state.isAuthenticating || state.isLoading) {
      console.log('Already authenticating, skipping...');
      return;
    }
    
    set({ isLoading: true, error: null, isAuthenticating: true });
    try {
      console.log('=== USER STORE REGISTER START ===');
      
      const uniqueId = userData.uniqueId || generate7DigitId();
      
      let coolName = userData.displayName;
      const isNewName = !coolName || coolName.trim().length === 0;
      if (isNewName) {
        coolName = get().profileUsername || generateQuickCoolName();
        console.log('[UserStore] Generated initial display name:', coolName);
        const generatedFallback = coolName;
        generateAICoolName().then(aiName => {
          const current = get().user;
          if (current && current.displayName === generatedFallback) {
            set({ user: { ...current, displayName: aiName } });
            console.log('[UserStore] AI-generated display name set:', aiName);
          } else {
            console.log('[UserStore] Skipping AI name â€” user already has a different name');
          }
        }).catch(err => {
          console.warn('[UserStore] AI name gen failed, keeping fallback:', err);
        });
      } else {
        console.log('[UserStore] Using existing display name:', coolName);
      }
      
      const birthToken = (userData.birthMonth && userData.birthYear)
        ? encodeBirthData(userData.birthMonth, userData.birthYear)
        : userData.birthToken;

      const userProfile: UserProfile = {
        id: userData.id || uniqueId,
        uniqueId: uniqueId,
        displayName: coolName,
        email: userData.email,
        birthMonth: userData.birthMonth,
        birthYear: userData.birthYear,
        birthToken,
        role: userData.role ?? 'user',
        country: userData.country,
        ethnicity: userData.ethnicity,
        activityLevel: userData.activityLevel,
        dietType: userData.dietType,
        sleepPattern: userData.sleepPattern,
        stressLevel: userData.stressLevel,
        healthConditions: userData.healthConditions,
        contraceptiveType: userData.contraceptiveType,
        climateType: userData.climateType,
        commonSymptoms: userData.commonSymptoms,
        averageCycleLength: userData.averageCycleLength || 28,
        averagePeriodLength: userData.averagePeriodLength || 5,
        notificationsEnabled: userData.notificationsEnabled ?? true,
        emergencyAlertsEnabled: userData.notificationsEnabled ?? true,
        insightsEnabled: userData.insightsEnabled ?? true,
        onboarded: userData.onboarded ?? false,
        subscriptionPlan: userData.subscriptionPlan || 'free',
        lifeStage: userData.lifeStage,
      };
      
      console.log('Registering user with uniqueId:', userProfile.uniqueId);

      const authId = get().authId;
      const isDemoMode = get().isDemoMode;
      if (authId && !isDemoMode) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authId,
            onboarded: userProfile.onboarded,
            life_stage: userProfile.lifeStage,
            birth_month: userProfile.birthMonth ?? null,
            birth_year: userProfile.birthYear ?? null,
          }, {
            onConflict: 'id',
          });
        
        if (upsertError) {
          console.error('[UserStore] DB upsert error during register:', upsertError);
        } else {
          console.log('[UserStore] User persisted to DB');
        }

        if (userProfile.birthMonth && userProfile.birthYear) {
          try {
            await supabase.functions.invoke('save-birth-data', {
              body: {
                userId: authId,
                birthMonth: userProfile.birthMonth,
                birthYear: userProfile.birthYear,
              },
            });
          } catch (err) {
            console.warn('[UserStore] save-birth-data call error:', err);
          }
        }
      }
      
      mixpanel.identify(userProfile.uniqueId);
      mixpanel.track(MixpanelEvents.USER_REGISTERED, { method: 'email' });
      mixpanel.setUserProperties({
        [MixpanelUserProperties.SUBSCRIPTION_PLAN]: userProfile.subscriptionPlan,
        [MixpanelUserProperties.FIRST_SEEN]: new Date().toISOString(),
      });
      
      set({ user: userProfile, isLoading: false, isAuthenticating: false });
      console.log('=== USER STORE REGISTER COMPLETE ===');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({ error: errorMessage, isLoading: false, isAuthenticating: false });
      throw error;
    }
  },
  
  updateProfile: async (updates) => {
    const state = get();
    if (state.isAuthenticating || state.isLoading) {
      console.log('Already processing, skipping update...');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      let currentUser = get().user;
      
      if (!currentUser) {
        const authId = get().authId;
        if (authId && !get().isDemoMode) {
          console.log('[updateProfile] No local user, attempting to fetch profile...');
          const { data: profileData, error: fetchError } = await supabase.functions.invoke('get-profile', {
            body: { userId: authId },
          });
          
          if (profileData?.profile && !fetchError) {
            const p = profileData.profile;
            currentUser = {
              id: p.id,
              uniqueId: p.unique_id || generate7DigitId(),
              displayName: p.username,
              role: 'user',
              onboarded: p.onboarded ?? false,
              lifeStage: p.life_stage,
            };
            set({ user: currentUser });
            console.log('[updateProfile] User recovered from profile');
          }
        }
      }
      
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      const updatedBirthMonth = updates.birthMonth ?? currentUser.birthMonth;
      const updatedBirthYear = updates.birthYear ?? currentUser.birthYear;
      const birthToken = (updatedBirthMonth && updatedBirthYear)
        ? encodeBirthData(updatedBirthMonth, updatedBirthYear)
        : (updates.birthToken ?? currentUser.birthToken);

      const updatedUser: UserProfile = {
        ...currentUser,
        ...updates,
        birthToken,
      };
      
      const authId = get().authId;
      const isDemoMode = get().isDemoMode;
      
      if (authId && !isDemoMode) {
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: authId,
            onboarded: updatedUser.onboarded,
            life_stage: updatedUser.lifeStage,
            birth_month: updatedUser.birthMonth ?? null,
            birth_year: updatedUser.birthYear ?? null,
          }, {
            onConflict: 'id',
          });
        
        if (updateError) {
          console.error('Supabase update error:', updateError);
        }

        if (updatedUser.birthMonth && updatedUser.birthYear) {
          try {
            await supabase.functions.invoke('save-birth-data', {
              body: {
                userId: authId,
                birthMonth: updatedUser.birthMonth,
                birthYear: updatedUser.birthYear,
              },
            });
          } catch (err) {
            console.warn('[UserStore] save-birth-data update error:', err);
          }
        }
      }
      
      mixpanel.track(MixpanelEvents.PROFILE_UPDATED, {
        fieldsUpdated: Object.keys(updates),
      });
      mixpanel.setUserProperties({
        [MixpanelUserProperties.SUBSCRIPTION_PLAN]: updatedUser.subscriptionPlan,
        [MixpanelUserProperties.AVERAGE_CYCLE_LENGTH]: updatedUser.averageCycleLength,
        [MixpanelUserProperties.AVERAGE_PERIOD_LENGTH]: updatedUser.averagePeriodLength,
        [MixpanelUserProperties.NOTIFICATIONS_ENABLED]: updatedUser.notificationsEnabled,
      });
      
      set({ user: updatedUser, isLoading: false });
      
      logDataUpdate(currentUser.uniqueId, 'user', currentUser.uniqueId);
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
  
  loadMockUser: () => {
    console.log('[UserStore] Loading demo mode user');
    const demoName = generateQuickCoolName();
    const mockUser: UserProfile = {
      id: 'demo-user',
      uniqueId: generate7DigitId(),
      displayName: demoName,
      email: 'demo@f365.app',
      birthMonth: 6,
      birthYear: 1998,
      role: 'user',
      country: 'US',
      averageCycleLength: 28,
      averagePeriodLength: 5,
      notificationsEnabled: true,
      emergencyAlertsEnabled: true,
      insightsEnabled: true,
      dataEncrypted: true,
      commonSymptoms: [],
      subscriptionPlan: 'free',
      onboarded: true,
    };
    set({ user: mockUser, isDemoMode: true, authId: 'demo-auth-id' });
    AsyncStorage.setItem(AUTH_ID_STORAGE_KEY, 'demo-auth-id').catch((error) => {
      console.warn('[UserStore] Failed to persist demo authId:', error);
    });
    console.log('[UserStore] Demo mode activated with name:', demoName);
  },
  
  exitDemoMode: () => {
    console.log('[UserStore] Exiting demo mode');
    AsyncStorage.removeItem(AUTH_ID_STORAGE_KEY).catch((error) => {
      console.warn('[UserStore] Failed to clear authId:', error);
    });
    set({ user: null, isDemoMode: false, authId: null });
  },
  
  generateAndSetDisplayName: async () => {
    try {
      const aiName = await generateAICoolName();
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, displayName: aiName };
        set({ user: updated });
        console.log('[UserStore] New AI display name set:', aiName);
      }
      return aiName;
    } catch (error) {
      console.error('[UserStore] Error generating display name:', error);
      const fallback = generateQuickCoolName();
      const currentUser = get().user;
      if (currentUser && !currentUser.displayName) {
        set({ user: { ...currentUser, displayName: fallback } });
      }
      return fallback;
    }
  },
  
  deleteAllData: async () => {
    try {
      console.log('=== DELETE ALL USER DATA START ===');
      const { authId, isDemoMode } = get();
      
      if (!authId || isDemoMode) {
        console.log('[DeleteData] No auth ID or demo mode, clearing local state only');
        set({ user: null, authId: null, isDemoMode: false });
        return;
      }
      
      const tablesToDelete = [
        'mood_logs',
        'lifestyle_logs',
        'ai_predictions',
        'symptom_logs',
        'custom_symptoms',
        'predictions',
        'ai_insights',
        'subscriptions',
        'subscription_orders',
        'cancellation_requests',
      ];
      
      for (const table of tablesToDelete) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', authId);
          if (error) {
            console.warn(`[DeleteData] Error deleting from ${table}:`, error.message);
          } else {
            console.log(`[DeleteData] Deleted data from ${table}`);
          }
        } catch (err) {
          console.warn(`[DeleteData] Failed to delete from ${table}:`, err);
        }
      }
      
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', authId);
        if (error) {
          console.warn('[DeleteData] Error deleting user profile:', error.message);
        } else {
          console.log('[DeleteData] User profile deleted');
        }
      } catch (err) {
        console.warn('[DeleteData] Failed to delete user profile:', err);
      }
      
      try {
        await supabase.auth.signOut();
        console.log('[DeleteData] Signed out');
      } catch (err) {
        console.warn('[DeleteData] Error signing out:', err);
      }
      
      mixpanel.track(MixpanelEvents.USER_LOGOUT);
      mixpanel.reset();
      
      set({ user: null, authId: null, isDemoMode: false });
      console.log('=== DELETE ALL USER DATA COMPLETE ===');
    } catch (error) {
      console.error('[DeleteData] Critical error:', error);
      throw error;
    }
  },
}));
