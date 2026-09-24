import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DollarSign,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
  Globe,
  Heart,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { TeenGuard } from '@/components/TeenGuard';
import { ReportFeedbackButton } from '@/components/ReportFeedback';
import { useUserStore } from '@/store/user-store';
import { supabase } from '@/lib/supabase';

interface CostEstimate {
  id: string;
  country: string;
  treatment_type: string;
  min_cost: number | null;
  max_cost: number | null;
  medicare_rebate: number | null;
  out_of_pocket_min: number | null;
  out_of_pocket_max: number | null;
  insurance_discount: number | null;
  currency: string | null;
  notes: string | null;
  is_active: boolean;
}

const TREATMENT_LABELS: Record<string, string> = {
  ivf_standard: 'Standard IVF Cycle',
  ivf_icsi: 'IVF with ICSI',
  iui: 'Intrauterine Insemination (IUI)',
  egg_freezing: 'Egg Freezing',
  embryo_freezing: 'Embryo Freezing',
  pgd_pgt: 'Genetic Testing (PGD/PGT)',
  donor_egg: 'Donor Egg IVF',
  donor_sperm: 'Donor Sperm',
  surrogacy: 'Surrogacy',
  consultation: 'Initial Consultation',
  blood_tests: 'Blood Tests & Diagnostics',
  medication: 'Medications (per cycle)',
};

const COUNTRY_LABELS: Record<string, string> = {
  AU: '🇦🇺 Australia',
  IN: '🇮🇳 India',
  PK: '🇵🇰 Pakistan',
  US: '🇺🇸 United States',
  UK: '🇬🇧 United Kingdom',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: 'A$',
  INR: '₹',
  PKR: 'Rs',
  USD: '$',
  GBP: '£',
};

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount === null || amount === undefined) return '--';
  const symbol = CURRENCY_SYMBOLS[currency || 'USD'] || '$';
  return `${symbol}${amount.toLocaleString()}`;
}

