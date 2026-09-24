import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  TrendingUp,
  Target,
  RefreshCw,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Info,
  MapPin,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { useIVFReadinessStore } from '@/store/ivf-readiness-store';
import { IVFCategory, IVFSubScore } from '@/types/ivf-readiness';

const CATEGORY_CONFIG: Record<IVFCategory, { label: string; color: string; bg: string; border: string; gradient: readonly [string, string]; desc: string }> = {
  low: {
    label: 'Low',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    gradient: ['#ECFDF5', '#D1FAE5'] as const,
    desc: 'Natural conception is likely. Continue healthy tracking habits.',
  },
  watch: {
    label: 'Watch',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    gradient: ['#FFFBEB', '#FEF3C7'] as const,
    desc: 'Needs monitoring. Some factors may benefit from professional attention.',
  },
  high: {
    label: 'High',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    gradient: ['#FEF2F2', '#FEE2E2'] as const,
    desc: 'Consult a fertility specialist. Multiple indicators suggest evaluation is needed.',
  },
  critical: {
    label: 'Critical',
    color: '#991B1B',
    bg: '#FEF2F2',
    border: '#FCA5A5',
    gradient: ['#FEE2E2', '#FECACA'] as const,
    desc: 'IVF or fertility intervention is likely. Specialist consultation strongly recommended.',
  },
};

const LEVEL_COLORS = {
  low: '#059669',
  moderate: '#D97706',
  high: '#DC2626',
};

function ScoreBar({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: (score / maxScore) * 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score, maxScore, animVal]);

  const width = animVal.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={ss.scoreBarBg}>
      <Animated.View style={[ss.scoreBarFill, { width, backgroundColor: color }]} />
    </View>
  );
}

function SubScoreCard({ sub }: { sub: IVFSubScore }) {
  const color = LEVEL_COLORS[sub.level];
  return (
    <View style={ss.subScoreCard}>
      <View style={ss.subScoreHeader}>
        <Text style={ss.subScoreLabel}>{sub.label}</Text>
        <View style={[ss.levelBadge, { backgroundColor: color + '15' }]}>
          <Text style={[ss.levelBadgeText, { color }]}>
            {sub.level.charAt(0).toUpperCase() + sub.level.slice(1)}
          </Text>
        </View>
      </View>
      <ScoreBar score={sub.score} maxScore={sub.maxScore} color={color} />
      <View style={ss.subScoreFooter}>
        <Text style={ss.subScoreValue}>{sub.score}/{sub.maxScore}</Text>
        <Text style={ss.subScoreDesc} numberOfLines={2}>{sub.description}</Text>
      </View>
    </View>
  );
}

