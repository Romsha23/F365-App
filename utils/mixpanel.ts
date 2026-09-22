import { Platform } from 'react-native';

const MIXPANEL_TOKEN = 'b2bfb68cd0008c6f1a3c496bc438c9b2';
const MIXPANEL_API_URL = 'https://api.mixpanel.com/track';

interface EventProperties {
  [key: string]: any;
}

interface UserProperties {
  [key: string]: any;
}

class MixpanelService {
  private distinctId: string | null = null;
  private enabled: boolean = true;

  init(userId?: string) {
    if (!userId) {
      this.distinctId = this.generateDistinctId();
    } else {
      this.distinctId = userId;
    }
    
    console.log('[Mixpanel] Initialized with distinct_id:', this.distinctId);
  }

  private generateDistinctId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  identify(userId: string) {
    this.distinctId = userId;
    console.log('[Mixpanel] Identified user:', userId);
  }

  track(eventName: string, properties: EventProperties = {}) {
    if (!this.enabled) return;

    try {
      const eventData = {
        event: eventName,
        properties: {
          ...properties,
          token: MIXPANEL_TOKEN,
          distinct_id: this.distinctId || this.generateDistinctId(),
          time: Date.now(),
          $os: Platform.OS,
          $browser: Platform.OS === 'web' ? 'Web' : undefined,
          mp_lib: 'react-native',
        },
      };

      console.log('[Mixpanel] Track event:', eventName);

      if (Platform.OS === 'web') {
        this.sendToMixpanelWeb(eventData).catch(() => {});
      } else {
        this.sendToMixpanelNative(eventData).catch(() => {});
      }
    } catch {
      // Silent fail
    }
  }

  private async sendToMixpanelWeb(eventData: any) {
    try {
      const data = btoa(JSON.stringify(eventData));
      const url = `${MIXPANEL_API_URL}?data=${data}`;
      
      await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
        mode: 'no-cors',
      }).catch(() => {});
    } catch {
      // Silent fail
    }
  }

  private async sendToMixpanelNative(eventData: any) {
    try {
      const base64Data = btoa(JSON.stringify(eventData));
      const url = `${MIXPANEL_API_URL}?data=${base64Data}`;
      
      await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      }).catch(() => {});
    } catch {
      // Silent fail
    }
  }

  setUserProperties(properties: UserProperties) {
    if (!this.enabled) return;

    try {
      console.log('[Mixpanel] Set user properties:', Object.keys(properties).join(', '));

      const peopleData = {
        $token: MIXPANEL_TOKEN,
        $distinct_id: this.distinctId || this.generateDistinctId(),
        $set: properties,
      };

      this.sendPeopleUpdate(peopleData).catch(() => {});
    } catch {
      // Silent fail
    }
  }

  private async sendPeopleUpdate(peopleData: any) {
    try {
      const base64Data = btoa(JSON.stringify(peopleData));
      const url = `https://api.mixpanel.com/engage?data=${base64Data}`;
      
      await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
        mode: Platform.OS === 'web' ? 'no-cors' : undefined,
      }).catch(() => {});
    } catch {
      // Silent fail
    }
  }

  incrementUserProperty(propertyName: string, value: number = 1) {
    if (!this.enabled) return;

    try {
      const peopleData = {
        $token: MIXPANEL_TOKEN,
        $distinct_id: this.distinctId || this.generateDistinctId(),
        $add: {
          [propertyName]: value,
        },
      };

      this.sendPeopleUpdate(peopleData).catch(() => {});
    } catch {
      // Silent fail
    }
  }

  trackCharge(amount: number, properties: EventProperties = {}) {
    if (!this.enabled) return;

    try {
      const peopleData = {
        $token: MIXPANEL_TOKEN,
        $distinct_id: this.distinctId || this.generateDistinctId(),
        $append: {
          $transactions: {
            $amount: amount,
            $time: new Date().toISOString(),
            ...properties,
          },
        },
      };

      this.sendPeopleUpdate(peopleData).catch(() => {});
    } catch {
      // Silent fail
    }
  }

  reset() {
    this.distinctId = this.generateDistinctId();
    console.log('[Mixpanel] Reset with new distinct_id:', this.distinctId);
  }

  disable() {
    this.enabled = false;
    console.log('[Mixpanel] Disabled');
  }

  enable() {
    this.enabled = true;
    console.log('[Mixpanel] Enabled');
  }

  timeEvent(eventName: string) {
    const startTime = Date.now();
    return {
      track: (properties: EventProperties = {}) => {
        const duration = Date.now() - startTime;
        this.track(eventName, {
          ...properties,
          duration_ms: duration,
          duration_seconds: Math.round(duration / 1000),
        });
      },
    };
  }
}

export const mixpanel = new MixpanelService();

