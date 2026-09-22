import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Check, Flame, Search } from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePerimenopauseStore } from '../store/perimenopause-store';
import { Button } from '../components/Button';
import {
  PerimenopauseDayLog,
  PerimenopauseSymptom,
  PerimenopauseMood,
  HotFlashIntensity,
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

const CATEGORIES = ['All', 'Vasomotor', 'Mood', 'Physical', 'Sleep', 'Cognitive', 'Menstrual', 'Urogenital'];

export default function PerimenopauseSymptomsScreen() {
  const router = useRouter();
  const { addDayLog, getSymptomFrequency } = usePerimenopauseStore();

  const [selectedSymptoms, setSelectedSymptoms] = useState<PerimenopauseSymptom[]>([]);
  const [selectedMood, setSelectedMood] = useState<PerimenopauseMood | null>(null);
  const [hotFlashCount, setHotFlashCount] = useState('');
  const [hotFlashIntensity, setHotFlashIntensity] = useState<HotFlashIntensity | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const symptomFreq = getSymptomFrequency();

  const toggleSymptom = useCallback((s: PerimenopauseSymptom) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }, []);

  const filteredSymptoms = PERIMENOPAUSE_SYMPTOM_OPTIONS.filter(s => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch = !searchQuery || s.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSave = useCallback(() => {
    if (!selectedMood) {
      Alert.alert('Required', 'Please select your mood.');
      return;
    }
    if (selectedSymptoms.length === 0) {
      Alert.alert('Required', 'Please select at least one symptom.');
      return;
    }

    const log: PerimenopauseDayLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      symptoms: selectedSymptoms,
      mood: selectedMood,
      hotFlashCount: hotFlashCount ? parseInt(hotFlashCount) : undefined,
      hotFlashIntensity: hotFlashIntensity ?? undefined,
      notes: notes || undefined,
    };
    addDayLog(log);
    Alert.alert('Saved', 'Your symptoms have been logged.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [selectedMood, selectedSymptoms, hotFlashCount, hotFlashIntensity, notes, addDayLog, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Symptom Tracker',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.headerIconWrap}>
            <Flame size={24} color="#D97706" />
          </View>
          <Text style={styles.headerTitle}>Track Your Symptoms</Text>
          <Text style={styles.headerSubtitle}>
            Select everything you're experiencing today. This helps identify patterns over time.
          </Text>
        </View>

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

        <View style={styles.searchRow}>
          <Search size={16} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search symptoms..."
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.symptomGrid}>
          {filteredSymptoms.map(s => {
            const isSelected = selectedSymptoms.includes(s.id);
            const freq = symptomFreq[s.id] || 0;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.symptomCard, isSelected && styles.symptomCardActive]}
                onPress={() => toggleSymptom(s.id)}
                activeOpacity={0.7}
              >
                <View style={styles.symptomCardHeader}>
                  <Text style={styles.symptomEmoji}>{s.emoji}</Text>
                  {isSelected && (
                    <View style={styles.symptomCheck}>
                      <Check size={12} color={Colors.white} />
                    </View>
                  )}
                </View>
                <Text style={[styles.symptomLabel, isSelected && styles.symptomLabelActive]}>
                  {s.label}
                </Text>
                {freq > 0 && (
                  <Text style={styles.symptomFreq}>{freq}x this month</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedSymptoms.includes('hot_flashes') && (
          <View style={styles.hotFlashSection}>
            <Text style={styles.sectionTitle}>Hot Flash Details</Text>
            <View style={styles.hotFlashRow}>
              <View>
                <Text style={styles.fieldLabel}>How many today?</Text>
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={hotFlashCount}
                  onChangeText={setHotFlashCount}
                  placeholder="0"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Intensity</Text>
                <View style={styles.intensityRow}>
                  {(['mild', 'moderate', 'severe'] as HotFlashIntensity[]).map(i => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.intensityChip,
                        hotFlashIntensity === i && styles.intensityChipActive,
                      ]}
                      onPress={() => setHotFlashIntensity(i)}
                    >
                      <Text style={[styles.intensityText, hotFlashIntensity === i && styles.intensityTextActive]}>
                        {i.charAt(0).toUpperCase() + i.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          placeholderTextColor={Colors.textLight}
          multiline
        />

        <View style={styles.selectedSummary}>
          <Text style={styles.selectedCount}>
            {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
          </Text>
        </View>

        <Button
          title="Save Symptom Log"
          onPress={handleSave}
          fullWidth
          style={{ marginTop: 8 }}
          disabled={!selectedMood || selectedSymptoms.length === 0}
        />

        <View style={{ height: 32 }} />
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
  headerCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    marginTop: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  categoryScroll: {
    marginBottom: 12,
    maxHeight: 36,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  categoryChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryTextActive: {
    color: '#92400E',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomCard: {
    width: '31%' as any,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 10,
    alignItems: 'center',
  },
  symptomCardActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  symptomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 4,
  },
  symptomEmoji: {
    fontSize: 22,
  },
  symptomCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D97706',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'absolute' as const,
    right: 0,
    top: -2,
  },
  symptomLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 2,
  },
  symptomLabelActive: {
    color: '#92400E',
  },
  symptomFreq: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 2,
  },
  hotFlashSection: {
    marginTop: 8,
  },
  hotFlashRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 12,
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
  intensityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  intensityChip: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 10,
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
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  intensityTextActive: {
    color: '#92400E',
  },
  selectedSummary: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
