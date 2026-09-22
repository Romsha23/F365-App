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
  Baby,
  Plus,
  Check,
  AlertTriangle,
  Milk,
  Thermometer,
  BookOpen,
  ClipboardCheck,
  Heart,
  ChevronRight,
  Users,
  Calendar,
  ArrowLeft,
} from 'lucide-react-native';
import DatePickerModal from '../components/DatePickerModal';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import { PostpartumDayLog, PostpartumSymptom, PostpartumProfile } from '../types/pregnancy';
import { Button } from '../components/Button';

const POSTPARTUM_SYMPTOMS: { id: PostpartumSymptom; label: string; emoji: string }[] = [
  { id: 'bleeding', label: 'Bleeding', emoji: '🩸' },
  { id: 'cramping', label: 'Cramping', emoji: '😣' },
  { id: 'breast_engorgement', label: 'Breast Engorgement', emoji: '🤱' },
  { id: 'nipple_soreness', label: 'Nipple Soreness', emoji: '😖' },
  { id: 'mood_swings', label: 'Mood Swings', emoji: '🎭' },
  { id: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { id: 'constipation', label: 'Constipation', emoji: '😩' },
  { id: 'hemorrhoids', label: 'Hemorrhoids', emoji: '💊' },
  { id: 'perineal_pain', label: 'Perineal Pain', emoji: '⚡' },
  { id: 'c_section_pain', label: 'C-Section Pain', emoji: '🩹' },
  { id: 'night_sweats', label: 'Night Sweats', emoji: '💦' },
  { id: 'hair_loss', label: 'Hair Loss', emoji: '💇' },
  { id: 'back_pain', label: 'Back Pain', emoji: '🔙' },
  { id: 'headaches', label: 'Headaches', emoji: '🤕' },
  { id: 'anxiety', label: 'Anxiety', emoji: '😰' },
  { id: 'depression', label: 'Depression', emoji: '😢' },
];

const MOODS = [
  { id: 'excited' as const, emoji: '🤩', label: 'Excited' },
  { id: 'happy' as const, emoji: '😊', label: 'Happy' },
  { id: 'peaceful' as const, emoji: '😌', label: 'Peaceful' },
  { id: 'tired' as const, emoji: '😴', label: 'Tired' },
  { id: 'anxious' as const, emoji: '😰', label: 'Anxious' },
  { id: 'emotional' as const, emoji: '🥺', label: 'Emotional' },
  { id: 'overwhelmed' as const, emoji: '😩', label: 'Overwhelmed' },
  { id: 'worried' as const, emoji: '😟', label: 'Worried' },
];

const BLEEDING_LEVELS = [
  { id: 'spotting' as const, label: 'Spotting', color: '#FCD34D' },
  { id: 'light' as const, label: 'Light', color: '#F59E0B' },
  { id: 'moderate' as const, label: 'Moderate', color: '#EF4444' },
  { id: 'heavy' as const, label: 'Heavy', color: '#DC2626' },
];

export default function PostpartumDashboardScreen() {
  const router = useRouter();
  const {
    postpartumProfile,
    postpartumDayLogs,
    addPostpartumDayLog,
    getWeeksPostpartum,
    setPostpartumProfile,
    setMode,
  } = usePregnancyStore();

  const weeksPostpartum = getWeeksPostpartum();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showSetup, setShowSetup] = useState(!postpartumProfile);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'vaginal' | 'c_section' | 'vbac'>('vaginal');
  const [babyName, setBabyName] = useState('');
  const [initialMood, setInitialMood] = useState<string | null>(null);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [showOptionalCards, setShowOptionalCards] = useState(false);

  const [showLog, setShowLog] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<PostpartumSymptom[]>([]);
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number]['id'] | null>(null);
  const [bleedingLevel, setBleedingLevel] = useState<'spotting' | 'light' | 'moderate' | 'heavy' | null>(null);
  const [sleep, setSleep] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSetupSave = useCallback(() => {
    if (!deliveryDate) {
      Alert.alert('Required', 'Please enter the delivery date.');
      return;
    }
    const profile: PostpartumProfile = {
      id: Date.now().toString(),
      userId: 'local',
      babyId: '',
      deliveryDate,
      deliveryType,
      isBreastfeeding,
      isPumping: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPostpartumProfile(profile);
    setMode('postpartum');
    setShowSetup(false);
    console.log('[Postpartum] Profile saved:', profile);
  }, [deliveryDate, deliveryType, isBreastfeeding, setPostpartumProfile, setMode]);

  const handleLogSave = useCallback(() => {
    if (!selectedMood) {
      Alert.alert('Required', 'Please select your mood.');
      return;
    }
    const log: PostpartumDayLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weeksPostpartum,
      symptoms: selectedSymptoms,
      mood: selectedMood,
      bleedingLevel: bleedingLevel ?? undefined,
      sleep: sleep ? parseFloat(sleep) : undefined,
      notes: notes || undefined,
    };
    addPostpartumDayLog(log);
    console.log('[Postpartum] Log saved:', log);
    setShowLog(false);
    setSelectedSymptoms([]);
    setSelectedMood(null);
    setBleedingLevel(null);
    setSleep('');
    setNotes('');
    Alert.alert('Saved', 'Your daily log has been saved.');
  }, [selectedMood, selectedSymptoms, bleedingLevel, sleep, notes, weeksPostpartum, addPostpartumDayLog]);

  const toggleSymptom = useCallback((s: PostpartumSymptom) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }, []);

  const recentLogs = postpartumDayLogs
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const hasAnxietyOrDepression = recentLogs.some(l =>
    l.symptoms.includes('anxiety') || l.symptoms.includes('depression')
  );

  const QUICK_MOODS = [
    { id: 'happy', emoji: '😊', label: 'Good' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'emotional', emoji: '🥺', label: 'Emotional' },
    { id: 'overwhelmed', emoji: '😩', label: 'Overwhelmed' },
  ];

  if (showSetup) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{
          title: 'Postpartum Setup',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
              <ArrowLeft size={22} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.setupHeader}>
            <View style={styles.setupIconBg}>
              <Baby size={32} color="#EC4899" />
            </View>
            <Text style={styles.setupTitle}>Welcome, Mama ✨</Text>
            <Text style={styles.setupSubtitle}>
              Just a few quick questions to get you started. You can fill in more details later at your own pace.
            </Text>
          </View>

          <Text style={styles.fieldLabel}>When was your baby born? *</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={deliveryDate ? Colors.primary : Colors.textLight} />
            <Text style={[styles.datePickerText, !deliveryDate && styles.datePickerPlaceholder]}>
              {deliveryDate
                ? new Date(deliveryDate + 'T00:00:00').toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Tap to select date'}
            </Text>
          </TouchableOpacity>

          <DatePickerModal
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={(date) => setDeliveryDate(date)}
            selectedDate={deliveryDate || undefined}
            title="Baby's Birth Date"
            maxDate={new Date().toISOString().split('T')[0]}
          />

          <Text style={styles.fieldLabel}>How was the delivery? *</Text>
          <View style={styles.typeRow}>
            {([
              { id: 'vaginal' as const, label: 'Vaginal', emoji: '👶' },
              { id: 'c_section' as const, label: 'C-Section', emoji: '🏥' },
              { id: 'vbac' as const, label: 'VBAC', emoji: '💪' },
            ]).map(dt => (
              <TouchableOpacity
                key={dt.id}
                style={[styles.typeChip, deliveryType === dt.id && styles.typeChipActive]}
                onPress={() => setDeliveryType(dt.id)}
              >
                <Text style={styles.typeEmoji}>{dt.emoji}</Text>
                <Text style={[styles.typeChipText, deliveryType === dt.id && styles.typeChipTextActive]}>
                  {dt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Baby's name (optional)</Text>
          <TextInput
            style={styles.input}
            value={babyName}
            onChangeText={setBabyName}
            placeholder="Your little one's name"
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.fieldLabel}>How are you feeling right now?</Text>
          <View style={styles.quickMoodRow}>
            {QUICK_MOODS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.quickMoodChip, initialMood === m.id && styles.quickMoodChipActive]}
                onPress={() => setInitialMood(m.id)}
              >
                <Text style={styles.quickMoodEmoji}>{m.emoji}</Text>
                <Text style={[styles.quickMoodLabel, initialMood === m.id && styles.quickMoodLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Start Postpartum Tracking" onPress={handleSetupSave} fullWidth style={{ marginTop: 24 }} />

          {!showOptionalCards && (
            <TouchableOpacity
              style={styles.showOptionalBtn}
              onPress={() => setShowOptionalCards(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.showOptionalText}>+ Add more details (optional)</Text>
            </TouchableOpacity>
          )}

          {showOptionalCards && (
            <View style={styles.optionalSection}>
              <Text style={styles.optionalTitle}>Optional Details</Text>
              <Text style={styles.optionalSubtitle}>Fill these in whenever you're ready</Text>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setIsBreastfeeding(!isBreastfeeding)}
              >
                <Milk size={18} color={Colors.primary} />
                <Text style={styles.toggleLabel}>Breastfeeding</Text>
                <View style={[styles.toggleBox, isBreastfeeding && styles.toggleBoxActive]}>
                  {isBreastfeeding && <Check size={14} color={Colors.white} />}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Postpartum',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.weekCard}>
            <Text style={styles.weekLabel}>Weeks Postpartum</Text>
            <Text style={styles.weekNumber}>{weeksPostpartum}</Text>
            {postpartumProfile?.deliveryType && (
              <Text style={styles.deliveryInfo}>
                {postpartumProfile.deliveryType === 'c_section' ? 'C-Section' : postpartumProfile.deliveryType === 'vbac' ? 'VBAC' : 'Vaginal'} delivery
              </Text>
            )}
          </View>

          {hasAnxietyOrDepression && (
            <View style={styles.warningCard}>
              <AlertTriangle size={18} color="#DC2626" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Mental Health Check</Text>
                <Text style={styles.warningText}>
                  You've logged anxiety or depression recently. Postpartum mood disorders are common and treatable. Please reach out to your healthcare provider or PANDA helpline: 1300 726 306.
                </Text>
              </View>
            </View>
          )}

          {!showLog ? (
            <TouchableOpacity style={styles.logButton} onPress={() => setShowLog(true)} testID="add-log">
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.logButtonText}>Log Today</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.logForm}>
              <Text style={styles.sectionTitle}>How are you feeling?</Text>
              <View style={styles.moodGrid}>
                {MOODS.map(m => (
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
                {POSTPARTUM_SYMPTOMS.map(s => (
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

              <Text style={styles.sectionTitle}>Bleeding Level</Text>
              <View style={styles.bleedingRow}>
                {BLEEDING_LEVELS.map(bl => (
                  <TouchableOpacity
                    key={bl.id}
                    style={[styles.bleedingChip, bleedingLevel === bl.id && { backgroundColor: bl.color + '20', borderColor: bl.color }]}
                    onPress={() => setBleedingLevel(bl.id)}
                  >
                    <View style={[styles.bleedingDot, { backgroundColor: bl.color }]} />
                    <Text style={[styles.bleedingText, bleedingLevel === bl.id && { color: bl.color }]}>{bl.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.fieldLabel}>Sleep (hrs)</Text>
                  <TextInput
                    style={styles.input}
                    value={sleep}
                    onChangeText={setSleep}
                    placeholder="--"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How's recovery going?"
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

          {recentLogs.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Logs</Text>
              {recentLogs.map(log => (
                <View key={log.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(log.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.historyMood}>
                      {MOODS.find(m => m.id === log.mood)?.emoji ?? ''} {log.mood}
                    </Text>
                  </View>
                  {log.symptoms.length > 0 && (
                    <View style={styles.historySymptoms}>
                      {log.symptoms.slice(0, 3).map(s => (
                        <View key={s} style={styles.historySymptomChip}>
                          <Text style={styles.historySymptomText}>{s.replace(/_/g, ' ')}</Text>
                        </View>
                      ))}
                      {log.symptoms.length > 3 && (
                        <Text style={styles.moreText}>+{log.symptoms.length - 3}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Postpartum Tools</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/postpartum-assessment' as any)}
                activeOpacity={0.7}
                testID="action-assessment"
              >
                <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}>
                  <ClipboardCheck size={20} color="#7C3AED" />
                </View>
                <Text style={styles.actionLabel}>Symptom Check</Text>
                <Text style={styles.actionDesc}>Track recovery</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/postpartum-knowledge' as any)}
                activeOpacity={0.7}
                testID="action-knowledge"
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <BookOpen size={20} color="#D97706" />
                </View>
                <Text style={styles.actionLabel}>Knowledge Base</Text>
                <Text style={styles.actionDesc}>Articles & Q&A</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/partner-education' as any)}
                activeOpacity={0.7}
                testID="action-partner"
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
                  <Users size={20} color="#DB2777" />
                </View>
                <Text style={styles.actionLabel}>Partner Guide</Text>
                <Text style={styles.actionDesc}>Share with partner</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/postpartum-knowledge' as any)}
                activeOpacity={0.7}
                testID="action-faq"
              >
                <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Heart size={20} color="#059669" />
                </View>
                <Text style={styles.actionLabel}>Q&A</Text>
                <Text style={styles.actionDesc}>Common questions</Text>
                <ChevronRight size={14} color={Colors.textLight} style={styles.actionArrow} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.recoveryCard}>
            <Thermometer size={18} color={Colors.accent} />
            <Text style={styles.recoveryTitle}>Recovery Tips — Week {weeksPostpartum}</Text>
            <Text style={styles.recoveryText}>
              {weeksPostpartum <= 2
                ? 'Focus on rest and recovery. Accept help from others. Stay hydrated and eat nourishing foods. Keep up with pain management as prescribed.'
                : weeksPostpartum <= 6
                ? 'Gradually increase activity. Attend your 6-week checkup. Monitor mood changes and reach out for support if needed.'
                : 'Recovery continues beyond 6 weeks. Pelvic floor exercises can help. Discuss return to exercise with your provider.'}
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
  setupHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  setupTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
  },
  setupSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 14,
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 4,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toggleBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  weekNumber: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginVertical: 4,
  },
  deliveryInfo: {
    fontSize: 13,
    color: Colors.textLight,
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
    marginBottom: 12,
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
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  symptomEmoji: {
    fontSize: 12,
  },
  symptomLabel: {
    fontSize: 11,
    color: Colors.text,
  },
  symptomLabelActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  bleedingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bleedingChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  bleedingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bleedingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
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
    textTransform: 'capitalize' as const,
  },
  moreText: {
    fontSize: 11,
    color: Colors.textLight,
    alignSelf: 'center',
  },
  recoveryCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 16,
    marginTop: 12,
  },
  recoveryTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#065F46',
    marginTop: 8,
    marginBottom: 8,
  },
  recoveryText: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 20,
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
  setupIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDF2F8',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  typeEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  quickMoodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickMoodChip: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickMoodChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  quickMoodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickMoodLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  quickMoodLabelActive: {
    color: Colors.primary,
  },
  showOptionalBtn: {
    alignItems: 'center' as const,
    paddingVertical: 16,
    marginTop: 8,
  },
  showOptionalText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  optionalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  optionalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
});
