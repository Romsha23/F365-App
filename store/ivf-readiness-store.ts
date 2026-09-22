import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { IVFAssessmentInput, IVFReadinessResult } from '@/types/ivf-readiness';
import { calculateIVFReadiness } from '@/utils/ivf-scoring';
import { useUserStore } from '@/store/user-store';

interface IVFReadinessState {
  assessments: IVFReadinessResult[];
  currentAssessment: IVFReadinessResult | null;
  isLoading: boolean;
  error: string | null;

  runAssessment: (input: IVFAssessmentInput) => Promise<IVFReadinessResult>;
  loadAssessments: () => Promise<void>;
  clearAssessments: () => void;
}

export const useIVFReadinessStore = create<IVFReadinessState>()((set, _get) => ({
  assessments: [],
  currentAssessment: null,
  isLoading: false,
  error: null,

  runAssessment: async (input: IVFAssessmentInput) => {
    set({ isLoading: true, error: null });
    try {
      const { authId, isDemoMode } = useUserStore.getState();
      let userId = authId;

      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      }

      if (!userId) {
        userId = 'demo-user';
        console.warn('[IVF Store] No authenticated user, using demo fallback');
      }

      const result = calculateIVFReadiness(input, userId);

      if (!isDemoMode && userId !== 'demo-user') {
        const { error: insertError } = await supabase
          .from('ivf_readiness_assessments')
          .insert({
            user_id: userId,
            total_score: result.totalScore,
            category: result.category,
            sub_scores: result.subScores,
            predictions: result.predictions,
            actions: result.actions,
            input_data: result.input,
          });

        if (insertError) {
          console.error('[IVF Store] Insert error:', insertError);
        } else {
          console.log('[IVF Store] Assessment saved to Supabase');
        }
      } else {
        console.log('[IVF Store] Demo mode — skipping DB save');
      }

      set(state => ({
        currentAssessment: result,
        assessments: [result, ...state.assessments],
        isLoading: false,
      }));

      return result;
    } catch (error: any) {
      console.error('[IVF Store] runAssessment error:', error);
      set({ isLoading: false, error: error.message || 'Failed to run assessment' });
      throw error;
    }
  },

  loadAssessments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { authId, isDemoMode } = useUserStore.getState();
      let userId = authId;

      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      }

      if (!userId || isDemoMode) {
        console.log('[IVF Store] No auth or demo mode — skipping load');
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('ivf_readiness_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[IVF Store] Load error:', error);
        set({ isLoading: false, error: error.message });
        return;
      }

      const assessments: IVFReadinessResult[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        totalScore: row.total_score,
        category: row.category,
        subScores: row.sub_scores,
        predictions: row.predictions,
        actions: row.actions,
        input: row.input_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      set({
        assessments,
        currentAssessment: assessments.length > 0 ? assessments[0] : null,
        isLoading: false,
      });

      console.log('[IVF Store] Loaded', assessments.length, 'assessments');
    } catch (error: any) {
      console.error('[IVF Store] loadAssessments error:', error);
      set({ isLoading: false, error: error.message || 'Failed to load assessments' });
    }
  },

  clearAssessments: () => {
    set({ assessments: [], currentAssessment: null, error: null });
  },
}));
