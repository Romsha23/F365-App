import { DayDataType, MoodType } from '../types/cycle';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'learning' | 'insufficient';

export type ConfidenceFactors = {
  dataPointsScore: number;
  consistencyScore: number;
  completenessScore: number;
  recencyScore: number;
  patternStabilityScore: number;
};

export type ConfidenceResult = {
  level: ConfidenceLevel;
  score: number;
  factors: ConfidenceFactors;
  label: string;
  description: string;
  improvementTip?: string;
};

const moodScoreMap: Record<MoodType, number> = {
  'happy': 90,
  'energetic': 85,
  'neutral': 50,
  'emotional': 45,
  'tired': 35,
  'irritated': 30,
  'anxious': 25,
  'sad': 20,
};

export const calculateDataPointsScore = (
  dataPoints: number,
  minRequired: number = 7,
  optimalPoints: number = 30
): number => {
  if (dataPoints < 3) return 0;
  if (dataPoints < minRequired) return 0.2 + (dataPoints / minRequired) * 0.3;
  if (dataPoints >= optimalPoints) return 1;
  return 0.5 + ((dataPoints - minRequired) / (optimalPoints - minRequired)) * 0.5;
};

export const calculateConsistencyScore = (days: DayDataType[]): number => {
  if (days.length < 7) return 0.3;
  
  const sortedDays = [...days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let totalGapDays = 0;
  
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1].date);
    const currDate = new Date(sortedDays[i].date);
    const diffDays = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (diffDays > 1) {
      totalGapDays += diffDays - 1;
    }
  }
  
  const gapRatio = totalGapDays / Math.max(days.length, 1);
  const consistencyRatio = 1 - Math.min(gapRatio, 1);
  
  return Math.max(0.1, consistencyRatio);
};

export const calculateCompletenessScore = (days: DayDataType[]): number => {
  if (days.length === 0) return 0;
  
  const completenessScores = days.map(day => {
    let fieldsLogged = 0;
    const totalFields = 8;
    
    if (day.mood) fieldsLogged++;
    if (day.flow && day.flow !== 'none') fieldsLogged++;
    if (day.symptoms && day.symptoms.length > 0) fieldsLogged++;
    if (day.symptomsWithIntensity && day.symptomsWithIntensity.length > 0) fieldsLogged++;
    if (day.stressLevel !== undefined) fieldsLogged++;
    if (day.sleep !== undefined) fieldsLogged++;
    if (day.exercise !== undefined) fieldsLogged++;
    if (day.notes || day.emotionalNotes) fieldsLogged++;
    
    return fieldsLogged / totalFields;
  });
  
  return completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length;
};

