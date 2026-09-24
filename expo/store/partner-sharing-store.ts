import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PartnerAuditEntry,
  PartnerGender,
  PartnerInvite,
  PartnerPermissions,
  PartnerSharedSnapshot,
} from '../types/partner-sharing';
import { logDataAccess, logDataUpdate } from '../utils/audit-logger';
import { useUserStore } from '../store/user-store';
import { supabase } from '../lib/supabase';

interface RelationshipRecord {
  id: string;
  owner_user_id: string;
  partner_user_id: string | null;
  status: 'pending' | 'accepted' | 'revoked';
  invite_code: string;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  last_partner_view_at: string | null;
}

interface SharingSettingsRecord {
  relationship_id: string;
  partner_gender: PartnerGender;
  permissions: PartnerPermissions;
  consent_granted_at: string | null;
  partner_consent_at: string | null;
  consent_revoked_at: string | null;
  updated_at: string | null;
}

interface SharedSnapshotRecord {
  relationship_id: string;
  snapshot: PartnerSharedSnapshot;
  updated_at: string | null;
}

interface PartnerSharingState {
  isEnabled: boolean;
  relationshipId: string | null;
  invite: PartnerInvite | null;
  permissions: PartnerPermissions;
  partnerGender: PartnerGender | null;
  partnerAccepted: boolean;
  partnerCanEditOwnData: boolean;
  partnerUniqueId: string | null;
  isViewer: boolean;
  lastPartnerViewAt: string | null;
  sharedSnapshot: PartnerSharedSnapshot | null;
  auditLog: PartnerAuditEntry[];
  consentGrantedAt: string | null;
  partnerConsentAt: string | null;
  consentRevokedAt: string | null;
  error: string | null;

  syncFromServer: () => Promise<void>;
  enableSharing: (payload: { partnerGender: PartnerGender; partnerUniqueId?: string }) => Promise<void>;
  rotateInvite: () => Promise<void>;
  disableSharing: () => Promise<void>;
  updatePermissions: (permissions: PartnerPermissions) => Promise<void>;
  setPartnerAccepted: () => Promise<void>;
  linkToOwner: (payload: { inviteCode: string }) => Promise<void>;
  refreshSharedSnapshot: (snapshot: PartnerSharedSnapshot) => Promise<void>;
  markPartnerViewed: () => Promise<void>;
  clearPartnerData: () => void;
}

