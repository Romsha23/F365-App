export type PartnerGender = 'male' | 'female' | 'other';

export type PartnerPermissionKey =
  | 'mood'
  | 'cycle_predictions'
  | 'symptoms'
  | 'pregnancy_milestones'
  | 'appointments'
  | 'private_notes'
  | 'ai_chat_history'
  | 'sexual_activity';

export type PartnerPermissions = {
  mood: boolean;
  cycle_predictions: boolean;
  symptoms: boolean;
  pregnancy_milestones: boolean;
  appointments: boolean;
  private_notes: boolean;
  ai_chat_history: boolean;
  sexual_activity: boolean;
};

export type PartnerInviteStatus = 'idle' | 'pending' | 'accepted' | 'revoked';

export type PartnerInvite = {
  code: string;
  status: PartnerInviteStatus;
  createdAt: string;
  acceptedAt?: string;
  revokedAt?: string;
};

export type PartnerProfile = {
  gender: PartnerGender;
  canEditOwnData: boolean;
};

export type PartnerAuditEntry = {
  id: string;
  timestamp: string;
  action: string;
  details: string;
};

export type PartnerSharedSnapshot = {
  lastUpdated: string;
  latestMood?: string;
  latestSymptoms?: string[];
  cyclePredictions?: {
    nextPeriodDate?: string;
    fertileWindowStart?: string;
    fertileWindowEnd?: string;
    confidence?: number;
  };
  pregnancySummary?: {
    mode?: string | null;
    currentWeek?: number;
    daysUntilDue?: number;
  };
  appointmentsCount?: number;
};
