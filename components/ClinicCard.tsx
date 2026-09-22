import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { MapPin, Clock, Stethoscope, Video, ChevronDown, ChevronUp, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { ClinicMatchResult } from '@/types/clinic';
import { getCountryConfig } from '@/utils/clinic-matching';

interface ClinicCardProps {
  result: ClinicMatchResult;
  userCountry: string;
  onViewDetails: () => void;
  onRequestContact: () => void;
  hasExistingRequest?: boolean;
}

export const ClinicCard: React.FC<ClinicCardProps> = React.memo(({
  result,
  userCountry,
  onViewDetails,
  onRequestContact,
  hasExistingRequest = false,
}) => {
  const { clinic, matchScore, matchReasons } = result;
  const config = getCountryConfig(userCountry);
  const [expanded, setExpanded] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const scoreColor = matchScore >= 70 ? '#2563EB' : matchScore >= 50 ? '#6366F1' : '#94A3B8';
  const scoreBg = matchScore >= 70 ? '#EFF6FF' : matchScore >= 50 ? '#EEF2FF' : '#F8FAFC';

  return (
    <Animated.View style={[ss.card, { opacity: fadeAnim }]}>
      <View style={ss.header}>
        <View style={ss.headerLeft}>
          <Text style={ss.clinicName} numberOfLines={2}>{clinic.name}</Text>
          <View style={ss.locationRow}>
            <MapPin size={13} color={Colors.subtext} />
            <Text style={ss.locationText}>{clinic.city}, {clinic.state}</Text>
          </View>
        </View>
        <View style={[ss.scoreBadge, { backgroundColor: scoreBg }]}>
          <Text style={[ss.scoreLabel, { color: scoreColor }]}>Match</Text>
          <Text style={[ss.scoreValue, { color: scoreColor }]}>{matchScore}%</Text>
        </View>
      </View>

      <View style={ss.tagsRow}>
        {clinic.services.slice(0, 4).map((service, idx) => (
          <View key={idx} style={ss.tag}>
            <Text style={ss.tagText}>{service}</Text>
          </View>
        ))}
        {clinic.services.length > 4 && (
          <View style={[ss.tag, ss.tagMore]}>
            <Text style={ss.tagMoreText}>+{clinic.services.length - 4}</Text>
          </View>
        )}
      </View>

      <View style={ss.infoGrid}>
        <View style={ss.infoItem}>
          <Clock size={14} color="#64748B" />
          <Text style={ss.infoLabel}>Wait: {clinic.waitTime}</Text>
        </View>
        {config.showGPRequired && clinic.gpReferralRequired && (
          <View style={ss.infoItem}>
            <Stethoscope size={14} color="#64748B" />
            <Text style={ss.infoLabel}>GP Referral Required</Text>
          </View>
        )}
        {clinic.telehealthAvailable && (
          <View style={ss.infoItem}>
            <Video size={14} color="#2563EB" />
            <Text style={[ss.infoLabel, { color: '#2563EB' }]}>Telehealth</Text>
          </View>
        )}
        {config.showMedicareInfo && clinic.medicareAccepted && (
          <View style={ss.infoItem}>
            <Shield size={14} color="#059669" />
            <Text style={[ss.infoLabel, { color: '#059669' }]}>Medicare</Text>
          </View>
        )}
      </View>

      {config.referralNote && clinic.gpReferralRequired && (
        <View style={ss.referralNote}>
          <Text style={ss.referralNoteText}>{config.referralNote}</Text>
        </View>
      )}

      <TouchableOpacity
        style={ss.whyMatchBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        testID="clinic-why-match"
      >
        <Text style={ss.whyMatchText}>Why this matches you</Text>
        {expanded ? (
          <ChevronUp size={16} color={Colors.primary} />
        ) : (
          <ChevronDown size={16} color={Colors.primary} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={ss.reasonsContainer}>
          {matchReasons.map((reason, idx) => (
            <View key={idx} style={ss.reasonRow}>
              <Text style={ss.reasonCheck}>✓</Text>
              <Text style={ss.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={ss.actions}>
        <TouchableOpacity
          style={ss.detailsBtn}
          onPress={onViewDetails}
          activeOpacity={0.7}
          testID="clinic-view-details"
        >
          <Text style={ss.detailsBtnText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ss.contactBtn, hasExistingRequest && ss.contactBtnDisabled]}
          onPress={hasExistingRequest ? undefined : onRequestContact}
          activeOpacity={hasExistingRequest ? 1 : 0.7}
          testID="clinic-request-contact"
        >
          <Text style={[ss.contactBtnText, hasExistingRequest && ss.contactBtnTextDisabled]}>
            {hasExistingRequest ? 'Requested' : config.ctaText}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const ss = StyleSheet.create({
  card: {
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
  header: {
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
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: '#0F172A',
    lineHeight: 22,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 54,
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: fonts.body.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  scoreValue: {
    fontSize: 18,
    fontFamily: fonts.heading.bold,
  },
  tagsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: '#475569',
  },
  tagMore: {
    backgroundColor: '#E2E8F0',
  },
  tagMoreText: {
    fontSize: 11,
    fontFamily: fonts.body.semiBold,
    color: '#64748B',
  },
  infoGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#64748B',
  },
  referralNote: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  referralNoteText: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: '#9A3412',
    lineHeight: 16,
  },
  whyMatchBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 4,
  },
  whyMatchText: {
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: Colors.primary,
  },
  reasonsContainer: {
    backgroundColor: '#FAFBFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  reasonRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
  },
  reasonCheck: {
    fontSize: 13,
    color: '#059669',
    fontFamily: fonts.body.bold,
    marginTop: 1,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#334155',
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 4,
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center' as const,
  },
  detailsBtnText: {
    fontSize: 13,
    fontFamily: fonts.body.semiBold,
    color: '#475569',
  },
  contactBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center' as const,
  },
  contactBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  contactBtnText: {
    fontSize: 13,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
  contactBtnTextDisabled: {
    color: '#94A3B8',
  },
});
