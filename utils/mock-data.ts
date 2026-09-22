import { CycleType, DayDataType, PredictionsType, InsightType, FlowIntensity, MoodType, SymptomType, DischargeType, PainLevel, CravingType } from '../types/cycle';

// Helper function to create safe dates
const createSafeDate = (baseDate: Date, daysOffset: number = 0): Date => {
  try {
    const date = new Date(baseDate);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    
    date.setDate(date.getDate() + daysOffset);
    
    if (isNaN(date.getTime())) {
      return new Date();
    }
    
    return date;
  } catch (error) {
    console.error('Error creating safe date:', error);
    return new Date();
  }
};

// Generate initial cycle data for new users
export const generateInitialCycleData = (lastPeriodDate: string, _cycleLength: number): CycleType => {
  try {
    const startDate = new Date(lastPeriodDate);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid last period date');
    }
    
    const today = new Date();
    
    // Calculate how many days since period started
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const days: DayDataType[] = [];
    
    // Generate days from period start to today (max 7 days)
    for (let i = 0; i <= Math.min(daysSinceStart, 7); i++) {
      const dayDate = createSafeDate(startDate, i);
      
      // Generate realistic period flow pattern
      let flow: FlowIntensity = 'none';
      if (i === 0) flow = 'light';
      else if (i === 1 || i === 2) flow = 'medium';
      else if (i === 3) flow = 'heavy';
      else if (i === 4) flow = 'light';
      else if (i === 5) flow = 'spotting';
      else flow = 'none';
      
      // Generate symptoms based on day
      const symptoms: SymptomType[] = [];
      if (i <= 2) symptoms.push('cramps');
      if (i === 1 || i === 2) symptoms.push('fatigue');
      if (i === 0) symptoms.push('headache');
      if (i >= 1 && i <= 3) symptoms.push('bloating');
      
      // Generate mood based on day
      let mood: MoodType = 'neutral';
      if (i === 0) mood = 'irritated';
      else if (i === 1) mood = 'sad';
      else if (i >= 3) mood = 'happy';
      
      const dayData: DayDataType = {
        date: dayDate.toISOString(),
        flow,
        mood,
        symptoms,
        discharge: i === 0 ? 'brown' : 'none',
        painLevel: i <= 2 ? 'moderate' : 'none',
        cravings: i <= 1 ? ['chocolate', 'salty'] : [],
        notes: i === 0 ? 'Period started today' : '',
      };
      
      days.push(dayData);
    }
    
    return {
      id: `cycle-${Date.now()}`,
      startDate: lastPeriodDate,
      days,
      userId: `user-${Date.now()}`,
    };
  } catch (error) {
    console.error('Error generating initial cycle data:', error);
    
    // Return safe fallback
    const today = new Date();
    return {
      id: `cycle-${Date.now()}`,
      startDate: today.toISOString(),
      days: [],
      userId: `user-${Date.now()}`,
    };
  }
};

// Generate mock cycle data for demonstration
export const generateMockCycles = (): CycleType[] => {
  try {
    const cycles: CycleType[] = [];
    const today = new Date();
    
    // Generate 3 cycles going back in time
    for (let i = 0; i < 3; i++) {
      const cycleStartDate = createSafeDate(today, -(i * 28) - 5); // Each cycle 28 days apart, current cycle started 5 days ago
      
      const cycle: CycleType = {
        id: `cycle-${i + 1}`,
        startDate: cycleStartDate.toISOString(),
        days: generateMockDaysForCycle(cycleStartDate, i === 0), // Only current cycle has recent data
        userId: 'user-1',
      };
      
      cycles.push(cycle);
    }
    
    return cycles.reverse(); // Oldest first
  } catch (error) {
    console.error('Error generating mock cycles:', error);
    return [];
  }
};

