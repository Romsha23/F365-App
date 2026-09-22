export interface SymptomQuestion {
  id: string;
  question: string;
  description: string;
  options: SymptomOption[];
  category: 'physical' | 'emotional' | 'sleep' | 'pain';
  deliveryType: 'all' | 'vaginal' | 'c_section';
  relevantWeeks: { min: number; max: number };
  warningThreshold?: number;
  warningMessage?: string;
}

export interface SymptomOption {
  value: number;
  label: string;
  emoji: string;
}

const SEVERITY_OPTIONS: SymptomOption[] = [
  { value: 0, label: 'Not at all', emoji: '✅' },
  { value: 1, label: 'Mild', emoji: '🟡' },
  { value: 2, label: 'Moderate', emoji: '🟠' },
  { value: 3, label: 'Severe', emoji: '🔴' },
];

const FREQUENCY_OPTIONS: SymptomOption[] = [
  { value: 0, label: 'Never', emoji: '✅' },
  { value: 1, label: 'Rarely', emoji: '🟡' },
  { value: 2, label: 'Often', emoji: '🟠' },
  { value: 3, label: 'Always', emoji: '🔴' },
];

const AGREE_OPTIONS: SymptomOption[] = [
  { value: 0, label: 'Not at all', emoji: '✅' },
  { value: 1, label: 'A little', emoji: '🟡' },
  { value: 2, label: 'Quite a bit', emoji: '🟠' },
  { value: 3, label: 'Very much', emoji: '🔴' },
];

export const POSTPARTUM_SYMPTOM_QUESTIONS: SymptomQuestion[] = [
  {
    id: 'ppq_bleeding_amount',
    question: 'How heavy is your bleeding right now?',
    description: 'Postpartum bleeding (lochia) is normal but should gradually decrease.',
    options: [
      { value: 0, label: 'Stopped or spotting', emoji: '✅' },
      { value: 1, label: 'Light (like a light period)', emoji: '🟡' },
      { value: 2, label: 'Moderate (like a regular period)', emoji: '🟠' },
      { value: 3, label: 'Heavy (soaking a pad in 1–2 hours)', emoji: '🔴' },
    ],
    category: 'physical',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 8 },
    warningThreshold: 3,
    warningMessage: 'Heavy bleeding or soaking a pad in under an hour requires urgent medical attention. Please contact your doctor or go to the emergency department.',
  },
  {
    id: 'ppq_perineal_pain',
    question: 'How is your perineal pain or soreness?',
    description: 'Soreness from tears or episiotomy is common but should improve over weeks.',
    options: SEVERITY_OPTIONS,
    category: 'pain',
    deliveryType: 'vaginal',
    relevantWeeks: { min: 0, max: 8 },
    warningThreshold: 3,
    warningMessage: 'Severe perineal pain that is getting worse (not better) may indicate infection or a wound issue. Please see your doctor.',
  },
  {
    id: 'ppq_incision_pain',
    question: 'How is the pain around your C-section incision?',
    description: 'Some discomfort is normal, but it should gradually improve each week.',
    options: SEVERITY_OPTIONS,
    category: 'pain',
    deliveryType: 'c_section',
    relevantWeeks: { min: 0, max: 12 },
    warningThreshold: 3,
    warningMessage: 'If incision pain is worsening, or you see redness, swelling, warmth, or oozing, please contact your doctor — this may be an infection.',
  },
  {
    id: 'ppq_incision_healing',
    question: 'Does your incision show any signs of infection?',
    description: 'Check for redness, swelling, warmth, oozing, or foul smell around the scar.',
    options: [
      { value: 0, label: 'No, it looks clean and dry', emoji: '✅' },
      { value: 1, label: 'Slightly red but no other signs', emoji: '🟡' },
      { value: 2, label: 'Red and a little swollen', emoji: '🟠' },
      { value: 3, label: 'Oozing, hot, or foul-smelling', emoji: '🔴' },
    ],
    category: 'physical',
    deliveryType: 'c_section',
    relevantWeeks: { min: 0, max: 8 },
    warningThreshold: 2,
    warningMessage: 'Signs of infection at your incision need medical attention. Please contact your doctor today.',
  },
  {
    id: 'ppq_urinary_issues',
    question: 'Are you experiencing urinary leakage?',
    description: 'Leaking urine when coughing, laughing, or sneezing can happen after birth.',
    options: FREQUENCY_OPTIONS,
    category: 'physical',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 52 },
  },
  {
    id: 'ppq_breast_issues',
    question: 'Are you having breast pain or engorgement?',
    description: 'Breast fullness and tenderness are common, especially in the first weeks.',
    options: SEVERITY_OPTIONS,
    category: 'pain',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 12 },
    warningThreshold: 3,
    warningMessage: 'Severe breast pain with redness, heat, or fever may be mastitis. Please see your doctor promptly.',
  },
  {
    id: 'ppq_mood_sadness',
    question: 'How often have you felt sad, down, or hopeless?',
    description: 'It is normal to have emotional ups and downs, but persistent sadness needs attention.',
    options: FREQUENCY_OPTIONS,
    category: 'emotional',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 52 },
    warningThreshold: 3,
    warningMessage: 'Persistent sadness or hopelessness may be a sign of postpartum depression. Please talk to your doctor. PANDA helpline: 1300 726 306.',
  },
  {
    id: 'ppq_mood_anxiety',
    question: 'How often have you felt anxious or worried?',
    description: 'Some worry is natural for new parents, but constant anxiety is not.',
    options: FREQUENCY_OPTIONS,
    category: 'emotional',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 52 },
    warningThreshold: 3,
    warningMessage: 'Persistent anxiety that interferes with daily life may be postpartum anxiety. Please speak to your healthcare provider.',
  },
  {
    id: 'ppq_bonding',
    question: 'Do you feel connected to your baby?',
    description: 'Bonding takes time for many parents and does not always happen instantly.',
    options: [
      { value: 0, label: 'Yes, I feel very bonded', emoji: '💚' },
      { value: 1, label: 'It is growing slowly', emoji: '🟡' },
      { value: 2, label: 'I feel somewhat disconnected', emoji: '🟠' },
      { value: 3, label: 'I feel nothing or resentful', emoji: '🔴' },
    ],
    category: 'emotional',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 52 },
    warningThreshold: 3,
    warningMessage: 'Difficulty bonding can be a sign of postpartum depression. This is not your fault and help is available. Please talk to your doctor.',
  },
  {
    id: 'ppq_intrusive_thoughts',
    question: 'Do you have scary or unwanted thoughts about yourself or your baby?',
    description: 'Intrusive thoughts are more common than people think. Having them does not mean you will act on them.',
    options: FREQUENCY_OPTIONS,
    category: 'emotional',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 52 },
    warningThreshold: 2,
    warningMessage: 'Intrusive thoughts are distressing but treatable. Please speak to a healthcare professional. If you feel unsafe, call Lifeline: 13 11 14.',
  },
  {
    id: 'ppq_sleep_quality',
    question: 'How is your sleep quality (beyond normal newborn wake-ups)?',
    description: 'Broken sleep is expected, but not being able to sleep even when baby is sleeping is a concern.',
    options: [
      { value: 0, label: 'I sleep well when I can', emoji: '✅' },
      { value: 1, label: 'Somewhat disrupted', emoji: '🟡' },
      { value: 2, label: 'Poor — restless even when baby sleeps', emoji: '🟠' },
      { value: 3, label: 'Cannot sleep at all, even exhausted', emoji: '🔴' },
    ],
    category: 'sleep',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 52 },
    warningThreshold: 3,
    warningMessage: 'Inability to sleep despite exhaustion can be a sign of postpartum anxiety or depression. Please talk to your doctor.',
  },
  {
    id: 'ppq_csection_mobility',
    question: 'How is your mobility and movement?',
    description: 'Getting around should gradually become easier after surgery.',
    options: [
      { value: 0, label: 'Moving well, minimal discomfort', emoji: '✅' },
      { value: 1, label: 'Some stiffness but managing', emoji: '🟡' },
      { value: 2, label: 'Difficulty with basic movements', emoji: '🟠' },
      { value: 3, label: 'Unable to do daily tasks from pain', emoji: '🔴' },
    ],
    category: 'physical',
    deliveryType: 'c_section',
    relevantWeeks: { min: 0, max: 8 },
    warningThreshold: 3,
    warningMessage: 'Severe mobility issues after C-section may need medical review. Please contact your doctor.',
  },
  {
    id: 'ppq_vaginal_pelvic_pressure',
    question: 'Do you feel heaviness or pressure in your pelvis?',
    description: 'Pelvic floor weakness after vaginal birth can cause a sensation of heaviness.',
    options: FREQUENCY_OPTIONS,
    category: 'physical',
    deliveryType: 'vaginal',
    relevantWeeks: { min: 2, max: 52 },
  },
  {
    id: 'ppq_appetite',
    question: 'How is your appetite?',
    description: 'Eating well supports recovery and milk production if breastfeeding.',
    options: [
      { value: 0, label: 'Normal, eating well', emoji: '✅' },
      { value: 1, label: 'Slightly reduced but eating', emoji: '🟡' },
      { value: 2, label: 'Poor appetite, skipping meals', emoji: '🟠' },
      { value: 3, label: 'No desire to eat at all', emoji: '🔴' },
    ],
    category: 'physical',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 24 },
    warningThreshold: 3,
    warningMessage: 'Complete loss of appetite postpartum can be a sign of depression or other health issues. Please speak to your doctor.',
  },
  {
    id: 'ppq_support',
    question: 'Do you feel you have enough support?',
    description: 'Support from partner, family, friends, or professionals is crucial during this time.',
    options: AGREE_OPTIONS,
    category: 'emotional',
    deliveryType: 'all',
    relevantWeeks: { min: 0, max: 52 },
  },
];

