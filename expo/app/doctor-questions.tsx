import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageSquare,
  Shield,
  Check,
  ChevronDown,
  ChevronUp,
  Send,
  Copy,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { TeenGuard } from '@/components/TeenGuard';
import { ReportFeedbackButton } from '@/components/ReportFeedback';
import { useUserStore } from '@/store/user-store';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';

interface DoctorQuestion {
  id: string;
  question_text: string;
  category: string;
  applicable_age_range: string | null;
  applicable_conditions: string[] | null;
  applicable_life_stages: string[] | null;
  is_active: boolean;
  sort_order: number;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: 'General', color: '#2563EB', bg: '#EFF6FF' },
  ivf_process: { label: 'IVF Process', color: '#7C3AED', bg: '#F5F3FF' },
  costs: { label: 'Costs & Insurance', color: '#059669', bg: '#ECFDF5' },
  timeline: { label: 'Timeline', color: '#D97706', bg: '#FFFBEB' },
  risks: { label: 'Risks & Side Effects', color: '#DC2626', bg: '#FEF2F2' },
  success_rates: { label: 'Success Rates', color: '#0891B2', bg: '#ECFEFF' },
  lifestyle: { label: 'Lifestyle', color: '#EC4899', bg: '#FDF2F8' },
  male_fertility: { label: 'Male Fertility', color: '#6366F1', bg: '#EEF2FF' },
  emotional: { label: 'Emotional Support', color: '#F59E0B', bg: '#FFFBEB' },
};

const FALLBACK_QUESTIONS: DoctorQuestion[] = [
  { id: 'f1', question_text: 'Should I consider IVF or IUI first based on my situation?', category: 'general', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 1 },
  { id: 'f2', question_text: 'What diagnostic tests do I need before starting treatment?', category: 'general', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 2 },
  { id: 'f3', question_text: 'What is the expected success rate for someone in my age group?', category: 'success_rates', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 3 },
  { id: 'f4', question_text: 'What are the potential risks and side effects of hormonal stimulation?', category: 'risks', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 4 },
  { id: 'f5', question_text: 'How many IVF cycles should I expect before a successful pregnancy?', category: 'ivf_process', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 5 },
  { id: 'f6', question_text: 'What is the total estimated cost, including medications and monitoring?', category: 'costs', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 6 },
  { id: 'f7', question_text: 'How long is the typical timeline from first consultation to embryo transfer?', category: 'timeline', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 7 },
  { id: 'f8', question_text: 'Do I need hormone testing, and what should my AMH/FSH levels ideally be?', category: 'general', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 8 },
  { id: 'f9', question_text: 'Should my partner have a semen analysis done, and when?', category: 'male_fertility', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 9 },
  { id: 'f10', question_text: 'What lifestyle changes can improve our chances of success?', category: 'lifestyle', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 10 },
  { id: 'f11', question_text: 'Is genetic testing (PGT) recommended for our situation?', category: 'ivf_process', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 11 },
  { id: 'f12', question_text: 'What emotional or psychological support services does the clinic offer?', category: 'emotional', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 12 },
  { id: 'f13', question_text: 'Are there any supplements or medications I should start before treatment?', category: 'lifestyle', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 13 },
  { id: 'f14', question_text: 'What happens to unused embryos — can they be frozen for future use?', category: 'ivf_process', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 14 },
  { id: 'f15', question_text: 'How will my existing health conditions (if any) affect treatment outcomes?', category: 'risks', applicable_age_range: null, applicable_conditions: null, applicable_life_stages: null, is_active: true, sort_order: 15 },
];

