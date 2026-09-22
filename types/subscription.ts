// Update subscription types with proper handling of free plan
export type SubscriptionPlan = 'free' | 'monthly' | 'yearly';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'unpaid' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'trialing';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
  priceId?: string;
  amount: number;
  currency: string;
}

export interface SubscriptionFeatures {
  maxCycles: number;
  aiInsights: boolean;
  aiChatbot: boolean;
  exportData: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  advancedPredictions: boolean;
  customReminders: boolean;
  emergencyContacts: number;
  dataRetention: number; // in days
  symptomCorrelation: boolean;
  telehealthIntegration: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionPlan, SubscriptionFeatures> = {
  free: {
    maxCycles: 3,
    aiInsights: false,
    aiChatbot: false,
    exportData: false,
    prioritySupport: false,
    advancedAnalytics: false,
    advancedPredictions: false,
    customReminders: false,
    emergencyContacts: 1,
    dataRetention: 90,
    symptomCorrelation: false,
    telehealthIntegration: false,
  },
  monthly: {
    maxCycles: -1,
    aiInsights: true,
    aiChatbot: true,
    exportData: true,
    prioritySupport: true,
    advancedAnalytics: true,
    advancedPredictions: true,
    customReminders: true,
    emergencyContacts: 5,
    dataRetention: 365,
    symptomCorrelation: true,
    telehealthIntegration: true,
  },
  yearly: {
    maxCycles: -1,
    aiInsights: true,
    aiChatbot: true,
    exportData: true,
    prioritySupport: true,
    advancedAnalytics: true,
    advancedPredictions: true,
    customReminders: true,
    emergencyContacts: 10,
    dataRetention: -1,
    symptomCorrelation: true,
    telehealthIntegration: true,
  },
};

export interface SubscriptionPrice {
  amount: number;
  currency: string;
}

export const SUBSCRIPTION_PRICES: Record<SubscriptionPlan, SubscriptionPrice | null> = {
  free: null,
  monthly: {
    amount: 9.99,
    currency: 'USD',
  },
  yearly: {
    amount: 99.99,
    currency: 'USD',
  },
};

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
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
}

export interface SubscriptionOrder {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  refund_amount: number | null;
  created_at: string;
}

export interface CancellationRequest {
  id: string;
  user_id: string;
  subscription_id: string;
  reason: string | null;
  plan_type: SubscriptionPlan;
  refund_amount: number | null;
  refund_status: 'pending' | 'processed' | 'failed' | 'not_applicable';
  effective_date: string;
  created_at: string;
  processed_at: string | null;
}

export const calculateRefundAmount = (
  plan: SubscriptionPlan,
  amountPaid: number,
  periodStart: Date,
  periodEnd: Date,
  cancellationDate: Date = new Date()
): { refundAmount: number; monthsRemaining: number; effectiveEndDate: Date } => {
  if (plan === 'monthly' || plan === 'free') {
    const endOfCurrentMonth = new Date(cancellationDate.getFullYear(), cancellationDate.getMonth() + 1, 0);
    return {
      refundAmount: 0,
      monthsRemaining: 0,
      effectiveEndDate: endOfCurrentMonth,
    };
  }

  const endOfCurrentMonth = new Date(cancellationDate.getFullYear(), cancellationDate.getMonth() + 1, 0);
  
  const monthlyRate = amountPaid / 12;
  
  const monthsElapsed = Math.ceil(
    (cancellationDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  const monthsRemaining = Math.max(0, 12 - monthsElapsed);
  
  const refundAmount = Math.round(monthsRemaining * monthlyRate * 100) / 100;

  return {
    refundAmount,
    monthsRemaining,
    effectiveEndDate: endOfCurrentMonth,
  };
};

// Helper function to get subscription price safely with proper type checking
export const getSubscriptionPrice = (plan: SubscriptionPlan): SubscriptionPrice | null => {
  return SUBSCRIPTION_PRICES[plan];
};

// Helper function to check if plan is paid
export const isPaidPlan = (plan: SubscriptionPlan): boolean => {
  return plan === 'monthly' || plan === 'yearly';
};

// Helper function to get plan features safely
export const getPlanFeatures = (plan: SubscriptionPlan): SubscriptionFeatures => {
  return SUBSCRIPTION_FEATURES[plan];
};