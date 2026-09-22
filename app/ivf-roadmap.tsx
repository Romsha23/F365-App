import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Route,
  Shield,
  Check,
  ArrowRight,
  Stethoscope,
  TestTube,
  Pill,
  Baby,
  Heart,
  UserCheck,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { TeenGuard } from '@/components/TeenGuard';
import { ReportFeedbackButton } from '@/components/ReportFeedback';
import { useUserStore } from '@/store/user-store';

interface RoadmapStep {
  id: string;
  number: number;
  title: string;
  description: string;
  details: string[];
  duration: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 'gp',
    number: 1,
    title: 'GP / Doctor Visit',
    description: 'Start with your general practitioner for a referral.',
    details: [
      'Discuss your fertility concerns',
      'Get a referral to a fertility specialist',
      'Request initial blood tests',
      'Review your medical history',
      'For AU: GP referral required for Medicare access',
    ],
    duration: '1–2 weeks',
    icon: <UserCheck size={20} color="#2563EB" />,
    color: '#2563EB',
    bgColor: '#EFF6FF',
  },
  {
    id: 'specialist',
    number: 2,
    title: 'Fertility Specialist Consultation',
    description: 'Meet with a reproductive endocrinologist.',
    details: [
      'Review your health history and test results',
      'Physical examination',
      'Discuss treatment options (IUI, IVF, etc.)',
      'Create a preliminary treatment plan',
      'Estimated cost discussion',
    ],
    duration: '30–60 min appointment',
    icon: <Stethoscope size={20} color="#7C3AED" />,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
  },
  {
    id: 'tests',
    number: 3,
    title: 'Diagnostic Tests',
    description: 'Comprehensive fertility testing for both partners.',
    details: [
      'Hormone panel (FSH, LH, AMH, E2)',
      'Ultrasound (antral follicle count)',
      'Semen analysis (male partner)',
      'Tubal patency test (HSG)',
      'Genetic screening (if recommended)',
    ],
    duration: '2–4 weeks',
    icon: <TestTube size={20} color="#059669" />,
    color: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    id: 'stimulation',
    number: 4,
    title: 'Ovarian Stimulation',
    description: 'Medication to stimulate egg production.',
    details: [
      'Daily hormone injections (8–14 days)',
      'Regular monitoring via blood tests & ultrasound',
      'Dosage adjustments as needed',
      'Trigger shot when follicles are ready',
      'Close monitoring of response',
    ],
    duration: '8–14 days',
    icon: <Pill size={20} color="#D97706" />,
    color: '#D97706',
    bgColor: '#FFFBEB',
  },
  {
    id: 'retrieval',
    number: 5,
    title: 'Egg Retrieval',
    description: 'Minor surgical procedure to collect eggs.',
    details: [
      'Performed under light sedation',
      'Takes approximately 20–30 minutes',
      'Ultrasound-guided needle aspiration',
      'Recovery time: few hours to a day',
      'Eggs assessed and fertilized same day',
    ],
    duration: '1 day procedure',
    icon: <Heart size={20} color="#EC4899" />,
    color: '#EC4899',
    bgColor: '#FDF2F8',
  },
  {
    id: 'transfer',
    number: 6,
    title: 'Embryo Transfer',
    description: 'Selected embryo(s) transferred to the uterus.',
    details: [
      'Typically 3–5 days after retrieval',
      'Simple, painless procedure',
      'No sedation usually required',
      'Takes about 15 minutes',
      'Remaining embryos can be frozen',
    ],
    duration: '3–5 days after retrieval',
    icon: <Baby size={20} color="#0891B2" />,
    color: '#0891B2',
    bgColor: '#ECFEFF',
  },
  {
    id: 'wait',
    number: 7,
    title: 'Two-Week Wait & Pregnancy Test',
    description: 'Waiting period before pregnancy can be confirmed.',
    details: [
      'Continue progesterone support as prescribed',
      'Blood test (beta-hCG) after ~14 days',
      'Avoid strenuous activity',
      'Follow specialist instructions',
      'Result confirms pregnancy or next steps',
    ],
    duration: '~14 days',
    icon: <Route size={20} color="#DC2626" />,
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
];

