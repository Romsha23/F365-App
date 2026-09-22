import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { MoodPrediction, TimelinePrediction, AIExplanation, PredictiveMoodContext, MoodHistoryEntry } from '../types/mood-prediction';
import { MoodType } from '../types/cycle';
import { supabaseService } from '../lib/supabase-service';



const MOOD_SCORES: Record<MoodType, number> = {
  happy: 85,
  energetic: 80,
  neutral: 60,
  emotional: 45,
  tired: 40,
  anxious: 35,
  sad: 30,
  irritated: 25,
};

const MOOD_FROM_SCORE = (score: number): MoodType => {
  if (score >= 78) return 'happy';
  if (score >= 70) return 'energetic';
  if (score >= 55) return 'neutral';
  if (score >= 45) return 'tired';
  if (score >= 38) return 'anxious';
  if (score >= 30) return 'sad';
  return 'irritated';
};

const analyzeMoodPatternsByCycleDay = (
  context: PredictiveMoodContext
): Record<number, { avgScore: number; moods: MoodType[]; count: number }> => {
  const patterns: Record<number, { totalScore: number; moods: MoodType[]; count: number }> = {};

  const { averageCycleLength } = context.cycleInfo;

  for (const dayData of context.last60DaysData) {
    if (!dayData.mood) continue;

    let cycleDay = dayData.cycleDay || 0;
    if (cycleDay <= 0 || cycleDay > averageCycleLength) continue;

    const score = MOOD_SCORES[dayData.mood as MoodType] || 60;

    if (!patterns[cycleDay]) {
      patterns[cycleDay] = { totalScore: 0, moods: [], count: 0 };
    }
    patterns[cycleDay].totalScore += score;
    patterns[cycleDay].moods.push(dayData.mood as MoodType);
    patterns[cycleDay].count++;
  }

  const result: Record<number, { avgScore: number; moods: MoodType[]; count: number }> = {};
  for (const [day, data] of Object.entries(patterns)) {
    result[Number(day)] = {
      avgScore: data.totalScore / data.count,
      moods: data.moods,
      count: data.count,
    };
  }
  return result;
};

const getPhaseInfo = (
  cycleDay: number,
  cycleLength: number,
  periodLength: number
): { phase: string; baseScore: number; factors: string[]; symptoms: string[]; suggestions: string[]; reason: string } => {
  const ovulationDay = Math.round(cycleLength / 2);

  if (cycleDay <= periodLength) {
    return {
      phase: 'Menstrual',
      baseScore: 42,
      factors: ['Low estrogen', 'Low progesterone', 'Period symptoms', 'Possible fatigue'],
      symptoms: ['Cramps', 'Fatigue', 'Lower back pain', 'Bloating'],
      suggestions: ['Rest when needed', 'Stay hydrated', 'Light stretching or yoga', 'Iron-rich foods'],
      reason: `Day ${cycleDay} of your menstrual phase. Hormone levels are at their lowest, which commonly affects energy and mood.`,
    };
  }

  if (cycleDay <= ovulationDay - 3) {
    return {
      phase: 'Follicular',
      baseScore: 72,
      factors: ['Rising estrogen', 'Increasing serotonin', 'Building energy', 'Improved focus'],
      symptoms: [],
      suggestions: ['Great time for social activities', 'Start new projects', 'High-intensity exercise', 'Plan important meetings'],
      reason: `Day ${cycleDay} of your follicular phase. Estrogen is rising steadily, boosting mood, energy, and cognitive function.`,
    };
  }

  if (cycleDay <= ovulationDay + 1) {
    return {
      phase: 'Ovulation',
      baseScore: 82,
      factors: ['Peak estrogen', 'LH surge', 'High testosterone', 'Peak confidence'],
      symptoms: ['Mild pelvic discomfort (possible)'],
      suggestions: ['Social events', 'Important conversations', 'Creative work', 'Exercise at peak performance'],
      reason: `Day ${cycleDay} near ovulation. Estrogen and testosterone peak, typically the highest energy and best mood of your cycle.`,
    };
  }

  if (cycleDay <= cycleLength - 7) {
    return {
      phase: 'Early Luteal',
      baseScore: 60,
      factors: ['Rising progesterone', 'Declining estrogen', 'Calming effect', 'Steady energy'],
      symptoms: [],
      suggestions: ['Maintain routine', 'Moderate exercise', 'Balanced meals', 'Good sleep hygiene'],
      reason: `Day ${cycleDay} of your early luteal phase. Progesterone rises while estrogen declines, creating a calmer but slightly lower-energy state.`,
    };
  }

  return {
    phase: 'Late Luteal (PMS)',
    baseScore: 38,
    factors: ['Falling progesterone', 'Low estrogen', 'Serotonin drop', 'PMS symptoms likely'],
    symptoms: ['Mood swings', 'Bloating', 'Breast tenderness', 'Irritability', 'Food cravings'],
    suggestions: ['Self-care priority', 'Reduce stress', 'Warm comfort foods', 'Gentle exercise', 'Extra sleep'],
    reason: `Day ${cycleDay} of your late luteal phase. Both estrogen and progesterone are dropping rapidly, which commonly causes PMS symptoms and mood changes.`,
  };
};

