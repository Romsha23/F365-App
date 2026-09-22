export type FeatureKey =
  | 'home_dashboard'
  | 'calendar'
  | 'insights_tab'
  | 'mood_ai_tab'
  | 'profile_tab'
  | 'log_entry'
  | 'daily_checkin'
  | 'ai_insights'
  | 'ai_chatbot'
  | 'ai_mood_forecast'
  | 'advanced_analytics'
  | 'symptom_checker'
  | 'pregnancy_mode'
  | 'pregnancy_dashboard'
  | 'pregnancy_calendar'
  | 'pregnancy_log'
  | 'pregnancy_setup'
  | 'pregnancy_appointments'
  | 'baby_development'
  | 'kick_counter'
  | 'contraction_timer'
  | 'postpartum_dashboard'
  | 'partner_sharing'
  | 'partner_link'
  | 'partner_summary'
  | 'partner_education'
  | 'relationship_dashboard'
  | 'telehealth'
  | 'book_appointment'
  | 'my_appointments'
  | 'consultation'
  | 'emergency_contacts'
  | 'reminders'
  | 'data_export'
  | 'subscription_management'
  | 'redeem_code'
  | 'edit_profile'
  | 'help_support'
  | 'privacy_policy'
  | 'terms_of_service'
  | 'consent_management'
  | 'fertility_predictions'
  | 'pcos_insights'
  | 'fertility_pathway'
  | 'cost_estimator'
  | 'ivf_roadmap'
  | 'doctor_questions';

