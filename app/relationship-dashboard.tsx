import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  AlertTriangle,
  Zap,
  Heart,
  Shield,
  Sun,
  Moon,
  CloudRain,
  Flame,
  Wind,
  BookOpen,
  ChevronRight,
  BarChart3,
  Sparkles,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePartnerSharingStore } from '../store/partner-sharing-store';
import { useCycleStore } from '../store/cycle-store';

const { width: _SCREEN_WIDTH } = Dimensions.get('window');

type ConflictRisk = 'low' | 'moderate' | 'high' | 'very_high';
type EnergyLevel = 'low' | 'moderate' | 'high' | 'peak';

interface DayForecast {
  day: string;
  date: string;
  conflictRisk: ConflictRisk;
  energy: EnergyLevel;
  libidoConfidence: number;
  stressLevel: number;
  mood: string;
  tip: string;
}

function getConflictRiskColor(risk: ConflictRisk): string {
  switch (risk) {
    case 'low': return Colors.success;
    case 'moderate': return Colors.gold;
    case 'high': return Colors.error;
    case 'very_high': return '#E05555';
  }
}

function getConflictRiskLabel(risk: ConflictRisk): string {
  switch (risk) {
    case 'low': return 'Low';
    case 'moderate': return 'Med';
    case 'high': return 'High';
    case 'very_high': return 'V.High';
  }
}

function getEnergyColor(energy: EnergyLevel): string {
  switch (energy) {
    case 'low': return Colors.secondary;
    case 'moderate': return Colors.primary;
    case 'high': return Colors.accent;
    case 'peak': return Colors.gold;
  }
}

function getEnergyIcon(energy: EnergyLevel): React.ReactNode {
  switch (energy) {
    case 'low': return <Moon size={14} color={Colors.secondary} />;
    case 'moderate': return <Wind size={14} color={Colors.primary} />;
    case 'high': return <Sun size={14} color={Colors.accent} />;
    case 'peak': return <Flame size={14} color={Colors.gold} />;
  }
}

