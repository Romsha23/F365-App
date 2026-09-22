import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface PCOSSymptomEntry {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'none';
  tracked: boolean;
}

export interface PCOSSymptomSnapshot {
  date: string;
  symptoms: PCOSSymptomEntry[];
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'insufficient_data';
  timestamp: string;
}

interface PCOSStore {
  currentSymptoms: PCOSSymptomEntry[];
  history: PCOSSymptomSnapshot[];
  lastUpdated: string | null;
  isLoading: boolean;

  updateSymptom: (symptomId: string, severity: PCOSSymptomEntry['severity']) => void;
  saveSnapshot: (riskScore: number, riskLevel: PCOSSymptomSnapshot['riskLevel']) => void;
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  getSymptomTrend: (symptomId: string, days?: number) => { date: string; severity: string }[];
}

const DEFAULT_SYMPTOMS: PCOSSymptomEntry[] = [
  { id: 'irregular_periods', name: 'Irregular Periods', severity: 'none', tracked: false },
  { id: 'heavy_bleeding', name: 'Heavy Bleeding', severity: 'none', tracked: false },
  { id: 'weight_gain', name: 'Weight Changes', severity: 'none', tracked: false },
  { id: 'acne', name: 'Acne & Skin Changes', severity: 'none', tracked: false },
  { id: 'hair_thinning', name: 'Hair Changes', severity: 'none', tracked: false },
  { id: 'fatigue', name: 'Fatigue & Low Energy', severity: 'none', tracked: false },
  { id: 'mood_changes', name: 'Mood Fluctuations', severity: 'none', tracked: false },
  { id: 'insulin_resistance', name: 'Blood Sugar Issues', severity: 'none', tracked: false },
];

export const usePCOSStore = create<PCOSStore>()(
  persist(
    (set, get) => ({
      currentSymptoms: DEFAULT_SYMPTOMS,
      history: [],
      lastUpdated: null,
      isLoading: false,

      updateSymptom: (symptomId: string, severity: PCOSSymptomEntry['severity']) => {
        console.log('[PCOSStore] Updating symptom:', symptomId, severity);
        const updated = get().currentSymptoms.map(s =>
          s.id === symptomId ? { ...s, severity, tracked: severity !== 'none' } : s
        );
        set({ currentSymptoms: updated, lastUpdated: new Date().toISOString() });
      },

      saveSnapshot: (riskScore: number, riskLevel: PCOSSymptomSnapshot['riskLevel']) => {
        const today = new Date().toISOString().split('T')[0];
        const currentHistory = get().history;
        const existingIndex = currentHistory.findIndex(h => h.date === today);

        const snapshot: PCOSSymptomSnapshot = {
          date: today,
          symptoms: [...get().currentSymptoms],
          riskScore,
          riskLevel,
          timestamp: new Date().toISOString(),
        };

        let updatedHistory: PCOSSymptomSnapshot[];
        if (existingIndex >= 0) {
          updatedHistory = [...currentHistory];
          updatedHistory[existingIndex] = snapshot;
        } else {
          updatedHistory = [...currentHistory, snapshot];
        }

        const last90 = updatedHistory.slice(-90);
        set({ history: last90 });
        console.log('[PCOSStore] Snapshot saved for', today, '- total history:', last90.length);

        void get().syncToSupabase();
      },

      syncToSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[PCOSStore] No auth user, skipping Supabase sync');
            return;
          }

          const state = get();
          const today = new Date().toISOString().split('T')[0];

          await supabase.from('pcos_symptom_logs').upsert({
            user_id: user.id,
            date: today,
            symptoms: state.currentSymptoms,
            history: state.history.slice(-30),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,date' });

          console.log('[PCOSStore] Synced to Supabase');
        } catch (error) {
          console.warn('[PCOSStore] Supabase sync failed (non-critical):', error);
        }
      },

      loadFromSupabase: async () => {
        try {
          set({ isLoading: true });
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ isLoading: false });
            return;
          }

          const { data, error } = await supabase
            .from('pcos_symptom_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

          if (error) {
            console.warn('[PCOSStore] Failed to load from Supabase:', error.message);
            set({ isLoading: false });
            return;
          }

          if (data && data.length > 0) {
            const latest = data[0];
            if (latest.symptoms && Array.isArray(latest.symptoms)) {
              const mergedSymptoms = DEFAULT_SYMPTOMS.map(def => {
                const stored = (latest.symptoms as PCOSSymptomEntry[]).find(s => s.id === def.id);
                return stored ? { ...def, ...stored } : def;
              });
              set({ currentSymptoms: mergedSymptoms });
            }

            const allHistory: PCOSSymptomSnapshot[] = [];
            for (const row of data) {
              if (row.history && Array.isArray(row.history)) {
                for (const snap of row.history as PCOSSymptomSnapshot[]) {
                  if (!allHistory.find(h => h.date === snap.date)) {
                    allHistory.push(snap);
                  }
                }
              }
            }

            if (allHistory.length > 0) {
              allHistory.sort((a, b) => a.date.localeCompare(b.date));
              const localHistory = get().history;
              const merged = [...allHistory];
              for (const local of localHistory) {
                if (!merged.find(h => h.date === local.date)) {
                  merged.push(local);
                }
              }
              merged.sort((a, b) => a.date.localeCompare(b.date));
              set({ history: merged.slice(-90) });
            }

            console.log('[PCOSStore] Loaded from Supabase, history entries:', allHistory.length);
          }

          set({ isLoading: false });
        } catch (error) {
          console.warn('[PCOSStore] Load from Supabase failed:', error);
          set({ isLoading: false });
        }
      },

      getSymptomTrend: (symptomId: string, days = 30) => {
        const history = get().history;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().split('T')[0];

        return history
          .filter(h => h.date >= cutoffStr)
          .map(h => {
            const symptom = h.symptoms.find(s => s.id === symptomId);
            return {
              date: h.date,
              severity: symptom?.severity || 'none',
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date));
      },
    }),
    {
      name: 'pcos-symptom-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSymptoms: state.currentSymptoms,
        history: state.history,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
