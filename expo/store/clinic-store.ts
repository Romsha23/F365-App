import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Clinic, ClinicMatchResult, ClinicMatchInput, ClinicConsentData, ClinicContactRequest } from '@/types/clinic';
import { matchClinics } from '@/utils/clinic-matching';

interface ClinicState {
  clinics: Clinic[];
  matchResults: ClinicMatchResult[];
  contactRequests: ClinicContactRequest[];
  selectedClinic: Clinic | null;
  isLoading: boolean;
  error: string | null;

  loadClinics: (country?: string) => Promise<void>;
  runMatching: (input: ClinicMatchInput) => void;
  selectClinic: (clinic: Clinic | null) => void;
  submitContactRequest: (clinicId: string, consent: ClinicConsentData) => Promise<void>;
  loadContactRequests: () => Promise<void>;
}

function mapRowToClinic(row: any): Clinic {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    city: row.city,
    state: row.state,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    services: row.services ?? [],
    waitTime: row.wait_time ?? '2-4 weeks',
    gpReferralRequired: row.gp_referral_required ?? false,
    telehealthAvailable: row.telehealth_available ?? false,
    packagesAvailable: row.packages_available ?? false,
    directBooking: row.direct_booking ?? false,
    medicareAccepted: row.medicare_accepted ?? false,
    description: row.description ?? '',
    phone: row.phone ?? '',
    website: row.website ?? '',
    operatingHours: row.operating_hours ?? '',
    accreditation: row.accreditation ?? '',
    createdAt: row.created_at,
  };
}

export const useClinicStore = create<ClinicState>()((set, get) => ({
  clinics: [],
  matchResults: [],
  contactRequests: [],
  selectedClinic: null,
  isLoading: false,
  error: null,

  loadClinics: async (country?: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[ClinicStore] Loading clinics, country filter:', country);
      let query = supabase.from('clinics').select('*');
      if (country) {
        query = query.eq('country', country);
      }
      const { data, error } = await query.order('name');

      if (error) {
        console.error('[ClinicStore] Load error:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      const clinics = (data ?? []).map(mapRowToClinic);
      console.log('[ClinicStore] Loaded', clinics.length, 'clinics');
      set({ clinics, isLoading: false });
    } catch (err: any) {
      console.error('[ClinicStore] Unexpected error:', err);
      set({ error: err.message ?? 'Failed to load clinics', isLoading: false });
    }
  },

  runMatching: (input: ClinicMatchInput) => {
    const { clinics } = get();
    console.log('[ClinicStore] Running matching on', clinics.length, 'clinics');
    const results = matchClinics(clinics, input);
    set({ matchResults: results });
  },

  selectClinic: (clinic: Clinic | null) => {
    set({ selectedClinic: clinic });
  },

  submitContactRequest: async (clinicId: string, consent: ClinicConsentData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log('[ClinicStore] Submitting contact request for clinic:', clinicId);

      const { error: consentError } = await supabase.from('clinic_consent_log').insert([
        {
          user_id: user.id,
          clinic_id: clinicId,
          consent_type: 'share_profile',
          consent_given: consent.shareWithClinic,
        },
        ...(consent.includeFertilityReport ? [{
          user_id: user.id,
          clinic_id: clinicId,
          consent_type: 'share_fertility_report' as const,
          consent_given: true,
        }] : []),
        ...(consent.shareWithMultiple ? [{
          user_id: user.id,
          clinic_id: clinicId,
          consent_type: 'share_multiple' as const,
          consent_given: true,
        }] : []),
      ]);

      if (consentError) {
        console.error('[ClinicStore] Consent log error:', consentError);
      }

      const { error: requestError } = await supabase.from('clinic_contact_requests').insert({
        user_id: user.id,
        clinic_id: clinicId,
        consent_share_profile: consent.shareWithClinic,
        consent_share_fertility_report: consent.includeFertilityReport,
        consent_share_with_multiple: consent.shareWithMultiple,
        selected_clinic_ids: consent.selectedClinicIds,
        status: 'pending',
      });

      if (requestError) {
        console.error('[ClinicStore] Contact request error:', requestError);
        throw requestError;
      }

      console.log('[ClinicStore] Contact request submitted successfully');
      await get().loadContactRequests();
      set({ isLoading: false });
    } catch (err: any) {
      console.error('[ClinicStore] Submit error:', err);
      set({ error: err.message ?? 'Failed to submit request', isLoading: false });
      throw err;
    }
  },

  loadContactRequests: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clinic_contact_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ClinicStore] Load requests error:', error);
        return;
      }

      const requests: ClinicContactRequest[] = (data ?? []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        clinicId: r.clinic_id,
        consentShareProfile: r.consent_share_profile,
        consentShareFertilityReport: r.consent_share_fertility_report,
        consentShareWithMultiple: r.consent_share_with_multiple,
        selectedClinics: r.selected_clinic_ids ?? [],
        status: r.status,
        createdAt: r.created_at,
      }));

      set({ contactRequests: requests });
    } catch (err: any) {
      console.error('[ClinicStore] Load requests unexpected error:', err);
    }
  },
}));
