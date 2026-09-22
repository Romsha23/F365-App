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
import { Stack } from 'expo-router';
import {
  Stethoscope,
  Plus,
  User,
  FileText,
  Trash2,
  X,
  Heart,
  FlaskConical,
  Eye,
  HelpCircle,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';
import { PregnancyAppointment } from '../types/pregnancy';
import { Button } from '../components/Button';

const APPOINTMENT_TYPES: { id: PregnancyAppointment['type']; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'checkup', label: 'Checkup', icon: <Stethoscope size={18} color="#6366F1" />, color: '#6366F1' },
  { id: 'ultrasound', label: 'Ultrasound', icon: <Eye size={18} color="#EC4899" />, color: '#EC4899' },
  { id: 'lab', label: 'Lab Work', icon: <FlaskConical size={18} color="#F59E0B" />, color: '#F59E0B' },
  { id: 'specialist', label: 'Specialist', icon: <Heart size={18} color="#10B981" />, color: '#10B981' },
  { id: 'other', label: 'Other', icon: <HelpCircle size={18} color="#6B7280" />, color: '#6B7280' },
];

export default function PregnancyAppointmentsScreen() {
  const { appointments, addAppointment, deleteAppointment } = usePregnancyStore();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [type, setType] = useState<PregnancyAppointment['type']>('checkup');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [babyHeartRate, setBabyHeartRate] = useState('');

  const handleSave = useCallback(() => {
    if (!date) {
      Alert.alert('Required', 'Please enter the appointment date.');
      return;
    }
    if (!provider) {
      Alert.alert('Required', 'Please enter the provider name.');
      return;
    }

    const appointment: PregnancyAppointment = {
      id: Date.now().toString(),
      date,
      type,
      provider,
      notes: notes || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      bloodPressure: bloodPressure || undefined,
      babyHeartRate: babyHeartRate ? parseInt(babyHeartRate, 10) : undefined,
    };

    addAppointment(appointment);
    console.log('[PregnancyAppointments] Added:', appointment);

    setDate('');
    setType('checkup');
    setProvider('');
    setNotes('');
    setWeight('');
    setBloodPressure('');
    setBabyHeartRate('');
    setShowForm(false);
  }, [date, type, provider, notes, weight, bloodPressure, babyHeartRate, addAppointment]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Appointment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteAppointment(id);
        console.log('[PregnancyAppointments] Deleted:', id);
      }},
    ]);
  }, [deleteAppointment]);

  const now = new Date();
  const upcoming = appointments
    .filter(a => new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = appointments
    .filter(a => new Date(a.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getTypeConfig = (t: PregnancyAppointment['type']) =>
    APPOINTMENT_TYPES.find(at => at.id === t) ?? APPOINTMENT_TYPES[4];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Appointments' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!showForm && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)} testID="add-appointment">
            <Plus size={20} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add Appointment</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Appointment</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeGrid}>
              {APPOINTMENT_TYPES.map(at => (
                <TouchableOpacity
                  key={at.id}
                  style={[styles.typeChip, type === at.id && { backgroundColor: at.color + '18', borderColor: at.color }]}
                  onPress={() => setType(at.id)}
                >
                  {at.icon}
                  <Text style={[styles.typeChipText, type === at.id && { color: at.color, fontWeight: '700' as const }]}>
                    {at.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.fieldLabel}>Provider</Text>
            <TextInput
              style={styles.input}
              value={provider}
              onChangeText={setProvider}
              placeholder="Dr. Jane Smith"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Questions to ask, things to remember..."
              placeholderTextColor={Colors.textLight}
              multiline
            />

            <Text style={styles.fieldLabel}>Measurements (optional)</Text>
            <View style={styles.measureRow}>
              <View style={styles.measureField}>
                <Text style={styles.measureLabel}>Weight (kg)</Text>
                <TextInput style={styles.measureInput} value={weight} onChangeText={setWeight} placeholder="--" placeholderTextColor={Colors.textLight} keyboardType="decimal-pad" />
              </View>
              <View style={styles.measureField}>
                <Text style={styles.measureLabel}>BP</Text>
                <TextInput style={styles.measureInput} value={bloodPressure} onChangeText={setBloodPressure} placeholder="120/80" placeholderTextColor={Colors.textLight} />
              </View>
              <View style={styles.measureField}>
                <Text style={styles.measureLabel}>Baby HR</Text>
                <TextInput style={styles.measureInput} value={babyHeartRate} onChangeText={setBabyHeartRate} placeholder="--" placeholderTextColor={Colors.textLight} keyboardType="number-pad" />
              </View>
            </View>

            <Button title="Save Appointment" onPress={handleSave} fullWidth style={{ marginTop: 16 }} />
          </View>
        )}

        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcoming.map(apt => {
              const config = getTypeConfig(apt.type);
              return (
                <View key={apt.id} style={[styles.appointmentCard, { borderLeftColor: config.color }]}>
                  <View style={styles.aptHeader}>
                    <View style={[styles.aptIconBox, { backgroundColor: config.color + '15' }]}>
                      {config.icon}
                    </View>
                    <View style={styles.aptInfo}>
                      <Text style={styles.aptType}>{config.label}</Text>
                      <Text style={styles.aptDate}>
                        {new Date(apt.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(apt.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Trash2 size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.aptDetails}>
                    <View style={styles.aptDetailRow}>
                      <User size={13} color={Colors.textMuted} />
                      <Text style={styles.aptDetailText}>{apt.provider}</Text>
                    </View>
                    {apt.notes && (
                      <View style={styles.aptDetailRow}>
                        <FileText size={13} color={Colors.textMuted} />
                        <Text style={styles.aptDetailText}>{apt.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {past.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Appointments</Text>
            {past.map(apt => {
              const config = getTypeConfig(apt.type);
              return (
                <View key={apt.id} style={[styles.appointmentCard, styles.pastCard, { borderLeftColor: config.color + '60' }]}>
                  <View style={styles.aptHeader}>
                    <View style={[styles.aptIconBox, { backgroundColor: config.color + '10' }]}>
                      {config.icon}
                    </View>
                    <View style={styles.aptInfo}>
                      <Text style={[styles.aptType, { color: Colors.textMuted }]}>{config.label}</Text>
                      <Text style={styles.aptDate}>
                        {new Date(apt.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(apt.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Trash2 size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  </View>
                  {(apt.weight || apt.bloodPressure || apt.babyHeartRate) && (
                    <View style={styles.aptMeasurements}>
                      {apt.weight && <Text style={styles.aptMeasure}>{apt.weight}kg</Text>}
                      {apt.bloodPressure && <Text style={styles.aptMeasure}>BP: {apt.bloodPressure}</Text>}
                      {apt.babyHeartRate && <Text style={styles.aptMeasure}>HR: {apt.babyHeartRate}bpm</Text>}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {appointments.length === 0 && !showForm && (
          <View style={styles.emptyState}>
            <Stethoscope size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No Appointments Yet</Text>
            <Text style={styles.emptyText}>
              Add your prenatal appointments to keep track of checkups, ultrasounds, and lab work.
            </Text>
          </View>
        )}
      </ScrollView>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 16,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipText: {
    fontSize: 13,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  measureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  measureField: {
    flex: 1,
  },
  measureLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginBottom: 4,
  },
  measureInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 10,
  },
  pastCard: {
    opacity: 0.75,
  },
  aptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptInfo: {
    flex: 1,
  },
  aptType: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  aptDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  aptDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.muted,
    gap: 6,
  },
  aptDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  aptDetailText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  aptMeasurements: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.muted,
  },
  aptMeasure: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
