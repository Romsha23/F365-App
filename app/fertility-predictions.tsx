import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCycleStore } from '@/store/cycle-store';
import { useFeatureGateStore } from '@/store/feature-gate-store';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Calendar,
  TrendingUp,
  Droplets,
  Egg,
  Info,
  AlertCircle,
  Sparkles,
  Target,
  Thermometer,
  Moon,
  ChevronRight,
  Microscope,
} from 'lucide-react-native';

interface FertilityDay {
  date: string;
  type: 'period' | 'fertile_low' | 'fertile_high' | 'ovulation' | 'luteal' | 'normal';
  label: string;
}

interface FertilityTip {
  id: string;
  title: string;
  description: string;
  icon: 'thermometer' | 'moon' | 'heart' | 'droplets';
  color: string;
}

const FERTILITY_TIPS: FertilityTip[] = [
  {
    id: '1',
    title: 'Basal Body Temperature',
    description: 'Track your BBT every morning before getting out of bed. A sustained rise of 0.2°F indicates ovulation has occurred.',
    icon: 'thermometer',
    color: '#EF4444',
  },
  {
    id: '2',
    title: 'Cervical Mucus Changes',
    description: 'Before ovulation, cervical mucus becomes clear, stretchy, and egg-white like — a sign of peak fertility.',
    icon: 'droplets',
    color: '#3B82F6',
  },
  {
    id: '3',
    title: 'Optimal Timing',
    description: 'The best chance of conception is 1-2 days before ovulation. Sperm can survive up to 5 days in the reproductive tract.',
    icon: 'heart',
    color: '#EC4899',
  },
  {
    id: '4',
    title: 'Cycle Regularity',
    description: 'Tracking 3+ cycles improves prediction accuracy significantly. Irregular cycles may indicate hormonal imbalances worth discussing with your doctor.',
    icon: 'moon',
    color: '#8B5CF6',
  },
];

const TipIcon = ({ icon, color }: { icon: string; color: string }) => {
  switch (icon) {
    case 'thermometer': return <Thermometer size={20} color={color} />;
    case 'droplets': return <Droplets size={20} color={color} />;
    case 'heart': return <Heart size={20} color={color} />;
    case 'moon': return <Moon size={20} color={color} />;
    default: return <Info size={20} color={color} />;
  }
};

