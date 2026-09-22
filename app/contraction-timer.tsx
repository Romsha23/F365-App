import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Timer, Play, Square, AlertTriangle, Trash2 } from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import { Contraction, ContractionTimer as ContractionTimerType } from '../types/pregnancy';

export default function ContractionTimerScreen() {
  const { contractionTimers, addContractionTimer, addContractionToTimer } = usePregnancyStore();
  const [activeTimer, setActiveTimer] = useState<ContractionTimerType | null>(null);
  const [isContracting, setIsContracting] = useState(false);
  const [currentContraction, setCurrentContraction] = useState<Contraction | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [restElapsed, setRestElapsed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isContracting) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else if (activeTimer && !isContracting) {
      timerRef.current = setInterval(() => {
        setRestElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isContracting, activeTimer]);

  useEffect(() => {
    if (isContracting) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isContracting, pulseAnim]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleStartSession = useCallback(() => {
    const timer: ContractionTimerType = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      contractions: [],
    };
    addContractionTimer(timer);
    setActiveTimer(timer);
    setRestElapsed(0);
    console.log('[ContractionTimer] Session started:', timer.id);
  }, [addContractionTimer]);

  const handleStartContraction = useCallback(() => {
    if (!activeTimer) return;
    const contraction: Contraction = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      intensity: 'mild',
    };
    setCurrentContraction(contraction);
    setIsContracting(true);
    setElapsed(0);
    console.log('[ContractionTimer] Contraction started');
  }, [activeTimer]);

  const handleEndContraction = useCallback((intensity: 'mild' | 'moderate' | 'strong') => {
    if (!activeTimer || !currentContraction) return;
    const endTime = new Date().toISOString();
    const completed: Contraction = {
      ...currentContraction,
      endTime,
      duration: elapsed,
      intensity,
    };
    addContractionToTimer(activeTimer.id, completed);
    setActiveTimer(prev => prev ? { ...prev, contractions: [...prev.contractions, completed] } : null);
    setIsContracting(false);
    setCurrentContraction(null);
    setRestElapsed(0);
    console.log('[ContractionTimer] Contraction ended, duration:', elapsed, 'intensity:', intensity);
  }, [activeTimer, currentContraction, elapsed, addContractionToTimer]);

  const handleEndSession = useCallback(() => {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () => {
          setActiveTimer(null);
          setIsContracting(false);
          setCurrentContraction(null);
          setElapsed(0);
          setRestElapsed(0);
          console.log('[ContractionTimer] Session ended');
        },
      },
    ]);
  }, []);

  const getAvgDuration = useCallback((contractions: Contraction[]) => {
    const withDuration = contractions.filter(c => c.duration);
    if (withDuration.length === 0) return 0;
    return Math.round(withDuration.reduce((s, c) => s + (c.duration || 0), 0) / withDuration.length);
  }, []);

  const getAvgInterval = useCallback((contractions: Contraction[]) => {
    if (contractions.length < 2) return 0;
    let totalInterval = 0;
    for (let i = 1; i < contractions.length; i++) {
      const prev = new Date(contractions[i - 1].startTime).getTime();
      const curr = new Date(contractions[i].startTime).getTime();
      totalInterval += (curr - prev) / 1000;
    }
    return Math.round(totalInterval / (contractions.length - 1));
  }, []);

  const is511 = useCallback((contractions: Contraction[]) => {
    if (contractions.length < 3) return false;
    const recent = contractions.slice(-3);
    const avgDur = getAvgDuration(recent);
    const avgInt = getAvgInterval(recent);
    return avgInt <= 300 && avgDur >= 60;
  }, [getAvgDuration, getAvgInterval]);

  const recentTimers = contractionTimers
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const currentContractions = activeTimer?.contractions ?? [];
  const showAlert = activeTimer && is511(currentContractions);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Contraction Timer' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showAlert && (
          <View style={styles.alertCard}>
            <AlertTriangle size={20} color="#DC2626" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>5-1-1 Pattern Detected</Text>
              <Text style={styles.alertText}>
                Contractions are 5 min apart, lasting 1 min, for 1+ hour. Contact your healthcare provider or head to the hospital.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>When to Go to Hospital</Text>
          <Text style={styles.infoText}>
            The 5-1-1 rule: contractions every 5 minutes, lasting 1 minute each, for at least 1 hour. Call your provider when this pattern starts.
          </Text>
        </View>

        {!activeTimer ? (
          <View style={styles.startArea}>
            <TouchableOpacity style={styles.startButton} onPress={handleStartSession} testID="start-session">
              <Timer size={32} color={Colors.white} />
              <Text style={styles.startButtonText}>Start Timing</Text>
              <Text style={styles.startButtonSub}>Begin a new contraction session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeArea}>
            {currentContractions.length > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{currentContractions.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatTime(getAvgDuration(currentContractions))}</Text>
                  <Text style={styles.statLabel}>Avg Duration</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatTime(getAvgInterval(currentContractions))}</Text>
                  <Text style={styles.statLabel}>Avg Interval</Text>
                </View>
              </View>
            )}

            {!isContracting ? (
              <View style={styles.timerArea}>
                {currentContractions.length > 0 && (
                  <View style={styles.restTimer}>
                    <Text style={styles.restLabel}>Rest Period</Text>
                    <Text style={styles.restTime}>{formatTime(restElapsed)}</Text>
                  </View>
                )}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={styles.contractionButton}
                    onPress={handleStartContraction}
                    testID="start-contraction"
                  >
                    <Play size={36} color={Colors.white} />
                    <Text style={styles.contractionButtonText}>Contraction Starting</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : (
              <View style={styles.timerArea}>
                <Animated.View style={[styles.activeTimerCircle, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.activeTimerTime}>{formatTime(elapsed)}</Text>
                  <Text style={styles.activeTimerLabel}>Contracting...</Text>
                </Animated.View>

                <Text style={styles.intensityPrompt}>How intense?</Text>
                <View style={styles.intensityRow}>
                  {(['mild', 'moderate', 'strong'] as const).map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.intensityButton, styles[`intensity_${level}` as keyof typeof styles] as any]}
                      onPress={() => handleEndContraction(level)}
                      testID={`end-${level}`}
                    >
                      <Square size={14} color={Colors.white} />
                      <Text style={styles.intensityText}>{level}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {currentContractions.length > 0 && (
              <View style={styles.contractionList}>
                <Text style={styles.listTitle}>This Session</Text>
                {[...currentContractions].reverse().map((c, i) => (
                  <View key={c.id} style={styles.contractionRow}>
                    <View style={[styles.intensityDot, {
                      backgroundColor: c.intensity === 'strong' ? '#DC2626' : c.intensity === 'moderate' ? '#F59E0B' : '#10B981'
                    }]} />
                    <Text style={styles.contractionNum}>#{currentContractions.length - i}</Text>
                    <Text style={styles.contractionDuration}>
                      {c.duration ? formatTime(c.duration) : '--'}
                    </Text>
                    <Text style={styles.contractionIntensity}>{c.intensity}</Text>
                    <Text style={styles.contractionTime}>
                      {new Date(c.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.endSessionButton} onPress={handleEndSession}>
              <Trash2 size={16} color={Colors.error} />
              <Text style={styles.endSessionText}>End Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {!activeTimer && recentTimers.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Past Sessions</Text>
            {recentTimers.map(timer => (
              <View key={timer.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {new Date(timer.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.historyCount}>{timer.contractions.length} contractions</Text>
                </View>
                {timer.contractions.length > 0 && (
                  <View style={styles.historyStats}>
                    <Text style={styles.historyStat}>Avg: {formatTime(getAvgDuration(timer.contractions))}</Text>
                    <Text style={styles.historyStat}>Interval: {formatTime(getAvgInterval(timer.contractions))}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
    paddingBottom: 40,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#DC2626',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#5B21B6',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#5B21B6',
    lineHeight: 19,
  },
  startArea: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  startButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 8,
  },
  startButtonSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  activeArea: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timerArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  restTimer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  restLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  restTime: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  contractionButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  contractionButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 8,
  },
  activeTimerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  activeTimerTime: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  activeTimerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  intensityPrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  intensity_mild: {
    backgroundColor: '#10B981',
  },
  intensity_moderate: {
    backgroundColor: '#F59E0B',
  },
  intensity_strong: {
    backgroundColor: '#DC2626',
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    textTransform: 'capitalize' as const,
  },
  contractionList: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  contractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contractionNum: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    width: 30,
  },
  contractionDuration: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  contractionIntensity: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
  },
  contractionTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  endSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  endSessionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  historyCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  historyStats: {
    flexDirection: 'row',
    gap: 16,
  },
  historyStat: {
    fontSize: 12,
    color: Colors.textLight,
  },
});