// Generate rich dummy data for PDF export demonstration
export const generateRichDummyData = () => {
  const today = new Date();
  const cycles: CycleType[] = [];
  
  // Generate 6 cycles with detailed data
  for (let i = 0; i < 6; i++) {
    const cycleStartDate = createSafeDate(today, -(i * 28) - 5);
    const cycleLength = 26 + Math.floor(Math.random() * 5); // 26-30 days
    const periodLength = 4 + Math.floor(Math.random() * 3); // 4-6 days
    
    const days: DayDataType[] = [];
    
    // Generate full cycle days with realistic patterns
    for (let d = 0; d < Math.min(cycleLength, i === 0 ? 5 : periodLength + 10); d++) {
      const dayDate = createSafeDate(cycleStartDate, d);
      
      // Flow pattern
      let flow: FlowIntensity = 'none';
      if (d === 0) flow = 'light';
      else if (d === 1) flow = 'medium';
      else if (d === 2 || d === 3) flow = 'heavy';
      else if (d === 4) flow = 'medium';
      else if (d === 5) flow = 'light';
      else if (d === 6) flow = 'spotting';
      
      // Mood patterns based on cycle phase
      const moods: MoodType[] = ['irritated', 'sad', 'tired', 'neutral', 'neutral', 'happy', 'energetic', 'happy'];
      const mood = moods[Math.min(d, moods.length - 1)];
      
      // Symptoms based on cycle phase
      const symptoms: SymptomType[] = [];
      if (d <= 3) {
        symptoms.push('cramps');
        if (d <= 2) symptoms.push('fatigue');
        if (d === 0 || d === 1) symptoms.push('headache');
        if (d <= 4) symptoms.push('bloating');
      }
      if (d >= 1 && d <= 3) symptoms.push('backache');
      if (d === 2 || d === 3) symptoms.push('tender_breasts');
      
      // Discharge patterns
      let discharge: DischargeType = 'none';
      if (d === 0) discharge = 'brown';
      else if (d >= 7 && d <= 10) discharge = 'sticky';
      else if (d >= 11 && d <= 13) discharge = 'creamy';
      else if (d >= 14 && d <= 16) discharge = 'egg_white';
      
      // Pain levels
      let painLevel: PainLevel = 'none';
      if (d === 0 || d === 1) painLevel = 'moderate';
      else if (d === 2 || d === 3) painLevel = 'severe';
      else if (d === 4) painLevel = 'mild';
      
      // Cravings
      const cravings: CravingType[] = [];
      if (d <= 2) cravings.push('chocolate', 'salty');
      else if (d >= 3 && d <= 5) cravings.push('carbs');
      
      const dayData: DayDataType = {
        date: dayDate.toISOString(),
        flow,
        mood,
        moodIntensity: d <= 3 ? 3 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2),
        symptoms,
        discharge,
        painLevel,
        cravings,
        stressLevel: d <= 3 ? 3 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2),
        sleep: d <= 3 ? 5 + Math.floor(Math.random() * 2) : 7 + Math.floor(Math.random() * 2),
        exercise: d > 4 ? 20 + Math.floor(Math.random() * 40) : d > 2 ? Math.floor(Math.random() * 20) : 0,
        waterIntake: 4 + Math.floor(Math.random() * 5),
        temperature: 97.2 + Math.random() * 1.8,
        weight: 135 + Math.floor(Math.random() * 5) - 2,
        medications: d <= 3 ? ['Ibuprofen', 'Multivitamin'] : d <= 5 ? ['Multivitamin'] : [],
        notes: d === 0 ? 'Period started' : d === 2 ? 'Heavy flow day' : '',
      };
      
      days.push(dayData);
    }
    
    cycles.push({
      id: `cycle-${i + 1}`,
      startDate: cycleStartDate.toISOString(),
      endDate: i > 0 ? createSafeDate(cycleStartDate, cycleLength).toISOString() : undefined,
      length: i > 0 ? cycleLength : undefined,
      days,
      userId: 'user-1',
    });
  }
  
  // Generate 7-day and 30-day forecast data
  const forecastData = {
    sevenDayForecast: [
      { day: 'Mon', date: 'Jan 27', mood: 72, energy: 68, phase: 'follicular', symptoms: ['none'] },
      { day: 'Tue', date: 'Jan 28', mood: 75, energy: 72, phase: 'follicular', symptoms: ['none'] },
      { day: 'Wed', date: 'Jan 29', mood: 78, energy: 75, phase: 'follicular', symptoms: ['none'] },
      { day: 'Thu', date: 'Jan 30', mood: 82, energy: 80, phase: 'ovulation', symptoms: ['mild cramps'] },
      { day: 'Fri', date: 'Jan 31', mood: 85, energy: 82, phase: 'ovulation', symptoms: ['none'] },
      { day: 'Sat', date: 'Feb 1', mood: 80, energy: 78, phase: 'ovulation', symptoms: ['none'] },
      { day: 'Sun', date: 'Feb 2', mood: 76, energy: 74, phase: 'luteal', symptoms: ['mild fatigue'] },
    ],
    thirtyDayCycle: [
      { day: 1, phase: 'menstrual', flow: 'light', mood: 45, symptoms: 3 },
      { day: 2, phase: 'menstrual', flow: 'medium', mood: 40, symptoms: 4 },
      { day: 3, phase: 'menstrual', flow: 'heavy', mood: 38, symptoms: 5 },
      { day: 4, phase: 'menstrual', flow: 'medium', mood: 42, symptoms: 4 },
      { day: 5, phase: 'menstrual', flow: 'light', mood: 48, symptoms: 3 },
      { day: 6, phase: 'follicular', flow: 'spotting', mood: 55, symptoms: 2 },
      { day: 7, phase: 'follicular', flow: 'none', mood: 62, symptoms: 1 },
      { day: 8, phase: 'follicular', flow: 'none', mood: 68, symptoms: 1 },
      { day: 9, phase: 'follicular', flow: 'none', mood: 72, symptoms: 0 },
      { day: 10, phase: 'follicular', flow: 'none', mood: 75, symptoms: 0 },
      { day: 11, phase: 'follicular', flow: 'none', mood: 78, symptoms: 0 },
      { day: 12, phase: 'follicular', flow: 'none', mood: 82, symptoms: 0 },
      { day: 13, phase: 'ovulation', flow: 'none', mood: 85, symptoms: 1 },
      { day: 14, phase: 'ovulation', flow: 'none', mood: 88, symptoms: 1 },
      { day: 15, phase: 'ovulation', flow: 'none', mood: 85, symptoms: 1 },
      { day: 16, phase: 'luteal', flow: 'none', mood: 80, symptoms: 1 },
      { day: 17, phase: 'luteal', flow: 'none', mood: 76, symptoms: 1 },
      { day: 18, phase: 'luteal', flow: 'none', mood: 72, symptoms: 2 },
      { day: 19, phase: 'luteal', flow: 'none', mood: 70, symptoms: 2 },
      { day: 20, phase: 'luteal', flow: 'none', mood: 68, symptoms: 2 },
      { day: 21, phase: 'luteal', flow: 'none', mood: 65, symptoms: 2 },
      { day: 22, phase: 'luteal', flow: 'none', mood: 60, symptoms: 3 },
      { day: 23, phase: 'luteal', flow: 'none', mood: 55, symptoms: 3 },
      { day: 24, phase: 'luteal', flow: 'none', mood: 52, symptoms: 3 },
      { day: 25, phase: 'luteal', flow: 'none', mood: 50, symptoms: 4 },
      { day: 26, phase: 'luteal', flow: 'none', mood: 48, symptoms: 4 },
      { day: 27, phase: 'luteal', flow: 'none', mood: 45, symptoms: 4 },
      { day: 28, phase: 'luteal', flow: 'none', mood: 42, symptoms: 4 },
    ],
    cyclePhaseBreakdown: [
      { phase: 'Menstrual', days: 5, color: '#EC4899', percentage: 18 },
      { phase: 'Follicular', days: 8, color: '#10B981', percentage: 29 },
      { phase: 'Ovulation', days: 3, color: '#F59E0B', percentage: 11 },
      { phase: 'Luteal', days: 12, color: '#8B5CF6', percentage: 43 },
    ],
  };
  
  // Generate analytics data
  const analytics = {
    averageCycleLength: 28.3,
    cycleLengthVariation: 2.1,
    averagePeriodLength: 5.2,
    mostCommonSymptoms: [
      { symptom: 'cramps', frequency: 92 },
      { symptom: 'fatigue', frequency: 78 },
      { symptom: 'bloating', frequency: 67 },
      { symptom: 'headache', frequency: 45 },
      { symptom: 'backache', frequency: 38 },
    ],
    moodPatterns: [
      { phase: 'Menstrual (Days 1-5)', dominantMood: 'tired', avgIntensity: 3.8 },
      { phase: 'Follicular (Days 6-13)', dominantMood: 'happy', avgIntensity: 2.1 },
      { phase: 'Ovulation (Days 14-16)', dominantMood: 'energetic', avgIntensity: 2.5 },
      { phase: 'Luteal (Days 17-28)', dominantMood: 'neutral', avgIntensity: 2.8 },
    ],
    symptomTrends: {
      improving: ['headache', 'insomnia'],
      stable: ['cramps', 'bloating'],
      needsAttention: ['fatigue'],
    },
    cycleRegularity: 87,
    trackingConsistency: 94,
    lifestyleMetrics: {
      avgSleepHours: 6.8,
      avgSleepDuringPeriod: 5.9,
      avgSleepOtherDays: 7.4,
      avgExerciseMinutes: 32,
      exerciseDaysPerWeek: 4.2,
      avgWaterIntake: 6.5,
      avgTemperature: 97.8,
      temperatureRange: { min: 97.2, max: 98.6 },
      avgWeight: 136,
      weightVariation: 2.3,
    },
    medicationUsage: [
      { name: 'Ibuprofen', frequency: 'During period (days 1-3)', purpose: 'Pain relief' },
      { name: 'Multivitamin', frequency: 'Daily', purpose: 'General health' },
      { name: 'Iron supplement', frequency: 'During period', purpose: 'Replenish iron' },
    ],
    // MOOD & MENTAL WELLNESS ANALYTICS
    moodWellnessAnalytics: {
      overallMoodScore: 68, // 0-100 scale
      moodStabilityIndex: 72, // How stable moods are (higher = more stable)
      depressionRiskIndicator: 'Low', // Low, Moderate, Elevated, High
      anxietyPatternDetected: true,
      
      // Mood distribution across all tracked days
      moodDistribution: [
        { mood: 'happy', percentage: 28, daysLogged: 42 },
        { mood: 'neutral', percentage: 24, daysLogged: 36 },
        { mood: 'tired', percentage: 18, daysLogged: 27 },
        { mood: 'sad', percentage: 12, daysLogged: 18 },
        { mood: 'irritated', percentage: 10, daysLogged: 15 },
        { mood: 'anxious', percentage: 5, daysLogged: 8 },
        { mood: 'energetic', percentage: 3, daysLogged: 4 },
      ],
      
      // Mood scores by cycle phase (0-100, higher = better mood)
      moodByPhase: [
        { phase: 'Menstrual', avgScore: 42, lowMoodDays: 3.2, emoji: '😔' },
        { phase: 'Follicular', avgScore: 78, lowMoodDays: 0.8, emoji: '😊' },
        { phase: 'Ovulation', avgScore: 85, lowMoodDays: 0.3, emoji: '🌟' },
        { phase: 'Early Luteal', avgScore: 72, lowMoodDays: 1.1, emoji: '😌' },
        { phase: 'Late Luteal (PMS)', avgScore: 48, lowMoodDays: 2.8, emoji: '😣' },
      ],
      
      // Stress level analytics
      stressAnalytics: {
        avgStressLevel: 2.8,
        peakStressDays: 'Days 1-3, 24-28',
        lowStressDays: 'Days 8-16',
        stressTriggers: ['Menstrual pain', 'Poor sleep', 'PMS symptoms'],
        stressByPhase: [
          { phase: 'Menstrual', avgStress: 3.9 },
          { phase: 'Follicular', avgStress: 2.1 },
          { phase: 'Ovulation', avgStress: 1.8 },
          { phase: 'Luteal', avgStress: 3.2 },
        ],
      },
      
      // Emotional pattern analysis
      emotionalPatterns: {
        pmddIndicators: false,
        cyclicalDepressionPattern: true, // Mood dips predictably with cycle
        anxietyCorrelation: 'Moderate correlation with luteal phase',
        emotionalVolatilityScore: 35, // 0-100, lower = more stable
        
        // Days with significant mood drops
        lowMoodDays: [
          { cycleDay: 1, avgMoodScore: 35, frequency: '92%' },
          { cycleDay: 2, avgMoodScore: 38, frequency: '88%' },
          { cycleDay: 26, avgMoodScore: 45, frequency: '76%' },
          { cycleDay: 27, avgMoodScore: 42, frequency: '82%' },
          { cycleDay: 28, avgMoodScore: 40, frequency: '78%' },
        ],
        
        // Best mood days
        highMoodDays: [
          { cycleDay: 12, avgMoodScore: 82, frequency: '85%' },
          { cycleDay: 13, avgMoodScore: 85, frequency: '88%' },
          { cycleDay: 14, avgMoodScore: 88, frequency: '91%' },
          { cycleDay: 15, avgMoodScore: 84, frequency: '87%' },
        ],
      },
      
      // Correlation analysis
      correlations: [
        { factor: 'Sleep < 6 hours', moodImpact: -22, significance: 'High' },
        { factor: 'Exercise 30+ min', moodImpact: +18, significance: 'High' },
        { factor: 'Heavy flow days', moodImpact: -28, significance: 'Very High' },
        { factor: 'Severe pain', moodImpact: -35, significance: 'Very High' },
        { factor: 'Hydration 8+ glasses', moodImpact: +12, significance: 'Moderate' },
        { factor: 'Caffeine intake', moodImpact: -8, significance: 'Low' },
      ],
      
      // Monthly mood trend (last 6 months)
      monthlyMoodTrend: [
        { month: 'Aug 2025', avgScore: 62, lowDays: 8 },
        { month: 'Sep 2025', avgScore: 65, lowDays: 7 },
        { month: 'Oct 2025', avgScore: 68, lowDays: 6 },
        { month: 'Nov 2025', avgScore: 66, lowDays: 7 },
        { month: 'Dec 2025', avgScore: 70, lowDays: 5 },
        { month: 'Jan 2026', avgScore: 72, lowDays: 4 },
      ],
      
      // 12-month trend data
      yearlyTrend: [
        { month: 'Feb', avgMood: 58, avgSymptoms: 4.2, cycleLength: 29 },
        { month: 'Mar', avgMood: 61, avgSymptoms: 3.8, cycleLength: 28 },
        { month: 'Apr', avgMood: 65, avgSymptoms: 3.5, cycleLength: 28 },
        { month: 'May', avgMood: 62, avgSymptoms: 3.9, cycleLength: 27 },
        { month: 'Jun', avgMood: 68, avgSymptoms: 3.2, cycleLength: 28 },
        { month: 'Jul', avgMood: 70, avgSymptoms: 3.0, cycleLength: 29 },
        { month: 'Aug', avgMood: 62, avgSymptoms: 3.8, cycleLength: 28 },
        { month: 'Sep', avgMood: 65, avgSymptoms: 3.5, cycleLength: 28 },
        { month: 'Oct', avgMood: 68, avgSymptoms: 3.3, cycleLength: 27 },
        { month: 'Nov', avgMood: 66, avgSymptoms: 3.6, cycleLength: 29 },
        { month: 'Dec', avgMood: 70, avgSymptoms: 3.1, cycleLength: 28 },
        { month: 'Jan', avgMood: 72, avgSymptoms: 2.9, cycleLength: 28 },
      ],
      
      // Recommendations based on mood patterns
      recommendations: [
        'Your mood significantly improves with exercise. Consider light yoga or walking on days 1-3.',
        'Sleep quality directly impacts your mood. Prioritize 7+ hours during luteal phase.',
        'PMS symptoms start around day 24. Consider preemptive self-care strategies.',
        'Your best mood days align with ovulation. Schedule important activities during days 12-16.',
        'Stress peaks during menstruation. Try 10-min meditation or breathing exercises.',
      ],
    },
  };
  
  // Generate insights
  const insights: InsightType[] = [
    {
      id: 'insight-rich-1',
      title: 'Excellent Cycle Regularity',
      description: 'Your cycles have been consistently between 26-30 days over the past 6 months. This regularity (87% consistency) is a positive indicator of hormonal balance.',
      type: 'health',
      date: today.toISOString(),
      read: false,
    },
    {
      id: 'insight-rich-2',
      title: 'Symptom Pattern Identified',
      description: 'You experience cramps most intensely on days 2-3 of your cycle. Consider taking pain relief proactively on day 1 to manage discomfort better.',
      type: 'tip',
      date: createSafeDate(today, -1).toISOString(),
      read: false,
    },
    {
      id: 'insight-rich-3',
      title: 'Mood Correlation Found',
      description: 'Your mood tends to be lowest on days 1-2 of your period, but significantly improves by day 5. This pattern is consistent across your tracked cycles.',
      type: 'health',
      date: createSafeDate(today, -2).toISOString(),
      read: true,
    },
    {
      id: 'insight-rich-4',
      title: 'Sleep Quality Connection',
      description: 'You average 5.8 hours of sleep during your period vs 7.2 hours during other phases. Consider prioritizing rest during menstruation.',
      type: 'tip',
      date: createSafeDate(today, -3).toISOString(),
      read: false,
    },
    {
      id: 'insight-rich-5',
      title: 'Fertile Window Prediction',
      description: 'Based on your cycle patterns, your next fertile window is predicted to be January 8-12. Prediction confidence: 89%.',
      type: 'prediction',
      date: createSafeDate(today, -4).toISOString(),
      read: true,
    },
    {
      id: 'insight-rich-6',
      title: 'Exercise Impact Noted',
      description: 'On days when you exercised 30+ minutes, your reported pain levels were 40% lower. Consider light exercise to manage period symptoms.',
      type: 'health',
      date: createSafeDate(today, -5).toISOString(),
      read: false,
    },
  ];
  
  // Generate health analysis
  const healthAnalysis = {
    cycleSummary: 'Your menstrual cycles show excellent regularity with an average length of 28.3 days (±2.1 days). Over the past 6 cycles, your patterns have been consistent, which is a positive indicator of overall reproductive health.',
    potentialConcerns: 'Fatigue levels during menstruation are slightly elevated compared to typical ranges. Consider discussing iron levels with your healthcare provider if this persists.',
    hormonalBalance: 'Based on your cycle length consistency and symptom patterns, your hormonal balance appears stable. The regularity of your ovulation window (predicted with 89% confidence) supports this assessment.',
    nutritionalRecommendations: 'Increase iron-rich foods (spinach, red meat, legumes) during days 1-5. Consider magnesium supplements to help with cramps. Stay hydrated with 8+ glasses of water daily, especially during menstruation.',
    lifestyleRecommendations: 'Maintain your current exercise routine but consider lighter activities during days 1-3. Your sleep data suggests room for improvement during menstruation - aim for 7-8 hours.',
    stressManagement: 'Your stress levels peak during days 1-3 of your cycle. Try incorporating 10-15 minutes of meditation or deep breathing exercises during this time.',
    fertilityInsights: 'Your ovulation pattern is predictable, typically occurring around day 14 of your cycle. Your fertile window spans approximately 5 days. Cervical mucus changes align well with predicted ovulation.',
  };
  
  // Generate predictions
  const predictions = {
    nextPeriodDate: createSafeDate(today, 23).toISOString(),
    fertileWindowStart: createSafeDate(today, 9).toISOString(),
    fertileWindowEnd: createSafeDate(today, 14).toISOString(),
    confidence: 0.89,
    averageCycleLength: 28.3,
    averagePeriodLength: 5.2,
  };
  
  return {
    cycles: cycles.reverse(),
    analytics,
    forecastData,
    insights,
    healthAnalysis,
    predictions,
  };
};

