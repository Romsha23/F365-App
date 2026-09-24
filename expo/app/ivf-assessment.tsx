import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Shield,
  Heart,
  Activity,
  Clock,
  Stethoscope,
  Egg,
  Brain,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { useIVFReadinessStore } from '@/store/ivf-readiness-store';
import {
  AgeRange,
  CycleRegularity,
  TimeConceiving,
  OvulationConfidence,
  SymptomSeverity,
  IVFAssessmentInput,
} from '@/types/ivf-readiness';

const STEPS = [
  { id: 'disclaimer', title: 'Important Notice', icon: Shield },
  { id: 'age', title: 'Age Range', icon: Heart },
  { id: 'cycle', title: 'Cycle Health', icon: Activity },
  { id: 'conceiving', title: 'Time Trying', icon: Clock },
  { id: 'ovulation', title: 'Ovulation', icon: Egg },
  { id: 'medical', title: 'Medical History', icon: Stethoscope },
  { id: 'symptoms', title: 'Symptoms', icon: Brain },
];

type OptionItem<T> = { id: T; label: string; desc: string };

const AGE_OPTIONS: OptionItem<AgeRange>[] = [
  { id: 'under_25', label: 'Under 25', desc: 'Youngest fertility bracket' },
  { id: '25_29', label: '25–29', desc: 'Peak fertility years' },
  { id: '30_34', label: '30–34', desc: 'Gradual fertility decline begins' },
  { id: '35_37', label: '35–37', desc: 'Noticeable decline in egg quality' },
  { id: '38_40', label: '38–40', desc: 'Significant decline' },
  { id: '41_plus', label: '41+', desc: 'Specialist guidance recommended' },
];

const CYCLE_OPTIONS: OptionItem<CycleRegularity>[] = [
  { id: 'regular', label: 'Regular', desc: 'Cycles vary by 1–3 days' },
  { id: 'mildly_irregular', label: 'Mildly Irregular', desc: 'Cycles vary by 4–7 days' },
  { id: 'highly_irregular', label: 'Highly Irregular', desc: 'Cycles vary by 8+ days or unpredictable' },
  { id: 'no_periods', label: 'No Periods', desc: 'Absent or very rare periods' },
];

const TIME_OPTIONS: OptionItem<TimeConceiving>[] = [
  { id: 'not_yet', label: 'Not Yet Trying', desc: 'Planning for the future' },
  { id: 'under_6', label: 'Under 6 Months', desc: 'Recently started trying' },
  { id: '6_12', label: '6–12 Months', desc: 'Been trying for a while' },
  { id: '12_18', label: '12–18 Months', desc: 'Over a year of trying' },
  { id: '18_plus', label: '18+ Months', desc: 'Extended period of trying' },
];

const OVULATION_OPTIONS: OptionItem<OvulationConfidence>[] = [
  { id: 'consistent', label: 'Consistent', desc: 'I ovulate regularly and track it' },
  { id: 'uncertain', label: 'Uncertain', desc: 'I think I ovulate but not sure' },
  { id: 'rare', label: 'Rare', desc: 'I rarely or never detect ovulation' },
  { id: 'unknown', label: 'Unknown', desc: 'I don\'t track ovulation' },
];

const SEVERITY_OPTIONS: OptionItem<SymptomSeverity>[] = [
  { id: 'low', label: 'Low', desc: 'Minimal impact on daily life' },
  { id: 'moderate', label: 'Moderate', desc: 'Noticeable but manageable' },
  { id: 'high', label: 'High', desc: 'Significantly affects daily life' },
];

