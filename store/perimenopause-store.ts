import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  PerimenopauseDayLog,
  PerimenopauseProfile,
} from '../types/perimenopause';

interface PerimenopauseStore {
  profile: PerimenopauseProfile | null;
  dayLogs: PerimenopauseDayLog[];
  isLoading: boolean;

  setProfile: (profile: PerimenopauseProfile) => void;
  updateProfile: (updates: Partial<PerimenopauseProfile>) => void;
  addDayLog: (log: PerimenopauseDayLog) => void;
  updateDayLog: (id: string, updates: Partial<PerimenopauseDayLog>) => void;
  deleteDayLog: (id: string) => void;
  getRecentLogs: (days: number) => PerimenopauseDayLog[];
  getSymptomFrequency: () => Record<string, number>;
  getDaysSinceLastPeriod: () => number | null;
  syncProfileToSupabase: () => Promise<void>;
  syncDayLogToSupabase: (log: PerimenopauseDayLog) => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  clearAllData: () => void;
}

export const usePerimenopauseStore = create<PerimenopauseStore>()(
  persist(
    (set, get) => ({
      profile: null,
      dayLogs: [],
      isLoading: false,

      setProfile: (profile) => {
        set({ profile });
        console.log('[PerimenopauseStore] Profile set');
        void get().syncProfileToSupabase();
      },

      updateProfile: (updates) => {
        const current = get().profile;
        if (current) {
          const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
          set({ profile: updated });
          console.log('[PerimenopauseStore] Profile updated');
          void get().syncProfileToSupabase();
        }
      },

      addDayLog: (log) => {
        const existing = get().dayLogs.find(l => l.date === log.date);
        if (existing) {
          set({
            dayLogs: get().dayLogs.map(l =>
              l.date === log.date ? log : l
            ),
          });
        } else {
          set({ dayLogs: [...get().dayLogs, log] });
        }
        console.log('[PerimenopauseStore] Day log saved for:', log.date);
        void get().syncDayLogToSupabase(log);
      },

      updateDayLog: (id, updates) => {
        const logs = get().dayLogs;
        const updated = logs.map(l => l.id === id ? { ...l, ...updates } : l);
        set({ dayLogs: updated });
        const updatedLog = updated.find(l => l.id === id);
        if (updatedLog) {
          void get().syncDayLogToSupabase(updatedLog);
        }
      },

      deleteDayLog: (id) => {
        set({ dayLogs: get().dayLogs.filter(l => l.id !== id) });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase
              .from('perimenopause_day_logs')
              .delete()
              .eq('id', id)
              .eq('user_id', user.id);
            console.log('[PerimenopauseStore] Day log deleted from Supabase');
          } catch (error) {
            console.warn('[PerimenopauseStore] Supabase delete failed (non-critical):', error);
          }
        })();
      },

      getRecentLogs: (days) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        return get().dayLogs
          .filter(l => l.date >= cutoffStr)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getSymptomFrequency: () => {
        const logs = get().dayLogs;
        const last30 = logs.filter(l => {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          return new Date(l.date) >= cutoff;
        });
        const freq: Record<string, number> = {};
        last30.forEach(log => {
          log.symptoms.forEach(s => {
            freq[s] = (freq[s] || 0) + 1;
          });
        });
        return freq;
      },

      getDaysSinceLastPeriod: () => {
        const profile = get().profile;
        if (!profile?.lastPeriodDate) return null;
        const last = new Date(profile.lastPeriodDate);
        const today = new Date();
        return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      },

      syncProfileToSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[PerimenopauseStore] No auth user, skipping profile sync');
            return;
          }

          const profile = get().profile;
          if (!profile) return;

          await supabase.from('perimenopause_profiles').upsert({
            user_id: user.id,
            last_period_date: profile.lastPeriodDate || null,
            period_pattern: profile.periodPattern || null,
            months_since_last_period: profile.monthsSinceLastPeriod || null,
            hrt_type: profile.hrtType || 'none',
            supplements: profile.supplements || [],
            doctor_name: profile.doctorName || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          console.log('[PerimenopauseStore] Profile synced to Supabase');
        } catch (error) {
          console.warn('[PerimenopauseStore] Profile sync failed (non-critical):', error);
        }
      },

      syncDayLogToSupabase: async (log: PerimenopauseDayLog) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[PerimenopauseStore] No auth user, skipping day log sync');
            return;
          }

          await supabase.from('perimenopause_day_logs').upsert({
            user_id: user.id,
            date: log.date,
            symptoms: log.symptoms,
            mood: log.mood,
            hot_flash_count: log.hotFlashCount || 0,
            hot_flash_intensity: log.hotFlashIntensity || null,
            night_sweats_count: log.nightSweatsCount || 0,
            sleep_hours: log.sleepHours || null,
            sleep_quality: log.sleepQuality || null,
            had_period: log.hadPeriod || false,
            period_flow: log.periodFlow || null,
            energy_level: log.energyLevel || null,
            notes: log.notes || null,
          }, { onConflict: 'user_id,date' });

          console.log('[PerimenopauseStore] Day log synced to Supabase for:', log.date);
        } catch (error) {
          console.warn('[PerimenopauseStore] Day log sync failed (non-critical):', error);
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

          const { data: profileData, error: profileError } = await supabase
            .from('perimenopause_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!profileError && profileData) {
            const profile: PerimenopauseProfile = {
              id: profileData.id,
              userId: profileData.user_id,
              lastPeriodDate: profileData.last_period_date || undefined,
              periodPattern: profileData.period_pattern || undefined,
              monthsSinceLastPeriod: profileData.months_since_last_period || undefined,
              hrtType: profileData.hrt_type || undefined,
              supplements: profileData.supplements || undefined,
              doctorName: profileData.doctor_name || undefined,
              createdAt: profileData.created_at,
              updatedAt: profileData.updated_at,
            };
            set({ profile });
            console.log('[PerimenopauseStore] Profile loaded from Supabase');
          }

          const { data: logsData, error: logsError } = await supabase
            .from('perimenopause_day_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

          if (!logsError && logsData && logsData.length > 0) {
            const serverLogs: PerimenopauseDayLog[] = logsData.map(row => ({
              id: row.id,
              date: row.date,
              symptoms: row.symptoms || [],
              mood: row.mood || 'okay',
              hotFlashCount: row.hot_flash_count || undefined,
              hotFlashIntensity: row.hot_flash_intensity || undefined,
              nightSweatsCount: row.night_sweats_count || undefined,
              sleepHours: row.sleep_hours || undefined,
              sleepQuality: row.sleep_quality || undefined,
              hadPeriod: row.had_period || undefined,
              periodFlow: row.period_flow || undefined,
              energyLevel: row.energy_level || undefined,
              notes: row.notes || undefined,
            }));

            const localLogs = get().dayLogs;
            const merged = [...serverLogs];
            for (const local of localLogs) {
              if (!merged.find(m => m.date === local.date)) {
                merged.push(local);
              }
            }
            merged.sort((a, b) => b.date.localeCompare(a.date));
            set({ dayLogs: merged.slice(0, 90) });
            console.log('[PerimenopauseStore] Day logs loaded from Supabase, total:', merged.length);
          }

          set({ isLoading: false });
        } catch (error) {
          console.warn('[PerimenopauseStore] Load from Supabase failed:', error);
          set({ isLoading: false });
        }
      },

      clearAllData: () => {
        set({ profile: null, dayLogs: [] });
      },
    }),
    {
      name: 'perimenopause-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
