import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Stethoscope,
  Video,
  Shield,
  Award,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { useClinicStore } from '@/store/clinic-store';
import { useUserStore } from '@/store/user-store';
import { getCountryConfig } from '@/utils/clinic-matching';

export default function ClinicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clinics, matchResults, contactRequests } = useClinicStore();
  const { user } = useUserStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const clinic = clinics.find(c => c.id === id);
  const matchResult = matchResults.find(r => r.clinic.id === id);
  const hasExistingRequest = contactRequests.some(r => r.clinicId === id);
  const config = getCountryConfig(user?.country ?? 'AU');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!clinic) {
    return (
      <View style={ss.container}>
        <Stack.Screen options={{ title: 'Clinic Details' }} />
        <View style={ss.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={ss.loadingText}>Loading clinic details...</Text>
        </View>
      </View>
    );
  }

  const scoreColor = (matchResult?.matchScore ?? 0) >= 70 ? '#2563EB' : (matchResult?.matchScore ?? 0) >= 50 ? '#6366F1' : '#94A3B8';

  return (
    <View style={ss.container}>
      <Stack.Screen options={{ title: clinic.name }} />
      <ScrollView
        style={ss.scrollView}
        contentContainerStyle={ss.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={ss.headerCard}>
            <View style={ss.headerTop}>
              <View style={ss.headerLeft}>
                <Text style={ss.clinicName}>{clinic.name}</Text>
                <View style={ss.locationRow}>
                  <MapPin size={14} color={Colors.subtext} />
                  <Text style={ss.locationText}>{clinic.city}, {clinic.state}, {clinic.country}</Text>
                </View>
              </View>
              {matchResult && (
                <View style={[ss.scoreBadge, { backgroundColor: scoreColor + '12' }]}>
                  <Text style={[ss.scoreLabel, { color: scoreColor }]}>Match</Text>
                  <Text style={[ss.scoreValue, { color: scoreColor }]}>{matchResult.matchScore}%</Text>
                </View>
              )}
            </View>

            {clinic.accreditation ? (
              <View style={ss.accreditationRow}>
                <Award size={14} color="#059669" />
                <Text style={ss.accreditationText}>{clinic.accreditation}</Text>
              </View>
            ) : null}

            {clinic.description ? (
              <Text style={ss.description}>{clinic.description}</Text>
            ) : null}
          </View>

          {matchResult && matchResult.matchReasons.length > 0 && (
            <View style={ss.matchReasonsCard}>
              <Text style={ss.sectionTitle}>Why this matches you</Text>
              {matchResult.matchReasons.map((reason, idx) => (
                <View key={idx} style={ss.reasonRow}>
                  <Text style={ss.reasonCheck}>✓</Text>
                  <Text style={ss.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={ss.servicesCard}>
            <Text style={ss.sectionTitle}>Services Offered</Text>
            <View style={ss.servicesGrid}>
              {clinic.services.map((service, idx) => (
                <View key={idx} style={ss.serviceChip}>
                  <Text style={ss.serviceChipText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={ss.detailsCard}>
            <Text style={ss.sectionTitle}>Clinic Information</Text>

            <View style={ss.detailRow}>
              <Clock size={16} color="#64748B" />
              <View style={ss.detailContent}>
                <Text style={ss.detailLabel}>Wait Time</Text>
                <Text style={ss.detailValue}>{clinic.waitTime}</Text>
              </View>
            </View>

            <View style={ss.detailRow}>
              <Clock size={16} color="#64748B" />
              <View style={ss.detailContent}>
                <Text style={ss.detailLabel}>Operating Hours</Text>
                <Text style={ss.detailValue}>{clinic.operatingHours}</Text>
              </View>
            </View>

            {clinic.gpReferralRequired && (
              <View style={ss.detailRow}>
                <Stethoscope size={16} color="#D97706" />
                <View style={ss.detailContent}>
                  <Text style={ss.detailLabel}>GP Referral</Text>
                  <Text style={[ss.detailValue, { color: '#D97706' }]}>Required</Text>
                </View>
              </View>
            )}

            {clinic.telehealthAvailable && (
              <View style={ss.detailRow}>
                <Video size={16} color="#2563EB" />
                <View style={ss.detailContent}>
                  <Text style={ss.detailLabel}>Telehealth</Text>
                  <Text style={[ss.detailValue, { color: '#2563EB' }]}>Available</Text>
                </View>
              </View>
            )}

            {clinic.medicareAccepted && (
              <View style={ss.detailRow}>
                <Shield size={16} color="#059669" />
                <View style={ss.detailContent}>
                  <Text style={ss.detailLabel}>Medicare</Text>
                  <Text style={[ss.detailValue, { color: '#059669' }]}>Accepted</Text>
                </View>
              </View>
            )}

            {clinic.packagesAvailable && (
              <View style={ss.detailRow}>
                <Award size={16} color="#7C3AED" />
                <View style={ss.detailContent}>
                  <Text style={ss.detailLabel}>Packages</Text>
                  <Text style={[ss.detailValue, { color: '#7C3AED' }]}>Consultation packages available</Text>
                </View>
              </View>
            )}
          </View>

          <View style={ss.contactCard}>
            <Text style={ss.sectionTitle}>Contact</Text>

            {clinic.phone ? (
              <TouchableOpacity
                style={ss.contactRow}
                onPress={() => Linking.openURL(`tel:${clinic.phone}`)}
                activeOpacity={0.7}
              >
                <Phone size={16} color="#2563EB" />
                <Text style={ss.contactValue}>{clinic.phone}</Text>
                <ExternalLink size={14} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}

            {clinic.website ? (
              <TouchableOpacity
                style={ss.contactRow}
                onPress={() => Linking.openURL(clinic.website)}
                activeOpacity={0.7}
              >
                <Globe size={16} color="#2563EB" />
                <Text style={ss.contactValue} numberOfLines={1}>{clinic.website}</Text>
                <ExternalLink size={14} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {config.referralNote && clinic.gpReferralRequired && (
            <View style={ss.referralNote}>
              <Stethoscope size={16} color="#9A3412" />
              <Text style={ss.referralNoteText}>{config.referralNote}</Text>
            </View>
          )}

          <View style={ss.actions}>
            <TouchableOpacity
              style={[ss.primaryBtn, hasExistingRequest && ss.primaryBtnDisabled]}
              onPress={hasExistingRequest ? undefined : () => router.push(`/clinic-consent?id=${clinic.id}` as any)}
              activeOpacity={hasExistingRequest ? 1 : 0.7}
              testID="clinic-detail-request"
            >
              <Text style={[ss.primaryBtnText, hasExistingRequest && ss.primaryBtnTextDisabled]}>
                {hasExistingRequest ? 'Contact Already Requested' : config.ctaText}
              </Text>
              {!hasExistingRequest && <ChevronRight size={18} color="#FFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={ss.secondaryBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={ss.secondaryBtnText}>Back to Results</Text>
            </TouchableOpacity>
          </View>

          <View style={ss.legalFooter}>
            <Shield size={14} color={Colors.subtext} />
            <Text style={ss.legalFooterText}>
              F365 does not receive payment for patient referrals. This information is provided for your convenience and does not constitute a recommendation or endorsement.
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  clinicName: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  scoreBadge: {
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 58,
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: fonts.body.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 22,
    fontFamily: fonts.heading.bold,
  },
  accreditationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  accreditationText: {
    fontSize: 12,
    fontFamily: fonts.body.semiBold,
    color: '#059669',
  },
  description: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#475569',
    lineHeight: 20,
  },
  matchReasonsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#0F172A',
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    marginBottom: 6,
  },
  reasonCheck: {
    fontSize: 14,
    color: '#059669',
    fontFamily: fonts.body.bold,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#334155',
    lineHeight: 19,
  },
  servicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servicesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  serviceChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  serviceChipText: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#1D4ED8',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#64748B',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#0F172A',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: '#2563EB',
  },
  referralNote: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 16,
  },
  referralNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#9A3412',
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2563EB',
  },
  primaryBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
  primaryBtnTextDisabled: {
    color: '#94A3B8',
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center' as const,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#475569',
  },
  legalFooter: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    padding: 14,
    backgroundColor: Colors.lilacMid,
    borderRadius: 12,
  },
  legalFooterText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 16,
  },
});