export default function IVFAssessmentScreen() {
  const { runAssessment, isLoading } = useIVFReadinessStore();
  const [step, setStep] = useState(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [cycleRegularity, setCycleRegularity] = useState<CycleRegularity | null>(null);
  const [timeConceiving, setTimeConceiving] = useState<TimeConceiving | null>(null);
  const [ovulationConfidence, setOvulationConfidence] = useState<OvulationConfidence | null>(null);
  const [tryingToConceive, _setTryingToConceive] = useState(true);

  const [pcos, setPcos] = useState(false);
  const [endometriosis, setEndometriosis] = useState(false);
  const [thyroidIssue, setThyroidIssue] = useState(false);
  const [previousMiscarriage, setPreviousMiscarriage] = useState(false);
  const [previousIVF, setPreviousIVF] = useState(false);
  const [fibroids, setFibroids] = useState(false);

  const [painSeverity, setPainSeverity] = useState<SymptomSeverity>('low');
  const [irregularBleeding, setIrregularBleeding] = useState(false);
  const [hormonalAcne, setHormonalAcne] = useState(false);
  const [moodSwings, setMoodSwings] = useState<SymptomSeverity>('low');

  const animateTransition = useCallback((_direction: 'next' | 'prev') => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const canProceed = () => {
    switch (STEPS[step].id) {
      case 'disclaimer': return disclaimerAccepted;
      case 'age': return ageRange !== null;
      case 'cycle': return cycleRegularity !== null;
      case 'conceiving': return timeConceiving !== null;
      case 'ovulation': return ovulationConfidence !== null;
      case 'medical': return true;
      case 'symptoms': return true;
      default: return false;
    }
  };

  const goNext = () => {
    if (step < STEPS.length - 1) {
      animateTransition('next');
      setStep(s => s + 1);
    } else {
      void handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 0) {
      animateTransition('prev');
      setStep(s => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (!ageRange || !cycleRegularity || !timeConceiving || !ovulationConfidence) {
      Alert.alert('Missing Info', 'Please complete all required fields.');
      return;
    }

    const input: IVFAssessmentInput = {
      ageRange,
      cycleRegularity,
      timeConceiving,
      ovulationConfidence,
      medicalHistory: { pcos, endometriosis, thyroidIssue, previousMiscarriage, previousIVF, fibroids },
      symptomProfile: { painSeverity, irregularBleeding, hormonalAcne, moodSwings },
      tryingToConceive,
      stressLevel: 'moderate',
    };

    try {
      const result = await runAssessment(input);
      console.log('[IVF Assessment] Completed, score:', result.totalScore);
      router.replace('/ivf-results' as any);
    } catch (error: any) {
      console.error('[IVF Assessment] Error:', error);
      Alert.alert('Error', 'Could not save assessment. Please try again.');
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[step].icon;

  const renderOption = <T extends string>(
    options: OptionItem<T>[],
    selected: T | null,
    onSelect: (val: T) => void,
  ) => (
    <View style={s.optionsContainer}>
      {options.map(opt => {
        const isActive = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[s.optionCard, isActive && s.optionCardActive]}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.7}
            testID={`option-${opt.id}`}
          >
            <View style={[s.optionRadio, isActive && s.optionRadioActive]}>
              {isActive && <View style={s.optionRadioDot} />}
            </View>
            <View style={s.optionContent}>
              <Text style={[s.optionLabel, isActive && s.optionLabelActive]}>{opt.label}</Text>
              <Text style={s.optionDesc}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderToggle = (label: string, value: boolean, onToggle: () => void) => (
    <TouchableOpacity
      style={[s.toggleRow, value && s.toggleRowActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[s.toggleCheckbox, value && s.toggleCheckboxActive]}>
        {value && <Text style={s.toggleCheckmark}>✓</Text>}
      </View>
      <Text style={[s.toggleLabel, value && s.toggleLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStepContent = () => {
    switch (STEPS[step].id) {
      case 'disclaimer':
        return (
          <View>
            <View style={s.disclaimerCard}>
              <LinearGradient
                colors={['#FEF3C7', '#FFFBEB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.disclaimerGradient}
              >
                <AlertTriangle size={28} color="#D97706" />
                <Text style={s.disclaimerTitle}>Readiness Indicator — Not a Diagnosis</Text>
                <Text style={s.disclaimerText}>
                  This tool provides an IVF Readiness Indicator based on self-reported data. It is{' '}
                  <Text style={s.disclaimerBold}>NOT medical advice</Text>,{' '}
                  <Text style={s.disclaimerBold}>NOT a diagnostic tool</Text>, and{' '}
                  <Text style={s.disclaimerBold}>NOT a substitute for professional medical evaluation</Text>.
                </Text>
                <Text style={s.disclaimerText}>
                  The results are informational only and reflect patterns — not certainties. Always consult a qualified fertility specialist for medical decisions.
                </Text>
                <Text style={s.disclaimerText}>
                  By proceeding, you acknowledge that this is a wellness indicator tool only.
                </Text>
              </LinearGradient>
            </View>
            <TouchableOpacity
              style={[s.acceptRow, disclaimerAccepted && s.acceptRowActive]}
              onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
              activeOpacity={0.7}
            >
              <View style={[s.toggleCheckbox, disclaimerAccepted && s.toggleCheckboxActive]}>
                {disclaimerAccepted && <Text style={s.toggleCheckmark}>✓</Text>}
              </View>
              <Text style={s.acceptText}>
                I understand this is a readiness indicator, not a medical diagnosis
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 'age':
        return (
          <View>
            <Text style={s.stepQuestion}>What is your age range?</Text>
            <Text style={s.stepHint}>Age is one of the most significant factors in fertility.</Text>
            {renderOption(AGE_OPTIONS, ageRange, setAgeRange)}
          </View>
        );
      case 'cycle':
        return (
          <View>
            <Text style={s.stepQuestion}>How regular are your menstrual cycles?</Text>
            <Text style={s.stepHint}>Cycle regularity reflects ovulation health.</Text>
            {renderOption(CYCLE_OPTIONS, cycleRegularity, setCycleRegularity)}
          </View>
        );
      case 'conceiving':
        return (
          <View>
            <Text style={s.stepQuestion}>How long have you been trying to conceive?</Text>
            <Text style={s.stepHint}>Time trying is a key indicator for specialist referral.</Text>
            {renderOption(TIME_OPTIONS, timeConceiving, setTimeConceiving)}
          </View>
        );
      case 'ovulation':
        return (
          <View>
            <Text style={s.stepQuestion}>How confident are you about your ovulation?</Text>
            <Text style={s.stepHint}>Based on your tracking, BBT, OPK tests, or cervical mucus observations.</Text>
            {renderOption(OVULATION_OPTIONS, ovulationConfidence, setOvulationConfidence)}
          </View>
        );
      case 'medical':
        return (
          <View>
            <Text style={s.stepQuestion}>Do you have any of these conditions?</Text>
            <Text style={s.stepHint}>Select all that apply. This is self-reported data only.</Text>
            <View style={s.toggleGroup}>
              {renderToggle('PCOS', pcos, () => setPcos(!pcos))}
              {renderToggle('Endometriosis', endometriosis, () => setEndometriosis(!endometriosis))}
              {renderToggle('Thyroid Issues', thyroidIssue, () => setThyroidIssue(!thyroidIssue))}
              {renderToggle('Previous Miscarriage', previousMiscarriage, () => setPreviousMiscarriage(!previousMiscarriage))}
              {renderToggle('Previous IVF Attempt', previousIVF, () => setPreviousIVF(!previousIVF))}
              {renderToggle('Fibroids', fibroids, () => setFibroids(!fibroids))}
            </View>
          </View>
        );
      case 'symptoms':
        return (
          <View>
            <Text style={s.stepQuestion}>Tell us about your symptoms</Text>
            <Text style={s.stepHint}>This helps refine your readiness indicator.</Text>
            <Text style={s.subSectionLabel}>Period Pain Severity</Text>
            {renderOption(SEVERITY_OPTIONS, painSeverity, setPainSeverity)}
            <Text style={s.subSectionLabel}>Mood Swings Severity</Text>
            {renderOption(SEVERITY_OPTIONS, moodSwings, setMoodSwings)}
            <View style={s.toggleGroup}>
              {renderToggle('Irregular Bleeding', irregularBleeding, () => setIrregularBleeding(!irregularBleeding))}
              {renderToggle('Hormonal Acne', hormonalAcne, () => setHormonalAcne(!hormonalAcne))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: 'IVF Readiness Assessment' }} />
      <View style={s.progressContainer}>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={s.progressText}>Step {step + 1} of {STEPS.length}</Text>
      </View>
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={s.stepHeader}>
            <View style={s.stepIconWrap}>
              <StepIcon size={22} color="#D97706" />
            </View>
            <Text style={s.stepTitle}>{STEPS[step].title}</Text>
          </View>
          {renderStepContent()}
        </Animated.View>

        {step === STEPS.length - 1 && (
          <DisclaimerBanner
            type="warning"
            message="This readiness indicator is NOT medical advice and NOT a diagnostic tool. Results are based solely on self-reported data. Always consult a healthcare professional."
            style={{ marginTop: 16 }}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.footerBtn, s.footerBtnBack, step === 0 && { opacity: 0.4 }]}
          onPress={goBack}
          disabled={step === 0}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Colors.foreground} />
          <Text style={s.footerBtnBackText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.footerBtn, s.footerBtnNext, !canProceed() && { opacity: 0.5 }]}
          onPress={goNext}
          disabled={!canProceed() || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={s.footerBtnNextText}>
                {step === STEPS.length - 1 ? 'Get Results' : 'Next'}
              </Text>
              <ChevronRight size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.lilacMid,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    backgroundColor: '#D97706',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    marginTop: 4,
    textAlign: 'right' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  stepHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 10,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
  },
  stepQuestion: {
    fontSize: 17,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 6,
  },
  stepHint: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 19,
    marginBottom: 16,
  },
  subSectionLabel: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  optionCardActive: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  optionRadioActive: {
    borderColor: '#D97706',
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D97706',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 2,
  },
  optionLabelActive: {
    color: '#92400E',
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 16,
  },
  toggleGroup: {
    gap: 8,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  toggleRowActive: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  toggleCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
  },
  toggleCheckboxActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  toggleCheckmark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold' as const,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: Colors.foreground,
  },
  toggleLabelActive: {
    color: '#92400E',
  },
  disclaimerCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerGradient: {
    padding: 20,
    alignItems: 'center' as const,
    gap: 12,
  },
  disclaimerTitle: {
    fontSize: 17,
    fontFamily: fonts.heading.bold,
    color: '#92400E',
    textAlign: 'center' as const,
  },
  disclaimerText: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#78350F',
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  disclaimerBold: {
    fontFamily: fonts.body.bold,
    color: '#92400E',
  },
  acceptRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  acceptRowActive: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  acceptText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: Colors.foreground,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  footerBtnBack: {
    flex: 1,
    backgroundColor: Colors.lilacMid,
  },
  footerBtnBackText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  footerBtnNext: {
    flex: 2,
    backgroundColor: '#D97706',
  },
  footerBtnNextText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
});
