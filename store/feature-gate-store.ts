import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { FeatureKey, FEATURE_DEFINITIONS } from '@/constants/feature-keys';

export type AccessTier = 'all' | 'paid' | 'disabled';

export type BlockReason = 'region' | 'tier' | null;

interface CountryFeatureFlag {
  id: string;
  country_code: string;
  feature_key: FeatureKey;
  is_enabled: boolean;
  access_tier: AccessTier;
  reason: string | null;
  updated_by: string | null;
  updated_at: string;
}

interface FeatureGateState {
  flags: CountryFeatureFlag[];
  isLoaded: boolean;
  isLoading: boolean;
  userCountry: string | null;
  userIsPaid: boolean;

  loadFlags: (country: string) => Promise<void>;
  setUserCountry: (country: string) => void;
  setUserIsPaid: (isPaid: boolean) => void;

  isFeatureEnabled: (featureKey: FeatureKey) => boolean;
  getBlockReason: (featureKey: FeatureKey) => BlockReason;
  getBlockMessage: (featureKey: FeatureKey) => string | null;
}

export const useFeatureGateStore = create<FeatureGateState>()((set, get) => ({
  flags: [],
  isLoaded: false,
  isLoading: false,
  userCountry: null,
  userIsPaid: false,

  setUserCountry: (country: string) => {
    set({ userCountry: country });
  },

  setUserIsPaid: (isPaid: boolean) => {
    console.log('[FeatureGate] User paid status:', isPaid);
    set({ userIsPaid: isPaid });
  },

  loadFlags: async (country: string) => {
    if (get().isLoading) return;

    set({ isLoading: true, userCountry: country });
    try {
      console.log('[FeatureGate] Loading flags for country:', country);

      const { data, error } = await supabase
        .from('country_feature_flags')
        .select('*')
        .eq('country_code', country);

      if (error) {
        if (error.code === '42P01') {
          console.log('[FeatureGate] Table does not exist yet - all features enabled by default');
          set({ flags: [], isLoaded: true, isLoading: false });
          return;
        }
        console.error('[FeatureGate] Error loading flags:', error);
        set({ flags: [], isLoaded: true, isLoading: false });
        return;
      }

      console.log('[FeatureGate] Loaded', data?.length || 0, 'flags for', country);
      set({ flags: (data as CountryFeatureFlag[]) || [], isLoaded: true, isLoading: false });
    } catch (err) {
      console.error('[FeatureGate] Failed to load flags:', err);
      set({ flags: [], isLoaded: true, isLoading: false });
    }
  },

  isFeatureEnabled: (featureKey: FeatureKey) => {
    const { flags, isLoaded, userCountry, userIsPaid } = get();

    if (!isLoaded || !userCountry) return true;

    const flag = flags.find(f => f.feature_key === featureKey);

    if (!flag) {
      const def = FEATURE_DEFINITIONS.find(d => d.key === featureKey);
      return def?.defaultEnabled ?? true;
    }

    if (!flag.is_enabled || flag.access_tier === 'disabled') {
      return false;
    }

    if (flag.access_tier === 'paid' && !userIsPaid) {
      return false;
    }

    return true;
  },

  getBlockReason: (featureKey: FeatureKey): BlockReason => {
    const { flags, isLoaded, userCountry, userIsPaid } = get();

    if (!isLoaded || !userCountry) return null;

    const flag = flags.find(f => f.feature_key === featureKey);

    if (!flag) return null;

    if (!flag.is_enabled || flag.access_tier === 'disabled') {
      return 'region';
    }

    if (flag.access_tier === 'paid' && !userIsPaid) {
      return 'tier';
    }

    return null;
  },

  getBlockMessage: (featureKey: FeatureKey): string | null => {
    const { flags, userIsPaid } = get();
    const flag = flags.find(f => f.feature_key === featureKey);

    if (!flag) return null;

    if (!flag.is_enabled || flag.access_tier === 'disabled') {
      return flag.reason || 'This feature is not available in your region';
    }

    if (flag.access_tier === 'paid' && !userIsPaid) {
      return flag.reason || 'Upgrade to a paid plan to unlock this feature';
    }

    return null;
  },
}));
