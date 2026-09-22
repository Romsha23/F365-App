import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Colors from '../constants/colors';
import { Crown, Gift, ChevronRight } from 'lucide-react-native';

interface SubscriptionPaywallProps {
  feature: string;
  description: string;
  onUpgrade?: () => void;
}

export const SubscriptionPaywall = ({ feature, description, onUpgrade }: SubscriptionPaywallProps) => {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    router.push('/subscription' as any);
  };

  const handleRedeem = () => {
    router.push('/redeem-code' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Crown size={32} color={Colors.primary} />
      </View>
      
      <Text style={styles.title}>Activation Required</Text>
      <Text style={styles.subtitle}>
        {feature} unlocks after your account is activated.
      </Text>
      
      <Text style={styles.description}>{description}</Text>
      
      <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
        <Crown size={20} color={Colors.white} />
        <Text style={styles.upgradeButtonText}>Enter Activation Code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.redeemButton} onPress={handleRedeem}>
        <Gift size={18} color={Colors.gold} />
        <Text style={styles.redeemButtonText}>Redeem a Code</Text>
        <ChevronRight size={16} color={Colors.gold} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.subtext,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  redeemButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.gold,
  },
});
