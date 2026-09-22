import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subscription, SubscriptionPlan, SubscriptionStatus, getPlanFeatures, getSubscriptionPrice, isPaidPlan } from '../types/subscription';
import { logDataCreate, logDataUpdate } from '../utils/audit-logger';
import { supabase } from '../lib/supabase';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  lastValidated: string | null;
  
  // Subscription actions
  createSubscription: (plan: SubscriptionPlan, userId: string) => Promise<string>;
  updateSubscription: (updates: Partial<Subscription>) => Promise<void>;
  cancelSubscription: (cancelAtPeriodEnd?: boolean) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  validateSubscription: (authId: string) => Promise<void>;
  
  // Feature checks
  hasFeature: (feature: keyof ReturnType<typeof getPlanFeatures>) => boolean;
  canAccessFeature: (feature: keyof ReturnType<typeof getPlanFeatures>) => boolean;
  getRemainingCycles: () => number;
  
  // Subscription info
  getSubscriptionInfo: () => {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    daysRemaining: number;
    isActive: boolean;
    isPro: boolean;
  };
  
  // For demo purposes
  loadMockSubscription: (plan: SubscriptionPlan) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      isLoading: false,
      error: null,
      lastValidated: null,
      
      createSubscription: async (plan, userId) => {
        set({ isLoading: true, error: null });
        try {
          if (!isPaidPlan(plan)) {
            throw new Error('Cannot create subscription for free plan');
          }

          const now = new Date();
          const endDate = new Date();
          
          let amount = 0;
          const priceInfo = getSubscriptionPrice(plan);
          if (priceInfo) {
            amount = priceInfo.amount;
            
            if (plan === 'monthly') {
              endDate.setMonth(endDate.getMonth() + 1);
            } else if (plan === 'yearly') {
              endDate.setFullYear(endDate.getFullYear() + 1);
            }
          }
          
          const newSubscription: Subscription = {
            id: `sub_${Date.now()}`,
            userId,
            plan,
            status: 'active',
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: endDate.toISOString(),
            cancelAtPeriodEnd: false,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            amount,
            currency: 'USD',
          };
          
          set({ subscription: newSubscription, isLoading: false });
          
          // Log subscription creation
          logDataCreate(userId, 'subscription', newSubscription.id);
          
          // Sync to Supabase
          try {
            await supabase
              .from('profiles')
              .update({ subscription_active: true })
              .eq('id', userId);
            console.log('[SubscriptionStore] Synced subscription to Supabase');
          } catch (supabaseError) {
            console.warn('[SubscriptionStore] Failed to sync to Supabase:', supabaseError);
          }
          
          return newSubscription.id;
        } catch (error) {
          console.error('Create subscription error:', error);
          set({ error: 'Failed to create subscription', isLoading: false });
          throw error;
        }
      },
      
      updateSubscription: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          const currentSubscription = get().subscription;
          if (!currentSubscription) {
            throw new Error('No subscription found');
          }
          
          const updatedSubscription = {
            ...currentSubscription,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          
          set({ subscription: updatedSubscription, isLoading: false });
          
          // Log subscription update
          logDataUpdate(currentSubscription.userId, 'subscription', currentSubscription.id);
          
          // Sync to Supabase
          const isActive = updatedSubscription.status === 'active';
          try {
            await supabase
              .from('profiles')
              .update({ subscription_active: isActive })
              .eq('id', currentSubscription.userId);
            console.log('[SubscriptionStore] Synced subscription update to Supabase');
          } catch (supabaseError) {
            console.warn('[SubscriptionStore] Failed to sync update to Supabase:', supabaseError);
          }
        } catch (error) {
          console.error('Update subscription error:', error);
          set({ error: 'Failed to update subscription', isLoading: false });
          throw error;
        }
      },
      
      cancelSubscription: async (cancelAtPeriodEnd = true) => {
        set({ isLoading: true, error: null });
        try {
          const currentSubscription = get().subscription;
          if (!currentSubscription) {
            throw new Error('No subscription found');
          }
          
          const updates: Partial<Subscription> = {
            cancelAtPeriodEnd,
            canceledAt: new Date().toISOString(),
          };
          
          if (!cancelAtPeriodEnd) {
            updates.status = 'canceled';
          }
          
          await get().updateSubscription(updates);
          
          // Log subscription cancellation
          logDataUpdate(currentSubscription.userId, 'subscription', currentSubscription.id);
          
          // Sync to Supabase (only mark inactive if canceling immediately)
          if (!cancelAtPeriodEnd) {
            try {
              await supabase
                .from('profiles')
                .update({ subscription_active: false })
                .eq('id', currentSubscription.userId);
              console.log('[SubscriptionStore] Synced cancellation to Supabase');
            } catch (supabaseError) {
              console.warn('[SubscriptionStore] Failed to sync cancellation to Supabase:', supabaseError);
            }
          }
        } catch (error) {
          console.error('Cancel subscription error:', error);
          set({ error: 'Failed to cancel subscription', isLoading: false });
          throw error;
        }
      },
      
      reactivateSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const currentSubscription = get().subscription;
          if (!currentSubscription) {
            throw new Error('No subscription found');
          }
          
          await get().updateSubscription({
            cancelAtPeriodEnd: false,
            canceledAt: undefined,
            status: 'active',
          });
          
          // Log subscription reactivation
          logDataUpdate(currentSubscription.userId, 'subscription', currentSubscription.id);
        } catch (error) {
          console.error('Reactivate subscription error:', error);
          set({ error: 'Failed to reactivate subscription', isLoading: false });
          throw error;
        }
      },
      
      hasFeature: (feature) => {
        const subscription = get().subscription;
        if (!subscription || subscription.status !== 'active') {
          const freeFeatures = getPlanFeatures('free');
          return freeFeatures[feature] as boolean;
        }
        
        const planFeatures = getPlanFeatures(subscription.plan);
        return planFeatures[feature] as boolean;
      },
      
      canAccessFeature: (feature) => {
        const subscription = get().subscription;
        if (!subscription) return false;

        if (subscription.status !== 'active') return false;

        const now = new Date();
        const endDate = new Date(subscription.currentPeriodEnd);
        if (now > endDate) return false;

        return get().hasFeature(feature);
      },
      
      getRemainingCycles: () => {
        const subscription = get().subscription;
        if (!subscription || subscription.status !== 'active') {
          const freeFeatures = getPlanFeatures('free');
          return freeFeatures.maxCycles;
        }
        
        const planFeatures = getPlanFeatures(subscription.plan);
        return planFeatures.maxCycles;
      },
      
      getSubscriptionInfo: () => {
        const subscription = get().subscription;

        if (!subscription) {
          return {
            plan: 'free' as SubscriptionPlan,
            status: 'active' as SubscriptionStatus,
            daysRemaining: 0,
            isActive: false,
            isPro: false,
          };
        }

        const now = new Date();
        const endDate = new Date(subscription.currentPeriodEnd);
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const isActive = subscription.status === 'active' && now <= endDate;
        const isPro = isPaidPlan(subscription.plan) && isActive;

        return {
          plan: subscription.plan,
          status: subscription.status,
          daysRemaining,
          isActive,
          isPro,
        };
      },
      
      validateSubscription: async (authId: string) => {
        try {
          console.log('[SubscriptionStore] Validating subscription for:', authId);
          
          const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', authId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (subError && subError.code !== 'PGRST116') {
            console.error('[SubscriptionStore] Error fetching subscription:', subError);
            return;
          }
          
          if (!subData) {
            console.log('[SubscriptionStore] No subscription found, reverting to free');
            set({ subscription: null, lastValidated: new Date().toISOString() });
            return;
          }
          
          const now = new Date();
          const periodEnd = new Date(subData.current_period_end);
          const isExpired = now > periodEnd;
          const isPaymentFailed = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(subData.status);
          const isCanceled = subData.status === 'canceled';
          
          if (isExpired || isPaymentFailed || isCanceled) {
            console.log('[SubscriptionStore] Subscription invalid:', {
              isExpired,
              isPaymentFailed,
              isCanceled,
              status: subData.status,
            });
            
            const expiredSubscription: Subscription = {
              id: subData.id,
              userId: subData.user_id,
              plan: subData.plan as SubscriptionPlan,
              status: isPaymentFailed ? 'past_due' : (isCanceled ? 'canceled' : 'expired') as SubscriptionStatus,
              currentPeriodStart: subData.current_period_start,
              currentPeriodEnd: subData.current_period_end,
              cancelAtPeriodEnd: subData.cancel_at_period_end,
              canceledAt: subData.canceled_at || undefined,
              createdAt: subData.created_at,
              updatedAt: subData.updated_at,
              amount: subData.amount,
              currency: subData.currency,
            };
            
            set({ subscription: expiredSubscription, lastValidated: new Date().toISOString() });
            
            await supabase
              .from('profiles')
              .update({ is_premium: false })
              .eq('id', authId);
            
            console.log('[SubscriptionStore] Premium features disabled');
            return;
          }
          
          console.log('[SubscriptionStore] Subscription active:', subData.plan);
          const activeSubscription: Subscription = {
            id: subData.id,
            userId: subData.user_id,
            plan: subData.plan as SubscriptionPlan,
            status: 'active',
            currentPeriodStart: subData.current_period_start,
            currentPeriodEnd: subData.current_period_end,
            cancelAtPeriodEnd: subData.cancel_at_period_end,
            createdAt: subData.created_at,
            updatedAt: subData.updated_at,
            amount: subData.amount,
            currency: subData.currency,
          };
          
          set({ subscription: activeSubscription, lastValidated: new Date().toISOString() });
          
          await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', authId);
          
          console.log('[SubscriptionStore] Premium features enabled');
        } catch (error) {
          console.error('[SubscriptionStore] Validation error:', error);
        }
      },
      
      loadMockSubscription: (plan) => {
        if (!isPaidPlan(plan)) {
          set({ subscription: null });
          return;
        }

        const now = new Date();
        const endDate = new Date();
        
        let amount = 0;
        const priceInfo = getSubscriptionPrice(plan);
        if (priceInfo) {
          amount = priceInfo.amount;
          
          if (plan === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (plan === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
          }
        }
        
        const mockSubscription: Subscription = {
          id: `sub_mock_${Date.now()}`,
          userId: 'mock_user',
          plan,
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: endDate.toISOString(),
          cancelAtPeriodEnd: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          amount,
          currency: 'USD',
        };
        
        set({ subscription: mockSubscription });
      },
    }),
    {
      name: 'flow-365-subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);