const generateMockDaysForCycle = (startDate: Date, isCurrentCycle: boolean): DayDataType[] => {
  try {
    const days: DayDataType[] = [];
    const daysToGenerate = isCurrentCycle ? 5 : 7; // Current cycle: 5 days, past cycles: full period
    
    for (let i = 0; i < daysToGenerate; i++) {
      const dayDate = createSafeDate(startDate, i);
      
      // Generate realistic period flow pattern
      let flow: FlowIntensity = 'none';
      if (i === 0) flow = 'light';
      else if (i === 1 || i === 2) flow = 'medium';
      else if (i === 3) flow = 'heavy';
      else if (i === 4) flow = 'light';
      else if (i === 5) flow = 'spotting';
      
      // Generate symptoms based on day
      const symptoms: SymptomType[] = [];
      if (i <= 2) symptoms.push('cramps');
      if (i === 1 || i === 2) symptoms.push('fatigue');
      if (i === 0) symptoms.push('headache');
      if (i >= 1 && i <= 3) symptoms.push('bloating');
      
      // Generate mood based on day
      let mood: MoodType = 'neutral';
      if (i === 0) mood = 'irritated';
      else if (i === 1) mood = 'sad';
      else if (i >= 3) mood = 'happy';
      
      const dayData: DayDataType = {
        date: dayDate.toISOString(),
        flow,
        mood,
        symptoms,
        discharge: i === 0 ? 'brown' : 'none',
        painLevel: i <= 2 ? 'moderate' : 'none',
        cravings: i <= 1 ? ['chocolate', 'salty'] : [],
        notes: i === 0 ? 'Period started today' : '',
      };
      
      days.push(dayData);
    }
    
    return days;
  } catch (error) {
    console.error('Error generating mock days for cycle:', error);
    return [];
  }
};