function computeWeekForecast(
  nextPeriodDate: string | undefined,
  fertileStart: string | undefined,
  fertileEnd: string | undefined,
  latestMood: string | undefined
): DayForecast[] {
  const today = new Date();
  const forecasts: DayForecast[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextPeriod = nextPeriodDate ? new Date(nextPeriodDate) : null;
  const fStart = fertileStart ? new Date(fertileStart) : null;
  const fEnd = fertileEnd ? new Date(fertileEnd) : null;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

    let daysUntilPeriod = nextPeriod
      ? Math.ceil((nextPeriod.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      : 14;

    const inFertile = fStart && fEnd && d >= fStart && d <= fEnd;
    const inPMS = daysUntilPeriod >= 0 && daysUntilPeriod <= 5;
    const onPeriod = daysUntilPeriod <= 0 && daysUntilPeriod >= -7;
    const inFollicular = daysUntilPeriod > 14;

    let conflictRisk: ConflictRisk = 'low';
    let energy: EnergyLevel = 'moderate';
    let libidoConfidence = 50;
    let stressLevel = 30;
    let mood = 'Stable';
    let tip = 'A good day for connection.';

    if (onPeriod) {
      conflictRisk = 'moderate';
      energy = 'low';
      libidoConfidence = 20;
      stressLevel = 55;
      mood = 'Sensitive';
      tip = 'Comfort and rest. Avoid big decisions.';
    } else if (inPMS) {
      conflictRisk = daysUntilPeriod <= 2 ? 'very_high' : 'high';
      energy = 'low';
      libidoConfidence = 25;
      stressLevel = 70;
      mood = 'Irritable';
      tip = 'Reduce conflict triggers. Be patient.';
    } else if (inFertile) {
      conflictRisk = 'low';
      energy = 'peak';
      libidoConfidence = 85;
      stressLevel = 15;
      mood = 'Confident';
      tip = 'Peak energy window. Great for plans.';
    } else if (inFollicular) {
      conflictRisk = 'low';
      energy = 'high';
      libidoConfidence = 65;
      stressLevel = 20;
      mood = 'Energetic';
      tip = 'Motivation rising. Support her goals.';
    } else {
      conflictRisk = 'moderate';
      energy = 'moderate';
      libidoConfidence = 45;
      stressLevel = 40;
      mood = 'Winding Down';
      tip = 'Gentle pace. Lighter expectations.';
    }

    if (i === 0 && latestMood) {
      const lm = latestMood.toLowerCase();
      if (lm === 'stressed' || lm === 'anxious' || lm === 'irritable') {
        stressLevel = Math.min(stressLevel + 20, 95);
        conflictRisk = conflictRisk === 'low' ? 'moderate' : conflictRisk === 'moderate' ? 'high' : conflictRisk;
      }
      if (lm === 'happy' || lm === 'energetic') {
        stressLevel = Math.max(stressLevel - 15, 5);
        if (conflictRisk === 'high') conflictRisk = 'moderate';
      }
    }

    forecasts.push({
      day: i === 0 ? 'Today' : dayName,
      date: dateStr,
      conflictRisk,
      energy,
      libidoConfidence,
      stressLevel,
      mood,
      tip,
    });
  }

  return forecasts;
}

function AnimatedBar({
  value,
  maxValue,
  color,
  index,
  label,
}: {
  value: number;
  maxValue: number;
  color: string;
  index: number;
  label: string;
}) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: (value / maxValue) * 100,
      duration: 600,
      delay: index * 80,
      useNativeDriver: false,
    }).start();
  }, [value, maxValue, index, heightAnim]);

  return (
    <View style={barStyles.column}>
      <View style={barStyles.barTrack}>
        <Animated.View
          style={[
            barStyles.barFill,
            {
              backgroundColor: color,
              height: heightAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={barStyles.label}>{label}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  column: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 22,
    height: 80,
    borderRadius: 11,
    backgroundColor: Colors.muted,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
  },
  label: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 6,
    fontWeight: '600' as const,
  },
});

