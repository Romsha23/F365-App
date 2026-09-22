import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSubscriptionStore } from '../store/subscription-store';
import { useCycleStore } from '../store/cycle-store';
import { SubscriptionPaywall } from '../components/SubscriptionPaywall';
import { Card } from '../components/Card';
import Colors from '../constants/colors';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  Moon,
  Heart,
  Activity,
  Zap,
  BookOpen,
  Dumbbell,
  RefreshCw,
  Star,
  Target,
  Lightbulb,
} from 'lucide-react-native';
import { ConfidenceBadge, calculateConfidenceLevel } from '../components/ConfidenceBadge';
import { useUserStore } from '../store/user-store';
import { logAIWeeklySummary } from '../utils/ai-audit-logger';

import { MoodType, DayDataType } from '../types/cycle';
import {
  WeeklyNarrativeCard,
  PatternChangeAlert,
  CauseEffectHints,
  ReflectionPrompt,
  ConfidenceTip,
} from '../components/StorytellingInsights';
import { PredictionDisclaimer, AIExplanationFooter, DisclaimerBanner, MASTER_DISCLAIMER } from '../components/DisclaimerBanner';
import {
  calculateAdvancedConfidence,
  detectPatternChange,
  detectCauseEffectPatterns,
  generateWeeklyNarrative,
  WeeklyNarrative,
  PatternChange,
  CauseEffectHint,
  ConfidenceResult,
} from '../utils/confidence-scoring';

type WeeklySummary = {
  thisWeek: {
    avgMoodScore: number;
    dominantMood: string;
    totalSymptoms: number;
    stressLevel: number;
    logsCount: number;
  };
  lastWeek: {
    avgMoodScore: number;
    dominantMood: string;
    totalSymptoms: number;
    stressLevel: number;
    logsCount: number;
  };
  comparison: {
    moodTrend: 'up' | 'down' | 'stable';
    moodChange: number;
    stressTrend: 'up' | 'down' | 'stable';
    stressChange: number;
    symptomsTrend: 'up' | 'down' | 'stable';
  };
  aiSummary: string;
  confidence: number;
  dataPoints: number;
  narrative: WeeklyNarrative;
  patternChange: PatternChange;
  causeEffects: CauseEffectHint[];
  advancedConfidence: ConfidenceResult;
  thisWeekDays: DayDataType[];
  lastWeekDays: DayDataType[];
};

type MonthlyReflection = {
  strongestDays: {
    dayOfWeek: string;
    avgMoodScore: number;
    reason: string;
  }[];
  weakestDays: {
    dayOfWeek: string;
    avgMoodScore: number;
  }[];
  bestMoodDay: {
    date: string;
    mood: string;
    score: number;
  } | null;
  overallTrend: string;
  aiReflection: string;
  confidence: number;
  dataPoints: number;
};