export const generateMockPredictions = (): PredictionsType => {
  try {
    const today = new Date();
    const nextPeriod = createSafeDate(today, 23); // Next period in 23 days
    const fertileStart = createSafeDate(today, 9); // Fertile window starts in 9 days
    const fertileEnd = createSafeDate(today, 15); // Fertile window ends in 15 days
    
    return {
      nextPeriodDate: nextPeriod.toISOString(),
      fertileWindowStart: fertileStart.toISOString(),
      fertileWindowEnd: fertileEnd.toISOString(),
      confidence: 0.85,
      averageCycleLength: 28,
      averagePeriodLength: 5,
    };
  } catch (error) {
    console.error('Error generating mock predictions:', error);
    
    // Return safe fallback
    const today = new Date();
    return {
      nextPeriodDate: new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString(),
      fertileWindowStart: new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString(),
      fertileWindowEnd: new Date(today.getTime() + (16 * 24 * 60 * 60 * 1000)).toISOString(),
      confidence: 0.75,
      averageCycleLength: 28,
      averagePeriodLength: 5,
    };
  }
};

export const generateMockInsights = (): InsightType[] => {
  try {
    const today = new Date();
    
    return [
      {
        id: 'insight-1',
        title: 'Cycle Pattern Detected',
        description: 'Your cycles have been consistently 28 days long. This regularity is a positive sign of hormonal balance.',
        type: 'health',
        date: today.toISOString(),
        read: false,
      },
      {
        id: 'insight-2',
        title: 'Symptom Tracking Tip',
        description: 'You often experience cramps on day 1-2. Consider tracking pain relief methods to find what works best for you.',
        type: 'tip',
        date: createSafeDate(today, -1).toISOString(), // Yesterday
        read: false,
      },
      {
        id: 'insight-3',
        title: 'Mood Pattern Notice',
        description: 'Your mood tends to improve after day 3 of your period. This is normal as hormone levels stabilize.',
        type: 'health',
        date: createSafeDate(today, -2).toISOString(), // 2 days ago
        read: true,
      },
      {
        id: 'insight-4',
        title: 'Hydration Reminder',
        description: 'Staying well-hydrated can help reduce bloating and cramps during your period.',
        type: 'tip',
        date: createSafeDate(today, -3).toISOString(), // 3 days ago
        read: false,
      },
    ];
  } catch (error) {
    console.error('Error generating mock insights:', error);
    return [];
  }
};