function StepCard({ step, isLast }: { step: RoadmapStep; isLast: boolean }) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = React.useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay: step.number * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: step.number * 80, useNativeDriver: true }),
    ]).start();
  }, [opacityAnim, slideAnim, step.number]);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={ss.stepRow}>
        <View style={ss.timelineColumn}>
          <View style={[ss.stepCircle, { backgroundColor: step.bgColor, borderColor: step.color }]}>
            <Text style={[ss.stepNumber, { color: step.color }]}>{step.number}</Text>
          </View>
          {!isLast && <View style={[ss.timelineLine, { backgroundColor: step.color + '30' }]} />}
        </View>

        <TouchableOpacity
          style={[ss.stepCard, { borderColor: step.color + '30' }]}
          activeOpacity={0.7}
          onPress={() => setExpanded(!expanded)}
        >
          <View style={ss.stepCardHeader}>
            <View style={[ss.stepIconWrap, { backgroundColor: step.bgColor }]}>
              {step.icon}
            </View>
            <View style={ss.stepCardText}>
              <Text style={ss.stepTitle}>{step.title}</Text>
              <Text style={ss.stepDesc}>{step.description}</Text>
              <View style={ss.durationBadge}>
                <Text style={ss.durationText}>{step.duration}</Text>
              </View>
            </View>
          </View>

          {expanded && (
            <View style={ss.stepDetails}>
              {step.details.map((detail, idx) => (
                <View key={idx} style={ss.detailRow}>
                  <Check size={14} color={step.color} />
                  <Text style={ss.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function IVFRoadmapScreen() {
  const { user } = useUserStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <TeenGuard featureName="IVF Journey Roadmap">
      <View style={ss.container}>
        <Stack.Screen options={{ title: 'IVF / Fertility Roadmap' }} />
        <ScrollView
          style={ss.scrollView}
          contentContainerStyle={ss.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DisclaimerBanner
            type="info"
            message="This roadmap is a general guide. Your specialist will create a personalized treatment plan based on your individual needs. Timelines and steps may vary."
            style={{ marginBottom: 12 }}
          />

          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={ss.heroCard}>
              <LinearGradient
                colors={['#ECFEFF', '#CFFAFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={ss.heroGradient}
              >
                <View style={ss.heroIconWrap}>
                  <Route size={26} color="#0891B2" />
                </View>
                <Text style={ss.heroTitle}>Your IVF Journey Roadmap</Text>
                <Text style={ss.heroSubtitle}>
                  A step-by-step guide from first consultation to embryo transfer. Tap each step to see details.
                </Text>
              </LinearGradient>
            </View>

            <View style={ss.stepsContainer}>
              {ROADMAP_STEPS.map((step, idx) => (
                <StepCard key={step.id} step={step} isLast={idx === ROADMAP_STEPS.length - 1} />
              ))}
            </View>

            {user?.country === 'AU' && (
              <View style={ss.auNote}>
                <Text style={ss.auNoteTitle}>Important for Australian Patients</Text>
                <Text style={ss.auNoteText}>
                  A GP referral is required for Medicare rebates on fertility treatments. Discuss with your GP early to ensure you can access available rebates.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={ss.ctaButton}
              onPress={() => router.push('/doctor-questions' as any)}
              activeOpacity={0.7}
            >
              <Text style={ss.ctaButtonText}>Get Questions for Your Doctor</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={ss.legalFooter}>
              <Shield size={14} color={Colors.subtext} />
              <Text style={ss.legalText}>
                This roadmap is for informational purposes only. Individual treatment plans vary. Always follow your healthcare provider's specific instructions and timeline.
              </Text>
            </View>

            <ReportFeedbackButton screenName="ivf-roadmap" style={{ marginTop: 12 }} />

            <View style={{ height: 40 }} />
          </Animated.View>
        </ScrollView>
      </View>
    </TeenGuard>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  heroCard: {
    borderRadius: 20, overflow: 'hidden' as const, marginBottom: 20,
    borderWidth: 1.5, borderColor: '#A5F3FC',
    ...Platform.select({
      ios: { shadowColor: '#0891B2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(8,145,178,0.1)' },
    }),
  },
  heroGradient: { padding: 22, alignItems: 'center' as const },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(8,145,178,0.12)',
    alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 12,
  },
  heroTitle: { fontSize: 19, fontFamily: fonts.heading.bold, color: '#164E63', textAlign: 'center' as const, marginBottom: 6 },
  heroSubtitle: { fontSize: 13, fontFamily: fonts.body.regular, color: '#0E7490', textAlign: 'center' as const, lineHeight: 19 },
  stepsContainer: { marginBottom: 16 },
  stepRow: { flexDirection: 'row' as const, marginBottom: 0 },
  timelineColumn: { width: 44, alignItems: 'center' as const },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    zIndex: 1,
  },
  stepNumber: { fontSize: 14, fontFamily: fonts.body.bold },
  timelineLine: { width: 2, flex: 1, marginVertical: -2 },
  stepCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginLeft: 8, marginBottom: 10,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  stepCardHeader: { flexDirection: 'row' as const, gap: 10, alignItems: 'flex-start' as const },
  stepIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const },
  stepCardText: { flex: 1 },
  stepTitle: { fontSize: 15, fontFamily: fonts.body.semiBold, color: '#0F172A', marginBottom: 3 },
  stepDesc: { fontSize: 12, fontFamily: fonts.body.regular, color: '#475569', lineHeight: 17, marginBottom: 6 },
  durationBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' as const },
  durationText: { fontSize: 11, fontFamily: fonts.body.medium, color: '#64748B' },
  stepDetails: { marginTop: 12, gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  detailRow: { flexDirection: 'row' as const, gap: 8, alignItems: 'flex-start' as const },
  detailText: { flex: 1, fontSize: 13, fontFamily: fonts.body.regular, color: '#374151', lineHeight: 18 },
  auNote: {
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 16,
  },
  auNoteTitle: { fontSize: 14, fontFamily: fonts.body.semiBold, color: '#92400E', marginBottom: 4 },
  auNoteText: { fontSize: 12, fontFamily: fonts.body.regular, color: '#B45309', lineHeight: 17 },
  ctaButton: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    gap: 8, backgroundColor: '#0891B2', paddingVertical: 14, borderRadius: 14, marginBottom: 16,
  },
  ctaButtonText: { fontSize: 15, fontFamily: fonts.body.semiBold, color: '#FFFFFF' },
  legalFooter: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8,
    padding: 14, backgroundColor: Colors.lilacMid, borderRadius: 12,
  },
  legalText: { flex: 1, fontSize: 11, fontFamily: fonts.body.regular, color: Colors.subtext, lineHeight: 16 },
});