type WhatHelped = {
  factors: {
    factor: string;
    icon: string;
    correlation: number;
    insight: string;
    recommendation: string;
  }[];
  aiAnalysis: string;
  confidence: number;
  dataPoints: number;
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

const moodEmojiMap: Record<MoodType, string> = {
  'happy': '😊',
  'neutral': '😐',
  'sad': '😢',
  'irritated': '😠',
  'anxious': '😰',
  'energetic': '⚡',
  'tired': '😴',
  'emotional': '🥺',
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AIInsightsScreen() {
  const { canAccessFeature } = useSubscriptionStore();
  const { cycles } = useCycleStore();
  const { user } = useUserStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [monthlyReflection, setMonthlyReflection] = useState<MonthlyReflection | null>(null);
  const [whatHelped, setWhatHelped] = useState<WhatHelped | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'helped'>('weekly');
  const [reflectionDismissed, setReflectionDismissed] = useState(false);
  const [masterDisclaimerDismissed, setMasterDisclaimerDismissed] = useState(false);

  const hasPremium = canAccessFeature('advancedAnalytics');

  const handleReflectionResponse = useCallback((response: 'yes' | 'no' | 'unsure') => {
    console.log('Reflection response:', response);
    setReflectionDismissed(true);
  }, []);

  const handleNarrativeFeedback = useCallback((accurate: boolean) => {
    console.log('Narrative feedback:', accurate);
  }, []);

  const getAllDayData = useCallback((): DayDataType[] => {
    const allDays: DayDataType[] = [];
    cycles.forEach(cycle => {
      cycle.days.forEach(day => {
        allDays.push(day);
      });
    });
    return allDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cycles]);

  const getDaysInRange = useCallback((startDate: Date, endDate: Date): DayDataType[] => {
    const allDays = getAllDayData();
    return allDays.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= startDate && dayDate <= endDate;
    });
  }, [getAllDayData]);

  const calculateWeekData = useCallback((days: DayDataType[]) => {
    if (days.length === 0) {
      return {
        avgMoodScore: 0,
        dominantMood: 'neutral',
        totalSymptoms: 0,
        stressLevel: 0,
        logsCount: 0,
      };
    }

    const moodScores = days
      .filter(d => d.mood)
      .map(d => moodScoreMap[d.mood!] || 50);
    
    const avgMoodScore = moodScores.length > 0
      ? Math.round(moodScores.reduce((a, b) => a + b, 0) / moodScores.length)
      : 50;

    const moodCounts: Record<string, number> = {};
    days.forEach(d => {
      if (d.mood) {
        moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
      }
    });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    const totalSymptoms = days.reduce((sum, d) => {
      return sum + (d.symptomsWithIntensity?.length || d.symptoms?.length || 0);
    }, 0);

    const stressLevels = days.filter(d => d.stressLevel !== undefined).map(d => d.stressLevel!);
    const stressLevel = stressLevels.length > 0
      ? Math.round((stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length) * 20)
      : 50;

    return {
      avgMoodScore,
      dominantMood,
      totalSymptoms,
      stressLevel,
      logsCount: days.length,
    };
  }, []);

  const generateWeeklySummary = useCallback(async () => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const thisWeekDays = getDaysInRange(thisWeekStart, now);
    const lastWeekDays = getDaysInRange(lastWeekStart, lastWeekEnd);

    const thisWeekData = calculateWeekData(thisWeekDays);
    const lastWeekData = calculateWeekData(lastWeekDays);

    const moodChange = thisWeekData.avgMoodScore - lastWeekData.avgMoodScore;
    const stressChange = thisWeekData.stressLevel - lastWeekData.stressLevel;

    const comparison = {
      moodTrend: (moodChange > 5 ? 'up' : moodChange < -5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      moodChange: Math.abs(moodChange),
      stressTrend: (stressChange > 10 ? 'up' : stressChange < -10 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      stressChange: Math.abs(stressChange),
      symptomsTrend: (thisWeekData.totalSymptoms > lastWeekData.totalSymptoms ? 'up' : 
        thisWeekData.totalSymptoms < lastWeekData.totalSymptoms ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    };

    let aiSummary = '';
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a compassionate wellness coach. Provide a brief, encouraging 2-3 sentence summary comparing this week to last week based on the mood and wellness data. Be warm, supportive, and actionable. Don't use clinical language.`
            },
            {
              role: 'user',
              content: JSON.stringify({
                thisWeek: thisWeekData,
                lastWeek: lastWeekData,
                comparison,
              })
            }
          ]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiSummary = data.completion;
        
        if (user?.uniqueId) {
          logAIWeeklySummary(user.uniqueId, aiSummary.length);
        }
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    }

    if (!aiSummary) {
      if (comparison.moodTrend === 'up') {
        aiSummary = `Great progress this week! Your mood has improved by ${comparison.moodChange}% compared to last week. Keep doing what you're doing! 🌟`;
      } else if (comparison.moodTrend === 'down') {
        aiSummary = `This week has been a bit tougher, but that's okay. Your mood dipped slightly, which is completely normal. Be gentle with yourself. 💜`;
      } else {
        aiSummary = `You've maintained steady energy this week. Consistency is key to long-term wellness. Keep tracking to unlock more insights! ✨`;
      }
    }

    const totalDataPoints = thisWeekDays.length + lastWeekDays.length;
    const confidence = totalDataPoints >= 10 ? 0.85 : totalDataPoints >= 5 ? 0.6 : 0.35;

    const allDays = getAllDayData();
    const historicalDays = allDays.slice(0, 60);
    
    const advancedConfidence = calculateAdvancedConfidence(thisWeekDays, 'weekly');
    const patternChange = detectPatternChange(thisWeekDays, lastWeekDays, historicalDays);
    const causeEffects = detectCauseEffectPatterns(historicalDays);
    const narrative = generateWeeklyNarrative(thisWeekDays, lastWeekDays, patternChange, causeEffects);

    return {
      thisWeek: thisWeekData,
      lastWeek: lastWeekData,
      comparison,
      aiSummary,
      confidence,
      dataPoints: totalDataPoints,
      narrative,
      patternChange,
      causeEffects,
      advancedConfidence,
      thisWeekDays,
      lastWeekDays,
    };
  }, [getDaysInRange, calculateWeekData, getAllDayData]);

  const generateMonthlyReflection = useCallback(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthDays = getDaysInRange(monthStart, now);

    const dayOfWeekStats: Record<number, { scores: number[]; count: number }> = {};
    for (let i = 0; i < 7; i++) {
      dayOfWeekStats[i] = { scores: [], count: 0 };
    }

    let bestDay: { date: string; mood: string; score: number } | null = null;

    monthDays.forEach(day => {
      const dayDate = new Date(day.date);
      const dayOfWeek = dayDate.getDay();
      
      if (day.mood) {
        const score = moodScoreMap[day.mood] || 50;
        dayOfWeekStats[dayOfWeek].scores.push(score);
        dayOfWeekStats[dayOfWeek].count++;

        if (!bestDay || score > bestDay.score) {
          bestDay = {
            date: day.date,
            mood: day.mood,
            score,
          };
        }
      }
    });

    const dayAverages = Object.entries(dayOfWeekStats)
      .map(([day, stats]) => ({
        dayOfWeek: dayNames[parseInt(day)],
        avgMoodScore: stats.scores.length > 0
          ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
          : 0,
        count: stats.count,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.avgMoodScore - a.avgMoodScore);

    const strongestDays = dayAverages.slice(0, 3).map(d => ({
      ...d,
      reason: d.avgMoodScore >= 70 ? 'High energy day' : d.avgMoodScore >= 50 ? 'Balanced day' : 'Recovery day',
    }));

    const weakestDays = [...dayAverages].sort((a, b) => a.avgMoodScore - b.avgMoodScore).slice(0, 2);

    let aiReflection = '';
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a thoughtful wellness coach. Provide a brief 2-3 sentence monthly reflection based on the user's strongest and weakest days. Be encouraging and suggest one actionable insight. Keep it warm and personal.`
            },
            {
              role: 'user',
              content: JSON.stringify({
                strongestDays,
                weakestDays,
                bestDay,
                totalLogs: monthDays.length,
              })
            }
          ]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiReflection = data.completion;
        
        if (user?.uniqueId) {
          logAIWeeklySummary(user.uniqueId, aiReflection.length);
        }
      }
    } catch (error) {
      console.error('Error generating AI reflection:', error);
    }

    if (!aiReflection) {
      if (strongestDays.length > 0) {
        aiReflection = `${strongestDays[0].dayOfWeek}s seem to be your power days! Consider scheduling important activities or self-care on these days. Your patterns show real potential for growth. 🌱`;
      } else {
        aiReflection = `Keep logging to discover your strongest days! Every entry helps build a clearer picture of your wellness journey. ✨`;
      }
    }

    const avgScore = dayAverages.length > 0
      ? dayAverages.reduce((sum, d) => sum + d.avgMoodScore, 0) / dayAverages.length
      : 50;
    
    const overallTrend = avgScore >= 70 ? 'Thriving' : avgScore >= 50 ? 'Balanced' : 'Building';

    const confidence = monthDays.length >= 20 ? 0.85 : monthDays.length >= 10 ? 0.6 : 0.35;

    return {
      strongestDays,
      weakestDays,
      bestMoodDay: bestDay,
      overallTrend,
      aiReflection,
      confidence,
      dataPoints: monthDays.length,
    };
  }, [getDaysInRange]);

  const generateWhatHelped = useCallback(async () => {
    const allDays = getAllDayData().slice(0, 60);

    const factorAnalysis = {
      lowStress: { goodMoodCount: 0, totalCount: 0 },
      journaling: { goodMoodCount: 0, totalCount: 0 },
      exercise: { goodMoodCount: 0, totalCount: 0 },
      goodSleep: { goodMoodCount: 0, totalCount: 0 },
      noSymptoms: { goodMoodCount: 0, totalCount: 0 },
    };

    allDays.forEach(day => {
      const isGoodMood = day.mood && moodScoreMap[day.mood] >= 60;

      if (day.stressLevel !== undefined && day.stressLevel <= 2) {
        factorAnalysis.lowStress.totalCount++;
        if (isGoodMood) factorAnalysis.lowStress.goodMoodCount++;
      }

      if ((day.notes && day.notes.length > 20) || (day.emotionalNotes && day.emotionalNotes.length > 20)) {
        factorAnalysis.journaling.totalCount++;
        if (isGoodMood) factorAnalysis.journaling.goodMoodCount++;
      }

      if (day.exercise && day.exercise > 0) {
        factorAnalysis.exercise.totalCount++;
        if (isGoodMood) factorAnalysis.exercise.goodMoodCount++;
      }

      if (day.sleep && day.sleep >= 7) {
        factorAnalysis.goodSleep.totalCount++;
        if (isGoodMood) factorAnalysis.goodSleep.goodMoodCount++;
      }

      const symptomCount = day.symptomsWithIntensity?.length || day.symptoms?.length || 0;
      if (symptomCount === 0) {
        factorAnalysis.noSymptoms.totalCount++;
        if (isGoodMood) factorAnalysis.noSymptoms.goodMoodCount++;
      }
    });

    const factors: WhatHelped['factors'] = [];

    const factorConfig: Record<string, { icon: string; name: string; insight: string; recommendation: string }> = {
      lowStress: {
        icon: 'Moon',
        name: 'Low Stress Days',
        insight: 'Managing stress correlates with better mood',
        recommendation: 'Try 5-minute breathing exercises on high-stress days',
      },
      journaling: {
        icon: 'BookOpen',
        name: 'Journaling',
        insight: 'Writing down thoughts improves emotional clarity',
        recommendation: 'Aim for a brief journal entry 3x per week',
      },
      exercise: {
        icon: 'Dumbbell',
        name: 'Physical Activity',
        insight: 'Movement boosts endorphins and mood',
        recommendation: 'Even a 15-minute walk counts!',
      },
      goodSleep: {
        icon: 'Moon',
        name: 'Quality Sleep',
        insight: 'Good sleep is foundational for mood regulation',
        recommendation: 'Aim for 7-8 hours of consistent sleep',
      },
      noSymptoms: {
        icon: 'Heart',
        name: 'Symptom-Free Days',
        insight: 'Physical comfort supports mental wellbeing',
        recommendation: 'Track triggers to minimize symptom days',
      },
    };

    Object.entries(factorAnalysis).forEach(([key, data]) => {
      if (data.totalCount >= 3) {
        const correlation = Math.round((data.goodMoodCount / data.totalCount) * 100);
        const config = factorConfig[key];
        factors.push({
          factor: config.name,
          icon: config.icon,
          correlation,
          insight: config.insight,
          recommendation: config.recommendation,
        });
      }
    });

    factors.sort((a, b) => b.correlation - a.correlation);

    let aiAnalysis = '';
    try {
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a supportive wellness coach. Based on the correlation data showing what factors are associated with good moods, provide a brief 2-3 sentence personalized insight. Focus on the top factor and give encouragement. Be warm and actionable.`
            },
            {
              role: 'user',
              content: JSON.stringify({ factors: factors.slice(0, 3), totalDaysAnalyzed: allDays.length })
            }
          ]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiAnalysis = data.completion;
        
        if (user?.uniqueId) {
          logAIWeeklySummary(user.uniqueId, aiAnalysis.length);
        }
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error);
    }

    if (!aiAnalysis) {
      if (factors.length > 0) {
        aiAnalysis = `Your data shows that ${factors[0].factor.toLowerCase()} has the strongest connection to your good mood days (${factors[0].correlation}% correlation). This is a powerful insight you can use! 🎯`;
      } else {
        aiAnalysis = `Keep tracking to discover what helps you most! The more data we have, the better insights we can provide. Every log brings you closer to understanding your patterns. ✨`;
      }
    }

    const confidence = allDays.length >= 30 ? 0.85 : allDays.length >= 14 ? 0.6 : 0.35;

    return { factors, aiAnalysis, confidence, dataPoints: allDays.length };
  }, [getAllDayData]);

  const getDemoData = useCallback((): { weekly: WeeklySummary; monthly: MonthlyReflection; helped: WhatHelped } => {
    const demoWeekly: WeeklySummary = {
      thisWeek: { avgMoodScore: 72, dominantMood: 'happy', totalSymptoms: 4, stressLevel: 35, logsCount: 5 },
      lastWeek: { avgMoodScore: 58, dominantMood: 'tired', totalSymptoms: 7, stressLevel: 55, logsCount: 6 },
      comparison: { moodTrend: 'up', moodChange: 14, stressTrend: 'down', stressChange: 20, symptomsTrend: 'down' },
      aiSummary: 'Great progress this week! Your mood improved by 14% and stress dropped noticeably. The combination of better sleep and lighter symptom days seems to be working well for you. Keep prioritising rest! 🌟',
      confidence: 0.6,
      dataPoints: 11,
      narrative: { headline: 'A brighter week ahead', body: 'Your mood lifted compared to last week, with fewer symptoms and lower stress.', moodSummary: 'Your mood showed real improvement this week.', comparison: 'Your overall mood improved by 14% compared to last week.', tone: 'positive' as const, keyInsight: 'Better sleep correlated with your improved mood this week.' },
      patternChange: { detected: false, type: 'stable' as const, magnitude: 'minor' as const, description: '', factors: [] },
      causeEffects: [{ factor: 'Quality Sleep', effect: 'Better Mood', correlation: 0.75, direction: 'positive' as const, confidence: 'medium' as const, narrative: 'On days you slept 7+ hours, your mood was 25% higher.' }],
      advancedConfidence: { level: 'medium' as const, score: 0.6, factors: { dataPointsScore: 0.6, consistencyScore: 0.7, completenessScore: 0.5, recencyScore: 0.8, patternStabilityScore: 0.6 }, label: 'Medium confidence', description: 'Clear patterns emerging from your data' },
      thisWeekDays: [],
      lastWeekDays: [],
    };

    const demoMonthly: MonthlyReflection = {
      strongestDays: [
        { dayOfWeek: 'Saturday', avgMoodScore: 82, reason: 'High energy day' },
        { dayOfWeek: 'Wednesday', avgMoodScore: 75, reason: 'Balanced day' },
        { dayOfWeek: 'Monday', avgMoodScore: 68, reason: 'Balanced day' },
      ],
      weakestDays: [
        { dayOfWeek: 'Thursday', avgMoodScore: 42 },
        { dayOfWeek: 'Tuesday', avgMoodScore: 48 },
      ],
      bestMoodDay: { date: new Date().toISOString(), mood: 'happy', score: 90 },
      overallTrend: 'Balanced',
      aiReflection: 'Saturdays are your power days! Consider scheduling important self-care and activities on weekends when your energy peaks. Mid-week dips are normal — try a short walk or breathing exercise on Thursdays. 🌱',
      confidence: 0.6,
      dataPoints: 18,
    };

    const demoHelped: WhatHelped = {
      factors: [
        { factor: 'Quality Sleep', icon: 'Moon', correlation: 78, insight: 'Good sleep is foundational for mood regulation', recommendation: 'Aim for 7-8 hours of consistent sleep' },
        { factor: 'Physical Activity', icon: 'Dumbbell', correlation: 72, insight: 'Movement boosts endorphins and mood', recommendation: 'Even a 15-minute walk counts!' },
        { factor: 'Low Stress Days', icon: 'Moon', correlation: 65, insight: 'Managing stress correlates with better mood', recommendation: 'Try 5-minute breathing exercises on high-stress days' },
        { factor: 'Journaling', icon: 'BookOpen', correlation: 58, insight: 'Writing down thoughts improves emotional clarity', recommendation: 'Aim for a brief journal entry 3x per week' },
      ],
      aiAnalysis: 'Your data shows that quality sleep has the strongest connection to your good mood days (78% correlation). Physical activity is a close second. Prioritising these two factors could make the biggest difference in your wellbeing! 🎯',
      confidence: 0.6,
      dataPoints: 18,
    };

    return { weekly: demoWeekly, monthly: demoMonthly, helped: demoHelped };
  }, []);

  const loadInsights = useCallback(async () => {
    if (!hasPremium) return;

    setIsLoading(true);
    try {
      if (cycles.length === 0) {
        console.log('[AIInsights] No cycle data, loading demo data');
        const demo = getDemoData();
        setWeeklySummary(demo.weekly);
        setMonthlyReflection(demo.monthly);
        setWhatHelped(demo.helped);
      } else {
        const [weekly, monthly, helped] = await Promise.all([
          generateWeeklySummary(),
          generateMonthlyReflection(),
          generateWhatHelped(),
        ]);
        setWeeklySummary(weekly);
        setMonthlyReflection(monthly);
        setWhatHelped(helped);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      const demo = getDemoData();
      setWeeklySummary(demo.weekly);
      setMonthlyReflection(demo.monthly);
      setWhatHelped(demo.helped);
    } finally {
      setIsLoading(false);
    }
  }, [hasPremium, cycles, generateWeeklySummary, generateMonthlyReflection, generateWhatHelped, getDemoData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadInsights();
    setIsRefreshing(false);
  }, [loadInsights]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadInsights();
    });

    return () => {
      task.cancel();
    };
  }, [loadInsights]);

  if (!hasPremium) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'AI Insights',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <SubscriptionPaywall
          feature="AI Insights"
          description="Unlock personalized AI-powered wellness insights including weekly summaries, monthly reflections, and 'What Helped' auto-detection. Understand your patterns and optimize your wellbeing."
        />
      </View>
    );
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
        onPress={() => setActiveTab('weekly')}
      >
        <Calendar size={16} color={activeTab === 'weekly' ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
          Weekly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'monthly' && styles.tabActive]}
        onPress={() => setActiveTab('monthly')}
      >
        <Star size={16} color={activeTab === 'monthly' ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>
          Monthly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'helped' && styles.tabActive]}
        onPress={() => setActiveTab('helped')}
      >
        <Lightbulb size={16} color={activeTab === 'helped' ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.tabText, activeTab === 'helped' && styles.tabTextActive]}>
          What Helped
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeeklySummary = () => {
    if (!weeklySummary) return null;

    const { 
      thisWeek, 
      lastWeek, 
      comparison, 
      dataPoints,
      narrative,
      patternChange,
      causeEffects,
      advancedConfidence,
    } = weeklySummary;

    const getReflectionQuestion = () => {
      if (patternChange.type === 'improvement') {
        return 'Do you feel like this week was better than usual?';
      } else if (patternChange.type === 'decline') {
        return 'Did this week feel more challenging than normal?';
      } else if (causeEffects.length > 0) {
        return `Do you notice ${causeEffects[0].factor.toLowerCase()} affecting your mood?`;
      }
      return 'Does this summary feel accurate to you?';
    };

    return (
      <View style={styles.sectionContainer}>
        <ConfidenceTip confidence={advancedConfidence} />

        <WeeklyNarrativeCard
          narrative={narrative}
          confidence={advancedConfidence}
          onFeedback={handleNarrativeFeedback}
        />

        {patternChange.detected && (
          <PatternChangeAlert change={patternChange} />
        )}

        {causeEffects.length > 0 && (
          <CauseEffectHints hints={causeEffects} />
        )}

        {!reflectionDismissed && dataPoints >= 7 && (
          <ReflectionPrompt
            question={getReflectionQuestion()}
            context="Your feedback helps us understand your patterns better."
            onRespond={handleReflectionResponse}
          />
        )}

        <Text style={styles.sectionTitle}>This Week vs Last Week</Text>

        <View style={styles.comparisonGrid}>
          <Card style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonLabel}>Mood Score</Text>
              {comparison.moodTrend === 'up' ? (
                <TrendingUp size={18} color={Colors.success} />
              ) : comparison.moodTrend === 'down' ? (
                <TrendingDown size={18} color={Colors.error} />
              ) : (
                <Activity size={18} color={Colors.textMuted} />
              )}
            </View>
            <View style={styles.comparisonValues}>
              <View style={styles.weekValue}>
                <Text style={styles.weekLabel}>This Week</Text>
                <Text style={styles.weekScore}>{thisWeek.avgMoodScore}%</Text>
              </View>
              <View style={styles.weekDivider} />
              <View style={styles.weekValue}>
                <Text style={styles.weekLabel}>Last Week</Text>
                <Text style={styles.weekScoreMuted}>{lastWeek.avgMoodScore}%</Text>
              </View>
            </View>
            {comparison.moodChange > 0 && (
              <Text style={[
                styles.changeText,
                comparison.moodTrend === 'up' ? styles.changePositive : 
                comparison.moodTrend === 'down' ? styles.changeNegative : styles.changeNeutral
              ]}>
                {comparison.moodTrend === 'up' ? '+' : comparison.moodTrend === 'down' ? '-' : ''}{comparison.moodChange}%
              </Text>
            )}
          </Card>

          <Card style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonLabel}>Stress Level</Text>
              {comparison.stressTrend === 'down' ? (
                <TrendingDown size={18} color={Colors.success} />
              ) : comparison.stressTrend === 'up' ? (
                <TrendingUp size={18} color={Colors.error} />
              ) : (
                <Activity size={18} color={Colors.textMuted} />
              )}
            </View>
            <View style={styles.comparisonValues}>
              <View style={styles.weekValue}>
                <Text style={styles.weekLabel}>This Week</Text>
                <Text style={styles.weekScore}>{thisWeek.stressLevel}%</Text>
              </View>
              <View style={styles.weekDivider} />
              <View style={styles.weekValue}>
                <Text style={styles.weekLabel}>Last Week</Text>
                <Text style={styles.weekScoreMuted}>{lastWeek.stressLevel}%</Text>
              </View>
            </View>
          </Card>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{thisWeek.logsCount}</Text>
              <Text style={styles.statLabel}>Logs this week</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{thisWeek.totalSymptoms}</Text>
              <Text style={styles.statLabel}>Symptoms tracked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {moodEmojiMap[thisWeek.dominantMood as MoodType] || '😐'}
              </Text>
              <Text style={styles.statLabel}>Dominant mood</Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const renderMonthlyReflection = () => {
    if (!monthlyReflection) return null;

    const { strongestDays, bestMoodDay, overallTrend, aiReflection, dataPoints } = monthlyReflection;
    const confidenceLevel = calculateConfidenceLevel(dataPoints, 5, 15, 25);

    return (
      <View style={styles.sectionContainer}>
        <ConfidenceBadge 
          level={confidenceLevel} 
          dataPoints={dataPoints}
          minDataPoints={25}
          showDescription={dataPoints < 15}
          style={styles.confidenceBadge}
        />

        <Card style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <Sparkles size={20} color={Colors.gold} />
            <Text style={styles.aiCardTitle}>Monthly Reflection</Text>
          </View>
          <Text style={styles.aiCardText}>{aiReflection}</Text>
          <AIExplanationFooter />
        </Card>

        <View style={styles.trendBadgeContainer}>
          <View style={[
            styles.trendBadge,
            overallTrend === 'Thriving' && styles.trendThriving,
            overallTrend === 'Balanced' && styles.trendBalanced,
            overallTrend === 'Building' && styles.trendBuilding,
          ]}>
            <Target size={16} color={Colors.white} />
            <Text style={styles.trendBadgeText}>{overallTrend}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Strongest Days</Text>

        {strongestDays.map((day, index) => (
          <Card key={day.dayOfWeek} style={styles.dayCard}>
            <View style={styles.dayCardContent}>
              <View style={styles.dayRank}>
                <Text style={styles.dayRankText}>{index + 1}</Text>
              </View>
              <View style={styles.dayInfo}>
                <Text style={styles.dayName}>{day.dayOfWeek}</Text>
                <Text style={styles.dayReason}>{day.reason}</Text>
              </View>
              <View style={styles.dayScore}>
                <Text style={styles.dayScoreText}>{day.avgMoodScore}%</Text>
                <Text style={styles.dayScoreLabel}>avg mood</Text>
              </View>
            </View>
          </Card>
        ))}

        {bestMoodDay && (
          <>
            <Text style={styles.sectionTitle}>Best Day This Month</Text>
            <Card style={styles.bestDayCard}>
              <View style={styles.bestDayContent}>
                <View style={styles.bestDayEmoji}>
                  <Text style={styles.bestDayEmojiText}>
                    {moodEmojiMap[bestMoodDay.mood as MoodType] || '😊'}
                  </Text>
                </View>
                <View style={styles.bestDayInfo}>
                  <Text style={styles.bestDayDate}>
                    {new Date(bestMoodDay.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.bestDayMood}>
                    Feeling {bestMoodDay.mood} • {bestMoodDay.score}% mood score
                  </Text>
                </View>
                <Star size={24} color={Colors.gold} fill={Colors.gold} />
              </View>
            </Card>
          </>
        )}
      </View>
    );
  };

  const renderWhatHelped = () => {
    if (!whatHelped) return null;

    const { factors, aiAnalysis, dataPoints } = whatHelped;
    const confidenceLevel = calculateConfidenceLevel(dataPoints, 7, 21, 45);

    const getFactorIcon = (iconName: string) => {
      switch (iconName) {
        case 'Moon': return <Moon size={24} color={Colors.secondary} />;
        case 'BookOpen': return <BookOpen size={24} color={Colors.accent} />;
        case 'Dumbbell': return <Dumbbell size={24} color={Colors.success} />;
        case 'Heart': return <Heart size={24} color={Colors.error} />;
        default: return <Zap size={24} color={Colors.primary} />;
      }
    };

    return (
      <View style={styles.sectionContainer}>
        <ConfidenceBadge 
          level={confidenceLevel} 
          dataPoints={dataPoints}
          minDataPoints={45}
          showDescription={dataPoints < 21}
          style={styles.confidenceBadge}
        />

        <Card style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <Sparkles size={20} color={Colors.gold} />
            <Text style={styles.aiCardTitle}>What&apos;s Working For You</Text>
          </View>
          <Text style={styles.aiCardText}>{aiAnalysis}</Text>
          <AIExplanationFooter />
        </Card>

        <Text style={styles.sectionTitle}>Mood Correlations</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your logged data, here&apos;s what correlates with your good mood days
        </Text>

        {factors.length > 0 ? (
          factors.map((factor, index) => (
            <Card key={factor.factor} style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <View style={styles.factorIconContainer}>
                  {getFactorIcon(factor.icon)}
                </View>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorName}>{factor.factor}</Text>
                  <Text style={styles.factorInsight}>{factor.insight}</Text>
                </View>
                <View style={styles.factorCorrelation}>
                  <Text style={styles.factorCorrelationValue}>{factor.correlation}%</Text>
                  <Text style={styles.factorCorrelationLabel}>correlation</Text>
                </View>
              </View>
              <View style={styles.correlationBar}>
                <View 
                  style={[
                    styles.correlationBarFill, 
                    { width: `${factor.correlation}%` },
                    factor.correlation >= 70 && styles.correlationBarHigh,
                    factor.correlation >= 50 && factor.correlation < 70 && styles.correlationBarMedium,
                    factor.correlation < 50 && styles.correlationBarLow,
                  ]} 
                />
              </View>
              <View style={styles.factorRecommendation}>
                <Lightbulb size={14} color={Colors.gold} />
                <Text style={styles.factorRecommendationText}>{factor.recommendation}</Text>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Keep logging to discover what helps you most! We need a bit more data to identify patterns.
            </Text>
          </Card>
        )}
      </View>
    );
  };

  if (isLoading && !weeklySummary && !monthlyReflection && !whatHelped) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'AI Insights',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your wellness data...</Text>
          <Text style={styles.loadingSubtext}>This may take a moment</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AI Insights',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
              <RefreshCw size={20} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {!masterDisclaimerDismissed && (
          <DisclaimerBanner
            type="warning"
            message={MASTER_DISCLAIMER}
            dismissible={true}
            onDismiss={() => setMasterDisclaimerDismissed(true)}
          />
        )}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Sparkles size={28} color={Colors.gold} />
          </View>
          <Text style={styles.headerTitle}>AI Wellness Insights</Text>
          <Text style={styles.headerSubtitle}>
            Personalized analysis of your health patterns
          </Text>
          <PredictionDisclaimer style={styles.predictionDisclaimer} />
        </View>

        {renderTabs()}

        {activeTab === 'weekly' && renderWeeklySummary()}
        {activeTab === 'monthly' && renderMonthlyReflection()}
        {activeTab === 'helped' && renderWhatHelped()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textMuted,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary + '20',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
    marginTop: -8,
  },
  aiCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gold,
  },
  aiCardText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  comparisonCard: {
    flex: 1,
    padding: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekValue: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  weekScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  weekScoreMuted: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  weekDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  changePositive: {
    color: Colors.success,
  },
  changeNegative: {
    color: Colors.error,
  },
  changeNeutral: {
    color: Colors.textMuted,
  },
  statsCard: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  trendBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  trendThriving: {
    backgroundColor: Colors.success,
  },
  trendBalanced: {
    backgroundColor: Colors.primary,
  },
  trendBuilding: {
    backgroundColor: Colors.secondary,
  },
  trendBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  dayCard: {
    padding: 16,
    marginBottom: 8,
  },
  dayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dayReason: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dayScore: {
    alignItems: 'flex-end',
  },
  dayScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
  },
  dayScoreLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bestDayCard: {
    padding: 16,
    backgroundColor: Colors.gold + '15',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bestDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestDayEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bestDayEmojiText: {
    fontSize: 24,
  },
  bestDayInfo: {
    flex: 1,
  },
  bestDayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  bestDayMood: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  factorCard: {
    padding: 16,
    marginBottom: 12,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  factorInfo: {
    flex: 1,
  },
  factorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  factorInsight: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  factorCorrelation: {
    alignItems: 'flex-end',
  },
  factorCorrelationValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  factorCorrelationLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  correlationBar: {
    height: 6,
    backgroundColor: Colors.muted,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  correlationBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  correlationBarHigh: {
    backgroundColor: Colors.success,
  },
  correlationBarMedium: {
    backgroundColor: Colors.primary,
  },
  correlationBarLow: {
    backgroundColor: Colors.warning,
  },
  factorRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '10',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  factorRecommendationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 32,
  },
  confidenceBadge: {
    marginBottom: 12,
  },
  predictionDisclaimer: {
    marginTop: 8,
  },
  crisisFooter: {
    marginTop: 16,
  },
});
