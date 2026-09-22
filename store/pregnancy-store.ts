import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  PregnancyMode,
  PregnancyProfile,
  PregnancyDayLog,
  PregnancyAppointment,
  KickCountSession,
  ContractionTimer,
  Contraction,
  PostpartumProfile,
  PostpartumDayLog,
  BabyProfile,
  BabyFeeding,
  BabySleep,
  BabyDiaper,
  BreastfeedingSession,
} from '../types/pregnancy';

export interface PostpartumAssessmentResult {
  id: string;
  date: string;
  responses: Record<string, number>;
  score: number;
  level: 'low' | 'moderate' | 'high';
  warnings: string[];
  weeksPostpartum: number;
  timestamp: string;
}

interface PregnancyStore {
  mode: PregnancyMode;
  pregnancyProfile: PregnancyProfile | null;
  postpartumProfile: PostpartumProfile | null;
  pregnancyDayLogs: PregnancyDayLog[];
  postpartumDayLogs: PostpartumDayLog[];
  appointments: PregnancyAppointment[];
  kickCountSessions: KickCountSession[];
  contractionTimers: ContractionTimer[];
  babies: BabyProfile[];
  babyFeedings: BabyFeeding[];
  babySleeps: BabySleep[];
  babyDiapers: BabyDiaper[];
  breastfeedingSessions: BreastfeedingSession[];
  assessmentResults: PostpartumAssessmentResult[];
  isLoading: boolean;
  
  setMode: (mode: PregnancyMode) => void;
  setPregnancyProfile: (profile: PregnancyProfile) => void;
  setPostpartumProfile: (profile: PostpartumProfile) => void;
  addPregnancyDayLog: (log: PregnancyDayLog) => void;
  updatePregnancyDayLog: (id: string, log: Partial<PregnancyDayLog>) => void;
  addPostpartumDayLog: (log: PostpartumDayLog) => void;
  updatePostpartumDayLog: (id: string, log: Partial<PostpartumDayLog>) => void;
  addAppointment: (appointment: PregnancyAppointment) => void;
  updateAppointment: (id: string, appointment: Partial<PregnancyAppointment>) => void;
  deleteAppointment: (id: string) => void;
  addKickCountSession: (session: KickCountSession) => void;
  updateKickCountSession: (id: string, session: Partial<KickCountSession>) => void;
  addContractionTimer: (timer: ContractionTimer) => void;
  addContractionToTimer: (timerId: string, contraction: Contraction) => void;
  updateContraction: (timerId: string, contractionId: string, contraction: Partial<Contraction>) => void;
  addBaby: (baby: BabyProfile) => void;
  updateBaby: (id: string, baby: Partial<BabyProfile>) => void;
  addBabyFeeding: (feeding: BabyFeeding) => void;
  addBabySleep: (sleep: BabySleep) => void;
  updateBabySleep: (id: string, sleep: Partial<BabySleep>) => void;
  addBabyDiaper: (diaper: BabyDiaper) => void;
  addBreastfeedingSession: (session: BreastfeedingSession) => void;
  updateBreastfeedingSession: (id: string, session: Partial<BreastfeedingSession>) => void;
  addAssessmentResult: (result: PostpartumAssessmentResult) => void;
  getLatestAssessment: () => PostpartumAssessmentResult | null;
  getCurrentWeek: () => number;
  getDaysUntilDue: () => number;
  getWeeksPostpartum: () => number;
  loadFromSupabase: () => Promise<void>;
  clearAllData: () => void;
}

