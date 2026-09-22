import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Doctor, 
  Appointment, 
  ConsultationSession,
  generateMockDoctors
} from '../types/telehealth';

interface TelehealthState {
  doctors: Doctor[];
  appointments: Appointment[];
  sessions: ConsultationSession[];
  isLoading: boolean;
  
  loadDoctors: () => void;
  bookAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  cancelAppointment: (appointmentId: string) => void;
  startSession: (appointmentId: string) => ConsultationSession;
  endSession: (sessionId: string) => void;
  addPrescription: (appointmentId: string, prescription: any) => void;
}

export const useTelehealthStore = create<TelehealthState>()(
  persist(
    (set, get) => ({
      doctors: [],
      appointments: [],
      sessions: [],
      isLoading: false,
      
      loadDoctors: () => {
        const doctors = generateMockDoctors();
        set({ doctors });
      },
      
      bookAppointment: (appointmentData) => {
        const newAppointment: Appointment = {
          ...appointmentData,
          id: `apt_${Date.now()}`,
        };
        
        set((state) => ({
          appointments: [...state.appointments, newAppointment],
        }));
      },
      
      cancelAppointment: (appointmentId) => {
        set((state) => ({
          appointments: state.appointments.map((apt) =>
            apt.id === appointmentId
              ? { ...apt, status: 'cancelled' as const }
              : apt
          ),
        }));
      },
      
      startSession: (appointmentId) => {
        const appointment = get().appointments.find((apt) => apt.id === appointmentId);
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        const newSession: ConsultationSession = {
          id: `session_${Date.now()}`,
          appointmentId,
          startTime: new Date().toISOString(),
          type: appointment.type,
          sessionUrl: `https://telehealth-api.example.com/session/${appointmentId}`,
        };
        
        set((state) => ({
          sessions: [...state.sessions, newSession],
          appointments: state.appointments.map((apt) =>
            apt.id === appointmentId
              ? { 
                  ...apt, 
                  status: 'in_progress' as const,
                  sessionUrl: newSession.sessionUrl 
                }
              : apt
          ),
        }));
        
        return newSession;
      },
      
      endSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, endTime: new Date().toISOString() }
              : session
          ),
        }));
      },
      
      addPrescription: (appointmentId, prescription) => {
        set((state) => ({
          appointments: state.appointments.map((apt) =>
            apt.id === appointmentId
              ? { 
                  ...apt, 
                  prescriptions: [...(apt.prescriptions || []), prescription] 
                }
              : apt
          ),
        }));
      },
    }),
    {
      name: 'flow-365-telehealth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