export function getQuestionsForUser(
  weeksPostpartum: number,
  deliveryType: 'vaginal' | 'c_section' | 'vbac',
): SymptomQuestion[] {
  const effectiveType = deliveryType === 'vbac' ? 'vaginal' : deliveryType;

  return POSTPARTUM_SYMPTOM_QUESTIONS.filter(q => {
    const weekMatch = weeksPostpartum >= q.relevantWeeks.min && weeksPostpartum <= q.relevantWeeks.max;
    const typeMatch = q.deliveryType === 'all' || q.deliveryType === effectiveType;
    return weekMatch && typeMatch;
  });
}

export function assessResponses(
  responses: Record<string, number>,
): { score: number; level: 'low' | 'moderate' | 'high'; warnings: string[] } {
  const values = Object.values(responses);
  const totalScore = values.reduce((sum, v) => sum + v, 0);
  const maxScore = values.length * 3;
  const percentage = maxScore > 0 ? totalScore / maxScore : 0;

  const warnings: string[] = [];
  for (const [qId, value] of Object.entries(responses)) {
    const question = POSTPARTUM_SYMPTOM_QUESTIONS.find(q => q.id === qId);
    if (question?.warningThreshold !== undefined && value >= question.warningThreshold && question.warningMessage) {
      warnings.push(question.warningMessage);
    }
  }

  let level: 'low' | 'moderate' | 'high' = 'low';
  if (percentage > 0.6) level = 'high';
  else if (percentage > 0.3) level = 'moderate';

  return { score: totalScore, level, warnings: [...new Set(warnings)] };
}
