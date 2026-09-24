export type PregnancyMode = 'tracking' | 'pregnant' | 'postpartum' | null;

export type PregnancyWeek = {
  week: number;
  trimester: 1 | 2 | 3;
  babySize: string;
  babyWeight: string;
  babyDevelopment: string;
  maternalChanges: string;
  tips: string[];
};

export type PregnancySymptom = 
  | 'nausea' 
  | 'morning_sickness' 
  | 'fatigue' 
  | 'breast_tenderness'
  | 'frequent_urination' 
  | 'food_aversions' 
  | 'food_cravings'
  | 'heartburn' 
  | 'constipation' 
  | 'back_pain' 
  | 'swelling'
  | 'mood_swings' 
  | 'leg_cramps' 
  | 'shortness_of_breath'
  | 'insomnia' 
  | 'headaches' 
  | 'dizziness'
  | 'round_ligament_pain' 
  | 'contractions';

export type PregnancyMoodType =
  | 'excited' 
  | 'anxious' 
  | 'happy' 
  | 'tired' 
  | 'overwhelmed'
  | 'emotional' 
  | 'peaceful' 
  | 'worried';

export type KickCountSession = {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  kickCount: number;
  duration?: number;
  notes?: string;
};

export type PregnancyAppointment = {
  id: string;
  date: string;
  type: 'ultrasound' | 'checkup' | 'lab' | 'specialist' | 'other';
  provider: string;
  notes?: string;
  weight?: number;
  bloodPressure?: string;
  babyHeartRate?: number;
  measurements?: {
    fundalHeight?: number;
    estimatedWeight?: number;
  };
  nextAppointment?: string;
};

export type PregnancyDayLog = {
  id: string;
  date: string;
  week: number;
  symptoms: PregnancySymptom[];
  mood: PregnancyMoodType;
  weight?: number;
  bloodPressure?: string;
  kickCount?: number;
  waterIntake?: number;
  sleep?: number;
  exercise?: string;
  notes?: string;
  photos?: string[];
};

export type PregnancyProfile = {
  id: string;
  userId: string;
  dueDate: string;
  conceptionDate?: string;
  lastPeriodDate: string;
  currentWeek: number;
  bloodType?: string;
  rhFactor?: 'positive' | 'negative';
  complications?: string[];
  medications?: string[];
  doctorName?: string;
  doctorPhone?: string;
  hospital?: string;
  birthPlan?: string;
  partners?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ContractionTimer = {
  id: string;
  date: string;
  contractions: Contraction[];
  notes?: string;
};

export type Contraction = {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  intensity: 'mild' | 'moderate' | 'strong';
};

export type PostpartumSymptom =
  | 'bleeding' 
  | 'cramping' 
  | 'breast_engorgement' 
  | 'nipple_soreness'
  | 'mood_swings' 
  | 'fatigue' 
  | 'constipation' 
  | 'hemorrhoids'
  | 'perineal_pain' 
  | 'c_section_pain' 
  | 'night_sweats'
  | 'hair_loss' 
  | 'back_pain' 
  | 'headaches'
  | 'anxiety' 
  | 'depression';

export type BreastfeedingSession = {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  breast: 'left' | 'right' | 'both';
  babyId?: string;
  notes?: string;
  pumpedAmount?: number;
};

export type BabyProfile = {
  id: string;
  name: string;
  birthDate: string;
  birthWeight: number;
  birthLength: number;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  photos?: string[];
};

export type BabyFeeding = {
  id: string;
  babyId: string;
  date: string;
  time: string;
  type: 'breast' | 'bottle' | 'both';
  duration?: number;
  amount?: number;
  breast?: 'left' | 'right' | 'both';
  notes?: string;
};

export type BabySleep = {
  id: string;
  babyId: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  location?: 'crib' | 'bassinet' | 'bed' | 'arms' | 'other';
  notes?: string;
};

export type BabyDiaper = {
  id: string;
  babyId: string;
  date: string;
  time: string;
  type: 'wet' | 'dirty' | 'both';
  notes?: string;
};

export type PostpartumDayLog = {
  id: string;
  date: string;
  weeksPostpartum: number;
  symptoms: PostpartumSymptom[];
  mood: PregnancyMoodType;
  weight?: number;
  bloodPressure?: string;
  bleedingLevel?: 'spotting' | 'light' | 'moderate' | 'heavy';
  sleep?: number;
  exercise?: string;
  notes?: string;
};

export type PostpartumProfile = {
  id: string;
  userId: string;
  babyId: string;
  deliveryDate: string;
  deliveryType: 'vaginal' | 'c_section' | 'vbac';
  complications?: string[];
  isBreastfeeding: boolean;
  isPumping: boolean;
  sixWeekCheckup?: string;
  createdAt: string;
  updatedAt: string;
};
