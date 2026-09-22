import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import Colors from '../constants/colors';
import { Crown, Check, Gift, ChevronRight, Sparkles } from 'lucide-react-native';
import { useSubscriptionStore } from '../store/subscription-store';

export default function SubscriptionScreen() {
  const { loadMockSubscription } = useSubscriptionStore();

  const handleTemporaryAccess = () => {
    console.log('[Subscription] Temporary Pro access granted for demo');
    loadMockSubscription('yearly');
    router.push('/subscription-success' as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Activate Pro',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Crown size={40} color={Colors.gold} />
          </View>
          <Text style={styles.title}>Activate Pro</Text>
          <Text style={styles.subtitle}>
            Enter your activation code to unlock all premium features.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What you get with Pro:</Text>
          {[
            'Unlimited cycle tracking',
            'AI-powered insights & predictions',
            'AI health assistant chat',
            'Advanced analytics & reports',
            'Data export',
            'Priority support',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={16} color={Colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.activateNotice}>
          <Sparkles size={20} color={Colors.gold} />
          <Text style={styles.activateNoticeText}>
            Activation is managed on the web. Enter your redemption code here to unlock Pro.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.redeemButton}
          onPress={() => router.push('/redeem-code' as any)}
          activeOpacity={0.8}
          testID="subscription-redeem-button"
        >
          <Gift size={20} color={Colors.white} />
          <Text style={styles.redeemButtonText}>Enter Activation Code</Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleTemporaryAccess}
          activeOpacity={0.9}
          testID="subscription-demo-button"
        >
          <Sparkles size={18} color={Colors.gold} />
          <Text style={styles.demoButtonText}>Grant temporary Pro access</Text>
        </TouchableOpacity>

        <Text style={styles.secureText}>
          Premium features unlock instantly after activation.
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
    padding: 24,
    paddingBottom: 48,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  featuresCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
  },
  activateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '12',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  activateNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  redeemButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    marginBottom: 16,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  secureText: {
    fontSize: 13,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 18,
  },
});
