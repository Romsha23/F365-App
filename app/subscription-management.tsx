import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSubscriptionStore } from '../store/subscription-store';
import { useUserStore } from '../store/user-store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import Colors from '../constants/colors';

import {
  Crown,
  Calendar,
  Check,
  Gift,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { supabase, UserSubscriptionRow, RedemptionCode } from '../lib/supabase';

type TabType = 'subscription' | 'codes';

export default function SubscriptionManagementScreen() {
  const { subscription, getSubscriptionInfo } = useSubscriptionStore();
  const { authId } = useUserStore();

  const [activeTab, setActiveTab] = useState<TabType>('subscription');
  const [refreshing, setRefreshing] = useState(false);
  const [dbSubscription, setDbSubscription] = useState<UserSubscriptionRow | null>(null);
  const [redeemedCodes, setRedeemedCodes] = useState<RedemptionCode[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const subscriptionInfo = getSubscriptionInfo();

  const fetchData = useCallback(async () => {
    if (!authId) {
      console.log('[SubscriptionManagement] No authId, skipping fetch');
      setLoadingData(false);
      return;
    }

    try {
      console.log('[SubscriptionManagement] Fetching user data...');

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subData) {
        setDbSubscription(subData as UserSubscriptionRow);
      }

      const { data: codesData } = await supabase
        .from('redemption_codes')
        .select('*')
        .eq('redeemed_by_user_id', authId)
        .order('redeemed_at', { ascending: false });

      if (codesData) {
        setRedeemedCodes(codesData as RedemptionCode[]);
      }

      console.log('[SubscriptionManagement] Data fetched successfully');
    } catch (error) {
      console.error('[SubscriptionManagement] Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  }, [authId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'processed':
        return Colors.success;
      case 'canceled':
      case 'failed':
        return Colors.error;
      case 'pending':
        return Colors.warning;
      default:
        return Colors.subtext;
    }
  };

  const renderTabButton = (tab: TabType, label: string, icon: React.ReactNode) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      {icon}
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSubscriptionTab = () => {
    const currentSub = dbSubscription || subscription;

    if (!currentSub && !subscriptionInfo.isPro) {
      return (
        <View>
          <View style={styles.promoHeader}>
            <View style={styles.promoIconContainer}>
              <Zap size={32} color={Colors.gold} />
            </View>
            <Text style={styles.promoTitle}>Unlock Premium</Text>
            <Text style={styles.promoSubtitle}>
              Get unlimited access to all features with a Pro subscription
            </Text>
          </View>

          <View style={styles.featuresPreview}>
            <Text style={styles.featuresPreviewTitle}>What you{"'"}ll get:</Text>
            {[
              'Unlimited cycle tracking',
              'AI-powered insights & predictions',
              'AI health assistant chat',
              'Advanced analytics',
              'Data export',
              'Priority support',
            ].map((feature, index) => (
              <View key={index} style={styles.featurePreviewItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.featurePreviewText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.redeemCodeButton}
            onPress={() => router.push('/redeem-code' as any)}
          >
            <Gift size={20} color={Colors.gold} />
            <Text style={styles.redeemCodeText}>Have a redemption code?</Text>
            <ChevronRight size={18} color={Colors.gold} />
          </TouchableOpacity>
        </View>
      );
    }

    const displayPlan = dbSubscription?.plan || subscription?.plan || 'monthly';
    const displayStatus = dbSubscription?.status || subscription?.status || 'active';
    const periodEnd = dbSubscription?.current_period_end || subscription?.currentPeriodEnd;

    return (
      <View>
        <Card style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.planBadge}>
              <Crown size={20} color={Colors.gold} />
              <Text style={styles.planName}>
                {displayPlan === 'yearly' ? 'Annual Pro' : 'Monthly Pro'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(displayStatus) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(displayStatus) }]}>
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.subscriptionDetails}>
            {periodEnd && (
              <View style={styles.detailRow}>
                <Calendar size={18} color={Colors.subtext} />
                <Text style={styles.detailLabel}>Renews on</Text>
                <Text style={styles.detailValue}>{formatDate(periodEnd)}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Clock size={18} color={Colors.subtext} />
              <Text style={styles.detailLabel}>Days Remaining</Text>
              <Text style={styles.detailValue}>{subscriptionInfo.daysRemaining} days</Text>
            </View>

            {dbSubscription?.source && (
              <View style={styles.detailRow}>
                {dbSubscription.source === 'redemption_code' ? (
                  <Gift size={18} color={Colors.gold} />
                ) : (
                  <Zap size={18} color={Colors.subtext} />
                )}
                <Text style={styles.detailLabel}>Source</Text>
                <Text style={styles.detailValue}>
                  {dbSubscription.source === 'redemption_code' ? 'Redemption Code' : 'Web Activation'}
                </Text>
              </View>
            )}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Pro Features</Text>
        <Card style={styles.featuresCard}>
          {[
            'Unlimited cycle tracking',
            'AI-powered insights and predictions',
            'Advanced health analytics',
            'Export your data anytime',
            'Priority customer support',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={16} color={Colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/redeem-code' as any)}>
          <Gift size={18} color={Colors.gold} />
          <Text style={styles.linkButtonText}>Have a redemption code?</Text>
          <ChevronRight size={18} color={Colors.gold} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCodesTab = () => {
    if (redeemedCodes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Gift size={48} color={Colors.subtext} />
          <Text style={styles.emptyTitle}>No Redeemed Codes</Text>
          <Text style={styles.emptyText}>
            Redemption codes you have used will appear here.
          </Text>
          <Button
            title="Redeem a Code"
            onPress={() => router.push('/redeem-code' as any)}
            style={styles.upgradeButton}
          />
        </View>
      );
    }

    return (
      <View>
        {redeemedCodes.map((code) => (
          <Card key={code.id} style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <View style={styles.codeIconContainer}>
                <Sparkles size={20} color={Colors.gold} />
              </View>
              <View style={styles.codeInfo}>
                <Text style={styles.codeName}>{code.product_name}</Text>
                <Text style={styles.codeValue}>{code.code}</Text>
              </View>
              <View style={[styles.codeStatus, { backgroundColor: Colors.success + '20' }]}>
                <Text style={[styles.codeStatusText, { color: Colors.success }]}>Redeemed</Text>
              </View>
            </View>
            <View style={styles.codeDetails}>
              <Text style={styles.codeDetailText}>
                Type: {code.product_type.replace('_', ' ').toUpperCase()}
              </Text>
              {code.redeemed_at && (
                <Text style={styles.codeDetailText}>Redeemed: {formatDate(code.redeemed_at)}</Text>
              )}
            </View>
          </Card>
        ))}
      </View>
    );
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Subscription' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading subscription data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Subscription' }} />

      <View style={styles.tabBar}>
        {renderTabButton('subscription', 'Subscription', <Crown size={18} color={activeTab === 'subscription' ? Colors.primary : Colors.subtext} />)}
        {renderTabButton('codes', 'Codes', <Gift size={18} color={activeTab === 'codes' ? Colors.primary : Colors.subtext} />)}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {activeTab === 'subscription' && renderSubscriptionTab()}
        {activeTab === 'codes' && renderCodesTab()}

        <TouchableOpacity style={styles.helpLink} onPress={() => router.push('/help' as any)}>
          <Text style={styles.helpLinkText}>Need help? Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.subtext,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: Colors.primary + '15',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.subtext,
  },
  activeTabButtonText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  upgradeButton: {
    minWidth: 200,
  },
  promoHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  promoIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  promoSubtitle: {
    fontSize: 15,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  featuresPreview: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  featuresPreviewTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  featurePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  featurePreviewText: {
    fontSize: 14,
    color: Colors.text,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: Colors.subtext,
  },
  redeemCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  redeemCodeText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.gold,
  },
  subscriptionCard: {
    padding: 20,
    marginBottom: 24,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  subscriptionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.subtext,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  featuresCard: {
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
  },

  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.gold,
  },
  codeCard: {
    padding: 16,
    marginBottom: 12,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeInfo: {
    flex: 1,
  },
  codeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 13,
    color: Colors.subtext,
    fontFamily: 'Inter_400Regular',
  },
  codeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  codeDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeDetailText: {
    fontSize: 13,
    color: Colors.subtext,
  },
  helpLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  helpLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
});
