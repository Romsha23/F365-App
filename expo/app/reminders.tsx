import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Platform, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useReminderStore } from '../store/reminder-store';
import { useCycleStore } from '../store/cycle-store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { Calendar, Droplet, Heart, AlertCircle, Clock, BellOff } from 'lucide-react-native';

export default function RemindersScreen() {
  const {
    preferences,
    permissionGranted,
    isLoading,
    isSaving,
    initialize,
    updatePreference,
    savePreferences,
    requestPermission,
    scheduleNotifications,
  } = useReminderStore();

  const { predictions } = useCycleStore();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
      updatePreference('notificationsEnabled', true);
    } else {
      Alert.alert(
        'Disable Notifications',
        'Disabling notifications will turn off all reminders. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            onPress: () => {
              updatePreference('notificationsEnabled', false);
              setHasChanges(true);
            },
          },
        ]
      );
      return;
    }
    setHasChanges(true);
  };

  const handleReminderToggle = (key: keyof typeof preferences, value: boolean) => {
    updatePreference(key, value);
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    await savePreferences();

    if (preferences.notificationsEnabled && predictions) {
      await scheduleNotifications({
        nextPeriodDate: predictions.nextPeriodDate,
        fertileWindowStart: predictions.fertileWindowStart,
        fertileWindowEnd: predictions.fertileWindowEnd,
      });
    }

    setHasChanges(false);
    Alert.alert(
      'Settings Saved',
      preferences.notificationsEnabled
        ? 'Your reminder preferences have been saved and notifications scheduled.'
        : 'Your reminder preferences have been saved. Notifications are disabled.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Reminders' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Reminders' }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.mainToggleCard}>
          <View style={styles.mainToggleRow}>
            <View style={styles.mainToggleTextContainer}>
              <Text style={styles.mainToggleTitle}>Enable Notifications</Text>
              <Text style={styles.mainToggleDescription}>
                Receive reminders about your cycle and health
              </Text>
              {!permissionGranted && Platform.OS !== 'web' && (
                <Text style={styles.permissionWarning}>
                  Notification permission not granted
                </Text>
              )}
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </Card>

        {preferences.notificationsEnabled && (
          <>
            <Text style={styles.sectionTitle}>Cycle Reminders</Text>

            <Card style={styles.remindersCard}>
              <View style={styles.reminderRow}>
                <View style={styles.reminderInfo}>
                  <View style={[styles.reminderIconContainer, { backgroundColor: Colors.error + '20' }]}>
                    <Droplet size={20} color={Colors.error} />
                  </View>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderTitle}>Period Start</Text>
                    <Text style={styles.reminderDescription}>
                      Get notified 1 day before your predicted period
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.periodStart}
                  onValueChange={(value) => handleReminderToggle('periodStart', value)}
                  trackColor={{ false: Colors.inactive, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.reminderRow}>
                <View style={styles.reminderInfo}>
                  <View style={[styles.reminderIconContainer, { backgroundColor: Colors.primary + '20' }]}>
                    <Calendar size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderTitle}>Period End</Text>
                    <Text style={styles.reminderDescription}>
                      Get notified when your period is expected to end
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.periodEnd}
                  onValueChange={(value) => handleReminderToggle('periodEnd', value)}
                  trackColor={{ false: Colors.inactive, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.reminderRow}>
                <View style={styles.reminderInfo}>
                  <View style={[styles.reminderIconContainer, { backgroundColor: Colors.secondary + '20' }]}>
                    <Heart size={20} color={Colors.secondary} />
                  </View>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderTitle}>Ovulation Day</Text>
                    <Text style={styles.reminderDescription}>
                      Get notified on your predicted ovulation day
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.ovulation}
                  onValueChange={(value) => handleReminderToggle('ovulation', value)}
                  trackColor={{ false: Colors.inactive, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={[styles.reminderRow, styles.lastReminderRow]}>
                <View style={styles.reminderInfo}>
                  <View style={[styles.reminderIconContainer, { backgroundColor: Colors.accent + '20' }]}>
                    <Calendar size={20} color={Colors.accent} />
                  </View>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderTitle}>Fertile Window</Text>
                    <Text style={styles.reminderDescription}>
                      Get notified at the start of your fertile window
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.fertileWindow}
                  onValueChange={(value) => handleReminderToggle('fertileWindow', value)}
                  trackColor={{ false: Colors.inactive, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </Card>

            <Text style={styles.sectionTitle}>Daily Reminders</Text>

            <Card style={styles.remindersCard}>
              <View style={styles.reminderRow}>
                <View style={styles.reminderInfo}>
                  <View style={[styles.reminderIconContainer, { backgroundColor: Colors.gold + '20' }]}>
                    <AlertCircle size={20} color={Colors.gold} />
                  </View>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderTitle}>Medication Reminder</Text>
                    <Text style={styles.reminderDescription}>
                      Daily reminder at your set time
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.medication}
                  onValueChange={(value) => handleReminderToggle('medication', value)}
                  trackColor={{ false: Colors.inactive, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={[styles.reminderRow, styles.lastReminderRow]}>
                <View style={styles.reminderInfo}>
                  <View style={[styles.reminderIconContainer, { backgroundColor: '#4FC3F7' + '20' }]}>
                    <Droplet size={20} color="#4FC3F7" />
                  </View>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderTitle}>Hydration Reminder</Text>
                    <Text style={styles.reminderDescription}>
                      Daily reminder at noon to stay hydrated
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.hydration}
                  onValueChange={(value) => handleReminderToggle('hydration', value)}
                  trackColor={{ false: Colors.inactive, true: Colors.primary }}
                  thumbColor={Colors.white}
                />
              </View>
            </Card>

            {predictions && (
              <Card style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Clock size={16} color={Colors.accent} />
                  <Text style={styles.scheduleTitle}>Upcoming Scheduled</Text>
                </View>
                {preferences.periodStart && predictions.nextPeriodDate && (
                  <View style={styles.scheduleItem}>
                    <View style={[styles.scheduleDot, { backgroundColor: Colors.error }]} />
                    <Text style={styles.scheduleText}>
                      Period reminder: {new Date(new Date(predictions.nextPeriodDate).getTime() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                )}
                {preferences.fertileWindow && predictions.fertileWindowStart && (
                  <View style={styles.scheduleItem}>
                    <View style={[styles.scheduleDot, { backgroundColor: Colors.accent }]} />
                    <Text style={styles.scheduleText}>
                      Fertile window: {new Date(predictions.fertileWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                )}
                {preferences.ovulation && predictions.fertileWindowStart && (
                  <View style={styles.scheduleItem}>
                    <View style={[styles.scheduleDot, { backgroundColor: Colors.secondary }]} />
                    <Text style={styles.scheduleText}>
                      Ovulation day: {new Date(new Date(predictions.fertileWindowStart).getTime() + 2 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                )}
                {!predictions.nextPeriodDate && (
                  <Text style={styles.noDataText}>
                    Log more cycle data to get personalized reminder timing.
                  </Text>
                )}
              </Card>
            )}

            <Text style={styles.reminderNote}>
              Reminders are sent as push notifications. Cycle-based reminders update automatically when new predictions are generated.
            </Text>

            <Button
              title={isSaving ? 'Saving...' : hasChanges ? 'Save Settings' : 'Settings Saved'}
              onPress={handleSaveSettings}
              style={!hasChanges ? { ...styles.saveButton, ...styles.savedButton } : styles.saveButton}
              disabled={isSaving || !hasChanges}
            />
          </>
        )}

        {!preferences.notificationsEnabled && (
          <Card style={styles.disabledCard}>
            <BellOff size={40} color={Colors.inactive} style={styles.disabledIcon} />
            <Text style={styles.disabledTitle}>Notifications are disabled</Text>
            <Text style={styles.disabledDescription}>
              Enable notifications to receive reminders about your cycle, medications, and hydration.
            </Text>
          </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  mainToggleCard: {
    padding: 16,
    marginBottom: 24,
  },
  mainToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainToggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  mainToggleTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  mainToggleDescription: {
    fontSize: 14,
    color: Colors.subtext,
  },
  permissionWarning: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  remindersCard: {
    marginBottom: 20,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastReminderRow: {
    borderBottomWidth: 0,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  reminderIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  reminderDescription: {
    fontSize: 12,
    color: Colors.subtext,
  },
  scheduleCard: {
    padding: 16,
    marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  scheduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scheduleText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  noDataText: {
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },
  reminderNote: {
    fontSize: 13,
    color: Colors.subtext,
    marginBottom: 20,
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 4,
  },
  savedButton: {
    opacity: 0.6,
  },
  disabledCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledIcon: {
    marginBottom: 16,
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  disabledDescription: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