const generateDataDrivenPredictions = (datesAhead: number, context: PredictiveMoodContext): MoodPrediction[] => {
  const predictions: MoodPrediction[] = [];
  const currentDate = new Date();
  const { averageCycleLength, averagePeriodLength, currentCycleDay } = context.cycleInfo;

  const historicalPatterns = analyzeMoodPatternsByCycleDay(context);
  const hasHistoricalData = Object.keys(historicalPatterns).length >= 3;

  for (let i = 0; i <= datesAhead; i++) {
    const predictionDate = new Date(currentDate);
    predictionDate.setDate(predictionDate.getDate() + i);

    const futureCycleDay = ((currentCycleDay + i - 1) % averageCycleLength) + 1;
    const phaseInfo = getPhaseInfo(futureCycleDay, averageCycleLength, averagePeriodLength);

    let moodScore: number;
    let confidence: number;
    let reason: string;
    let factors: string[];

    const historicalData = historicalPatterns[futureCycleDay];

    if (hasHistoricalData && historicalData && historicalData.count >= 1) {
      const historicalWeight = Math.min(0.7, 0.3 + (historicalData.count * 0.1));
      const phaseWeight = 1 - historicalWeight;
      moodScore = Math.round(historicalData.avgScore * historicalWeight + phaseInfo.baseScore * phaseWeight);

      confidence = Math.min(0.95, 0.6 + (historicalData.count * 0.05));
      confidence = confidence * (1 - (i * 0.02));
      confidence = Math.max(0.4, confidence);

      reason = `${phaseInfo.reason} Your historical mood on cycle day ${futureCycleDay} averages ${Math.round(historicalData.avgScore)}/100 across ${historicalData.count} tracked ${historicalData.count === 1 ? 'cycle' : 'cycles'}.`;
      factors = [...phaseInfo.factors, `Historical pattern: ${MOOD_FROM_SCORE(historicalData.avgScore)}`];
    } else {
      moodScore = phaseInfo.baseScore;

      const jitter = Math.floor(Math.random() * 10) - 5;
      moodScore = Math.max(15, Math.min(95, moodScore + jitter));

      confidence = Math.max(0.35, 0.55 - (i * 0.03));
      reason = phaseInfo.reason + ' Prediction based on typical cycle patterns. Track your mood daily for more personalized results.';
      factors = phaseInfo.factors;
    }

    if (context.dominantMood && hasHistoricalData) {
      const dominantScore = MOOD_SCORES[context.dominantMood];
      moodScore = Math.round(moodScore * 0.85 + dominantScore * 0.15);
    }

    predictions.push({
      id: `pred_${predictionDate.getTime()}`,
      date: predictionDate.toISOString(),
      mood: MOOD_FROM_SCORE(moodScore),
      moodScore: Math.max(10, Math.min(100, moodScore)),
      confidence: Math.round(confidence * 100) / 100,
      reason,
      factors,
      symptoms: phaseInfo.symptoms,
      suggestions: phaseInfo.suggestions,
    });
  }

  return predictions;
};

const generateTimelineFromPredictions = (predictions: MoodPrediction[]): TimelinePrediction[] => {
  return predictions.map(p => ({
    date: p.date,
    moodScore: p.moodScore,
    mood: p.mood,
    confidence: p.confidence,
  }));
};

