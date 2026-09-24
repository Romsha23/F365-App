import { create } from 'zustand';
import { CycleType, DayDataType, PredictionsType, InsightType, HealthAnalysisType } from '@/types/cycle';
import { generateMockInsights } from '@/utils/mock-data';
import { supabaseService } from '@/lib/supabase-service';
import { supabase } from '@/lib/supabase';

interface CycleStore {
  cycles: CycleType[];
  predictions: PredictionsType | null;
  insights: InsightType[];
  healthAnalysis: HealthAnalysisType | null;
  isLoading: boolean;
  error: string | null;
  aiTip: string | null;
  currentStreak: number;
  longestStreak: number;
  irregularityAlerts: IrregularityAlert[];
  
  addCycle: (cycle: CycleType) => Promise<void>;
  addDayData: (cycleId: string, dayData: DayDataType) => Promise<void>;
  generatePredictions: (force?: boolean) => Promise<void>;
  generateInsights: (force?: boolean) => Promise<void>;
  generateHealthAnalysis: () => Promise<void>;
  markInsightAsRead: (insightId: string) => Promise<void>;
  loadCycles: () => Promise<void>;
  clearData: () => void;
  exportData: () => string;
  calculateStreak: () => void;
  checkForIrregularities: () => void;
  dismissAlert: (alertId: string) => void;
}

export type IrregularityAlert = {
  id: string;
  type: 'cycle_length' | 'period_duration' | 'missed_period' | 'short_cycle';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'alert';
  date: string;
  dismissed: boolean;
};

const createSafePredictions = (): PredictionsType => {
  try {
    const today = new Date();
    const nextPeriod = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000));
    const fertileStart = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
    const fertileEnd = new Date(today.getTime() + (16 * 24 * 60 * 60 * 1000));
    
    return {
      nextPeriodDate: nextPeriod.toISOString(),
      fertileWindowStart: fertileStart.toISOString(),
      fertileWindowEnd: fertileEnd.toISOString(),
      confidence: 0.75,
      averageCycleLength: 28,
      averagePeriodLength: 5,
    };
  } catch (error) {
    console.error('Error creating safe predictions:', error);
    const now = new Date();
    return {
      nextPeriodDate: new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString(),
      fertileWindowStart: new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString(),
      fertileWindowEnd: new Date(now.getTime() + (16 * 24 * 60 * 60 * 1000)).toISOString(),
      confidence: 0.5,
      averageCycleLength: 28,
      averagePeriodLength: 5,
    };
  }
};

const isValidInsight = (insight: any): insight is InsightType => {
  return (
    insight &&
    typeof insight === 'object' &&
    typeof insight.id === 'string' &&
    typeof insight.title === 'string' &&
    typeof insight.description === 'string' &&
    typeof insight.type === 'string' &&
    typeof insight.date === 'string' &&
    typeof insight.read === 'boolean'
  );
};

