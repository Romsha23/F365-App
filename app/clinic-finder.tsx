import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Search, Filter, MapPin, Info, Shield, HelpCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { ClinicCard } from '@/components/ClinicCard';
import { useClinicStore } from '@/store/clinic-store';
import { useUserStore } from '@/store/user-store';
import { useIVFReadinessStore } from '@/store/ivf-readiness-store';
import { ClinicMatchInput } from '@/types/clinic';
import { calculateAgeFromBirthMonthYear } from '@/types/user';

const SERVICE_FILTERS = ['IVF', 'ICSI', 'Egg Freezing', 'IUI', 'PGT', 'Donor Program', 'Male Fertility'];

const COUNTRY_TABS = [
  { code: '', label: 'All' },
  { code: 'AU', label: '🇦🇺 AU' },
  { code: 'IN', label: '🇮🇳 IN' },
  { code: 'PK', label: '🇵🇰 PK' },
  { code: 'US', label: '🇺🇸 US' },
  { code: 'UK', label: '🇬🇧 UK' },
];

export default function ClinicFinderScreen() {
  const { clinics, matchResults, isLoading, loadClinics, runMatching, contactRequests, loadContactRequests } = useClinicStore();
  const { user } = useUserStore();
  const { currentAssessment } = useIVFReadinessStore();

  const [selectedCountry, setSelectedCountry] = useState<string>(user?.country ?? '');
  const [selectedServices, setSelectedServices] = useState<string[]>(['IVF']);
  const [preferLowWait, setPreferLowWait] = useState(false);
  const [preferTelehealth, setPreferTelehealth] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const userAge = calculateAgeFromBirthMonthYear(user?.birthMonth, user?.birthYear);

  useEffect(() => {
    void loadClinics();
    void loadContactRequests();
  }, [loadClinics, loadContactRequests]);

  useEffect(() => {
    if (clinics.length > 0) {
      const input: ClinicMatchInput = {
        userCountry: selectedCountry || user?.country || 'AU',
        userAge,
        ivfReadinessScore: currentAssessment?.totalScore,
        preferredServices: selectedServices,
        preferLowWaitTime: preferLowWait,
        preferTelehealth: preferTelehealth,
      };
      runMatching(input);
    }
  }, [clinics, selectedCountry, selectedServices, preferLowWait, preferTelehealth, user?.country, userAge, currentAssessment?.totalScore, runMatching]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const toggleService = useCallback((service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  }, []);

  const filteredResults = selectedCountry
    ? matchResults.filter(r => r.clinic.country === selectedCountry)
    : matchResults;

  const requestedClinicIds = new Set(contactRequests.map(r => r.clinicId));

  return (
    <View style={ss.container}>
      <Stack.Screen options={{ title: 'Find a Clinic' }} />
      <ScrollView
        style={ss.scrollView}
        contentContainerStyle={ss.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DisclaimerBanner
          type="info"
          message="F365 does not receive payment for patient referrals. Clinic matching is based on your profile and preferences only."
          style={{ marginBottom: 12 }}
        />

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={ss.heroCard}>
            <View style={ss.heroIconRow}>
              <View style={ss.heroIconBg}>
                <MapPin size={22} color="#2563EB" />
              </View>
              <View style={ss.heroTextContainer}>
                <Text style={ss.heroTitle}>Connect with a fertility clinic</Text>
                <Text style={ss.heroSubtitle}>
                  Based on your profile, we've matched clinics that may be right for you.
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={ss.countryTabs}
            contentContainerStyle={ss.countryTabsContent}
          >
            {COUNTRY_TABS.map(tab => (
              <TouchableOpacity
                key={tab.code}
                style={[ss.countryTab, selectedCountry === tab.code && ss.countryTabActive]}
                onPress={() => setSelectedCountry(tab.code)}
                activeOpacity={0.7}
              >
                <Text style={[ss.countryTabText, selectedCountry === tab.code && ss.countryTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={ss.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
          >
            <Filter size={16} color={Colors.primary} />
            <Text style={ss.filterToggleText}>
              {showFilters ? 'Hide Filters' : 'Refine Matching'}
            </Text>
            <Text style={ss.filterCount}>
              {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>

          {showFilters && (
            <View style={ss.filtersCard}>
              <Text style={ss.filterSectionTitle}>Preferred Services</Text>
              <View style={ss.filterChips}>
                {SERVICE_FILTERS.map(service => (
                  <TouchableOpacity
                    key={service}
                    style={[ss.filterChip, selectedServices.includes(service) && ss.filterChipActive]}
                    onPress={() => toggleService(service)}
                    activeOpacity={0.7}
                  >
                    <Text style={[ss.filterChipText, selectedServices.includes(service) && ss.filterChipTextActive]}>
                      {service}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[ss.filterSectionTitle, { marginTop: 12 }]}>Preferences</Text>
              <View style={ss.prefRow}>
                <TouchableOpacity
                  style={[ss.prefChip, preferLowWait && ss.prefChipActive]}
                  onPress={() => setPreferLowWait(!preferLowWait)}
                  activeOpacity={0.7}
                >
                  <Text style={[ss.prefChipText, preferLowWait && ss.prefChipTextActive]}>
                    ⏱ Low Wait Time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ss.prefChip, preferTelehealth && ss.prefChipActive]}
                  onPress={() => setPreferTelehealth(!preferTelehealth)}
                  activeOpacity={0.7}
                >
                  <Text style={[ss.prefChipText, preferTelehealth && ss.prefChipTextActive]}>
                    💻 Telehealth
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isLoading ? (
            <View style={ss.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={ss.loadingText}>Finding clinics...</Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={ss.emptyContainer}>
              <Search size={40} color={Colors.subtext} />
              <Text style={ss.emptyTitle}>No clinics found</Text>
              <Text style={ss.emptySubtitle}>Try adjusting your country or service filters</Text>
            </View>
          ) : (
            <>
              <Text style={ss.resultsCount}>
                {filteredResults.length} clinic{filteredResults.length !== 1 ? 's' : ''} matched
              </Text>
              {filteredResults.map(result => (
                <ClinicCard
                  key={result.clinic.id}
                  result={result}
                  userCountry={user?.country ?? 'AU'}
                  onViewDetails={() => router.push(`/clinic-detail?id=${result.clinic.id}` as any)}
                  onRequestContact={() => router.push(`/clinic-consent?id=${result.clinic.id}` as any)}
                  hasExistingRequest={requestedClinicIds.has(result.clinic.id)}
                />
              ))}
            </>
          )}

          <View style={ss.decisionHelpers}>
            <Text style={ss.helperTitle}>Before you choose a clinic</Text>

            <View style={ss.helperCard}>
              <HelpCircle size={18} color="#2563EB" />
              <View style={ss.helperContent}>
                <Text style={ss.helperCardTitle}>Questions to ask</Text>
                <Text style={ss.helperItem}>• What tests are required before IVF?</Text>
                <Text style={ss.helperItem}>• What are typical timelines?</Text>
                <Text style={ss.helperItem}>• What costs are involved?</Text>
                <Text style={ss.helperItem}>• What is the clinic's success rate for my age group?</Text>
              </View>
            </View>

            <View style={ss.helperCard}>
              <Info size={18} color="#059669" />
              <View style={ss.helperContent}>
                <Text style={ss.helperCardTitle}>What to expect</Text>
                <Text style={ss.helperItem}>• First consultation: 30–45 mins</Text>
                <Text style={ss.helperItem}>• Initial tests before treatment</Text>
                <Text style={ss.helperItem}>• Personalised treatment plan</Text>
              </View>
            </View>

            {currentAssessment && currentAssessment.category !== 'low' && (
              <View style={ss.suggestedStep}>
                <Text style={ss.suggestedStepTitle}>Suggested next step</Text>
                <Text style={ss.suggestedStepText}>
                  Based on your profile, consulting a fertility specialist within the next 3 months may improve outcomes.
                </Text>
              </View>
            )}
          </View>

          <View style={ss.legalFooter}>
            <Shield size={14} color={Colors.subtext} />
            <Text style={ss.legalText}>
              F365 does not receive payment for patient referrals. Clinic matching uses a neutral algorithm based on location, services, and user preferences. Your information is only shared with your explicit consent. This is not medical advice.
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
  heroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  heroIconRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  heroIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontFamily: fonts.heading.semiBold,
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#475569',
    lineHeight: 19,
  },
  countryTabs: {
    marginBottom: 12,
  },
  countryTabsContent: {
    gap: 8,
    paddingRight: 8,
  },
  countryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  countryTabText: {
    fontSize: 13,
    fontFamily: fonts.body.semiBold,
    color: '#475569',
  },
  countryTabTextActive: {
    color: '#FFFFFF',
  },
  filterToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  filterToggleText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: Colors.primary,
  },
  filterCount: {
    fontSize: 11,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontFamily: fonts.body.semiBold,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#2563EB',
  },
  prefRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  prefChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center' as const,
  },
  prefChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  prefChipText: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: '#64748B',
  },
  prefChipTextActive: {
    color: '#2563EB',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center' as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center' as const,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: Colors.subtext,
    marginBottom: 10,
  },
  decisionHelpers: {
    marginTop: 20,
    marginBottom: 16,
  },
  helperTitle: {
    fontSize: 17,
    fontFamily: fonts.heading.semiBold,
    color: '#0F172A',
    marginBottom: 12,
  },
  helperCard: {
    flexDirection: 'row' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    alignItems: 'flex-start' as const,
  },
  helperContent: {
    flex: 1,
  },
  helperCardTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#0F172A',
    marginBottom: 6,
  },
  helperItem: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 2,
  },
  suggestedStep: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 4,
  },
  suggestedStepTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#166534',
    marginBottom: 4,
  },
  suggestedStepText: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#15803D',
    lineHeight: 19,
  },
  legalFooter: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    padding: 14,
    backgroundColor: Colors.lilacMid,
    borderRadius: 12,
    marginTop: 8,
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 16,
  },
});
