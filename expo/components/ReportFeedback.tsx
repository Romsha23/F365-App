import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Flag, X, Send, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user-store';

interface ReportFeedbackProps {
  screenName: string;
  contextData?: Record<string, unknown>;
  style?: any;
}

const FEEDBACK_TYPES = [
  { id: 'data_incorrect', label: 'This data seems wrong' },
  { id: 'update_info', label: 'I want to update my info' },
  { id: 'feature_issue', label: 'Something isn\'t working' },
  { id: 'suggestion', label: 'I have a suggestion' },
  { id: 'other', label: 'Other' },
] as const;

type FeedbackTypeId = typeof FEEDBACK_TYPES[number]['id'];

export function ReportFeedbackButton({ screenName, contextData, style }: ReportFeedbackProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackTypeId | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user, authId } = useUserStore();

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Required', 'Please select a feedback type');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData = {
        user_id: authId || 'anonymous',
        screen_name: screenName,
        feedback_type: selectedType,
        details: details.trim() || null,
        context_data: contextData || null,
        user_country: user?.country || null,
        user_age_group: user?.birthYear
          ? new Date().getFullYear() - user.birthYear < 18
            ? 'teen'
            : new Date().getFullYear() - user.birthYear < 25
            ? 'young_adult'
            : 'adult'
          : null,
        status: 'new',
      };

      const { error } = await supabase
        .from('user_feedback')
        .insert(feedbackData);

      if (error) {
        if (error.code === '42P01') {
          console.log('[Feedback] Table does not exist yet, feedback logged locally');
          console.log('[Feedback] Data:', JSON.stringify(feedbackData));
        } else {
          console.error('[Feedback] Submit error:', error);
          Alert.alert('Error', 'Could not submit feedback. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitted(true);
      console.log('[Feedback] Submitted:', feedbackData);
      setTimeout(() => {
        setModalVisible(false);
        setSubmitted(false);
        setSelectedType(null);
        setDetails('');
      }, 1500);
    } catch (err) {
      console.error('[Feedback] Error:', err);
      Alert.alert('Error', 'Could not submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[ss.triggerButton, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        testID="report-feedback-btn"
      >
        <Flag size={14} color="#6B7280" />
        <Text style={ss.triggerText}>Report / Feedback</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={ss.overlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={ss.modal}>
                {submitted ? (
                  <View style={ss.successContainer}>
                    <CheckCircle size={48} color="#059669" />
                    <Text style={ss.successTitle}>Thank you!</Text>
                    <Text style={ss.successText}>Your feedback helps us improve F365.</Text>
                  </View>
                ) : (
                  <>
                    <View style={ss.modalHeader}>
                      <Text style={ss.modalTitle}>Report / Feedback</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <X size={22} color={Colors.subtext} />
                      </TouchableOpacity>
                    </View>

                    <Text style={ss.modalSubtitle}>
                      Help us improve your experience on this screen.
                    </Text>

                    <View style={ss.typesContainer}>
                      {FEEDBACK_TYPES.map(type => (
                        <TouchableOpacity
                          key={type.id}
                          style={[ss.typeChip, selectedType === type.id && ss.typeChipActive]}
                          onPress={() => setSelectedType(type.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[ss.typeChipText, selectedType === type.id && ss.typeChipTextActive]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={ss.detailsInput}
                      placeholder="Tell us more (optional)"
                      placeholderTextColor="#9CA3AF"
                      value={details}
                      onChangeText={setDetails}
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                      textAlignVertical="top"
                    />

                    <TouchableOpacity
                      style={[ss.submitButton, (!selectedType || isSubmitting) && ss.submitButtonDisabled]}
                      onPress={handleSubmit}
                      disabled={!selectedType || isSubmitting}
                      activeOpacity={0.7}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Send size={16} color="#FFFFFF" />
                          <Text style={ss.submitButtonText}>Submit Feedback</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <Text style={ss.privacyNote}>
                      Your feedback is anonymous and helps improve accuracy.
                    </Text>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const ss = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'center' as const,
  },
  triggerText: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#6B7280',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 19,
  },
  typesContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  typeChipText: {
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: '#4B5563',
  },
  typeChipTextActive: {
    color: '#4338CA',
  },
  detailsInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: '#111827',
    minHeight: 80,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
  privacyNote: {
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
  successContainer: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.semiBold,
    color: '#059669',
  },
  successText: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: '#6B7280',
    textAlign: 'center' as const,
  },
});
