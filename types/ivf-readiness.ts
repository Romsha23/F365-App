export type AgeRange = 'under_25' | '25_29' | '30_34' | '35_37' | '38_40' | '41_plus';
export type CycleRegularity = 'regular' | 'mildly_irregular' | 'highly_irregular' | 'no_periods';
export type TimeConceiving = 'not_yet' | 'under_6' | '6_12' | '12_18' | '18_plus';
export type OvulationConfidence = 'consistent' | 'uncertain' | 'rare' | 'unknown';
export type SymptomSeverity = 'low' | 'moderate' | 'high';
export type IVFCategory = 'low' | 'watch' | 'high' | 'critical';

export interface IVFMedicalHistory {
  pcos: boolean;
  endometriosis: boolean;
  thyroidIssue: boolean;
  previousMiscarriage: boolean;
  previousIVF: boolean;
  fibroids: boolean;
}

export interface IVFSymptomProfile {
  painSeverity: SymptomSeverity;
  irregularBleeding: boolean;
  hormonalAcne: boolean;
  moodSwings: SymptomSeverity;
}

export interface IVFAssessmentInput {
  ageRange: AgeRange;
  cycleRegularity: CycleRegularity;
  timeConceiving: TimeConceiving;
  ovulationConfidence: OvulationConfidence;
  medicalHistory: IVFMedicalHistory;
  symptomProfile: IVFSymptomProfile;
  tryingToConceive: boolean;
  stressLevel: 'low' | 'moderate' | 'high' | 'very_high';
}

export interface IVFSubScore {
  label: string;
  score: number;
  maxScore: number;
  level: 'low' | 'moderate' | 'high';
  description: string;
}

export interface IVFReadinessResult {
  id: string;
  userId: string;
  totalScore: number;
  category: IVFCategory;
  subScores: {
    age: IVFSubScore;
    cycle: IVFSubScore;
    timeToConceive: IVFSubScore;
    medical: IVFSubScore;
    ovulation: IVFSubScore;
    symptoms: IVFSubScore;
  };
  predictions: {
    interventionLikelihood: number;
    naturalConceptionLikelihood: number;
  };
  actions: string[];
  input: IVFAssessmentInput;
  createdAt: string;
  updatedAt: string;
}

export interface IVFAssessmentRow {
  id: string;
  user_id: string;
  total_score: number;
  category: IVFCategory;
  sub_scores: Record<string, any>;
  predictions: Record<string, any>;
  actions: string[];
  input_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