export default function FertilityPredictionsScreen() {
  const { cycles, predictions } = useCycleStore();
  const { isFeatureEnabled, getBlockReason } = useFeatureGateStore();
  const featureEnabled = isFeatureEnabled('fertility_predictions');
  const blockReason = getBlockReason('fertility_predictions');

  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [fertileWindow, setFertileWindow] = useState<FertilityDay[]>([]);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
    ]).start();
  }, [fadeAnim, progressAnim]);

  const generateFertileWindow = useCallback(() => {
    console.log('[FertilityPredictions] Generating fertile window from predictions');
    if (!predictions) return;

    const days: FertilityDay[] = [];
    const today = new Date();
    const avgCycle = predictions.averageCycleLength || 28;
    const avgPeriod = predictions.averagePeriodLength || 5;

    const lastCycle = cycles.length > 0 ? new Date(cycles[cycles.length - 1].startDate) : new Date(today.getTime() - (avgCycle * 24 * 60 * 60 * 1000));

    for (let i = 0; i < avgCycle; i++) {
      const date = new Date(lastCycle.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      let type: FertilityDay['type'] = 'normal';
      let label = `Day ${i + 1}`;

      if (i < avgPeriod) {
        type = 'period';
        label = 'Period';
      } else if (i >= avgCycle - 16 && i <= avgCycle - 13) {
        type = 'fertile_low';
        label = 'Low Fertility';
      } else if (i >= avgCycle - 15 && i <= avgCycle - 13) {
        type = 'fertile_high';
        label = 'High Fertility';
      } else if (i === avgCycle - 14) {
        type = 'ovulation';
        label = 'Ovulation Day';
      } else if (i > avgCycle - 14) {
        type = 'luteal';
        label = 'Luteal Phase';
      }

      days.push({ date: dateStr, type, label });
    }

    setFertileWindow(days);
  }, [predictions, cycles]);

  useEffect(() => {
    generateFertileWindow();
  }, [generateFertileWindow]);

  if (!featureEnabled) {
    if (blockReason === 'region') {
      return (
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'Fertility Predictions' }} />
          <View style={styles.blockedContainer}>
            <AlertCircle size={48} color={Colors.error} />
            <Text style={styles.blockedTitle}>Not Available</Text>
            <Text style={styles.blockedText}>This feature is not available in your region.</Text>
          </View>
        </View>
      );
    }
    if (blockReason === 'tier') {
      return (
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'Fertility Predictions' }} />
          <SubscriptionPaywall
            feature="Fertility Predictions"
            description="Unlock AI-powered fertility predictions, ovulation tracking, and personalized conception insights with a Pro subscription."
          />
        </View>
      );
    }
  }

  const getDaysUntilOvulation = () => {
    if (!predictions?.fertileWindowEnd) return null;
    const ovDate = new Date(predictions.fertileWindowEnd);
    const today = new Date();
    const diff = Math.ceil((ovDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 1000 * 24));
    return diff > 0 ? diff : null;
  };

  const getFertilityScore = () => {
    if (!predictions?.fertileWindowStart || !predictions?.fertileWindowEnd) return 0;
    const today = new Date();
    const start = new Date(predictions.fertileWindowStart);
    const end = new Date(predictions.fertileWindowEnd);

    if (today >= start && today <= end) {
      const mid = new Date((start.getTime() + end.getTime()) / 2);
      const distFromMid = Math.abs(today.getTime() - mid.getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(0, Math.min(100, Math.round(100 - (distFromMid * 20))));
    }

    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 1000 * 24));
    if (daysUntil > 0 && daysUntil <= 3) return Math.round(30 + (3 - daysUntil) * 10);
    return 10;
  };

  const getCurrentPhase = () => {
    if (!predictions) return 'Unknown';
    const today = new Date();
    const fertileStart = predictions.fertileWindowStart ? new Date(predictions.fertileWindowStart) : null;
    const fertileEnd = predictions.fertileWindowEnd ? new Date(predictions.fertileWindowEnd) : null;
    const nextPeriod = predictions.nextPeriodDate ? new Date(predictions.nextPeriodDate) : null;

    if (fertileStart && fertileEnd && today >= fertileStart && today <= fertileEnd) return 'Fertile Window';
    if (nextPeriod) {
      const daysUntil = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 0) return 'Menstrual Phase';
      if (daysUntil <= 14) return 'Luteal Phase';
    }
    return 'Follicular Phase';
  };

  const fertilityScore = getFertilityScore();
  const daysUntilOvulation = getDaysUntilOvulation();
  const currentPhase = getCurrentPhase();
  const hasData = cycles.length > 0 && predictions;
  const confidence = hasData && predictions?.confidence ? Math.round(predictions.confidence * 100) : 0;

  const scoreColor = fertilityScore >= 70 ? '#10B981' : fertilityScore >= 40 ? '#F59E0B' : '#6B7280';

  const getPhaseColor = (type: string) => {
    switch (type) {
      case 'period': return '#EF4444';
      case 'fertile_low': return '#F59E0B';
      case 'fertile_high': return '#10B981';
      case 'ovulation': return '#EC4899';
      case 'luteal': return '#8B5CF6';
      default: return '#D1D5DB';
    }
  };

  const scoreWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${fertilityScore}%`],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Fertility Predictions' }} />
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.ivfCard}
            onPress={() => router.push('/ivf-assessment' as any)}
            activeOpacity={0.7}
            testID="ivf-readiness-card"
          >
            <LinearGradient
              colors={['#FFFBEB', '#FEF3C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ivfGradient}
            >
              <View style={styles.ivfIconWrap}>
                <Microscope size={22} color="#D97706" />
              </View>
              <View style={styles.ivfContent}>
                <Text style={styles.ivfTitle}>IVF Readiness Indicator</Text>
                <Text style={styles.ivfSubtitle}>Assess your fertility readiness with our multi-factor scoring tool</Text>
              </View>
              <ChevronRight size={20} color="#D97706" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#FDF2F8', '#FCEEF5', '#FFF7ED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroTop}>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroLabel}>Current Phase</Text>
                  <Text style={styles.heroPhase}>{currentPhase}</Text>
                  {hasData ? (
                    <View style={styles.confidenceBadge}>
                      <Sparkles size={12} color="#D97706" />
                      <Text style={styles.confidenceText}>{confidence}% confidence</Text>
                    </View>
                  ) : (
                    <View style={[styles.confidenceBadge, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                      <Info size={12} color="#6B7280" />
                      <Text style={[styles.confidenceText, { color: '#6B7280' }]}>No cycle data yet</Text>
                    </View>
                  )}
                </View>
                <View style={styles.scoreCircle}>
                  <Text style={[styles.scoreValue, { color: scoreColor }]}>{fertilityScore}</Text>
                  <Text style={styles.scoreLabel}>fertility</Text>
                </View>
              </View>

              <View style={styles.fertProgressContainer}>
                <View style={styles.fertProgressBg}>
                  <Animated.View style={[styles.fertProgressFill, { width: scoreWidth, backgroundColor: scoreColor }]} />
                </View>
                <Text style={styles.fertProgressLabel}>
                  {fertilityScore >= 70 ? 'Peak fertility window' : fertilityScore >= 40 ? 'Approaching fertile window' : 'Low fertility phase'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Egg size={20} color="#D97706" />
              </View>
              <Text style={styles.statValue}>
                {daysUntilOvulation ? `${daysUntilOvulation}d` : '--'}
              </Text>
              <Text style={styles.statLabel}>To Ovulation</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FCE7F3' }]}>
                <Calendar size={20} color="#EC4899" />
              </View>
              <Text style={styles.statValue}>{predictions?.averageCycleLength || 28}d</Text>
              <Text style={styles.statLabel}>Avg Cycle</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Target size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{cycles.length}</Text>
              <Text style={styles.statLabel}>Tracked</Text>
            </View>
          </View>

          {predictions?.fertileWindowStart && predictions?.fertileWindowEnd && (
            <View style={styles.windowCard}>
              <View style={styles.windowHeader}>
                <Heart size={20} color="#EC4899" />
                <Text style={styles.windowTitle}>Fertile Window</Text>
              </View>
              <View style={styles.windowDates}>
                <View style={styles.windowDateItem}>
                  <Text style={styles.windowDateLabel}>Starts</Text>
                  <Text style={styles.windowDateValue}>
                    {new Date(predictions.fertileWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.windowDateDivider} />
                <View style={styles.windowDateItem}>
                  <Text style={styles.windowDateLabel}>Peak</Text>
                  <Text style={[styles.windowDateValue, { color: '#EC4899' }]}>
                    {new Date(predictions.fertileWindowEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.windowDateDivider} />
                <View style={styles.windowDateItem}>
                  <Text style={styles.windowDateLabel}>Next Period</Text>
                  <Text style={styles.windowDateValue}>
                    {predictions.nextPeriodDate
                      ? new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '--'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {fertileWindow.length > 0 && (
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Cycle Timeline</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
                {fertileWindow.map((day, index) => (
                  <TouchableOpacity
                    key={day.date}
                    style={[
                      styles.timelineDay,
                      selectedPhase === day.date && styles.timelineDaySelected,
                    ]}
                    onPress={() => setSelectedPhase(day.date === selectedPhase ? null : day.date)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.timelineDot, { backgroundColor: getPhaseColor(day.type) }]} />
                    <Text style={styles.timelineDayNum}>{index + 1}</Text>
                    {selectedPhase === day.date && (
                      <Text style={styles.timelineDayLabel} numberOfLines={1}>{day.label}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.legendRow}>
                {[
                  { color: '#EF4444', label: 'Period' },
                  { color: '#F59E0B', label: 'Fertile' },
                  { color: '#EC4899', label: 'Ovulation' },
                  { color: '#8B5CF6', label: 'Luteal' },
                ].map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.tipsSection}>
            <Text style={styles.tipsSectionTitle}>Fertility Tips</Text>
            {FERTILITY_TIPS.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={[styles.tipIconWrap, { backgroundColor: tip.color + '15' }]}>
                  <TipIcon icon={tip.icon} color={tip.color} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDescription}>{tip.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {!predictions && (
            <View style={styles.emptyCard}>
              <TrendingUp size={40} color={Colors.subtext} />
              <Text style={styles.emptyTitle}>Start Tracking</Text>
              <Text style={styles.emptyText}>
                Log at least one cycle to see personalized fertility predictions and ovulation estimates.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/log-entry' as any)}>
                <Text style={styles.emptyButtonText}>Log Period</Text>
              </TouchableOpacity>
            </View>
          )}

          <DisclaimerBanner
            type="info"
            message="Fertility predictions are estimates based on your cycle data. They should not be used as a sole method of contraception or conception planning. Always consult your healthcare provider."
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 32,
  },
  blockedTitle: {
    fontSize: 22,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  blockedText: {
    fontSize: 15,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: { shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(236,72,153,0.12)' },
    }),
  },
  heroGradient: {
    padding: 20,
    borderRadius: 20,
  },
  heroTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  heroInfo: {
    flex: 1,
    marginRight: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#9D174D',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroPhase: {
    fontSize: 24,
    fontFamily: fonts.heading.bold,
    color: '#831843',
    marginBottom: 8,
  },
  confidenceBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#92400E',
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
    borderColor: 'rgba(236,72,153,0.2)',
  },
  scoreValue: {
    fontSize: 26,
    fontFamily: fonts.heading.bold,
  },
  scoreLabel: {
    fontSize: 9,
    fontFamily: fonts.body.medium,
    color: '#9D174D',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  fertProgressContainer: {
    marginTop: 16,
  },
  fertProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  fertProgressFill: {
    height: '100%' as const,
    borderRadius: 4,
  },
  fertProgressLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#9D174D',
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    }),
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  windowCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    ...Platform.select({
      ios: { shadowColor: '#EC4899', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(236,72,153,0.08)' },
    }),
  },
  windowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  windowTitle: {
    fontSize: 17,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  windowDates: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
  windowDateItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  windowDateLabel: {
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    marginBottom: 4,
  },
  windowDateValue: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  windowDateDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#FCE7F3',
  },
  timelineCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    }),
  },
  timelineTitle: {
    fontSize: 17,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 14,
  },
  timelineScroll: {
    paddingBottom: 8,
  },
  timelineDay: {
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 36,
  },
  timelineDaySelected: {
    backgroundColor: Colors.lilacMid,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  timelineDayNum: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: Colors.foreground,
  },
  timelineDayLabel: {
    fontSize: 8,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    marginTop: 2,
    maxWidth: 48,
    textAlign: 'center' as const,
  },
  legendRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  tipsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tipsSectionTitle: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 19,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
  ivfCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...Platform.select({
      ios: { shadowColor: '#D97706', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(217,119,6,0.08)' },
    }),
  },
  ivfGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  ivfIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  ivfContent: {
    flex: 1,
  },
  ivfTitle: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#92400E',
    marginBottom: 2,
  },
  ivfSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#B45309',
    lineHeight: 16,
  },
});
