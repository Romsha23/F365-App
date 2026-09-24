import {
  IVFAssessmentInput,
  IVFReadinessResult,
  IVFSubScore,
  IVFCategory,
} from '@/types/ivf-readiness';

function getAgeScore(ageRange: string): IVFSubScore {
  let score = 5;
  let level: IVFSubScore['level'] = 'low';
  let description = 'Age is on your side for natural conception.';

  switch (ageRange) {
    case 'under_25':
      score = 3;
      level = 'low';
      description = 'Age is strongly in your favour.';
      break;
    case '25_29':
      score = 5;
      level = 'low';
      description = 'Age is on your side for natural conception.';
      break;
    case '30_34':
      score = 10;
      level = 'moderate';
      description = 'Fertility begins a gradual decline around 30.';
      break;
    case '35_37':
      score = 18;
      level = 'high';
      description = 'Fertility declines more noticeably after 35.';
      break;
    case '38_40':
      score = 22;
      level = 'high';
      description = 'Egg quality and quantity decline significantly.';
      break;
    case '41_plus':
      score = 25;
      level = 'high';
      description = 'Professional fertility guidance is strongly recommended.';
      break;
  }

  return { label: 'Age Impact', score, maxScore: 25, level, description };
}

function getCycleScore(regularity: string): IVFSubScore {
  let score = 5;
  let level: IVFSubScore['level'] = 'low';
  let description = 'Regular cycles suggest healthy ovulation patterns.';

  switch (regularity) {
    case 'regular':
      score = 5;
      level = 'low';
      description = 'Regular cycles suggest healthy ovulation patterns.';
      break;
    case 'mildly_irregular':
      score = 10;
      level = 'moderate';
      description = 'Mildly irregular cycles may indicate minor hormonal variations.';
      break;
    case 'highly_irregular':
      score = 18;
      level = 'high';
      description = 'Highly irregular cycles often indicate ovulation issues.';
      break;
    case 'no_periods':
      score = 20;
      level = 'high';
      description = 'Absent periods may indicate anovulation — professional evaluation recommended.';
      break;
  }

  return { label: 'Cycle Health', score, maxScore: 20, level, description };
}

function getTimeToConceiveScore(time: string): IVFSubScore {
  let score = 5;
  let level: IVFSubScore['level'] = 'low';
  let description = 'Still early — most couples conceive within 12 months.';

  switch (time) {
    case 'not_yet':
      score = 2;
      level = 'low';
      description = 'Not yet actively trying — baseline assessment.';
      break;
    case 'under_6':
      score = 5;
      level = 'low';
      description = 'Still early — most couples conceive within 12 months.';
      break;
    case '6_12':
      score = 10;
      level = 'moderate';
      description = '6-12 months is normal but worth monitoring closely.';
      break;
    case '12_18':
      score = 16;
      level = 'high';
      description = 'After 12 months, a specialist consultation is recommended.';
      break;
    case '18_plus':
      score = 20;
      level = 'high';
      description = 'Extended time trying strongly suggests fertility evaluation.';
      break;
  }

  return { label: 'Time Trying', score, maxScore: 20, level, description };
}

function getMedicalScore(history: IVFAssessmentInput['medicalHistory']): IVFSubScore {
  let score = 0;
  const conditions: string[] = [];

  if (history.pcos) { score += 4; conditions.push('PCOS'); }
  if (history.endometriosis) { score += 4; conditions.push('Endometriosis'); }
  if (history.thyroidIssue) { score += 3; conditions.push('Thyroid'); }
  if (history.previousMiscarriage) { score += 3; conditions.push('Previous miscarriage'); }
  if (history.previousIVF) { score += 4; conditions.push('Previous IVF'); }
  if (history.fibroids) { score += 2; conditions.push('Fibroids'); }

  score = Math.min(score, 15);

  let level: IVFSubScore['level'] = 'low';
  let description = 'No significant medical risk factors identified.';

  if (score >= 10) {
    level = 'high';
    description = `Multiple conditions detected (${conditions.join(', ')}). Specialist guidance strongly recommended.`;
  } else if (score >= 5) {
    level = 'moderate';
    description = `${conditions.join(', ')} detected. Monitor closely with your healthcare provider.`;
  } else if (score > 0) {
    level = 'low';
    description = `${conditions.join(', ')} noted. Continue monitoring.`;
  }

  return { label: 'Medical Factors', score, maxScore: 15, level, description };
}

function getOvulationScore(confidence: string): IVFSubScore {
  let score = 2;
  let level: IVFSubScore['level'] = 'low';
  let description = 'Consistent ovulation detected from your tracking data.';

  switch (confidence) {
    case 'consistent':
      score = 2;
      level = 'low';
      description = 'Consistent ovulation detected from your tracking data.';
      break;
    case 'uncertain':
      score = 6;
      level = 'moderate';
      description = 'Ovulation patterns are uncertain — consider OPK testing.';
      break;
    case 'rare':
      score = 9;
      level = 'high';
      description = 'Rare ovulation significantly reduces natural conception chances.';
      break;
    case 'unknown':
      score = 7;
      level = 'moderate';
      description = 'Insufficient data to assess ovulation — track for 2+ cycles.';
      break;
  }

  return { label: 'Ovulation Confidence', score, maxScore: 10, level, description };
}