export const calculateRecencyScore = (days: DayDataType[]): number => {
  if (days.length === 0) return 0;
  
  const sortedDays = [...days].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const mostRecentDate = new Date(sortedDays[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysSinceLastLog = Math.floor(
    (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastLog <= 1) return 1;
  if (daysSinceLastLog <= 3) return 0.9;
  if (daysSinceLastLog <= 7) return 0.7;
  if (daysSinceLastLog <= 14) return 0.5;
  if (daysSinceLastLog <= 30) return 0.3;
  return 0.1;
};

export const calculatePatternStabilityScore = (days: DayDataType[]): number => {
  if (days.length < 7) return 0.3;
  
  const moodScores = days
    .filter(d => d.mood)
    .map(d => moodScoreMap[d.mood!] || 50);
  
  if (moodScores.length < 5) return 0.4;
  
  const mean = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
  const variance = moodScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / moodScores.length;
  const stdDev = Math.sqrt(variance);
  
  const normalizedStdDev = stdDev / 100;
  const stabilityScore = 1 - Math.min(normalizedStdDev * 2, 1);
  
  return Math.max(0.2, stabilityScore);
};

export const calculateAdvancedConfidence = (
  days: DayDataType[],
  context: 'weekly' | 'monthly' | 'correlation' = 'weekly'
): ConfidenceResult => {
  const contextConfig = {
    weekly: { minPoints: 5, optimalPoints: 14 },
    monthly: { minPoints: 14, optimalPoints: 30 },
    correlation: { minPoints: 21, optimalPoints: 45 },
  };
  
  const config = contextConfig[context];
  
  const factors: ConfidenceFactors = {
    dataPointsScore: calculateDataPointsScore(days.length, config.minPoints, config.optimalPoints),
    consistencyScore: calculateConsistencyScore(days),
    completenessScore: calculateCompletenessScore(days),
    recencyScore: calculateRecencyScore(days),
    patternStabilityScore: calculatePatternStabilityScore(days),
  };
  
  const weights = {
    dataPointsScore: 0.35,
    consistencyScore: 0.20,
    completenessScore: 0.15,
    recencyScore: 0.15,
    patternStabilityScore: 0.15,
  };
  
  const weightedScore = 
    factors.dataPointsScore * weights.dataPointsScore +
    factors.consistencyScore * weights.consistencyScore +
    factors.completenessScore * weights.completenessScore +
    factors.recencyScore * weights.recencyScore +
    factors.patternStabilityScore * weights.patternStabilityScore;
  
  let level: ConfidenceLevel;
  let label: string;
  let description: string;
  let improvementTip: string | undefined;
  
  if (days.length < 3) {
    level = 'insufficient';
    label = 'Not enough data yet';
    description = 'Log a few more days to unlock personalized insights';
    improvementTip = `Log ${3 - days.length} more days to start seeing patterns`;
  } else if (weightedScore < 0.35) {
    level = 'learning';
    label = 'Still learning your baseline';
    description = `${days.length} days tracked — building your profile`;
    improvementTip = 'Keep logging consistently for better accuracy';
  } else if (weightedScore < 0.55) {
    level = 'low';
    label = 'Emerging patterns';
    description = 'Patterns are starting to form';
    
    if (factors.consistencyScore < 0.5) {
      improvementTip = 'Try logging more consistently — even brief entries help';
    } else if (factors.completenessScore < 0.4) {
      improvementTip = 'Adding more details (mood, sleep, symptoms) improves accuracy';
    } else {
      improvementTip = `${Math.max(0, config.optimalPoints - days.length)} more days will strengthen predictions`;
    }
  } else if (weightedScore < 0.75) {
    level = 'medium';
    label = 'Medium confidence';
    description = 'Clear patterns emerging from your data';
    
    if (factors.recencyScore < 0.7) {
      improvementTip = 'Recent data helps — try to log regularly';
    } else if (factors.patternStabilityScore < 0.5) {
      improvementTip = 'Your patterns vary — this is normal, keep tracking';
    }
  } else {
    level = 'high';
    label = 'High confidence';
    description = 'Based on consistent patterns in your data';
  }
  
  return {
    level,
    score: weightedScore,
    factors,
    label,
    description,
    improvementTip,
  };
};

export type PatternChange = {
  detected: boolean;
  type: 'improvement' | 'decline' | 'shift' | 'stable';
  magnitude: 'significant' | 'moderate' | 'minor';
  description: string;
  factors: string[];
};

export const detectPatternChange = (
  currentWeekDays: DayDataType[],
  previousWeekDays: DayDataType[],
  historicalDays: DayDataType[]
): PatternChange => {
  if (currentWeekDays.length < 3 || previousWeekDays.length < 3) {
    return {
      detected: false,
      type: 'stable',
      magnitude: 'minor',
      description: 'Not enough data to detect changes',
      factors: [],
    };
  }
  
  const getMoodAvg = (days: DayDataType[]) => {
    const scores = days.filter(d => d.mood).map(d => moodScoreMap[d.mood!] || 50);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  };
  
  const getStressAvg = (days: DayDataType[]) => {
    const levels = days.filter(d => d.stressLevel !== undefined).map(d => d.stressLevel!);
    return levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 2.5;
  };
  
  const getMoodVariance = (days: DayDataType[]) => {
    const scores = days.filter(d => d.mood).map(d => moodScoreMap[d.mood!] || 50);
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length);
  };
  
  const currentMoodAvg = getMoodAvg(currentWeekDays);
  const prevMoodAvg = getMoodAvg(previousWeekDays);
  const historicalMoodAvg = historicalDays.length >= 14 ? getMoodAvg(historicalDays) : prevMoodAvg;
  
  const currentStress = getStressAvg(currentWeekDays);
  const prevStress = getStressAvg(previousWeekDays);
  
  const currentVariance = getMoodVariance(currentWeekDays);
  const prevVariance = getMoodVariance(previousWeekDays);
  
  const moodChange = currentMoodAvg - prevMoodAvg;
  const stressChange = currentStress - prevStress;
  const varianceChange = currentVariance - prevVariance;
  const deviationFromBaseline = currentMoodAvg - historicalMoodAvg;
  
  const factors: string[] = [];
  let magnitude: 'significant' | 'moderate' | 'minor' = 'minor';
  let type: 'improvement' | 'decline' | 'shift' | 'stable' = 'stable';
  let description = '';
  
  if (Math.abs(moodChange) > 15) {
    magnitude = 'significant';
    factors.push(moodChange > 0 ? 'mood improved significantly' : 'mood declined notably');
  } else if (Math.abs(moodChange) > 8) {
    magnitude = 'moderate';
    factors.push(moodChange > 0 ? 'mood improved' : 'mood dipped');
  }
  
  if (Math.abs(stressChange) > 1) {
    factors.push(stressChange > 0 ? 'stress increased' : 'stress decreased');
    if (magnitude === 'minor') magnitude = 'moderate';
  }
  
  if (Math.abs(varianceChange) > 10) {
    factors.push(varianceChange > 0 ? 'mood more variable' : 'mood more stable');
  }
  
  if (Math.abs(deviationFromBaseline) > 12) {
    factors.push(
      deviationFromBaseline > 0 
        ? 'above your usual baseline' 
        : 'below your usual baseline'
    );
  }
  
  if (factors.length === 0) {
    return {
      detected: false,
      type: 'stable',
      magnitude: 'minor',
      description: 'Your patterns are consistent with recent weeks',
      factors: [],
    };
  }
  
  if (moodChange > 8 && stressChange < 0) {
    type = 'improvement';
    description = 'This week shows positive shifts in your patterns';
  } else if (moodChange < -8 || stressChange > 1) {
    type = 'decline';
    description = 'This week has been more challenging than usual';
  } else if (Math.abs(varianceChange) > 10 || factors.length >= 2) {
    type = 'shift';
    description = 'This week is different from your usual pattern';
  }
  
  return {
    detected: true,
    type,
    magnitude,
    description,
    factors,
  };
};

export type CauseEffectHint = {
  factor: string;
  effect: string;
  correlation: number;
  direction: 'positive' | 'negative';
  confidence: ConfidenceLevel;
  narrative: string;
};

export const detectCauseEffectPatterns = (days: DayDataType[]): CauseEffectHint[] => {
  if (days.length < 14) return [];
  
  const hints: CauseEffectHint[] = [];
  
  const sleepMoodCorrelation = calculateSleepMoodCorrelation(days);
  if (sleepMoodCorrelation.correlation > 0.3) {
    hints.push({
      factor: 'Sleep quality',
      effect: 'mood',
      correlation: sleepMoodCorrelation.correlation,
      direction: 'positive',
      confidence: sleepMoodCorrelation.dataPoints >= 21 ? 'high' : sleepMoodCorrelation.dataPoints >= 14 ? 'medium' : 'low',
      narrative: `Sleep consistency ${sleepMoodCorrelation.correlation > 0.5 ? 'strongly correlates' : 'may be helping'} with your mood stability`,
    });
  }
  
  const exerciseMoodCorrelation = calculateExerciseMoodCorrelation(days);
  if (exerciseMoodCorrelation.correlation > 0.3) {
    hints.push({
      factor: 'Physical activity',
      effect: 'mood',
      correlation: exerciseMoodCorrelation.correlation,
      direction: 'positive',
      confidence: exerciseMoodCorrelation.dataPoints >= 21 ? 'high' : exerciseMoodCorrelation.dataPoints >= 14 ? 'medium' : 'low',
      narrative: `Exercise days tend to align with ${exerciseMoodCorrelation.correlation > 0.5 ? 'notably' : 'somewhat'} better moods`,
    });
  }
  
  const stressMoodCorrelation = calculateStressMoodCorrelation(days);
  if (stressMoodCorrelation.correlation > 0.3) {
    hints.push({
      factor: 'Stress levels',
      effect: 'mood',
      correlation: stressMoodCorrelation.correlation,
      direction: 'negative',
      confidence: stressMoodCorrelation.dataPoints >= 21 ? 'high' : stressMoodCorrelation.dataPoints >= 14 ? 'medium' : 'low',
      narrative: `Lower stress days correlate with ${stressMoodCorrelation.correlation > 0.5 ? 'significantly' : 'moderately'} better moods`,
    });
  }
  
  const journalingCorrelation = calculateJournalingCorrelation(days);
  if (journalingCorrelation.correlation > 0.25) {
    hints.push({
      factor: 'Journaling',
      effect: 'emotional clarity',
      correlation: journalingCorrelation.correlation,
      direction: 'positive',
      confidence: journalingCorrelation.dataPoints >= 14 ? 'medium' : 'low',
      narrative: `Days with journal entries show ${journalingCorrelation.correlation > 0.4 ? 'clearer' : 'somewhat better'} emotional patterns`,
    });
  }
  
  return hints.sort((a, b) => b.correlation - a.correlation).slice(0, 3);
};

const calculateSleepMoodCorrelation = (days: DayDataType[]) => {
  const validDays = days.filter(d => d.sleep !== undefined && d.mood);
  if (validDays.length < 7) return { correlation: 0, dataPoints: validDays.length };
  
  const sleepScores = validDays.map(d => (d.sleep! >= 7 ? 1 : d.sleep! >= 6 ? 0.5 : 0));
  const moodScores = validDays.map(d => (moodScoreMap[d.mood!] || 50) / 100);
  
  return { 
    correlation: calculateCorrelation(sleepScores, moodScores),
    dataPoints: validDays.length 
  };
};

const calculateExerciseMoodCorrelation = (days: DayDataType[]) => {
  const validDays = days.filter(d => d.exercise !== undefined && d.mood);
  if (validDays.length < 7) return { correlation: 0, dataPoints: validDays.length };
  
  const exerciseScores = validDays.map(d => (d.exercise! > 0 ? 1 : 0));
  const moodScores = validDays.map(d => (moodScoreMap[d.mood!] || 50) / 100);
  
  return { 
    correlation: calculateCorrelation(exerciseScores, moodScores),
    dataPoints: validDays.length 
  };
};

const calculateStressMoodCorrelation = (days: DayDataType[]) => {
  const validDays = days.filter(d => d.stressLevel !== undefined && d.mood);
  if (validDays.length < 7) return { correlation: 0, dataPoints: validDays.length };
  
  const stressScores = validDays.map(d => 1 - (d.stressLevel! / 5));
  const moodScores = validDays.map(d => (moodScoreMap[d.mood!] || 50) / 100);
  
  return { 
    correlation: calculateCorrelation(stressScores, moodScores),
    dataPoints: validDays.length 
  };
};

const calculateJournalingCorrelation = (days: DayDataType[]) => {
  const validDays = days.filter(d => d.mood);
  if (validDays.length < 7) return { correlation: 0, dataPoints: validDays.length };
  
  const journalingScores = validDays.map(d => 
    (d.notes && d.notes.length > 20) || (d.emotionalNotes && d.emotionalNotes.length > 20) ? 1 : 0
  );
  const moodScores = validDays.map(d => (moodScoreMap[d.mood!] || 50) / 100);
  
  return { 
    correlation: calculateCorrelation(journalingScores, moodScores),
    dataPoints: validDays.length 
  };
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length < 3) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return Math.max(0, numerator / denominator);
};

export type WeeklyNarrative = {
  headline: string;
  body: string;
  moodSummary: string;
  comparison: string;
  keyInsight: string;
  tone: 'positive' | 'neutral' | 'supportive';
};

export const generateWeeklyNarrative = (
  currentWeekDays: DayDataType[],
  previousWeekDays: DayDataType[],
  patternChange: PatternChange,
  causeEffects: CauseEffectHint[]
): WeeklyNarrative => {
  const getMoodAvg = (days: DayDataType[]) => {
    const scores = days.filter(d => d.mood).map(d => moodScoreMap[d.mood!] || 50);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  };
  
  const getMoodVariance = (days: DayDataType[]) => {
    const scores = days.filter(d => d.mood).map(d => moodScoreMap[d.mood!] || 50);
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length);
  };
  
  const currentMoodAvg = getMoodAvg(currentWeekDays);
  const prevMoodAvg = getMoodAvg(previousWeekDays);
  const currentVariance = getMoodVariance(currentWeekDays);
  const prevVariance = getMoodVariance(previousWeekDays);
  
  const moodChange = currentMoodAvg - prevMoodAvg;
  const isMoreStable = currentVariance < prevVariance - 5;
  const isLessStable = currentVariance > prevVariance + 5;
  
  let headline: string;
  let body: string;
  let moodSummary: string;
  let comparison: string;
  let keyInsight: string;
  let tone: 'positive' | 'neutral' | 'supportive';
  
  if (patternChange.type === 'improvement') {
    tone = 'positive';
    headline = 'A Strong Week';
    moodSummary = currentMoodAvg >= 70 
      ? 'Your mood has been notably positive this week.'
      : 'Your mood showed real improvement this week.';
  } else if (patternChange.type === 'decline') {
    tone = 'supportive';
    headline = 'A Challenging Week';
    moodSummary = 'This week has had its ups and downs, and that\'s okay.';
  } else if (patternChange.type === 'shift') {
    tone = 'neutral';
    headline = 'A Week of Change';
    moodSummary = 'Your patterns shifted this week — something to notice, not worry about.';
  } else {
    tone = 'neutral';
    headline = 'Steady Progress';
    moodSummary = 'Your mood has been consistent with recent patterns.';
  }
  
  if (isMoreStable) {
    comparison = 'Your mood was more stable than last week.';
  } else if (isLessStable) {
    comparison = 'Your mood varied more than last week — this can be completely normal.';
  } else if (moodChange > 10) {
    comparison = `Your overall mood improved by ${Math.round(moodChange)}% compared to last week.`;
  } else if (moodChange < -10) {
    comparison = `Your mood dipped a bit from last week. Be gentle with yourself.`;
  } else {
    comparison = 'Your patterns are similar to last week — consistency is valuable.';
  }
  
  if (causeEffects.length > 0) {
    const topFactor = causeEffects[0];
    keyInsight = topFactor.narrative;
  } else if (isMoreStable) {
    keyInsight = 'Your emotional stability is a sign of resilience.';
  } else if (currentWeekDays.some(d => d.sleep && d.sleep >= 7)) {
    keyInsight = 'Good sleep days appeared this week — worth noting!';
  } else {
    keyInsight = 'Keep tracking to unlock more personalized insights.';
  }
  
  body = `${moodSummary} ${comparison}`;
  
  return {
    headline,
    body,
    moodSummary,
    comparison,
    keyInsight,
    tone,
  };
};
