import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://xftwntynzjgaedyfyxew.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdHdudHluempnYWVkeWZ5eGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NjY0NjQsImV4cCI6MjA5NDE0MjQ2NH0.4STbainlAE-MFkcR-irX1qi9VzyYNncWrPDiFRndD_M';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing!');
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log('[Supabase Auth] getItem:', key, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.error('[Supabase Auth] getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log('[Supabase Auth] setItem:', key);
    } catch (error) {
      console.error('[Supabase Auth] setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      console.log('[Supabase Auth] removeItem:', key);
    } catch (error) {
      console.error('[Supabase Auth] removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          encrypted_username: string | null;
          onboarded: boolean | null;
          life_stage: string | null;
          age_group: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          encrypted_username?: string | null;
          onboarded?: boolean | null;
          life_stage?: string | null;
          age_group?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          encrypted_username?: string | null;
          onboarded?: boolean | null;
          life_stage?: string | null;
          age_group?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mood_logs: {
        Row: {
          id: string;
          user_id: string;
          mood_score: number;
          intensity: number;
          emoji: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mood_score: number;
          intensity?: number;
          emoji?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mood_score?: number;
          intensity?: number;
          emoji?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      lifestyle_logs: {
        Row: {
          id: string;
          user_id: string;
          sleep_hours: number | null;
          exercise_minutes: number | null;
          water_intake_ml: number | null;
          stress_level: number | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sleep_hours?: number | null;
          exercise_minutes?: number | null;
          water_intake_ml?: number | null;
          stress_level?: number | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sleep_hours?: number | null;
          exercise_minutes?: number | null;
          water_intake_ml?: number | null;
          stress_level?: number | null;
          date?: string;
          created_at?: string;
        };
      };
      ai_predictions: {
        Row: {
          id: string;
          user_id: string;
          predicted_mood: number;
          confidence: number;
          prediction_date: string;
          prediction_type: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          predicted_mood?: number;
          confidence?: number;
          prediction_date: string;
          prediction_type: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          predicted_mood?: number;
          confidence?: number;
          prediction_date?: string;
          prediction_type?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      symptom_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          cycle_day: number | null;
          symptoms: {
            id: string;
            intensity: number;
            isCustom: boolean;
          }[];
          moods: string[];
          notes: string | null;
          flow_intensity: string | null;
          discharge_type: string | null;
          pain_level: string | null;
          cravings: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          cycle_day?: number | null;
          symptoms?: {
            id: string;
            intensity: number;
            isCustom: boolean;
          }[];
          moods?: string[];
          notes?: string | null;
          flow_intensity?: string | null;
          discharge_type?: string | null;
          pain_level?: string | null;
          cravings?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          cycle_day?: number | null;
          symptoms?: {
            id: string;
            intensity: number;
            isCustom: boolean;
          }[];
          moods?: string[];
          notes?: string | null;
          flow_intensity?: string | null;
          discharge_type?: string | null;
          pain_level?: string | null;
          cravings?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_symptoms: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          next_period_date: string;
          fertile_window_start: string;
          fertile_window_end: string;
          average_cycle_length: number;
          average_period_length: number;
          confidence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          next_period_date: string;
          fertile_window_start: string;
          fertile_window_end: string;
          average_cycle_length: number;
          average_period_length: number;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          next_period_date?: string;
          fertile_window_start?: string;
          fertile_window_end?: string;
          average_cycle_length?: number;
          average_period_length?: number;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string;
          icon: string;
          color: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          description: string;
          icon: string;
          color: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          description?: string;
          icon?: string;
          color?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      redemption_codes: {
        Row: {
          id: string;
          code: string;
          product_type: 'supermoon' | 'full_moon' | 'starter';
          product_name: string;
          status: 'available' | 'redeemed' | 'expired';
          created_for_email: string | null;
          redeemed_by_user_id: string | null;
          redeemed_by_email: string | null;
          redeemed_at: string | null;
          expires_at: string | null;
          partner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          product_type: 'supermoon' | 'full_moon' | 'starter';
          product_name: string;
          status?: 'available' | 'redeemed' | 'expired';
          created_for_email?: string | null;
          redeemed_by_user_id?: string | null;
          redeemed_by_email?: string | null;
          redeemed_at?: string | null;
          expires_at?: string | null;
          partner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          product_type?: 'supermoon' | 'full_moon' | 'starter';
          product_name?: string;
          status?: 'available' | 'redeemed' | 'expired';
          created_for_email?: string | null;
          redeemed_by_user_id?: string | null;
          redeemed_by_email?: string | null;
          redeemed_at?: string | null;
          expires_at?: string | null;
          partner_id?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          plan: 'free' | 'monthly' | 'yearly';
          status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
          amount: number;
          currency: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          cancellation_reason: string | null;
          refund_amount: number | null;
          refund_status: 'pending' | 'processed' | 'failed' | null;
          refund_processed_at: string | null;
          source: 'stripe' | 'redemption_code';
          redemption_code_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          plan: 'free' | 'monthly' | 'yearly';
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
          amount: number;
          currency?: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          cancellation_reason?: string | null;
          refund_amount?: number | null;
          refund_status?: 'pending' | 'processed' | 'failed' | null;
          refund_processed_at?: string | null;
          source: 'stripe' | 'redemption_code';
          redemption_code_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          plan?: 'free' | 'monthly' | 'yearly';
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';
          amount?: number;
          currency?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          cancellation_reason?: string | null;
          refund_amount?: number | null;
          refund_status?: 'pending' | 'processed' | 'failed' | null;
          refund_processed_at?: string | null;
          source?: 'stripe' | 'redemption_code';
          redemption_code_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_orders: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          stripe_payment_intent_id: string | null;
          amount: number;
          currency: string;
          status: 'completed' | 'pending' | 'failed' | 'refunded';
          refund_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          stripe_payment_intent_id?: string | null;
          amount: number;
          currency?: string;
          status?: 'completed' | 'pending' | 'failed' | 'refunded';
          refund_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          stripe_payment_intent_id?: string | null;
          amount?: number;
          currency?: string;
          status?: 'completed' | 'pending' | 'failed' | 'refunded';
          refund_amount?: number | null;
          created_at?: string;
        };
      };
      cancellation_requests: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          reason: string | null;
          plan_type: 'monthly' | 'yearly';
          refund_amount: number | null;
          refund_status: 'pending' | 'processed' | 'failed' | 'not_applicable';
          effective_date: string;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          reason?: string | null;
          plan_type: 'monthly' | 'yearly';
          refund_amount?: number | null;
          refund_status?: 'pending' | 'processed' | 'failed' | 'not_applicable';
          effective_date: string;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          reason?: string | null;
          plan_type?: 'monthly' | 'yearly';
          refund_amount?: number | null;
          refund_status?: 'pending' | 'processed' | 'failed' | 'not_applicable';
          effective_date?: string;
          created_at?: string;
          processed_at?: string | null;
        };
      };
      sexual_activity_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          protected: boolean;
          protection_type: string | null;
          libido: 'low' | 'moderate' | 'high' | null;
          comfort: 'comfortable' | 'some_discomfort' | 'painful' | null;
          orgasm: boolean | null;
          notes: string | null;
          cycle_phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          protected?: boolean;
          protection_type?: string | null;
          libido?: 'low' | 'moderate' | 'high' | null;
          comfort?: 'comfortable' | 'some_discomfort' | 'painful' | null;
          orgasm?: boolean | null;
          notes?: string | null;
          cycle_phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          protected?: boolean;
          protection_type?: string | null;
          libido?: 'low' | 'moderate' | 'high' | null;
          comfort?: 'comfortable' | 'some_discomfort' | 'painful' | null;
          orgasm?: boolean | null;
          notes?: string | null;
          cycle_phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown' | null;
          created_at?: string;
        };
      };
      partner_education_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          card_id: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          card_id: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string;
          card_id?: string;
          completed_at?: string;
        };
      };
      reminder_preferences: {
        Row: {
          id: string;
          user_id: string;
          notifications_enabled: boolean;
          period_start: boolean;
          period_end: boolean;
          ovulation: boolean;
          fertile_window: boolean;
          medication: boolean;
          hydration: boolean;
          reminder_time: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notifications_enabled?: boolean;
          period_start?: boolean;
          period_end?: boolean;
          ovulation?: boolean;
          fertile_window?: boolean;
          medication?: boolean;
          hydration?: boolean;
          reminder_time?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notifications_enabled?: boolean;
          period_start?: boolean;
          period_end?: boolean;
          ovulation?: boolean;
          fertile_window?: boolean;
          medication?: boolean;
          hydration?: boolean;
          reminder_time?: string;
          updated_at?: string;
        };
      };
      country_access: {
        Row: {
          country_code: string;
          is_enabled: boolean;
          reason: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          country_code: string;
          is_enabled?: boolean;
          reason?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          country_code?: string;
          is_enabled?: boolean;
          reason?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};

export type CountryAccessRow = Database['public']['Tables']['country_access']['Row'];
export type SexualActivityLogRow = Database['public']['Tables']['sexual_activity_logs']['Row'];

export type RedemptionCode = Database['public']['Tables']['redemption_codes']['Row'];
export type RedemptionCodeProductType = 'supermoon' | 'full_moon' | 'starter';
export type UserSubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionOrderRow = Database['public']['Tables']['subscription_orders']['Row'];
export type CancellationRequestRow = Database['public']['Tables']['cancellation_requests']['Row'];
