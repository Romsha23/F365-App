import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { useMoodPredictionStore } from '../../store/mood-prediction-store';
import { useCycleStore } from '../../store/cycle-store';
import { useUserStore } from '../../store/user-store';
import { useSubscriptionStore } from '../../store/subscription-store';
import { MoodTimelineChart } from '../../components/MoodTimelineChart';
import { Card } from '../../components/Card';
import Colors from '../../constants/colors';
import { fonts } from '../../constants/theme';
import { Smile, Meh, Frown, AlertCircle, Zap, Cloud, Info, Lock, Sparkles, TrendingUp } from 'lucide-react-native';
import { MoodType } from '../../types/cycle';
import { MoodPrediction, AIExplanation, PredictiveMoodContext } from '../../types/mood-prediction';
import { mixpanel, MixpanelEvents } from '../../utils/mixpanel';

const getMoodIcon = (mood: MoodType, size: number = 24) => {
  const iconProps = { size, strokeWidth: 2.5 };
  
  switch (mood) {
    case 'happy':
      return <Smile {...iconProps} color="#FFD700" />;
    case 'energetic':
      return <Zap {...iconProps} color="#9333EA" />;
    case 'neutral':
      return <Meh {...iconProps} color="#A0A0A0" />;
    case 'sad':
      return <Frown {...iconProps} color="#6495ED" />;
    case 'irritated':
      return <AlertCircle {...iconProps} color="#D946EF" />;
    case 'anxious':
      return <Cloud {...iconProps} color="#9370DB" />;
    default:
      return <Meh {...iconProps} color="#A0A0A0" />;
  }
};

const getMoodColor = (mood: MoodType): string => {
  switch (mood) {
    case 'happy':
      return '#FFD700';
    case 'energetic':
      return '#9333EA';
    case 'neutral':
      return '#A0A0A0';
    case 'sad':
      return '#6495ED';
    case 'irritated':
      return '#D946EF';
    case 'anxious':
      return '#9370DB';
    default:
      return '#A0A0A0';
  }
};

