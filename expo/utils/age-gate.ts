import { LifeStage } from '@/types/user';

export type AgeGroup = 'teen' | 'young_adult' | 'adult' | 'mature';

export interface AgeGateResult {
  age: number | undefined;
  ageGroup: AgeGroup;
  isTeen: boolean;
  canSeeFertility: boolean;
  canSeeIVF: boolean;
  canSeeClinicFinder: boolean;
  canSeeCostEstimator: boolean;
  canSeePartnerModule: boolean;
  canSeePremiumUpsell: boolean;
}

export function calculateAge(birthMonth?: number, birthYear?: number): number | undefined {
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

export function getAgeGroup(age: number | undefined): AgeGroup {
  if (age === undefined) return 'adult';
  if (age < 18) return 'teen';
  if (age < 25) return 'young_adult';
  if (age < 35) return 'adult';
  return 'mature';
}

export function getAgeGateResult(
  birthMonth?: number,
  birthYear?: number,
  lifeStage?: LifeStage,
  storedAgeGroup?: string
): AgeGateResult {
  const age = calculateAge(birthMonth, birthYear);
  // Use live age group if birth data available; else fall back to DB-persisted age_group
  const computedGroup = getAgeGroup(age);
  const ageGroup: AgeGroup = (computedGroup !== 'adult' || !storedAgeGroup)
    ? computedGroup
    : (storedAgeGroup as AgeGroup);
  const isTeen = ageGroup === 'teen';

  const isLifeStageAdult = lifeStage === 'trying_to_conceive' || lifeStage === 'pregnant' || lifeStage === 'postpartum';

  return {
    age,
    ageGroup,
    isTeen,
    canSeeFertility: !isTeen,
    canSeeIVF: !isTeen && (ageGroup === 'adult' || ageGroup === 'mature' || isLifeStageAdult),
    canSeeClinicFinder: !isTeen,
    canSeeCostEstimator: !isTeen,
    canSeePartnerModule: !isTeen,
    canSeePremiumUpsell: !isTeen,
  };
}

export function getTeenSafeContent(ageGroup: AgeGroup): {
  sectionTitle: string;
  tips: { title: string; description: string }[];
} {
  if (ageGroup === 'teen') {
    return {
      sectionTitle: 'Understand Your Body',
      tips: [
        {
          title: 'Why your cycle may be irregular',
          description: 'It\'s completely normal for periods to be irregular in the first few years. Your body is still adjusting.',
        },
        {
          title: 'What\'s normal in early years',
          description: 'Cycles can range from 21-45 days when you\'re young. They usually become more regular over time.',
        },
        {
          title: 'How to manage cramps',
          description: 'Gentle exercise, a warm compress, and staying hydrated can help ease period discomfort.',
        },
        {
          title: 'Mood changes are normal',
          description: 'Hormonal changes can affect your mood before and during your period. This is completely natural.',
        },
        {
          title: 'When to talk to a doctor',
          description: 'If your periods are extremely painful, very heavy, or you haven\'t had one by age 15, talk to a trusted adult or doctor.',
        },
      ],
    };
  }

  return {
    sectionTitle: 'Understand Your Body',
    tips: [
      {
        title: 'Cycle insights',
        description: 'Track patterns in your cycle to understand your hormonal rhythms better.',
      },
      {
        title: 'Hormonal patterns',
        description: 'Your hormones follow a predictable pattern each cycle, affecting energy, mood, and more.',
      },
      {
        title: 'Lifestyle impact',
        description: 'Sleep, diet, exercise, and stress all influence your menstrual cycle and overall wellbeing.',
      },
    ],
  };
}

export const TEEN_BLOCKED_SCREENS = [
  'ivf-assessment',
  'ivf-results',
  'clinic-finder',
  'clinic-detail',
  'clinic-consent',
  'fertility-predictions',
  'fertility-pathway',
  'cost-estimator',
  'doctor-questions',
  'ivf-roadmap',
  'partner-education',
  'partner-link',
  'partner-sharing',
  'partner-summary',
  'relationship-dashboard',
] as const;

export function isScreenBlockedForTeen(screenName: string): boolean {
  return (TEEN_BLOCKED_SCREENS as readonly string[]).includes(screenName);
}