export const MixpanelEvents = {
  APP_OPENED: 'App Opened',
  
  USER_REGISTERED: 'User Registered',
  USER_LOGIN: 'User Login',
  USER_LOGOUT: 'User Logout',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_STEP_COMPLETED: 'Onboarding Step Completed',
  
  LOG_ENTRY_CREATED: 'Log Entry Created',
  LOG_ENTRY_UPDATED: 'Log Entry Updated',
  MOOD_LOGGED: 'Mood Logged',
  SYMPTOM_LOGGED: 'Symptom Logged',
  FLOW_LOGGED: 'Flow Logged',
  INTIMACY_LOGGED: 'Intimacy Logged',
  MEDICATION_LOGGED: 'Medication Logged',
  PAIN_LEVEL_LOGGED: 'Pain Level Logged',
  DISCHARGE_LOGGED: 'Discharge Logged',
  CRAVINGS_LOGGED: 'Cravings Logged',
  NOTE_ADDED: 'Note Added',
  
  PERIOD_STARTED: 'Period Started',
  PERIOD_ENDED: 'Period Ended',
  
  PREDICTIONS_VIEWED: 'Predictions Viewed',
  PREDICTIONS_GENERATED: 'Predictions Generated',
  INSIGHT_VIEWED: 'Insight Viewed',
  INSIGHT_READ: 'Insight Read',
  AI_TIP_VIEWED: 'AI Tip Viewed',
  
  CALENDAR_VIEWED: 'Calendar Viewed',
  CALENDAR_DAY_SELECTED: 'Calendar Day Selected',
  
  PROFILE_VIEWED: 'Profile Viewed',
  PROFILE_UPDATED: 'Profile Updated',
  EMERGENCY_CONTACTS_VIEWED: 'Emergency Contacts Viewed',
  EMERGENCY_CONTACT_ADDED: 'Emergency Contact Added',
  
  REMINDERS_VIEWED: 'Reminders Viewed',
  REMINDER_CREATED: 'Reminder Created',
  REMINDER_DELETED: 'Reminder Deleted',
  
  DATA_EXPORTED: 'Data Exported',
  DATA_DELETED: 'Data Deleted',
  
  SUBSCRIPTION_PAYWALL_VIEWED: 'Subscription Paywall Viewed',
  SUBSCRIPTION_INITIATED: 'Subscription Initiated',
  SUBSCRIPTION_COMPLETED: 'Subscription Completed',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
  SUBSCRIPTION_RESTORED: 'Subscription Restored',
  
  AI_CHATBOT_OPENED: 'AI Chatbot Opened',
  AI_CHATBOT_MESSAGE_SENT: 'AI Chatbot Message Sent',
  AI_CHATBOT_MESSAGE_RECEIVED: 'AI Chatbot Message Received',
  
  SYMPTOM_CHECKER_OPENED: 'Symptom Checker Opened',
  SYMPTOM_CHECKER_COMPLETED: 'Symptom Checker Completed',
  
  TELEHEALTH_VIEWED: 'Telehealth Viewed',
  APPOINTMENT_BOOKED: 'Appointment Booked',
  APPOINTMENT_CANCELLED: 'Appointment Cancelled',
  CONSULTATION_STARTED: 'Consultation Started',
  CONSULTATION_ENDED: 'Consultation Ended',
  
  ADVANCED_ANALYTICS_VIEWED: 'Advanced Analytics Viewed',
  CHART_VIEWED: 'Chart Viewed',
  
  HELP_VIEWED: 'Help Viewed',
  PRIVACY_POLICY_VIEWED: 'Privacy Policy Viewed',
  TERMS_OF_SERVICE_VIEWED: 'Terms of Service Viewed',
  
  ERROR_OCCURRED: 'Error Occurred',
  SCREEN_VIEWED: 'Screen Viewed',
} as const;

export const MixpanelUserProperties = {
  SUBSCRIPTION_PLAN: 'Subscription Plan',
  SUBSCRIPTION_ACTIVE: 'Subscription Active',
  AVERAGE_CYCLE_LENGTH: 'Average Cycle Length',
  AVERAGE_PERIOD_LENGTH: 'Average Period Length',
  TOTAL_CYCLES_TRACKED: 'Total Cycles Tracked',
  TOTAL_LOGS: 'Total Logs',
  MOST_FREQUENT_MOOD: 'Most Frequent Mood',
  MOST_FREQUENT_SYMPTOMS: 'Most Frequent Symptoms',
  NOTIFICATIONS_ENABLED: 'Notifications Enabled',
  INSIGHTS_ENABLED: 'Insights Enabled',
  LAST_LOG_DATE: 'Last Log Date',
  DAYS_SINCE_LAST_LOG: 'Days Since Last Log',
  ONBOARDED: 'Onboarded',
  FIRST_SEEN: 'First Seen',
} as const;
