import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

export interface ReminderPreferences {
  notificationsEnabled: boolean;
  periodStart: boolean;
  periodEnd: boolean;
  ovulation: boolean;
  fertileWindow: boolean;
  medication: boolean;
  hydration: boolean;
  reminderTime: string;
}

interface ReminderStore {
  preferences: ReminderPreferences;
  permissionGranted: boolean;
  isLoading: boolean;
  isSaving: boolean;
  scheduledNotificationIds: string[];

  initialize: () => Promise<void>;
  updatePreference: (key: keyof ReminderPreferences, value: boolean | string) => void;
  savePreferences: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleNotifications: (predictions?: { nextPeriodDate?: string; fertileWindowStart?: string; fertileWindowEnd?: string }) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const STORAGE_KEY = '@reminder_preferences';
const NOTIFICATION_IDS_KEY = '@reminder_notification_ids';

const DEFAULT_PREFERENCES: ReminderPreferences = {
  notificationsEnabled: false,
  periodStart: true,
  periodEnd: false,
  ovulation: true,
  fertileWindow: true,
  medication: false,
  hydration: false,
  reminderTime: '09:00',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useReminderStore = create<ReminderStore>((set, get) => ({
  preferences: { ...DEFAULT_PREFERENCES },
  permissionGranted: false,
  isLoading: false,
  isSaving: false,
  scheduledNotificationIds: [],

  initialize: async () => {
    try {
      set({ isLoading: true });
      console.log('[Reminders] Initializing...');

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const local: ReminderPreferences = stored ? JSON.parse(stored) : { ...DEFAULT_PREFERENCES };

      const storedIds = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      const notificationIds: string[] = storedIds ? JSON.parse(storedIds) : [];

      let permissionGranted = false;
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.getPermissionsAsync();
        permissionGranted = status === 'granted';
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('reminder_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            const serverPrefs: ReminderPreferences = {
              notificationsEnabled: data.notifications_enabled,
              periodStart: data.period_start,
              periodEnd: data.period_end,
              ovulation: data.ovulation,
              fertileWindow: data.fertile_window,
              medication: data.medication,
              hydration: data.hydration,
              reminderTime: data.reminder_time || '09:00',
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverPrefs));
            set({
              preferences: serverPrefs,
              permissionGranted,
              scheduledNotificationIds: notificationIds,
              isLoading: false,
            });
            console.log('[Reminders] Loaded from Supabase');
            return;
          }
        }
      } catch {
        console.log('[Reminders] No auth, using local only');
      }

      set({
        preferences: local,
        permissionGranted,
        scheduledNotificationIds: notificationIds,
        isLoading: false,
      });
      console.log('[Reminders] Loaded from local storage');
    } catch (error) {
      console.error('[Reminders] Init error:', error);
      set({ isLoading: false });
    }
  },

  updatePreference: (key, value) => {
    const current = get().preferences;
    set({
      preferences: {
        ...current,
        [key]: value,
      },
    });
  },

  savePreferences: async () => {
    try {
      set({ isSaving: true });
      const prefs = get().preferences;

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      console.log('[Reminders] Saved to local storage');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('reminder_preferences')
            .upsert({
              user_id: user.id,
              notifications_enabled: prefs.notificationsEnabled,
              period_start: prefs.periodStart,
              period_end: prefs.periodEnd,
              ovulation: prefs.ovulation,
              fertile_window: prefs.fertileWindow,
              medication: prefs.medication,
              hydration: prefs.hydration,
              reminder_time: prefs.reminderTime,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          console.log('[Reminders] Synced to Supabase');
        }
      } catch {
        console.log('[Reminders] Supabase sync skipped');
      }

      if (prefs.notificationsEnabled) {
        await get().scheduleNotifications();
      } else {
        await get().cancelAllNotifications();
      }

      set({ isSaving: false });
    } catch (error) {
      console.error('[Reminders] Save error:', error);
      set({ isSaving: false });
    }
  },

  requestPermission: async () => {
    try {
      if (Platform.OS === 'web') {
        set({ permissionGranted: true });
        return true;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus === 'granted') {
        set({ permissionGranted: true });
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      set({ permissionGranted: granted });
      console.log('[Reminders] Permission:', granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('[Reminders] Permission request error:', error);
      return false;
    }
  },

  scheduleNotifications: async (predictions) => {
    try {
      if (Platform.OS === 'web') {
        console.log('[Reminders] Web: Skipping native notification scheduling');
        return;
      }

      await get().cancelAllNotifications();

      const prefs = get().preferences;
      if (!prefs.notificationsEnabled) return;

      const permissionGranted = get().permissionGranted;
      if (!permissionGranted) {
        const granted = await get().requestPermission();
        if (!granted) return;
      }

      const newIds: string[] = [];
      const [hours, minutes] = prefs.reminderTime.split(':').map(Number);

      if (prefs.periodStart && predictions?.nextPeriodDate) {
        const periodDate = new Date(predictions.nextPeriodDate);
        const reminderDate = new Date(periodDate);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(hours, minutes, 0, 0);

        if (reminderDate > new Date()) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Period Reminder',
              body: 'Your period is expected to start tomorrow. Stay prepared!',
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderDate,
            },
          });
          newIds.push(id);
          console.log('[Reminders] Scheduled period start reminder:', reminderDate.toISOString());
        }
      }

      if (prefs.ovulation && predictions?.fertileWindowStart) {
        const fertileStart = new Date(predictions.fertileWindowStart);
        const ovulationDate = new Date(fertileStart);
        ovulationDate.setDate(ovulationDate.getDate() + 2);
        ovulationDate.setHours(hours, minutes, 0, 0);

        if (ovulationDate > new Date()) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Ovulation Day',
              body: 'Today is your predicted ovulation day.',
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: ovulationDate,
            },
          });
          newIds.push(id);
          console.log('[Reminders] Scheduled ovulation reminder:', ovulationDate.toISOString());
        }
      }

      if (prefs.fertileWindow && predictions?.fertileWindowStart) {
        const fertileDate = new Date(predictions.fertileWindowStart);
        fertileDate.setHours(hours, minutes, 0, 0);

        if (fertileDate > new Date()) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Fertile Window Starting',
              body: 'Your fertile window is beginning today.',
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: fertileDate,
            },
          });
          newIds.push(id);
          console.log('[Reminders] Scheduled fertile window reminder:', fertileDate.toISOString());
        }
      }

      if (prefs.hydration) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Hydration Reminder',
            body: 'Remember to drink water and stay hydrated!',
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 12,
            minute: 0,
          },
        });
        newIds.push(id);
        console.log('[Reminders] Scheduled daily hydration reminder');
      }

      if (prefs.medication) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Medication Reminder',
            body: 'Time to take your medication.',
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
          },
        });
        newIds.push(id);
        console.log('[Reminders] Scheduled daily medication reminder');
      }

      set({ scheduledNotificationIds: newIds });
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(newIds));
      console.log('[Reminders] Scheduled', newIds.length, 'notifications');
    } catch (error) {
      console.error('[Reminders] Schedule error:', error);
    }
  },

  cancelAllNotifications: async () => {
    try {
      if (Platform.OS === 'web') return;

      const ids = get().scheduledNotificationIds;
      for (const id of ids) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
          // ignore
        }
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      set({ scheduledNotificationIds: [] });
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify([]));
      console.log('[Reminders] Cancelled all notifications');
    } catch (error) {
      console.error('[Reminders] Cancel error:', error);
    }
  },
}));
