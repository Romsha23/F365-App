export interface AuthResponse {
  id: string;
  uniqueId: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  notificationsEnabled: boolean;
  emergencyAlertsEnabled: boolean;
  insightsEnabled: boolean;
  onboarded: boolean;
}

export type Ethnicity = 
  | 'african'
  | 'african_american'
  | 'asian_east'
  | 'asian_south'
  | 'asian_southeast'
  | 'caucasian'
  | 'hispanic_latino'
  | 'middle_eastern'
  | 'native_american'
  | 'pacific_islander'
  | 'mixed'
  | 'other'
  | 'prefer_not_to_say';

export type ActivityLevel = 
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type DietType = 
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'other';

export type SleepPattern = 
  | 'regular'
  | 'irregular'
  | 'shift_work'
  | 'insomnia'
  | 'oversleeping';

export type StressLevel = 
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

export type HealthCondition = 
  | 'pcos'
  | 'endometriosis'
  | 'thyroid_hyper'
  | 'thyroid_hypo'
  | 'diabetes'
  | 'fibroids'
  | 'anemia'
  | 'none';

export type ContraceptiveType = 
  | 'none'
  | 'pill'
  | 'iud_hormonal'
  | 'iud_copper'
  | 'implant'
  | 'injection'
  | 'patch'
  | 'ring'
  | 'barrier'
  | 'natural'
  | 'other';

export type WeightRange = 
  | 'under_45'
  | '45_55'
  | '55_65'
  | '65_75'
  | '75_85'
  | '85_95'
  | '95_105'
  | '105_plus';

export type HeightRange = 
  | 'under_150'
  | '150_160'
  | '160_170'
  | '170_180'
  | '180_190'
  | '190_plus';

export type ClimateType = 
  | 'tropical'
  | 'subtropical'
  | 'temperate'
  | 'continental'
  | 'polar'
  | 'arid'
  | 'mediterranean';

export type LifeStage = 
  | 'period_tracking'
  | 'trying_to_conceive'
  | 'pregnant'
  | 'postpartum'
  | 'perimenopause';

export interface UserProfile {
  id: string;
  uniqueId: string;
  displayName?: string;
  email?: string;
  birthMonth?: number;
  birthYear?: number;
  country?: string;
  role?: string;
  ethnicity?: Ethnicity;
  activityLevel?: ActivityLevel;
  dietType?: DietType;
  sleepPattern?: SleepPattern;
  stressLevel?: StressLevel;
  healthConditions?: HealthCondition[];
  contraceptiveType?: ContraceptiveType;
  weightRange?: WeightRange;
  heightRange?: HeightRange;
  climateType?: ClimateType;
  dataEncrypted?: boolean;
  commonSymptoms?: string[];
  notificationsEnabled?: boolean;
  emergencyAlertsEnabled?: boolean;
  insightsEnabled?: boolean;
  onboarded?: boolean;
  consentGiven?: boolean;
  aiProcessingConsent?: boolean;
  aiConsentDate?: string;
  lastDataExport?: string;
  subscriptionPlan?: string;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  lifeStage?: LifeStage;
}

let numericIdCounter = 0;

export function generate7DigitId(): string {
  const min = 1000000;
  const max = 9999999;
  numericIdCounter += 1;
  const seed = Date.now() + numericIdCounter;
  const sevenDigit = Math.floor((seed % (max - min + 1)) + min);
  if (numericIdCounter > max - min) {
    const eightMin = 10000000;
    const eightMax = 99999999;
    const eightDigit = Math.floor((seed % (eightMax - eightMin + 1)) + eightMin);
    return eightDigit.toString();
  }
  return sevenDigit.toString();
}

export function generateMockUserProfile(): UserProfile {
  return {
    id: '1',
    uniqueId: generate7DigitId(),
    birthMonth: 6,
    birthYear: 1998,
    country: 'US',
    averageCycleLength: 28,
    averagePeriodLength: 5,
    notificationsEnabled: true,
    emergencyAlertsEnabled: true,
    insightsEnabled: true,
    dataEncrypted: true,
    commonSymptoms: [],
    subscriptionPlan: 'free'
  };
}

export function calculateAgeFromBirthMonthYear(birthMonth?: number, birthYear?: number): number | undefined {
  if (!birthMonth || !birthYear) return undefined;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  let age = currentYear - birthYear;
  if (currentMonth < birthMonth) {
    age--;
  }
  
  return age;
}

