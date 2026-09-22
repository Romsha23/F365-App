import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface SymptomAnalysisResult {
  id: string;
  symptom: string;
  analysis: string;
  timestamp: string;
}

interface SymptomCheckerStore {
  history: SymptomAnalysisResult[];
  addAnalysis: (symptom: string, analysis: string) => void;
  clearHistory: () => void;
  syncToSupabase: () => Promise<void>;
}

export const useSymptomCheckerStore = create<SymptomCheckerStore>()(
  persist(
    (set, get) => ({
      history: [],

      addAnalysis: (symptom: string, analysis: string) => {
        const entry: SymptomAnalysisResult = {
          id: Date.now().toString(),
          symptom,
          analysis,
          timestamp: new Date().toISOString(),
        };
        const updated = [entry, ...get().history];
        set({ history: updated });
        console.log('[SymptomChecker] Analysis saved, total:', updated.length);
        void get().syncToSupabase();
      },

      clearHistory: () => {
        set({ history: [] });
      },

      syncToSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const latest = get().history[0];
          if (!latest) return;

          await supabase.from('symptom_checker_logs').upsert({
            user_id: user.id,
            symptom: latest.symptom,
            analysis: latest.analysis,
            created_at: latest.timestamp,
          });
          console.log('[SymptomChecker] Synced to Supabase');
        } catch (error) {
          console.warn('[SymptomChecker] Supabase sync failed (non-critical):', error);
        }
      },
    }),
    {
      name: 'symptom-checker-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
);
