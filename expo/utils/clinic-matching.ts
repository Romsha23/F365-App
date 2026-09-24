import { Clinic, ClinicMatchResult, ClinicMatchInput } from '@/types/clinic';

function parseWaitTimeWeeks(waitTime: string): number {
  const match = waitTime.match(/(\d+)/);
  if (!match) return 4;
  return parseInt(match[1], 10);
}

function calculateLocationScore(clinic: Clinic, userCountry: string): number {
  if (clinic.country === userCountry) return 30;
  if (['AU', 'NZ'].includes(clinic.country) && ['AU', 'NZ'].includes(userCountry)) return 20;
  if (['IN', 'PK'].includes(clinic.country) && ['IN', 'PK'].includes(userCountry)) return 15;
  return 5;
}

function calculateServiceMatchScore(clinic: Clinic, preferredServices: string[]): number {
  if (preferredServices.length === 0) return 20;
  const clinicServicesLower = clinic.services.map(s => s.toLowerCase());
  const matchCount = preferredServices.filter(pref =>
    clinicServicesLower.some(cs => cs.includes(pref.toLowerCase()))
  ).length;
  return Math.round((matchCount / Math.max(preferredServices.length, 1)) * 30);
}

function calculateWaitTimeScore(clinic: Clinic, preferLow: boolean): number {
  const weeks = parseWaitTimeWeeks(clinic.waitTime);
  if (!preferLow) return 10;
  if (weeks <= 1) return 20;
  if (weeks <= 2) return 16;
  if (weeks <= 4) return 12;
  if (weeks <= 6) return 8;
  return 4;
}

function calculatePreferenceScore(clinic: Clinic, input: ClinicMatchInput): number {
  let score = 0;
  const maxScore = 20;

  if (input.preferTelehealth && clinic.telehealthAvailable) score += 8;
  if (clinic.services.length >= 4) score += 4;
  if (clinic.accreditation && clinic.accreditation.length > 0) score += 4;
  if (input.userAge && input.userAge >= 35) {
    if (clinic.services.some(s => s.toLowerCase().includes('pgt') || s.toLowerCase().includes('genetic'))) {
      score += 4;
    }
  }

  return Math.min(score, maxScore);
}

function generateMatchReasons(clinic: Clinic, input: ClinicMatchInput): string[] {
  const reasons: string[] = [];

  if (clinic.country === input.userCountry) {
    reasons.push('Located in your country');
  }

  if (input.userAge) {
    if (input.userAge < 35) {
      reasons.push(`Matches your age group (under 35)`);
    } else if (input.userAge < 40) {
      reasons.push(`Matches your age group (35-39)`);
    } else {
      reasons.push(`Experienced with 40+ age group`);
    }
  }

  const matchingServices = input.preferredServices.filter(pref =>
    clinic.services.some(cs => cs.toLowerCase().includes(pref.toLowerCase()))
  );
  if (matchingServices.length > 0) {
    reasons.push(`Offers ${matchingServices.slice(0, 3).join(', ')}`);
  }

  if (input.preferTelehealth && clinic.telehealthAvailable) {
    reasons.push('Telehealth consultations available');
  }

  if (input.preferLowWaitTime) {
    const weeks = parseWaitTimeWeeks(clinic.waitTime);
    if (weeks <= 2) {
      reasons.push('Short wait time');
    }
  }

  if (clinic.accreditation) {
    reasons.push(`${clinic.accreditation}`);
  }

  return reasons.slice(0, 5);
}

export function matchClinics(
  clinics: Clinic[],
  input: ClinicMatchInput
): ClinicMatchResult[] {
  console.log('[ClinicMatch] Matching clinics for country:', input.userCountry);

  const results: ClinicMatchResult[] = clinics.map(clinic => {
    const locationScore = calculateLocationScore(clinic, input.userCountry);
    const serviceScore = calculateServiceMatchScore(clinic, input.preferredServices);
    const waitTimeScore = calculateWaitTimeScore(clinic, input.preferLowWaitTime);
    const preferenceScore = calculatePreferenceScore(clinic, input);

    const totalScore = Math.min(
      locationScore + serviceScore + waitTimeScore + preferenceScore,
      100
    );

    const matchReasons = generateMatchReasons(clinic, input);

    return {
      clinic,
      matchScore: totalScore,
      matchReasons,
    };
  });

  results.sort((a, b) => b.matchScore - a.matchScore);

  console.log('[ClinicMatch] Top match:', results[0]?.clinic.name, results[0]?.matchScore);
  return results;
}

export function getCountryConfig(country: string) {
  switch (country) {
    case 'AU':
      return {
        showGPRequired: true,
        showMedicareInfo: true,
        showDirectBooking: false,
        showPackages: false,
        ctaText: 'Request clinic contact',
        referralNote: 'GP referral required for Medicare access',
      };
    case 'IN':
    case 'PK':
      return {
        showGPRequired: false,
        showMedicareInfo: false,
        showDirectBooking: true,
        showPackages: true,
        ctaText: 'Book consultation',
        referralNote: null,
      };
    case 'UK':
      return {
        showGPRequired: true,
        showMedicareInfo: false,
        showDirectBooking: false,
        showPackages: false,
        ctaText: 'Request clinic contact',
        referralNote: 'GP referral may be required for NHS funding',
      };
    default:
      return {
        showGPRequired: false,
        showMedicareInfo: false,
        showDirectBooking: true,
        showPackages: true,
        ctaText: 'Request contact',
        referralNote: null,
      };
  }
}