export default function PredictiveMoodScreen() {
  const { user } = useUserStore();
  const { cycles } = useCycleStore();
  const { getSubscriptionInfo } = useSubscriptionStore();
  const {
    predictions,
    timeline,
    isLoading,
    generatePredictions,
    getAIExplanation,
    getPredictionForDate,
  } = useMoodPredictionStore();

  const [_selectedPrediction, setSelectedPrediction] = useState<MoodPrediction | null>(null);
  const [aiExplanation, setAIExplanation] = useState<AIExplanation | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const subscriptionInfo = getSubscriptionInfo();
  const isPremium = subscriptionInfo.isPro;

  useEffect(() => {
    mixpanel.track(MixpanelEvents.SCREEN_VIEWED, { screenName: 'PredictiveMood' });
    
    if (predictions.length === 0) {
      void generateInitialPredictions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictions.length]);

  const buildContext = (): PredictiveMoodContext => {
    const last60Days = [];
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    for (const cycle of cycles) {
      if (!cycle.days) continue;
      for (const day of cycle.days) {
        const dayDate = new Date(day.date);
        if (dayDate >= sixtyDaysAgo && dayDate <= now) {
          last60Days.push({
            date: day.date,
            mood: day.mood,
            symptoms: day.symptoms || [],
            flow: day.flow,
            cycleDay: 0,
          });
        }
      }
    }

    const lastCycle = cycles.length > 0 ? cycles[cycles.length - 1] : null;
    const currentCycleDay = lastCycle
      ? Math.floor((now.getTime() - new Date(lastCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1;

    const recentSymptoms: string[] = [];
    cycles.forEach(cycle => {
      if (!cycle.days) return;
      cycle.days.forEach(day => {
        if (day.symptoms) {
          recentSymptoms.push(...day.symptoms);
        }
      });
    });

    const moodCounts: Record<string, number> = {};
    last60Days.forEach(day => {
      if (day.mood) {
        moodCounts[day.mood] = (moodCounts[day.mood] || 0) + 1;
      }
    });
    const dominantMood = Object.keys(moodCounts).length > 0
      ? (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0] as MoodType)
      : null;

    return {
      last60DaysData: last60Days,
      cycleInfo: {
        averageCycleLength: user?.averageCycleLength || 28,
        averagePeriodLength: user?.averagePeriodLength || 5,
        currentCycleDay,
      },
      recentSymptoms: Array.from(new Set(recentSymptoms)).slice(0, 10),
      dominantMood,
    };
  };

  const generateInitialPredictions = async () => {
    setLoadError(false);
    try {
      const context = buildContext();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Prediction generation timed out')), 15000)
      );
      await Promise.race([generatePredictions(7, context), timeoutPromise]);
      mixpanel.track('predict_request', { datesAhead: 7 });
    } catch (error) {
      console.error('Error generating predictions:', error);
      setLoadError(true);
    }
  };

  const handleWhyPress = async (prediction: MoodPrediction) => {
    if (!isPremium) {
      setShowPaywallModal(true);
      mixpanel.track('premium_cta_click', { feature: 'ai_explanation', source: 'predictive_mood' });
      return;
    }

    setSelectedPrediction(prediction);
    setIsGeneratingExplanation(true);
    setShowExplanationModal(true);
    mixpanel.track('ai_explain_open', { date: prediction.date });

    try {
      const context = buildContext();
      const explanation = await getAIExplanation(prediction, context);
      setAIExplanation(explanation);
    } catch (error) {
      console.error('Error getting AI explanation:', error);
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  const handleTimelineDayPress = (timelinePrediction: any) => {
    const prediction = getPredictionForDate(timelinePrediction.date);
    if (prediction) {
      setSelectedPrediction(prediction);
    }
  };

  const renderPredictionCard = (prediction: MoodPrediction, type: 'today' | 'next48' | 'next72') => {
    const title = type === 'today' ? 'Today' : type === 'next48' ? 'Next 48h' : 'Next 72h';
    const _hoursAhead = type === 'today' ? 0 : type === 'next48' ? 48 : 72;
    
    return (
      <Card key={prediction.id} style={styles.predictionCard}>
        <View style={styles.predictionHeader}>
          <Text style={styles.predictionTitle}>{title}</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{Math.round(prediction.confidence * 100)}%</Text>
          </View>
        </View>
        
        <View style={styles.predictionContent}>
          <View style={[styles.moodIconContainer, { backgroundColor: getMoodColor(prediction.mood as MoodType) + '20' }]}>
            {getMoodIcon(prediction.mood as MoodType, 32)}
          </View>
          
          <View style={styles.predictionInfo}>
            <Text style={styles.moodLabel}>{prediction.mood}</Text>
            <Text style={styles.moodScore}>Score: {prediction.moodScore}/100</Text>
          </View>
        </View>

        <Text style={styles.reason} numberOfLines={2}>{prediction.reason}</Text>

        <TouchableOpacity
          style={styles.whyButton}
          onPress={() => handleWhyPress(prediction)}
        >
          {isPremium ? (
            <>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.whyButtonText}>Why?</Text>
            </>
          ) : (
            <>
              <Lock size={16} color={Colors.textMuted} />
              <Text style={[styles.whyButtonText, { color: Colors.textMuted }]}>Unlock</Text>
            </>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const renderExplanationModal = () => (
    <Modal
      visible={showExplanationModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowExplanationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Mood Analysis</Text>
            <TouchableOpacity onPress={() => setShowExplanationModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {isGeneratingExplanation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Analyzing your mood patterns...</Text>
              </View>
            ) : aiExplanation ? (
              <>
                <View style={styles.explanationSection}>
                  <Text style={styles.sectionTitle}>
                    <Info size={16} color={Colors.primary} /> Full Analysis
                  </Text>
                  <Text style={styles.explanationText}>{aiExplanation.fullExplanation}</Text>
                </View>

                {aiExplanation.tips && aiExplanation.tips.length > 0 && (
                  <View style={styles.tipsSection}>
                    <Text style={styles.sectionTitle}>
                      <TrendingUp size={16} color={Colors.accent} /> Personalized Tips
                    </Text>
                    {aiExplanation.tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <Text style={styles.tipBullet}>•</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.reasoningSection}>
                  <Text style={styles.reasoningTitle}>Methodology</Text>
                  <Text style={styles.reasoningText}>{aiExplanation.reasoning}</Text>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderPaywallModal = () => (
    <Modal
      visible={showPaywallModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowPaywallModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.paywallContent}>
          <View style={styles.paywallHeader}>
            <Sparkles size={48} color={Colors.primary} />
            <Text style={styles.paywallTitle}>Unlock AI Insights</Text>
          </View>

          <Text style={styles.paywallDescription}>
            Get detailed AI-powered explanations of your mood predictions, personalized tips, and actionable insights with Premium.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Detailed mood analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Personalized action tips</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Pattern insights</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => {
              setShowPaywallModal(false);
              router.push('/subscription' as any);
            }}
          >
            <Text style={styles.upgradeButtonText}>View Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closePaywallButton}
            onPress={() => setShowPaywallModal(false)}
          >
            <Text style={styles.closePaywallText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && predictions.length === 0 && !loadError) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Predictive Mood' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating mood predictions...</Text>
        </View>
      </View>
    );
  }

  if (loadError && predictions.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Predictive Mood' }} />
        <View style={styles.loadingContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.loadingText}>Could not generate predictions</Text>
          <Text style={[styles.subtitle, { marginTop: 8, textAlign: 'center' as const }]}>Log more cycle data or try again</Text>
          <TouchableOpacity
            style={[styles.refreshButton, { marginTop: 20 }]}
            onPress={generateInitialPredictions}
          >
            <TrendingUp size={20} color={Colors.primary} />
            <Text style={styles.refreshButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const todayPrediction = predictions[0];
  const next48Prediction = predictions[1];
  const next72Prediction = predictions[2];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Predictive Mood' }} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Mood Forecast</Text>
          <Text style={styles.subtitle}>AI-powered predictions based on your cycle</Text>
        </View>

        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => router.push('/subscription' as any)}
          >
            <Sparkles size={20} color={Colors.white} />
            <Text style={styles.premiumBannerText}>Unlock full AI insights with Premium</Text>
          </TouchableOpacity>
        )}

        <View style={styles.predictionsRow}>
          {todayPrediction && renderPredictionCard(todayPrediction, 'today')}
          {next48Prediction && renderPredictionCard(next48Prediction, 'next48')}
          {next72Prediction && renderPredictionCard(next72Prediction, 'next72')}
        </View>

        {timeline && timeline.length > 0 && (
          <MoodTimelineChart
            timeline={timeline}
            onDayPress={handleTimelineDayPress}
          />
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={generateInitialPredictions}
        >
          <TrendingUp size={20} color={Colors.primary} />
          <Text style={styles.refreshButtonText}>Refresh Predictions</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderExplanationModal()}
      {renderPaywallModal()}
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  premiumBannerText: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.white,
  },
  predictionsRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  predictionCard: {
    padding: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  confidenceBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: fonts.body.bold,
    color: Colors.primary,
  },
  predictionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  moodScore: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
  reason: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  whyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  whyButtonText: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.primary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textMuted,
  },
  modalScroll: {
    padding: 20,
  },
  explanationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.text,
    lineHeight: 22,
  },
  tipsSection: {
    marginBottom: 24,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: Colors.accent,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.text,
    lineHeight: 20,
  },
  reasoningSection: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
  },
  reasoningTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  paywallContent: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    margin: 20,
    padding: 24,
    alignItems: 'center',
  },
  paywallHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  paywallTitle: {
    fontSize: 24,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
    marginTop: 16,
  },
  paywallDescription: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCheck: {
    fontSize: 20,
    color: Colors.accent,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.text,
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: fonts.body.bold,
    color: Colors.white,
  },
  closePaywallButton: {
    padding: 8,
  },
  closePaywallText: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
});
