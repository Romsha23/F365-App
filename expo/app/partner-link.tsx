import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { Shield, UserCheck, Users } from 'lucide-react-native';
import { usePartnerSharingStore } from '../store/partner-sharing-store';
import { useUserStore } from '../store/user-store';

export default function PartnerLinkScreen() {
  const { register, updateProfile, user } = useUserStore();
  const { linkToOwner, error } = usePartnerSharingStore();
  const [inviteCode, setInviteCode] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [partnerGender, setPartnerGender] = useState<'male' | 'female' | 'other'>('male');

  const handleLink = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Invite code required', 'Enter the secure invite code from your partner.');
      return;
    }
    if (!consentAccepted) {
      Alert.alert('Consent required', 'Please confirm consent before linking.');
      return;
    }

    try {
      if (!user) {
        await register({
          onboarded: true,
          notificationsEnabled: false,
          emergencyAlertsEnabled: false,
          insightsEnabled: false,
          averageCycleLength: 28,
          averagePeriodLength: 5,
        });
      } else {
        await updateProfile({});
      }

      await linkToOwner({ inviteCode: inviteCode.trim() });
      if (error) {
        Alert.alert('Unable to link', error);
        return;
      }
      Alert.alert('Linked', 'Partner access activated.');
      router.back();
    } catch (error) {
      console.error('Partner link error:', error);
      Alert.alert('Unable to link', 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Partner Invite' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Shield size={28} color={Colors.primary} />
          <Text style={styles.title}>Join as a Partner</Text>
          <Text style={styles.subtitle}>
            Enter the secure invite code. You will only see shared data and cannot edit it.
          </Text>
        </View>

        {error && (
          <View style={styles.sectionCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Partner Type</Text>
          <View style={styles.genderRow}>
            {[
              { value: 'male', label: 'He/Him partner' },
              { value: 'female', label: 'She/Her partner' },
              { value: 'other', label: 'Other / Not listed' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  partnerGender === option.value && styles.genderOptionSelected,
                ]}
                onPress={() => setPartnerGender(option.value as 'male' | 'female' | 'other')}
                testID={`partner-link-gender-${option.value}`}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    partnerGender === option.value && styles.genderOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Invite Code</Text>
          <TextInput
            style={styles.input}
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="1234-5678"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="characters"
            testID="partner-invite-input"
          />

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setConsentAccepted((prev) => !prev)}
            testID="partner-invite-consent"
          >
            <View style={[styles.checkbox, consentAccepted && styles.checkboxChecked]}>
              {consentAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              I consent to view shared data and understand my access can be revoked anytime.
            </Text>
          </TouchableOpacity>

          <Button
            title="Accept Invite"
            onPress={handleLink}
            style={styles.primaryButton}
            testID="partner-invite-submit"
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.readonlyRow}>
            <UserCheck size={18} color={Colors.accent} />
            <Text style={styles.readonlyText}>
              {partnerGender === 'female'
                ? 'She/Her partners can track their own data separately.'
                : 'Read-only summary mode enabled.'}
            </Text>
          </View>
          {partnerGender === 'female' && (
            <View style={styles.readonlyRow}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.readonlyText}>
                Sharing is always explicit. Premium upgrades are separate for each partner.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 13,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  genderOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.muted,
  },
  genderOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '22',
  },
  genderOptionText: {
    color: Colors.text,
    fontSize: 13,
  },
  genderOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text,
    backgroundColor: Colors.muted,
    fontSize: 16,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.muted,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.primaryForeground,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 16,
  },
  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readonlyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
});