export const SAMPLE_DATA_FOR_ALL_TABLES = {
  users: {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    created_at: '2026-01-15T10:30:00.000Z',
    is_premium: false,
    average_cycle_length: 28,
    average_period_length: 5,
    notifications_enabled: true,
    insights_enabled: true,
    onboarded: true,
  },

  symptom_logs: [
    {
      id: 'sl-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-01',
      cycle_day: 1,
      symptoms: [
        { id: 'cramps', intensity: 4, isCustom: false },
        { id: 'headache', intensity: 2, isCustom: false },
      ],
      moods: ['irritated', 'tired'],
      notes: 'Period started, heavy cramps in the morning',
      flow_intensity: 'medium',
      discharge_type: 'brown',
      pain_level: 'severe',
      cravings: ['chocolate', 'salty'],
      created_at: '2026-03-01T08:15:00.000Z',
      updated_at: '2026-03-01T08:15:00.000Z',
    },
    {
      id: 'sl-002',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-02',
      cycle_day: 2,
      symptoms: [
        { id: 'cramps', intensity: 5, isCustom: false },
        { id: 'fatigue', intensity: 3, isCustom: false },
        { id: 'bloating', intensity: 3, isCustom: false },
      ],
      moods: ['sad'],
      notes: 'Heaviest day, stayed home',
      flow_intensity: 'heavy',
      discharge_type: 'none',
      pain_level: 'severe',
      cravings: ['chocolate', 'carbs'],
      created_at: '2026-03-02T09:00:00.000Z',
      updated_at: '2026-03-02T09:00:00.000Z',
    },
    {
      id: 'sl-003',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-05',
      cycle_day: 5,
      symptoms: [],
      moods: ['happy', 'energetic'],
      notes: 'Feeling much better, period ending',
      flow_intensity: 'spotting',
      discharge_type: 'none',
      pain_level: 'none',
      cravings: [],
      created_at: '2026-03-05T07:30:00.000Z',
      updated_at: '2026-03-05T07:30:00.000Z',
    },
  ],

  mood_logs: [
    {
      id: 'ml-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-01',
      mood_type: 'irritated',
      mood_score: 30,
      intensity: 4,
      notes: 'PMS mood swings',
      created_at: '2026-03-01T08:00:00.000Z',
      updated_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'ml-002',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-05',
      mood_type: 'happy',
      mood_score: 82,
      intensity: 2,
      notes: 'Good energy today',
      created_at: '2026-03-05T08:00:00.000Z',
      updated_at: '2026-03-05T08:00:00.000Z',
    },
  ],

  lifestyle_logs: [
    {
      id: 'll-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-01',
      stress_level: 4,
      sleep_hours: 5.5,
      exercise_minutes: 0,
      water_intake_ml: 1200,
      notes: 'Poor sleep due to cramps',
      created_at: '2026-03-01T22:00:00.000Z',
      updated_at: '2026-03-01T22:00:00.000Z',
    },
    {
      id: 'll-002',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-05',
      stress_level: 2,
      sleep_hours: 7.5,
      exercise_minutes: 30,
      water_intake_ml: 2000,
      notes: 'Great day, went for a walk',
      created_at: '2026-03-05T22:00:00.000Z',
      updated_at: '2026-03-05T22:00:00.000Z',
    },
  ],

  predictions: {
    id: 'pred-001',
    user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    next_period_date: '2026-03-28',
    fertile_window_start: '2026-03-14',
    fertile_window_end: '2026-03-19',
    average_cycle_length: 28,
    average_period_length: 5,
    confidence: 0.87,
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
  },

  ai_insights: [
    {
      id: 'ai-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      type: 'health',
      title: 'Cycle Regularity: Excellent',
      description: 'Your last 3 cycles averaged 28.3 days with only 1.5 day variation. This consistency indicates stable hormonal balance.',
      icon: '🔮',
      color: '#8B5CF6',
      read: false,
      created_at: '2026-03-06T10:00:00.000Z',
    },
    {
      id: 'ai-002',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      type: 'tip',
      title: 'Sleep & Cramp Correlation',
      description: 'On nights you slept less than 6 hours, your cramp severity was 40% higher the next day. Prioritise rest during menstruation.',
      icon: '💡',
      color: '#F59E0B',
      read: true,
      created_at: '2026-03-05T10:00:00.000Z',
    },
  ],

  ai_predictions: [
    {
      id: 'ap-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      predicted_mood: 72.5,
      confidence: 0.83,
      prediction_date: '2026-03-08',
      prediction_type: 'mood',
      metadata: {
        mood: 'happy',
        reason: 'Follicular phase typically boosts mood. Your exercise pattern this week supports a positive outlook.',
        factors: ['follicular_phase', 'exercise_increase', 'good_sleep'],
        symptoms: ['mild_fatigue'],
        suggestions: ['Continue 30-min walks', 'Maintain 7+ hours sleep'],
      },
      created_at: '2026-03-07T06:00:00.000Z',
    },
  ],

  sexual_activity_logs: [
    {
      id: 'sa-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-03-06',
      protected: true,
      protection_type: 'condom',
      libido: 'moderate' as const,
      comfort: 'comfortable' as const,
      orgasm: true,
      notes: null,
      cycle_phase: 'follicular' as const,
      created_at: '2026-03-06T23:30:00.000Z',
    },
    {
      id: 'sa-002',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-02-20',
      protected: false,
      protection_type: null,
      libido: 'high' as const,
      comfort: 'comfortable' as const,
      orgasm: true,
      notes: 'Peak ovulation day',
      cycle_phase: 'ovulation' as const,
      created_at: '2026-02-20T22:45:00.000Z',
    },
    {
      id: 'sa-003',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      date: '2026-02-25',
      protected: true,
      protection_type: 'oral_contraceptive',
      libido: 'low' as const,
      comfort: 'some_discomfort' as const,
      orgasm: false,
      notes: 'Luteal phase, lower libido than usual',
      cycle_phase: 'luteal' as const,
      created_at: '2026-02-25T23:00:00.000Z',
    },
  ],

  partner_education_progress: [
    {
      id: 'ep-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      topic_id: 'understanding_cycles',
      card_id: 'card_phases_overview',
      completed_at: '2026-02-18T14:00:00.000Z',
    },
    {
      id: 'ep-002',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      topic_id: 'understanding_cycles',
      card_id: 'card_hormones',
      completed_at: '2026-02-18T14:15:00.000Z',
    },
  ],

  reminder_preferences: {
    id: 'rp-001',
    user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    notifications_enabled: true,
    period_start: true,
    period_end: false,
    ovulation: true,
    fertile_window: true,
    medication: false,
    hydration: false,
    reminder_time: '09:00',
    updated_at: '2026-03-01T00:00:00.000Z',
  },

  custom_symptoms: [
    {
      id: 'cs-001',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Lower back tightness',
      created_at: '2026-02-10T10:00:00.000Z',
    },
    {
      id: 'cs-002',
      user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Brain fog',
      created_at: '2026-02-15T12:00:00.000Z',
    },
  ],
};