function CostCard({ estimate }: { estimate: CostEstimate }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hasMedicare = estimate.medicare_rebate !== null && estimate.medicare_rebate > 0;
  const hasInsurance = estimate.insurance_discount !== null && estimate.insurance_discount > 0;

  return (
    <View style={ss.costCard}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={ss.costCardHeader}>
        <View style={ss.costCardTitleWrap}>
          <Text style={ss.costCardTitle}>
            {TREATMENT_LABELS[estimate.treatment_type] || estimate.treatment_type}
          </Text>
          {hasMedicare && (
            <View style={ss.medicareBadge}>
              <Text style={ss.medicareBadgeText}>Medicare</Text>
            </View>
          )}
        </View>
        <View style={ss.costCardRight}>
          {estimate.min_cost !== null && estimate.max_cost !== null ? (
            <Text style={ss.costRange}>
              {formatCurrency(estimate.min_cost, estimate.currency)}–{formatCurrency(estimate.max_cost, estimate.currency)}
            </Text>
          ) : estimate.min_cost !== null ? (
            <Text style={ss.costRange}>From {formatCurrency(estimate.min_cost, estimate.currency)}</Text>
          ) : (
            <Text style={ss.costRange}>Contact clinic</Text>
          )}
          {expanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={ss.costCardBody}>
          {hasMedicare && (
            <View style={ss.costRow}>
              <Text style={ss.costRowLabel}>Medicare Rebate (est.)</Text>
              <Text style={ss.costRowValueGreen}>
                -{formatCurrency(estimate.medicare_rebate, estimate.currency)}
              </Text>
            </View>
          )}
          {estimate.out_of_pocket_min !== null && (
            <View style={ss.costRow}>
              <Text style={ss.costRowLabel}>Out-of-Pocket (est.)</Text>
              <Text style={ss.costRowValue}>
                {formatCurrency(estimate.out_of_pocket_min, estimate.currency)}
                {estimate.out_of_pocket_max ? `–${formatCurrency(estimate.out_of_pocket_max, estimate.currency)}` : ''}
              </Text>
            </View>
          )}
          {hasInsurance && (
            <View style={ss.costRow}>
              <Text style={ss.costRowLabel}>Private Insurance Discount</Text>
              <Text style={ss.costRowValueGreen}>
                Up to {estimate.insurance_discount}%
              </Text>
            </View>
          )}
          {estimate.notes && (
            <View style={ss.notesBox}>
              <Info size={13} color="#6B7280" />
              <Text style={ss.notesText}>{estimate.notes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function CostEstimatorScreen() {
  const { user } = useUserStore();
  const [estimates, setEstimates] = useState<CostEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(user?.country || 'AU');
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadEstimates = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[CostEstimator] Loading estimates for:', selectedCountry);
      const { data, error: fetchError } = await supabase
        .from('ivf_cost_estimates')
        .select('*')
        .eq('country', selectedCountry)
        .eq('is_active', true)
        .order('treatment_type');

      if (fetchError) {
        if (fetchError.code === '42P01') {
          console.log('[CostEstimator] Table does not exist yet');
          setEstimates([]);
        } else {
          console.error('[CostEstimator] Error:', fetchError);
          setError(fetchError.message);
        }
      } else {
        setEstimates(data || []);
        console.log('[CostEstimator] Loaded', data?.length || 0, 'estimates');
      }
    } catch (err: any) {
      console.error('[CostEstimator] Unexpected error:', err);
      setError(err.message || 'Failed to load estimates');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => {
    void loadEstimates();
  }, [loadEstimates]);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isLoading, fadeAnim]);

  const availableCountries = Object.keys(COUNTRY_LABELS);

  return (
    <TeenGuard featureName="Cost Estimator">
      <View style={ss.container}>
        <Stack.Screen options={{ title: 'Cost Estimator' }} />
        <ScrollView
          style={ss.scrollView}
          contentContainerStyle={ss.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DisclaimerBanner
            type="warning"
            message="Cost estimates are approximate ranges based on publicly available data. Actual costs vary by clinic, individual circumstances, and treatment requirements. Always confirm costs directly with your chosen clinic."
            style={{ marginBottom: 12 }}
          />

          <View style={ss.heroCard}>
            <LinearGradient
              colors={['#F5F3FF', '#EDE9FE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.heroGradient}
            >
              <View style={ss.heroIconWrap}>
                <DollarSign size={26} color="#7C3AED" />
              </View>
              <Text style={ss.heroTitle}>IVF & Fertility Cost Estimator</Text>
              <Text style={ss.heroSubtitle}>
                Understand estimated costs, Medicare rebates, and out-of-pocket expenses for your country.
              </Text>
            </LinearGradient>
          </View>

          <Text style={ss.sectionLabel}>Select Country</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={ss.countryScroll}
            contentContainerStyle={ss.countryScrollContent}
          >
            {availableCountries.map(code => (
              <TouchableOpacity
                key={code}
                style={[ss.countryChip, selectedCountry === code && ss.countryChipActive]}
                onPress={() => setSelectedCountry(code)}
                activeOpacity={0.7}
              >
                <Text style={[ss.countryChipText, selectedCountry === code && ss.countryChipTextActive]}>
                  {COUNTRY_LABELS[code] || code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoading ? (
            <View style={ss.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={ss.loadingText}>Loading cost data...</Text>
            </View>
          ) : error ? (
            <View style={ss.emptyContainer}>
              <Info size={32} color={Colors.subtext} />
              <Text style={ss.emptyTitle}>Could not load data</Text>
              <Text style={ss.emptySubtitle}>{error}</Text>
              <TouchableOpacity style={ss.retryBtn} onPress={loadEstimates} activeOpacity={0.7}>
                <Text style={ss.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : estimates.length === 0 ? (
            <Animated.View style={[ss.emptyContainer, { opacity: fadeAnim }]}>
              <Globe size={40} color="#94A3B8" />
              <Text style={ss.emptyTitle}>No cost data available yet</Text>
              <Text style={ss.emptySubtitle}>
                Cost estimates for {COUNTRY_LABELS[selectedCountry] || selectedCountry} are being compiled. Check back soon.
              </Text>
            </Animated.View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={ss.resultsCount}>
                {estimates.length} treatment{estimates.length !== 1 ? 's' : ''} found
              </Text>
              {estimates.map(est => (
                <CostCard key={est.id} estimate={est} />
              ))}
            </Animated.View>
          )}

          {selectedCountry === 'AU' && (
            <View style={ss.medicareInfo}>
              <Heart size={16} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={ss.medicareInfoTitle}>Medicare in Australia</Text>
                <Text style={ss.medicareInfoText}>
                  Medicare may cover a portion of IVF costs. You typically need a GP referral to access Medicare rebates. Private health insurance may further reduce out-of-pocket costs.
                </Text>
              </View>
            </View>
          )}

          <View style={ss.legalFooter}>
            <Shield size={14} color={Colors.subtext} />
            <Text style={ss.legalText}>
              Cost data is for informational purposes only. Estimates are based on publicly available information and may not reflect current pricing. F365 does not guarantee accuracy. Always verify costs directly with healthcare providers.
            </Text>
          </View>

          <ReportFeedbackButton
            screenName="cost-estimator"
            contextData={{ country: selectedCountry }}
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
    borderRadius: 20,
    overflow: 'hidden' as const,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    ...Platform.select({
      ios: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(124,58,237,0.1)' },
    }),
  },
  heroGradient: { padding: 22, alignItems: 'center' as const },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
    marginBottom: 12,
  },
  heroTitle: { fontSize: 19, fontFamily: fonts.heading.bold, color: '#3B0764', textAlign: 'center' as const, marginBottom: 6 },
  heroSubtitle: { fontSize: 13, fontFamily: fonts.body.regular, color: '#6B21A8', textAlign: 'center' as const, lineHeight: 19 },
  sectionLabel: { fontSize: 12, fontFamily: fonts.body.semiBold, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 },
  countryScroll: { marginBottom: 16 },
  countryScrollContent: { gap: 8, paddingRight: 8 },
  countryChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  countryChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  countryChipText: { fontSize: 13, fontFamily: fonts.body.semiBold, color: '#475569' },
  countryChipTextActive: { color: '#FFFFFF' },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' as const, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: fonts.body.medium, color: Colors.subtext },
  emptyContainer: { paddingVertical: 50, alignItems: 'center' as const, gap: 10, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontFamily: fonts.heading.semiBold, color: Colors.foreground },
  emptySubtitle: { fontSize: 13, fontFamily: fonts.body.regular, color: Colors.subtext, textAlign: 'center' as const, lineHeight: 19 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  retryBtnText: { fontSize: 14, fontFamily: fonts.body.semiBold, color: '#FFFFFF' },
  resultsCount: { fontSize: 13, fontFamily: fonts.body.medium, color: Colors.subtext, marginBottom: 10 },
  costCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  costCardHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: 14 },
  costCardTitleWrap: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, flexWrap: 'wrap' as const },
  costCardTitle: { fontSize: 14, fontFamily: fonts.body.semiBold, color: '#0F172A' },
  medicareBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  medicareBadgeText: { fontSize: 10, fontFamily: fonts.body.bold, color: '#059669' },
  costCardRight: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  costRange: { fontSize: 14, fontFamily: fonts.body.bold, color: '#7C3AED' },
  costCardBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  costRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  costRowLabel: { fontSize: 13, fontFamily: fonts.body.regular, color: '#6B7280' },
  costRowValue: { fontSize: 13, fontFamily: fonts.body.semiBold, color: '#0F172A' },
  costRowValueGreen: { fontSize: 13, fontFamily: fonts.body.semiBold, color: '#059669' },
  notesBox: {
    flexDirection: 'row' as const, gap: 8, backgroundColor: '#F9FAFB',
    borderRadius: 8, padding: 10, marginTop: 4, alignItems: 'flex-start' as const,
  },
  notesText: { flex: 1, fontSize: 12, fontFamily: fonts.body.regular, color: '#6B7280', lineHeight: 17 },
  medicareInfo: {
    flexDirection: 'row' as const, gap: 10, backgroundColor: '#ECFDF5',
    borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#A7F3D0',
    alignItems: 'flex-start' as const,
  },
  medicareInfoTitle: { fontSize: 14, fontFamily: fonts.body.semiBold, color: '#065F46', marginBottom: 4 },
  medicareInfoText: { fontSize: 12, fontFamily: fonts.body.regular, color: '#047857', lineHeight: 17 },
  legalFooter: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8,
    padding: 14, backgroundColor: Colors.lilacMid, borderRadius: 12, marginTop: 16,
  },
  legalText: { flex: 1, fontSize: 11, fontFamily: fonts.body.regular, color: Colors.subtext, lineHeight: 16 },
});
