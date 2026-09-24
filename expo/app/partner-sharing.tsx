import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Shield, UserPlus, RefreshCw, CheckCircle2, AlertCircle, Eye } from 'lucide-react-native';
import Colors from '../constants/colors';
import { Button } from '../components/Button';
import { ConsentCheckbox } from '../components/DisclaimerBanner';
import { usePartnerSharingStore, buildSharedSnapshot } from '../store/partner-sharing-store';
import { useCycleStore } from '../store/cycle-store';
import { usePregnancyStore } from '../store/pregnancy-store';
import { useTelehealthStore } from '../store/telehealth-store';
import { PartnerGender, PartnerPermissions } from '../types/partner-sharing';
import { useUserStore } from '../store/user-store';

const PERMISSION_LABELS: { key: keyof PartnerPermissions; title: string; description: string; locked?: boolean }[] = [
  { key: 'mood', title: 'Mood & Emotional State', description: 'Share daily mood summaries and trends.' },
  { key: 'cycle_predictions', title: 'Cycle Predictions', description: 'Share period and fertile window forecasts.' },
  { key: 'symptoms', title: 'Symptoms', description: 'Share logged symptoms like cramps or headaches.' },
  { key: 'pregnancy_milestones', title: 'Pregnancy Milestones', description: 'Share pregnancy progress and weekly updates.' },
  { key: 'appointments', title: 'Appointment Reminders', description: 'Share upcoming appointments count.' },
  { key: 'private_notes', title: 'Private Notes', description: 'Always private (not shareable).', locked: true },
  { key: 'ai_chat_history', title: 'AI Chat History', description: 'Always private (not shareable).', locked: true },
  { key: 'sexual_activity', title: 'Sexual Activity Logs', description: 'Always private (not shareable).', locked: true },
];

const GENDER_OPTIONS: { key: PartnerGender; label: string }[] = [
  { key: 'male', label: 'He/Him partner' },
  { key: 'female', label: 'She/Her partner' },
  { key: 'other', label: 'Other / Not listed' },
];

