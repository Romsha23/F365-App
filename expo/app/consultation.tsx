import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Maximize,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { useTelehealthStore } from '../store/telehealth-store';

export default function ConsultationScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { appointments, startSession, endSession } = useTelehealthStore();
  const appointment = appointments.find((apt) => apt.id === appointmentId);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!appointment) {
      Alert.alert('Error', 'Appointment not found');
      router.back();
      return;
    }

    if (!sessionStarted && appointment.status !== 'in_progress') {
      startSession(appointment.id);
      setSessionStarted(true);
    }
  }, [appointment, sessionStarted, startSession]);

  useEffect(() => {
    if (!sessionStarted) return;

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStarted]);

  if (!appointment) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            endSession(`session_${appointment.id}`);
            router.back();
            Alert.alert(
              'Consultation Ended',
              'Thank you for using our telehealth service. Your consultation notes will be available in your appointment history.'
            );
          },
        },
      ]
    );
  };

  const handleOpenExternalSession = async () => {
    if (appointment.sessionUrl) {
      const supported = await Linking.canOpenURL(appointment.sessionUrl);
      if (supported) {
        await Linking.openURL(appointment.sessionUrl);
      } else {
        Alert.alert('Error', 'Unable to open consultation link');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,

          title: 'Consultation',
        }}
      />

      <View style={styles.videoContainer}>
        <View style={styles.placeholderVideo}>
          <Text style={styles.placeholderText}>
            {appointment.type === 'video' ? 'Video Feed' : 'Voice Call'}
          </Text>
          <Text style={styles.placeholderSubtext}>
            Connected with {appointment.doctorName}
          </Text>
        </View>

        <View style={styles.localVideoPlaceholder}>
          <Text style={styles.localVideoText}>You</Text>
        </View>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.doctorName}>{appointment.doctorName}</Text>
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.notice}>
          <MessageSquare size={16} color={Colors.textLight} />
          <Text style={styles.noticeText}>
            For actual video/voice calling, this connects to external telehealth API
          </Text>
        </View>

        <TouchableOpacity
          style={styles.externalButton}
          onPress={handleOpenExternalSession}
        >
          <Maximize size={20} color="#FFFFFF" />
          <Text style={styles.externalButtonText}>Open External Session</Text>
        </TouchableOpacity>

        <View style={styles.controls}>
          {appointment.type === 'video' && (
            <TouchableOpacity
              style={[styles.controlButton, !isVideoEnabled && styles.controlButtonDisabled]}
              onPress={() => setIsVideoEnabled(!isVideoEnabled)}
            >
              {isVideoEnabled ? (
                <Video size={24} color="#FFFFFF" />
              ) : (
                <VideoOff size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, !isAudioEnabled && styles.controlButtonDisabled]}
            onPress={() => setIsAudioEnabled(!isAudioEnabled)}
          >
            {isAudioEnabled ? (
              <Mic size={24} color="#FFFFFF" />
            ) : (
              <MicOff size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <PhoneOff size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  placeholderVideo: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#999999',
  },
  localVideoPlaceholder: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  localVideoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  durationText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
  },
  controlsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  externalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: Colors.error,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
