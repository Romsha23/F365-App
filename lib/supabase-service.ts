import { supabase, SexualActivityLogRow } from './supabase';
import { 
  CycleType, 
  DayDataType, 
  PredictionsType, 
  InsightType,
  SymptomWithIntensity 
} from '../types/cycle';
import { UserProfile } from '../types/user';
import { MoodPrediction } from '../types/mood-prediction';

export interface SexualActivityLogInput {
  date: string;
  protected: boolean;
  protectionType?: string | null;
  libido?: 'low' | 'moderate' | 'high' | null;
  comfort?: 'comfortable' | 'some_discomfort' | 'painful' | null;
  orgasm?: boolean | null;
  notes?: string | null;
  cyclePhase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown' | null;
}

export const supabaseService = {
  users: {
    async create(profile: Partial<UserProfile>) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          onboarded: profile.onboarded ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async get() {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async update(updates: Partial<UserProfile>) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      const updateData: any = {};

      if (updates.onboarded !== undefined) {
        updateData.onboarded = updates.onboarded;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },

  cycles: {
    async create(cycle: CycleType) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }
      
      for (const day of cycle.days) {
        const dayDate = new Date(day.date).toISOString().split('T')[0];
        
        await supabase
          .from('symptom_logs')
          .upsert({
            user_id: userId,
            date: dayDate,
            flow_intensity: day.flow || null,
            moods: day.mood ? [day.mood] : [],
            notes: day.notes || null,
            discharge_type: day.discharge || null,
            pain_level: day.painLevel || null,
            cravings: day.cravings || [],
            symptoms: day.symptomsWithIntensity || [],
          }, {
            onConflict: 'user_id,date'
          });
      }

      return cycle;
    },

    async getAll() {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      const cycleMap = new Map<string, CycleType>();
      
      if (!data) return [];

      for (const log of data) {
        const logDate = new Date(log.date);
        const cycleKey = `${logDate.getFullYear()}-${Math.floor(logDate.getMonth() / 1)}`;
        
        const dayData: DayDataType = {
          date: log.date,
          flow: log.flow_intensity as any,
          mood: log.moods?.[0] as any,
          notes: log.notes || undefined,
          discharge: log.discharge_type as any,
          painLevel: log.pain_level as any,
          cravings: log.cravings as any,
          symptomsWithIntensity: log.symptoms as SymptomWithIntensity[],
        };

        if (!cycleMap.has(cycleKey)) {
          cycleMap.set(cycleKey, {
            id: cycleKey,
            startDate: log.date,
            days: [],
            userId,
          });
        }

        cycleMap.get(cycleKey)!.days.push(dayData);
      }

      return Array.from(cycleMap.values()).sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    },

    async addDayData(date: string, dayData: DayDataType) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      const dayDate = new Date(date).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('symptom_logs')
        .upsert({
          user_id: userId,
          date: dayDate,
          flow_intensity: dayData.flow || null,
          moods: dayData.mood ? [dayData.mood] : [],
          notes: dayData.notes || null,
          discharge_type: dayData.discharge || null,
          pain_level: dayData.painLevel || null,
          cravings: dayData.cravings || [],
          symptoms: dayData.symptomsWithIntensity || [],
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },

  predictions: {
    async create(prediction: PredictionsType) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('predictions')
        .upsert({
          user_id: userId,
          next_period_date: new Date(prediction.nextPeriodDate).toISOString().split('T')[0],
          fertile_window_start: new Date(prediction.fertileWindowStart).toISOString().split('T')[0],
          fertile_window_end: new Date(prediction.fertileWindowEnd).toISOString().split('T')[0],
          average_cycle_length: prediction.averageCycleLength,
          average_period_length: prediction.averagePeriodLength,
          confidence: prediction.confidence,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async get() {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return null;
      }

      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) return null;

      return {
        nextPeriodDate: data.next_period_date,
        fertileWindowStart: data.fertile_window_start,
        fertileWindowEnd: data.fertile_window_end,
        averageCycleLength: data.average_cycle_length,
        averagePeriodLength: data.average_period_length,
        confidence: data.confidence,
      } as PredictionsType;
    },
  },

  insights: {
    async create(insight: InsightType) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('ai_insights')
        .insert({
          user_id: userId,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          icon: '🔮',
          color: '#8B5CF6',
          read: insight.read,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getAll() {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        type: item.type as any,
        title: item.title,
        description: item.description,
        date: item.created_at,
        read: item.read,
      } as InsightType));
    },

    async markAsRead(insightId: string) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        console.log('No authenticated user - skipping markAsRead for database');
        return;
      }

      const { error } = await supabase
        .from('ai_insights')
        .update({ read: true })
        .eq('id', insightId)
        .eq('user_id', userId);

      if (error) throw error;
    },
  },

  sexualActivityLogs: {
    async upsert(log: SexualActivityLogInput) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('No authenticated user');

      const logDate = new Date(log.date).toISOString().split('T')[0];
      console.log('[SupabaseService] sexualActivityLogs.upsert for date:', logDate);

      const { data, error } = await supabase
        .from('sexual_activity_logs')
        .upsert({
          user_id: userId,
          date: logDate,
          protected: log.protected,
          protection_type: log.protectionType || null,
          libido: log.libido || null,
          comfort: log.comfort || null,
          orgasm: log.orgasm ?? null,
          notes: log.notes || null,
          cycle_phase: log.cyclePhase || 'unknown',
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) {
        console.log('[SupabaseService] sexualActivityLogs.upsert failed:', error.message);
        throw error;
      }
      console.log('[SupabaseService] sexualActivityLogs.upsert success:', data?.id);
      return data;
    },

    async getAll(): Promise<SexualActivityLogRow[]> {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('sexual_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.log('[SupabaseService] sexualActivityLogs.getAll failed:', error.message);
        return [];
      }
      return data || [];
    },

    async getByDateRange(startDate: string, endDate: string): Promise<SexualActivityLogRow[]> {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('sexual_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.log('[SupabaseService] sexualActivityLogs.getByDateRange failed:', error.message);
        return [];
      }
      return data || [];
    },

    async delete(logId: string) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('sexual_activity_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', userId);

      if (error) throw error;
    },
  },

  moodPredictions: {
    async create(prediction: MoodPrediction) {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        
        if (!userId) {
          return null;
        }

        const { data, error } = await supabase
          .from('ai_predictions')
          .insert({
            user_id: userId,
            predicted_mood: prediction.moodScore,
            confidence: prediction.confidence,
            prediction_date: new Date(prediction.date).toISOString().split('T')[0],
            prediction_type: 'mood',
            metadata: {
              mood: prediction.mood,
              reason: prediction.reason,
              factors: prediction.factors,
              symptoms: prediction.symptoms,
              suggestions: prediction.suggestions,
            },
          })
          .select()
          .single();

        if (error) {
          console.log('[SupabaseService] moodPredictions.create failed:', error.message);
          return null;
        }
        return data;
      } catch (err) {
        console.log('[SupabaseService] moodPredictions.create error:', err);
        return null;
      }
    },

    async getAll(): Promise<MoodPrediction[]> {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        
        if (!userId) {
          return [];
        }

        const { data, error } = await supabase
          .from('ai_predictions')
          .select('*')
          .eq('user_id', userId)
          .eq('prediction_type', 'mood')
          .order('prediction_date', { ascending: true });

        if (error) {
          console.log('[SupabaseService] moodPredictions.getAll failed:', error.message);
          return [];
        }
        
        return (data || []).map(item => ({
          id: item.id,
          date: item.prediction_date,
          mood: item.metadata?.mood,
          moodScore: item.predicted_mood,
          confidence: item.confidence,
          reason: item.metadata?.reason,
          factors: item.metadata?.factors || [],
          symptoms: item.metadata?.symptoms || [],
          suggestions: item.metadata?.suggestions || [],
        } as MoodPrediction));
      } catch (err) {
        console.log('[SupabaseService] moodPredictions.getAll error:', err);
        return [];
      }
    },
  },
};
