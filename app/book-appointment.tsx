import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Calendar, Video, Phone, MessageSquare } from 'lucide-react-native';
import Colors from '../constants/colors';
import { useTelehealthStore } from '../store/telehealth-store';
import { ConsultationType } from '../types/telehealth';

export default function BookAppointmentScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const { doctors, bookAppointment } = useTelehealthStore();
  const doctor = doctors.find((d) => d.id === doctorId);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ConsultationType>('video');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');

  if (!doctor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Doctor not found</Text>
      </View>
    );
  }

  const handleBooking = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date and time');
      return;
    }

    bookAppointment({
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      scheduledTime: selectedDate,
      duration: 30,
      type: selectedType,
      status: 'scheduled',
      symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : [],
      notes,
    });

    Alert.alert(
      'Appointment Booked',
      'Your appointment has been successfully scheduled. You will receive a confirmation email shortly.',
      [
        {
          text: 'View Appointments',
          onPress: () => router.push('/my-appointments' as any),
        },
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Book Appointment',
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text, fontWeight: 'bold' },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {doctor.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Video size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Consultation Type</Text>
          </View>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'video' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('video')}
            >
              <Video size={20} color={selectedType === 'video' ? '#FFFFFF' : Colors.primary} />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'video' && styles.typeButtonTextActive,
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'voice' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('voice')}
            >
              <Phone size={20} color={selectedType === 'voice' ? '#FFFFFF' : Colors.primary} />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'voice' && styles.typeButtonTextActive,
                ]}
              >
                Voice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'chat' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('chat')}
            >
              <MessageSquare size={20} color={selectedType === 'chat' ? '#FFFFFF' : Colors.primary} />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'chat' && styles.typeButtonTextActive,
                ]}
              >
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
          </View>
          <View style={styles.timeSlots}>
            {doctor.availableSlots.map((slot) => {
              const date = new Date(slot);
              const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    selectedDate === slot && styles.timeSlotActive,
                  ]}
                  onPress={() => setSelectedDate(slot)}
                >
                  <Text
                    style={[
                      styles.timeSlotDate,
                      selectedDate === slot && styles.timeSlotTextActive,
                    ]}
                  >
                    {dateStr}
                  </Text>
                  <Text
                    style={[
                      styles.timeSlotTime,
                      selectedDate === slot && styles.timeSlotTextActive,
                    ]}
                  >
                    {timeStr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Symptoms (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., cramping, irregular period, fatigue"
            placeholderTextColor={Colors.textLight}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional information for the doctor..."
            placeholderTextColor={Colors.textLight}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Appointment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Doctor:</Text>
            <Text style={styles.summaryValue}>{doctor.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>{selectedType}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>30 minutes</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price:</Text>
            <Text style={styles.summaryPrice}>${doctor.pricePerSession}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
          <Text style={styles.bookButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 40,
  },
  doctorCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  timeSlots: {
    gap: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timeSlotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotDate: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  timeSlotTime: {
    fontSize: 15,
    color: Colors.textLight,
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  summary: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bookButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
