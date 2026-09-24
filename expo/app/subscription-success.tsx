import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSubscriptionStore } from '../store/subscription-store';
import Colors from '../constants/colors';
import { Check, Crown } from 'lucide-react-native';

export default function SubscriptionSuccessScreen() {
  const { id: _id } = useLocalSearchParams();
  const { getSubscriptionInfo } = useSubscriptionStore();
  
  const subscriptionInfo = getSubscriptionInfo();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)/profile' as any);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.replace('/(tabs)/profile' as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Welcome to Pro!',
          headerBackVisible: false,
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Check size={48} color={Colors.white} />
        </View>
        
        <Text style={styles.title}>Welcome to F365 Pro!</Text>
        <Text style={styles.subtitle}>
          Your subscription is now active. You have access to all premium features.
        </Text>
        
        <View style={styles.planInfo}>
          <Crown size={24} color={Colors.primary} />
          <Text style={styles.planText}>
            {subscriptionInfo.plan === 'monthly' ? 'Monthly Pro' : 'Yearly Pro'} Plan
          </Text>
        </View>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you get:</Text>
          
          <View style={styles.featureItem}>
            <Check size={16} color={Colors.success} style={styles.checkIcon} />
            <Text style={styles.featureText}>Unlimited cycle tracking</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Check size={16} color={Colors.success} style={styles.checkIcon} />
            <Text style={styles.featureText}>AI-powered insights and predictions</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Check size={16} color={Colors.success} style={styles.checkIcon} />
            <Text style={styles.featureText}>Export your data anytime</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Check size={16} color={Colors.success} style={styles.checkIcon} />
            <Text style={styles.featureText}>Priority customer support</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Check size={16} color={Colors.success} style={styles.checkIcon} />
            <Text style={styles.featureText}>Advanced analytics and reports</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to App</Text>
        </TouchableOpacity>
        
        <Text style={styles.autoRedirectText}>
          You will be automatically redirected in a few seconds...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.subtext,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  planText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoRedirectText: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
  },
});