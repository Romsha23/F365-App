import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('[Notifications] Failed to set notification handler:', e);
}

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export interface NotificationSettings {
  periodReminders: boolean;
  fertileWindowReminders: boolean;
  logReminders: boolean;
  logReminderTime?: string;
  periodReminderDays?: number;
  fertileWindowReminderDays?: number;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  try {
    let Device: typeof import('expo-device') | null = null;
    try {
      Device = require('expo-device');
    } catch {
      console.log('expo-device not available');
      return null;
    }

    if (!Device?.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission to receive push notifications was denied');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push notification token:', token);
    
    await AsyncStorage.setItem('@push_token', token);
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }

  return {
    periodReminders: true,
    fertileWindowReminders: true,
    logReminders: true,
    logReminderTime: '20:00',
    periodReminderDays: 2,
    fertileWindowReminderDays: 1,
  };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    console.log('Notification settings saved');
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

export async function schedulePeriodReminder(date: Date, daysInAdvance: number = 2): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const reminderDate = new Date(date);
    reminderDate.setDate(reminderDate.getDate() - daysInAdvance);
    reminderDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (reminderDate <= now) {
      console.log('Reminder date is in the past, skipping');
      return;
    }

    const secondsUntilReminder = Math.floor((reminderDate.getTime() - Date.now()) / 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🩸 Period Reminder',
        body: `Your period is expected in ${daysInAdvance} days. Make sure you're prepared!`,
        sound: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilReminder,
      },
    });

    console.log('Period reminder scheduled for:', reminderDate);
  } catch (error) {
    console.error('Error scheduling period reminder:', error);
  }
}

export async function scheduleFertileWindowReminder(date: Date, daysInAdvance: number = 1): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const reminderDate = new Date(date);
    reminderDate.setDate(reminderDate.getDate() - daysInAdvance);
    reminderDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (reminderDate <= now) {
      console.log('Reminder date is in the past, skipping');
      return;
    }

    const secondsUntilReminder = Math.floor((reminderDate.getTime() - Date.now()) / 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💚 Fertile Window',
        body: 'Your fertile window is approaching. Track your cycle for accurate predictions!',
        sound: false,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilReminder,
      },
    });

    console.log('Fertile window reminder scheduled for:', reminderDate);
  } catch (error) {
    console.error('Error scheduling fertile window reminder:', error);
  }
}

export async function scheduleDailyLogReminder(time: string = '20:00'): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [hours, minutes] = time.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📝 Log Your Day',
        body: "Don't forget to log your symptoms, mood, and cycle information today!",
        sound: false,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });

    console.log('Daily log reminder scheduled for:', time);
  } catch (error) {
    console.error('Error scheduling daily log reminder:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

export async function getScheduledNotificationsCount(): Promise<number> {
  if (Platform.OS === 'web') return 0;

  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return 0;
  }
}
