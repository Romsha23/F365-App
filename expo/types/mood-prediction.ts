import { MoodType } from './cycle';

export interface MoodPrediction {
  id: string;
  date: string;
  mood: MoodType;
  moodScore: number;
  confidence: number;
  reason: string;
  factors: string[];
  symptoms?: string[];
  suggestions?: string[];
}

export interface TimelinePrediction {
  date: string;
  moodScore: number;
  mood: MoodType;
  confidence: number;
}

export interface AIExplanation {
  prediction: MoodPrediction;
  fullExplanation: string;
  tips: string[];
  reasoning: string;
  timestamp: string;
}

export interface PredictiveMoodContext {
  last60DaysData: {
    date: string;
    mood?: MoodType;
    symptoms?: string[];
    flow?: string;
    cycleDay?: number;
  }[];
  cycleInfo: {
    averageCycleLength: number;
    averagePeriodLength: number;
    currentCycleDay: number;
  };
  recentSymptoms: string[];
  dominantMood: MoodType | null;
}

export interface PredictiveMoodRequest {
  datesAhead: number;
  userId: string;
  context: PredictiveMoodContext;
}

export interface PredictiveMoodResponse {
  predictions: MoodPrediction[];
  timeline: TimelinePrediction[];
  confidence: number;
  generatedAt: string;
}

export interface MoodHistoryEntry {
  date: string;
  mood: MoodType;
  moodScore: number;
  symptoms: string[];
  notes?: string;
}

export interface AIExplainRequest {
  date: string;
  prediction: MoodPrediction;
  context: PredictiveMoodContext;
  userId: string;
}

export interface AIExplainResponse {
  explanation: string;
  tips: string[];
  reasoning: string;
}