export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  category: 'core' | 'ai' | 'pregnancy' | 'partner' | 'health' | 'account' | 'legal';
  defaultEnabled: boolean;
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  { key: 'home_dashboard', label: 'Home Dashboard', description: 'Main cycle tracking dashboard', category: 'core', defaultEnabled: true },
  { key: 'calendar', label: 'Calendar', description: 'Period and cycle calendar view', category: 'core', defaultEnabled: true },
  { key: 'insights_tab', label: 'Insights Tab', description: 'Cycle insights and pattern analysis', category: 'core', defaultEnabled: true },
  { key: 'mood_ai_tab', label: 'Mood AI Tab', description: 'AI-powered mood prediction tab', category: 'ai', defaultEnabled: true },
  { key: 'profile_tab', label: 'Profile Tab', description: 'User profile and settings', category: 'account', defaultEnabled: true },
  { key: 'log_entry', label: 'Daily Log Entry', description: 'Log symptoms, mood, flow, and lifestyle', category: 'core', defaultEnabled: true },
  { key: 'daily_checkin', label: 'Daily Check-In', description: 'Quick daily mood and symptom check-in modal', category: 'core', defaultEnabled: true },
  { key: 'ai_insights', label: 'AI Insights', description: 'AI-generated health insights and predictions', category: 'ai', defaultEnabled: true },
  { key: 'ai_chatbot', label: 'AI Chatbot', description: 'Conversational AI health assistant', category: 'ai', defaultEnabled: true },
  { key: 'ai_mood_forecast', label: 'AI Mood Forecast', description: 'Predictive mood forecasting using AI', category: 'ai', defaultEnabled: true },
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Detailed cycle analytics and trends', category: 'ai', defaultEnabled: true },
  { key: 'symptom_checker', label: 'Symptom Checker', description: 'AI-powered symptom analysis', category: 'health', defaultEnabled: true },
  { key: 'pregnancy_mode', label: 'Pregnancy Mode', description: 'Switch to pregnancy tracking mode', category: 'pregnancy', defaultEnabled: true },
  { key: 'pregnancy_dashboard', label: 'Pregnancy Dashboard', description: 'Pregnancy progress and milestones', category: 'pregnancy', defaultEnabled: true },
  { key: 'pregnancy_calendar', label: 'Pregnancy Calendar', description: 'Week-by-week pregnancy calendar', category: 'pregnancy', defaultEnabled: true },
  { key: 'pregnancy_log', label: 'Pregnancy Log', description: 'Log pregnancy symptoms and notes', category: 'pregnancy', defaultEnabled: true },
  { key: 'pregnancy_setup', label: 'Pregnancy Setup', description: 'Initial pregnancy information setup', category: 'pregnancy', defaultEnabled: true },
  { key: 'pregnancy_appointments', label: 'Pregnancy Appointments', description: 'Track prenatal appointments', category: 'pregnancy', defaultEnabled: true },
  { key: 'baby_development', label: 'Baby Development', description: 'Weekly baby growth tracker', category: 'pregnancy', defaultEnabled: true },
  { key: 'kick_counter', label: 'Kick Counter', description: 'Track baby movements', category: 'pregnancy', defaultEnabled: true },
  { key: 'contraction_timer', label: 'Contraction Timer', description: 'Time contractions during labor', category: 'pregnancy', defaultEnabled: true },
  { key: 'postpartum_dashboard', label: 'Postpartum Dashboard', description: 'Postpartum recovery tracking', category: 'pregnancy', defaultEnabled: true },
  { key: 'partner_sharing', label: 'Partner Sharing', description: 'Share cycle data with partner', category: 'partner', defaultEnabled: true },
  { key: 'partner_link', label: 'Partner Link', description: 'Link partner account', category: 'partner', defaultEnabled: true },
  { key: 'partner_summary', label: 'Partner Summary', description: 'Partner view of cycle summary', category: 'partner', defaultEnabled: true },
  { key: 'partner_education', label: 'Partner Education', description: 'Educational content for partners', category: 'partner', defaultEnabled: true },
  { key: 'relationship_dashboard', label: 'Relationship Dashboard', description: 'Relationship insights and tips', category: 'partner', defaultEnabled: true },
  { key: 'telehealth', label: 'Telehealth', description: 'Virtual health consultations', category: 'health', defaultEnabled: true },
  { key: 'book_appointment', label: 'Book Appointment', description: 'Book telehealth appointments', category: 'health', defaultEnabled: true },
  { key: 'my_appointments', label: 'My Appointments', description: 'View scheduled appointments', category: 'health', defaultEnabled: true },
  { key: 'consultation', label: 'Consultation', description: 'In-app health consultation', category: 'health', defaultEnabled: true },
  { key: 'emergency_contacts', label: 'Emergency Contacts', description: 'Manage emergency contacts', category: 'health', defaultEnabled: true },
  { key: 'reminders', label: 'Reminders', description: 'Custom health reminders', category: 'core', defaultEnabled: true },
  { key: 'data_export', label: 'Data Export', description: 'Export personal health data', category: 'account', defaultEnabled: true },
  { key: 'subscription_management', label: 'Subscription Management', description: 'Manage subscription plan', category: 'account', defaultEnabled: true },
  { key: 'redeem_code', label: 'Redeem Code', description: 'Redeem promotional codes', category: 'account', defaultEnabled: true },
  { key: 'edit_profile', label: 'Edit Profile', description: 'Edit user profile details', category: 'account', defaultEnabled: true },
  { key: 'help_support', label: 'Help & Support', description: 'Help center and FAQ', category: 'account', defaultEnabled: true },
  { key: 'privacy_policy', label: 'Privacy Policy', description: 'View privacy policy', category: 'legal', defaultEnabled: true },
  { key: 'terms_of_service', label: 'Terms of Service', description: 'View terms of service', category: 'legal', defaultEnabled: true },
  { key: 'consent_management', label: 'Consent Management', description: 'Manage data processing consent', category: 'legal', defaultEnabled: true },
  { key: 'fertility_predictions', label: 'Fertility Predictions', description: 'AI-powered fertility window predictions and ovulation tracking', category: 'health', defaultEnabled: true },
  { key: 'pcos_insights', label: 'PCOS Insights', description: 'PCOS symptom tracking, pattern analysis, and management tips', category: 'health', defaultEnabled: true },
  { key: 'fertility_pathway', label: 'Fertility Pathway', description: 'Fertility decision dashboard hub with score, clinics, costs, roadmap', category: 'health', defaultEnabled: true },
  { key: 'cost_estimator', label: 'Cost Estimator', description: 'Country-specific IVF and fertility treatment cost estimates', category: 'health', defaultEnabled: true },
  { key: 'ivf_roadmap', label: 'IVF Roadmap', description: 'Step-by-step IVF journey guide from GP to transfer', category: 'health', defaultEnabled: true },
  { key: 'doctor_questions', label: 'Doctor Questions', description: 'Tailored questions to ask your fertility specialist', category: 'health', defaultEnabled: true },
];

export const FEATURE_CATEGORIES = {
  core: 'Core Features',
  ai: 'AI Features',
  pregnancy: 'Pregnancy Features',
  partner: 'Partner Features',
  health: 'Health Services',
  account: 'Account & Settings',
  legal: 'Legal & Compliance',
} as const;

export const getFeatureDefinition = (key: FeatureKey): FeatureDefinition | undefined => {
  return FEATURE_DEFINITIONS.find(f => f.key === key);
};
