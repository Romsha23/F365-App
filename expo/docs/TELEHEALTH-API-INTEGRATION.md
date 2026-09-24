# Telehealth API Integration Guide

This document provides integration points for connecting F365 to a real telehealth provider API.

---

## Current Architecture

The telehealth feature currently uses **mock data** via `generateMockDoctors()` in `types/telehealth.ts`. All data is stored locally using Zustand + AsyncStorage.

### Files to Modify

| File | Purpose |
|------|---------|
| `store/telehealth-store.ts` | Main state management - replace mock functions with API calls |
| `types/telehealth.ts` | Data types - may need updates to match provider API |
| `app/telehealth.tsx` | Doctor listing UI |
| `app/book-appointment.tsx` | Booking flow UI |
| `app/my-appointments.tsx` | Appointments management UI |
| `app/consultation.tsx` | Video/Voice/Chat consultation UI |

---

## Integration Points

### 1. Doctor Listing API

**Current Implementation:** `store/telehealth-store.ts` → `loadDoctors()`

```typescript
// CURRENT (Mock)
loadDoctors: () => {
  const doctors = generateMockDoctors();
  set({ doctors });
},

// REPLACE WITH (Real API)
loadDoctors: async (filters?: DoctorFilters) => {
  set({ isLoading: true });
  try {
    const response = await fetch(`${TELEHEALTH_API_BASE}/doctors`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: filters ? JSON.stringify(filters) : undefined,
    });
    const doctors = await response.json();
    set({ doctors, isLoading: false });
  } catch (error) {
    console.error('Failed to load doctors:', error);
    set({ isLoading: false });
  }
},
```

**Expected API Endpoint:**
```
GET /api/telehealth/doctors
Query params: ?specialty=gynecology&language=English&available=true
```

**Expected Response Schema:**
```typescript
interface DoctorAPIResponse {
  id: string;
  name: string;
  specialty: DoctorSpecialty;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  avatar?: string;
  bio: string;
  languages: string[];
  availableSlots: string[]; // ISO 8601 datetime strings
  pricePerSession: number;
  isPremium?: boolean;
  // Additional fields from provider:
  licenseNumber?: string;
  clinicName?: string;
  videoEnabled?: boolean;
  voiceEnabled?: boolean;
  chatEnabled?: boolean;
}
```

---

### 2. Book Appointment API

**Current Implementation:** `store/telehealth-store.ts` → `bookAppointment()`

```typescript
// CURRENT (Local storage only)
bookAppointment: (appointmentData) => {
  const newAppointment: Appointment = {
    ...appointmentData,
    id: `apt_${Date.now()}`,
  };
  set((state) => ({
    appointments: [...state.appointments, newAppointment],
  }));
},

// REPLACE WITH (Real API)
bookAppointment: async (appointmentData) => {
  set({ isLoading: true });
  try {
    const response = await fetch(`${TELEHEALTH_API_BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorId: appointmentData.doctorId,
        scheduledTime: appointmentData.scheduledTime,
        duration: appointmentData.duration,
        type: appointmentData.type,
        symptoms: appointmentData.symptoms,
        notes: appointmentData.notes,
        patientId: getCurrentUserId(), // From auth context
      }),
    });
    
    const newAppointment = await response.json();
    
    set((state) => ({
      appointments: [...state.appointments, newAppointment],
      isLoading: false,
    }));
    
    return newAppointment;
  } catch (error) {
    console.error('Failed to book appointment:', error);
    set({ isLoading: false });
    throw error;
  }
},
```

**Expected API Endpoint:**
```
POST /api/telehealth/appointments
```

**Request Body:**
```typescript
interface BookAppointmentRequest {
  doctorId: string;
  patientId: string;
  scheduledTime: string; // ISO 8601
  duration: number; // minutes
  type: 'video' | 'voice' | 'chat';
  symptoms?: string[];
  notes?: string;
  paymentMethodId?: string; // If payment required upfront
}
```

**Expected Response:**
```typescript
interface BookAppointmentResponse {
  id: string;
  confirmationCode: string;
  doctorId: string;
  doctorName: string;
  scheduledTime: string;
  status: 'scheduled' | 'pending_payment';
  meetingUrl?: string; // Pre-generated meeting URL
  paymentStatus?: 'paid' | 'pending' | 'failed';
}
```

---

### 3. Cancel Appointment API

**Current Implementation:** `store/telehealth-store.ts` → `cancelAppointment()`

```typescript
// CURRENT (Local only)
cancelAppointment: (appointmentId) => {
  set((state) => ({
    appointments: state.appointments.map((apt) =>
      apt.id === appointmentId
        ? { ...apt, status: 'cancelled' as const }
        : apt
    ),
  }));
},