function ConflictRiskRow({ forecasts }: { forecasts: DayForecast[] }) {
  return (
    <View style={sectionStyles.card}>
      <View style={sectionStyles.cardHeader}>
        <AlertTriangle size={18} color={Colors.error} />
        <Text style={sectionStyles.cardTitle}>Conflict Risk Days</Text>
      </View>
      <Text style={sectionStyles.cardSubtitle}>
        Based on hormonal phase and mood data
      </Text>
      <View style={sectionStyles.riskRow}>
        {forecasts.map((f, i) => {
          const color = getConflictRiskColor(f.conflictRisk);
          return (
            <View key={i} style={sectionStyles.riskDay}>
              <View style={[sectionStyles.riskDot, { backgroundColor: color }]} />
              <Text style={sectionStyles.riskDayLabel}>{f.day}</Text>
              <Text style={[sectionStyles.riskLevel, { color }]}>
                {getConflictRiskLabel(f.conflictRisk)}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={sectionStyles.legendRow}>
        {(['low', 'moderate', 'high', 'very_high'] as ConflictRisk[]).map((r) => (
          <View key={r} style={sectionStyles.legendItem}>
            <View style={[sectionStyles.legendDot, { backgroundColor: getConflictRiskColor(r) }]} />
            <Text style={sectionStyles.legendText}>{getConflictRiskLabel(r)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EnergyTrendGraph({ forecasts }: { forecasts: DayForecast[] }) {
  const energyValues = { low: 25, moderate: 50, high: 75, peak: 100 };

  return (
    <View style={sectionStyles.card}>
      <View style={sectionStyles.cardHeader}>
        <Zap size={18} color={Colors.gold} />
        <Text style={sectionStyles.cardTitle}>Energy Trend</Text>
      </View>
      <Text style={sectionStyles.cardSubtitle}>
        Projected energy levels for the next 7 days
      </Text>
      <View style={sectionStyles.graphContainer}>
        {forecasts.map((f, i) => (
          <AnimatedBar
            key={i}
            value={energyValues[f.energy]}
            maxValue={100}
            color={getEnergyColor(f.energy)}
            index={i}
            label={f.day}
          />
        ))}
      </View>
      <View style={sectionStyles.energyLabels}>
        {(['low', 'moderate', 'high', 'peak'] as EnergyLevel[]).map((e) => (
          <View key={e} style={sectionStyles.energyLabelItem}>
            {getEnergyIcon(e)}
            <Text style={[sectionStyles.energyLabelText, { color: getEnergyColor(e) }]}>
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LibidoConfidenceGraph({ forecasts }: { forecasts: DayForecast[] }) {
  return (
    <View style={sectionStyles.card}>
      <View style={sectionStyles.cardHeader}>
        <Heart size={18} color={Colors.error} />
        <Text style={sectionStyles.cardTitle}>Intimacy Confidence</Text>
      </View>
      <Text style={sectionStyles.cardSubtitle}>
        Estimated desire confidence based on cycle phase
      </Text>
      <View style={sectionStyles.graphContainer}>
        {forecasts.map((f, i) => {
          const color =
            f.libidoConfidence >= 70
              ? Colors.error
              : f.libidoConfidence >= 45
              ? Colors.primary
              : Colors.secondary;
          return (
            <AnimatedBar
              key={i}
              value={f.libidoConfidence}
              maxValue={100}
              color={color}
              index={i}
              label={f.day}
            />
          );
        })}
      </View>
      <View style={sectionStyles.confidenceFooter}>
        <Text style={sectionStyles.confidenceHint}>
          Higher confidence = more likely receptive to intimacy
        </Text>
      </View>
    </View>
  );
}

function StressSyncView({ forecasts }: { forecasts: DayForecast[] }) {
  return (
    <View style={sectionStyles.card}>
      <View style={sectionStyles.cardHeader}>
        <CloudRain size={18} color={Colors.secondary} />
        <Text style={sectionStyles.cardTitle}>Stress Sync</Text>
      </View>
      <Text style={sectionStyles.cardSubtitle}>
        Predicted stress levels — plan support accordingly
      </Text>
      <View style={sectionStyles.graphContainer}>
        {forecasts.map((f, i) => {
          const color =
            f.stressLevel >= 60
              ? Colors.error
              : f.stressLevel >= 35
              ? Colors.gold
              : Colors.accent;
          return (
            <AnimatedBar
              key={i}
              value={f.stressLevel}
              maxValue={100}
              color={color}
              index={i}
              label={f.day}
            />
          );
        })}
      </View>
      <View style={sectionStyles.stressLegend}>
        <View style={sectionStyles.stressLegendItem}>
          <View style={[sectionStyles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={sectionStyles.legendText}>Calm</Text>
        </View>
        <View style={sectionStyles.stressLegendItem}>
          <View style={[sectionStyles.legendDot, { backgroundColor: Colors.gold }]} />
          <Text style={sectionStyles.legendText}>Moderate</Text>
        </View>
        <View style={sectionStyles.stressLegendItem}>
          <View style={[sectionStyles.legendDot, { backgroundColor: Colors.error }]} />
          <Text style={sectionStyles.legendText}>High</Text>
        </View>
      </View>
    </View>
  );
}

function DailyTipCard({ forecast }: { forecast: DayForecast }) {
  const riskColor = getConflictRiskColor(forecast.conflictRisk);

  return (
    <View style={[sectionStyles.tipCard, { borderLeftColor: riskColor }]}>
      <View style={sectionStyles.tipHeader}>
        <Sparkles size={16} color={Colors.gold} />
        <Text style={sectionStyles.tipTitle}>Today's Relationship Tip</Text>
      </View>
      <View style={sectionStyles.tipMoodRow}>
        <Text style={sectionStyles.tipMoodLabel}>Mood:</Text>
        <Text style={sectionStyles.tipMoodValue}>{forecast.mood}</Text>
        <Text style={sectionStyles.tipSeparator}>·</Text>
        <Text style={sectionStyles.tipMoodLabel}>Risk:</Text>
        <Text style={[sectionStyles.tipMoodValue, { color: riskColor }]}>
          {getConflictRiskLabel(forecast.conflictRisk)}
        </Text>
      </View>
      <Text style={sectionStyles.tipBody}>{forecast.tip}</Text>
    </View>
  );
}

export default function RelationshipDashboardScreen() {
  const { sharedSnapshot, isViewer, syncFromServer } = usePartnerSharingStore();
  const { predictions } = useCycleStore();

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  const forecasts = useMemo(() => {
    const basePredictions = isViewer ? sharedSnapshot?.cyclePredictions : predictions;
    const nextPeriod = basePredictions?.nextPeriodDate;
    const fertileStart = basePredictions?.fertileWindowStart;
    const fertileEnd = basePredictions?.fertileWindowEnd;
    const mood = isViewer ? sharedSnapshot?.latestMood : undefined;

    return computeWeekForecast(nextPeriod, fertileStart, fertileEnd, mood);
  }, [sharedSnapshot, predictions, isViewer]);

  const todayForecast = forecasts[0];

  const navigateToEducation = useCallback(() => {
    router.push('/partner-education' as any);
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Relationship Dashboard' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <BarChart3 size={22} color={Colors.accent} />
            <Text style={styles.headerTitle}>Relationship Dashboard</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            7-day forecast based on cycle phase, mood, and hormonal patterns
          </Text>
        </View>

        {isViewer && !sharedSnapshot && (
          <View style={styles.emptyState} testID="partner-dashboard-empty">
            <Text style={styles.emptyTitle}>Awaiting shared data</Text>
            <Text style={styles.emptySubtitle}>
              Your partner hasn’t shared cycle insights yet. Ask them to enable sharing so you can view the dashboard.
            </Text>
          </View>
        )}

        {todayForecast && <DailyTipCard forecast={todayForecast} />}

        <ConflictRiskRow forecasts={forecasts} />

        <EnergyTrendGraph forecasts={forecasts} />

        <LibidoConfidenceGraph forecasts={forecasts} />

        <StressSyncView forecasts={forecasts} />

        <TouchableOpacity
          style={styles.educationLink}
          onPress={navigateToEducation}
          activeOpacity={0.7}
          testID="education-link"
        >
          <View style={styles.educationLinkLeft}>
            <BookOpen size={20} color={Colors.gold} />
            <View style={styles.educationLinkText}>
              <Text style={styles.educationLinkTitle}>Partner Education</Text>
              <Text style={styles.educationLinkSub}>
                Learn about PMS, hormones, libido patterns & more
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textLight} />
        </TouchableOpacity>

        <View style={styles.disclaimerCard}>
          <Shield size={14} color={Colors.textLight} />
          <Text style={styles.disclaimerText}>
            Forecasts are estimates based on cycle data and general patterns. Individual experiences vary. This is not medical advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 16,
    marginLeft: 26,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  riskDay: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  riskDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 6,
  },
  riskDayLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  riskLevel: {
    fontSize: 8,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.1,
    textAlign: 'center' as const,
    maxWidth: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textLight,
  },
  graphContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  energyLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  energyLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  energyLabelText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  confidenceFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confidenceHint: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  stressLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stressLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 14,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tipMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tipMoodLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  tipMoodValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  tipSeparator: {
    color: Colors.textLight,
    fontSize: 12,
  },
  tipBody: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  educationLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  educationLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  educationLinkText: {
    flex: 1,
  },
  educationLinkTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.foreground,
    marginBottom: 2,
  },
  educationLinkSub: {
    fontSize: 12,
    color: Colors.textLight,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 17,
  },
});
