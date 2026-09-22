import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { MoodType, SymptomType, DayDataType } from '../types/cycle';
import { useCycleStore } from './cycle-store';

export interface DailyCheckIn {
  date: string;
  mood: MoodType;
  energyLevel: number;
  stressLevel: number;
  sleepQuality: number;
  symptoms: string[];
  timestamp: string;
}

type CheckInInput = Omit<DailyCheckIn, 'date' | 'timestamp'>;

const STORAGE_KEY = '@daily_checkins';
const LAST_CHECKIN_KEY = '@last_checkin_date';
const DISMISSED_KEY = '@checkin_dismissed_timestamp';
const RE_PROMPT_INTERVAL_MS = 4 * 60 * 60 * 1000;

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const bridgeToCycleStore = (checkIn: DailyCheckIn) => {
  try {
    const cycleStore = useCycleStore.getState();
    const cycles = cycleStore.cycles;

    if (!cycles || cycles.length === 0) {
      console.log('[DailyCheckIn] No active cycle to bridge data into');
      return;
    }

    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const activeCycle = sortedCycles[0];

    const validSymptoms = checkIn.symptoms.filter(
      (s): s is SymptomType =>
        [
          'cramps', 'headache', 'backache', 'nausea', 'bloating',
          'tender_breasts', 'acne', 'fatigue', 'insomnia', 'dizziness',
        ].includes(s)
    );

    const dayData: DayDataType = {
      date: new Date(checkIn.date + 'T12:00:00').toISOString(),
      mood: checkIn.mood,
      stressLevel: checkIn.stressLevel,
      stress: checkIn.stressLevel,
      sleep: checkIn.sleepQuality,
      symptoms: validSymptoms,
    };

    const existingDay = activeCycle.days.find(
      (d) => d.date.split('T')[0] === checkIn.date
    );

    if (existingDay) {
      const merged: DayDataType = {
        ...existingDay,
        mood: dayData.mood,
        stressLevel: dayData.stressLevel,
        stress: dayData.stress,
        sleep: dayData.sleep,
        symptoms: validSymptoms.length > 0 ? validSymptoms : existingDay.symptoms,
      };
      void cycleStore.addDayData(activeCycle.id, merged);
    } else {
      void cycleStore.addDayData(activeCycle.id, dayData);
    }

    console.log('[DailyCheckIn] Bridged to cycle store:', {
      cycleId: activeCycle.id,
      mood: checkIn.mood,
      stress: checkIn.stressLevel,
      sleep: checkIn.sleepQuality,
      symptoms: validSymptoms,
    });
  } catch (error) {
    console.error('[DailyCheckIn] Bridge to cycle store failed (non-critical):', error);
  }
};

export const useDailyCheckInStore = create(
  combine(
    {
      lastCheckInDate: null as string | null,
      checkIns: [] as DailyCheckIn[],
      shouldShowCheckIn: false,
      isLoading: false,
    },
    (set, get) => ({
      initialize: async () => {
        try {
          console.log('[DailyCheckIn] Initializing...');
          const [lastDate, storedCheckIns, dismissedTimestamp] = await Promise.all([
            AsyncStorage.getItem(LAST_CHECKIN_KEY),
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(DISMISSED_KEY),
          ]);

          const today = getTodayString();
          const now = Date.now();
          const checkIns: DailyCheckIn[] = storedCheckIns ? JSON.parse(storedCheckIns) : [];
          const alreadyCheckedIn = lastDate === today;

          let recentlyDismissed = false;
          if (dismissedTimestamp) {
            const dismissedAt = parseInt(dismissedTimestamp, 10);
            const elapsed = now - dismissedAt;
            recentlyDismissed = elapsed < RE_PROMPT_INTERVAL_MS;
            console.log('[DailyCheckIn] Dismissed', Math.round(elapsed / 60000), 'min ago, recentlyDismissed:', recentlyDismissed);
          }

          const shouldShow = !alreadyCheckedIn && !recentlyDismissed;

          console.log('[DailyCheckIn] Last check-in:', lastDate, 'Today:', today, 'Already done:', alreadyCheckedIn, 'Recently dismissed:', recentlyDismissed, 'shouldShow:', shouldShow);

          set({
            lastCheckInDate: lastDate,
            checkIns,
            shouldShowCheckIn: shouldShow,
          });
        } catch (error) {
          console.error('[DailyCheckIn] Init error:', error);
          set({ shouldShowCheckIn: false });
        }
      },

      submitCheckIn: async (data: CheckInInput) => {
        try {
          set({ isLoading: true });
          const today = getTodayString();
          const now = new Date().toISOString();

          const newCheckIn: DailyCheckIn = {
            date: today,
            mood: data.mood,
            energyLevel: data.energyLevel,
            stressLevel: data.stressLevel,
            sleepQuality: data.sleepQuality,
            symptoms: data.symptoms,
            timestamp: now,
          };

          const currentCheckIns = get().checkIns;
          const existingIndex = currentCheckIns.findIndex(c => c.date === today);
          let updatedCheckIns: DailyCheckIn[];

          if (existingIndex >= 0) {
            updatedCheckIns = [...currentCheckIns];
            updatedCheckIns[existingIndex] = newCheckIn;
          } else {
            updatedCheckIns = [...currentCheckIns, newCheckIn];
          }

          const last30 = updatedCheckIns.slice(-30);

          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(last30)),
            AsyncStorage.setItem(LAST_CHECKIN_KEY, today),
          ]);

          try {
            const authResult = await supabase.auth.getUser();
            const user = authResult.data?.user;
            if (user) {
              await supabase.from('daily_checkins').upsert({
                user_id: user.id,
                date: today,
                mood: newCheckIn.mood,
                energy_level: newCheckIn.energyLevel,
                stress_level: newCheckIn.stressLevel,
                sleep_quality: newCheckIn.sleepQuality,
                symptoms: newCheckIn.symptoms,
                created_at: now,
              }, { onConflict: 'user_id,date' });
              console.log('[DailyCheckIn] Synced to Supabase');
            }
          } catch (syncError) {
            console.warn('[DailyCheckIn] Supabase sync failed (non-critical):', syncError);
          }

          bridgeToCycleStore(newCheckIn);

          set({
            checkIns: last30,
            lastCheckInDate: today,
            shouldShowCheckIn: false,
            isLoading: false,
          });

          console.log('[DailyCheckIn] Check-in saved:', newCheckIn);
        } catch (error) {
          console.error('[DailyCheckIn] Submit error:', error);
          set({ isLoading: false });
        }
      },

      dismissCheckIn: () => {
        const now = Date.now().toString();
        void AsyncStorage.setItem(DISMISSED_KEY, now);
        set({ shouldShowCheckIn: false });
        console.log('[DailyCheckIn] Dismissed, will re-prompt after', RE_PROMPT_INTERVAL_MS / 3600000, 'hours');
      },

      getRecentCheckIns: (days = 7) => {
        const checkIns = get().checkIns;
        return checkIns.slice(-days);
      },
    }),
  ),
);
