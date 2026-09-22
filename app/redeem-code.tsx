import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Gift, Sparkles, Check, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/colors';
import { Button } from '../components/Button';
import { supabase, RedemptionCode } from '../lib/supabase';
import { useSubscriptionStore } from '../store/subscription-store';
import { useUserStore } from '../store/user-store';
import { SubscriptionPlan } from '../types/subscription';

type RedemptionResult = {
  success: boolean;
  message: string;
  productName?: string;
  durationMonths?: number;
};

export default function RedeemCodeScreen() {
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [result, setResult] = useState<RedemptionResult | null>(null);
  
  const { user, authId } = useUserStore();
  const { createSubscription, updateSubscription, subscription } = useSubscriptionStore();

  const getSubscriptionDuration = (productType: string): { months: number; plan: SubscriptionPlan } => {
    switch (productType) {
      case 'supermoon':
        return { months: 12, plan: 'yearly' };
      case 'full_moon':
        return { months: 1, plan: 'monthly' };
      case 'starter':
      default:
        return { months: 0, plan: 'free' };
    }
  };

  const handleRedeemCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a redemption code');
      return;
    }

    if (!authId) {
      Alert.alert('Error', 'Please log in to redeem a code');
      return;
    }

    setIsRedeeming(true);
    setResult(null);

    try {
      console.log('[RedeemCode] Checking code:', code.trim().toUpperCase());

      const { data: codeData, error: fetchError } = await supabase
        .from('redemption_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .single();

      if (fetchError || !codeData) {
        console.log('[RedeemCode] Code not found:', fetchError);
        setResult({
          success: false,
          message: 'Invalid code. Please check and try again.',
        });
        setIsRedeeming(false);
        return;
      }

      const redemptionCode = codeData as RedemptionCode;
      console.log('[RedeemCode] Found code:', redemptionCode);

      if (redemptionCode.status === 'redeemed') {
        setResult({
          success: false,
          message: 'This code has already been redeemed.',
        });
        setIsRedeeming(false);
        return;
      }

      if (redemptionCode.status === 'expired') {
        setResult({
          success: false,
          message: 'This code has expired.',
        });
        setIsRedeeming(false);
        return;
      }

      if (redemptionCode.expires_at && new Date(redemptionCode.expires_at) < new Date()) {
        setResult({
          success: false,
          message: 'This code has expired.',
        });
        setIsRedeeming(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || '';

      const { error: updateError } = await supabase
        .from('redemption_codes')
        .update({
          status: 'redeemed',
          redeemed_by_user_id: authId,
          redeemed_by_email: userEmail,
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', redemptionCode.id)
        .eq('status', 'available');

      if (updateError) {
        console.error('[RedeemCode] Error updating code:', updateError);
        setResult({
          success: false,
          message: 'Failed to redeem code. Please try again.',
        });
        setIsRedeeming(false);
        return;
      }

      const { months, plan } = getSubscriptionDuration(redemptionCode.product_type);
      console.log('[RedeemCode] Activating subscription:', { months, plan });

      if (plan !== 'free') {
        const now = new Date();
        let endDate = new Date();
        
        if (subscription && subscription.status === 'active') {
          endDate = new Date(subscription.currentPeriodEnd);
        }
        
        endDate.setMonth(endDate.getMonth() + months);

        if (subscription) {
          await updateSubscription({
            plan,
            status: 'active',
            currentPeriodEnd: endDate.toISOString(),
            cancelAtPeriodEnd: false,
          });
        } else {
          await createSubscription(plan, user?.id || authId);
        }

      }

      setResult({
        success: true,
        message: `Successfully redeemed ${redemptionCode.product_name}!`,
        productName: redemptionCode.product_name,
        durationMonths: months,
      });

      console.log('[RedeemCode] Code redeemed successfully');
    } catch (error) {
      console.error('[RedeemCode] Error:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Redeem Code',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[Colors.secondary + '40', Colors.primary + '40']}
              style={styles.iconGradient}
            >
              <Gift size={48} color={Colors.gold} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Have a Code?</Text>
          <Text style={styles.subtitle}>
            Enter your redemption code below to unlock premium features
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="SUPERMOON-XXXXXXXX"
              placeholderTextColor={Colors.textLight}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isRedeeming && !result?.success}
            />
          </View>

          {result && (
            <View
              style={[
                styles.resultContainer,
                result.success ? styles.resultSuccess : styles.resultError,
              ]}
            >
              {result.success ? (
                <Check size={24} color={Colors.success} />
              ) : (
                <AlertCircle size={24} color={Colors.error} />
              )}
              <View style={styles.resultTextContainer}>
                <Text
                  style={[
                    styles.resultTitle,
                    result.success ? styles.resultTitleSuccess : styles.resultTitleError,
                  ]}
                >
                  {result.success ? 'Success!' : 'Oops!'}
                </Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
                {result.success && result.durationMonths && result.durationMonths > 0 && (
                  <Text style={styles.resultDetails}>
                    {result.durationMonths} month{result.durationMonths > 1 ? 's' : ''} of premium access added
                  </Text>
                )}
              </View>
            </View>
          )}

          {result?.success ? (
            <Button
              title="Done"
              onPress={handleDone}
              style={styles.button}
            />
          ) : (
            <Button
              title={isRedeeming ? 'Redeeming...' : 'Redeem Code'}
              onPress={handleRedeemCode}
              loading={isRedeeming}
              disabled={isRedeeming || !code.trim()}
              style={styles.button}
            />
          )}

          <View style={styles.infoContainer}>
            <Sparkles size={16} color={Colors.gold} />
            <Text style={styles.infoText}>
              Codes are case-insensitive and can only be used once
            </Text>
          </View>

          <View style={styles.tierInfo}>
            <Text style={styles.tierTitle}>Code Types</Text>
            <View style={styles.tierItem}>
              <View style={[styles.tierBadge, { backgroundColor: Colors.gold + '30' }]}>
                <Text style={[styles.tierBadgeText, { color: Colors.gold }]}>SUPERMOON</Text>
              </View>
              <Text style={styles.tierDescription}>12 months premium</Text>
            </View>
            <View style={styles.tierItem}>
              <View style={[styles.tierBadge, { backgroundColor: Colors.primary + '30' }]}>
                <Text style={[styles.tierBadgeText, { color: Colors.primary }]}>FULL_MOON</Text>
              </View>
              <Text style={styles.tierDescription}>1 month premium</Text>
            </View>
            <View style={styles.tierItem}>
              <View style={[styles.tierBadge, { backgroundColor: Colors.accent + '30' }]}>
                <Text style={[styles.tierBadgeText, { color: Colors.accent }]}>STARTER</Text>
              </View>
              <Text style={styles.tierDescription}>Free tier access</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 2,
    fontWeight: '600' as const,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '40',
  },
  resultError: {
    backgroundColor: Colors.error + '15',
    borderColor: Colors.error + '40',
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  resultTitleSuccess: {
    color: Colors.success,
  },
  resultTitleError: {
    color: Colors.error,
  },
  resultMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  resultDetails: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  button: {
    marginBottom: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  tierInfo: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },
  tierDescription: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
