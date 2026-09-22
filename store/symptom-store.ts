import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { CustomSymptom, SymptomWithIntensity } from '../types/cycle';

interface SymptomStore {
  customSymptoms: CustomSymptom[];
  isLoading: boolean;
  error: string | null;
  
  loadCustomSymptoms: (userId: string) => Promise<void>;
  addCustomSymptom: (userId: string, name: string) => Promise<void>;
  removeCustomSymptom: (symptomId: string) => Promise<void>;
  clearError: () => void;
}

export const useSymptomStore = create<SymptomStore>()(
  persist(
    (set, get) => ({
      customSymptoms: [],
      isLoading: false,
      error: null,

      loadCustomSymptoms: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase
            .from('custom_symptoms')
            .select('*')
            .eq('user_id', userId);
          
          if (error) {
            console.error('Error loading custom symptoms:', error);
            set({ error: error.message, isLoading: false });
            return;
          }
          
          const symptoms: CustomSymptom[] = (data || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            name: item.name,
            createdAt: item.created_at,
          }));
          
          set({ customSymptoms: symptoms, isLoading: false });
        } catch (error) {
          console.error('Error loading custom symptoms:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load custom symptoms',
            isLoading: false 
          });
        }
      },

      addCustomSymptom: async (userId: string, name: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase
            .from('custom_symptoms')
            .insert([{ user_id: userId, name }])
            .select()
            .single();
          
          if (error) {
            console.error('Error adding custom symptom:', error);
            set({ error: error.message, isLoading: false });
            return;
          }
          
          const newSymptom: CustomSymptom = {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            createdAt: data.created_at,
          };
          
          set({ 
            customSymptoms: [...get().customSymptoms, newSymptom],
            isLoading: false 
          });
        } catch (error) {
          console.error('Error adding custom symptom:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add custom symptom',
            isLoading: false 
          });
        }
      },

      removeCustomSymptom: async (symptomId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { error } = await supabase
            .from('custom_symptoms')
            .delete()
            .eq('id', symptomId);
          
          if (error) {
            console.error('Error removing custom symptom:', error);
            set({ error: error.message, isLoading: false });
            return;
          }
          
          set({ 
            customSymptoms: get().customSymptoms.filter(s => s.id !== symptomId),
            isLoading: false 
          });
        } catch (error) {
          console.error('Error removing custom symptom:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove custom symptom',
            isLoading: false 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'symptom-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        customSymptoms: state.customSymptoms,
      }),
    }
  )
);

export const saveSymptomLog = async (
  userId: string,
  date: string,
  cycleDay: number | null,
  symptomsWithIntensity: SymptomWithIntensity[],
  moods: string[],
  notes: string,
  flowIntensity?: string,
  dischargeType?: string,
  painLevel?: string,
  cravings?: string[]
) => {
  try {
    const symptoms = symptomsWithIntensity.map(s => ({
      id: s.id,
      intensity: s.intensity,
      isCustom: s.isCustom,
    }));

    const { data, error } = await supabase
      .from('symptom_logs')
      .upsert([
        {
          user_id: userId,
          date,
          cycle_day: cycleDay,
          symptoms,
          moods,
          notes: notes || null,
          flow_intensity: flowIntensity || null,
          discharge_type: dischargeType || null,
          pain_level: painLevel || null,
          cravings: cravings || [],
        },
      ], {
        onConflict: 'user_id,date',
      })
      .select();

    if (error) {
      console.log('[Supabase] Failed to sync symptom log (data saved locally):', error.message);
      return null;
    }

    console.log('[Supabase] Symptom log synced successfully');
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[Supabase] Failed to sync symptom log (data saved locally):', errorMessage);
    return null;
  }
};

export const getSymptomLogs = async (
  userId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    let query = supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting symptom logs:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error getting symptom logs:', error);
    throw error;
  }
};