export const useMoodPredictionStore = create(combine(
  {
    predictions: [] as MoodPrediction[],
    timeline: [] as TimelinePrediction[],
    aiExplanations: [] as AIExplanation[],
    moodHistory: [] as MoodHistoryEntry[],
    lastFetchedAt: null as string | null,
    isLoading: false,
    error: null as string | null,
  },
  (set, get) => ({
  generatePredictions: async (datesAhead: number, context: PredictiveMoodContext) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[MoodPredictionStore] Generating predictions for', datesAhead, 'days');
      console.log('[MoodPredictionStore] Historical data points:', context.last60DaysData.length);
      console.log('[MoodPredictionStore] Current cycle day:', context.cycleInfo.currentCycleDay);

      const predictions = generateDataDrivenPredictions(datesAhead, context);
      const timeline = generateTimelineFromPredictions(predictions);

      set({
        predictions,
        timeline,
        lastFetchedAt: new Date().toISOString(),
        isLoading: false,
      });

      console.log('[MoodPredictionStore] Generated', predictions.length, 'data-driven predictions');

      // Fire-and-forget Supabase sync - never block or error the UI
      void (async () => {
        try {
          const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
          if (user) {
            let syncedCount = 0;
            for (const prediction of predictions) {
              try {
                await supabaseService.moodPredictions.create(prediction);
                syncedCount++;
              } catch {
                // Silently skip individual sync failures
              }
            }
            if (syncedCount > 0) {
              console.log('[MoodPredictionStore] Synced', syncedCount, '/', predictions.length, 'predictions to Supabase');
            } else {
              console.log('[MoodPredictionStore] Supabase sync skipped (table may not exist)');
            }
          } else {
            console.log('[MoodPredictionStore] Demo mode: Skipping Supabase sync');
          }
        } catch {
          console.log('[MoodPredictionStore] Supabase sync skipped (auth unavailable)');
        }
      })();
    } catch (error) {
      console.error('[MoodPredictionStore] Error generating predictions:', error);
      set({ error: 'Failed to generate predictions', isLoading: false });
      throw error;
    }
  },

  loadPredictions: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('[MoodPredictionStore] Loading predictions');

      try {
        const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
        if (user) {
          try {
            const predictions = await supabaseService.moodPredictions.getAll();
            if (predictions && predictions.length > 0) {
              const timeline = generateTimelineFromPredictions(predictions);
              set({
                predictions,
                timeline,
                lastFetchedAt: new Date().toISOString(),
                isLoading: false,
              });
              console.log('[MoodPredictionStore] Loaded', predictions.length, 'predictions from Supabase');
              return;
            }
          } catch (dbError) {
            console.log('[MoodPredictionStore] Supabase load failed (table may not exist), using local:', dbError);
          }
        }
      } catch {
        console.log('[MoodPredictionStore] Auth check failed, using local predictions');
      }

      console.log('[MoodPredictionStore] Using local predictions (no remote data)');
      set({ isLoading: false });
    } catch (error) {
      console.error('[MoodPredictionStore] Error loading predictions:', error);
      set({ isLoading: false });
    }
  },

  getAIExplanation: async (prediction: MoodPrediction, context: PredictiveMoodContext) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[MoodPredictionStore] Getting AI explanation for', prediction.date);

      const historicalPatterns = analyzeMoodPatternsByCycleDay(context);
      const dataPoints = Object.keys(historicalPatterns).length;
      const totalEntries = context.last60DaysData.filter((d: { mood?: string }) => d.mood).length;

      const predDate = new Date(prediction.date);
      const dayOfWeek = predDate.toLocaleDateString('en-US', { weekday: 'long' });

      let dataQualityNote = '';
      if (totalEntries < 7) {
        dataQualityNote = ' Note: With limited tracking data, this prediction relies more on general cycle science. The more you track, the more accurate your predictions become.';
      } else if (totalEntries < 30) {
        dataQualityNote = ' Your tracking data is building a clearer picture of your unique patterns. Continue logging for increasingly personalized predictions.';
      } else {
        dataQualityNote = ' This prediction is personalized based on your extensive tracking history and unique mood patterns.';
      }

      const explanation: AIExplanation = {
        prediction,
        fullExplanation: `${prediction.reason}${dataQualityNote}\n\nOn ${dayOfWeek}, we predict a mood score of ${prediction.moodScore}/100 (${prediction.mood}) with ${Math.round(prediction.confidence * 100)}% confidence. This analysis considers your cycle phase, ${totalEntries} historical data points, and ${dataPoints} unique cycle-day patterns.`,
        tips: prediction.suggestions || [
          'Track your mood daily for better predictions',
          'Maintain a healthy sleep schedule',
          'Stay hydrated and eat balanced meals',
        ],
        reasoning: `Analysis methodology: Weighted combination of hormonal cycle phase modeling (${context.cycleInfo.averageCycleLength}-day cycle) and historical mood patterns from ${totalEntries} tracked days across ${dataPoints} distinct cycle days. Key factors: ${prediction.factors.join(', ')}. Confidence adjusted for prediction distance and data availability.`,
        timestamp: new Date().toISOString(),
      };

      const currentExplanations = get().aiExplanations;
      set({
        aiExplanations: [...currentExplanations, explanation],
        isLoading: false,
      });

      console.log('[MoodPredictionStore] AI explanation generated');
      return explanation;
    } catch (error) {
      console.error('[MoodPredictionStore] Error getting AI explanation:', error);
      set({ error: 'Failed to get AI explanation', isLoading: false });
      throw error;
    }
  },

  getMoodHistory: (startDate: string, endDate: string) => {
    const history = get().moodHistory;
    const start = new Date(startDate);
    const end = new Date(endDate);

    return history.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
  },

  addMoodHistoryEntry: (entry: MoodHistoryEntry) => {
    const currentHistory = get().moodHistory;
    const existingIndex = currentHistory.findIndex(e => e.date === entry.date);

    if (existingIndex >= 0) {
      const updated = [...currentHistory];
      updated[existingIndex] = entry;
      set({ moodHistory: updated });
    } else {
      set({ moodHistory: [...currentHistory, entry] });
    }
  },

  clearPredictions: () => {
    set({
      predictions: [],
      timeline: [],
      lastFetchedAt: null,
    });
  },

  getPredictionForDate: (date: string): MoodPrediction | null => {
    const predictions = get().predictions;
    const dateStr = new Date(date).toISOString().split('T')[0];
    return predictions.find(p => p.date.split('T')[0] === dateStr) || null;
  },

  getTimelinePrediction: (date: string): TimelinePrediction | null => {
    const timeline = get().timeline;
    const dateStr = new Date(date).toISOString().split('T')[0];
    return timeline.find(t => t.date.split('T')[0] === dateStr) || null;
  },
})));
