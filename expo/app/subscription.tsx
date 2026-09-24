import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '../constants/colors';
import { Crown, Check, Gift, ChevronRight, Sparkles, Zap } from 'lucide-react-native';
import { useSubscriptionStore } from '../store/subscription-store';

export default function SubscriptionScreen() {
  const { loadMockSubscription } = useSubscriptionStore();

  const handleTemporaryAccess = () => {
    console.log('[Subscription] Temporary Pro access granted for demo');
    loadMockSubscription('yearly');
    router.push('/subscription-success' as any);
  };

  const plusFeatures = [
    'Unlimited cycle tracking',
    'AI-powered insights & predictions',
    'AI health assistant chat',
    'Advanced analytics & reports',
    'Data export',
    'Priority support',
  ];

  const freeFeatures = [
    'Basic cycle tracking',
    'Calendar view',
    'Symptom logging',
    'Period predictions',
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Choose a Plan',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Crown size={36} color={Colors.gold} />
          </View>
          <Text style={styles.title}>Unlock Full Access</Text>
          <Text style={styles.subtitle}>
            Choose the plan that works best for you
          </Text>
        </View>

        {/* PLUS PLAN — Most Popular */}
        <View style={styles.popularBadgeRow}>
          <View style={styles.popularBadge}>
            <Sparkles size={12} color="#fff" />
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        </View>

        <View style={[styles.planCard, styles.planCardPlus]}>
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <Crown size={22} color={Colors.gold} />
              <Text style={[styles.planName, styles.planNamePlus]}>Plus</Text>
            </View>
            <View style={styles.planPriceContainer}>
              <Text style={styles.planPriceNote}>Activate with code</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {plusFeatures.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.checkCirclePlus}>
                <Check size={12} color="#fff" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.plusCta}
            onPress={() => router.push('/redeem-code' as any)}
            activeOpacity={0.85}
          >
            <Gift size={18} color="#fff" />
            <Text style={styles.plusCtaText}>Activate with Code</Text>
            <ChevronRight size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoCta}
            onPress={handleTemporaryAccess}
            activeOpacity={0.85}
          >
            <Sparkles size={14} color={Colors.gold} />
            <Text style={styles.demoCtaText}>Try Pro free (demo)</Text>
          </TouchableOpacity>
        </View>

        {/* FREE PLAN */}
        <View style={[styles.planCard, styles.planCardFree]}>
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <Zap size={20} color={Colors.subtext} />
              <Text style={[styles.planName, styles.planNameFree]}>Free</Text>
            </View>
            <Text style={styles.planPriceNote}>No cost, always</Text>
          </View>

          <View style={styles.divider} />

          {freeFeatures.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.checkCircleFree}>
                <Check size={12} color={Colors.subtext} />
              </View>
              <Text style={[styles.featureText, styles.featureTextFree]}>{feature}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.freeCta}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.freeCtaText}>Continue with Free</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Premium features unlock instantly after entering your activation code.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
  },

  // Popular badge
  popularBadgeRow: {
    alignItems: 'center',
    marginBottom: -10,
    zIndex: 1,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Plan cards
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  planCardPlus: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardFree: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  planHeader: {
    marginBottom: 12,
    marginTop: 6,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold' as const,
  },
  planNamePlus: {
    color: Colors.gold,
  },
  planNameFree: {
    color: Colors.subtext,
  },
  planPriceContainer: {
    marginTop: 2,
  },
  planPriceNote: {
    fontSize: 13,
    color: Colors.subtext,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkCirclePlus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkCircleFree: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  featureTextFree: {
    color: Colors.subtext,
  },

  // Plus CTAs
  plusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 10,
  },
  plusCtaText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  demoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  demoCtaText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '500' as const,
  },

  // Free CTA
  freeCta: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    marginTop: 16,
  },
  freeCtaText: {
    fontSize: 15,
    color: Colors.subtext,
    fontWeight: '500' as const,
  },

  footerNote: {
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
