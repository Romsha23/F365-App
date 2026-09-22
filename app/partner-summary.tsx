import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { Eye, Shield, Calendar, Activity, HeartPulse, AlertTriangle, RefreshCw, Lightbulb, Zap, Heart, ChevronRight } from 'lucide-react-native';
import Colors from '../constants/colors';
import { Button } from '../components/Button';
import { usePartnerSharingStore } from '../store/partner-sharing-store';
import { generatePartnerInsights, getEnergyLabel, getEnergyColor, PartnerInsight } from '../utils/partner-insights';

function EnergyBar({ energy }: { energy: PartnerInsight['energy'] }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const levels = { low: 0.25, moderate: 0.5, high: 0.75, peak: 1.0 };

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: levels[energy],
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [energy]);

  const color = getEnergyColor(energy);

  return (
    <View style={energyStyles.container}>
      <View style={energyStyles.labelRow}>
        <Zap size={12} color={color} />
        <Text style={[energyStyles.label, { color }]}>{getEnergyLabel(energy)}</Text>
      </View>
      <View style={energyStyles.track}>
        <Animated.View
          style={[
            energyStyles.fill,
            {
              backgroundColor: color,
              width: fillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const energyStyles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.muted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

function InsightCard({ insight, index }: { insight: PartnerInsight; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        insightStyles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: insight.color,
        },
      ]}
    >
      <View style={insightStyles.cardHeader}>
        <Text style={insightStyles.emoji}>{insight.emoji}</Text>
        <View style={insightStyles.cardHeaderText}>
          <Text style={insightStyles.cardTitle}>{insight.title}</Text>
          <Text style={[insightStyles.phaseTag, { backgroundColor: insight.color + '22', color: insight.color }]}>
            {insight.phase}
          </Text>
        </View>
      </View>

      <Text style={insightStyles.message}>{insight.message}</Text>

      <View style={insightStyles.tipContainer}>
        <View style={insightStyles.tipIcon}>
          <Heart size={13} color={Colors.accent} />
        </View>
        <Text style={insightStyles.tipText}>{insight.supportTip}</Text>
      </View>

      <EnergyBar energy={insight.energy} />
    </Animated.View>
  );
}

const insightStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  phaseTag: {
    fontSize: 10,
    fontWeight: '600' as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: 'hidden',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 10,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accent + '0F',
    borderRadius: 10,
    padding: 10,
  },
  tipIcon: {
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accent,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
});

export default function PartnerSummaryScreen() {
  const {
    invite,
    permissions,
    sharedSnapshot,
    markPartnerViewed,
    clearPartnerData,
    syncFromServer,
  } = usePartnerSharingStore();

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  useEffect(() => {
    markPartnerViewed();
  }, [markPartnerViewed]);

  useEffect(() => {
    if (invite?.status === 'revoked') {
      clearPartnerData();
    }
  }, [invite?.status, clearPartnerData]);

  const partnerInsights = useMemo(() => {
    return generatePartnerInsights(sharedSnapshot ?? null);
  }, [sharedSnapshot]);

  const summaryItems = useMemo(() => {
    if (!sharedSnapshot) {
      return [];
    }

    const items: { title: string; value: string; icon: React.ReactNode }[] = [];

    if (permissions.mood && sharedSnapshot.latestMood) {
      items.push({
        title: 'Latest Mood',
        value: sharedSnapshot.latestMood,
        icon: <HeartPulse size={18} color={Colors.accent} />,
      });
    }

    if (permissions.symptoms && sharedSnapshot.latestSymptoms?.length) {
      items.push({
        title: 'Recent Symptoms',
        value: sharedSnapshot.latestSymptoms.join(', '),
        icon: <Activity size={18} color={Colors.primary} />,
      });
    }

    if (permissions.cycle_predictions && sharedSnapshot.cyclePredictions?.nextPeriodDate) {
      const nextPeriod = new Date(sharedSnapshot.cyclePredictions.nextPeriodDate).toDateString();
      items.push({
        title: 'Next Period',
        value: nextPeriod,
        icon: <Calendar size={18} color={Colors.gold} />,
      });
    }

    if (permissions.pregnancy_milestones && sharedSnapshot.pregnancySummary?.currentWeek) {
      items.push({
        title: 'Pregnancy Week',
        value: `Week ${sharedSnapshot.pregnancySummary.currentWeek}`,
        icon: <Shield size={18} color={Colors.success} />,
      });
    }

    if (permissions.appointments && typeof sharedSnapshot.appointmentsCount === 'number') {
      items.push({
        title: 'Appointments',
        value: `${sharedSnapshot.appointmentsCount} upcoming`,
        icon: <Calendar size={18} color={Colors.accent} />,
      });
    }

    return items;
  }, [permissions, sharedSnapshot]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Partner Summary' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Eye size={22} color={Colors.primary} />
            <Text style={styles.headerTitle}>Shared Summary</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Read-only overview shared by your partner.
          </Text>
          <Text style={styles.headerTimestamp}>
            {sharedSnapshot?.lastUpdated
              ? `Updated ${new Date(sharedSnapshot.lastUpdated).toLocaleString()}`
              : 'Awaiting shared data'}
          </Text>
        </View>

        {invite?.status === 'revoked' && (
          <View style={styles.alertCard}>
            <AlertTriangle size={18} color={Colors.warning} />
            <Text style={styles.alertText}>Access revoked. Shared data has been cleared.</Text>
          </View>
        )}

        {partnerInsights.length > 0 && (
          <View style={styles.insightsSection}>
            <View style={styles.insightsSectionHeader}>
              <View style={styles.insightsTitleRow}>
                <Lightbulb size={18} color={Colors.gold} />
                <Text style={styles.insightsSectionTitle}>Partner AI Insights</Text>
              </View>
              <Text style={styles.insightsSectionSubtitle}>
                Contextual support suggestions based on shared data
              </Text>
            </View>
            {partnerInsights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </View>
        )}

        {summaryItems.length === 0 && partnerInsights.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No shared data available yet.</Text>
          </View>
        ) : (
          <>
            {summaryItems.length > 0 && (
              <View style={styles.dataSection}>
                <Text style={styles.dataSectionTitle}>Shared Data</Text>
                {summaryItems.map((item) => (
                  <View key={item.title} style={styles.summaryCard}>
                    <View style={styles.summaryIcon}>{item.icon}</View>
                    <View style={styles.summaryText}>
                      <Text style={styles.summaryTitle}>{item.title}</Text>
                      <Text style={styles.summaryValue}>{item.value}</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textLight} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Data Controls</Text>
            <TouchableOpacity onPress={markPartnerViewed} testID="partner-summary-refresh">
              <RefreshCw size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Private notes, AI chat, and sexual activity logs are never shared.
          </Text>
          <Button
            title="Clear Shared Data"
            variant="outline"
            onPress={clearPartnerData}
            testID="partner-summary-clear"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  headerTimestamp: {
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '22',
    marginBottom: 16,
  },
  alertText: {
    color: Colors.text,
    fontSize: 13,
    flex: 1,
  },
  insightsSection: {
    marginBottom: 16,
  },
  insightsSectionHeader: {
    marginBottom: 12,
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  insightsSectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  insightsSectionSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 26,
  },
  dataSection: {
    marginBottom: 16,
  },
  dataSectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.muted,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  summaryValue: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
});
