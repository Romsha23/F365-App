import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Shield, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { getAgeGateResult } from '@/utils/age-gate';

interface TeenGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

export function TeenGuard({ children, featureName }: TeenGuardProps) {
  const { user } = useUserStore();
  const gate = getAgeGateResult(user?.birthMonth, user?.birthYear, user?.lifeStage);

  if (gate.isTeen) {
    return (
      <View style={ss.container}>
        <View style={ss.card}>
          <View style={ss.iconWrap}>
            <Shield size={40} color="#6366F1" />
          </View>
          <Text style={ss.title}>Age-Restricted Content</Text>
          <Text style={ss.message}>
            {featureName
              ? `${featureName} is designed for users aged 18 and above.`
              : 'This feature is designed for users aged 18 and above.'}
          </Text>
          <Text style={ss.subMessage}>
            F365 adapts to your life stage. As you grow, more features will become available to you.
          </Text>
          <Text style={ss.educationNote}>
            For now, explore cycle tracking, mood logging, and educational content designed for your age group.
          </Text>
          <TouchableOpacity
            style={ss.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            testID="teen-guard-back"
          >
            <ArrowLeft size={18} color="#FFFFFF" />
            <Text style={ss.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const ss = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.heading.semiBold,
    color: '#1E1B4B',
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  message: {
    fontSize: 15,
    fontFamily: fonts.body.medium,
    color: '#4338CA',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#6B7280',
    textAlign: 'center' as const,
    lineHeight: 19,
    marginBottom: 12,
  },
  educationNote: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#059669',
    textAlign: 'center' as const,
    lineHeight: 19,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    overflow: 'hidden' as const,
    marginBottom: 20,
    width: '100%',
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
    width: '100%',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: '#FFFFFF',
  },
});