export default function PartnerSharingScreen() {
  const { user } = useUserStore();
  const {
    isEnabled,
    invite,
    permissions,
    partnerGender,
    partnerAccepted,
    auditLog,
    lastPartnerViewAt,
    error,
    syncFromServer,
    enableSharing,
    disableSharing,
    updatePermissions,
    rotateInvite,
    refreshSharedSnapshot,
  } = usePartnerSharingStore();

  const { cycles, predictions } = useCycleStore();
  const { appointments, mode, getCurrentWeek, getDaysUntilDue } = usePregnancyStore();
  const { appointments: telehealthAppointments } = useTelehealthStore();

  const [selectedGender, setSelectedGender] = useState<PartnerGender | null>(partnerGender ?? null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentExplicit, setConsentExplicit] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<PartnerPermissions>(permissions);

  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  useEffect(() => {
    setSelectedGender(partnerGender ?? null);
  }, [partnerGender]);

  const latestDayData = useMemo(() => {
    const allDays = cycles.flatMap((cycle) => cycle.days || []);
    const sorted = [...allDays].sort((a, b) => (a.date > b.date ? -1 : 1));
    return sorted[0];
  }, [cycles]);

  const snapshot = useMemo(() => {
    return buildSharedSnapshot({
      permissions: localPermissions,
      latestMood: latestDayData?.mood,
      latestSymptoms: latestDayData?.symptoms,
      predictions: predictions
        ? {
            nextPeriodDate: predictions.nextPeriodDate,
            fertileWindowStart: predictions.fertileWindowStart,
            fertileWindowEnd: predictions.fertileWindowEnd,
            confidence: predictions.confidence,
          }
        : undefined,
      pregnancySummary: {
        mode: mode ?? null,
        currentWeek: mode ? getCurrentWeek() : undefined,
        daysUntilDue: mode ? getDaysUntilDue() : undefined,
      },
      appointmentsCount: appointments.length + telehealthAppointments.length,
    });
  }, [
    localPermissions,
    latestDayData?.mood,
    latestDayData?.symptoms,
    predictions,
    mode,
    appointments.length,
    telehealthAppointments.length,
    getCurrentWeek,
    getDaysUntilDue,
  ]);

  const handleSavePermissions = async () => {
    await updatePermissions({
      ...localPermissions,
      private_notes: false,
      ai_chat_history: false,
      sexual_activity: false,
    });
    await refreshSharedSnapshot(snapshot);
  };

  const handleEnableSharing = async () => {
    if (!selectedGender) {
      Alert.alert('Select partner type', 'Please choose who you are sharing with.');
      return;
    }
    if (!consentAccepted || !consentExplicit) {
      Alert.alert('Consent required', 'Please confirm the consent steps before enabling sharing.');
      return;
    }
    await enableSharing({ partnerGender: selectedGender });
    await refreshSharedSnapshot(snapshot);
  };

  const handleDisableSharing = async () => {
    await disableSharing();
  };

  const handleRotateInvite = async () => {
    await rotateInvite();
  };

  const handleRefreshSnapshot = async () => {
    await refreshSharedSnapshot(snapshot);
  };

  const handlePartnerLink = () => {
    router.push('/partner-link' as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Partner Sharing' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Shield size={24} color={Colors.primary} />
            <Text style={styles.headerTitle}>Secure Partner Sharing</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Invite one partner with explicit consent, granular controls, and revocation anytime.
          </Text>
        </View>

        {error && (
          <View style={styles.sectionCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!isEnabled && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Step 1 · Choose Partner Type</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.genderOption,
                    selectedGender === option.key && styles.genderOptionSelected,
                  ]}
                  onPress={() => setSelectedGender(option.key)}
                  testID={`partner-gender-${option.key}`}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      selectedGender === option.key && styles.genderOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Step 2 · Explicit Consent</Text>
            <ConsentCheckbox
              checked={consentAccepted}
              onToggle={() => setConsentAccepted((prev) => !prev)}
              style={styles.consentBlock}
            />
            <TouchableOpacity
              style={styles.consentInline}
              onPress={() => setConsentExplicit((prev) => !prev)}
              testID="partner-explicit-consent"
            >
              <View style={[styles.checkbox, consentExplicit && styles.checkboxChecked]}>
                {consentExplicit && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.consentInlineText}>
                I confirm the partner must accept the invite and consent before access is granted.
              </Text>
            </TouchableOpacity>

            <Button
              title="Enable Sharing"
              onPress={handleEnableSharing}
              style={styles.primaryButton}
              testID="enable-partner-sharing"
            />
          </View>
        )}

        {isEnabled && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Invite & Acceptance</Text>
              <TouchableOpacity onPress={handleRotateInvite} testID="rotate-invite">
                <RefreshCw size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.inviteRow}>
              <UserPlus size={18} color={Colors.accent} />
              <Text style={styles.inviteLabel}>Secure Invite Code</Text>
            </View>
            <Text style={styles.inviteCode}>{invite?.code ?? 'Generating...'}</Text>
            <Text style={styles.inviteHint}>Share this code privately. It expires when you revoke access.</Text>

            <View style={styles.statusRow}>
              {partnerAccepted ? (
                <>
                  <CheckCircle2 size={18} color={Colors.success} />
                  <Text style={styles.statusText}>Partner accepted invite</Text>
                </>
              ) : (
                <>
                  <AlertCircle size={18} color={Colors.warning} />
                  <Text style={styles.statusText}>Awaiting partner acceptance</Text>
                </>
              )}
            </View>

            <Button
              title="Partner has invite code"
              variant="outline"
              onPress={handlePartnerLink}
              style={styles.secondaryButton}
              testID="partner-link-button"
            />
          </View>
        )}

        {isEnabled && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shared Data Controls</Text>
              <TouchableOpacity onPress={handleSavePermissions} testID="save-permissions">
                <CheckCircle2 size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {PERMISSION_LABELS.map((item) => (
              <View key={item.key} style={styles.permissionRow}>
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>{item.title}</Text>
                  <Text style={styles.permissionDescription}>{item.description}</Text>
                </View>
                <Switch
                  value={item.locked ? false : localPermissions[item.key]}
                  onValueChange={(value) => {
                    if (item.locked) return;
                    setLocalPermissions((prev) => ({ ...prev, [item.key]: value }));
                  }}
                  trackColor={{ false: Colors.inactive, true: Colors.primary }}
                  thumbColor={Colors.white}
                  disabled={item.locked}
                  testID={`permission-${item.key}`}
                />
              </View>
            ))}
            <Button
              title="Update Shared Snapshot"
              variant="outline"
              onPress={handleRefreshSnapshot}
              style={styles.secondaryButton}
              testID="refresh-snapshot"
            />
          </View>
        )}

        {isEnabled && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Partner View Activity</Text>
            <View style={styles.activityRow}>
              <Eye size={18} color={Colors.accent} />
              <Text style={styles.activityText}>
                {lastPartnerViewAt
                  ? `Last viewed: ${new Date(lastPartnerViewAt).toLocaleString()}`
                  : 'No partner views yet.'}
              </Text>
            </View>
          </View>
        )}

        {isEnabled && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Audit Log</Text>
            {auditLog.length === 0 ? (
              <Text style={styles.auditEmpty}>No audit events yet.</Text>
            ) : (
              auditLog.slice(-6).reverse().map((entry) => (
                <View key={entry.id} style={styles.auditRow}>
                  <Text style={styles.auditAction}>{entry.action.replace(/_/g, ' ')}</Text>
                  <Text style={styles.auditDetails}>{entry.details}</Text>
                  <Text style={styles.auditTimestamp}>{new Date(entry.timestamp).toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {isEnabled && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Revoke Access</Text>
            <Text style={styles.sectionSubtitle}>
              You can disable sharing instantly. Partner data will be removed from their device.
            </Text>
            <Button
              title="Disable Partner Sharing"
              variant="outline"
              onPress={handleDisableSharing}
              testID="disable-partner-sharing"
            />
          </View>
        )}

        {!user && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Demo Mode</Text>
            <Text style={styles.sectionSubtitle}>
              Partner sharing works best when you are logged in. Sign in to sync securely.
            </Text>
          </View>
        )}
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
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
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
  consentBlock: {
    marginTop: 12,
  },
  consentInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
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
  consentInlineText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 16,
  },
  secondaryButton: {
    marginTop: 12,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  inviteLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.2,
    marginVertical: 8,
  },
  inviteHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  statusText: {
    color: Colors.text,
    fontSize: 13,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionDescription: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  auditRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  auditAction: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  auditDetails: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  auditTimestamp: {
    color: Colors.textLight,
    fontSize: 11,
    marginTop: 4,
  },
  auditEmpty: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
