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
import { Heart, Play, Square, Clock, TrendingUp } from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import { KickCountSession } from '../types/pregnancy';

export default function KickCounterScreen() {
  const { kickCountSessions, addKickCountSession, updateKickCountSession } = usePregnancyStore();
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<KickCountSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const kickAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleStart = useCallback(() => {
    const session: KickCountSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      kickCount: 0,
    };
    setCurrentSession(session);
    setIsActive(true);
    setElapsed(0);
    addKickCountSession(session);
    console.log('[KickCounter] Session started:', session.id);
  }, [addKickCountSession]);

  const handleStop = useCallback(() => {
    if (!currentSession) return;
    setIsActive(false);
    const updated = {
      endTime: new Date().toISOString(),
      duration: elapsed,
    };
    updateKickCountSession(currentSession.id, updated);
    console.log('[KickCounter] Session ended:', currentSession.id, 'Kicks:', currentSession.kickCount);
    setCurrentSession(null);
    setElapsed(0);
  }, [currentSession, elapsed, updateKickCountSession]);

  const handleKick = useCallback(() => {
    if (!currentSession || !isActive) return;

    const newCount = currentSession.kickCount + 1;
    const updatedSession = { ...currentSession, kickCount: newCount };
    setCurrentSession(updatedSession);
    updateKickCountSession(currentSession.id, { kickCount: newCount });

    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(kickAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(kickAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    if (newCount === 10) {
      Alert.alert(
        '10 Kicks Reached!',
        `Great job! Baby reached 10 kicks in ${formatTime(elapsed)}. Most healthy babies reach 10 kicks within 2 hours.`,
        [{ text: 'Continue', style: 'default' }, { text: 'Stop Session', onPress: handleStop }]
      );
    }

    console.log('[KickCounter] Kick #', newCount);
  }, [currentSession, isActive, pulseAnim, kickAnim, elapsed, formatTime, handleStop, updateKickCountSession]);

  const recentSessions = kickCountSessions
    .slice()
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10);

  const avgKicksPerSession = recentSessions.length > 0
    ? Math.round(recentSessions.reduce((sum, s) => sum + s.kickCount, 0) / recentSessions.length)
    : 0;

  const kickOpacity = kickAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Kick Counter' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Why Count Kicks?</Text>
          <Text style={styles.infoText}>
            From week 28, counting baby's movements daily helps monitor wellbeing. Most babies reach 10 movements within 2 hours. Track at the same time daily.
          </Text>
        </View>

        <View style={styles.counterArea}>
          {isActive && (
            <View style={styles.timerRow}>
              <Clock size={16} color={Colors.textMuted} />
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            </View>
          )}

          <Animated.View style={[styles.kickButton, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={[styles.kickButtonInner, !isActive && styles.kickButtonDisabled]}
              onPress={isActive ? handleKick : handleStart}
              activeOpacity={0.7}
              testID="kick-button"
            >
              {isActive ? (
                <>
                  <Heart size={48} color={Colors.white} fill={Colors.white} />
                  <Text style={styles.kickCount}>{currentSession?.kickCount ?? 0}</Text>
                  <Text style={styles.kickLabel}>Tap for each kick</Text>
                </>
              ) : (
                <>
                  <Play size={40} color={Colors.white} />
                  <Text style={styles.kickLabel}>Start Session</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.kickFeedback, { opacity: kickOpacity }]}>
            <Text style={styles.kickFeedbackText}>+1 kick!</Text>
          </Animated.View>

          {isActive && (
            <TouchableOpacity style={styles.stopButton} onPress={handleStop} testID="stop-button">
              <Square size={18} color={Colors.error} />
              <Text style={styles.stopButtonText}>End Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentSessions.length > 0 && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <TrendingUp size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{avgKicksPerSession}</Text>
                <Text style={styles.statLabel}>Avg Kicks</Text>
              </View>
              <View style={styles.statCard}>
                <Heart size={20} color="#EC4899" />
                <Text style={styles.statValue}>{recentSessions.length}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>

            <Text style={styles.historyTitle}>Recent Sessions</Text>
            {recentSessions.map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionDate}>
                    {new Date(session.startTime).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {new Date(session.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.sessionStats}>
                  <View style={styles.sessionStat}>
                    <Heart size={14} color="#EC4899" />
                    <Text style={styles.sessionStatText}>{session.kickCount} kicks</Text>
                  </View>
                  {session.duration !== undefined && (
                    <View style={styles.sessionStat}>
                      <Clock size={14} color={Colors.textMuted} />
                      <Text style={styles.sessionStatText}>{formatTime(session.duration)}</Text>
                    </View>
                  )}
                </View>
                {session.kickCount >= 10 && (
                  <View style={styles.goalBadge}>
                    <Text style={styles.goalBadgeText}>Goal reached!</Text>
                  </View>
                )}
              </View>
            ))}
          </>
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
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#92400E',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
  },
  counterArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  kickButton: {
    marginBottom: 12,
  },
  kickButtonInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  kickButtonDisabled: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  kickCount: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: Colors.white,
    marginTop: 4,
  },
  kickLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  kickFeedback: {
    position: 'absolute',
    top: 10,
    right: 60,
  },
  kickFeedbackText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#EC4899',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.error,
    marginTop: 12,
  },
  stopButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sessionTime: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionStatText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  goalBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#065F46',
  },
});
