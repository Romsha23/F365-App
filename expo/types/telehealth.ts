export type DoctorSpecialty = 
  | 'gynecology'
  | 'endocrinology'
  | 'obstetrics'
  | 'fertility'
  | 'mental_health'
  | 'general_practitioner';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'in_progress';

export type ConsultationType = 'video' | 'voice' | 'chat';

export interface Doctor {
  id: string;
  name: string;
  specialty: DoctorSpecialty;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  avatar?: string;
  bio: string;
  languages: string[];
  availableSlots: string[];
  pricePerSession: number;
  isPremium?: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: DoctorSpecialty;
  scheduledTime: string;
  duration: number;
  type: ConsultationType;
  status: AppointmentStatus;
  sessionUrl?: string;
  notes?: string;
  symptoms?: string[];
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedAt: string;
}

export interface ConsultationSession {
  id: string;
  appointmentId: string;
  startTime: string;
  endTime?: string;
  type: ConsultationType;
  sessionUrl: string;
  recordingUrl?: string;
  notes?: string;
}

export function generateMockDoctors(): Doctor[] {
  return [
    {
      id: 'doc1',
      name: 'Dr. Sarah Johnson',
      specialty: 'gynecology',
      rating: 4.9,
      reviewCount: 234,
      yearsExperience: 12,
      bio: 'Specialized in reproductive health, PCOS, endometriosis, and menstrual disorders.',
      languages: ['English', 'Spanish'],
      availableSlots: ['2025-01-25T10:00:00Z', '2025-01-25T14:00:00Z', '2025-01-26T09:00:00Z'],
      pricePerSession: 150,
    },
    {
      id: 'doc2',
      name: 'Dr. Emily Chen',
      specialty: 'endocrinology',
      rating: 4.8,
      reviewCount: 189,
      yearsExperience: 10,
      bio: 'Expert in hormonal imbalances, thyroid disorders, and metabolic health.',
      languages: ['English', 'Mandarin'],
      availableSlots: ['2025-01-25T11:00:00Z', '2025-01-25T15:00:00Z'],
      pricePerSession: 180,
      isPremium: true,
    },
    {
      id: 'doc3',
      name: 'Dr. Michael Roberts',
      specialty: 'fertility',
      rating: 4.7,
      reviewCount: 156,
      yearsExperience: 15,
      bio: 'Fertility specialist helping couples conceive through various treatment options.',
      languages: ['English', 'French'],
      availableSlots: ['2025-01-26T10:00:00Z', '2025-01-27T14:00:00Z'],
      pricePerSession: 200,
      isPremium: true,
    },
    {
      id: 'doc4',
      name: 'Dr. Lisa Martinez',
      specialty: 'mental_health',
      rating: 4.9,
      reviewCount: 278,
      yearsExperience: 8,
      bio: 'Specializing in womens mental health, PMS, PMDD, and postpartum support.',
      languages: ['English', 'Spanish'],
      availableSlots: ['2025-01-25T13:00:00Z', '2025-01-26T16:00:00Z'],
      pricePerSession: 120,
    },
  ];
}

export function generateMockAppointments(): Appointment[] {
  return [
    {
      id: 'apt1',
      doctorId: 'doc1',
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'gynecology',
      scheduledTime: '2025-01-25T10:00:00Z',
      duration: 30,
      type: 'video',
      status: 'scheduled',
      symptoms: ['irregular periods', 'cramping'],
    },
  ];
}