export default function IVFResultsScreen() {
  const { currentAssessment, isLoading, loadAssessments, assessments } = useIVFReadinessStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!currentAssessment) {
      void loadAssessments();
    }
  }, [currentAssessment, loadAssessments]);

  useEffect(() => {
    if (currentAssessment) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [currentAssessment, fadeAnim, scaleAnim]);

  if (isLoading || !currentAssessment) {
    return (
      <View style={ss.container}>
        <Stack.Screen options={{ title: 'IVF Readiness Results' }} />
        <View style={ss.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={ss.loadingText}>Loading your results...</Text>
        </View>
      </View>
    );
  }

  const result = currentAssessment;
  const config = CATEGORY_CONFIG[result.category];
  const subScoreList = [
    result.subScores.age,
    result.subScores.cycle,
    result.subScores.timeToConceive,
    result.subScores.medical,
    result.subScores.ovulation,
    result.subScores.symptoms,
  ];

  return (
    <View style={ss.container}>
      <Stack.Screen options={{ title: 'IVF Readiness Results' }} />
      <ScrollView
        style={ss.scrollView}
        contentContainerStyle={ss.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DisclaimerBanner
          type="warning"
          message="This is a READINESS INDICATOR only — NOT a medical diagnosis. Results are based on self-reported data. Always consult a qualified fertility specialist for medical decisions."
          style={{ marginBottom: 12 }}
        />

        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <View style={[ss.heroCard, { borderColor: config.border }]}>
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.heroGradient}
            >
              <View style={ss.heroTop}>
                <View>
                  <Text style={ss.heroLabel}>Your IVF Readiness Indicator</Text>
                  <View style={ss.heroScoreRow}>
                    <Text style={[ss.heroScore, { color: config.color }]}>{result.totalScore}</Text>
                    <Text style={ss.heroScoreMax}>/100</Text>
                  </View>
                </View>
                <View style={[ss.categoryBadge, { backgroundColor: config.color + '18', borderColor: config.color + '40' }]}>
                  <Text style={[ss.categoryBadgeText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>
              <Text style={[ss.heroDesc, { color: config.color }]}>{config.desc}</Text>
              <View style={ss.heroBarContainer}>
                <ScoreBar score={result.totalScore} maxScore={100} color={config.color} />
                <View style={ss.heroBarLabels}>
                  <Text style={ss.heroBarLabel}>Low (0-30)</Text>
                  <Text style={ss.heroBarLabel}>Watch (31-60)</Text>
                  <Text style={ss.heroBarLabel}>High (61-80)</Text>
                  <Text style={ss.heroBarLabel}>Critical (81+)</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        <View style={ss.predictionCards}>
          <View style={[ss.predictionCard, { borderColor: '#A7F3D0' }]}>
            <LinearGradient colors={['#ECFDF5', '#D1FAE5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ss.predictionGradient}>
              <Target size={20} color="#059669" />
              <Text style={[ss.predictionValue, { color: '#059669' }]}>{result.predictions.naturalConceptionLikelihood}%</Text>
              <Text style={ss.predictionLabel}>Natural Conception Likelihood*</Text>
            </LinearGradient>
          </View>
          <View style={[ss.predictionCard, { borderColor: '#FDE68A' }]}>
            <LinearGradient colors={['#FFFBEB', '#FEF3C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ss.predictionGradient}>
              <TrendingUp size={20} color="#D97706" />
              <Text style={[ss.predictionValue, { color: '#D97706' }]}>{result.predictions.interventionLikelihood}%</Text>
              <Text style={ss.predictionLabel}>Intervention Likelihood*</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={ss.predictionDisclaimer}>
          <Info size={12} color={Colors.subtext} />
          <Text style={ss.predictionDisclaimerText}>
            *Based on similar self-reported profiles. These are statistical estimates, not personal predictions. Individual outcomes vary significantly.
          </Text>
        </View>

        <Text style={ss.sectionTitle}>Score Breakdown</Text>
        <View style={ss.subScoresContainer}>
          {subScoreList.map((sub, idx) => (
            <SubScoreCard key={idx} sub={sub} />
          ))}
        </View>

        {result.actions.length > 0 && (
          <View style={ss.actionsCard}>
            <View style={ss.actionsHeader}>
              <CheckCircle size={20} color="#D97706" />
              <Text style={ss.actionsTitle}>Recommended Next Steps</Text>
            </View>
            {result.actions.map((action, idx) => (
              <View key={idx} style={ss.actionRow}>
                <View style={ss.actionBullet}>
                  <Text style={ss.actionBulletText}>{idx + 1}</Text>
                </View>
                <Text style={ss.actionText}>{action}</Text>
              </View>
            ))}
            <DisclaimerBanner
              type="info"
              message="These suggestions are informational only and do not constitute medical advice. Please discuss any concerns with your healthcare provider."
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {assessments.length > 1 && (
          <View style={ss.historyCard}>
            <View style={ss.historyHeader}>
              <BarChart3 size={18} color={Colors.primary} />
              <Text style={ss.historyTitle}>Assessment History</Text>
            </View>
            {assessments.slice(0, 5).map((a, idx) => {
              const c = CATEGORY_CONFIG[a.category];
              return (
                <View key={a.id || idx} style={ss.historyRow}>
                  <View style={[ss.historyDot, { backgroundColor: c.color }]} />
                  <View style={ss.historyInfo}>
                    <Text style={ss.historyScore}>{a.totalScore}/100 — {c.label}</Text>
                    <Text style={ss.historyDate}>
                      {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {result.category !== 'low' && (
          <TouchableOpacity
            style={ss.clinicCta}
            onPress={() => router.push('/clinic-finder' as any)}
            activeOpacity={0.7}
            testID="find-clinic-cta"
          >
            <View style={ss.clinicCtaIcon}>
              <MapPin size={20} color="#2563EB" />
            </View>
            <View style={ss.clinicCtaContent}>
              <Text style={ss.clinicCtaTitle}>Find a fertility clinic</Text>
              <Text style={ss.clinicCtaDesc}>Connect with matched clinics based on your profile</Text>
            </View>
            <ArrowRight size={18} color="#2563EB" />
          </TouchableOpacity>
        )}

        <View style={ss.bottomActions}>
          <TouchableOpacity
            style={ss.retakeBtn}
            onPress={() => router.push('/ivf-assessment' as any)}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color="#D97706" />
            <Text style={ss.retakeBtnText}>Retake Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={ss.fertBtn}
            onPress={() => router.push('/fertility-predictions' as any)}
            activeOpacity={0.7}
          >
            <Text style={ss.fertBtnText}>View Fertility Predictions</Text>
            <ArrowRight size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={ss.legalFooter}>
          <Shield size={14} color={Colors.subtext} />
          <Text style={ss.legalText}>
            F365 IVF Readiness Indicator is a wellness tool. It is NOT a medical device, NOT a diagnostic test, and should NOT be used to make clinical decisions. All outputs are based on self-reported data. Always consult a licensed healthcare professional for fertility evaluation and treatment decisions.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    borderWidth: 1.5,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    }),
  },
  heroGradient: {
    padding: 20,
  },
  heroTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroScoreRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  heroScore: {
    fontSize: 48,
    fontFamily: fonts.heading.bold,
  },
  heroScoreMax: {
    fontSize: 20,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    marginLeft: 2,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontFamily: fonts.body.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  heroDesc: {
    fontSize: 14,
    fontFamily: fonts.body.medium,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroBarContainer: {
    marginTop: 4,
  },
  heroBarLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 6,
  },
  heroBarLabel: {
    fontSize: 9,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  predictionCards: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 8,
  },
  predictionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
  },
  predictionGradient: {
    padding: 16,
    alignItems: 'center' as const,
    gap: 6,
  },
  predictionValue: {
    fontSize: 28,
    fontFamily: fonts.heading.bold,
  },
  predictionLabel: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    textAlign: 'center' as const,
    lineHeight: 15,
  },
  predictionDisclaimer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 20,
    marginTop: 4,
  },
  predictionDisclaimerText: {
    flex: 1,
    fontSize: 10,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
    marginBottom: 12,
  },
  subScoresContainer: {
    gap: 10,
    marginBottom: 20,
  },
  subScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  subScoreHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  subScoreLabel: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontFamily: fonts.body.semiBold,
  },
  scoreBarBg: {
    height: 6,
    backgroundColor: Colors.lilacMid,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  scoreBarFill: {
    height: '100%' as const,
    borderRadius: 3,
  },
  subScoreFooter: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
  },
  subScoreValue: {
    fontSize: 12,
    fontFamily: fonts.body.bold,
    color: Colors.foreground,
    minWidth: 30,
  },
  subScoreDesc: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 17,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#D97706', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(217,119,6,0.08)' },
    }),
  },
  actionsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  actionsTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    marginBottom: 10,
  },
  actionBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionBulletText: {
    fontSize: 11,
    fontFamily: fonts.body.bold,
    color: '#92400E',
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.foreground,
    lineHeight: 19,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  historyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyInfo: {
    flex: 1,
  },
  historyScore: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  historyDate: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    marginTop: 2,
  },
  clinicCta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(37,99,235,0.08)' },
    }),
  },
  clinicCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  clinicCtaContent: {
    flex: 1,
  },
  clinicCtaTitle: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#1E40AF',
    marginBottom: 2,
  },
  clinicCtaDesc: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#3B82F6',
    lineHeight: 17,
  },
  bottomActions: {
    gap: 10,
    marginBottom: 16,
  },
  retakeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  retakeBtnText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#92400E',
  },
  fertBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#D97706',
  },
  fertBtnText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
  legalFooter: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    padding: 14,
    backgroundColor: Colors.lilacMid,
    borderRadius: 12,
    marginBottom: 8,
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 16,
  },
});