function QuestionCard({
  question,
  answer,
  onAnswerChange,
  onSave,
  isSaved,
}: {
  question: DoctorQuestion;
  answer: string;
  onAnswerChange: (text: string) => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_LABELS[question.category] || CATEGORY_LABELS.general;

  return (
    <View style={ss.questionCard}>
      <TouchableOpacity
        style={ss.questionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={ss.questionLeft}>
          <View style={[ss.categoryDot, { backgroundColor: cat.color }]} />
          <Text style={ss.questionText}>{question.question_text}</Text>
        </View>
        {expanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
      </TouchableOpacity>

      {expanded && (
        <View style={ss.answerSection}>
          <Text style={ss.answerLabel}>Your Notes / Answer</Text>
          <TextInput
            style={ss.answerInput}
            value={answer}
            onChangeText={onAnswerChange}
            placeholder="Write your thoughts or the doctor's answer here..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            maxLength={1000}
            textAlignVertical="top"
          />
          <View style={ss.answerActions}>
            <TouchableOpacity
              style={[ss.saveBtn, isSaved && ss.saveBtnSaved]}
              onPress={onSave}
              activeOpacity={0.7}
            >
              {isSaved ? (
                <>
                  <Check size={14} color="#059669" />
                  <Text style={ss.saveBtnTextSaved}>Saved</Text>
                </>
              ) : (
                <>
                  <Send size={14} color="#FFFFFF" />
                  <Text style={ss.saveBtnText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function DoctorQuestionsScreen() {
  const { user, authId } = useUserStore();

  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isLoading, fadeAnim]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      console.log('[DoctorQuestions] Loading questions from DB...');
      const { data, error } = await supabase
        .from('doctor_question_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        if (error.code === '42P01') {
          console.log('[DoctorQuestions] Table does not exist yet, using fallback');
          setQuestions(filterQuestions(FALLBACK_QUESTIONS));
        } else {
          console.error('[DoctorQuestions] Error:', error);
          setQuestions(filterQuestions(FALLBACK_QUESTIONS));
        }
      } else if (data && data.length > 0) {
        setQuestions(filterQuestions(data as DoctorQuestion[]));
        console.log('[DoctorQuestions] Loaded', data.length, 'questions from DB');
      } else {
        setQuestions(filterQuestions(FALLBACK_QUESTIONS));
        console.log('[DoctorQuestions] No DB questions, using fallback');
      }
    } catch (err) {
      console.error('[DoctorQuestions] Unexpected error:', err);
      setQuestions(filterQuestions(FALLBACK_QUESTIONS));
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuestions = (allQuestions: DoctorQuestion[]): DoctorQuestion[] => {
    return allQuestions.filter(q => {
      if (q.applicable_life_stages && q.applicable_life_stages.length > 0 && user?.lifeStage) {
        if (!q.applicable_life_stages.includes(user.lifeStage)) return false;
      }
      return true;
    });
  };

  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
    setSavedAnswers(prev => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  };

  const handleSaveAnswer = async (questionId: string, questionText: string) => {
    const answer = answers[questionId]?.trim();
    if (!answer) {
      Alert.alert('Required', 'Please write an answer before saving.');
      return;
    }

    try {
      if (authId) {
        const { error } = await supabase
          .from('user_doctor_qa_responses')
          .upsert({
            user_id: authId,
            question_id: questionId,
            question_text: questionText,
            user_answer: answer,
          }, {
            onConflict: 'user_id,question_id',
          });

        if (error && error.code !== '42P01') {
          console.error('[DoctorQuestions] Save error:', error);
        } else {
          console.log('[DoctorQuestions] Answer saved for question:', questionId);
        }
      }

      setSavedAnswers(prev => new Set(prev).add(questionId));
    } catch (err) {
      console.error('[DoctorQuestions] Save error:', err);
    }
  };

  const handleCopyAll = async () => {
    const allText = questions
      .map((q, idx) => {
        const a = answers[q.id]?.trim();
        return `${idx + 1}. ${q.question_text}${a ? `\n   Answer: ${a}` : ''}`;
      })
      .join('\n\n');

    try {
      await Clipboard.setStringAsync(allText);
      Alert.alert('Copied', 'All questions have been copied to your clipboard.');
    } catch (err) {
      console.error('[DoctorQuestions] Copy error:', err);
    }
  };

  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category)))];
  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter(q => q.category === selectedCategory);

  return (
    <TeenGuard featureName="Doctor Question Generator">
      <View style={ss.container}>
        <Stack.Screen options={{ title: 'Questions for Your Doctor' }} />
        <ScrollView
          style={ss.scrollView}
          contentContainerStyle={ss.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DisclaimerBanner
            type="info"
            message="These questions are for informational purposes to help guide your conversation with a healthcare professional. They are not medical advice."
            style={{ marginBottom: 12 }}
          />

          <View style={ss.heroCard}>
            <LinearGradient
              colors={['#FEF2F2', '#FEE2E2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.heroGradient}
            >
              <View style={ss.heroIconWrap}>
                <MessageSquare size={26} color="#DC2626" />
              </View>
              <Text style={ss.heroTitle}>Questions for Your Doctor</Text>
              <Text style={ss.heroSubtitle}>
                Tailored questions based on your profile. Tap any question to add notes or record answers.
              </Text>
            </LinearGradient>
          </View>

          {isLoading ? (
            <View style={ss.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={ss.loadingText}>Loading questions...</Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={ss.categoryScroll}
                contentContainerStyle={ss.categoryScrollContent}
              >
                {categories.map(cat => {
                  const catInfo = cat === 'all'
                    ? { label: 'All', color: Colors.primary, bg: Colors.lilacMid }
                    : (CATEGORY_LABELS[cat] || { label: cat, color: '#6B7280', bg: '#F3F4F6' });
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[ss.categoryChip, selectedCategory === cat && { backgroundColor: catInfo.color }]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[ss.categoryChipText, selectedCategory === cat && { color: '#FFFFFF' }]}>
                        {catInfo.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={ss.countRow}>
                <Text style={ss.questionCount}>
                  {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
                </Text>
                <TouchableOpacity style={ss.copyAllBtn} onPress={handleCopyAll} activeOpacity={0.7}>
                  <Copy size={14} color="#6366F1" />
                  <Text style={ss.copyAllText}>Copy All</Text>
                </TouchableOpacity>
              </View>

              {filteredQuestions.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  answer={answers[q.id] || ''}
                  onAnswerChange={(text) => handleAnswerChange(q.id, text)}
                  onSave={() => handleSaveAnswer(q.id, q.question_text)}
                  isSaved={savedAnswers.has(q.id)}
                />
              ))}
            </Animated.View>
          )}

          <View style={ss.legalFooter}>
            <Shield size={14} color={Colors.subtext} />
            <Text style={ss.legalText}>
              Questions are generated from approved templates reviewed by the F365 team. Your answers are stored securely. This is not medical advice — always consult your healthcare provider.
            </Text>
          </View>

          <ReportFeedbackButton
            screenName="doctor-questions"
            style={{ marginTop: 12 }}
          />

          <View style={{ height: 40 }} />
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
    borderRadius: 20, overflow: 'hidden' as const, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#FECACA',
    ...Platform.select({
      ios: { shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(220,38,38,0.1)' },
    }),
  },
  heroGradient: { padding: 22, alignItems: 'center' as const },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(220,38,38,0.12)',
    alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 12,
  },
  heroTitle: { fontSize: 19, fontFamily: fonts.heading.bold, color: '#991B1B', textAlign: 'center' as const, marginBottom: 6 },
  heroSubtitle: { fontSize: 13, fontFamily: fonts.body.regular, color: '#B91C1C', textAlign: 'center' as const, lineHeight: 19 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' as const, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: fonts.body.medium, color: Colors.subtext },
  categoryScroll: { marginBottom: 12 },
  categoryScrollContent: { gap: 8, paddingRight: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  categoryChipText: { fontSize: 12, fontFamily: fonts.body.semiBold, color: '#64748B' },
  countRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 },
  questionCount: { fontSize: 13, fontFamily: fonts.body.medium, color: Colors.subtext },
  copyAllBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EEF2FF', borderRadius: 8 },
  copyAllText: { fontSize: 12, fontFamily: fonts.body.semiBold, color: '#6366F1' },
  questionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
    }),
  },
  questionHeader: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, padding: 14, gap: 10 },
  questionLeft: { flex: 1, flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  questionText: { flex: 1, fontSize: 14, fontFamily: fonts.body.medium, color: '#0F172A', lineHeight: 20 },
  answerSection: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  answerLabel: { fontSize: 12, fontFamily: fonts.body.semiBold, color: '#64748B', marginTop: 10, marginBottom: 6 },
  answerInput: {
    backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, fontSize: 13, fontFamily: fonts.body.regular, color: '#111827', minHeight: 70,
  },
  answerActions: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, marginTop: 8 },
  saveBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  saveBtnSaved: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  saveBtnText: { fontSize: 13, fontFamily: fonts.body.semiBold, color: '#FFFFFF' },
  saveBtnTextSaved: { fontSize: 13, fontFamily: fonts.body.semiBold, color: '#059669' },
  legalFooter: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8,
    padding: 14, backgroundColor: Colors.lilacMid, borderRadius: 12, marginTop: 16,
  },
  legalText: { flex: 1, fontSize: 11, fontFamily: fonts.body.regular, color: Colors.subtext, lineHeight: 16 },
});
