import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Video, Phone, MessageSquare, Search, Star } from 'lucide-react-native';
import Colors from '../constants/colors';
import { useTelehealthStore } from '../store/telehealth-store';
import { Doctor, DoctorSpecialty } from '../types/telehealth';
import { useSubscriptionStore } from '../store/subscription-store';

const specialtyLabels: Record<DoctorSpecialty, string> = {
  gynecology: 'Gynecology',
  endocrinology: 'Endocrinology',
  obstetrics: 'Obstetrics',
  fertility: 'Fertility',
  mental_health: 'Mental Health',
  general_practitioner: 'General Practitioner',
};

export default function TelehealthScreen() {
  const { doctors, loadDoctors } = useTelehealthStore();
  const { getSubscriptionInfo } = useSubscriptionStore();
  const { isPro } = getSubscriptionInfo();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<DoctorSpecialty | 'all'>('all');

  useEffect(() => {
    if (doctors.length === 0) {
      loadDoctors();
    }
  }, [doctors.length, loadDoctors]);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    const matchesPremium = !doctor.isPremium || isPro;
    
    return matchesSearch && matchesSpecialty && matchesPremium;
  });

  const handleBookAppointment = (doctor: Doctor) => {
    if (doctor.isPremium && !isPro) {
      router.push('/subscription' as any);
      return;
    }
    router.push({
      pathname: '/book-appointment' as any,
      params: { doctorId: doctor.id },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Telehealth',
          headerStyle: { backgroundColor: Colors.background },
          headerTitleStyle: { color: Colors.text, fontWeight: 'bold' },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Talk to a Doctor</Text>
          <Text style={styles.subtitle}>
            Connect with healthcare professionals from the comfort of home
          </Text>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors or specialties"
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.specialtyFilter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedSpecialty === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSpecialty('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSpecialty === 'all' && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {Object.entries(specialtyLabels).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  selectedSpecialty === key && styles.filterChipActive,
                ]}
                onPress={() => setSelectedSpecialty(key as DoctorSpecialty)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSpecialty === key && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.appointmentsButton}>
          <TouchableOpacity
            style={styles.myAppointmentsBtn}
            onPress={() => router.push('/my-appointments' as any)}
          >
            <Text style={styles.myAppointmentsBtnText}>My Appointments</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.doctorsList}>
          {filteredDoctors.map((doctor) => (
            <View key={doctor.id} style={styles.doctorCard}>
              <View style={styles.doctorHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    {doctor.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>Premium</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.doctorSpecialty}>
                    {specialtyLabels[doctor.specialty]}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Star size={14} color={Colors.warning} fill={Colors.warning} />
                    <Text style={styles.rating}>
                      {doctor.rating} ({doctor.reviewCount} reviews)
                    </Text>
                  </View>
                  <Text style={styles.experience}>
                    {doctor.yearsExperience} years experience
                  </Text>
                </View>
              </View>

              <Text style={styles.doctorBio} numberOfLines={2}>
                {doctor.bio}
              </Text>

              <View style={styles.languages}>
                <Text style={styles.languagesLabel}>Languages: </Text>
                <Text style={styles.languagesText}>{doctor.languages.join(', ')}</Text>
              </View>


              <View style={styles.consultationTypes}>
                <View style={styles.consultationType}>
                  <Video size={16} color={Colors.primary} />
                  <Text style={styles.consultationTypeText}>Video</Text>
                </View>
                <View style={styles.consultationType}>
                  <Phone size={16} color={Colors.primary} />
                  <Text style={styles.consultationTypeText}>Voice</Text>
                </View>
                <View style={styles.consultationType}>
                  <MessageSquare size={16} color={Colors.primary} />
                  <Text style={styles.consultationTypeText}>Chat</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBookAppointment(doctor)}
              >
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {filteredDoctors.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No doctors found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters or search query
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  specialtyFilter: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  appointmentsButton: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  myAppointmentsBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  myAppointmentsBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doctorsList: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 20,
  },
  doctorCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  premiumBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  rating: {
    fontSize: 13,
    color: Colors.text,
  },
  experience: {
    fontSize: 12,
    color: Colors.textLight,
  },
  doctorBio: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  languages: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  languagesLabel: {
    fontSize: 13,
    color: Colors.textLight,
  },
  languagesText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  priceSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
  consultationTypes: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  consultationType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consultationTypeText: {
    fontSize: 13,
    color: Colors.text,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
