import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { useCycleStore } from '@/store/cycle-store';
import { useFeatureGateStore } from '@/store/feature-gate-store';
import { usePCOSStore, PCOSSymptomEntry } from '@/store/pcos-store';
import { SubscriptionPaywall } from '@/components/SubscriptionPaywall';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  Activity,
  Scale,
  Heart,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Salad,
  Dumbbell,
  BedDouble,
  Save,
  Clock,
} from 'lucide-react-native';

interface PCOSSymptomDisplay {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface PCOSArticle {
  id: string;
  title: string;
  summary: string;
  category: 'lifestyle' | 'nutrition' | 'medical' | 'exercise';
  readTime: string;
}

const SYMPTOM_DESCRIPTIONS: Record<string, PCOSSymptomDisplay> = {
  irregular_periods: { id: 'irregular_periods', name: 'Irregular Periods', description: 'Cycles longer than 35 days, fewer than 8 periods per year, or absent periods', icon: 'calendar' },
  heavy_bleeding: { id: 'heavy_bleeding', name: 'Heavy Bleeding', description: 'Unusually heavy or prolonged menstrual periods', icon: 'droplets' },
  weight_gain: { id: 'weight_gain', name: 'Weight Changes', description: 'Unexplained weight gain, especially around the midsection', icon: 'scale' },
  acne: { id: 'acne', name: 'Acne & Skin Changes', description: 'Persistent acne, oily skin, or dark patches (acanthosis nigricans)', icon: 'activity' },
  hair_thinning: { id: 'hair_thinning', name: 'Hair Changes', description: 'Thinning hair on the scalp or excess hair growth on face/body (hirsutism)', icon: 'activity' },
  fatigue: { id: 'fatigue', name: 'Fatigue & Low Energy', description: 'Persistent tiredness, difficulty concentrating, or brain fog', icon: 'moon' },
  mood_changes: { id: 'mood_changes', name: 'Mood Fluctuations', description: 'Anxiety, depression, or mood swings more intense than typical PMS', icon: 'heart' },
  insulin_resistance: { id: 'insulin_resistance', name: 'Blood Sugar Issues', description: 'Sugar cravings, energy crashes, or signs of insulin resistance', icon: 'thermometer' },
};

const PCOS_ARTICLES: PCOSArticle[] = [
  { id: '1', title: 'Understanding PCOS: Beyond the Basics', summary: 'PCOS affects 1 in 10 people with ovaries. Learn about the hormonal imbalances, types of PCOS, and why early management matters.', category: 'medical', readTime: '5 min' },
  { id: '2', title: 'Anti-Inflammatory Diet for PCOS', summary: 'Specific foods can help manage insulin resistance and reduce inflammation. Focus on omega-3s, leafy greens, berries, and whole grains.', category: 'nutrition', readTime: '4 min' },
  { id: '3', title: 'Exercise Strategies That Help', summary: 'Moderate-intensity exercise like brisk walking, swimming, and strength training can improve insulin sensitivity and reduce androgen levels.', category: 'exercise', readTime: '3 min' },
  { id: '4', title: 'Sleep & Stress Management', summary: 'Poor sleep and chronic stress worsen PCOS symptoms by increasing cortisol and insulin. Prioritize 7-9 hours of sleep and daily stress-relief.', category: 'lifestyle', readTime: '4 min' },
  { id: '5', title: 'When to See Your Doctor', summary: 'If your cycles are consistently irregular, you have new symptoms, or management strategies aren\'t helping, it\'s time for a checkup.', category: 'medical', readTime: '3 min' },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'nutrition': return <Salad size={16} color="#10B981" />;
    case 'exercise': return <Dumbbell size={16} color="#3B82F6" />;
    case 'lifestyle': return <BedDouble size={16} color="#8B5CF6" />;
    case 'medical': return <CircleAlert size={16} color="#EF4444" />;
    default: return <BookOpen size={16} color={Colors.subtext} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'nutrition': return '#ECFDF5';
    case 'exercise': return '#EFF6FF';
    case 'lifestyle': return '#F5F3FF';
    case 'medical': return '#FEF2F2';
    default: return Colors.lilacLight;
  }
};

