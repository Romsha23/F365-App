import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Calendar,
  Heart,
  User,
  Phone,
  Building2,
  Droplets,
  Check,
  Baby,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import { Button } from '../components/Button';
import DatePickerModal from '../components/DatePickerModal';

type Step = 'dates' | 'medical' | 'provider' | 'review';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PregnancySetupScreen() {
  const { setPregnancyProfile, setMode } = usePregnancyStore();
  const [step, setStep] = useState<Step>('dates');

  const [dueDate, setDueDate] = useState('');
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [conceptionDate, setConceptionDate] = useState('');
  const [activePicker, setActivePicker] = useState<'lmp' | 'due' | 'conception' | null>(null);
  const [bloodType, setBloodType] = useState('');
  const [rhFactor, setRhFactor] = useState<'positive' | 'negative' | ''>('');
  const [complications, setComplications] = useState('');
  const [medications, setMedications] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [hospital, setHospital] = useState('');

  const steps: Step[] = ['dates', 'medical', 'provider', 'review'];
  const currentIndex = steps.indexOf(step);

  const calculateDueDate = useCallback((lmpDate: string) => {
    try {
      const lmp = new Date(lmpDate);
      if (isNaN(lmp.getTime())) return '';
      const due = new Date(lmp);
      due.setDate(due.getDate() + 280);
      return due.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, []);

  const handleLMPChange = useCallback((dateStr: string) => {
    setLastPeriodDate(dateStr);
    const calculated = calculateDueDate(dateStr);
    if (calculated && !dueDate) {
      setDueDate(calculated);
    }
  }, [dueDate, calculateDueDate]);

  const handleNext = useCallback(() => {
    if (step === 'dates') {
      if (!lastPeriodDate && !dueDate) {
        Alert.alert('Required', 'Please enter at least your last period date or due date.');
        return;
      }
      setStep('medical');
    } else if (step === 'medical') {
      setStep('provider');
    } else if (step === 'provider') {
      setStep('review');
    }
  }, [step, lastPeriodDate, dueDate]);

  const handleBack = useCallback(() => {
    if (step === 'medical') setStep('dates');
    else if (step === 'provider') setStep('medical');
    else if (step === 'review') setStep('provider');
  }, [step]);

  const handleSave = useCallback(() => {
    const finalDueDate = dueDate || calculateDueDate(lastPeriodDate);
    const finalLMP = lastPeriodDate || '';

    if (!finalDueDate && !finalLMP) {
      Alert.alert('Error', 'Could not calculate due date. Please check your dates.');
      return;
    }

    const lmp = new Date(finalLMP || finalDueDate);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.max(1, Math.min(42, Math.floor(diffDays / 7)));

    const profile = {
      id: Date.now().toString(),
      userId: 'local',
      dueDate: finalDueDate,
      lastPeriodDate: finalLMP,
      conceptionDate: conceptionDate || undefined,
      currentWeek,
      bloodType: bloodType || undefined,
      rhFactor: rhFactor || undefined,
      complications: complications ? complications.split(',').map(c => c.trim()) : undefined,
      medications: medications ? medications.split(',').map(m => m.trim()) : undefined,
      doctorName: doctorName || undefined,
      doctorPhone: doctorPhone || undefined,
      hospital: hospital || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPregnancyProfile(profile);
    setMode('pregnant');
    console.log('[PregnancySetup] Profile saved:', profile);
    router.replace('/(tabs)' as any);
  }, [dueDate, lastPeriodDate, conceptionDate, bloodType, rhFactor, complications, medications, doctorName, doctorPhone, hospital, calculateDueDate, setPregnancyProfile, setMode]);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((s, i) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, i <= currentIndex && styles.stepDotActive]}>
            {i < currentIndex ? (
              <Check size={12} color={Colors.white} />
            ) : (
              <Text style={[styles.stepDotText, i <= currentIndex && styles.stepDotTextActive]}>
                {i + 1}
              </Text>
            )}
          </View>
          {i < steps.length - 1 && (
            <View style={[styles.stepLine, i < currentIndex && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderCalendarInput = (
    label: string,
    value: string,
    pickerKey: 'lmp' | 'due' | 'conception',
    icon: React.ReactNode,
    isOptional?: boolean,
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabel}>
        {icon}
        <Text style={styles.inputLabelText}>{label}</Text>
        {isOptional && <Text style={styles.optionalBadge}>Optional</Text>}
      </View>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setActivePicker(pickerKey)}
        activeOpacity={0.7}
        testID={`input-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <CalendarDays size={18} color={value ? Colors.primary : Colors.textLight} />
        <Text style={[styles.datePickerText, !value && styles.datePickerPlaceholder]}>
          {value || 'Tap to select date'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTextInput = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    placeholder: string,
    icon: React.ReactNode,
    isOptional?: boolean,
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabel}>
        {icon}
        <Text style={styles.inputLabelText}>{label}</Text>
        {isOptional && <Text style={styles.optionalBadge}>Optional</Text>}
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        testID={`input-${label.toLowerCase().replace(/\s/g, '-')}`}
      />
    </View>
  );

  const renderDatesStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Baby size={28} color={Colors.primary} />
        <Text style={styles.stepTitle}>When is your baby due?</Text>
        <Text style={styles.stepSubtitle}>
          Tap the date fields below to open a calendar and select your dates.
        </Text>
      </View>

      {renderCalendarInput(
        'Last Menstrual Period (LMP)',
        lastPeriodDate,
        'lmp',
        <Calendar size={18} color={Colors.primary} />,
      )}

      {renderCalendarInput(
        'Due Date',
        dueDate,
        'due',
        <Heart size={18} color="#EC4899" />,
      )}

      {renderCalendarInput(
        'Conception Date',
        conceptionDate,
        'conception',
        <Calendar size={18} color={Colors.accent} />,
        true,
      )}

      {dueDate && (
        <View style={styles.dueDatePreview}>
          <Text style={styles.dueDatePreviewLabel}>Estimated Due Date</Text>
          <Text style={styles.dueDatePreviewValue}>{dueDate}</Text>
        </View>
      )}

      <DatePickerModal
        visible={activePicker === 'lmp'}
        onClose={() => setActivePicker(null)}
        onSelect={handleLMPChange}
        selectedDate={lastPeriodDate}
        title="Last Menstrual Period"
        maxDate={new Date().toISOString().split('T')[0]}
      />
      <DatePickerModal
        visible={activePicker === 'due'}
        onClose={() => setActivePicker(null)}
        onSelect={setDueDate}
        selectedDate={dueDate}
        title="Due Date"
      />
      <DatePickerModal
        visible={activePicker === 'conception'}
        onClose={() => setActivePicker(null)}
        onSelect={setConceptionDate}
        selectedDate={conceptionDate}
        title="Conception Date"
        maxDate={new Date().toISOString().split('T')[0]}
      />
    </View>
  );

  const renderMedicalStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Droplets size={28} color={Colors.error} />
        <Text style={styles.stepTitle}>Medical Information</Text>
        <Text style={styles.stepSubtitle}>
          This helps us provide relevant health information. All fields are optional.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Droplets size={18} color={Colors.error} />
          <Text style={styles.inputLabelText}>Blood Type</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
        <View style={styles.bloodTypeGrid}>
          {BLOOD_TYPES.map(bt => (
            <TouchableOpacity
              key={bt}
              style={[styles.bloodTypeChip, bloodType === bt && styles.bloodTypeChipActive]}
              onPress={() => setBloodType(bt)}
            >
              <Text style={[styles.bloodTypeText, bloodType === bt && styles.bloodTypeTextActive]}>
                {bt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Text style={styles.inputLabelText}>Rh Factor</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
        <View style={styles.rhRow}>
          {(['positive', 'negative'] as const).map(rh => (
            <TouchableOpacity
              key={rh}
              style={[styles.rhChip, rhFactor === rh && styles.rhChipActive]}
              onPress={() => setRhFactor(rh)}
            >
              <Text style={[styles.rhText, rhFactor === rh && styles.rhTextActive]}>
                {rh === 'positive' ? 'Rh+' : 'Rh-'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Text style={styles.inputLabelText}>Known Complications (comma-separated)</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={complications}
          onChangeText={setComplications}
          placeholder="e.g. gestational diabetes, preeclampsia"
          placeholderTextColor={Colors.textLight}
          multiline
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Text style={styles.inputLabelText}>Current Medications (comma-separated)</Text>
          <Text style={styles.optionalBadge}>Optional</Text>
        </View>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={medications}
          onChangeText={setMedications}
          placeholder="e.g. prenatal vitamins, iron supplements"
          placeholderTextColor={Colors.textLight}
          multiline
        />
      </View>
    </View>
  );

  const renderProviderStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Building2 size={28} color={Colors.accent} />
        <Text style={styles.stepTitle}>Your Care Team</Text>
        <Text style={styles.stepSubtitle}>
          Add your healthcare provider details for easy reference. All fields are optional.
        </Text>
      </View>

      {renderTextInput(
        'Doctor / Midwife Name',
        doctorName,
        setDoctorName,
        'Dr. Jane Smith',
        <User size={18} color={Colors.primary} />,
        true,
      )}

      {renderTextInput(
        'Doctor Phone',
        doctorPhone,
        setDoctorPhone,
        '+61 2 1234 5678',
        <Phone size={18} color={Colors.accent} />,
        true,
      )}

      {renderTextInput(
        'Hospital / Birth Centre',
        hospital,
        setHospital,
        'Royal Women\'s Hospital',
        <Building2 size={18} color={Colors.gold} />,
        true,
      )}
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Check size={28} color={Colors.success} />
        <Text style={styles.stepTitle}>Review & Confirm</Text>
        <Text style={styles.stepSubtitle}>
          Check your details below. You can edit these anytime from your pregnancy dashboard.
        </Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Dates</Text>
        {lastPeriodDate && <ReviewRow label="Last Period" value={lastPeriodDate} />}
        {(dueDate || calculateDueDate(lastPeriodDate)) && (
          <ReviewRow label="Due Date" value={dueDate || calculateDueDate(lastPeriodDate)} />
        )}
        {conceptionDate && <ReviewRow label="Conception" value={conceptionDate} />}
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Medical</Text>
        <ReviewRow label="Blood Type" value={bloodType || 'Not specified'} />
        <ReviewRow label="Rh Factor" value={rhFactor || 'Not specified'} />
        <ReviewRow label="Complications" value={complications || 'None'} />
        <ReviewRow label="Medications" value={medications || 'None'} />
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Care Team</Text>
        <ReviewRow label="Doctor" value={doctorName || 'Not specified'} />
        <ReviewRow label="Phone" value={doctorPhone || 'Not specified'} />
        <ReviewRow label="Hospital" value={hospital || 'Not specified'} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pregnancy Setup' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepIndicator()}

        {step === 'dates' && renderDatesStep()}
        {step === 'medical' && renderMedicalStep()}
        {step === 'provider' && renderProviderStep()}
        {step === 'review' && renderReviewStep()}

        <View style={styles.buttonRow}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={18} color={Colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step === 'review' ? (
            <Button
              title="Start Tracking"
              onPress={handleSave}
              icon={<Heart size={18} color={Colors.white} />}
            />
          ) : (
            <Button
              title="Continue"
              onPress={handleNext}
              icon={<ArrowRight size={18} color={Colors.white} />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textLight,
  },
  stepDotTextActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.muted,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepContent: {
    marginBottom: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textLight,
    backgroundColor: Colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    overflow: 'hidden' as const,
  },
  datePickerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  datePickerPlaceholder: {
    color: Colors.textLight,
    fontWeight: '400' as const,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bloodTypeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bloodTypeTextActive: {
    color: Colors.white,
  },
  rhRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rhChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  rhChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rhText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rhTextActive: {
    color: Colors.white,
  },
  dueDatePreview: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  dueDatePreviewLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400E',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  dueDatePreviewValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#92400E',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  reviewLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: '60%' as any,
    textAlign: 'right' as const,
  },
});
