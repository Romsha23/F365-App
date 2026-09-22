export type PerimenopauseSymptom =
  | 'hot_flashes'
  | 'night_sweats'
  | 'irregular_periods'
  | 'heavy_periods'
  | 'vaginal_dryness'
  | 'mood_changes'
  | 'sleep_issues'
  | 'brain_fog'
  | 'joint_pain'
  | 'weight_gain'
  | 'hair_thinning'
  | 'skin_changes'
  | 'heart_palpitations'
  | 'anxiety'
  | 'depression'
  | 'fatigue'
  | 'headaches'
  | 'low_libido'
  | 'urinary_issues'
  | 'bloating';

export type PerimenopauseMood =
  | 'great'
  | 'good'
  | 'okay'
  | 'low'
  | 'anxious'
  | 'irritable'
  | 'emotional'
  | 'overwhelmed';

export type HotFlashIntensity = 'mild' | 'moderate' | 'severe';

export interface PerimenopauseDayLog {
  id: string;
  date: string;
  symptoms: PerimenopauseSymptom[];
  mood: PerimenopauseMood;
  hotFlashCount?: number;
  hotFlashIntensity?: HotFlashIntensity;
  nightSweatsCount?: number;
  sleepHours?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  hadPeriod?: boolean;
  periodFlow?: 'spotting' | 'light' | 'moderate' | 'heavy';
  energyLevel?: number;
  notes?: string;
}

