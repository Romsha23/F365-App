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
import { Stack } from 'expo-router';
import {
  Activity,
  Heart,
  Droplets,
  Moon,
  Dumbbell,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import { PregnancySymptom, PregnancyMoodType, PregnancyDayLog } from '../types/pregnancy';
import { Button } from '../components/Button';

const SYMPTOMS: { id: PregnancySymptom; label: string; emoji: string }[] = [
  { id: 'nausea', label: 'Nausea', emoji: '🤢' },
  { id: 'morning_sickness', label: 'Morning Sickness', emoji: '😵' },
  { id: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { id: 'breast_tenderness', label: 'Breast Tenderness', emoji: '💔' },
  { id: 'frequent_urination', label: 'Frequent Urination', emoji: '🚽' },
  { id: 'food_aversions', label: 'Food Aversions', emoji: '🙅' },
  { id: 'food_cravings', label: 'Food Cravings', emoji: '🍕' },
  { id: 'heartburn', label: 'Heartburn', emoji: '🔥' },
  { id: 'constipation', label: 'Constipation', emoji: '😣' },
  { id: 'back_pain', label: 'Back Pain', emoji: '🔙' },
  { id: 'swelling', label: 'Swelling', emoji: '🦶' },
  { id: 'mood_swings', label: 'Mood Swings', emoji: '🎭' },
  { id: 'leg_cramps', label: 'Leg Cramps', emoji: '🦵' },
  { id: 'shortness_of_breath', label: 'Shortness of Breath', emoji: '😮‍💨' },
  { id: 'insomnia', label: 'Insomnia', emoji: '🌙' },
  { id: 'headaches', label: 'Headaches', emoji: '🤕' },
  { id: 'dizziness', label: 'Dizziness', emoji: '💫' },
  { id: 'round_ligament_pain', label: 'Round Ligament Pain', emoji: '⚡' },
  { id: 'contractions', label: 'Contractions', emoji: '🫃' },
];

const MOODS: { id: PregnancyMoodType; label: string; emoji: string; color: string }[] = [
  { id: 'excited', label: 'Excited', emoji: '🤩', color: '#F59E0B' },
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#10B981' },
  { id: 'peaceful', label: 'Peaceful', emoji: '😌', color: '#6366F1' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#8B5CF6' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#F97316' },
  { id: 'emotional', label: 'Emotional', emoji: '🥺', color: '#EC4899' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😩', color: '#EF4444' },
  { id: 'worried', label: 'Worried', emoji: '😟', color: '#6B7280' },
];

export default function PregnancyLogScreen() {
  const { pregnancyDayLogs, addPregnancyDayLog, getCurrentWeek } = usePregnancyStore();
  const currentWeek = getCurrentWeek();
  const today = new Date().toISOString().split('T')[0];

  const existingLog = pregnancyDayLogs.find(l => l.date.split('T')[0] === today);

  const [selectedSymptoms, setSelectedSymptoms] = useState<PregnancySymptom[]>(existingLog?.symptoms ?? []);
  const [selectedMood, setSelectedMood] = useState<PregnancyMoodType | null>(existingLog?.mood ?? null);
  const [weight, setWeight] = useState(existingLog?.weight?.toString() ?? '');
  const [bloodPressure, setBloodPressure] = useState(existingLog?.bloodPressure ?? '');
  const [waterIntake, setWaterIntake] = useState(existingLog?.waterIntake?.toString() ?? '');
  const [sleep, setSleep] = useState(existingLog?.sleep?.toString() ?? '');
  const [exercise, setExercise] = useState(existingLog?.exercise ?? '');
  const [notes, setNotes] = useState(existingLog?.notes ?? '');
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const toggleSymptom = useCallback((symptom: PregnancySymptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedMood) {
      Alert.alert('Required', 'Please select your mood for today.');
      return;
    }

    const log: PregnancyDayLog = {
      id: existingLog?.id ?? Date.now().toString(),
      date: today,
      week: currentWeek,
      symptoms: selectedSymptoms,
      mood: selectedMood,
      weight: weight ? parseFloat(weight) : undefined,
      bloodPressure: bloodPressure || undefined,
      waterIntake: waterIntake ? parseInt(waterIntake, 10) : undefined,
      sleep: sleep ? parseFloat(sleep) : undefined,
      exercise: exercise || undefined,
      notes: notes || undefined,
    };

    addPregnancyDayLog(log);
    console.log('[PregnancyLog] Saved log:', log);
    Alert.alert('Saved', 'Your daily log has been saved successfully.');
  }, [selectedMood, selectedSymptoms, weight, bloodPressure, waterIntake, sleep, exercise, notes, today, currentWeek, existingLog, addPregnancyDayLog]);

  const displayedSymptoms = showAllSymptoms ? SYMPTOMS : SYMPTOMS.slice(0, 9);

  const recentLogs = pregnancyDayLogs
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pregnancy Log' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Activity size={22} color={Colors.primary} />
              <View>
                <Text style={styles.headerTitle}>Daily Log</Text>
                <Text style={styles.headerSubtitle}>Week {currentWeek} &bull; {new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
              </View>
            </View>
            {existingLog && (
              <View style={styles.existingBadge}>
                <Check size={12} color="#065F46" />
                <Text style={styles.existingBadgeText}>Logged today</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodChip, selectedMood === mood.id && { backgroundColor: mood.color + '20', borderColor: mood.color }]}
                onPress={() => setSelectedMood(mood.id)}
                testID={`mood-${mood.id}`}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, selectedMood === mood.id && { color: mood.color, fontWeight: '700' as const }]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Symptoms Today</Text>
          <View style={styles.symptomGrid}>
            {displayedSymptoms.map(symptom => (
              <TouchableOpacity
                key={symptom.id}
                style={[styles.symptomChip, selectedSymptoms.includes(symptom.id) && styles.symptomChipActive]}
                onPress={() => toggleSymptom(symptom.id)}
                testID={`symptom-${symptom.id}`}
              >
                <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                <Text style={[styles.symptomLabel, selectedSymptoms.includes(symptom.id) && styles.symptomLabelActive]}>
                  {symptom.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowAllSymptoms(!showAllSymptoms)}>
            {showAllSymptoms ? <ChevronUp size={16} color={Colors.primary} /> : <ChevronDown size={16} color={Colors.primary} />}
            <Text style={styles.showMoreText}>{showAllSymptoms ? 'Show Less' : `Show All (${SYMPTOMS.length})`}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Measurements</Text>
          <View style={styles.measurementGrid}>
            <View style={styles.measurementItem}>
              <View style={styles.measurementIcon}>
                <Droplets size={16} color={Colors.accent} />
              </View>
              <Text style={styles.measurementLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.measurementInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="--"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.measurementItem}>
              <View style={styles.measurementIcon}>
                <Heart size={16} color="#EC4899" />
              </View>
              <Text style={styles.measurementLabel}>BP (mmHg)</Text>
              <TextInput
                style={styles.measurementInput}
                value={bloodPressure}
                onChangeText={setBloodPressure}
                placeholder="120/80"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <View style={styles.measurementItem}>
              <View style={styles.measurementIcon}>
                <Droplets size={16} color="#3B82F6" />
              </View>
              <Text style={styles.measurementLabel}>Water (ml)</Text>
              <TextInput
                style={styles.measurementInput}
                value={waterIntake}
                onChangeText={setWaterIntake}
                placeholder="--"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.measurementItem}>
              <View style={styles.measurementIcon}>
                <Moon size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.measurementLabel}>Sleep (hrs)</Text>
              <TextInput
                style={styles.measurementInput}
                value={sleep}
                onChangeText={setSleep}
                placeholder="--"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Dumbbell size={16} color={Colors.accent} />
              <Text style={styles.inputLabel}>Exercise</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={exercise}
              onChangeText={setExercise}
              placeholder="e.g. 30 min walk, prenatal yoga"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <FileText size={16} color={Colors.primary} />
              <Text style={styles.inputLabel}>Notes</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any thoughts, concerns, or things to remember..."
              placeholderTextColor={Colors.textLight}
              multiline
            />
          </View>

          <Button
            title={existingLog ? 'Update Log' : 'Save Log'}
            onPress={handleSave}
            fullWidth
            icon={<Check size={18} color={Colors.white} />}
          />

          {recentLogs.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Logs</Text>
              {recentLogs.map(log => (
                <View key={log.id} style={styles.recentCard}>
                  <View style={styles.recentHeader}>
                    <Text style={styles.recentDate}>
                      {new Date(log.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.recentWeek}>Week {log.week}</Text>
                  </View>
                  <View style={styles.recentMood}>
                    <Text style={styles.recentMoodEmoji}>
                      {MOODS.find(m => m.id === log.mood)?.emoji ?? ''}
                    </Text>
                    <Text style={styles.recentMoodLabel}>{log.mood}</Text>
                  </View>
                  {log.symptoms.length > 0 && (
                    <View style={styles.recentSymptoms}>
                      {log.symptoms.slice(0, 4).map(s => (
                        <View key={s} style={styles.recentSymptomChip}>
                          <Text style={styles.recentSymptomText}>{s.replace(/_/g, ' ')}</Text>
                        </View>
                      ))}
                      {log.symptoms.length > 4 && (
                        <Text style={styles.moreSymptoms}>+{log.symptoms.length - 4}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
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
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  existingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  existingBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#065F46',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  symptomChipActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  symptomEmoji: {
    fontSize: 14,
  },
  symptomLabel: {
    fontSize: 12,
    color: Colors.text,
  },
  symptomLabelActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginBottom: 16,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  measurementItem: {
    width: '47%' as any,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  measurementIcon: {
    marginBottom: 6,
  },
  measurementLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  measurementInput: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    padding: 0,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  recentSection: {
    marginTop: 24,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  recentCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recentWeek: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  recentMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recentMoodEmoji: {
    fontSize: 16,
  },
  recentMoodLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
  },
  recentSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentSymptomChip: {
    backgroundColor: Colors.muted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentSymptomText: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
  },
  moreSymptoms: {
    fontSize: 11,
    color: Colors.textLight,
    alignSelf: 'center',
  },
});
