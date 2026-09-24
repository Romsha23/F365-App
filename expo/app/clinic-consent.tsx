import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Shield, Lock, User, FileText, AlertTriangle, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { useClinicStore } from '@/store/clinic-store';
import { useUserStore } from '@/store/user-store';
import { ClinicConsentData } from '@/types/clinic';

export default function ClinicConsentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clinics, submitContactRequest } = useClinicStore();
  const { user } = useUserStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const clinic = clinics.find(c => c.id === id);

  const [shareWithClinic, setShareWithClinic] = useState(false);
  const [shareWithMultiple, setShareWithMultiple] = useState(false);
  const [includeFertilityReport, setIncludeFertilityReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const canSubmit = shareWithClinic && !isSubmitting && !submitted;

  const handleSubmit = async () => {
    if (!canSubmit || !id) return;

    setIsSubmitting(true);
    try {
      const consent: ClinicConsentData = {
        shareWithClinic,
        shareWithMultiple,
        includeFertilityReport,
        selectedClinicIds: shareWithMultiple ? [] : [id],
      };

      await submitContactRequest(id, consent);
      setSubmitted(true);

      Alert.alert(
        'Request Sent',
        'Your contact request has been recorded. The clinic may reach out to you based on the information you shared.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('[ClinicConsent] Submit error:', err);
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!clinic) {
    return (
      <View style={ss.container}>
        <Stack.Screen options={{ title: 'Share Your Details' }} />
        <View style={ss.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const userAge = user?.birthYear
    ? new Date().getFullYear() - user.birthYear
    : undefined;

  return (
    <View style={ss.container}>
      <Stack.Screen options={{ title: 'Share Your Details' }} />
      <ScrollView
        style={ss.scrollView}
        contentContainerStyle={ss.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={ss.headerCard}>
            <View style={ss.headerIcon}>
              <Lock size={24} color="#2563EB" />
            </View>
            <Text style={ss.headerTitle}>Connect with {clinic.name}</Text>
            <Text style={ss.headerSubtitle}>
              You can choose to share your details with this clinic so they can contact you about consultation options.
            </Text>
          </View>

          <View style={ss.dataPreviewCard}>
            <Text style={ss.sectionTitle}>Data that will be shared</Text>

            <View style={ss.dataRow}>
              <User size={15} color="#64748B" />
              <View style={ss.dataContent}>
                <Text style={ss.dataLabel}>Display Name</Text>
                <Text style={ss.dataValue}>{user?.displayName ?? 'Anonymous'}</Text>
              </View>
            </View>

            {userAge && (
              <View style={ss.dataRow}>
                <User size={15} color="#64748B" />
                <View style={ss.dataContent}>
                  <Text style={ss.dataLabel}>Age</Text>
                  <Text style={ss.dataValue}>{userAge}</Text>
                </View>
              </View>
            )}

            {user?.country && (
              <View style={ss.dataRow}>
                <User size={15} color="#64748B" />
                <View style={ss.dataContent}>
                  <Text style={ss.dataLabel}>Location</Text>
                  <Text style={ss.dataValue}>{user.country}</Text>
                </View>
              </View>
            )}

            {includeFertilityReport && (
              <View style={ss.dataRow}>
                <FileText size={15} color="#7C3AED" />
                <View style={ss.dataContent}>
                  <Text style={ss.dataLabel}>Fertility Summary</Text>
                  <Text style={ss.dataValue}>IVF readiness score + key indicators (optional)</Text>
                </View>
              </View>
            )}
          </View>

          <View style={ss.consentSection}>
            <Text style={ss.sectionTitle}>Your Consent</Text>

            <TouchableOpacity
              style={[ss.consentOption, shareWithClinic && ss.consentOptionActive]}
              onPress={() => setShareWithClinic(!shareWithClinic)}
              activeOpacity={0.7}
              testID="consent-share-clinic"
            >
              <View style={[ss.checkbox, shareWithClinic && ss.checkboxChecked]}>
                {shareWithClinic && <Check size={14} color="#FFF" />}
              </View>
              <View style={ss.consentContent}>
                <Text style={ss.consentLabel}>Share with this clinic only</Text>
                <Text style={ss.consentDesc}>Your basic profile will be shared with {clinic.name}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[ss.consentOption, shareWithMultiple && ss.consentOptionActive]}
              onPress={() => setShareWithMultiple(!shareWithMultiple)}
              activeOpacity={0.7}
              testID="consent-share-multiple"
            >
              <View style={[ss.checkbox, shareWithMultiple && ss.checkboxChecked]}>
                {shareWithMultiple && <Check size={14} color="#FFF" />}
              </View>
              <View style={ss.consentContent}>
                <Text style={ss.consentLabel}>Share with up to 3 matched clinics</Text>
                <Text style={ss.consentDesc}>Allow top matched clinics to contact you</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[ss.consentOption, includeFertilityReport && ss.consentOptionActive]}
              onPress={() => setIncludeFertilityReport(!includeFertilityReport)}
              activeOpacity={0.7}
              testID="consent-include-report"
            >
              <View style={[ss.checkbox, includeFertilityReport && ss.checkboxChecked]}>
                {includeFertilityReport && <Check size={14} color="#FFF" />}
              </View>
              <View style={ss.consentContent}>
                <Text style={ss.consentLabel}>Include my fertility report</Text>
                <Text style={ss.consentDesc}>Share your IVF readiness summary with the clinic</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={ss.legalCard}>
            <AlertTriangle size={16} color={Colors.warning} />
            <Text style={ss.legalText}>
              Your information will only be shared with your consent. F365 does not receive payment for patient referrals. You can revoke consent at any time from your profile settings.
            </Text>
          </View>

          <TouchableOpacity
            style={[ss.submitBtn, !canSubmit && ss.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={canSubmit ? 0.7 : 1}
            testID="consent-submit"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={[ss.submitBtnText, !canSubmit && ss.submitBtnTextDisabled]}>
                {submitted ? 'Request Sent' : 'Agree & Continue'}
              </Text>
            )}
          </TouchableOpacity>

          {!shareWithClinic && (
            <Text style={ss.hint}>
              You must agree to share with this clinic to proceed
            </Text>
          )}

          <View style={ss.footer}>
            <Shield size={14} color={Colors.subtext} />
            <Text style={ss.footerText}>
              Your data is encrypted and stored securely. F365 complies with the Australian Privacy Act 1988 and the Australian Privacy Principles.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center' as const,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: '#0F172A',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#475569',
    textAlign: 'center' as const,
    lineHeight: 19,
  },
  dataPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#0F172A',
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dataContent: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: '#94A3B8',
    marginBottom: 1,
  },
  dataValue: {
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: '#0F172A',
  },
  consentSection: {
    marginBottom: 16,
  },
  consentOption: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  consentOptionActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  consentContent: {
    flex: 1,
  },
  consentLabel: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#0F172A',
    marginBottom: 2,
  },
  consentDesc: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#64748B',
    lineHeight: 17,
  },
  legalCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#92400E',
    lineHeight: 18,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
  submitBtnTextDisabled: {
    color: '#94A3B8',
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    padding: 14,
    backgroundColor: Colors.lilacMid,
    borderRadius: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 16,
  },
});