const syncPregnancyProfile = async (profile: PregnancyProfile) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('pregnancy_profiles').upsert({
      user_id: user.id,
      due_date: profile.dueDate,
      conception_date: profile.conceptionDate || null,
      last_period_date: profile.lastPeriodDate,
      current_week: profile.currentWeek,
      blood_type: profile.bloodType || null,
      rh_factor: profile.rhFactor || null,
      complications: profile.complications || [],
      medications: profile.medications || [],
      doctor_name: profile.doctorName || null,
      doctor_phone: profile.doctorPhone || null,
      hospital: profile.hospital || null,
      birth_plan: profile.birthPlan || null,
      partners: profile.partners || [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    console.log('[PregnancyStore] Pregnancy profile synced to Supabase');
  } catch (error) {
    console.warn('[PregnancyStore] Pregnancy profile sync failed (non-critical):', error);
  }
};

const syncPostpartumProfile = async (profile: PostpartumProfile) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('postpartum_profiles').upsert({
      user_id: user.id,
      baby_id: profile.babyId || null,
      delivery_date: profile.deliveryDate,
      delivery_type: profile.deliveryType,
      complications: profile.complications || [],
      is_breastfeeding: profile.isBreastfeeding,
      is_pumping: profile.isPumping,
      six_week_checkup: profile.sixWeekCheckup || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    console.log('[PregnancyStore] Postpartum profile synced to Supabase');
  } catch (error) {
    console.warn('[PregnancyStore] Postpartum profile sync failed (non-critical):', error);
  }
};

const syncPregnancyDayLog = async (log: PregnancyDayLog) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('pregnancy_day_logs').upsert({
      user_id: user.id,
      date: log.date,
      week: log.week,
      symptoms: log.symptoms,
      mood: log.mood,
      weight: log.weight || null,
      blood_pressure: log.bloodPressure || null,
      kick_count: log.kickCount || null,
      water_intake: log.waterIntake || null,
      sleep: log.sleep || null,
      exercise: log.exercise || null,
      notes: log.notes || null,
    }, { onConflict: 'user_id,date' });

    console.log('[PregnancyStore] Pregnancy day log synced for:', log.date);
  } catch (error) {
    console.warn('[PregnancyStore] Pregnancy day log sync failed (non-critical):', error);
  }
};

const syncPostpartumDayLog = async (log: PostpartumDayLog) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('postpartum_day_logs').upsert({
      user_id: user.id,
      date: log.date,
      weeks_postpartum: log.weeksPostpartum,
      symptoms: log.symptoms,
      mood: log.mood,
      weight: log.weight || null,
      blood_pressure: log.bloodPressure || null,
      bleeding_level: log.bleedingLevel || null,
      sleep: log.sleep || null,
      exercise: log.exercise || null,
      notes: log.notes || null,
    }, { onConflict: 'user_id,date' });

    console.log('[PregnancyStore] Postpartum day log synced for:', log.date);
  } catch (error) {
    console.warn('[PregnancyStore] Postpartum day log sync failed (non-critical):', error);
  }
};

const syncAppointment = async (appointment: PregnancyAppointment) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('pregnancy_appointments').upsert({
      id: appointment.id,
      user_id: user.id,
      date: appointment.date,
      type: appointment.type,
      provider: appointment.provider || null,
      notes: appointment.notes || null,
      weight: appointment.weight || null,
      blood_pressure: appointment.bloodPressure || null,
      baby_heart_rate: appointment.babyHeartRate || null,
      fundal_height: appointment.measurements?.fundalHeight || null,
      estimated_weight: appointment.measurements?.estimatedWeight || null,
      next_appointment: appointment.nextAppointment || null,
      updated_at: new Date().toISOString(),
    });

    console.log('[PregnancyStore] Appointment synced:', appointment.id);
  } catch (error) {
    console.warn('[PregnancyStore] Appointment sync failed (non-critical):', error);
  }
};

const syncKickCountSession = async (session: KickCountSession) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('kick_count_sessions').upsert({
      id: session.id,
      user_id: user.id,
      date: session.date,
      start_time: session.startTime,
      end_time: session.endTime || null,
      kick_count: session.kickCount,
      duration: session.duration || null,
      notes: session.notes || null,
    });

    console.log('[PregnancyStore] Kick count session synced:', session.id);
  } catch (error) {
    console.warn('[PregnancyStore] Kick count sync failed (non-critical):', error);
  }
};

const syncContractionTimer = async (timer: ContractionTimer) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('contraction_timers').upsert({
      id: timer.id,
      user_id: user.id,
      date: timer.date,
      contractions: timer.contractions,
      notes: timer.notes || null,
    });

    console.log('[PregnancyStore] Contraction timer synced:', timer.id);
  } catch (error) {
    console.warn('[PregnancyStore] Contraction timer sync failed (non-critical):', error);
  }
};

const syncAssessmentResult = async (result: PostpartumAssessmentResult) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('postpartum_assessments').insert({
      user_id: user.id,
      date: result.date,
      responses: result.responses,
      score: result.score,
      level: result.level,
      warnings: result.warnings,
      weeks_postpartum: result.weeksPostpartum,
    });

    console.log('[PregnancyStore] Assessment result synced');
  } catch (error) {
    console.warn('[PregnancyStore] Assessment sync failed (non-critical):', error);
  }
};