const createInviteCode = (): string => {
  const segment = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${segment()}-${segment()}`;
};

const createAuditEntry = (action: string, details: string): PartnerAuditEntry => {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    action,
    details,
  };
};

const buildPartnerCapabilities = (gender: PartnerGender) => {
  if (gender === 'male') {
    return { canEditOwnData: false };
  }
  if (gender === 'female') {
    return { canEditOwnData: true };
  }
  return { canEditOwnData: false };
};

const getCurrentUserId = (): { userId: string | null; uniqueId: string | null } => {
  const { user } = useUserStore.getState();
  return { userId: user?.id ?? null, uniqueId: user?.uniqueId ?? null };
};

export const getDefaultPartnerPermissions = (): PartnerPermissions => ({
  mood: true,
  cycle_predictions: true,
  symptoms: true,
  pregnancy_milestones: true,
  appointments: true,
  private_notes: false,
  ai_chat_history: false,
  sexual_activity: false,
});

export const buildSharedSnapshot = (payload: {
  permissions: PartnerPermissions;
  latestMood?: string;
  latestSymptoms?: string[];
  predictions?: PartnerSharedSnapshot['cyclePredictions'];
  pregnancySummary?: PartnerSharedSnapshot['pregnancySummary'];
  appointmentsCount?: number;
}): PartnerSharedSnapshot => {
  const snapshot: PartnerSharedSnapshot = {
    lastUpdated: new Date().toISOString(),
  };

  if (payload.permissions.mood && payload.latestMood) {
    snapshot.latestMood = payload.latestMood;
  }
  if (payload.permissions.symptoms && payload.latestSymptoms) {
    snapshot.latestSymptoms = payload.latestSymptoms;
  }
  if (payload.permissions.cycle_predictions && payload.predictions) {
    snapshot.cyclePredictions = payload.predictions;
  }
  if (payload.permissions.pregnancy_milestones && payload.pregnancySummary) {
    snapshot.pregnancySummary = payload.pregnancySummary;
  }
  if (payload.permissions.appointments && typeof payload.appointmentsCount === 'number') {
    snapshot.appointmentsCount = payload.appointmentsCount;
  }

  return snapshot;
};

export const usePartnerSharingStore = create<PartnerSharingState>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      relationshipId: null,
      invite: null,
      permissions: getDefaultPartnerPermissions(),
      partnerGender: null,
      partnerAccepted: false,
      partnerCanEditOwnData: false,
      partnerUniqueId: null,
      isViewer: false,
      lastPartnerViewAt: null,
      sharedSnapshot: null,
      auditLog: [],
      consentGrantedAt: null,
      partnerConsentAt: null,
      consentRevokedAt: null,
      error: null,

      syncFromServer: async () => {
        try {
          const { userId } = getCurrentUserId();
          if (!userId) {
            console.log('[PartnerSharing] No user logged in, skipping sync');
            return;
          }

          console.log('[PartnerSharing] Syncing relationship for user', userId);

          const { data: relationshipData, error: relationshipError } = await supabase
            .from('relationships')
            .select('*')
            .or(`owner_user_id.eq.${userId},partner_user_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (relationshipError) {
            const message = relationshipError?.message ?? 'Unable to load partner relationship.';
            console.warn('[PartnerSharing] Sync relationship error:', message, 'code:', relationshipError?.code ?? 'unknown');
            set({ error: message });
            return;
          }

          if (!relationshipData) {
            set({
              isEnabled: false,
              relationshipId: null,
              invite: null,
              partnerGender: null,
              partnerAccepted: false,
              isViewer: false,
              sharedSnapshot: null,
              lastPartnerViewAt: null,
              error: null,
            });
            return;
          }

          const relationship = relationshipData as RelationshipRecord;

          const { data: settingsData, error: settingsError } = await supabase
            .from('sharing_settings')
            .select('*')
            .eq('relationship_id', relationship.id)
            .maybeSingle();

          if (settingsError) {
            const message = settingsError?.message ?? 'Unable to load sharing settings.';
            console.warn('[PartnerSharing] Sync settings error:', message, 'code:', settingsError?.code ?? 'unknown');
            set({ error: message });
            return;
          }

          const { data: snapshotData, error: snapshotError } = await supabase
            .from('shared_snapshots')
            .select('*')
            .eq('relationship_id', relationship.id)
            .maybeSingle();

          if (snapshotError) {
            const message = snapshotError?.message ?? 'Unable to load shared snapshot.';
            console.warn('[PartnerSharing] Sync snapshot error:', message, 'code:', snapshotError?.code ?? 'unknown');
            set({ error: message });
            return;
          }

          const settings = settingsData as SharingSettingsRecord | null;
          const snapshot = snapshotData as SharedSnapshotRecord | null;
          const isViewer = relationship.partner_user_id === userId;
          const invite: PartnerInvite = {
            code: relationship.invite_code,
            status: relationship.status,
            createdAt: relationship.created_at,
            acceptedAt: relationship.accepted_at ?? undefined,
            revokedAt: relationship.revoked_at ?? undefined,
          };

          const partnerGender = settings?.partner_gender ?? null;
          const capabilities = partnerGender ? buildPartnerCapabilities(partnerGender) : { canEditOwnData: false };

          set({
            isEnabled: relationship.status !== 'revoked',
            relationshipId: relationship.id,
            invite,
            permissions: settings?.permissions ?? getDefaultPartnerPermissions(),
            partnerGender,
            partnerAccepted: relationship.status === 'accepted',
            partnerCanEditOwnData: capabilities.canEditOwnData,
            partnerUniqueId: null,
            isViewer,
            lastPartnerViewAt: relationship.last_partner_view_at,
            sharedSnapshot: snapshot?.snapshot ?? null,
            consentGrantedAt: settings?.consent_granted_at ?? null,
            partnerConsentAt: settings?.partner_consent_at ?? null,
            consentRevokedAt: settings?.consent_revoked_at ?? null,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unable to sync partner sharing.';
          console.warn('[PartnerSharing] Sync error:', message);
          set({ error: message });
        }
      },

      enableSharing: async ({ partnerGender, partnerUniqueId }) => {
        try {
          const { userId } = getCurrentUserId();
          if (!userId) {
            set({ error: 'Please sign in to enable sharing.' });
            return;
          }

          const inviteCode = createInviteCode();
          const { data: relationshipData, error: relationshipError } = await supabase
            .from('relationships')
            .insert({
              owner_user_id: userId,
              partner_user_id: null,
              status: 'pending',
              invite_code: inviteCode,
            })
            .select('*')
            .single();

          if (relationshipError || !relationshipData) {
            console.error('[PartnerSharing] Enable sharing error', relationshipError);
            set({ error: 'Unable to enable partner sharing.' });
            return;
          }

          const { error: settingsError } = await supabase.from('sharing_settings').upsert({
            relationship_id: relationshipData.id,
            partner_gender: partnerGender,
            permissions: getDefaultPartnerPermissions(),
            consent_granted_at: new Date().toISOString(),
          });

          if (settingsError) {
            console.error('[PartnerSharing] Settings save error', settingsError);
          }

          const invite: PartnerInvite = {
            code: inviteCode,
            status: 'pending',
            createdAt: relationshipData.created_at,
          };
          const capabilities = buildPartnerCapabilities(partnerGender);
          const auditEntry = createAuditEntry(
            'sharing_enabled',
            `Partner sharing enabled. Invite created for ${partnerGender} partner.`
          );

          console.log('[PartnerSharing] Sharing enabled with invite', invite.code);

          set({
            isEnabled: true,
            relationshipId: relationshipData.id,
            invite,
            partnerGender,
            partnerAccepted: false,
            partnerCanEditOwnData: capabilities.canEditOwnData,
            partnerUniqueId: partnerUniqueId ?? null,
            isViewer: false,
            auditLog: [...get().auditLog, auditEntry],
            consentGrantedAt: new Date().toISOString(),
            consentRevokedAt: null,
            error: null,
          });
        } catch (error) {
          console.error('[PartnerSharing] Enable sharing exception', error);
          set({ error: 'Unable to enable partner sharing.' });
        }
      },

      rotateInvite: async () => {
        try {
          const relationshipId = get().relationshipId;
          if (!relationshipId) {
            set({ error: 'Select partner gender before generating a new invite.' });
            return;
          }
          const inviteCode = createInviteCode();
          const { data, error } = await supabase
            .from('relationships')
            .update({ invite_code: inviteCode, status: 'pending' })
            .eq('id', relationshipId)
            .select('*')
            .single();

          if (error || !data) {
            console.error('[PartnerSharing] Invite rotation error', error);
            set({ error: 'Unable to rotate invite code.' });
            return;
          }

          const invite: PartnerInvite = {
            code: inviteCode,
            status: data.status,
            createdAt: data.created_at,
            acceptedAt: data.accepted_at ?? undefined,
            revokedAt: data.revoked_at ?? undefined,
          };

          const auditEntry = createAuditEntry('invite_rotated', 'Partner invite code regenerated.');
          console.log('[PartnerSharing] Invite regenerated', invite.code);
          set({ invite, auditLog: [...get().auditLog, auditEntry], error: null });
        } catch (error) {
          console.error('[PartnerSharing] Invite rotation exception', error);
          set({ error: 'Unable to rotate invite code.' });
        }
      },

      disableSharing: async () => {
        try {
          const relationshipId = get().relationshipId;
          if (!relationshipId) {
            set({ error: 'No active sharing to disable.' });
            return;
          }

          const revokedAt = new Date().toISOString();
          const { data, error } = await supabase
            .from('relationships')
            .update({ status: 'revoked', revoked_at: revokedAt })
            .eq('id', relationshipId)
            .select('*')
            .single();

          if (error || !data) {
            console.error('[PartnerSharing] Disable sharing error', error);
            set({ error: 'Unable to disable sharing.' });
            return;
          }

          const auditEntry = createAuditEntry('sharing_disabled', 'Partner sharing disabled by owner.');
          const revokedInvite: PartnerInvite = {
            code: data.invite_code,
            status: 'revoked',
            createdAt: data.created_at,
            acceptedAt: data.accepted_at ?? undefined,
            revokedAt: revokedAt,
          };

          console.log('[PartnerSharing] Sharing disabled');

          set({
            isEnabled: false,
            relationshipId: null,
            invite: revokedInvite,
            partnerAccepted: false,
            partnerUniqueId: null,
            isViewer: false,
            sharedSnapshot: null,
            lastPartnerViewAt: null,
            auditLog: [...get().auditLog, auditEntry],
            consentRevokedAt: revokedAt,
            error: null,
          });
        } catch (error) {
          console.error('[PartnerSharing] Disable sharing exception', error);
          set({ error: 'Unable to disable sharing.' });
        }
      },

      updatePermissions: async (permissions) => {
        const sanitized: PartnerPermissions = {
          ...permissions,
          private_notes: false,
          ai_chat_history: false,
          sexual_activity: false,
        };
        const relationshipId = get().relationshipId;
        if (!relationshipId) {
          set({ error: 'No active relationship found.' });
          return;
        }

        try {
          const { error } = await supabase.from('sharing_settings').upsert({
            relationship_id: relationshipId,
            permissions: sanitized,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error('[PartnerSharing] Permissions update error', error);
            set({ error: 'Unable to update permissions.' });
            return;
          }

          const auditEntry = createAuditEntry('permissions_updated', 'Partner sharing permissions updated.');
          console.log('[PartnerSharing] Permissions updated', sanitized);
          set({ permissions: sanitized, auditLog: [...get().auditLog, auditEntry], error: null });
          logDataUpdate('partner-sharing', 'permissions');
        } catch (error) {
          console.error('[PartnerSharing] Permissions update exception', error);
          set({ error: 'Unable to update permissions.' });
        }
      },

      setPartnerAccepted: async () => {
        try {
          const relationshipId = get().relationshipId;
          if (!relationshipId) return;
          const acceptedAt = new Date().toISOString();
          const { data, error } = await supabase
            .from('relationships')
            .update({ status: 'accepted', accepted_at: acceptedAt })
            .eq('id', relationshipId)
            .select('*')
            .single();

          if (error || !data) {
            console.error('[PartnerSharing] Accept invite error', error);
            return;
          }

          const invite: PartnerInvite = {
            code: data.invite_code,
            status: 'accepted',
            createdAt: data.created_at,
            acceptedAt: acceptedAt,
            revokedAt: data.revoked_at ?? undefined,
          };

          const auditEntry = createAuditEntry('invite_accepted', 'Partner accepted invite.');
          set({
            invite,
            partnerAccepted: true,
            auditLog: [...get().auditLog, auditEntry],
            partnerConsentAt: acceptedAt,
          });
        } catch (error) {
          console.error('[PartnerSharing] Accept invite exception', error);
        }
      },

      linkToOwner: async ({ inviteCode }) => {
        try {
          const { userId } = getCurrentUserId();
          if (!userId) {
            set({ error: 'Please sign in to accept an invite.' });
            return;
          }

          const { data: relationshipData, error: relationshipError } = await supabase
            .from('relationships')
            .select('*')
            .eq('invite_code', inviteCode)
            .eq('status', 'pending')
            .maybeSingle();

          if (relationshipError || !relationshipData) {
            console.error('[PartnerSharing] Invite lookup error', relationshipError);
            set({ error: 'Invite code not found.' });
            return;
          }

          const acceptedAt = new Date().toISOString();
          const { data: updatedRelationship, error: updateError } = await supabase
            .from('relationships')
            .update({ partner_user_id: userId, status: 'accepted', accepted_at: acceptedAt })
            .eq('id', relationshipData.id)
            .select('*')
            .single();

          if (updateError || !updatedRelationship) {
            console.error('[PartnerSharing] Accept invite update error', updateError);
            set({ error: 'Unable to accept invite.' });
            return;
          }

          const { data: settingsData } = await supabase
            .from('sharing_settings')
            .select('*')
            .eq('relationship_id', updatedRelationship.id)
            .maybeSingle();

          const { data: snapshotData } = await supabase
            .from('shared_snapshots')
            .select('*')
            .eq('relationship_id', updatedRelationship.id)
            .maybeSingle();

          const invite: PartnerInvite = {
            code: updatedRelationship.invite_code,
            status: 'accepted',
            createdAt: updatedRelationship.created_at,
            acceptedAt: acceptedAt,
          };

          const auditEntry = createAuditEntry('partner_linked', 'Partner linked to owner account.');
          console.log('[PartnerSharing] Partner linked with invite', inviteCode);

          const settings = settingsData as SharingSettingsRecord | null;
          const partnerGender = settings?.partner_gender ?? null;
          const capabilities = partnerGender ? buildPartnerCapabilities(partnerGender) : { canEditOwnData: false };
          const snapshot = snapshotData as SharedSnapshotRecord | null;

          set({
            isEnabled: true,
            relationshipId: updatedRelationship.id,
            invite,
            partnerAccepted: true,
            isViewer: true,
            partnerGender,
            partnerCanEditOwnData: capabilities.canEditOwnData,
            permissions: settings?.permissions ?? getDefaultPartnerPermissions(),
            sharedSnapshot: snapshot?.snapshot ?? null,
            auditLog: [...get().auditLog, auditEntry],
            partnerConsentAt: acceptedAt,
            error: null,
          });
        } catch (error) {
          console.error('[PartnerSharing] Link partner exception', error);
          set({ error: 'Unable to accept invite.' });
        }
      },

      refreshSharedSnapshot: async (snapshot) => {
        const relationshipId = get().relationshipId;
        if (!relationshipId) {
          set({ error: 'No active relationship found.' });
          return;
        }

        try {
          const { error } = await supabase.from('shared_snapshots').upsert({
            relationship_id: relationshipId,
            snapshot,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error('[PartnerSharing] Snapshot update error', error);
            set({ error: 'Unable to sync shared snapshot.' });
            return;
          }

          set({ sharedSnapshot: snapshot, error: null });
        } catch (error) {
          console.error('[PartnerSharing] Snapshot update exception', error);
          set({ error: 'Unable to sync shared snapshot.' });
        }
      },

      markPartnerViewed: async () => {
        const relationshipId = get().relationshipId;
        if (!relationshipId) {
          return;
        }

        try {
          const timestamp = new Date().toISOString();
          const { error } = await supabase
            .from('relationships')
            .update({ last_partner_view_at: timestamp })
            .eq('id', relationshipId);

          if (error) {
            console.error('[PartnerSharing] Mark viewed error', error);
          }

          const auditEntry = createAuditEntry('partner_viewed', 'Partner viewed shared summary.');
          console.log('[PartnerSharing] Partner viewed shared data');
          set({ lastPartnerViewAt: timestamp, auditLog: [...get().auditLog, auditEntry] });
          logDataAccess('partner-sharing', 'shared_snapshot');
        } catch (error) {
          console.error('[PartnerSharing] Mark viewed exception', error);
        }
      },

      clearPartnerData: () => {
        const auditEntry = createAuditEntry('partner_data_cleared', 'Partner data removed from device.');
        set({
          sharedSnapshot: null,
          lastPartnerViewAt: null,
          auditLog: [...get().auditLog, auditEntry],
        });
      },
    }),
    {
      name: 'partner-sharing-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        relationshipId: state.relationshipId,
        invite: state.invite,
        permissions: state.permissions,
        partnerGender: state.partnerGender,
        partnerAccepted: state.partnerAccepted,
        partnerCanEditOwnData: state.partnerCanEditOwnData,
        partnerUniqueId: state.partnerUniqueId,
        isViewer: state.isViewer,
        lastPartnerViewAt: state.lastPartnerViewAt,
        sharedSnapshot: state.sharedSnapshot,
        auditLog: state.auditLog,
        consentGrantedAt: state.consentGrantedAt,
        partnerConsentAt: state.partnerConsentAt,
        consentRevokedAt: state.consentRevokedAt,
      }),
    }
  )
);

export const usePartnerAccess = () => {
  const { user } = useUserStore();
  const store = usePartnerSharingStore();

  const isViewer = store.isViewer;

  return {
    isViewer,
    canEditOwnData: !isViewer,
    shouldHidePrivateNotes: isViewer,
    shouldHideAIChat: isViewer,
    shouldHideSexualActivity: isViewer,
    permissions: store.permissions,
    sharedSnapshot: store.sharedSnapshot,
    lastPartnerViewAt: store.lastPartnerViewAt,
  };
};
