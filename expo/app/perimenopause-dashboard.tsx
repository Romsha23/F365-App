import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Flame,
  BookOpen,
  ChevronRight,
  Plus,
  ArrowLeft,
  Calendar,
  Heart,
  Brain,
  Activity,
  Thermometer,
  AlertTriangle,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePerimenopauseStore } from '../store/perimenopause-store';
import { Button } from '../components/Button';
import DatePickerModal from '../components/DatePickerModal';
import {
  PerimenopauseDayLog,
  PerimenopauseSymptom,
  PerimenopauseMood,
  HotFlashIntensity,
  PerimenopauseProfile,
  PERIMENOPAUSE_SYMPTOM_OPTIONS,
} from '../types/perimenopause';

const MOOD_OPTIONS: { id: PerimenopauseMood; emoji: string; label: string }[] = [
  { id: 'great', emoji: '🤩', label: 'Great' },
  { id: 'good', emoji: '😊', label: 'Good' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'low', emoji: '😔', label: 'Low' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
  { id: 'irritable', emoji: '😤', label: 'Irritable' },
  { id: 'emotional', emoji: '🥺', label: 'Emotional' },
  { id: 'overwhelmed', emoji: '😩', label: 'Overwhelmed' },
];

const SLEEP_QUALITY = [
  { id: 'poor' as const, label: 'Poor', color: '#EF4444' },
  { id: 'fair' as const, label: 'Fair', color: '#F59E0B' },
  { id: 'good' as const, label: 'Good', color: '#10B981' },
  { id: 'excellent' as const, label: 'Excellent', color: '#059669' },
];

export default function PerimenopauseDashboardScreen() {
  const router = useRouter();
  const {
    profile,
    setProfile,
    addDayLog,
    getRecentLogs,
    getSymptomFrequency,
    getDaysSinceLastPeriod,
  } = usePerimenopauseStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showSetup, setShowSetup] = useState(!profile);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [periodPattern, setPeriodPattern] = useState<'regular' | 'irregular' | 'skipping' | 'stopped'>('irregular');

  const [showLog, setShowLog] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<PerimenopauseSymptom[]>([]);
  const [selectedMood, setSelectedMood] = useState<PerimenopauseMood | null>(null);
  const [hotFlashCount, setHotFlashCount] = useState('');
  const [hotFlashIntensity, setHotFlashIntensity] = useState<HotFlashIntensity | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'excellent' | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSetupSave = useCallback(() => {
    const newProfile: PerimenopauseProfile = {
      id: Date.now().toString(),
      userId: 'local',
      lastPeriodDate: lastPeriodDate || undefined,
      periodPattern,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfile(newProfile);
    setShowSetup(false);
    console.log('[Perimenopause] Profile saved:', newProfile);
  }, [lastPeriodDate, periodPattern, setProfile]);

  const handleLogSave = useCallback(() => {
    if (!selectedMood) {
      Alert.alert('Required', 'Please select your mood.');
      return;
    }
    const log: PerimenopauseDayLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      symptoms: selectedSymptoms,
      mood: selectedMood,
      hotFlashCount: hotFlashCount ? parseInt(hotFlashCount) : undefined,
      hotFlashIntensity: hotFlashIntensity ?? undefined,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      sleepQuality: sleepQuality ?? undefined,
      energyLevel: energyLevel ?? undefined,
      notes: notes || undefined,
    };
    addDayLog(log);
    setShowLog(false);
    setSelectedSymptoms([]);
    setSelectedMood(null);
    setHotFlashCount('');
    setHotFlashIntensity(null);
    setSleepHours('');
    setSleepQuality(null);
    setEnergyLevel(null);
    setNotes('');
    Alert.alert('Saved', 'Your daily log has been saved.');
  }, [selectedMood, selectedSymptoms, hotFlashCount, hotFlashIntensity, sleepHours, sleepQuality, energyLevel, notes, addDayLog]);

  const toggleSymptom = useCallback((s: PerimenopauseSymptom) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }, []);

  const recentLogs = getRecentLogs(7);
  const symptomFreq = getSymptomFrequency();
  const daysSinceLastPeriod = getDaysSinceLastPeriod();

  const topSymptoms = Object.entries(symptomFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const hasAnxietyOrDepression = recentLogs.some(l =>
    l.symptoms.includes('anxiety') || l.symptoms.includes('depression')
  );

  const getPhaseDescription = () => {
    if (!daysSinceLastPeriod) return 'Track your symptoms to understand your patterns';
    if (daysSinceLastPeriod < 60) return 'Early perimenopause — cycles may be irregular';
    if (daysSinceLastPeriod < 180) return 'Your cycles are spacing out — this is normal';
    if (daysSinceLastPeriod < 365) return 'Late perimenopause — menopause may be approaching';
    return 'You may have reached menopause (12+ months without a period)';
  };

  if (showSetup) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{
          title: 'Perimenopause Setup',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
              <ArrowLeft size={22} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.setupHeader}>
            <View style={styles.setupIconBg}>
              <Flame size={32} color="#D97706" />
            </View>
            <Text style={styles.setupTitle}>Perimenopause Tracking</Text>
            <Text style={styles.setupSubtitle}>
              Let's set up your profile to provide personalized insights and tracking for this stage of your journey.
            </Text>
          </View>

          <Text style={styles.fieldLabel}>When was your last period? (optional)</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={lastPeriodDate ? Colors.primary : Colors.textLight} />
            <Text style={[styles.datePickerText, !lastPeriodDate && styles.datePickerPlaceholder]}>
              {lastPeriodDate
                ? new Date(lastPeriodDate + 'T00:00:00').toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Tap to select date'}
            </Text>
          </TouchableOpacity>

          <DatePickerModal
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={(date) => setLastPeriodDate(date)}
            selectedDate={lastPeriodDate || undefined}
            title="Last Period Date"
            maxDate={new Date().toISOString().split('T')[0]}
          />

          <Text style={styles.fieldLabel}>How would you describe your periods?</Text>
          <View style={styles.patternRow}>
            {([
              { id: 'regular' as const, label: 'Regular', emoji: '📅' },
              { id: 'irregular' as const, label: 'Irregular', emoji: '🔄' },
              { id: 'skipping' as const, label: 'Skipping', emoji: '⏭️' },
              { id: 'stopped' as const, label: 'Stopped', emoji: '🛑' },
            ]).map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.patternChip, periodPattern === p.id && styles.patternChipActive]}
                onPress={() => setPeriodPattern(p.id)}
              >
                <Text style={styles.patternEmoji}>{p.emoji}</Text>
                <Text style={[styles.patternText, periodPattern === p.id && styles.patternTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Start Tracking" onPress={handleSetupSave} fullWidth style={{ marginTop: 24 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Perimenopause',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Flame size={28} color="#D97706" />
            </View>
            <Text style={styles.heroTitle}>Your Journey</Text>
            <Text style={styles.heroPhase}>{getPhaseDescription()}</Text>
            {daysSinceLastPeriod !== null && (
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNumber}>{daysSinceLastPeriod}</Text>
                <Text style={styles.heroStatLabel}>days since last period</Text>
              </View>
            )}
          </View>

          {hasAnxietyOrDepression && (
            <View style={styles.warningCard}>
              <AlertTriangle size={18} color="#DC2626" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Mental Health Check</Text>
                <Text style={styles.warningText}>
                  You've logged anxiety or low mood recently. Hormonal changes can significantly affect mental health. Consider speaking with your healthcare provider.
                </Text>
              </View>
            </View>
          )}

          {!showLog ? (
            <TouchableOpacity style={styles.logButton} onPress={() => setShowLog(true)} testID="add-log">
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.logButtonText}>Log Today's Symptoms</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.logForm}>
              <Text style={styles.sectionTitle}>How are you feeling?</Text>
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.moodChip, selectedMood === m.id && styles.moodChipActive]}
                    onPress={() => setSelectedMood(m.id)}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, selectedMood === m.id && styles.moodLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Symptoms</Text>
              <View style={styles.symptomGrid}>
                {PERIMENOPAUSE_SYMPTOM_OPTIONS.slice(0, 12).map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.symptomChip, selectedSymptoms.includes(s.id) && styles.symptomChipActive]}
                    onPress={() => toggleSymptom(s.id)}
                  >
                    <Text style={styles.symptomEmoji}>{s.emoji}</Text>
                    <Text style={[styles.symptomLabel, selectedSymptoms.includes(s.id) && styles.symptomLabelActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={() => router.push('/perimenopause-symptoms' as any)}
              >
                <Text style={styles.showMoreText}>View all symptoms →</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Hot Flashes Today</Text>
              <View style={styles.hotFlashRow}>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={hotFlashCount}
                  onChangeText={setHotFlashCount}
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="number-pad"
                />
                <View style={styles.intensityRow}>
                  {(['mild', 'moderate', 'severe'] as HotFlashIntensity[]).map(i => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.intensityChip,
                        hotFlashIntensity === i && styles.intensityChipActive,
                        hotFlashIntensity === i && i === 'severe' && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
                      ]}
                      onPress={() => setHotFlashIntensity(i)}
                    >
                      <Text style={[
                        styles.intensityText,
                        hotFlashIntensity === i && styles.intensityTextActive,
                        hotFlashIntensity === i && i === 'severe' && { color: '#EF4444' },
                      ]}>
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.sectionTitle}>Sleep</Text>
              <View style={styles.sleepRow}>
                <View style={styles.sleepInput}>
                  <Text style={styles.sleepLabel}>Hours</Text>
                  <TextInput
                    style={[styles.input, { width: 80 }]}
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    placeholder="--"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.sleepQualityWrap}>
                  <Text style={styles.sleepLabel}>Quality</Text>
                  <View style={styles.sleepQualityRow}>
                    {SLEEP_QUALITY.map(sq => (
                      <TouchableOpacity
                        key={sq.id}
                        style={[
                          styles.sleepQualityChip,
                          sleepQuality === sq.id && { backgroundColor: sq.color + '20', borderColor: sq.color },
                        ]}
                        onPress={() => setSleepQuality(sq.id)}
                      >
                        <Text style={[styles.sleepQualityText, sleepQuality === sq.id && { color: sq.color }]}>
                          {sq.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Energy Level</Text>
              <View style={styles.energyRow}>
                {[1, 2, 3, 4, 5].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.energyDot, energyLevel !== null && energyLevel >= level && styles.energyDotActive]}
                    onPress={() => setEnergyLevel(level)}
                  >
                    <Text style={[styles.energyNum, energyLevel !== null && energyLevel >= level && styles.energyNumActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything you want to remember..."
                placeholderTextColor={Colors.textLight}
                multiline
              />

              <View style={styles.formButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLog(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Button title="Save Log" onPress={handleLogSave} />
              </View>
            </View>
          )}

          {topSymptoms.length > 0 && (
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>Your Top Symptoms (30 days)</Text>
              {topSymptoms.map(([symptom, count]) => {
                const info = PERIMENOPAUSE_SYMPTOM_OPTIONS.find(s => s.id === symptom);
                return (
                  <View key={symptom} style={styles.insightRow}>
                    <Text style={styles.insightEmoji}>{info?.emoji || '•'}</Text>
                    <Text style={styles.insightLabel}>{info?.label || symptom}</Text>
                    <View style={styles.insightBarBg}>
                      <View style={[styles.insightBarFill, { width: `${Math.min(100, (count / 30) * 100)}%` }]} />
                    </View>
                    <Text style={styles.insightCount}>{count}x</Text>
                  </View>
                );
              })}
            </View>
          )}

          {recentLogs.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Logs</Text>
              {recentLogs.slice(0, 5).map(log => (
                <View key={log.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(log.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.historyMood}>
                      {MOOD_OPTIONS.find(m => m.id === log.mood)?.emoji ?? ''} {log.mood}
                    </Text>
                  </View>
                  {log.hotFlashCount && log.hotFlashCount > 0 && (
                    <Text style={styles.historyFlash}>🔥 {log.hotFlashCount} hot flash{log.hotFlashCount > 1 ? 'es' : ''}</Text>
                  )}
                  {log.symptoms.length > 0 && (
                    <View style={styles.historySymptoms}>
                      {log.symptoms.slice(0, 4).map(s => {
                        const info = PERIMENOPAUSE_SYMPTOM_OPTIONS.find(opt => opt.id === s);
                        return (
                          <View key={s} style={styles.historySymptomChip}>
                            <Text style={styles.historySymptomText}>{info?.label || s}</Text>
                          </View>
                        );
                      })}
                      {log.symptoms.length > 4 && (
                        <Text style={styles.moreText}>+{log.symptoms.length - 4}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Tools & Resources</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/perimenopause-symptoms' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Thermometer size={20} color="#D97706" />
                </View>
                <Text style={styles.actionLabel}>Symptom Tracker</Text>
                <Text style={styles.actionDesc}>Track all symptoms</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/perimenopause-education' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}>
                  <BookOpen size={20} color="#7C3AED" />
                </View>
                <Text style={styles.actionLabel}>Education</Text>
                <Text style={styles.actionDesc}>Articles & guides</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/ai-chatbot' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
                  <Brain size={20} color="#DB2777" />
                </View>
                <Text style={styles.actionLabel}>AI Assistant</Text>
                <Text style={styles.actionDesc}>Ask questions</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/emergency-contacts' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Heart size={20} color="#059669" />
                </View>
                <Text style={styles.actionLabel}>Support</Text>
                <Text style={styles.actionDesc}>Get help</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Activity size={18} color="#059669" />
            <Text style={styles.tipTitle}>Daily Tip</Text>
            <Text style={styles.tipText}>
              Regular physical activity — even a 30-minute walk — can help reduce hot flash frequency and improve mood, sleep, and bone health during perimenopause.
            </Text>
          </View>
        </Animated.View>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 4,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  setupIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  setupTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  setupSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 14,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
  },
  datePickerText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  datePickerPlaceholder: {
    color: Colors.textLight,
    fontWeight: '400' as const,
  },
  patternRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  patternChip: {
    flex: 1,
    minWidth: '22%' as any,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  patternChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  patternEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  patternText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  patternTextActive: {
    color: '#92400E',
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  heroPhase: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  heroStat: {
    marginTop: 16,
    alignItems: 'center',
  },
  heroStatNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#D97706',
  },
  heroStatLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#DC2626',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 16,
    marginBottom: 20,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  logForm: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 12,
    color: Colors.text,
  },
  moodLabelActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  symptomChipActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  symptomEmoji: {
    fontSize: 12,
  },
  symptomLabel: {
    fontSize: 11,
    color: Colors.text,
  },
  symptomLabelActive: {
    color: '#92400E',
    fontWeight: '600' as const,
  },
  showMoreBtn: {
    alignItems: 'center' as const,
    paddingVertical: 8,
    marginBottom: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  hotFlashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  intensityRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  intensityChip: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  intensityChipActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  intensityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  intensityTextActive: {
    color: '#92400E',
  },
  sleepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sleepInput: {
    width: 80,
  },
  sleepLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  sleepQualityWrap: {
    flex: 1,
  },
  sleepQualityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sleepQualityChip: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sleepQualityText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  energyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    justifyContent: 'center',
  },
  energyDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.muted,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  energyDotActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  energyNum: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  energyNumActive: {
    color: '#92400E',
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  insightsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  insightEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  insightLabel: {
    fontSize: 13,
    color: Colors.text,
    width: 100,
    fontWeight: '500' as const,
  },
  insightBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.muted,
  },
  insightBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  insightCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    width: 28,
    textAlign: 'right',
  },
  historySection: {
    marginTop: 4,
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
  historyMood: {
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
  },
  historyFlash: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  historySymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  historySymptomChip: {
    backgroundColor: Colors.muted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historySymptomText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  moreText: {
    fontSize: 11,
    color: Colors.textLight,
    alignSelf: 'center',
  },
  quickActions: {
    marginTop: 8,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%' as any,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    position: 'relative' as const,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: Colors.textLight,
  },
  actionArrow: {
    position: 'absolute' as const,
    top: 14,
    right: 12,
  },
  tipCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 16,
    marginTop: 4,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#065F46',
    marginTop: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 20,
  },
});
