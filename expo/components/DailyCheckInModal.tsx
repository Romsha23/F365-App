import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Smile,
  BatteryCharging,
  Battery,
  Zap,
  Brain,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Sun,
  Moon,
  CloudRain,
  BedDouble,
  Heart,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { MoodType } from '../types/cycle';
import { useDailyCheckInStore } from '../store/daily-checkin-store';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyCheckInModalProps {
  visible: boolean;
  onClose: () => void;
}

type StepType = 'mood' | 'energy' | 'stress' | 'sleep' | 'symptoms';

const TOTAL_STEPS = 5;

const MOODS: { id: MoodType; label: string; emoji: string; color: string }[] = [
  { id: 'energetic', label: 'Energetic', emoji: '⚡', color: '#34D399' },
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#FFD700' },
  { id: 'neutral', label: 'Okay', emoji: '😐', color: '#A0AEC0' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#C084FC' },
  { id: 'irritated', label: 'Irritated', emoji: '😤', color: '#9333EA' },
  { id: 'sad', label: 'Down', emoji: '😢', color: '#6495ED' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#94A3B8' },
];

const ENERGY_LEVELS = [
  { value: 1, label: 'Drained', icon: Moon, color: '#64748B' },
  { value: 2, label: 'Low', icon: CloudRain, color: '#94A3B8' },
  { value: 3, label: 'Moderate', icon: Battery, color: '#E6B84D' },
  { value: 4, label: 'Good', icon: BatteryCharging, color: '#22B8A8' },
  { value: 5, label: 'Supercharged', icon: Sun, color: '#34D399' },
];

const STRESS_LEVELS = [
  { value: 1, label: 'Zen', color: '#34D399' },
  { value: 2, label: 'Calm', color: '#22B8A8' },
  { value: 3, label: 'Moderate', color: '#E6B84D' },
  { value: 4, label: 'Stressed', color: '#F97316' },
  { value: 5, label: 'Overwhelmed', color: '#9333EA' },
];

const SLEEP_LEVELS = [
  { value: 1, label: 'Terrible', emoji: '😵', color: '#9333EA' },
  { value: 2, label: 'Poor', emoji: '😫', color: '#F97316' },
  { value: 3, label: 'Fair', emoji: '😐', color: '#E6B84D' },
  { value: 4, label: 'Good', emoji: '😌', color: '#22B8A8' },
  { value: 5, label: 'Great', emoji: '😴', color: '#34D399' },
];

const QUICK_SYMPTOMS: { id: string; label: string; emoji: string }[] = [
  { id: 'cramps', label: 'Cramps', emoji: '🤕' },
  { id: 'headache', label: 'Headache', emoji: '🤯' },
  { id: 'bloating', label: 'Bloating', emoji: '🫧' },
  { id: 'fatigue', label: 'Fatigue', emoji: '🥱' },
  { id: 'backache', label: 'Backache', emoji: '💢' },
  { id: 'nausea', label: 'Nausea', emoji: '🤢' },
  { id: 'tender_breasts', label: 'Tender breasts', emoji: '😣' },
  { id: 'acne', label: 'Acne', emoji: '😖' },
  { id: 'insomnia', label: 'Insomnia', emoji: '👀' },
  { id: 'dizziness', label: 'Dizziness', emoji: '💫' },
];

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  visible,
  onClose,
}) => {
  const [step, setStep] = useState<StepType>('mood');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [stressLevel, setStressLevel] = useState<number>(0);
  const [sleepQuality, setSleepQuality] = useState<number>(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const { submitCheckIn, dismissCheckIn, isLoading } = useDailyCheckInStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(MOODS.map(() => new Animated.Value(1))).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('mood');
      setSelectedMood(null);
      setEnergyLevel(0);
      setStressLevel(0);
      setSleepQuality(0);
      setSelectedSymptoms([]);
      checkmarkScale.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      animateProgress(0);
    }
  }, [visible]);

  const animateProgress = useCallback((stepIndex: number) => {
    Animated.spring(progressAnim, {
      toValue: (stepIndex + 1) / TOTAL_STEPS,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const animateStepTransition = useCallback(() => {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleMoodSelect = useCallback((mood: MoodType, index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMood(mood);

    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnims]);

  const handleEnergySelect = useCallback((level: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEnergyLevel(level);
  }, []);

  const handleStressSelect = useCallback((level: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStressLevel(level);
  }, []);

  const handleSleepSelect = useCallback((level: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSleepQuality(level);
  }, []);

  const handleSymptomToggle = useCallback((symptomId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  }, []);

  const goNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (step === 'mood' && selectedMood) {
      setStep('energy');
      animateStepTransition();
      animateProgress(1);
    } else if (step === 'energy' && energyLevel > 0) {
      setStep('stress');
      animateStepTransition();
      animateProgress(2);
    } else if (step === 'stress' && stressLevel > 0) {
      setStep('sleep');
      animateStepTransition();
      animateProgress(3);
    } else if (step === 'sleep' && sleepQuality > 0) {
      setStep('symptoms');
      animateStepTransition();
      animateProgress(4);
    }
  }, [step, selectedMood, energyLevel, stressLevel, sleepQuality, animateStepTransition, animateProgress]);

  const goBack = useCallback(() => {
    if (step === 'energy') {
      setStep('mood');
      animateStepTransition();
      animateProgress(0);
    } else if (step === 'stress') {
      setStep('energy');
      animateStepTransition();
      animateProgress(1);
    } else if (step === 'sleep') {
      setStep('stress');
      animateStepTransition();
      animateProgress(2);
    } else if (step === 'symptoms') {
      setStep('sleep');
      animateStepTransition();
      animateProgress(3);
    }
  }, [step, animateStepTransition, animateProgress]);

  const handleSubmit = useCallback(async () => {
    if (!selectedMood || energyLevel === 0 || stressLevel === 0 || sleepQuality === 0) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.spring(checkmarkScale, {
      toValue: 1,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();

    await submitCheckIn({
      mood: selectedMood,
      energyLevel,
      stressLevel,
      sleepQuality,
      symptoms: selectedSymptoms,
    });

    setTimeout(() => {
      handleClose();
    }, 800);
  }, [selectedMood, energyLevel, stressLevel, sleepQuality, selectedSymptoms, submitCheckIn, checkmarkScale]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissCheckIn();
      onClose();
    });
  }, [fadeAnim, slideAnim, dismissCheckIn, onClose]);

  const getStepTitle = (): string => {
    switch (step) {
      case 'mood': return 'How are you feeling?';
      case 'energy': return 'Energy level today?';
      case 'stress': return 'Stress check';
      case 'sleep': return 'How did you sleep?';
      case 'symptoms': return 'Any symptoms?';
    }
  };

  const getStepSubtitle = (): string => {
    switch (step) {
      case 'mood': return 'Tap the one that fits best';
      case 'energy': return 'Rate your energy right now';
      case 'stress': return 'How stressed are you feeling?';
      case 'sleep': return 'Rate last night\'s sleep';
      case 'symptoms': return 'Select all that apply (or skip)';
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'mood': return selectedMood !== null;
      case 'energy': return energyLevel > 0;
      case 'stress': return stressLevel > 0;
      case 'sleep': return sleepQuality > 0;
      case 'symptoms': return true;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderMoodStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.moodGrid}>
        {MOODS.map((mood, index) => {
          const isSelected = selectedMood === mood.id;
          return (
            <Animated.View
              key={mood.id}
              style={{ transform: [{ scale: scaleAnims[index] }] }}
            >
              <TouchableOpacity
                style={[
                  styles.moodChip,
                  isSelected && { backgroundColor: mood.color + '25', borderColor: mood.color },
                ]}
                onPress={() => handleMoodSelect(mood.id, index)}
                activeOpacity={0.7}
                testID={`mood-${mood.id}`}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    isSelected && { color: mood.color, fontWeight: '700' as const },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {mood.label}
                </Text>
                {isSelected && (
                  <View style={[styles.moodCheck, { backgroundColor: mood.color }]}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );

  const renderEnergyStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.levelList}>
        {ENERGY_LEVELS.map((level) => {
          const isSelected = energyLevel === level.value;
          const IconComp = level.icon;
          return (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.levelRow,
                isSelected && { backgroundColor: level.color + '18', borderColor: level.color },
              ]}
              onPress={() => handleEnergySelect(level.value)}
              activeOpacity={0.7}
              testID={`energy-${level.value}`}
            >
              <View style={[styles.levelIconWrap, isSelected && { backgroundColor: level.color + '30' }]}>
                <IconComp size={20} color={isSelected ? level.color : Colors.textMuted} strokeWidth={2} />
              </View>
              <View style={styles.levelTextWrap}>
                <Text style={[styles.levelLabel, isSelected && { color: level.color }]}>
                  {level.label}
                </Text>
                <View style={styles.levelBarBg}>
                  <View
                    style={[
                      styles.levelBarFill,
                      {
                        width: `${(level.value / 5) * 100}%`,
                        backgroundColor: isSelected ? level.color : Colors.border,
                      },
                    ]}
                  />
                </View>
              </View>
              {isSelected && (
                <View style={[styles.levelCheck, { backgroundColor: level.color }]}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStressStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stressGrid}>
        {STRESS_LEVELS.map((level) => {
          const isSelected = stressLevel === level.value;
          return (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.stressCircle,
                {
                  borderColor: isSelected ? level.color : Colors.border,
                  backgroundColor: isSelected ? level.color + '20' : Colors.card,
                },
              ]}
              onPress={() => handleStressSelect(level.value)}
              activeOpacity={0.7}
              testID={`stress-${level.value}`}
            >
              <Text style={[styles.stressNumber, isSelected && { color: level.color }]}>
                {level.value}
              </Text>
              <Text style={[styles.stressLabel, isSelected && { color: level.color }]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.stressScale}>
        <Text style={styles.stressScaleText}>Relaxed</Text>
        <View style={styles.stressScaleLine}>
          {STRESS_LEVELS.map((level) => (
            <View
              key={level.value}
              style={[
                styles.stressScaleDot,
                {
                  backgroundColor: stressLevel >= level.value ? level.color : Colors.border,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.stressScaleText}>Max stress</Text>
      </View>
    </View>
  );

  const renderSleepStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sleepGrid}>
        {SLEEP_LEVELS.map((level) => {
          const isSelected = sleepQuality === level.value;
          return (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.sleepCard,
                {
                  borderColor: isSelected ? level.color : Colors.border,
                  backgroundColor: isSelected ? level.color + '18' : Colors.card,
                },
              ]}
              onPress={() => handleSleepSelect(level.value)}
              activeOpacity={0.7}
              testID={`sleep-${level.value}`}
            >
              <Text style={styles.sleepEmoji}>{level.emoji}</Text>
              <Text style={[styles.sleepLabel, isSelected && { color: level.color, fontWeight: '700' as const }]}>
                {level.label}
              </Text>
              {isSelected && (
                <View style={[styles.sleepCheck, { backgroundColor: level.color }]}>
                  <Check size={10} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSymptomsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.symptomGrid}>
        {QUICK_SYMPTOMS.map((symptom) => {
          const isSelected = selectedSymptoms.includes(symptom.id);
          return (
            <TouchableOpacity
              key={symptom.id}
              style={[
                styles.symptomChip,
                isSelected && styles.symptomChipSelected,
              ]}
              onPress={() => handleSymptomToggle(symptom.id)}
              activeOpacity={0.7}
              testID={`symptom-${symptom.id}`}
            >
              <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
              <Text style={[styles.symptomLabel, isSelected && styles.symptomLabelSelected]}>
                {symptom.label}
              </Text>
              {isSelected && (
                <View style={styles.symptomCheck}>
                  <Check size={8} color="#fff" strokeWidth={3} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.symptomHint}>You can skip if no symptoms today</Text>
    </View>
  );

  const renderSuccessOverlay = () => (
    <Animated.View
      style={[
        styles.successOverlay,
        { transform: [{ scale: checkmarkScale }], opacity: checkmarkScale },
      ]}
    >
      <View style={styles.successCircle}>
        <Check size={40} color="#fff" strokeWidth={3} />
      </View>
      <Text style={styles.successText}>All done!</Text>
      <Text style={styles.successSubtext}>Your daily check-in is saved</Text>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleWrap}>
                <Sparkles size={16} color={Colors.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.headerLabel}>Daily Check-in</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              testID="checkin-close"
            >
              <X size={20} color={Colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
            <View style={styles.stepIndicators}>
              <View style={[styles.stepDot, step === 'mood' && styles.stepDotActive]}>
                <Smile size={12} color={step === 'mood' ? Colors.primary : Colors.textMuted} />
              </View>
              <View style={[styles.stepDot, step === 'energy' && styles.stepDotActive]}>
                <Zap size={12} color={step === 'energy' ? Colors.primary : Colors.textMuted} />
              </View>
              <View style={[styles.stepDot, step === 'stress' && styles.stepDotActive]}>
                <Brain size={12} color={step === 'stress' ? Colors.primary : Colors.textMuted} />
              </View>
              <View style={[styles.stepDot, step === 'sleep' && styles.stepDotActive]}>
                <BedDouble size={12} color={step === 'sleep' ? Colors.primary : Colors.textMuted} />
              </View>
              <View style={[styles.stepDot, step === 'symptoms' && styles.stepDotActive]}>
                <Heart size={12} color={step === 'symptoms' ? Colors.primary : Colors.textMuted} />
              </View>
            </View>
          </View>

          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
          </Animated.View>

          {step === 'mood' && renderMoodStep()}
          {step === 'energy' && renderEnergyStep()}
          {step === 'stress' && renderStressStep()}
          {step === 'sleep' && renderSleepStep()}
          {step === 'symptoms' && renderSymptomsStep()}

          <View style={styles.footer}>
            {step !== 'mood' ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={goBack}
                activeOpacity={0.7}
              >
                <ChevronLeft size={18} color={Colors.textMuted} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                testID="checkin-skip"
              >
                <Text style={styles.skipText}>Maybe later</Text>
              </TouchableOpacity>
            )}

            {step === 'symptoms' ? (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !canProceed() && styles.btnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!canProceed() || isLoading}
                activeOpacity={0.8}
                testID="checkin-submit"
              >
                <Check size={18} color="#fff" strokeWidth={2.5} />
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  !canProceed() && styles.btnDisabled,
                ]}
                onPress={goNext}
                disabled={!canProceed()}
                activeOpacity={0.8}
                testID="checkin-next"
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {renderSuccessOverlay()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.gold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  stepDotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginBottom: 20,
  },
  stepContent: {
    minHeight: 200,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  moodChip: {
    width: (SCREEN_WIDTH - 48 - 30) / 4,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden' as const,
  },
  moodEmoji: {
    fontSize: 34,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
  },
  moodCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelList: {
    gap: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  levelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelTextWrap: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 4,
  },
  levelBarBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  stressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  stressCircle: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  stressNumber: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  stressLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  stressScale: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stressScaleText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  stressScaleLine: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 12,
  },
  stressScaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sleepGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sleepCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepEmoji: {
    fontSize: 34,
    marginBottom: 6,
  },
  sleepLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
  },
  sleepCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 4,
    position: 'relative',
  },
  symptomChipSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  symptomEmoji: {
    fontSize: 18,
  },
  symptomLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  symptomLabelSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  symptomCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.subtext,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    fontFamily: 'Inter_500Medium',
    color: Colors.subtext,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.subtext,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  nextBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background + 'F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  successSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.subtext,
    marginTop: 4,
  },
});
