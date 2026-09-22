import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Baby,
  ChevronLeft,
  ChevronRight,
  Scale,
  Lightbulb,
  Heart,
  Syringe,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import { PREGNANCY_WEEKS, VACCINATION_SCHEDULE_AU, getBabyWeekInfo } from '../constants/baby-development';

export default function BabyDevelopmentScreen() {
  const { getCurrentWeek } = usePregnancyStore();
  const currentWeek = getCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState(Math.max(4, currentWeek || 4));
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showVaccines, setShowVaccines] = useState(false);

  const weekInfo = getBabyWeekInfo(selectedWeek);

  const animateTransition = useCallback((direction: 'left' | 'right') => {
    const start = direction === 'right' ? 30 : -30;
    fadeAnim.setValue(0);
    slideAnim.setValue(start);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePrevWeek = useCallback(() => {
    if (selectedWeek > 4) {
      setSelectedWeek(prev => prev - 1);
      animateTransition('left');
    }
  }, [selectedWeek, animateTransition]);

  const handleNextWeek = useCallback(() => {
    if (selectedWeek < 42) {
      setSelectedWeek(prev => prev + 1);
      animateTransition('right');
    }
  }, [selectedWeek, animateTransition]);

  const trimester = selectedWeek <= 13 ? 1 : selectedWeek <= 27 ? 2 : 3;
  const trimesterColor = trimester === 1 ? '#EC4899' : trimester === 2 ? '#F59E0B' : '#10B981';

  const weekOptions = PREGNANCY_WEEKS.map(w => w.week);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Baby Development' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.weekSelector}>
          <TouchableOpacity
            onPress={handlePrevWeek}
            disabled={selectedWeek <= 4}
            style={[styles.navButton, selectedWeek <= 4 && styles.navButtonDisabled]}
          >
            <ChevronLeft size={24} color={selectedWeek <= 4 ? Colors.textLight : Colors.text} />
          </TouchableOpacity>
          <View style={styles.weekDisplay}>
            <Text style={styles.weekNumber}>Week {selectedWeek}</Text>
            <View style={[styles.trimesterBadge, { backgroundColor: trimesterColor + '20' }]}>
              <Text style={[styles.trimesterText, { color: trimesterColor }]}>
                Trimester {trimester}
              </Text>
            </View>
            {selectedWeek === currentWeek && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={handleNextWeek}
            disabled={selectedWeek >= 42}
            style={[styles.navButton, selectedWeek >= 42 && styles.navButtonDisabled]}
          >
            <ChevronRight size={24} color={selectedWeek >= 42 ? Colors.textLight : Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekPills} contentContainerStyle={styles.weekPillsContent}>
          {weekOptions.map(w => (
            <TouchableOpacity
              key={w}
              style={[styles.weekPill, selectedWeek === w && styles.weekPillActive, w === currentWeek && styles.weekPillCurrent]}
              onPress={() => { setSelectedWeek(w); animateTransition(w > selectedWeek ? 'right' : 'left'); }}
            >
              <Text style={[styles.weekPillText, selectedWeek === w && styles.weekPillTextActive]}>
                {w}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {weekInfo && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
            <View style={styles.sizeCard}>
              <Baby size={36} color={trimesterColor} />
              <Text style={styles.sizeTitle}>Baby is the size of a</Text>
              <Text style={[styles.sizeName, { color: trimesterColor }]}>{weekInfo.babySize}</Text>
              <View style={styles.sizeStats}>
                <View style={styles.sizeStat}>
                  <Scale size={14} color={Colors.textMuted} />
                  <Text style={styles.sizeStatText}>{weekInfo.babyWeight}</Text>
                </View>
              </View>
            </View>

            <View style={styles.developmentCard}>
              <View style={styles.cardHeader}>
                <Baby size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>Baby's Development</Text>
              </View>
              <Text style={styles.cardBody}>{weekInfo.babyDevelopment}</Text>
            </View>

            <View style={styles.developmentCard}>
              <View style={styles.cardHeader}>
                <Heart size={18} color="#EC4899" />
                <Text style={styles.cardTitle}>Your Body</Text>
              </View>
              <Text style={styles.cardBody}>{weekInfo.maternalChanges}</Text>
            </View>

            {weekInfo.tips.length > 0 && (
              <View style={styles.tipsCard}>
                <View style={styles.cardHeader}>
                  <Lightbulb size={18} color="#F59E0B" />
                  <Text style={styles.cardTitle}>Tips This Week</Text>
                </View>
                {weekInfo.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={styles.tipBullet} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        <TouchableOpacity
          style={styles.vaccineToggle}
          onPress={() => setShowVaccines(!showVaccines)}
        >
          <Syringe size={18} color={Colors.primary} />
          <Text style={styles.vaccineToggleText}>
            {showVaccines ? 'Hide' : 'Show'} Australian Vaccination Schedule
          </Text>
        </TouchableOpacity>

        {showVaccines && (
          <View style={styles.vaccineSection}>
            <Text style={styles.vaccineDisclaimer}>
              National Immunisation Program (NIP) — Australia. Always confirm with your healthcare provider.
            </Text>
            {VACCINATION_SCHEDULE_AU.map((item, i) => (
              <View key={i} style={styles.vaccineRow}>
                <View style={styles.vaccineAge}>
                  <Text style={styles.vaccineAgeText}>{item.age}</Text>
                </View>
                <View style={styles.vaccineList}>
                  {item.vaccines.map((v, j) => (
                    <View key={j} style={styles.vaccineChip}>
                      <Text style={styles.vaccineChipText}>{v}</Text>
                    </View>
                  ))}
                </View>
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
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  weekDisplay: {
    alignItems: 'center',
  },
  weekNumber: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  trimesterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  trimesterText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  currentBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#065F46',
  },
  weekPills: {
    marginBottom: 20,
    maxHeight: 40,
  },
  weekPillsContent: {
    gap: 6,
    paddingHorizontal: 4,
  },
  weekPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekPillCurrent: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  weekPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  weekPillTextActive: {
    color: Colors.white,
  },
  sizeCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  sizeTitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
  sizeName: {
    fontSize: 26,
    fontWeight: '800' as const,
    marginTop: 4,
  },
  sizeStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  sizeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sizeStatText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  developmentCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardBody: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 18,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 7,
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    flex: 1,
  },
  vaccineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  vaccineToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  vaccineSection: {
    marginBottom: 12,
  },
  vaccineDisclaimer: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  vaccineRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  vaccineAge: {
    width: 80,
    justifyContent: 'center',
  },
  vaccineAgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  vaccineList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  vaccineChip: {
    backgroundColor: Colors.primary + '12',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  vaccineChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
