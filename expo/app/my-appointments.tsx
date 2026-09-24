import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Calendar, Clock, Video, Phone, MessageSquare, X } from 'lucide-react-native';
import Colors from '../constants/colors';
import { useTelehealthStore } from '../store/telehealth-store';
import { Appointment, ConsultationType } from '../types/telehealth';

const consultationIcons: Record<ConsultationType, any> = {
  video: Video,
  voice: Phone,
  chat: MessageSquare,
};

export default function MyAppointmentsScreen() {
  const { appointments, cancelAppointment } = useTelehealthStore();

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled' || apt.status === 'in_progress'
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'completed' || apt.status === 'cancelled'
  );

  const handleCancelAppointment = (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelAppointment(appointmentId);
            Alert.alert('Cancelled', 'Your appointment has been cancelled.');
          },
        },
      ]
    );
  };

  const handleJoinConsultation = (appointment: Appointment) => {
    router.push({
      pathname: '/consultation' as any,
      params: { appointmentId: appointment.id },
    });
  };

  const renderAppointment = (appointment: Appointment) => {
    const date = new Date(appointment.scheduledTime);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const Icon = consultationIcons[appointment.type];
    const isUpcoming = appointment.status === 'scheduled';
    const isInProgress = appointment.status === 'in_progress';

    return (
      <View key={appointment.id} style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{appointment.doctorName}</Text>
            <Text style={styles.specialty}>{appointment.doctorSpecialty}</Text>
          </View>
          {isUpcoming && (
            <TouchableOpacity
              onPress={() => handleCancelAppointment(appointment.id)}
              style={styles.cancelButton}
            >
              <X size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={Colors.textLight} />
            <Text style={styles.detailText}>{dateStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={Colors.textLight} />
            <Text style={styles.detailText}>{timeStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon size={16} color={Colors.textLight} />
            <Text style={styles.detailText}>{appointment.type}</Text>
          </View>
        </View>

        {appointment.symptoms && appointment.symptoms.length > 0 && (
          <View style={styles.symptoms}>
            <Text style={styles.symptomsLabel}>Symptoms:</Text>
            <Text style={styles.symptomsText}>
              {appointment.symptoms.join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusText,
              appointment.status === 'scheduled' && styles.statusScheduled,
              appointment.status === 'in_progress' && styles.statusInProgress,
              appointment.status === 'completed' && styles.statusCompleted,
              appointment.status === 'cancelled' && styles.statusCancelled,
            ]}
          >
            {appointment.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {(isUpcoming || isInProgress) && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinConsultation(appointment)}
          >
            <Text style={styles.joinButtonText}>
              {isInProgress ? 'Rejoin Consultation' : 'Join Consultation'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Appointments',
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text, fontWeight: 'bold' },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcomingAppointments.map(renderAppointment)}
          </View>
        )}

        {pastAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past</Text>
            {pastAppointments.map(renderAppointment)}
          </View>
        )}

        {appointments.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No appointments yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Book your first consultation with a healthcare professional
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/telehealth' as any)}
            >
              <Text style={styles.bookButtonText}>Find a Doctor</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  cancelButton: {
    padding: 4,
  },
  appointmentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
  },
  symptoms: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
  },
  symptomsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: Colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusScheduled: {
    color: Colors.primary,
  },
  statusInProgress: {
    color: Colors.secondary,
  },
  statusCompleted: {
    color: Colors.success,
  },
  statusCancelled: {
    color: Colors.error,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
