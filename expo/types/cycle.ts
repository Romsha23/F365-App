export type FlowIntensity = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export type MoodType = 
  | 'happy' 
  | 'sad' 
  | 'neutral' 
  | 'irritated' 
  | 'anxious' 
  | 'energetic' 
  | 'tired' 
  | 'emotional';

export type SymptomType = 
  | 'cramps' 
  | 'headache' 
  | 'backache' 
  | 'nausea' 
  | 'bloating' 
  | 'tender_breasts' 
  | 'acne' 
  | 'fatigue' 
  | 'insomnia'
  | 'spotting'
  | 'dizziness'
  | 'constipation'
  | 'diarrhea'
  | 'migraines'
  | 'breast_tenderness'
  | 'digestive_issues';

export type SymptomWithIntensity = {
  id: string;
  intensity: number;
  isCustom: boolean;
};

export type CustomSymptom = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
};

export type DischargeType = 
  | 'none' 
  | 'sticky' 
  | 'creamy' 
  | 'watery' 
  | 'egg_white'
  | 'brown';

export type PainLevel = 'none' | 'mild' | 'moderate' | 'severe';

export type CravingType = 
  | 'sweet' 
  | 'salty' 
  | 'chocolate' 
  | 'carbs' 
  | 'dairy' 
  | 'spicy' 
  | 'fatty'
  | 'caffeine'
  | 'none';

export type SexualActivityType = {
  protected: boolean;
  protectionType?: 'condom' | 'withdrawal' | 'iud' | 'pill' | 'other';
  libido?: 'low' | 'moderate' | 'high';
  comfort?: 'comfortable' | 'some_discomfort' | 'painful';
  orgasm?: boolean;
  notes?: string;
};

export type DayDataType = {
  date: string;
  flow?: FlowIntensity;
  mood?: MoodType;
  moodIntensity?: number;
  symptoms?: SymptomType[];
  symptomsWithIntensity?: SymptomWithIntensity[];
  discharge?: DischargeType;
  painLevel?: PainLevel;
  cravings?: CravingType[];
  notes?: string;
  emotionalNotes?: string;
  stressLevel?: number;
  temperature?: number;
  weight?: number;
  sleep?: number;
  exercise?: number;
  waterIntake?: number;
  medications?: string[];
  stress?: number;
  intimacy?: boolean;
  sexualActivity?: SexualActivityType;
  spotting?: boolean;
};

export type CycleType = {
  id: string;
  startDate: string;
  days: DayDataType[];
  endDate?: string;
  length?: number; // Cycle length in days
  notes?: string;
  tags?: string[];
  userId?: string; // Add user ID for XANO
  xanoId?: string; // Add XANO ID for syncing
};

export type PredictionsType = {
  nextPeriodDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  confidence: number;
  averageCycleLength: number;
  averagePeriodLength: number;
};

export type InsightType = {
  id: string;
  title: string;
  description: string;
  type: 'prediction' | 'health' | 'tip' | 'alert';
  date: string;
  read: boolean;
  relatedData?: any;
  actionable?: boolean;
  action?: string;
};

export type HealthAnalysisType = {
  cycleSummary: string;
  potentialConcerns: string;
  hormonalBalance: string;
  nutritionalRecommendations: string;
  lifestyleRecommendations: string;
  stressManagement: string;
  fertilityInsights: string;
};

// Add OpenAI prediction response type
export type OpenAIPredictionResponse = {
  success: boolean;
  predictions?: {
    nextPeriodStart?: string;
    tip?: string;
    confidence?: number;
  };
  error?: string;
};

// Legacy type aliases for backward compatibility
export type CycleDay = DayDataType;
export type CycleData = CycleType;
export type PredictionData = {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  nextFertileWindowStart: string;
  nextFertileWindowEnd: string;
  nextOvulationDate: string;
  confidence: number;
  periodDays: string[]; // Array of dates for calendar display
  fertileWindowDays: string[]; // Array of dates for calendar display
  ovulationDay: string; // Date for calendar display
};