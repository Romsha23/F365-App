import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { useUserStore } from '../store/user-store';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { X, ChevronDown } from 'lucide-react-native';
import { CountryPicker } from '../components/CountryPicker';
import { useFeatureGateStore } from '../store/feature-gate-store';
import { 
  Ethnicity, 
  ActivityLevel, 
  DietType, 
  SleepPattern, 
  StressLevel, 
  ContraceptiveType, 
  WeightRange, 
  HeightRange, 
  ClimateType,
  ETHNICITY_LABELS,
  ACTIVITY_LEVEL_LABELS,
  DIET_TYPE_LABELS,
  SLEEP_PATTERN_LABELS,
  STRESS_LEVEL_LABELS,
  CONTRACEPTIVE_TYPE_LABELS,
  WEIGHT_RANGE_LABELS,
  HEIGHT_RANGE_LABELS,
  CLIMATE_TYPE_LABELS,
} from '../types/user';



const CYCLE_LENGTHS = Array.from({ length: 15 }, (_, i) => (i + 21).toString());
const PERIOD_LENGTHS = Array.from({ length: 9 }, (_, i) => (i + 2).toString());

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 70 }, (_, i) => (currentYear - 10 - i).toString());

export default function EditProfileScreen() {
  const { user, updateProfile } = useUserStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [birthMonth, setBirthMonth] = useState(user?.birthMonth?.toString() || '');
  const [birthYear, setBirthYear] = useState(user?.birthYear?.toString() || '');
  const [country, setCountry] = useState(user?.country || '');
  const [cycleLength, setCycleLength] = useState(user?.averageCycleLength?.toString() || '28');
  const [periodLength, setPeriodLength] = useState(user?.averagePeriodLength?.toString() || '5');
  const [ethnicity, setEthnicity] = useState<Ethnicity | undefined>(user?.ethnicity);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(user?.activityLevel);
  const [dietType, setDietType] = useState<DietType | undefined>(user?.dietType);
  const [sleepPattern, setSleepPattern] = useState<SleepPattern | undefined>(user?.sleepPattern);
  const [stressLevel, setStressLevel] = useState<StressLevel | undefined>(user?.stressLevel);
  const [contraceptiveType, setContraceptiveType] = useState<ContraceptiveType | undefined>(user?.contraceptiveType);
  const [weightRange, setWeightRange] = useState<WeightRange | undefined>(user?.weightRange);
  const [heightRange, setHeightRange] = useState<HeightRange | undefined>(user?.heightRange);
  const [climateType, setClimateType] = useState<ClimateType | undefined>(user?.climateType);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showBirthMonthModal, setShowBirthMonthModal] = useState(false);
  const [showBirthYearModal, setShowBirthYearModal] = useState(false);

  const [showCycleLengthModal, setShowCycleLengthModal] = useState(false);
  const [showPeriodLengthModal, setShowPeriodLengthModal] = useState(false);
  const [showEthnicityModal, setShowEthnicityModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showStressModal, setShowStressModal] = useState(false);
  const [showContraceptiveModal, setShowContraceptiveModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showHeightModal, setShowHeightModal] = useState(false);
  const [showClimateModal, setShowClimateModal] = useState(false);
  
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        birthMonth: birthMonth ? parseInt(birthMonth) : undefined,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        country,
        averageCycleLength: parseInt(cycleLength) || 28,
        averagePeriodLength: parseInt(periodLength) || 5,
        ethnicity,
        activityLevel,
        dietType,
        sleepPattern,
        stressLevel,
        contraceptiveType,
        weightRange,
        heightRange,
        climateType,
      });
      
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };

  const renderGenericModal = <T extends string>(
    visible: boolean,
    onClose: () => void,
    title: string,
    options: Record<T, string>,
    onSelect: (value: T) => void,
    currentValue?: T
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{title}</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(options) as T[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.modalItem, currentValue === key && styles.selectedModalItem]}
                    onPress={() => {
                      onSelect(key);
                      onClose();
                    }}
                  >
                    <Text style={[styles.modalItemText, currentValue === key && styles.selectedModalItemText]}>
                      {options[key]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Stack.Screen 
        options={{
          title: 'Edit Profile',
          headerRight: () => (
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userIdContainer}>
          <Text style={styles.userIdLabel}>Your Unique ID</Text>
          <Text style={styles.userId}>{user?.uniqueId || 'Not available'}</Text>
          {user?.email ? (
            <Text style={styles.userEmail}>{user.email}</Text>
          ) : null}
          <Text style={styles.userIdDescription}>
            This is your anonymous 7-digit identifier. We use this instead of your name for privacy.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Display Name (Optional)</Text>
          <Text style={styles.inputHint}>A friendly name shown on your dashboard greeting. Only visible to you.</Text>
          <TextInput
            style={styles.textInputField}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Sarah, Sunshine, Lovely..."
            placeholderTextColor={Colors.inactive}
            maxLength={30}
            autoCapitalize="words"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Birth Month & Year</Text>
          <Text style={styles.inputHint}>
            We only collect month and year - not your exact birth date - for privacy.
          </Text>
          <View style={styles.birthDateContainer}>
            <TouchableOpacity 
              style={[styles.birthDateButton, { flex: 1, marginRight: 8 }]}
              onPress={() => setShowBirthMonthModal(true)}
            >
              <Text style={birthMonth ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                {birthMonth ? MONTHS[parseInt(birthMonth) - 1] : 'Month'}
              </Text>
              <ChevronDown size={16} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.birthDateButton, { flex: 1 }]}
              onPress={() => setShowBirthYearModal(true)}
            >
              <Text style={birthYear ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                {birthYear || 'Year'}
              </Text>
              <ChevronDown size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Country</Text>
          <CountryPicker
            value={country}
            onSelect={(c) => {
              setCountry(c);
              void useFeatureGateStore.getState().loadFlags(c);
            }}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Ethnicity (Optional)</Text>
          <Text style={styles.inputHint}>Helps AI provide ethnicity-specific health patterns</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowEthnicityModal(true)}>
            <Text style={ethnicity ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {ethnicity ? ETHNICITY_LABELS[ethnicity] : "Select ethnicity"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Average Cycle Length (days)</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowCycleLengthModal(true)}>
            <Text style={styles.dropdownSelectedText}>{cycleLength}</Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Average Period Length (days)</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowPeriodLengthModal(true)}>
            <Text style={styles.dropdownSelectedText}>{periodLength}</Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Lifestyle Factors (Optional)</Text>
        <Text style={styles.sectionDescription}>These help AI identify patterns in your cycle</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Activity Level</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowActivityModal(true)}>
            <Text style={activityLevel ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {activityLevel ? ACTIVITY_LEVEL_LABELS[activityLevel] : "Select activity level"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Diet Type</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDietModal(true)}>
            <Text style={dietType ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {dietType ? DIET_TYPE_LABELS[dietType] : "Select diet type"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Sleep Pattern</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowSleepModal(true)}>
            <Text style={sleepPattern ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {sleepPattern ? SLEEP_PATTERN_LABELS[sleepPattern] : "Select sleep pattern"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Stress Level</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowStressModal(true)}>
            <Text style={stressLevel ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {stressLevel ? STRESS_LEVEL_LABELS[stressLevel] : "Select stress level"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraceptive Use</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowContraceptiveModal(true)}>
            <Text style={contraceptiveType ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {contraceptiveType ? CONTRACEPTIVE_TYPE_LABELS[contraceptiveType] : "Select contraceptive type"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Weight Range</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowWeightModal(true)}>
            <Text style={weightRange ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {weightRange ? WEIGHT_RANGE_LABELS[weightRange] : "Select weight range"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Height Range</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowHeightModal(true)}>
            <Text style={heightRange ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {heightRange ? HEIGHT_RANGE_LABELS[heightRange] : "Select height range"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Climate/Region</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowClimateModal(true)}>
            <Text style={climateType ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {climateType ? CLIMATE_TYPE_LABELS[climateType] : "Select climate type"}
            </Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyTitle}>Privacy Information</Text>
          <Text style={styles.privacyText}>
            All optional fields help our AI provide better predictions. Your data is encrypted and never shared. We use ranges instead of exact values for added privacy.
          </Text>
        </View>
        
        <View style={styles.buttonsContainer}>
          <Button title="Cancel" variant="outline" onPress={handleCancel} style={styles.cancelButton} />
          <Button title="Save" onPress={handleSave} loading={isLoading} style={styles.saveButton} />
        </View>
      </ScrollView>
      
      
      {renderGenericModal(showEthnicityModal, () => setShowEthnicityModal(false), 'Select Ethnicity',
        ETHNICITY_LABELS, setEthnicity, ethnicity)}
      
      {renderGenericModal(showActivityModal, () => setShowActivityModal(false), 'Select Activity Level',
        ACTIVITY_LEVEL_LABELS, setActivityLevel, activityLevel)}
      
      {renderGenericModal(showDietModal, () => setShowDietModal(false), 'Select Diet Type',
        DIET_TYPE_LABELS, setDietType, dietType)}
      
      {renderGenericModal(showSleepModal, () => setShowSleepModal(false), 'Select Sleep Pattern',
        SLEEP_PATTERN_LABELS, setSleepPattern, sleepPattern)}
      
      {renderGenericModal(showStressModal, () => setShowStressModal(false), 'Select Stress Level',
        STRESS_LEVEL_LABELS, setStressLevel, stressLevel)}
      
      {renderGenericModal(showContraceptiveModal, () => setShowContraceptiveModal(false), 'Select Contraceptive Type',
        CONTRACEPTIVE_TYPE_LABELS, setContraceptiveType, contraceptiveType)}
      
      {renderGenericModal(showWeightModal, () => setShowWeightModal(false), 'Select Weight Range',
        WEIGHT_RANGE_LABELS, setWeightRange, weightRange)}
      
      {renderGenericModal(showHeightModal, () => setShowHeightModal(false), 'Select Height Range',
        HEIGHT_RANGE_LABELS, setHeightRange, heightRange)}
      
      {renderGenericModal(showClimateModal, () => setShowClimateModal(false), 'Select Climate Type',
        CLIMATE_TYPE_LABELS, setClimateType, climateType)}

      <Modal visible={showBirthMonthModal} transparent animationType="fade" onRequestClose={() => setShowBirthMonthModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowBirthMonthModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Birth Month</Text>
                <ScrollView style={styles.modalScrollView}>
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity key={month} style={styles.modalItem}
                      onPress={() => { setBirthMonth((index + 1).toString()); setShowBirthMonthModal(false); }}>
                      <Text style={styles.modalItemText}>{month}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBirthMonthModal(false)}>
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showBirthYearModal} transparent animationType="fade" onRequestClose={() => setShowBirthYearModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowBirthYearModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Birth Year</Text>
                <ScrollView style={styles.modalScrollView}>
                  {BIRTH_YEARS.map((year) => (
                    <TouchableOpacity key={year} style={styles.modalItem}
                      onPress={() => { setBirthYear(year); setShowBirthYearModal(false); }}>
                      <Text style={styles.modalItemText}>{year}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBirthYearModal(false)}>
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showCycleLengthModal} transparent animationType="fade" onRequestClose={() => setShowCycleLengthModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCycleLengthModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Cycle Length</Text>
                <ScrollView style={styles.modalScrollView}>
                  {CYCLE_LENGTHS.map((length) => (
                    <TouchableOpacity key={length} style={styles.modalItem}
                      onPress={() => { setCycleLength(length); setShowCycleLengthModal(false); }}>
                      <Text style={styles.modalItemText}>{length} days</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCycleLengthModal(false)}>
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showPeriodLengthModal} transparent animationType="fade" onRequestClose={() => setShowPeriodLengthModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowPeriodLengthModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Period Length</Text>
                <ScrollView style={styles.modalScrollView}>
                  {PERIOD_LENGTHS.map((length) => (
                    <TouchableOpacity key={length} style={styles.modalItem}
                      onPress={() => { setPeriodLength(length); setShowPeriodLengthModal(false); }}>
                      <Text style={styles.modalItemText}>{length} days</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPeriodLengthModal(false)}>
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  userIdContainer: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userIdLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.subtext,
    marginBottom: 4,
  },
  userId: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  userIdDescription: {
    fontSize: 12,
    color: Colors.subtext,
    lineHeight: 16,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInputField: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.subtext,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 11,
    color: Colors.subtext,
    marginBottom: 6,
  },
  birthDateContainer: {
    flexDirection: 'row',
  },
  birthDateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownPlaceholder: {
    color: Colors.inactive,
    fontSize: 14,
  },
  dropdownSelectedText: {
    color: Colors.text,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedModalItem: {
    backgroundColor: Colors.primary + '20',
  },
  modalItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  selectedModalItemText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  privacyContainer: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  privacyText: {
    fontSize: 12,
    color: Colors.subtext,
    lineHeight: 18,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
});