export interface PerimenopauseProfile {
  id: string;
  userId: string;
  lastPeriodDate?: string;
  periodPattern?: 'regular' | 'irregular' | 'skipping' | 'stopped';
  monthsSinceLastPeriod?: number;
  hrtType?: 'none' | 'estrogen' | 'combined' | 'other';
  supplements?: string[];
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

export const PERIMENOPAUSE_SYMPTOM_OPTIONS: { id: PerimenopauseSymptom; label: string; emoji: string; category: string }[] = [
  { id: 'hot_flashes', label: 'Hot Flashes', emoji: '🔥', category: 'Vasomotor' },
  { id: 'night_sweats', label: 'Night Sweats', emoji: '💦', category: 'Vasomotor' },
  { id: 'irregular_periods', label: 'Irregular Periods', emoji: '📅', category: 'Menstrual' },
  { id: 'heavy_periods', label: 'Heavy Periods', emoji: '🩸', category: 'Menstrual' },
  { id: 'vaginal_dryness', label: 'Vaginal Dryness', emoji: '💧', category: 'Urogenital' },
  { id: 'mood_changes', label: 'Mood Changes', emoji: '🎭', category: 'Mood' },
  { id: 'sleep_issues', label: 'Sleep Issues', emoji: '😴', category: 'Sleep' },
  { id: 'brain_fog', label: 'Brain Fog', emoji: '🌫️', category: 'Cognitive' },
  { id: 'joint_pain', label: 'Joint Pain', emoji: '🦴', category: 'Physical' },
  { id: 'weight_gain', label: 'Weight Changes', emoji: '⚖️', category: 'Physical' },
  { id: 'hair_thinning', label: 'Hair Thinning', emoji: '💇', category: 'Physical' },
  { id: 'skin_changes', label: 'Skin Changes', emoji: '✨', category: 'Physical' },
  { id: 'heart_palpitations', label: 'Heart Palpitations', emoji: '💓', category: 'Vasomotor' },
  { id: 'anxiety', label: 'Anxiety', emoji: '😰', category: 'Mood' },
  { id: 'depression', label: 'Low Mood', emoji: '😢', category: 'Mood' },
  { id: 'fatigue', label: 'Fatigue', emoji: '😩', category: 'Physical' },
  { id: 'headaches', label: 'Headaches', emoji: '🤕', category: 'Physical' },
  { id: 'low_libido', label: 'Low Libido', emoji: '💔', category: 'Urogenital' },
  { id: 'urinary_issues', label: 'Urinary Issues', emoji: '🚻', category: 'Urogenital' },
  { id: 'bloating', label: 'Bloating', emoji: '🫧', category: 'Physical' },
];

export const PERIMENOPAUSE_EDUCATION_ARTICLES = [
  {
    id: 'what-is-perimenopause',
    title: 'What is Perimenopause?',
    summary: 'Understanding the transition phase before menopause and what to expect.',
    category: 'Basics',
    emoji: '📖',
    content: `Perimenopause is the transitional period leading up to menopause. It typically begins in your 40s but can start in your mid-30s. During this time, your ovaries gradually produce less estrogen.\n\nKey facts:\n• Average duration: 4-8 years\n• Menopause is confirmed after 12 consecutive months without a period\n• Symptoms vary widely between individuals\n• You can still get pregnant during perimenopause\n\nCommon signs include irregular periods, hot flashes, sleep disturbances, and mood changes. Every woman's experience is unique.`,
  },
  {
    id: 'managing-hot-flashes',
    title: 'Managing Hot Flashes',
    summary: 'Practical tips and strategies for dealing with hot flashes and night sweats.',
    category: 'Symptoms',
    emoji: '🔥',
    content: `Hot flashes are one of the most common perimenopause symptoms, affecting up to 75% of women.\n\nQuick relief strategies:\n• Dress in layers you can easily remove\n• Keep your bedroom cool (60-67°F / 15-19°C)\n• Avoid triggers: spicy food, alcohol, caffeine, hot drinks\n• Try slow, deep breathing when a flash starts\n• Use a portable fan or cooling towel\n\nLong-term management:\n• Regular exercise can reduce frequency\n• Maintaining a healthy weight helps\n• Stress management techniques like yoga or meditation\n• Discuss HRT options with your doctor if symptoms are severe\n• Some supplements like black cohosh may help (consult your doctor first)`,
  },
  {
    id: 'hormone-changes',
    title: 'Understanding Hormone Changes',
    summary: 'How estrogen, progesterone, and other hormones shift during perimenopause.',
    category: 'Science',
    emoji: '🧬',
    content: `During perimenopause, your hormone levels fluctuate significantly before declining.\n\nEstrogen:\n• Levels become erratic — sometimes higher, sometimes lower than normal\n• This rollercoaster causes many perimenopause symptoms\n• Eventually levels decrease permanently\n\nProgesterone:\n• Declines more steadily than estrogen\n• Lower progesterone can cause heavier or irregular periods\n• Important for sleep and mood regulation\n\nTestosterone:\n• Gradually declines from your 20s onward\n• Can affect energy, libido, and muscle mass\n\nFSH (Follicle Stimulating Hormone):\n• Rises as the body tries to stimulate the ovaries\n• Blood tests measuring FSH can help confirm perimenopause`,
  },
  {
    id: 'sleep-solutions',
    title: 'Sleep Solutions',
    summary: 'How to improve sleep quality during hormonal transitions.',
    category: 'Wellness',
    emoji: '🌙',
    content: `Sleep disruption during perimenopause can be caused by night sweats, anxiety, or hormonal changes directly affecting sleep cycles.\n\nSleep hygiene tips:\n• Keep a consistent sleep schedule\n• Make your bedroom cool, dark, and quiet\n• Avoid screens 1 hour before bed\n• Limit caffeine after noon\n• Try magnesium supplements (consult doctor)\n\nFor night sweats:\n• Use moisture-wicking sleepwear and bedding\n• Keep a fan by your bed\n• Have a cold water bottle nearby\n\nRelaxation techniques:\n• Progressive muscle relaxation\n• 4-7-8 breathing technique\n• Guided meditation apps\n• Gentle stretching before bed`,
  },
  {
    id: 'bone-health',
    title: 'Protecting Your Bone Health',
    summary: 'Why bone density matters during perimenopause and how to maintain it.',
    category: 'Health',
    emoji: '🦴',
    content: `Estrogen plays a crucial role in maintaining bone density. As estrogen declines during perimenopause, bone loss accelerates.\n\nKey facts:\n• Women can lose up to 20% of bone density in the 5-7 years after menopause\n• Osteoporosis risk increases significantly\n• Prevention is much easier than treatment\n\nProtect your bones:\n• Weight-bearing exercise (walking, dancing, strength training)\n• Adequate calcium intake (1200mg/day for women over 50)\n• Vitamin D (600-800 IU daily, or as recommended)\n• Limit alcohol and avoid smoking\n• Ask your doctor about bone density screening (DEXA scan)\n\nFoods rich in calcium:\n• Dairy products, fortified plant milks\n• Leafy greens (kale, broccoli)\n• Sardines, salmon with bones\n• Tofu made with calcium sulfate`,
  },
  {
    id: 'mental-health',
    title: 'Mental Health & Mood',
    summary: 'Managing anxiety, mood swings, and emotional changes.',
    category: 'Wellness',
    emoji: '🧠',
    content: `Hormonal fluctuations during perimenopause can significantly impact mental health. This is real, valid, and not "all in your head."\n\nCommon experiences:\n• Increased anxiety or panic attacks\n• Mood swings and irritability\n• Difficulty concentrating (brain fog)\n• Feeling less confident\n• Depression symptoms\n\nWhat helps:\n• Regular physical activity (powerful mood booster)\n• Mindfulness and meditation\n• Social connections — talk to friends going through similar changes\n• Therapy (CBT is particularly effective)\n• Adequate sleep and nutrition\n\nWhen to seek help:\n• Persistent low mood for more than 2 weeks\n• Anxiety interfering with daily life\n• Thoughts of self-harm\n• Significant changes in appetite or sleep\n\nRemember: seeking help is a sign of strength, not weakness.`,
  },
];
