import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldOff, Globe } from 'lucide-react-native';


interface CountryBlockedScreenProps {
  countryCode: string | null;
  reason: string | null;
}

export function CountryBlockedScreen({ countryCode, reason }: CountryBlockedScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Globe size={48} color="#94A3B8" />
        </View>
        <View style={styles.shieldBadge}>
          <ShieldOff size={20} color="#EF4444" />
        </View>
      </View>

      <Text style={styles.title}>Not Available in Your Region</Text>

      <Text style={styles.message}>
        {reason || 'This app is currently not available in your region. We apologize for the inconvenience.'}
      </Text>

      {countryCode ? (
        <View style={styles.countryBadge}>
          <Text style={styles.countryText}>Detected region: {countryCode}</Text>
        </View>
      ) : null}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          If you believe this is an error, please contact our support team for assistance.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 32,
  },
  iconContainer: {
    position: 'relative' as const,
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  shieldBadge: {
    position: 'absolute' as const,
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 320,
  },
  countryBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  infoBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    maxWidth: 320,
  },
  infoText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