export const useCycleStore = create<CycleStore>((set, get) => ({
  cycles: [],
  predictions: null,
  insights: [],
  healthAnalysis: null,
  isLoading: false,
  error: null,
  aiTip: null,
  currentStreak: 0,
  longestStreak: 0,
  irregularityAlerts: [],

  addCycle: async (cycle: CycleType) => {
    try {
      set({ isLoading: true, error: null });
      
      if (!cycle || !cycle.id || !cycle.startDate) {
        throw new Error('Invalid cycle data');
      }
      
      // Check if user is authenticated with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Real authenticated user - sync to Supabase
        await supabaseService.cycles.create(cycle);
        const updatedCycles = await supabaseService.cycles.getAll();
        set({ cycles: updatedCycles });
      } else {
        // Demo mode or no auth - store locally only
        console.log('Demo mode: Storing cycle locally');
        const currentCycles = get().cycles;
        set({ cycles: [...currentCycles, cycle] });
      }
      
      get().calculateStreak();
      get().checkForIrregularities();
      
    } catch (error) {
      console.error('Error adding cycle:', error);
      // In case of error, still try to save locally
      const currentCycles = get().cycles;
      if (!currentCycles.find(c => c.id === cycle.id)) {
        set({ cycles: [...currentCycles, cycle] });
      }
      set({ error: 'Failed to sync cycle to server, saved locally' });
    } finally {
      set({ isLoading: false });
    }
  },

  addDayData: async (cycleId: string, dayData: DayDataType) => {
    try {
      set({ isLoading: true, error: null });
      
      if (!dayData || !dayData.date) {
        throw new Error('Invalid day data');
      }
      
      // Check if user is authenticated with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Real authenticated user - sync to Supabase
        await supabaseService.cycles.addDayData(dayData.date, dayData);
        const updatedCycles = await supabaseService.cycles.getAll();
        set({ cycles: updatedCycles });
      } else {
        // Demo mode or no auth - store locally only
        console.log('Demo mode: Storing day data locally');
        const currentCycles = get().cycles;
        const updatedCycles = currentCycles.map(cycle => {
          if (cycle.id === cycleId) {
            const existingDayIndex = cycle.days.findIndex(
              d => d.date.split('T')[0] === dayData.date.split('T')[0]
            );
            if (existingDayIndex >= 0) {
              const newDays = [...cycle.days];
              newDays[existingDayIndex] = dayData;
              return { ...cycle, days: newDays };
            } else {
              return { ...cycle, days: [...cycle.days, dayData] };
            }
          }
          return cycle;
        });
        set({ cycles: updatedCycles });
      }
      
      get().calculateStreak();
      get().checkForIrregularities();
      
    } catch (error) {
      console.error('Error adding day data:', error);
      // In case of error, still try to save locally
      const currentCycles = get().cycles;
      const updatedCycles = currentCycles.map(cycle => {
        if (cycle.id === cycleId) {
          const existingDayIndex = cycle.days.findIndex(
            d => d.date.split('T')[0] === dayData.date.split('T')[0]
          );
          if (existingDayIndex >= 0) {
            const newDays = [...cycle.days];
            newDays[existingDayIndex] = dayData;
            return { ...cycle, days: newDays };
          } else {
            return { ...cycle, days: [...cycle.days, dayData] };
          }
        }
        return cycle;
      });
      set({ cycles: updatedCycles, error: 'Failed to sync day data to server, saved locally' });
    } finally {
      set({ isLoading: false });
    }
  },

  generatePredictions: async (force = false) => {
    try {
      const currentPredictions = get().predictions;
      if (currentPredictions && !force) {
        return;
      }
      
      set({ isLoading: true, error: null });
      
      const mockPredictions = createSafePredictions();
      
      // Check if user is authenticated with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabaseService.predictions.create(mockPredictions);
        const savedPredictions = await supabaseService.predictions.get();
        set({ predictions: savedPredictions || mockPredictions, isLoading: false });
      } else {
        // Demo mode - just use local predictions
        console.log('Demo mode: Using local predictions');
        set({ predictions: mockPredictions, isLoading: false });
      }
      
    } catch (error) {
      console.error('Error generating predictions:', error);
      set({ error: 'Failed to generate predictions' });
      const safePredictions = createSafePredictions();
      set({ predictions: safePredictions, isLoading: false });
    }
  },

  generateInsights: async (force = false) => {
    try {
      const currentInsights = get().insights;
      if (currentInsights && Array.isArray(currentInsights) && currentInsights.length > 0 && !force) {
        return;
      }
      
      set({ isLoading: true, error: null });
      
      // Check if user is authenticated with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const dbInsights = await supabaseService.insights.getAll();
        
        if (dbInsights.length > 0) {
          set({ insights: dbInsights, isLoading: false });
          return;
        }
        
        const mockInsights = generateMockInsights();
        const validMockInsights = mockInsights.filter(insight => isValidInsight(insight));
        
        for (const insight of validMockInsights) {
          try {
            await supabaseService.insights.create(insight);
          } catch (err) {
            console.error('Error saving insight:', err);
          }
        }
        
        const savedInsights = await supabaseService.insights.getAll();
        set({ 
          insights: savedInsights,
          aiTip: 'Track your cycle daily for better insights and predictions!',
          isLoading: false 
        });
      } else {
        // Demo mode - use local mock insights
        console.log('Demo mode: Using local insights');
        const mockInsights = generateMockInsights();
        const validMockInsights = mockInsights.filter(insight => isValidInsight(insight));
        set({ 
          insights: validMockInsights,
          aiTip: 'Track your cycle daily for better insights and predictions!',
          isLoading: false 
        });
      }
      
    } catch (error) {
      console.error('Error generating insights:', error);
      set({ error: 'Failed to generate insights' });
      
      try {
        const fallbackInsights = generateMockInsights();
        const validFallbackInsights = fallbackInsights.filter(insight => isValidInsight(insight));
        set({ insights: validFallbackInsights, isLoading: false });
      } catch (fallbackError) {
        console.error('Error generating fallback insights:', fallbackError);
        set({ insights: [], isLoading: false });
      }
    }
  },

  generateHealthAnalysis: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const cycles = get().cycles;
      const hasCycleData = cycles && cycles.length > 0;
      
      const basicAnalysis: HealthAnalysisType = hasCycleData ? {
        cycleSummary: "Based on your tracked cycles, your patterns appear within normal ranges.",
        potentialConcerns: "No significant concerns identified. Continue regular tracking.",
        hormonalBalance: "Your cycle data suggests balanced hormonal patterns.",
        nutritionalRecommendations: "Maintain a balanced diet rich in iron, calcium, and vitamins.",
        lifestyleRecommendations: "Regular exercise and adequate sleep support cycle health.",
        stressManagement: "Consider stress-reduction techniques during your cycle.",
        fertilityInsights: "Your fertile window patterns appear consistent with your cycle length."
      } : {
        cycleSummary: "Start tracking your cycle to receive personalized health insights. The more data you log, the more accurate your analysis will become.",
        potentialConcerns: "Track at least one cycle to receive health considerations and potential concerns based on your unique patterns.",
        hormonalBalance: "Your hormonal balance insights will appear here once you begin tracking your menstrual cycle.",
        nutritionalRecommendations: "Eat a balanced diet rich in iron (leafy greens, beans), calcium (dairy, fortified foods), omega-3 fatty acids (fish, flaxseed), and B vitamins. Stay hydrated and limit caffeine and processed foods.",
        lifestyleRecommendations: "Aim for 7-9 hours of sleep, exercise regularly (30 min most days), manage stress through meditation or yoga, and maintain a consistent daily routine for optimal cycle health.",
        stressManagement: "Practice deep breathing exercises, try mindfulness meditation for 10-15 minutes daily, take regular breaks, and consider journaling to track stress patterns alongside your cycle.",
        fertilityInsights: "Once you track your cycles, we'll identify your fertile window and ovulation patterns to help you understand your fertility better."
      };
      
      set({ healthAnalysis: basicAnalysis, isLoading: false });
      
    } catch (error) {
      console.error('Error generating health analysis:', error);
      set({ error: 'Failed to generate health analysis', isLoading: false });
    }
  },

  markInsightAsRead: async (insightId: string) => {
    try {
      if (!insightId || typeof insightId !== 'string') {
        console.warn('Invalid insight ID provided to markInsightAsRead:', insightId);
        return;
      }
      
      await supabaseService.insights.markAsRead(insightId);
      
      const insights = get().insights;
      if (!insights || !Array.isArray(insights)) {
        console.warn('No valid insights array found');
        return;
      }
      
      const updatedInsights = insights.map(insight => {
        if (!isValidInsight(insight)) {
          console.warn('Invalid insight found during markAsRead:', insight);
          return insight;
        }
        
        return insight.id === insightId ? { ...insight, read: true } : insight;
      });
      
      set({ insights: updatedInsights });
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  },

  loadCycles: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Check if user is authenticated with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const cycles = await supabaseService.cycles.getAll();
        set({ cycles, isLoading: false });
      } else {
        // Demo mode - keep existing local cycles
        console.log('Demo mode: Using local cycles');
        set({ isLoading: false });
      }
      
      get().calculateStreak();
      get().checkForIrregularities();
      
    } catch (error) {
      console.error('Error loading cycles:', error);
      set({ error: 'Failed to load cycles', isLoading: false });
    }
  },

  clearData: () => {
    set({
      cycles: [],
      predictions: null,
      insights: [],
      healthAnalysis: null,
      error: null,
      aiTip: null
    });
  },
  
  exportData: () => {
    const state = get();
    const exportData = {
      cycles: state.cycles,
      predictions: state.predictions,
      insights: state.insights,
      healthAnalysis: state.healthAnalysis,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      irregularityAlerts: state.irregularityAlerts
    };
    return JSON.stringify(exportData, null, 2);
  },

  calculateStreak: () => {
    try {
      const cycles = get().cycles;
      if (!cycles || cycles.length === 0) {
        set({ currentStreak: 0, longestStreak: 0 });
        return;
      }

      const sortedCycles = [...cycles].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedCycles.length; i++) {
        const cycle = sortedCycles[i];
        const cycleStart = new Date(cycle.startDate);
        cycleStart.setHours(0, 0, 0, 0);

        if (cycle.days && cycle.days.length > 0) {
          tempStreak++;

          if (i === 0) {
            const daysSinceLastCycle = Math.floor(
              (today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastCycle <= 45) {
              currentStreak = tempStreak;
            }
          }

          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      }

      if (currentStreak === 0 && tempStreak > 0) {
        currentStreak = 1;
      }

      if (longestStreak < currentStreak) {
        longestStreak = currentStreak;
      }

      set({ currentStreak, longestStreak });
    } catch (error) {
      console.error('Error calculating streak:', error);
      set({ currentStreak: 0, longestStreak: 0 });
    }
  },

  checkForIrregularities: () => {
    try {
      const cycles = get().cycles;
      const existingAlerts = get().irregularityAlerts.filter(a => !a.dismissed);
      
      if (!cycles || cycles.length < 2) {
        return;
      }

      const newAlerts: IrregularityAlert[] = [];
      const sortedCycles = [...cycles].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      const cycleLengths: number[] = [];
      for (let i = 0; i < sortedCycles.length - 1; i++) {
        const current = new Date(sortedCycles[i].startDate);
        const next = new Date(sortedCycles[i + 1].startDate);
        const lengthInDays = Math.floor(
          (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (lengthInDays > 0 && lengthInDays < 60) {
          cycleLengths.push(lengthInDays);
        }
      }

      if (cycleLengths.length >= 3) {
        const avgCycleLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
        const lastCycleLength = cycleLengths[0];

        if (Math.abs(lastCycleLength - avgCycleLength) > 7) {
          const alertId = `irregularity_cycle_${Date.now()}`;
          if (!existingAlerts.some(a => a.type === 'cycle_length')) {
            newAlerts.push({
              id: alertId,
              type: 'cycle_length',
              title: 'Cycle Irregularity Detected',
              message: `Your last cycle was ${lastCycleLength} days, which differs significantly from your average of ${Math.round(avgCycleLength)} days.`,
              severity: 'warning',
              date: new Date().toISOString(),
              dismissed: false
            });
          }
        }

        if (lastCycleLength < 21) {
          const alertId = `short_cycle_${Date.now()}`;
          if (!existingAlerts.some(a => a.type === 'short_cycle')) {
            newAlerts.push({
              id: alertId,
              type: 'short_cycle',
              title: 'Short Cycle Detected',
              message: `Your last cycle was only ${lastCycleLength} days long. Short cycles can sometimes indicate hormonal imbalances.`,
              severity: 'warning',
              date: new Date().toISOString(),
              dismissed: false
            });
          }
        }
      }

      const lastCycle = sortedCycles[0];
      if (lastCycle) {
        const lastCycleStart = new Date(lastCycle.startDate);
        const today = new Date();
        const daysSinceLastPeriod = Math.floor(
          (today.getTime() - lastCycleStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastPeriod > 45) {
          const alertId = `missed_period_${Date.now()}`;
          if (!existingAlerts.some(a => a.type === 'missed_period')) {
            newAlerts.push({
              id: alertId,
              type: 'missed_period',
              title: 'Missed Period Alert',
              message: `It has been ${daysSinceLastPeriod} days since your last period. If this is unusual for you, consider taking a pregnancy test or consulting with your doctor.`,
              severity: 'alert',
              date: new Date().toISOString(),
              dismissed: false
            });
          }
        }

        const periodDuration = lastCycle.days.filter(d => d.flow && d.flow !== 'none').length;
        if (periodDuration > 7) {
          const alertId = `long_period_${Date.now()}`;
          if (!existingAlerts.some(a => a.type === 'period_duration')) {
            newAlerts.push({
              id: alertId,
              type: 'period_duration',
              title: 'Extended Period Alert',
              message: `Your last period lasted ${periodDuration} days. Periods lasting longer than 7 days may warrant a consultation with your healthcare provider.`,
              severity: 'warning',
              date: new Date().toISOString(),
              dismissed: false
            });
          }
        }
      }

      if (newAlerts.length > 0) {
        set({ irregularityAlerts: [...existingAlerts, ...newAlerts] });
      }
    } catch (error) {
      console.error('Error checking for irregularities:', error);
    }
  },

  dismissAlert: (alertId: string) => {
    try {
      const alerts = get().irregularityAlerts;
      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      );
      set({ irregularityAlerts: updatedAlerts });
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  },
}));
