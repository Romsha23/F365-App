import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Check,
  ClipboardCheck,
  Phone,
  Shield,
  BarChart3,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import {
  getQuestionsForUser,
  assessResponses,
  SymptomQuestion,
} from '../mocks/postpartum-symptom-questions';
import * as Haptics from 'expo-haptics';

export default function PostpartumAssessmentScreen() {
  const router = useRouter();
  const { postpartumProfile, getWeeksPostpartum, addAssessmentResult } = usePregnancyStore();
  const weeksPostpartum = getWeeksPostpartum();
  const deliveryType = postpartumProfile?.deliveryType ?? 'vaginal';

  const questions = useMemo(
    () => getQuestionsForUser(weeksPostpartum, deliveryType),
    [weeksPostpartum, deliveryType],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (questions.length > 0) {
      Animated.spring(progressAnim, {
        toValue: (currentIndex + 1) / questions.length,
        tension: 50,
        friction: 8,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, questions.length, progressAnim]);

  const currentQuestion: SymptomQuestion | undefined = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
      const existing = responses[currentQuestion.id];
      setSelectedValue(existing !== undefined ? existing : null);
    }
  }, [currentIndex, currentQuestion, responses]);

  const animateTransition = useCallback(() => {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleSelect = useCallback((value: number) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedValue(value);
    if (currentQuestion) {
      setResponses(prev => ({ ...prev, [currentQuestion.id]: value }));
    }
  }, [currentQuestion]);

  const proceedToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      animateTransition();
    } else {
      setShowResults(true);
      Animated.timing(resultFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();

      const result = assessResponses(responses);
      addAssessmentResult({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        responses: { ...responses },
        score: result.score,
        level: result.level,
        warnings: result.warnings,
        weeksPostpartum,
        timestamp: new Date().toISOString(),
      });
      console.log('[PostpartumAssessment] Result saved to store');
    }
  }, [currentIndex, questions.length, animateTransition, resultFade, responses, weeksPostpartum, addAssessmentResult]);

  const handleNext = useCallback(() => {
    if (selectedValue === null || !currentQuestion) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (currentQuestion.warningThreshold !== undefined && selectedValue >= currentQuestion.warningThreshold && currentQuestion.warningMessage) {
      Alert.alert(
        'Important',
        currentQuestion.warningMessage,
        [
          { text: 'I understand', onPress: () => proceedToNext() },
        ],
      );
    } else {
      proceedToNext();
    }
  }, [selectedValue, currentQuestion, proceedToNext]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      animateTransition();
    }
  }, [currentIndex, animateTransition]);

  const assessment = useMemo(() => assessResponses(responses), [responses]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return Colors.success;
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return Colors.textMuted;
    }
  };

  const getLevelLabel = (level: string): string => {
    switch (level) {
      case 'low': return 'Looking Good';
      case 'moderate': return 'Some Concerns';
      case 'high': return 'Needs Attention';
      default: return '';
    }
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Symptom Check' }} />
        <View style={styles.emptyState}>
          <ClipboardCheck size={48} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No Assessment Available</Text>
          <Text style={styles.emptySubtitle}>
            Please set up your postpartum profile first to receive personalised symptom questions.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/postpartum-dashboard' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyBtnText}>Go to Postpartum Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Your Results' }} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: resultFade }}>
            <View style={[styles.resultHeader, { backgroundColor: getLevelColor(assessment.level) + '12' }]}>
              <View style={[styles.resultBadge, { backgroundColor: getLevelColor(assessment.level) }]}>
                <BarChart3 size={28} color="#fff" />
              </View>
              <Text style={[styles.resultLevel, { color: getLevelColor(assessment.level) }]}>
                {getLevelLabel(assessment.level)}
              </Text>
              <Text style={styles.resultSubtext}>
                Based on your responses across {Object.keys(responses).length} questions
              </Text>
              <View style={styles.resultScoreRow}>
                <View style={styles.resultScoreBarBg}>
                  <View
                    style={[
                      styles.resultScoreBarFill,
                      {
                        width: `${Math.min((assessment.score / (Object.keys(responses).length * 3)) * 100, 100)}%`,
                        backgroundColor: getLevelColor(assessment.level),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {assessment.warnings.length > 0 && (
              <View style={styles.warningSection}>
                <View style={styles.warningSectionHeader}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <Text style={styles.warningSectionTitle}>Important Notices</Text>
                </View>
                {assessment.warnings.map((warning, idx) => (
                  <View key={idx} style={styles.warningCard}>
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Your Responses</Text>
              {questions.map(q => {
                const val = responses[q.id];
                if (val === undefined) return null;
                const option = q.options.find(o => o.value === val);
                return (
                  <View key={q.id} style={styles.summaryRow}>
                    <View style={styles.summaryQuestion}>
                      <Text style={styles.summaryQuestionText} numberOfLines={2}>{q.question}</Text>
                    </View>
                    <View style={styles.summaryAnswer}>
                      <Text style={styles.summaryAnswerEmoji}>{option?.emoji ?? ''}</Text>
                      <Text style={styles.summaryAnswerText}>{option?.label ?? ''}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.helplineCard}>
              <Phone size={18} color={Colors.primary} />
              <View style={styles.helplineContent}>
                <Text style={styles.helplineTitle}>Need Support?</Text>
                <Text style={styles.helplineText}>PANDA: 1300 726 306</Text>
                <Text style={styles.helplineText}>Beyond Blue: 1300 22 4636</Text>
                <Text style={styles.helplineText}>Lifeline: 13 11 14</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => {
                setShowResults(false);
                setCurrentIndex(0);
                setResponses({});
                setSelectedValue(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.retakeBtnText}>Take Assessment Again</Text>
            </TouchableOpacity>

            <View style={styles.disclaimer}>
              <Shield size={14} color={Colors.textLight} />
              <Text style={styles.disclaimerText}>
                This assessment is not a clinical tool and does not replace professional medical advice. If you are concerned about any symptoms, please contact your healthcare provider.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Symptom Check' }} />
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressLabel}>
            {currentIndex + 1} of {questions.length}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            {currentQuestion && (
              <>
                {currentQuestion.deliveryType !== 'all' && (
                  <View style={styles.deliveryBadge}>
                    <Text style={styles.deliveryBadgeText}>
                      {currentQuestion.deliveryType === 'c_section' ? 'C-Section' : 'Vaginal delivery'}
                    </Text>
                  </View>
                )}

                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                <Text style={styles.questionDesc}>{currentQuestion.description}</Text>

                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map(option => {
                    const isSelected = selectedValue === option.value;
                    const isWarning = currentQuestion.warningThreshold !== undefined && option.value >= currentQuestion.warningThreshold;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                          isSelected && isWarning && styles.optionCardWarning,
                        ]}
                        onPress={() => handleSelect(option.value)}
                        activeOpacity={0.7}
                        testID={`option-${option.value}`}
                      >
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                          isSelected && isWarning && styles.optionLabelWarning,
                        ]}>
                          {option.label}
                        </Text>
                        {isSelected && (
                          <View style={[
                            styles.optionCheck,
                            isWarning ? { backgroundColor: '#EF4444' } : { backgroundColor: Colors.primary },
                          ]}>
                            <Check size={12} color="#fff" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {currentIndex > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <ChevronLeft size={18} color={Colors.textMuted} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity
            style={[styles.nextBtn, selectedValue === null && styles.btnDisabled]}
            onPress={handleNext}
            disabled={selectedValue === null}
            activeOpacity={0.8}
            testID="assessment-next"
          >
            <Text style={styles.nextBtnText}>
              {currentIndex === questions.length - 1 ? 'See Results' : 'Next'}
            </Text>
            <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    minWidth: 48,
    textAlign: 'right' as const,
  },
  questionContent: {
    padding: 20,
    paddingBottom: 40,
  },
  deliveryBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#92400E',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 8,
  },
  questionDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
    marginBottom: 28,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  optionCardWarning: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionLabelWarning: {
    color: '#DC2626',
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  resultHeader: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  resultBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  resultLevel: {
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  resultSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  resultScoreRow: {
    width: '100%',
  },
  resultScoreBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  resultScoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  warningSection: {
    marginBottom: 20,
  },
  warningSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  warningSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#DC2626',
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 20,
  },
  summarySection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  summaryQuestion: {
    flex: 1,
  },
  summaryQuestionText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  summaryAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryAnswerEmoji: {
    fontSize: 16,
  },
  summaryAnswerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  helplineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: Colors.primary + '08',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    padding: 16,
    marginBottom: 16,
  },
  helplineContent: {
    flex: 1,
  },
  helplineTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 6,
  },
  helplineText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  retakeBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  retakeBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.muted,
    borderRadius: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 17,
  },
});