// REPLACE WITH (Real API)
cancelAppointment: async (appointmentId: string, reason?: string) => {
  try {
    await fetch(`${TELEHEALTH_API_BASE}/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === appointmentId
          ? { ...apt, status: 'cancelled' as const }
          : apt
      ),
    }));
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    throw error;
  }
},
```

**Expected API Endpoint:**
```
POST /api/telehealth/appointments/{appointmentId}/cancel
```

---

### 4. Start Video/Voice/Chat Session API

**Current Implementation:** `store/telehealth-store.ts` → `startSession()`

```typescript
// CURRENT (Generates placeholder URL)
startSession: (appointmentId) => {
  // ... creates local session with fake URL
  sessionUrl: `https://telehealth-api.example.com/session/${appointmentId}`,
},

// REPLACE WITH (Real API - e.g., Twilio, Agora, Daily.co)
startSession: async (appointmentId: string) => {
  try {
    const response = await fetch(`${TELEHEALTH_API_BASE}/sessions/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appointmentId,
        participantId: getCurrentUserId(),
      }),
    });
    
    const sessionData = await response.json();
    
    // Session data will include provider-specific tokens/URLs
    const newSession: ConsultationSession = {
      id: sessionData.sessionId,
      appointmentId,
      startTime: new Date().toISOString(),
      type: sessionData.type,
      sessionUrl: sessionData.roomUrl,
      accessToken: sessionData.accessToken, // For video SDK
    };
    
    set((state) => ({
      sessions: [...state.sessions, newSession],
      appointments: state.appointments.map((apt) =>
        apt.id === appointmentId
          ? { ...apt, status: 'in_progress', sessionUrl: newSession.sessionUrl }
          : apt
      ),
    }));
    
    return newSession;
  } catch (error) {
    console.error('Failed to start session:', error);
    throw error;
  }
},
```

**Expected Response (Video Provider Integration):**
```typescript
interface SessionStartResponse {
  sessionId: string;
  roomUrl: string; // URL for WebRTC room
  accessToken: string; // JWT for video SDK authentication
  type: 'video' | 'voice' | 'chat';
  expiresAt: string;
  // Provider-specific fields:
  twilioRoomSid?: string;
  agoraChannelName?: string;
  dailyRoomName?: string;
}
```

---

### 5. Fetch User Appointments API

**Add this new function to telehealth-store.ts:**

```typescript
fetchMyAppointments: async () => {
  set({ isLoading: true });
  try {
    const response = await fetch(`${TELEHEALTH_API_BASE}/appointments/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    const appointments = await response.json();
    set({ appointments, isLoading: false });
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    set({ isLoading: false });
  }
},
```

---

### 6. Get Doctor Availability API

**Add this new function:**

```typescript
getDoctorAvailability: async (doctorId: string, dateRange: { start: string; end: string }) => {
  try {
    const response = await fetch(
      `${TELEHEALTH_API_BASE}/doctors/${doctorId}/availability?start=${dateRange.start}&end=${dateRange.end}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return await response.json(); // Returns available time slots
  } catch (error) {
    console.error('Failed to get availability:', error);
    throw error;
  }
},
```

---

## Environment Variables Required

Add these to your `.env` file:

```bash
# Telehealth Provider Configuration
EXPO_PUBLIC_TELEHEALTH_API_BASE=https://api.your-telehealth-provider.com/v1
EXPO_PUBLIC_TELEHEALTH_API_KEY=your_api_key_here

# Video Provider (choose one)
EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_twilio_sid
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
EXPO_PUBLIC_DAILY_API_KEY=your_daily_api_key
```

---

## Recommended Third-Party Providers

### Video/Voice Consultation
| Provider | Best For | Pricing |
|----------|----------|---------|
| [Twilio Video](https://www.twilio.com/video) | Enterprise, HIPAA compliance | Pay-per-minute |
| [Daily.co](https://www.daily.co/) | Easy integration, React Native SDK | Free tier available |
| [Agora](https://www.agora.io/) | Global scale, low latency | Free 10k minutes/month |
| [Vonage (OpenTok)](https://www.vonage.com/communications-apis/video/) | Healthcare-focused | Contact for pricing |

### Full Telehealth Platforms
| Provider | Features | Notes |
|----------|----------|-------|
| [Doxy.me](https://doxy.me/) | HIPAA compliant, simple | Embed via WebView |
| [VSee](https://vsee.com/) | Healthcare-specific | Full API available |
| [Teladoc API](https://teladochealth.com/) | End-to-end telehealth | Enterprise only |

---

## Video SDK Integration Example (Daily.co)

```typescript
// Install: npm install @daily-co/daily-js @daily-co/daily-react

import Daily from '@daily-co/daily-js';

const startVideoCall = async (roomUrl: string, token: string) => {
  const callObject = Daily.createCallObject();
  
  await callObject.join({
    url: roomUrl,
    token: token,
  });
  
  // Handle events
  callObject.on('participant-joined', (event) => {
    console.log('Participant joined:', event.participant);
  });
  
  callObject.on('left-meeting', () => {
    console.log('Call ended');
  });
  
  return callObject;
};
```

---

## Payment Integration for Appointments

If you need to charge for appointments, integrate with the existing Stripe setup:

```typescript
// In book-appointment.tsx, before confirming booking:
const handlePaymentAndBook = async () => {
  // 1. Create payment intent
  const paymentIntent = await createPaymentIntent(doctor.pricePerSession);
  
  // 2. Confirm payment
  const { error } = await confirmPayment(paymentIntent.clientSecret);
  
  if (error) {
    Alert.alert('Payment Failed', error.message);
    return;
  }
  
  // 3. Book appointment with payment confirmation
  await bookAppointment({
    ...appointmentData,
    paymentIntentId: paymentIntent.id,
  });
};
```

---

## Data Sync Strategy

When implementing real API:

1. **Initial Load:** Fetch from API, cache in AsyncStorage
2. **Mutations:** Optimistic update locally, then sync to API
3. **Conflict Resolution:** Server is source of truth
4. **Offline Support:** Queue actions, sync when online

```typescript
// Example with React Query
const { data: doctors } = useQuery({
  queryKey: ['doctors', filters],
  queryFn: () => fetchDoctors(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Checklist for Integration

- [ ] Create telehealth provider account
- [ ] Obtain API credentials
- [ ] Add environment variables
- [ ] Replace `generateMockDoctors()` with API call
- [ ] Implement `bookAppointment()` API call
- [ ] Implement `cancelAppointment()` API call
- [ ] Integrate video SDK for consultations
- [ ] Add payment flow if required
- [ ] Test HIPAA compliance requirements
- [ ] Add error handling and retry logic
- [ ] Implement offline support (optional)

---

## Support

For questions about this integration, contact the development team or refer to the specific telehealth provider's documentation.
