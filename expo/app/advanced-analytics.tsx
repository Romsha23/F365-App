import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSubscriptionStore } from '../store/subscription-store';
import { useCycleStore } from '../store/cycle-store';
import { SubscriptionPaywall } from '../components/SubscriptionPaywall';
import { Card } from '../components/Card';
import Colors from '../constants/colors';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Activity,
  Brain,
  Heart,
} from 'lucide-react-native';
import { DisclaimerBanner, DISCLAIMERS, AIExplanationFooter } from '../components/DisclaimerBanner';

type AdvancedPredictionType = {
  nextPeriodDate: string;
  cycleLength: number;
  periodLength: number;
  confidence: number;
  irregularityScore: number;
  ovulationDate: string;
  fertileWindow: { start: string; end: string };
};

type SymptomCorrelation = {
  symptom: string;
  cyclePhase: string;
  frequency: number;
  severity: string;
};

type AIInsight = {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
  actionable: boolean;
};

export default function AdvancedAnalyticsScreen() {
  const { canAccessFeature } = useSubscriptionStore();
  const { cycles } = useCycleStore();
  const [isLoading, setIsLoading] = useState(false);
  const [advancedPredictions, setAdvancedPredictions] = useState<AdvancedPredictionType | null>(null);
  const [symptomCorrelations, setSymptomCorrelations] = useState<SymptomCorrelation[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);

  const hasPremium = canAccessFeature('advancedAnalytics');

  const generateDemoCycles = (): typeof cycles => {
    const demoCycles: typeof cycles = [];
    const today = new Date();
    const moodTypes: ('happy' | 'sad' | 'neutral' | 'irritated' | 'anxious' | 'energetic' | 'tired' | 'emotional')[] = 
      ['happy', 'sad', 'neutral', 'irritated', 'anxious', 'energetic', 'tired', 'emotional'];
    const painLevels: ('none' | 'mild' | 'moderate' | 'severe')[] = ['none', 'mild', 'moderate', 'severe'];
    
    for (let i = 5; i >= 0; i--) {
      const cycleStart = new Date(today);
      cycleStart.setDate(cycleStart.getDate() - (i * 28 + Math.floor(Math.random() * 3)));
      
      const days: typeof cycles[0]['days'] = [];
      const periodLength = 4 + Math.floor(Math.random() * 3);
      
      for (let d = 0; d < 28; d++) {
        const dayDate = new Date(cycleStart);
        dayDate.setDate(dayDate.getDate() + d);
        
        const symptoms: ('cramps' | 'headache' | 'bloating' | 'fatigue' | 'breast_tenderness' | 'backache' | 'nausea')[] = [];
        
        if (d < periodLength) {
          symptoms.push('cramps');
          if (Math.random() > 0.5) symptoms.push('bloating');
          if (Math.random() > 0.6) symptoms.push('fatigue');
        } else if (d >= 12 && d <= 16) {
          if (Math.random() > 0.5) symptoms.push('breast_tenderness');
        } else if (d >= 21) {
          if (Math.random() > 0.4) symptoms.push('bloating');
          if (Math.random() > 0.5) symptoms.push('headache');
          if (Math.random() > 0.6) symptoms.push('backache');
        }
        
        const flowValue: 'none' | 'light' | 'medium' | 'heavy' = d < periodLength 
          ? (d === 0 ? 'light' : d < 3 ? 'heavy' : 'medium') 
          : 'none';
        
        const painValue: 'none' | 'mild' | 'moderate' | 'severe' = d < periodLength 
          ? painLevels[Math.floor(Math.random() * 3) + 1]
          : 'none';
        
        days.push({
          date: dayDate.toISOString(),
          flow: flowValue,
          mood: moodTypes[Math.floor(Math.random() * moodTypes.length)],
          symptoms,
          painLevel: painValue,
          notes: '',
        });
      }
      
      demoCycles.push({
        id: `demo_cycle_${i}`,
        startDate: cycleStart.toISOString(),
        days,
      });
    }
    
    return demoCycles;
  };

  useEffect(() => {
    if (!hasPremium) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      generateAdvancedAnalytics();
    });

    return () => {
      task.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPremium]);

  if (!hasPremium) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Advanced Analytics',
            headerStyle: {
              backgroundColor: Colors.background,
            },
          }}
        />
        <SubscriptionPaywall
          feature="Advanced Analytics"
          description="Unlock advanced cycle predictions, symptom correlation analysis, and AI-powered health insights. Get detailed graphs, trend analysis, and personalized recommendations based on your cycle history."
        />
      </View>
    );
  }

  const generateAdvancedAnalytics = async () => {
    setIsLoading(true);
    try {
      let last6Cycles = cycles.slice(-6);
      
      if (last6Cycles.length < 2) {
        console.log('[AdvancedAnalytics] Using demo data for analytics');
        last6Cycles = generateDemoCycles();
      }

      const cycleLengths = last6Cycles.map((cycle, index) => {
        if (index === 0) return null;
        const prevCycle = last6Cycles[index - 1];
        const start = new Date(cycle.startDate).getTime();
        const prevStart = new Date(prevCycle.startDate).getTime();
        return Math.round((start - prevStart) / (1000 * 60 * 60 * 24));
      }).filter((l): l is number => l !== null);

      const avgCycleLength = cycleLengths.length > 0
        ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
        : 28;

      const periodLengths = last6Cycles.map(cycle => {
        const periodDays = cycle.days.filter(day => day.flow && day.flow !== 'none');
        return periodDays.length;
      }).filter(l => l > 0);

      const avgPeriodLength = periodLengths.length > 0
        ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
        : 5;

      const stdDev = cycleLengths.length > 1
        ? Math.sqrt(
            cycleLengths.reduce((sum, len) => sum + Math.pow(len - avgCycleLength, 2), 0) /
              cycleLengths.length
          )
        : 0;

      const irregularityScore = Math.min(stdDev / 3, 1);

      const lastCycleStart = new Date(last6Cycles[last6Cycles.length - 1].startDate);
      const nextPeriodDate = new Date(lastCycleStart);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);

      const ovulationDate = new Date(nextPeriodDate);
      ovulationDate.setDate(ovulationDate.getDate() - 14);

      const fertileStart = new Date(ovulationDate);
      fertileStart.setDate(fertileStart.getDate() - 3);
      
      const fertileEnd = new Date(ovulationDate);
      fertileEnd.setDate(fertileEnd.getDate() + 1);

      const confidence = Math.max(0.5, 1 - irregularityScore);

      setAdvancedPredictions({
        nextPeriodDate: nextPeriodDate.toISOString(),
        cycleLength: avgCycleLength,
        periodLength: avgPeriodLength,
        confidence: Math.round(confidence * 100) / 100,
        irregularityScore: Math.round(irregularityScore * 100) / 100,
        ovulationDate: ovulationDate.toISOString(),
        fertileWindow: {
          start: fertileStart.toISOString(),
          end: fertileEnd.toISOString(),
        },
      });

      const symptomAnalysis = analyzeSymptomCorrelations(last6Cycles);
      setSymptomCorrelations(symptomAnalysis);

      await generateAIInsights(last6Cycles, avgCycleLength, irregularityScore);
    } catch (error) {
      console.error('Error generating advanced analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSymptomCorrelations = (cycleData: typeof cycles): SymptomCorrelation[] => {
    const symptomMap: Record<string, { phase: Record<string, number>; count: number }> = {};
    
    cycleData.forEach(cycle => {
      cycle.days.forEach((day, dayIndex) => {
        if (!day.symptoms || day.symptoms.length === 0) return;
        
        const cycleDay = dayIndex + 1;
        let phase = 'menstrual';
        
        if (cycleDay <= 5) phase = 'menstrual';
        else if (cycleDay <= 13) phase = 'follicular';
        else if (cycleDay <= 17) phase = 'ovulation';
        else phase = 'luteal';

        day.symptoms.forEach(symptom => {
          if (!symptomMap[symptom]) {
            symptomMap[symptom] = { phase: {}, count: 0 };
          }
          
          if (!symptomMap[symptom].phase[phase]) {
            symptomMap[symptom].phase[phase] = 0;
          }
          
          symptomMap[symptom].phase[phase]++;
          symptomMap[symptom].count++;
        });
      });
    });

    const correlations: SymptomCorrelation[] = Object.entries(symptomMap)
      .map(([symptom, data]) => {
        const dominantPhase = Object.entries(data.phase).sort((a, b) => b[1] - a[1])[0];
        
        const frequency = data.count / cycleData.length;
        let severity: 'low' | 'medium' | 'high' = 'low';
        
        if (frequency > 3) severity = 'high';
        else if (frequency > 1.5) severity = 'medium';

        return {
          symptom: symptom.replace('_', ' '),
          cyclePhase: dominantPhase[0],
          frequency: Math.round(frequency * 10) / 10,
          severity,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return correlations;
  };

  const generateAIInsights = async (cycleData: typeof cycles, avgCycleLength: number, irregularityScore: number) => {
    try {
      const systemPrompt = `You are a women's health AI specialist. Analyze the user's cycle data and provide 3-5 actionable health insights.

Cycle data summary:
- Average cycle length: ${avgCycleLength} days
- Irregularity score: ${irregularityScore.toFixed(2)} (0 = very regular, 1 = very irregular)
- Number of tracked cycles: ${cycleData.length}

Return ONLY a valid JSON array of objects with: id (string), title (string), description (string), type ('positive'|'neutral'|'warning'), actionable (boolean).
Focus on cycle patterns, health recommendations, and when to see a doctor. No markdown formatting.`;

      const userContent = JSON.stringify({
        cycles: cycleData.slice(-3).map(c => ({
          startDate: c.startDate,
          days: c.days.map(d => ({
            date: d.date,
            flow: d.flow,
            mood: d.mood,
            symptoms: d.symptoms,
            painLevel: d.painLevel,
          })),
        })),
      });

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let insights: AIInsight[] = [];
        
        try {
          const cleaned = data.completion
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();
          
          const jsonMatch = cleaned.match(/\[[\s\S]*\]/) || cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            insights = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error('Error parsing AI insights:', parseError);
        }

        if (insights && Array.isArray(insights) && insights.length > 0) {
          setAIInsights(insights);
          return;
        }
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }

    setAIInsights([
      {
        id: '1',
        title: 'Cycle Regularity',
        description: irregularityScore < 0.3
          ? 'Your cycle is very regular. Keep up the healthy habits!'
          : 'Your cycle shows some irregularity. Consider stress management and regular sleep.',
        type: irregularityScore < 0.3 ? 'positive' : 'neutral',
        actionable: irregularityScore >= 0.3,
      },
    ]);
  };

  const renderPredictionCard = () => {
    if (!advancedPredictions) return null;

    const nextPeriod = new Date(advancedPredictions.nextPeriodDate);
    const ovulation = new Date(advancedPredictions.ovulationDate);
    const today = new Date();
    
    const daysToNextPeriod = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysToOvulation = Math.ceil((ovulation.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Calendar size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Advanced Predictions</Text>
        </View>
        
        <View style={styles.predictionRow}>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Next Period</Text>
            <Text style={styles.predictionValue}>
              {daysToNextPeriod > 0 ? `${daysToNextPeriod} days` : 'Today'}
            </Text>
          </View>
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Ovulation</Text>
            <Text style={styles.predictionValue}>
              {daysToOvulation > 0 ? `${daysToOvulation} days` : daysToOvulation === 0 ? 'Today' : 'Passed'}
            </Text>
          </View>
        </View>

        <View style={styles.predictionRow}>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Avg Cycle</Text>
            <Text style={styles.predictionValue}>{advancedPredictions.cycleLength} days</Text>
          </View>
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Avg Period</Text>
            <Text style={styles.predictionValue}>{advancedPredictions.periodLength} days</Text>
          </View>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Prediction Confidence</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${advancedPredictions.confidence * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>
            {Math.round(advancedPredictions.confidence * 100)}% confident
          </Text>
        </View>

        <View style={styles.irregularityContainer}>
          <View style={styles.irregularityHeader}>
            {advancedPredictions.irregularityScore < 0.3 ? (
              <TrendingUp size={16} color="#10B981" />
            ) : advancedPredictions.irregularityScore < 0.6 ? (
              <Activity size={16} color="#F59E0B" />
            ) : (
              <TrendingDown size={16} color="#9333EA" />
            )}
            <Text
              style={[
                styles.irregularityText,
                advancedPredictions.irregularityScore < 0.3 && { color: '#10B981' },
                advancedPredictions.irregularityScore >= 0.3 &&
                  advancedPredictions.irregularityScore < 0.6 && { color: '#F59E0B' },
                advancedPredictions.irregularityScore >= 0.6 && { color: '#9333EA' },
              ]}
            >
              {advancedPredictions.irregularityScore < 0.3
                ? 'Very Regular Cycle'
                : advancedPredictions.irregularityScore < 0.6
                ? 'Moderately Regular'
                : 'Irregular Cycle'}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderSymptomCorrelations = () => {
    if (symptomCorrelations.length === 0) return null;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>Symptom Patterns</Text>
        </View>
        
        <Text style={styles.cardSubtitle}>
          Common symptoms and when they occur in your cycle
        </Text>

        {symptomCorrelations.map((correlation, index) => (
          <View key={index} style={styles.correlationItem}>
            <View style={styles.correlationHeader}>
              <Text style={styles.symptomName}>{correlation.symptom}</Text>
              <View
                style={[
                  styles.severityBadge,
                  correlation.severity === 'high' && styles.severityHigh,
                  correlation.severity === 'medium' && styles.severityMedium,
                  correlation.severity === 'low' && styles.severityLow,
                ]}
              >
                <Text style={styles.severityText}>
                  {correlation.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.correlationDetails}>
              <Text style={styles.correlationPhase}>
                Most common in {correlation.cyclePhase} phase
              </Text>
              <Text style={styles.correlationFrequency}>
                Avg {correlation.frequency}x per cycle
              </Text>
            </View>
          </View>
        ))}
      </Card>
    );
  };

  const renderAIInsights = () => {
    if (aiInsights.length === 0) return null;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Brain size={20} color={Colors.primary} />
          <Text style={styles.cardTitle}>AI Health Insights</Text>
        </View>

        {aiInsights.map((insight, index) => (
          <View key={insight.id || index} style={styles.insightItem}>
            <View style={styles.insightHeader}>
              {insight.type === 'positive' && <Heart size={18} color="#10B981" />}
              {insight.type === 'warning' && <AlertCircle size={18} color="#F59E0B" />}
              {insight.type === 'neutral' && <Activity size={18} color={Colors.primary} />}
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            {insight.actionable && (
              <View style={styles.actionableBadge}>
                <Text style={styles.actionableText}>Actionable</Text>
              </View>
            )}
          </View>
        ))}
        <AIExplanationFooter />
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Advanced Analytics',
            headerStyle: {
              backgroundColor: Colors.background,
            },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your cycle data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Advanced Analytics',
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Advanced Cycle Analysis</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered insights based on your last 6 cycles
        </Text>

        <DisclaimerBanner
          type="correlation"
          message={DISCLAIMERS.correlation}
          dismissible={true}
        />

        {renderPredictionCard()}
        {renderSymptomCorrelations()}
        {renderAIInsights()}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={generateAdvancedAnalytics}
        >
          <Text style={styles.refreshButtonText}>Refresh Analysis</Text>
        </TouchableOpacity>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.subtext,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: 16,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  predictionItem: {
    flex: 1,
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 12,
    color: Colors.subtext,
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  confidenceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confidenceLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 4,
  },
  irregularityContainer: {
    marginTop: 12,
  },
  irregularityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  irregularityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: Colors.text,
  },
  correlationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityHigh: {
    backgroundColor: '#EDE9FE',
  },
  severityMedium: {
    backgroundColor: '#FEF3C7',
  },
  severityLow: {
    backgroundColor: '#DBEAFE',
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1530',
  },
  correlationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  correlationPhase: {
    fontSize: 13,
    color: Colors.subtext,
    textTransform: 'capitalize',
  },
  correlationFrequency: {
    fontSize: 13,
    color: Colors.subtext,
  },
  insightItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionableText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
