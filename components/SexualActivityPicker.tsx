import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Shield, ShieldCheck, X, Heart, Thermometer, Smile, Info } from 'lucide-react-native';
import Colors from '../constants/colors';
import { SexualActivityType } from '../types/cycle';

interface SexualActivityPickerProps {
  sexualActivity?: SexualActivityType;
  onUpdate: (activity: SexualActivityType | undefined) => void;
  cyclePhase?: string;
}

const CYCLE_PHASE_INSIGHTS: Record<string, string> = {
  menstrual: 'During menstruation, libido can vary. Some experience increased desire due to hormonal shifts. Tracking helps identify your personal pattern.',
  follicular: 'Rising oestrogen during the follicular phase often increases libido and energy. This is a common time for heightened desire.',
  ovulation: 'Around ovulation, oestrogen and testosterone peak, often leading to the highest libido of the cycle. This is also the most fertile window.',
  luteal: 'Progesterone rises in the luteal phase, which can lower libido for some. PMS symptoms may also affect comfort and desire.',
  unknown: 'Tracking sexual activity alongside your cycle helps identify patterns in libido, comfort, and desire across different phases.',
};

export function SexualActivityPicker({ sexualActivity, onUpdate, cyclePhase }: SexualActivityPickerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [localActivity, setLocalActivity] = useState<SexualActivityType | undefined>(sexualActivity);
  const [notes, setNotes] = useState(sexualActivity?.notes || '');

  const hasActivity = sexualActivity !== undefined;
  const phase = cyclePhase || 'unknown';

  const protectionTypes: { id: SexualActivityType['protectionType']; label: string }[] = [
    { id: 'condom', label: 'Condom' },
    { id: 'pill', label: 'Birth Control Pill' },
    { id: 'iud', label: 'IUD' },
    { id: 'withdrawal', label: 'Withdrawal' },
    { id: 'other', label: 'Other' },
  ];

  const handleToggleActivity = () => {
    if (hasActivity) {
      onUpdate(undefined);
      setLocalActivity(undefined);
      setNotes('');
    } else {
      setShowDetails(true);
      setLocalActivity({ protected: false, libido: 'moderate', comfort: 'comfortable' });
    }
  };

  const handleProtectedToggle = (isProtected: boolean) => {
    if (localActivity) {
      setLocalActivity({
        ...localActivity,
        protected: isProtected,
        protectionType: isProtected ? localActivity.protectionType : undefined,
      });
    }
  };

  const handleProtectionTypeSelect = (type: SexualActivityType['protectionType']) => {
    if (localActivity) {
      setLocalActivity({ ...localActivity, protectionType: type });
    }
  };

  const handleLibidoSelect = (libido: SexualActivityType['libido']) => {
    if (localActivity) {
      setLocalActivity({ ...localActivity, libido });
    }
  };

  const handleComfortSelect = (comfort: SexualActivityType['comfort']) => {
    if (localActivity) {
      setLocalActivity({ ...localActivity, comfort });
    }
  };

  const handleOrgasmToggle = (orgasm: boolean) => {
    if (localActivity) {
      setLocalActivity({ ...localActivity, orgasm });
    }
  };

  const handleSaveDetails = () => {
    if (localActivity) {
      onUpdate({
        ...localActivity,
        notes: notes.trim() || undefined,
      });
    }
    setShowDetails(false);
  };

  const handleCancel = () => {
    setLocalActivity(sexualActivity);
    setNotes(sexualActivity?.notes || '');
    setShowDetails(false);
  };

  const getLibidoLabel = (libido?: string) => {
    switch (libido) {
      case 'low': return 'Low';
      case 'moderate': return 'Moderate';
      case 'high': return 'High';
      default: return '';
    }
  };

  const getComfortLabel = (comfort?: string) => {
    switch (comfort) {
      case 'comfortable': return 'Comfortable';
      case 'some_discomfort': return 'Some Discomfort';
      case 'painful': return 'Painful';
      default: return '';
    }
  };

  const getSummaryText = () => {
    if (!sexualActivity) return '';
    const parts: string[] = [];
    if (sexualActivity.protected) {
      parts.push(`Protected${sexualActivity.protectionType ? ` (${sexualActivity.protectionType})` : ''}`);
    } else {
      parts.push('Unprotected');
    }
    if (sexualActivity.libido) {
      parts.push(`Libido: ${getLibidoLabel(sexualActivity.libido)}`);
    }
    if (sexualActivity.comfort) {
      parts.push(`Comfort: ${getComfortLabel(sexualActivity.comfort)}`);
    }
    return parts.join('  •  ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contextBanner}>
        <Info size={14} color={Colors.primary} />
        <Text style={styles.contextText}>
          {CYCLE_PHASE_INSIGHTS[phase]}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.activityButton, hasActivity && styles.activityButtonActive]}
        onPress={handleToggleActivity}
      >
        {hasActivity ? (
          <ShieldCheck size={22} color={Colors.white} />
        ) : (
          <Shield size={22} color={Colors.primary} />
        )}
        <Text style={[styles.activityButtonText, hasActivity && styles.activityButtonTextActive]}>
          {hasActivity ? 'Sexual Activity Logged' : 'Log Sexual Activity'}
        </Text>
      </TouchableOpacity>

      {hasActivity && (
        <View style={styles.activityInfo}>
          <Text style={styles.activityInfoText} numberOfLines={2}>
            {getSummaryText()}
          </Text>
          <TouchableOpacity onPress={() => setShowDetails(true)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <TouchableWithoutFeedback onPress={handleCancel}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Sexual Activity</Text>
                  <TouchableOpacity onPress={handleCancel}>
                    <X size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <Shield size={16} color={Colors.primary} />
                      <Text style={styles.sectionTitle}>Protection Used?</Text>
                    </View>
                    <Text style={styles.sectionHint}>
                      Important for fertility tracking and pregnancy risk assessment relative to your cycle phase.
                    </Text>
                    <View style={styles.protectionButtons}>
                      <TouchableOpacity
                        style={[styles.toggleButton, localActivity?.protected && styles.toggleButtonActive]}
                        onPress={() => handleProtectedToggle(true)}
                      >
                        <Text style={[styles.toggleButtonText, localActivity?.protected && styles.toggleButtonTextActive]}>
                          Yes
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, localActivity && !localActivity.protected && styles.toggleButtonActive]}
                        onPress={() => handleProtectedToggle(false)}
                      >
                        <Text style={[styles.toggleButtonText, localActivity && !localActivity.protected && styles.toggleButtonTextActive]}>
                          No
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {localActivity?.protected && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionTitle}>Protection Type</Text>
                      <View style={styles.protectionTypeList}>
                        {protectionTypes.map((type) => (
                          <TouchableOpacity
                            key={type.id}
                            style={[
                              styles.protectionTypeButton,
                              localActivity.protectionType === type.id && styles.protectionTypeButtonActive,
                            ]}
                            onPress={() => handleProtectionTypeSelect(type.id)}
                          >
                            <Text
                              style={[
                                styles.protectionTypeText,
                                localActivity.protectionType === type.id && styles.protectionTypeTextActive,
                              ]}
                            >
                              {type.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <Heart size={16} color="#E74C8B" />
                      <Text style={styles.sectionTitle}>Libido / Desire Level</Text>
                    </View>
                    <Text style={styles.sectionHint}>
                      Libido naturally fluctuates with hormonal changes across your cycle. Tracking it helps identify your personal pattern.
                    </Text>
                    <View style={styles.tripleButtons}>
                      {(['low', 'moderate', 'high'] as const).map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[styles.tripleButton, localActivity?.libido === level && styles.tripleButtonActive]}
                          onPress={() => handleLibidoSelect(level)}
                        >
                          <Text style={[styles.tripleButtonText, localActivity?.libido === level && styles.tripleButtonTextActive]}>
                            {getLibidoLabel(level)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <Thermometer size={16} color={Colors.warning} />
                      <Text style={styles.sectionTitle}>Comfort Level</Text>
                    </View>
                    <Text style={styles.sectionHint}>
                      Discomfort or pain during intimacy can correlate with cycle phase, hormonal balance, or conditions like endometriosis. Persistent pain should be discussed with a doctor.
                    </Text>
                    <View style={styles.tripleButtons}>
                      {(['comfortable', 'some_discomfort', 'painful'] as const).map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.tripleButton,
                            localActivity?.comfort === level && (level === 'painful' ? styles.tripleButtonDanger : styles.tripleButtonActive),
                          ]}
                          onPress={() => handleComfortSelect(level)}
                        >
                          <Text
                            style={[
                              styles.tripleButtonText,
                              localActivity?.comfort === level && styles.tripleButtonTextActive,
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {getComfortLabel(level)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <Smile size={16} color={Colors.success} />
                      <Text style={styles.sectionTitle}>Orgasm</Text>
                    </View>
                    <Text style={styles.sectionHint}>
                      Orgasm frequency can vary with hormonal levels. Tracking helps identify if cycle phase affects your experience.
                    </Text>
                    <View style={styles.protectionButtons}>
                      <TouchableOpacity
                        style={[styles.toggleButton, localActivity?.orgasm === true && styles.toggleButtonActive]}
                        onPress={() => handleOrgasmToggle(true)}
                      >
                        <Text style={[styles.toggleButtonText, localActivity?.orgasm === true && styles.toggleButtonTextActive]}>
                          Yes
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, localActivity?.orgasm === false && styles.toggleButtonActive]}
                        onPress={() => handleOrgasmToggle(false)}
                      >
                        <Text style={[styles.toggleButtonText, localActivity?.orgasm === false && styles.toggleButtonTextActive]}>
                          No
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Notes (Optional)</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Any additional observations..."
                      placeholderTextColor={Colors.inactive}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </ScrollView>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveDetails}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.lilacLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.lilacMid,
  },
  contextText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  activityButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  activityButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginLeft: 8,
  },
  activityButtonTextActive: {
    color: Colors.white,
  },
  activityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  activityInfoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    marginRight: 12,
    lineHeight: 18,
  },
  editText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  modalScroll: {
    marginBottom: 16,
  },
  sectionBlock: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginBottom: 12,
  },
  protectionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toggleButtonTextActive: {
    color: Colors.white,
  },
  protectionTypeList: {
    gap: 8,
  },
  protectionTypeButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  protectionTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  protectionTypeText: {
    fontSize: 14,
    color: Colors.text,
  },
  protectionTypeTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  tripleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tripleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tripleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tripleButtonDanger: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  tripleButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tripleButtonTextActive: {
    color: Colors.white,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    height: 72,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
  },
});
