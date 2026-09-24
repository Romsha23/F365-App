import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Microscope,
  MapPin,
  DollarSign,
  Route,
  MessageSquare,
  TrendingUp,
  Shield,
  ChevronRight,
  Sparkles,
  Heart,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { TeenGuard } from '@/components/TeenGuard';
import { ReportFeedbackButton } from '@/components/ReportFeedback';
import { useUserStore } from '@/store/user-store';
import { useIVFReadinessStore } from '@/store/ivf-readiness-store';
import { getAgeGateResult } from '@/utils/age-gate';

interface PathwayCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradientColors: readonly [string, string];
  borderColor: string;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
  testID?: string;
}

function PathwayCard({
  icon,
  title,
  description,
  gradientColors,
  borderColor,
  onPress,
  badge,
  badgeColor,
  testID,
}: PathwayCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
    >
      <Animated.View style={[ss.pathwayCard, { borderColor, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ss.pathwayGradient}
        >
          <View style={ss.pathwayTop}>
            <View style={ss.pathwayIconWrap}>{icon}</View>
            <View style={ss.pathwayTextWrap}>
              <View style={ss.pathwayTitleRow}>
                <Text style={ss.pathwayTitle}>{title}</Text>
                {badge && (
                  <View style={[ss.badge, { backgroundColor: badgeColor || '#059669' }]}>
                    <Text style={ss.badgeText}>{badge}</Text>
                  </View>
                )}
              </View>
              <Text style={ss.pathwayDesc}>{description}</Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FertilityPathwayScreen() {
  const { user } = useUserStore();
  const { currentAssessment } = useIVFReadinessStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gate = getAgeGateResult(user?.birthMonth, user?.birthYear, user?.lifeStage);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const getScoreSummary = () => {
    if (!currentAssessment) return null;
    return {
      score: currentAssessment.totalScore,
      category: currentAssessment.category,
    };
  };

  const scoreSummary = getScoreSummary();

  return (
    <TeenGuard featureName="Fertility Pathway">
      <View style={ss.container}>
        <Stack.Screen options={{ title: 'Your Fertility Pathway' }} />
        <ScrollView
          style={ss.scrollView}
          contentContainerStyle={ss.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DisclaimerBanner
            type="info"
            message="F365 provides informational insights only. This is not a medical service. Consult a qualified healthcare professional for medical decisions."
            style={{ marginBottom: 14 }}
          />

          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={ss.heroCard}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={ss.heroGradient}
              >
                <View style={ss.heroIconWrap}>
                  <Sparkles size={28} color="#2563EB" />
                </View>
                <Text style={ss.heroTitle}>Your Fertility Decision Dashboard</Text>
                <Text style={ss.heroSubtitle}>
                  Know your next step — instantly. Clarity without friction, structured decisions, and guided insights.
                </Text>
                {scoreSummary && (
                  <View style={ss.scorePreview}>
                    <View style={ss.scorePreviewLeft}>
                      <Text style={ss.scorePreviewLabel}>Your Readiness Score</Text>
                      <Text style={ss.scorePreviewValue}>{scoreSummary.score}/100</Text>
                    </View>
                    <View style={[ss.scoreCategoryBadge, {
                      backgroundColor: scoreSummary.category === 'low' ? '#ECFDF5'
                        : scoreSummary.category === 'watch' ? '#FFFBEB'
                        : '#FEF2F2'
                    }]}>
                      <Text style={[ss.scoreCategoryText, {
                        color: scoreSummary.category === 'low' ? '#059669'
                          : scoreSummary.category === 'watch' ? '#D97706'
                          : '#DC2626'
                      }]}>
                        {scoreSummary.category.charAt(0).toUpperCase() + scoreSummary.category.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </View>

            <Text style={ss.sectionTitle}>Decision Engine</Text>

            <PathwayCard
              icon={<Microscope size={22} color="#D97706" />}
              title="Fertility Readiness Score"
              description="Multi-factor assessment based on your cycle, age, symptoms, and history."
              gradientColors={['#FFFBEB', '#FEF3C7']}
              borderColor="#FDE68A"
              badge={scoreSummary ? `${scoreSummary.score}/100` : undefined}
              badgeColor="#D97706"
              onPress={() => router.push('/ivf-assessment' as any)}
              testID="pathway-readiness-score"
            />

            <PathwayCard
              icon={<TrendingUp size={22} color="#059669" />}
              title="Personalized Fertility Summary"
              description="Based on your cycle patterns and profile — understand what your data means."
              gradientColors={['#ECFDF5', '#D1FAE5']}
              borderColor="#A7F3D0"
              onPress={() => router.push('/ivf-results' as any)}
              testID="pathway-fertility-summary"
            />

            <PathwayCard
              icon={<MapPin size={22} color="#2563EB" />}
              title="Clinic Discovery & Comparison"
              description="Find and compare nearby fertility clinics based on your profile."
              gradientColors={['#EFF6FF', '#DBEAFE']}
              borderColor="#BFDBFE"
              onPress={() => router.push('/clinic-finder' as any)}
              testID="pathway-clinic-finder"
            />

            <PathwayCard
              icon={<DollarSign size={22} color="#7C3AED" />}
              title="Cost Estimator"
              description="Estimated IVF costs, rebates, and out-of-pocket expenses for your country."
              gradientColors={['#F5F3FF', '#EDE9FE']}
              borderColor="#DDD6FE"
              onPress={() => router.push('/cost-estimator' as any)}
              testID="pathway-cost-estimator"
            />

            <PathwayCard
              icon={<Route size={22} color="#0891B2" />}
              title="IVF / Fertility Roadmap"
              description="Step-by-step guide: GP → Specialist → Tests → Treatment."
              gradientColors={['#ECFEFF', '#CFFAFE']}
              borderColor="#A5F3FC"
              onPress={() => router.push('/ivf-roadmap' as any)}
              testID="pathway-roadmap"
            />

            <PathwayCard
              icon={<MessageSquare size={22} color="#DC2626" />}
              title="Doctor Question Generator"
              description="Tailored questions to ask your specialist, based on your profile."
              gradientColors={['#FEF2F2', '#FEE2E2']}
              borderColor="#FECACA"
              onPress={() => router.push('/doctor-questions' as any)}
              testID="pathway-doctor-questions"
            />

            {gate.canSeePartnerModule && (
              <PathwayCard
                icon={<Heart size={22} color="#EC4899" />}
                title="Partner (Male) Module"
                description="Questionnaire and lifestyle insights for male partners."
                gradientColors={['#FDF2F8', '#FCE7F3']}
                borderColor="#FBCFE8"
                onPress={() => router.push('/partner-education' as any)}
                testID="pathway-partner-module"
              />
            )}

            <View style={ss.legalFooter}>
              <Shield size={14} color={Colors.subtext} />
              <Text style={ss.legalText}>
                F365 provides informational insights only. Not a medical service. Not a diagnostic test. All outputs are based on self-reported data. Always consult a licensed healthcare professional for fertility evaluation and treatment decisions.
              </Text>
            </View>

            <ReportFeedbackButton screenName="fertility-pathway" style={{ marginTop: 12 }} />

            <View style={{ height: 40 }} />
          </Animated.View>
        </ScrollView>
      </View>
    </TeenGuard>
  );
}

const ss = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    ...Platform.select({
      ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(37,99,235,0.1)' },
    }),
  },
  heroGradient: {
    padding: 22,
    alignItems: 'center' as const,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(37,99,235,0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: '#1E3A5F',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: '#475569',
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  scorePreview: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  scorePreviewLeft: {
    flex: 1,
  },
  scorePreviewLabel: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  scorePreviewValue: {
    fontSize: 22,
    fontFamily: fonts.heading.bold,
    color: '#1E3A5F',
    marginTop: 2,
  },
  scoreCategoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreCategoryText: {
    fontSize: 13,
    fontFamily: fonts.body.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
    marginBottom: 12,
  },
  pathwayCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 10,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
    }),
  },
  pathwayGradient: {
    padding: 16,
  },
  pathwayTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  pathwayIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pathwayTextWrap: {
    flex: 1,
  },
  pathwayTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 3,
  },
  pathwayTitle: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#0F172A',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.body.bold,
    color: '#FFFFFF',
  },
  pathwayDesc: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#475569',
    lineHeight: 17,
  },
  legalFooter: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    padding: 14,
    backgroundColor: Colors.lilacMid,
    borderRadius: 12,
    marginTop: 8,
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 16,
  },
});