function getSymptomScore(profile: IVFAssessmentInput['symptomProfile']): IVFSubScore {
  let score = 0;

  const painMap = { low: 1, moderate: 3, high: 5 };
  const moodMap = { low: 0, moderate: 1, high: 3 };

  score += painMap[profile.painSeverity] || 1;
  score += moodMap[profile.moodSwings] || 0;
  if (profile.irregularBleeding) score += 2;
  if (profile.hormonalAcne) score += 1;

  score = Math.min(score, 10);

  let level: IVFSubScore['level'] = 'low';
  let description = 'Symptom profile is within normal range.';

  if (score >= 7) {
    level = 'high';
    description = 'Significant symptoms may indicate underlying hormonal imbalance.';
  } else if (score >= 4) {
    level = 'moderate';
    description = 'Moderate symptoms — worth discussing with your provider.';
  }

  return { label: 'Symptom Severity', score, maxScore: 10, level, description };
}

function getCategory(score: number): IVFCategory {
  if (score <= 30) return 'low';
  if (score <= 60) return 'watch';
  if (score <= 80) return 'high';
  return 'critical';
}

function getCategoryLabel(category: IVFCategory): string {
  switch (category) {
    case 'low': return 'Low';
    case 'watch': return 'Watch';
    case 'high': return 'High';
    case 'critical': return 'Critical';
  }
}

function generateActions(
  category: IVFCategory,
  subScores: IVFReadinessResult['subScores'],
  input: IVFAssessmentInput,
): string[] {
  const actions: string[] = [];

  if (category === 'critical' || category === 'high') {
    actions.push('Consult a fertility specialist within 1-3 months.');
  }

  if (subScores.ovulation.level === 'moderate' || subScores.ovulation.level === 'high') {
    actions.push('Improve ovulation tracking for at least 2 more cycles.');
  }

  if (subScores.cycle.level === 'high') {
    actions.push('Discuss cycle irregularities with your healthcare provider.');
  }

  if (subScores.medical.score >= 5) {
    actions.push('Consider hormonal testing (AMH, FSH, LH, thyroid panel).');
  }

  if (input.stressLevel === 'high' || input.stressLevel === 'very_high') {
    actions.push('Address stress management — high stress can affect ovulation.');
  }

  if (subScores.symptoms.level === 'high') {
    actions.push('Track symptom patterns to share with your provider.');
  }

  if (category === 'low' || category === 'watch') {
    actions.push('Continue regular cycle tracking and healthy lifestyle habits.');
  }

  if (subScores.age.score >= 18) {
    actions.push('Consider egg quality assessment (AMH blood test).');
  }

  return actions.slice(0, 5);
}

function generatePredictions(score: number): IVFReadinessResult['predictions'] {
  let interventionLikelihood = 0;
  let naturalConceptionLikelihood = 0;

  if (score <= 20) {
    interventionLikelihood = 10;
    naturalConceptionLikelihood = 85;
  } else if (score <= 35) {
    interventionLikelihood = 20;
    naturalConceptionLikelihood = 72;
  } else if (score <= 50) {
    interventionLikelihood = 38;
    naturalConceptionLikelihood = 55;
  } else if (score <= 65) {
    interventionLikelihood = 55;
    naturalConceptionLikelihood = 38;
  } else if (score <= 80) {
    interventionLikelihood = 68;
    naturalConceptionLikelihood = 25;
  } else {
    interventionLikelihood = 80;
    naturalConceptionLikelihood = 15;
  }

  return { interventionLikelihood, naturalConceptionLikelihood };
}

export function calculateIVFReadiness(
  input: IVFAssessmentInput,
  userId: string,
): IVFReadinessResult {
  console.log('[IVF Scoring] Calculating readiness for user:', userId);

  const age = getAgeScore(input.ageRange);
  const cycle = getCycleScore(input.cycleRegularity);
  const timeToConceive = getTimeToConceiveScore(input.timeConceiving);
  const medical = getMedicalScore(input.medicalHistory);
  const ovulation = getOvulationScore(input.ovulationConfidence);
  const symptoms = getSymptomScore(input.symptomProfile);

  const totalScore = age.score + cycle.score + timeToConceive.score + medical.score + ovulation.score + symptoms.score;
  const category = getCategory(totalScore);

  const subScores = { age, cycle, timeToConceive, medical, ovulation, symptoms };
  const actions = generateActions(category, subScores, input);
  const predictions = generatePredictions(totalScore);

  const now = new Date().toISOString();

  const result: IVFReadinessResult = {
    id: `ivf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    totalScore,
    category,
    subScores,
    predictions,
    actions,
    input,
    createdAt: now,
    updatedAt: now,
  };

  console.log('[IVF Scoring] Result:', totalScore, '/', 100, '→', getCategoryLabel(category));
  return result;
}