export default function PCOSInsightsScreen() {
  const { cycles } = useCycleStore();
  const { isFeatureEnabled, getBlockReason } = useFeatureGateStore();
  const { currentSymptoms, history, lastUpdated, updateSymptom, saveSnapshot, loadFromSupabase, getSymptomTrend } = usePCOSStore();

  const featureEnabled = isFeatureEnabled('pcos_insights');
  const blockReason = getBlockReason('pcos_insights');

  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'insights' | 'learn'>('tracker');
  const [hasSavedToday, setHasSavedToday] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    void loadFromSupabase();
  }, [fadeAnim, loadFromSupabase]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySnapshot = history.find(h => h.date === today);
    setHasSavedToday(!!todaySnapshot);
  }, [history]);

  const riskAnalysis = useMemo(() => {
    console.log('[PCOSInsights] Computing risk analysis from cycle data');
    if (!cycles || cycles.length < 2) {
      return { score: 0, level: 'insufficient_data' as const, factors: [] as string[] };
    }

    const sortedCycles = [...cycles].sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    const cycleLengths: number[] = [];
    for (let i = 0; i < sortedCycles.length - 1; i++) {
      const current = new Date(sortedCycles[i].startDate);
      const next = new Date(sortedCycles[i + 1].startDate);
      const len = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      if (len > 0 && len < 90) cycleLengths.push(len);
    }

    if (cycleLengths.length === 0) {
      return { score: 0, level: 'insufficient_data' as const, factors: [] as string[] };
    }

    const avgLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const variance = cycleLengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);

    let score = 0;
    const factors: string[] = [];

    if (avgLength > 35) {
      score += 30;
      factors.push('Average cycle length exceeds 35 days');
    } else if (avgLength > 32) {
      score += 15;
      factors.push('Average cycle length is slightly long');
    }

    if (stdDev > 8) {
      score += 25;
      factors.push('High cycle length variability');
    } else if (stdDev > 5) {
      score += 12;
      factors.push('Moderate cycle irregularity');
    }

    const longCycles = cycleLengths.filter(l => l > 35).length;
    if (longCycles >= 2) {
      score += 20;
      factors.push(`${longCycles} cycles longer than 35 days`);
    }

    const trackedSevere = currentSymptoms.filter(s => s.severity === 'severe').length;
    const trackedModerate = currentSymptoms.filter(s => s.severity === 'moderate').length;
    score += trackedSevere * 10 + trackedModerate * 5;
    if (trackedSevere > 0) factors.push(`${trackedSevere} severe symptom(s) reported`);
    if (trackedModerate > 0) factors.push(`${trackedModerate} moderate symptom(s) reported`);

    score = Math.min(100, score);

    let level: 'low' | 'moderate' | 'elevated' | 'insufficient_data' = 'low';
    if (score >= 60) level = 'elevated';
    else if (score >= 30) level = 'moderate';

    return { score, level, factors };
  }, [cycles, currentSymptoms]);

  const handleSeverityChange = useCallback((symptomId: string, severity: PCOSSymptomEntry['severity']) => {
    updateSymptom(symptomId, severity);
  }, [updateSymptom]);

  const handleSaveSnapshot = useCallback(() => {
    console.log('[PCOSInsights] Saving symptom snapshot');
    saveSnapshot(riskAnalysis.score, riskAnalysis.level);
    setHasSavedToday(true);
  }, [saveSnapshot, riskAnalysis]);

  if (!featureEnabled) {
    if (blockReason === 'region') {
      return (
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'PCOS Insights' }} />
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
          <Stack.Screen options={{ title: 'PCOS Insights' }} />
          <SubscriptionPaywall
            feature="PCOS Insights"
            description="Get personalized PCOS symptom tracking, pattern analysis, and lifestyle management tips with a Pro subscription."
          />
        </View>
      );
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'elevated': return '#EF4444';
      case 'moderate': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'elevated': return 'Elevated Indicators';
      case 'moderate': return 'Some Indicators Present';
      case 'low': return 'Low Indicators';
      default: return 'Need More Data';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return '#EF4444';
      case 'moderate': return '#F59E0B';
      case 'mild': return '#10B981';
      default: return '#D1D5DB';
    }
  };

  const renderTracker = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.riskCard}>
        <LinearGradient
          colors={riskAnalysis.level === 'elevated' ? ['#FEF2F2', '#FEE2E2'] : riskAnalysis.level === 'moderate' ? ['#FFFBEB', '#FEF3C7'] : ['#ECFDF5', '#D1FAE5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.riskGradient}
        >
          <View style={styles.riskHeader}>
            <View>
              <Text style={styles.riskLabel}>PCOS Indicator Score</Text>
              <Text style={[styles.riskLevel, { color: getLevelColor(riskAnalysis.level) }]}>
                {getLevelLabel(riskAnalysis.level)}
              </Text>
            </View>
            <View style={[styles.riskScoreCircle, { borderColor: getLevelColor(riskAnalysis.level) }]}>
              <Text style={[styles.riskScoreValue, { color: getLevelColor(riskAnalysis.level) }]}>
                {riskAnalysis.level === 'insufficient_data' ? '?' : riskAnalysis.score}
              </Text>
            </View>
          </View>

          {riskAnalysis.level !== 'insufficient_data' && (
            <View style={styles.riskBarContainer}>
              <View style={styles.riskBarBg}>
                <View style={[styles.riskBarFill, { width: `${riskAnalysis.score}%`, backgroundColor: getLevelColor(riskAnalysis.level) }]} />
              </View>
            </View>
          )}

          {riskAnalysis.factors.length > 0 && (
            <View style={styles.factorsList}>
              {riskAnalysis.factors.map((factor, idx) => (
                <View key={idx} style={styles.factorItem}>
                  <View style={[styles.factorDot, { backgroundColor: getLevelColor(riskAnalysis.level) }]} />
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </View>
          )}

          {riskAnalysis.level === 'insufficient_data' && (
            <Text style={styles.riskEmptyText}>
              Track at least 2 cycles to see your PCOS indicator analysis. The more data you log, the better the insights.
            </Text>
          )}
        </LinearGradient>
      </View>

      <View style={styles.savedBanner}>
        <View style={styles.savedBannerLeft}>
          <Clock size={14} color={Colors.subtext} />
          <Text style={styles.savedBannerText}>
            {lastUpdated
              ? `Last saved: ${new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
              : 'Not saved yet'}
          </Text>
        </View>
        {history.length > 0 && (
          <Text style={styles.savedBannerCount}>{history.length} snapshot{history.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Symptom Tracker</Text>
      <Text style={styles.sectionSubtitle}>Rate your current symptoms to improve analysis accuracy</Text>

      {currentSymptoms.map((symptom) => {
        const desc = SYMPTOM_DESCRIPTIONS[symptom.id];
        return (
          <View key={symptom.id} style={styles.symptomCard}>
            <View style={styles.symptomHeader}>
              <View style={styles.symptomInfo}>
                <Text style={styles.symptomName}>{desc?.name ?? symptom.name}</Text>
                <Text style={styles.symptomDesc}>{desc?.description ?? ''}</Text>
              </View>
            </View>
            <View style={styles.severityRow}>
              {(['none', 'mild', 'moderate', 'severe'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityButton,
                    symptom.severity === level && { backgroundColor: getSeverityColor(level) + '20', borderColor: getSeverityColor(level) },
                  ]}
                  onPress={() => handleSeverityChange(symptom.id, level)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.severityText,
                    symptom.severity === level && { color: getSeverityColor(level), fontFamily: fonts.body.semiBold },
                  ]}>
                    {level === 'none' ? 'None' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.saveButton, hasSavedToday && styles.saveButtonDone]}
        onPress={handleSaveSnapshot}
        activeOpacity={0.7}
      >
        <Save size={18} color={hasSavedToday ? '#10B981' : '#FFFFFF'} />
        <Text style={[styles.saveButtonText, hasSavedToday && styles.saveButtonTextDone]}>
          {hasSavedToday ? 'Update Today\'s Snapshot' : 'Save Today\'s Snapshot'}
        </Text>
      </TouchableOpacity>

      <DisclaimerBanner
        type="warning"
        message="This tool provides informational patterns only and cannot diagnose PCOS. Only a healthcare provider can diagnose PCOS through proper evaluation including blood tests and ultrasound."
      />
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderInsights = () => {
    const avgCycleLength = cycles.length >= 2
      ? (() => {
          const sorted = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          const lengths: number[] = [];
          for (let i = 0; i < sorted.length - 1; i++) {
            const len = Math.floor((new Date(sorted[i].startDate).getTime() - new Date(sorted[i + 1].startDate).getTime()) / (1000 * 60 * 60 * 24));
            if (len > 0 && len < 90) lengths.push(len);
          }
          return lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : null;
        })()
      : null;

    const recentHistory = history.slice(-14);

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
        {recentHistory.length > 1 && (
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <TrendingUp size={20} color="#8B5CF6" />
              <Text style={styles.trendTitle}>Risk Score Trend</Text>
            </View>
            <View style={styles.trendChartRow}>
              {recentHistory.map((snap, idx) => {
                const barHeight = Math.max(4, (snap.riskScore / 100) * 60);
                const barColor = snap.riskLevel === 'elevated' ? '#EF4444' : snap.riskLevel === 'moderate' ? '#F59E0B' : '#10B981';
                return (
                  <View key={snap.date + idx} style={styles.trendBarWrap}>
                    <View style={[styles.trendBar, { height: barHeight, backgroundColor: barColor }]} />
                    <Text style={styles.trendBarLabel}>
                      {new Date(snap.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.trendSubtext}>
              {recentHistory.length} snapshots tracked
            </Text>
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.insightCard}>
            <View style={[styles.insightIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <Clock size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.insightTitle}>Symptom History</Text>
            <Text style={styles.insightDetail}>
              You have {history.length} symptom snapshot{history.length !== 1 ? 's' : ''} recorded.
              {history.length >= 7
                ? ' Enough data to identify patterns over the past weeks.'
                : ' Keep tracking daily for better trend analysis.'}
            </Text>
            {(() => {
              const trackedIds = currentSymptoms.filter(s => s.severity !== 'none').map(s => s.id);
              if (trackedIds.length === 0) return null;
              return (
                <View style={styles.trendSummary}>
                  {trackedIds.slice(0, 3).map(id => {
                    const trend = getSymptomTrend(id, 30);
                    const desc = SYMPTOM_DESCRIPTIONS[id];
                    const latest = trend[trend.length - 1];
                    const earliest = trend[0];
                    const latestVal = latest?.severity === 'severe' ? 3 : latest?.severity === 'moderate' ? 2 : latest?.severity === 'mild' ? 1 : 0;
                    const earliestVal = earliest?.severity === 'severe' ? 3 : earliest?.severity === 'moderate' ? 2 : earliest?.severity === 'mild' ? 1 : 0;
                    const diff = latestVal - earliestVal;
                    const trendLabel = diff > 0 ? 'Worsening' : diff < 0 ? 'Improving' : 'Stable';
                    const trendColor = diff > 0 ? '#EF4444' : diff < 0 ? '#10B981' : '#6B7280';
                    return (
                      <View key={id} style={styles.trendItem}>
                        <Text style={styles.trendItemName}>{desc?.name ?? id}</Text>
                        <Text style={[styles.trendItemStatus, { color: trendColor }]}>{trendLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        )}

        <View style={styles.insightCard}>
          <View style={styles.insightIconWrap}>
            <Activity size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.insightTitle}>Cycle Pattern Analysis</Text>
          {avgCycleLength ? (
            <>
              <Text style={styles.insightValue}>{avgCycleLength} day average</Text>
              <Text style={styles.insightDetail}>
                {avgCycleLength > 35
                  ? 'Your cycles are longer than typical. Cycles over 35 days can be associated with PCOS. Consider discussing with your doctor.'
                  : avgCycleLength < 21
                  ? 'Your cycles are shorter than typical. This could indicate various factors worth discussing with your doctor.'
                  : 'Your cycle length is within the normal range (21-35 days). Regular cycles are a positive indicator.'}
              </Text>
            </>
          ) : (
            <Text style={styles.insightDetail}>Track more cycles to see pattern analysis.</Text>
          )}
        </View>

        <View style={styles.insightCard}>
          <View style={[styles.insightIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <TrendingUp size={24} color="#D97706" />
          </View>
          <Text style={styles.insightTitle}>Hormonal Health Indicators</Text>
          <Text style={styles.insightDetail}>
            PCOS is linked to elevated androgens (male hormones). Common signs include acne, excess hair growth, and hair thinning.
            Track these symptoms above to see how they correlate with your cycle.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={[styles.insightIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Scale size={24} color="#10B981" />
          </View>
          <Text style={styles.insightTitle}>Metabolic Connection</Text>
          <Text style={styles.insightDetail}>
            Up to 70% of people with PCOS have insulin resistance. Managing blood sugar through diet and exercise can significantly improve symptoms.
            Focus on low-glycemic foods and regular physical activity.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={[styles.insightIconWrap, { backgroundColor: '#FCE7F3' }]}>
            <Heart size={24} color="#EC4899" />
          </View>
          <Text style={styles.insightTitle}>Fertility & PCOS</Text>
          <Text style={styles.insightDetail}>
            PCOS is one of the most common causes of infertility, but it's also one of the most treatable.
            Many people with PCOS conceive with lifestyle changes, medication, or assisted reproduction.
          </Text>
        </View>

        <DisclaimerBanner
          type="info"
          message="Insights are based on general PCOS research and your tracked data patterns. Always consult a healthcare provider for personalized medical advice."
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderLearn = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.learnIntro}>
        Knowledge is power. Understanding PCOS helps you make informed decisions about your health and advocate for yourself.
      </Text>

      {PCOS_ARTICLES.map((article) => (
        <TouchableOpacity
          key={article.id}
          style={styles.articleCard}
          onPress={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
          activeOpacity={0.8}
        >
          <View style={styles.articleHeader}>
            <View style={[styles.articleCategoryBadge, { backgroundColor: getCategoryColor(article.category) }]}>
              {getCategoryIcon(article.category)}
              <Text style={styles.articleCategoryText}>{article.category}</Text>
            </View>
            <Text style={styles.articleReadTime}>{article.readTime}</Text>
          </View>
          <Text style={styles.articleTitle}>{article.title}</Text>
          {expandedArticle === article.id ? (
            <>
              <Text style={styles.articleSummary}>{article.summary}</Text>
              <View style={styles.articleFooter}>
                <ChevronUp size={16} color={Colors.subtext} />
                <Text style={styles.articleFooterText}>Collapse</Text>
              </View>
            </>
          ) : (
            <View style={styles.articleFooter}>
              <ChevronDown size={16} color={Colors.primary} />
              <Text style={[styles.articleFooterText, { color: Colors.primary }]}>Read more</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.resourcesCard}>
        <BookOpen size={24} color={Colors.primary} />
        <Text style={styles.resourcesTitle}>Need More Help?</Text>
        <Text style={styles.resourcesText}>
          If you suspect you have PCOS, schedule an appointment with an endocrinologist or gynecologist.
          Bring your cycle tracking data — it can help with diagnosis.
        </Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'PCOS Insights' }} />
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <View style={styles.tabBar}>
          {([
            { key: 'tracker' as const, label: 'Tracker' },
            { key: 'insights' as const, label: 'Insights' },
            { key: 'learn' as const, label: 'Learn' },
          ]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'tracker' && renderTracker()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'learn' && renderLearn()}
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
  tabBar: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  tabItemActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
  },
  tabTextActive: {
    color: Colors.primary,
    fontFamily: fonts.body.semiBold,
  },
  tabContent: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  riskCard: {
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 10px rgba(0,0,0,0.08)' },
    }),
  },
  riskGradient: {
    padding: 20,
    borderRadius: 18,
  },
  riskHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 14,
  },
  riskLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 18,
    fontFamily: fonts.heading.bold,
  },
  riskScoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
  },
  riskScoreValue: {
    fontSize: 22,
    fontFamily: fonts.heading.bold,
  },
  riskBarContainer: {
    marginBottom: 12,
  },
  riskBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  riskBarFill: {
    height: '100%' as const,
    borderRadius: 4,
  },
  factorsList: {
    gap: 6,
  },
  factorItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  factorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  factorText: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
    flex: 1,
  },
  riskEmptyText: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    marginBottom: 14,
  },
  symptomCard: {
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
  symptomHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 10,
  },
  symptomInfo: {
    flex: 1,
  },
  symptomName: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 3,
  },
  symptomDesc: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 17,
  },
  severityRow: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center' as const,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FAFAFA',
  },
  severityText: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  insightIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 17,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 6,
  },
  insightValue: {
    fontSize: 22,
    fontFamily: fonts.heading.bold,
    color: Colors.primary,
    marginBottom: 8,
  },
  insightDetail: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 21,
  },
  learnIntro: {
    fontSize: 15,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: 18,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  articleHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  articleCategoryBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  articleCategoryText: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
  },
  articleReadTime: {
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  articleTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 8,
    lineHeight: 22,
  },
  articleSummary: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 21,
    marginBottom: 10,
  },
  articleFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  articleFooterText: {
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
  },
  resourcesCard: {
    backgroundColor: '#F5F0FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E8DEFF',
    marginTop: 4,
  },
  resourcesTitle: {
    fontSize: 17,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginTop: 10,
    marginBottom: 8,
  },
  resourcesText: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  savedBanner: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedBannerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  savedBannerText: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  savedBannerCount: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: Colors.primary,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  saveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  saveButtonDone: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
  saveButtonTextDone: {
    color: '#10B981',
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  trendHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  trendTitle: {
    fontSize: 17,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  trendChartRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-around' as const,
    minHeight: 80,
    paddingBottom: 4,
  },
  trendBarWrap: {
    alignItems: 'center' as const,
    flex: 1,
    gap: 4,
  },
  trendBar: {
    width: 14,
    borderRadius: 4,
    minHeight: 4,
  },
  trendBarLabel: {
    fontSize: 8,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    textAlign: 'center' as const,
  },
  trendSubtext: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    marginTop: 10,
    textAlign: 'center' as const,
  },
  trendSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  trendItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  trendItemName: {
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: Colors.foreground,
  },
  trendItemStatus: {
    fontSize: 12,
    fontFamily: fonts.body.semiBold,
  },
});
