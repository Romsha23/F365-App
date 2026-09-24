export type ClinicCountry = 'AU' | 'IN' | 'PK' | 'US' | 'UK' | 'OTHER';

export interface Clinic {
  id: string;
  name: string;
  country: ClinicCountry;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  services: string[];
  waitTime: string;
  gpReferralRequired: boolean;
  telehealthAvailable: boolean;
  packagesAvailable: boolean;
  directBooking: boolean;
  medicareAccepted: boolean;
  description: string;
  phone: string;
  website: string;
  operatingHours: string;
  accreditation: string;
  createdAt: string;
}

export interface ClinicMatchResult {
  clinic: Clinic;
  matchScore: number;
  matchReasons: string[];
}

export interface ClinicContactRequest {
  id: string;
  userId: string;
  clinicId: string;
  consentShareProfile: boolean;
  consentShareFertilityReport: boolean;
  consentShareWithMultiple: boolean;
  selectedClinics: string[];
  status: 'pending' | 'contacted' | 'responded' | 'closed';
  createdAt: string;
}

export interface ClinicConsentData {
  shareWithClinic: boolean;
  shareWithMultiple: boolean;
  includeFertilityReport: boolean;
  selectedClinicIds: string[];
}

export interface ClinicMatchInput {
  userCountry: string;
  userAge?: number;
  ivfReadinessScore?: number;
  preferredServices: string[];
  preferLowWaitTime: boolean;
  preferTelehealth: boolean;
}