export const usePregnancyStore = create<PregnancyStore>()(
  persist(
    (set, get) => ({
      mode: null,
      pregnancyProfile: null,
      postpartumProfile: null,
      pregnancyDayLogs: [],
      postpartumDayLogs: [],
      appointments: [],
      kickCountSessions: [],
      contractionTimers: [],
      babies: [],
      babyFeedings: [],
      babySleeps: [],
      babyDiapers: [],
      breastfeedingSessions: [],
      assessmentResults: [],
      isLoading: false,
      
      setMode: (mode) => set({ mode }),
      
      setPregnancyProfile: (profile) => {
        set({ pregnancyProfile: profile });
        void syncPregnancyProfile(profile);
      },
      
      setPostpartumProfile: (profile) => {
        set({ postpartumProfile: profile });
        void syncPostpartumProfile(profile);
      },
      
      addPregnancyDayLog: (log) => {
        const existing = get().pregnancyDayLogs.find(l => l.date === log.date);
        if (existing) {
          set({
            pregnancyDayLogs: get().pregnancyDayLogs.map(l =>
              l.date === log.date ? log : l
            ),
          });
        } else {
          set({ pregnancyDayLogs: [...get().pregnancyDayLogs, log] });
        }
        void syncPregnancyDayLog(log);
      },
      
      updatePregnancyDayLog: (id, log) => {
        const updated = get().pregnancyDayLogs.map(l =>
          l.id === id ? { ...l, ...log } : l
        );
        set({ pregnancyDayLogs: updated });
        const updatedLog = updated.find(l => l.id === id);
        if (updatedLog) {
          void syncPregnancyDayLog(updatedLog);
        }
      },
      
      addPostpartumDayLog: (log) => {
        const existing = get().postpartumDayLogs.find(l => l.date === log.date);
        if (existing) {
          set({
            postpartumDayLogs: get().postpartumDayLogs.map(l =>
              l.date === log.date ? log : l
            ),
          });
        } else {
          set({ postpartumDayLogs: [...get().postpartumDayLogs, log] });
        }
        void syncPostpartumDayLog(log);
      },
      
      updatePostpartumDayLog: (id, log) => {
        const updated = get().postpartumDayLogs.map(l =>
          l.id === id ? { ...l, ...log } : l
        );
        set({ postpartumDayLogs: updated });
        const updatedLog = updated.find(l => l.id === id);
        if (updatedLog) {
          void syncPostpartumDayLog(updatedLog);
        }
      },
      
      addAppointment: (appointment) => {
        set({ appointments: [...get().appointments, appointment] });
        void syncAppointment(appointment);
      },
      
      updateAppointment: (id, appointment) => {
        const updated = get().appointments.map(a =>
          a.id === id ? { ...a, ...appointment } : a
        );
        set({ appointments: updated });
        const updatedAppt = updated.find(a => a.id === id);
        if (updatedAppt) {
          void syncAppointment(updatedAppt);
        }
      },
      
      deleteAppointment: (id) => {
        set({ appointments: get().appointments.filter(a => a.id !== id) });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('pregnancy_appointments').delete().eq('id', id).eq('user_id', user.id);
            console.log('[PregnancyStore] Appointment deleted from Supabase');
          } catch (error) {
            console.warn('[PregnancyStore] Appointment delete sync failed:', error);
          }
        })();
      },
      
      addKickCountSession: (session) => {
        set({ kickCountSessions: [...get().kickCountSessions, session] });
        void syncKickCountSession(session);
      },
      
      updateKickCountSession: (id, session) => {
        const updated = get().kickCountSessions.map(s =>
          s.id === id ? { ...s, ...session } : s
        );
        set({ kickCountSessions: updated });
        const updatedSession = updated.find(s => s.id === id);
        if (updatedSession) {
          void syncKickCountSession(updatedSession);
        }
      },
      
      addContractionTimer: (timer) => {
        set({ contractionTimers: [...get().contractionTimers, timer] });
        void syncContractionTimer(timer);
      },
      
      addContractionToTimer: (timerId, contraction) => {
        const updated = get().contractionTimers.map(t =>
          t.id === timerId
            ? { ...t, contractions: [...t.contractions, contraction] }
            : t
        );
        set({ contractionTimers: updated });
        const updatedTimer = updated.find(t => t.id === timerId);
        if (updatedTimer) {
          void syncContractionTimer(updatedTimer);
        }
      },
      
      updateContraction: (timerId, contractionId, contraction) => {
        const updated = get().contractionTimers.map(t =>
          t.id === timerId
            ? {
                ...t,
                contractions: t.contractions.map(c =>
                  c.id === contractionId ? { ...c, ...contraction } : c
                ),
              }
            : t
        );
        set({ contractionTimers: updated });
        const updatedTimer = updated.find(t => t.id === timerId);
        if (updatedTimer) {
          void syncContractionTimer(updatedTimer);
        }
      },
      
      addBaby: (baby) => {
        set({ babies: [...get().babies, baby] });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('baby_profiles').upsert({
              id: baby.id,
              user_id: user.id,
              name: baby.name,
              birth_date: baby.birthDate,
              birth_weight: baby.birthWeight,
              birth_length: baby.birthLength,
              gender: baby.gender || null,
              blood_type: baby.bloodType || null,
            });
            console.log('[PregnancyStore] Baby profile synced:', baby.name);
          } catch (error) {
            console.warn('[PregnancyStore] Baby profile sync failed:', error);
          }
        })();
      },
      
      updateBaby: (id, baby) => {
        const updated = get().babies.map(b => (b.id === id ? { ...b, ...baby } : b));
        set({ babies: updated });
        const updatedBaby = updated.find(b => b.id === id);
        if (updatedBaby) {
          void (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('baby_profiles').update({
                name: updatedBaby.name,
                birth_date: updatedBaby.birthDate,
                birth_weight: updatedBaby.birthWeight,
                birth_length: updatedBaby.birthLength,
                gender: updatedBaby.gender || null,
                blood_type: updatedBaby.bloodType || null,
                updated_at: new Date().toISOString(),
              }).eq('id', id).eq('user_id', user.id);
            } catch (error) {
              console.warn('[PregnancyStore] Baby update sync failed:', error);
            }
          })();
        }
      },
      
      addBabyFeeding: (feeding) => {
        set({ babyFeedings: [...get().babyFeedings, feeding] });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('baby_feedings').insert({
              user_id: user.id,
              baby_id: feeding.babyId,
              date: feeding.date,
              time: feeding.time,
              type: feeding.type,
              duration: feeding.duration || null,
              amount: feeding.amount || null,
              breast: feeding.breast || null,
              notes: feeding.notes || null,
            });
          } catch (error) {
            console.warn('[PregnancyStore] Baby feeding sync failed:', error);
          }
        })();
      },
      
      addBabySleep: (sleep) => {
        set({ babySleeps: [...get().babySleeps, sleep] });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('baby_sleep_logs').insert({
              user_id: user.id,
              baby_id: sleep.babyId,
              date: sleep.date,
              start_time: sleep.startTime,
              end_time: sleep.endTime || null,
              duration: sleep.duration || null,
              quality: sleep.quality,
              location: sleep.location || null,
              notes: sleep.notes || null,
            });
          } catch (error) {
            console.warn('[PregnancyStore] Baby sleep sync failed:', error);
          }
        })();
      },
      
      updateBabySleep: (id, sleep) => {
        set({
          babySleeps: get().babySleeps.map(s =>
            s.id === id ? { ...s, ...sleep } : s
          ),
        });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const updateData: Record<string, unknown> = {};
            if (sleep.endTime !== undefined) updateData.end_time = sleep.endTime;
            if (sleep.duration !== undefined) updateData.duration = sleep.duration;
            if (sleep.quality !== undefined) updateData.quality = sleep.quality;
            if (Object.keys(updateData).length > 0) {
              await supabase.from('baby_sleep_logs').update(updateData).eq('id', id).eq('user_id', user.id);
            }
          } catch (error) {
            console.warn('[PregnancyStore] Baby sleep update sync failed:', error);
          }
        })();
      },
      
      addBabyDiaper: (diaper) => {
        set({ babyDiapers: [...get().babyDiapers, diaper] });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('baby_diaper_logs').insert({
              user_id: user.id,
              baby_id: diaper.babyId,
              date: diaper.date,
              time: diaper.time,
              type: diaper.type,
              notes: diaper.notes || null,
            });
          } catch (error) {
            console.warn('[PregnancyStore] Baby diaper sync failed:', error);
          }
        })();
      },
      
      addBreastfeedingSession: (session) => {
        set({ breastfeedingSessions: [...get().breastfeedingSessions, session] });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('breastfeeding_sessions').insert({
              user_id: user.id,
              baby_id: session.babyId || null,
              date: session.date,
              start_time: session.startTime,
              end_time: session.endTime || null,
              duration: session.duration || null,
              breast: session.breast,
              notes: session.notes || null,
              pumped_amount: session.pumpedAmount || null,
            });
          } catch (error) {
            console.warn('[PregnancyStore] Breastfeeding session sync failed:', error);
          }
        })();
      },
      
      updateBreastfeedingSession: (id, session) => {
        set({
          breastfeedingSessions: get().breastfeedingSessions.map(s =>
            s.id === id ? { ...s, ...session } : s
          ),
        });
        void (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const updateData: Record<string, unknown> = {};
            if (session.endTime !== undefined) updateData.end_time = session.endTime;
            if (session.duration !== undefined) updateData.duration = session.duration;
            if (session.pumpedAmount !== undefined) updateData.pumped_amount = session.pumpedAmount;
            if (Object.keys(updateData).length > 0) {
              await supabase.from('breastfeeding_sessions').update(updateData).eq('id', id).eq('user_id', user.id);
            }
          } catch (error) {
            console.warn('[PregnancyStore] Breastfeeding update sync failed:', error);
          }
        })();
      },
      
      addAssessmentResult: (result) => {
        const updated = [...get().assessmentResults, result].slice(-30);
        set({ assessmentResults: updated });
        console.log('[PregnancyStore] Assessment result saved, total:', updated.length);
        void syncAssessmentResult(result);
      },
      
      getLatestAssessment: () => {
        const results = get().assessmentResults;
        return results.length > 0 ? results[results.length - 1] : null;
      },
      
      getCurrentWeek: () => {
        const profile = get().pregnancyProfile;
        if (!profile || !profile.lastPeriodDate) return 0;
        
        const lastPeriod = new Date(profile.lastPeriodDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(diffDays / 7);
        
        return Math.min(weeks, 42);
      },
      
      getDaysUntilDue: () => {
        const profile = get().pregnancyProfile;
        if (!profile || !profile.dueDate) return 0;
        
        const dueDate = new Date(profile.dueDate);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
      },
      
      getWeeksPostpartum: () => {
        const profile = get().postpartumProfile;
        if (!profile || !profile.deliveryDate) return 0;
        
        const deliveryDate = new Date(profile.deliveryDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - deliveryDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(diffDays / 7);
        
        return weeks;
      },

      loadFromSupabase: async () => {
        try {
          set({ isLoading: true });
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ isLoading: false });
            return;
          }

          const { data: pregProfile } = await supabase
            .from('pregnancy_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (pregProfile) {
            const profile: PregnancyProfile = {
              id: pregProfile.id,
              userId: pregProfile.user_id,
              dueDate: pregProfile.due_date,
              conceptionDate: pregProfile.conception_date || undefined,
              lastPeriodDate: pregProfile.last_period_date,
              currentWeek: pregProfile.current_week || 0,
              bloodType: pregProfile.blood_type || undefined,
              rhFactor: pregProfile.rh_factor || undefined,
              complications: pregProfile.complications || undefined,
              medications: pregProfile.medications || undefined,
              doctorName: pregProfile.doctor_name || undefined,
              doctorPhone: pregProfile.doctor_phone || undefined,
              hospital: pregProfile.hospital || undefined,
              birthPlan: pregProfile.birth_plan || undefined,
              partners: pregProfile.partners || undefined,
              createdAt: pregProfile.created_at,
              updatedAt: pregProfile.updated_at,
            };
            set({ pregnancyProfile: profile });
            console.log('[PregnancyStore] Pregnancy profile loaded from Supabase');
          }

          const { data: ppProfile } = await supabase
            .from('postpartum_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (ppProfile) {
            const profile: PostpartumProfile = {
              id: ppProfile.id,
              userId: ppProfile.user_id,
              babyId: ppProfile.baby_id || '',
              deliveryDate: ppProfile.delivery_date,
              deliveryType: ppProfile.delivery_type,
              complications: ppProfile.complications || undefined,
              isBreastfeeding: ppProfile.is_breastfeeding,
              isPumping: ppProfile.is_pumping,
              sixWeekCheckup: ppProfile.six_week_checkup || undefined,
              createdAt: ppProfile.created_at,
              updatedAt: ppProfile.updated_at,
            };
            set({ postpartumProfile: profile });
            console.log('[PregnancyStore] Postpartum profile loaded from Supabase');
          }

          const { data: pregLogs } = await supabase
            .from('pregnancy_day_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

          if (pregLogs && pregLogs.length > 0) {
            const serverLogs: PregnancyDayLog[] = pregLogs.map(row => ({
              id: row.id,
              date: row.date,
              week: row.week || 0,
              symptoms: row.symptoms || [],
              mood: row.mood || 'peaceful',
              weight: row.weight || undefined,
              bloodPressure: row.blood_pressure || undefined,
              kickCount: row.kick_count || undefined,
              waterIntake: row.water_intake || undefined,
              sleep: row.sleep || undefined,
              exercise: row.exercise || undefined,
              notes: row.notes || undefined,
            }));
            const localLogs = get().pregnancyDayLogs;
            const merged = [...serverLogs];
            for (const local of localLogs) {
              if (!merged.find(m => m.date === local.date)) {
                merged.push(local);
              }
            }
            merged.sort((a, b) => b.date.localeCompare(a.date));
            set({ pregnancyDayLogs: merged.slice(0, 90) });
            console.log('[PregnancyStore] Pregnancy day logs loaded, total:', merged.length);
          }

          const { data: ppLogs } = await supabase
            .from('postpartum_day_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(90);

          if (ppLogs && ppLogs.length > 0) {
            const serverLogs: PostpartumDayLog[] = ppLogs.map(row => ({
              id: row.id,
              date: row.date,
              weeksPostpartum: row.weeks_postpartum || 0,
              symptoms: row.symptoms || [],
              mood: row.mood || 'peaceful',
              weight: row.weight || undefined,
              bloodPressure: row.blood_pressure || undefined,
              bleedingLevel: row.bleeding_level || undefined,
              sleep: row.sleep || undefined,
              exercise: row.exercise || undefined,
              notes: row.notes || undefined,
            }));
            const localLogs = get().postpartumDayLogs;
            const merged = [...serverLogs];
            for (const local of localLogs) {
              if (!merged.find(m => m.date === local.date)) {
                merged.push(local);
              }
            }
            merged.sort((a, b) => b.date.localeCompare(a.date));
            set({ postpartumDayLogs: merged.slice(0, 90) });
            console.log('[PregnancyStore] Postpartum day logs loaded, total:', merged.length);
          }

          const { data: appts } = await supabase
            .from('pregnancy_appointments')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (appts && appts.length > 0) {
            const serverAppts: PregnancyAppointment[] = appts.map(row => ({
              id: row.id,
              date: row.date,
              type: row.type,
              provider: row.provider || '',
              notes: row.notes || undefined,
              weight: row.weight || undefined,
              bloodPressure: row.blood_pressure || undefined,
              babyHeartRate: row.baby_heart_rate || undefined,
              measurements: (row.fundal_height || row.estimated_weight) ? {
                fundalHeight: row.fundal_height || undefined,
                estimatedWeight: row.estimated_weight || undefined,
              } : undefined,
              nextAppointment: row.next_appointment || undefined,
            }));
            set({ appointments: serverAppts });
            console.log('[PregnancyStore] Appointments loaded, total:', serverAppts.length);
          }

          const { data: assessments } = await supabase
            .from('postpartum_assessments')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(30);

          if (assessments && assessments.length > 0) {
            const serverResults: PostpartumAssessmentResult[] = assessments.map(row => ({
              id: row.id,
              date: row.date,
              responses: row.responses || {},
              score: row.score,
              level: row.level,
              warnings: row.warnings || [],
              weeksPostpartum: row.weeks_postpartum || 0,
              timestamp: row.created_at,
            }));
            set({ assessmentResults: serverResults });
            console.log('[PregnancyStore] Assessments loaded, total:', serverResults.length);
          }

          set({ isLoading: false });
          console.log('[PregnancyStore] Full load from Supabase complete');
        } catch (error) {
          console.warn('[PregnancyStore] Load from Supabase failed:', error);
          set({ isLoading: false });
        }
      },
      
      clearAllData: () => {
        set({
          mode: null,
          pregnancyProfile: null,
          postpartumProfile: null,
          pregnancyDayLogs: [],
          postpartumDayLogs: [],
          appointments: [],
          kickCountSessions: [],
          contractionTimers: [],
          babies: [],
          babyFeedings: [],
          babySleeps: [],
          babyDiapers: [],
          breastfeedingSessions: [],
          assessmentResults: [],
        });
      },
    }),
    {
      name: 'pregnancy-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