export const ETHNICITY_LABELS: Record<Ethnicity, string> = {
  african: 'African',
  african_american: 'African American',
  asian_east: 'East Asian',
  asian_south: 'South Asian',
  asian_southeast: 'Southeast Asian',
  caucasian: 'Caucasian/White',
  hispanic_latino: 'Hispanic/Latino',
  middle_eastern: 'Middle Eastern',
  native_american: 'Native American',
  pacific_islander: 'Pacific Islander',
  mixed: 'Mixed/Multiracial',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little/no exercise)',
  lightly_active: 'Lightly Active (1-2 days/week)',
  moderately_active: 'Moderately Active (3-4 days/week)',
  very_active: 'Very Active (5-6 days/week)',
  extremely_active: 'Extremely Active (daily)',
};

export const DIET_TYPE_LABELS: Record<DietType, string> = {
  omnivore: 'Omnivore',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  keto: 'Keto',
  paleo: 'Paleo',
  mediterranean: 'Mediterranean',
  other: 'Other',
};

export const SLEEP_PATTERN_LABELS: Record<SleepPattern, string> = {
  regular: 'Regular (7-9 hrs)',
  irregular: 'Irregular',
  shift_work: 'Shift Work',
  insomnia: 'Insomnia',
  oversleeping: 'Oversleeping',
};

export const STRESS_LEVEL_LABELS: Record<StressLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
};

export const HEALTH_CONDITION_LABELS: Record<HealthCondition, string> = {
  pcos: 'PCOS',
  endometriosis: 'Endometriosis',
  thyroid_hyper: 'Hyperthyroidism',
  thyroid_hypo: 'Hypothyroidism',
  diabetes: 'Diabetes',
  fibroids: 'Fibroids',
  anemia: 'Anemia',
  none: 'None',
};

export const CONTRACEPTIVE_TYPE_LABELS: Record<ContraceptiveType, string> = {
  none: 'None',
  pill: 'Birth Control Pill',
  iud_hormonal: 'Hormonal IUD',
  iud_copper: 'Copper IUD',
  implant: 'Implant',
  injection: 'Injection',
  patch: 'Patch',
  ring: 'Vaginal Ring',
  barrier: 'Barrier Methods',
  natural: 'Natural/FAM',
  other: 'Other',
};

export const WEIGHT_RANGE_LABELS: Record<WeightRange, string> = {
  under_45: 'Under 45 kg',
  '45_55': '45-55 kg',
  '55_65': '55-65 kg',
  '65_75': '65-75 kg',
  '75_85': '75-85 kg',
  '85_95': '85-95 kg',
  '95_105': '95-105 kg',
  '105_plus': 'Over 105 kg',
};

export const HEIGHT_RANGE_LABELS: Record<HeightRange, string> = {
  under_150: 'Under 150 cm',
  '150_160': '150-160 cm',
  '160_170': '160-170 cm',
  '170_180': '170-180 cm',
  '180_190': '180-190 cm',
  '190_plus': 'Over 190 cm',
};

export const CLIMATE_TYPE_LABELS: Record<ClimateType, string> = {
  tropical: 'Tropical',
  subtropical: 'Subtropical',
  temperate: 'Temperate',
  continental: 'Continental',
  polar: 'Polar/Cold',
  arid: 'Arid/Desert',
  mediterranean: 'Mediterranean',
};

export const LIFE_STAGE_OPTIONS: { id: LifeStage; label: string; description: string; emoji: string }[] = [
  { id: 'period_tracking', label: 'Period & Cycle Tracking', description: 'Track your cycle, symptoms, and patterns', emoji: '🌙' },
  { id: 'trying_to_conceive', label: 'Trying to Conceive', description: 'Fertility tracking and ovulation insights', emoji: '🥚' },
  { id: 'pregnant', label: 'Pregnant', description: 'Week-by-week pregnancy tracking', emoji: '🤰' },
  { id: 'postpartum', label: 'Postpartum & Recovery', description: 'Post-birth recovery and baby care', emoji: '👶' },
  { id: 'perimenopause', label: 'Perimenopause / Menopause', description: 'Manage hormonal changes and symptoms', emoji: '🦋' },
];