/*
 * ============================================================
 * DEVELOPER REFERENCE: Supabase Table ↔ Code Mapping
 * ============================================================
 *
 * TABLE: users
 *   Created in:  lib/supabase-service.ts → supabaseService.users.create()
 *   Read in:     lib/supabase-service.ts → supabaseService.users.get()
 *   Updated in:  lib/supabase-service.ts → supabaseService.users.update()
 *   Types:       lib/supabase.ts → Database['public']['Tables']['users']
 *   Store:       store/user-store.ts
 *
 * TABLE: symptom_logs
 *   Created in:  lib/supabase-service.ts → supabaseService.cycles.addDayData()
 *   Read in:     lib/supabase-service.ts → supabaseService.cycles.getAll()
 *   Written from: app/log-entry.tsx (main logging form)
 *   Types:       lib/supabase.ts → Database['public']['Tables']['symptom_logs']
 *   Store:       store/symptom-store.ts, store/cycle-store.ts
 *
 * TABLE: mood_logs
 *   Types:       lib/supabase.ts → Database['public']['Tables']['mood_logs']
 *   Written from: app/log-entry.tsx (mood section)
 *
 * TABLE: lifestyle_logs
 *   Types:       lib/supabase.ts → Database['public']['Tables']['lifestyle_logs']
 *   Written from: app/log-entry.tsx (sleep/exercise/water section)
 *
 * TABLE: predictions
 *   Created in:  lib/supabase-service.ts → supabaseService.predictions.create()
 *   Read in:     lib/supabase-service.ts → supabaseService.predictions.get()
 *   Types:       lib/supabase.ts → Database['public']['Tables']['predictions']
 *
 * TABLE: ai_insights
 *   Created in:  lib/supabase-service.ts → supabaseService.insights.create()
 *   Read in:     lib/supabase-service.ts → supabaseService.insights.getAll()
 *   Types:       lib/supabase.ts → Database['public']['Tables']['ai_insights']
 *
 * TABLE: ai_predictions
 *   Created in:  lib/supabase-service.ts → supabaseService.moodPredictions.create()
 *   Read in:     lib/supabase-service.ts → supabaseService.moodPredictions.getAll()
 *   Types:       lib/supabase.ts → Database['public']['Tables']['ai_predictions']
 *   Store:       store/mood-prediction-store.ts
 *
 * TABLE: sexual_activity_logs
 *   Created in:  lib/supabase-service.ts → supabaseService.sexualActivityLogs.upsert()
 *   Read in:     lib/supabase-service.ts → supabaseService.sexualActivityLogs.getAll()
 *   Written from: app/log-entry.tsx (sexual activity section)
 *   Types:       lib/supabase.ts → Database['public']['Tables']['sexual_activity_logs']
 *   SQL:         SETUP_DATABASE.sql (line ~300)
 *   Privacy:     Always private, never shared via partner sharing
 *                (see types/partner-sharing.ts → sexual_activity is locked)
 *
 * TABLE: partner_education_progress
 *   Types:       lib/supabase.ts → Database['public']['Tables']['partner_education_progress']
 *   Store:       store/education-progress-store.ts
 *   SQL:         SETUP_DATABASE.sql (line ~251)
 *
 * TABLE: reminder_preferences
 *   Types:       lib/supabase.ts → Database['public']['Tables']['reminder_preferences']
 *   Store:       store/reminder-store.ts
 *   SQL:         SETUP_DATABASE.sql (line ~280)
 *
 * TABLE: custom_symptoms
 *   Types:       lib/supabase.ts → Database['public']['Tables']['custom_symptoms']
 *   Store:       store/symptom-store.ts
 *
 * TABLE: redemption_codes
 *   Types:       lib/supabase.ts → RedemptionCode
 *   Used in:     app/redeem-code.tsx
 *
 * TABLE: subscriptions
 *   Types:       lib/supabase.ts → UserSubscriptionRow
 *   Store:       store/subscription-store.ts
 *
 * TABLE: subscription_orders
 *   Types:       lib/supabase.ts → SubscriptionOrderRow
 *
 * TABLE: cancellation_requests
 *   Types:       lib/supabase.ts → CancellationRequestRow
 *
 * HOW DATA FLOWS:
 *   1. User fills form in app/log-entry.tsx
 *   2. On save, data is written to local store (AsyncStorage) AND Supabase table
 *   3. supabase-service.ts methods handle the Supabase read/write
 *   4. lib/supabase.ts has the Supabase client + all table type definitions
 *   5. store/*.ts files manage local state + sync with Supabase
 *
 * SEXUAL_ACTIVITY_LOGS SPECIFICS:
 *   - Columns: id, user_id, date, protected, protection_type, libido, comfort, orgasm, notes, cycle_phase, created_at
 *   - libido values: 'low' | 'moderate' | 'high'
 *   - comfort values: 'comfortable' | 'some_discomfort' | 'painful'
 *   - cycle_phase values: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown'
 *   - Unique constraint on (user_id, date) — one log per user per day
 *   - RLS not yet enabled — add policies if needed for production
 *
 * To insert sample data via Supabase SQL editor, use:
 *   INSERT INTO sexual_activity_logs (user_id, date, protected, protection_type, libido, comfort, orgasm, notes, cycle_phase)
 *   VALUES
 *     ('YOUR_USER_ID', '2026-03-06', true, 'condom', 'moderate', 'comfortable', true, null, 'follicular'),
 *     ('YOUR_USER_ID', '2026-02-20', false, null, 'high', 'comfortable', true, 'Peak ovulation day', 'ovulation'),
 *     ('YOUR_USER_ID', '2026-02-25', true, 'oral_contraceptive', 'low', 'some_discomfort', false, 'Luteal phase', 'luteal');
 */