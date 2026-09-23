import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Alert, Modal, TouchableWithoutFeedback, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { useUserStore } from '../store/user-store';
import { useCycleStore } from '../store/cycle-store';
import { usePregnancyStore } from '../store/pregnancy-store';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import Colors from '../constants/colors';
import { generateInitialCycleData } from '../utils/mock-data';
import { generateQuickCoolName } from '../utils/display-name-generator';
import { ChevronDown, Eye, EyeOff, Calendar, Check } from 'lucide-react-native';
import { calculateAge } from '../utils/age-gate';
import { CountryPicker } from '../components/CountryPicker';
import { useFeatureGateStore } from '../store/feature-gate-store';
import { ConsentCheckbox } from '../components/DisclaimerBanner';
import {
  Ethnicity,
  ActivityLevel,
  DietType,
  SleepPattern,
  StressLevel,
  HealthCondition,
  ContraceptiveType,
  ClimateType,
  LifeStage,
  ETHNICITY_LABELS,
  ACTIVITY_LEVEL_LABELS,
  DIET_TYPE_LABELS,
  SLEEP_PATTERN_LABELS,
  STRESS_LEVEL_LABELS,
  HEALTH_CONDITION_LABELS,
  CONTRACEPTIVE_TYPE_LABELS,
  CLIMATE_TYPE_LABELS,
  LIFE_STAGE_OPTIONS,
  generate7DigitId,
} from '../types/user';

import { supabase } from '../lib/supabase';

type StepType = 'lifeStage' | 'basicInfo' | 'lifestyle' | 'cycleInfo' | 'cycleDetails' | 'goalsConsent';

const getStepsForStage = (stage: LifeStage | ''): StepType[] => {
  switch (stage) {
    case 'pregnant':
    case 'postpartum':
      return ['lifeStage', 'basicInfo', 'lifestyle', 'goalsConsent'];
    case 'perimenopause':
      return ['lifeStage', 'basicInfo', 'lifestyle', 'cycleInfo', 'goalsConsent'];
    default:
      return ['lifeStage', 'basicInfo', 'lifestyle', 'cycleInfo', 'cycleDetails', 'goalsConsent'];
  }
};
type CommonSymptom = 'cramps' | 'headache' | 'backache' | 'nausea' | 'bloating' | 'tender_breasts' | 'acne' | 'fatigue' | 'cravings' | 'insomnia' | 'mood_swings' | 'anxiety';




const ADMIN_CODE = 'admin1234';
const AUTH_ID_STORAGE_KEY = 'flo365-auth-id';

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear.toString()];
const BIRTH_YEARS = Array.from({ length: 70 }, (_, i) => (currentYear - 10 - i).toString());

const CYCLE_LENGTHS = Array.from({ length: 15 }, (_, i) => (i + 21).toString());

const PERIOD_LENGTHS = Array.from({ length: 9 }, (_, i) => (i + 2).toString());

export default function OnboardingScreen() {
  const { user, register, updateProfile, isDemoMode } = useUserStore();
  const { addCycle, generatePredictions } = useCycleStore();
  
  const [step, setStep] = useState(1);
  const [lifeStage, setLifeStage] = useState<LifeStage | ''>(user?.lifeStage || '');
  const [birthMonth, setBirthMonth] = useState(user?.birthMonth?.toString() || '');
  const [birthYear, setBirthYear] = useState(user?.birthYear?.toString() || '');
  const [country, setCountry] = useState(user?.country || '');
  const [goals, setGoals] = useState<string[]>([]);
  

  const [showBirthMonthModal, setShowBirthMonthModal] = useState(false);
  const [showBirthYearModal, setShowBirthYearModal] = useState(false);
  
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  
  const [cycleLength, setCycleLength] = useState(user?.averageCycleLength?.toString() || '28');
  const [periodLength, setPeriodLength] = useState(user?.averagePeriodLength?.toString() || '5');
  const [showCycleLengthModal, setShowCycleLengthModal] = useState(false);
  const [showPeriodLengthModal, setShowPeriodLengthModal] = useState(false);
  
  const [commonSymptoms, setCommonSymptoms] = useState<CommonSymptom[]>([]);
  
  const [isAdminSelected, setIsAdminSelected] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  
  const [ethnicity, setEthnicity] = useState<Ethnicity | ''>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [dietType, setDietType] = useState<DietType | ''>('');
  const [sleepPattern, setSleepPattern] = useState<SleepPattern | ''>('');
  const [stressLevel, setStressLevel] = useState<StressLevel | ''>('');
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);
  const [contraceptiveType, setContraceptiveType] = useState<ContraceptiveType | ''>('');
  const [climateType, setClimateType] = useState<ClimateType | ''>('');
  
  const [showEthnicityModal, setShowEthnicityModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showStressModal, setShowStressModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showContraceptiveModal, setShowContraceptiveModal] = useState(false);
  const [showClimateModal, setShowClimateModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const { setMode: setPregnancyMode } = usePregnancyStore();

  const stepSequence = getStepsForStage(lifeStage);
  const totalSteps = stepSequence.length;
  const currentStepType = stepSequence[step - 1] || 'lifeStage';
  
  const getFormattedDate = () => {
    if (!selectedDay || !selectedMonth || !selectedYear) return '';
    
    const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
    const formattedMonth = monthIndex < 10 ? `0${monthIndex}` : monthIndex.toString();
    const formattedDay = parseInt(selectedDay) < 10 ? `0${selectedDay}` : selectedDay;
    
    return `${selectedYear}-${formattedMonth}-${formattedDay}`;
  };
  
  const handleNext = () => {
    if (currentStepType === 'lifeStage') {
      if (!lifeStage) {
        Alert.alert('Required', 'Please select your current life stage');
        return;
      }
    } else if (currentStepType === 'basicInfo') {
      if (!birthMonth || !birthYear) {
        Alert.alert('Required', 'Please select your birth month and year');
        return;
      }
      const _age = calculateAge(parseInt(birthMonth), parseInt(birthYear));
      if (_age !== undefined && _age < 18) {
        Alert.alert(
          'Age Requirement',
          'f365 is designed for users aged 18 and above. You must be at least 18 years old to continue.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    } else if (currentStepType === 'lifestyle') {
    } else if (currentStepType === 'cycleInfo') {
      if (lifeStage !== 'perimenopause') {
        const formattedDate = getFormattedDate();
        if (!formattedDate) {
          Alert.alert('Required', 'Please select your last period start date');
          return;
        }
      }
    } else if (currentStepType === 'cycleDetails') {
      if (!cycleLength.trim() || !periodLength.trim()) {
        Alert.alert('Required', 'Please enter your cycle and period length');
        return;
      }
    } else if (currentStepType === 'goalsConsent') {
      if (!consentAccepted) {
        Alert.alert('Consent Required', 'Please confirm that you understand F365 provides wellness insights, not medical advice.');
        return;
      }
      if (isAdminSelected && adminCode !== ADMIN_CODE) {
        Alert.alert('Invalid Code', 'Invalid admin code. Please try again or continue as a regular user.');
        return;
      }
      void completeOnboarding();
      return;
    }
    setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const { setAuthId, authId: storedAuthId } = useUserStore();
  
  const completeOnboarding = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('=== ONBOARDING START ===');
      
      let resolvedAuthId: string | null = null;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        resolvedAuthId = session.user.id;
        console.log('Step 1a: Got auth user from session:', resolvedAuthId);
      }

      if (!resolvedAuthId) {
        try {
          const { data: { user: networkUser } } = await supabase.auth.getUser();
          if (networkUser) {
            resolvedAuthId = networkUser.id;
            console.log('Step 1b: Got auth user from getUser:', resolvedAuthId);
          }
        } catch (err) {
          console.warn('Step 1b: getUser failed, trying store fallback:', err);
        }
      }

      if (!resolvedAuthId && storedAuthId) {
        resolvedAuthId = storedAuthId;
        console.log('Step 1c: Using stored authId from login:', resolvedAuthId);
      }

      if (!resolvedAuthId) {
        const persistedAuthId = await AsyncStorage.getItem(AUTH_ID_STORAGE_KEY);
        if (persistedAuthId) {
          resolvedAuthId = persistedAuthId;
          console.log('Step 1d: Recovered persisted authId:', resolvedAuthId);
        }
      }

      if (!resolvedAuthId && isDemoMode) {
        resolvedAuthId = 'demo-auth-id';
        console.log('Step 1e: Using demo authId');
      }

      if (!resolvedAuthId) {
        console.error('No authenticated user found via any method');
        Alert.alert(
          'Session not ready',
          'Your login session was not available yet. Please sign in again, then complete setup.',
          [{ text: 'OK', onPress: () => router.replace('/login' as any) }]
        );
        setIsLoading(false);
        return;
      }
      
      console.log('Step 1: Using authenticated user:', resolvedAuthId);
      setAuthId(resolvedAuthId);
      
      if (user && user.onboarded) {
        console.log('User already onboarded, redirecting...');
        router.replace('/(tabs)');
        return;
      }
      
      const lastPeriodDate = getFormattedDate();
      console.log('Step 2: Last period date:', lastPeriodDate);
      
      const uniqueId = generate7DigitId();
      console.log('Step 2.5: Generated unique ID:', uniqueId);
      
      const authEmail = session?.user?.email || user?.email || undefined;
      
      const userProfile: any = {
        uniqueId,
        email: authEmail,
        birthMonth: parseInt(birthMonth) || undefined,
        birthYear: parseInt(birthYear) || undefined,
        country: country || undefined,
        ethnicity: ethnicity || undefined,
        activityLevel: activityLevel || undefined,
        dietType: dietType || undefined,
        sleepPattern: sleepPattern || undefined,
        stressLevel: stressLevel || undefined,
        healthConditions: healthConditions.length > 0 ? healthConditions : undefined,
        contraceptiveType: contraceptiveType || undefined,
        climateType: climateType || undefined,
        commonSymptoms: commonSymptoms.length > 0 ? commonSymptoms : undefined,
        averageCycleLength: parseInt(cycleLength) || 28,
        averagePeriodLength: parseInt(periodLength) || 5,
        lifeStage: lifeStage || 'period_tracking',
        notificationsEnabled: true,
        insightsEnabled: true,
        onboarded: true,
        consentGiven: consentAccepted,
      };
      
      console.log('Full profile data:', JSON.stringify(userProfile, null, 2));
      
      console.log('Step 3: Creating/updating user profile...');
      if (user) {
        console.log('Updating existing user...');
        await updateProfile(userProfile);
      } else {
        console.log('Registering new user...');
        await register(userProfile);
      }
      console.log('Step 3: User profile created/updated successfully');
      
      if (lifeStage === 'pregnant') {
        setPregnancyMode('pregnant');
      } else if (lifeStage === 'postpartum') {
        setPregnancyMode('postpartum');
      } else {
        setPregnancyMode(null);
      }
      
      const shouldCreateCycleData = lifeStage !== 'pregnant' && lifeStage !== 'postpartum';
      
      if (shouldCreateCycleData && lastPeriodDate) {
        console.log('Step 4: Creating initial cycle data...');
        const initialCycle = generateInitialCycleData(
          lastPeriodDate,
          parseInt(cycleLength) || 28
        );
        await addCycle(initialCycle);
        console.log('Step 4: Initial cycle added successfully');
        
        console.log('Step 5: Generating predictions...');
        await generatePredictions();
        console.log('Step 5: Predictions generated successfully');
      } else {
        console.log('Step 4-5: Skipping cycle data for life stage:', lifeStage);
      }
      
      console.log('=== ONBOARDING COMPLETE ===');
      const currentState = useUserStore.getState();
      const profileUsername = currentState.profileUsername;
      const secretName = profileUsername || currentState.user?.displayName || generateQuickCoolName();
      console.log('Navigating to secret name reveal with name:', secretName);
      router.replace(`/secret-name-reveal?name=${encodeURIComponent(secretName)}` as any);
    } catch (error) {
      console.error('=== ONBOARDING ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.code) {
          errorMessage = `Error code: ${errorObj.code}${errorObj.hint ? '\nHint: ' + errorObj.hint : ''}`;
        } else {
          errorMessage = JSON.stringify(error, null, 2);
        }
      }
      
      Alert.alert(
        'Onboarding Error', 
        `Could not complete setup: ${errorMessage}\n\nPlease check the console for details.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSymptomToggle = (symptom: CommonSymptom) => {
    setCommonSymptoms(prevSymptoms => {
      if (prevSymptoms.includes(symptom)) {
        return prevSymptoms.filter(s => s !== symptom);
      } else {
        return [...prevSymptoms, symptom];
      }
    });
  };
  
  const handleGoalToggle = (goal: string) => {
    setGoals(prevGoals => {
      if (prevGoals.includes(goal)) {
        return prevGoals.filter(g => g !== goal);
      } else {
        return [...prevGoals, goal];
      }
    });
  };
  

  
  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    setShowDayModal(false);
  };
  
  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    setShowMonthModal(false);
  };
  
  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    setShowYearModal(false);
  };
  
  const handleSelectCycleLength = (length: string) => {
    setCycleLength(length);
    setShowCycleLengthModal(false);
  };
  
  const handleSelectPeriodLength = (length: string) => {
    setPeriodLength(length);
    setShowPeriodLengthModal(false);
  };
  
  const toggleAdminSelection = () => {
    setIsAdminSelected(!isAdminSelected);
    if (!isAdminSelected) {
      setAdminCode('');
    }
  };
  
  const renderLifeStageStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where are you in your journey?</Text>
      <Text style={styles.stepDescription}>
        This helps us show you the most relevant features and content.
      </Text>
      <View style={styles.lifeStageContainer}>
        {LIFE_STAGE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.lifeStageCard,
              lifeStage === option.id && styles.lifeStageCardActive,
            ]}
            onPress={() => setLifeStage(option.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.lifeStageEmoji}>{option.emoji}</Text>
            <View style={styles.lifeStageTextWrap}>
              <Text style={[
                styles.lifeStageLabel,
                lifeStage === option.id && styles.lifeStageLabelActive,
              ]}>{option.label}</Text>
              <Text style={[
                styles.lifeStageDesc,
                lifeStage === option.id && styles.lifeStageDescActive,
              ]}>{option.description}</Text>
            </View>
            {lifeStage === option.id && (
              <View style={styles.lifeStageCheck}>
                <Check size={16} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Help us personalize your experience. Your privacy is our priority - we use a unique ID instead of your name.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Birth Month & Year *</Text>
        <Text style={styles.privacyNote}>
          We only collect month and year for privacy - not your exact birth date.
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
        <Text style={styles.inputLabel}>Country (Optional)</Text>
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
        <Text style={styles.privacyNote}>
          Helps AI provide ethnicity-based health insights and pattern recognition.
        </Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowEthnicityModal(true)}
        >
          <Text style={ethnicity ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {ethnicity ? ETHNICITY_LABELS[ethnicity] : "Select ethnicity"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Lifestyle Factors</Text>
      <Text style={styles.stepDescription}>
        These optional questions help our AI provide more accurate predictions based on your lifestyle.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Activity Level (Optional)</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowActivityModal(true)}
        >
          <Text style={activityLevel ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {activityLevel ? ACTIVITY_LEVEL_LABELS[activityLevel] : "Select activity level"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Diet Type (Optional)</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowDietModal(true)}
        >
          <Text style={dietType ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {dietType ? DIET_TYPE_LABELS[dietType] : "Select diet type"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Sleep Pattern (Optional)</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowSleepModal(true)}
        >
          <Text style={sleepPattern ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {sleepPattern ? SLEEP_PATTERN_LABELS[sleepPattern] : "Select sleep pattern"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Stress Level (Optional)</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowStressModal(true)}
        >
          <Text style={stressLevel ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {stressLevel ? STRESS_LEVEL_LABELS[stressLevel] : "Select stress level"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Climate (Optional)</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowClimateModal(true)}
        >
          <Text style={climateType ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {climateType ? CLIMATE_TYPE_LABELS[climateType] : "Select climate"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Cycle Information</Text>
      <Text style={styles.stepDescription}>
        {lifeStage === 'perimenopause'
          ? 'If you still have periods, this helps track changes. You can skip if not applicable.'
          : 'When did your last period start? This helps us provide accurate predictions.'}
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Last Period Start Date {lifeStage === 'perimenopause' ? '(Optional)' : '*'}
        </Text>
        
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerItem}>
            <Text style={styles.datePickerLabel}>Day</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDayModal(true)}
            >
              <Text style={selectedDay ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                {selectedDay || "Day"}
              </Text>
              <ChevronDown size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerItem}>
            <Text style={styles.datePickerLabel}>Month</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowMonthModal(true)}
            >
              <Text style={selectedMonth ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                {selectedMonth || "Month"}
              </Text>
              <ChevronDown size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerItem}>
            <Text style={styles.datePickerLabel}>Year</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowYearModal(true)}
            >
              <Text style={selectedYear ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                {selectedYear || "Year"}
              </Text>
              <ChevronDown size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.selectedDateDisplay}>
          <Calendar size={16} color={Colors.primary} />
          <Text style={styles.selectedDateText}>
            {getFormattedDate() || "Please select a date"}
          </Text>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Contraceptive Method (Optional)</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowContraceptiveModal(true)}
        >
          <Text style={contraceptiveType ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {contraceptiveType ? CONTRACEPTIVE_TYPE_LABELS[contraceptiveType] : "Select method"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Health Conditions (Optional)</Text>
        <Text style={styles.privacyNote}>
          Select any conditions that may affect your cycle.
        </Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowHealthModal(true)}
        >
          <Text style={healthConditions.length > 0 ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
            {healthConditions.length > 0 
              ? healthConditions.map(c => HEALTH_CONDITION_LABELS[c]).join(', ')
              : "Select conditions"}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cycle Details</Text>
      <Text style={styles.stepDescription}>
        Tell us about your typical cycle. You can always update these later.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Average Cycle Length (days) *</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowCycleLengthModal(true)}
        >
          <Text style={styles.dropdownSelectedText}>
            {cycleLength}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.inputHint}>
          The average cycle is 28 days, but can range from 21-35 days.
        </Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Average Period Length (days) *</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowPeriodLengthModal(true)}
        >
          <Text style={styles.dropdownSelectedText}>
            {periodLength}
          </Text>
          <ChevronDown size={20} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.inputHint}>
          The average period lasts 3-7 days.
        </Text>
      </View>
    </View>
  );
  
  const getStageGoals = () => {
    switch (lifeStage) {
      case 'pregnant':
        return [
          { id: 'track_pregnancy', label: 'Track pregnancy', icon: '🤰' },
          { id: 'baby_development', label: 'Monitor baby growth', icon: '👶' },
          { id: 'prepare_delivery', label: 'Prepare for delivery', icon: '🏥' },
          { id: 'manage_symptoms', label: 'Manage symptoms', icon: '💊' },
          { id: 'nutrition_wellness', label: 'Nutrition & wellness', icon: '🥗' },
          { id: 'health_insights', label: 'Get health insights', icon: '💡' },
        ];
      case 'postpartum':
        return [
          { id: 'track_recovery', label: 'Track recovery', icon: '💪' },
          { id: 'baby_milestones', label: 'Baby milestones', icon: '👶' },
          { id: 'manage_symptoms', label: 'Manage symptoms', icon: '💊' },
          { id: 'mental_health', label: 'Mental health support', icon: '🧠' },
          { id: 'sleep_support', label: 'Sleep & energy', icon: '😴' },
          { id: 'health_insights', label: 'Get health insights', icon: '💡' },
        ];
      case 'perimenopause':
        return [
          { id: 'track_symptoms', label: 'Track symptoms', icon: '📋' },
          { id: 'manage_hotflashes', label: 'Manage hot flashes', icon: '🔥' },
          { id: 'sleep_improvement', label: 'Improve sleep', icon: '😴' },
          { id: 'mood_tracking', label: 'Mood & energy', icon: '🧠' },
          { id: 'understand_changes', label: 'Understand changes', icon: '📊' },
          { id: 'health_insights', label: 'Get health insights', icon: '💡' },
        ];
      case 'trying_to_conceive':
        return [
          { id: 'track_ovulation', label: 'Track ovulation', icon: '🥚' },
          { id: 'fertility_window', label: 'Fertility window', icon: '💕' },
          { id: 'track_cycle', label: 'Track my cycle', icon: '📅' },
          { id: 'manage_symptoms', label: 'Manage symptoms', icon: '💊' },
          { id: 'understand_patterns', label: 'Understand patterns', icon: '📊' },
          { id: 'health_insights', label: 'Get health insights', icon: '💡' },
        ];
      default:
        return [
          { id: 'track_cycle', label: 'Track my cycle', icon: '📅' },
          { id: 'conceive', label: 'Trying to conceive', icon: '👶' },
          { id: 'avoid_pregnancy', label: 'Avoid pregnancy', icon: '🛡️' },
          { id: 'manage_symptoms', label: 'Manage symptoms', icon: '💊' },
          { id: 'understand_patterns', label: 'Understand patterns', icon: '📊' },
          { id: 'health_insights', label: 'Get health insights', icon: '💡' },
        ];
    }
  };

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Goals</Text>
      <Text style={styles.stepDescription}>
        {lifeStage === 'pregnant'
          ? 'What matters most during your pregnancy? Select all that apply.'
          : lifeStage === 'postpartum'
          ? 'What support do you need right now? Select all that apply.'
          : lifeStage === 'perimenopause'
          ? 'What would you like help managing? Select all that apply.'
          : 'What would you like to achieve with this app? Select all that apply.'}
      </Text>
      
      <View style={styles.goalsContainer}>
        {getStageGoals().map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalButton,
              goals.includes(goal.id) && styles.selectedGoal
            ]}
            onPress={() => handleGoalToggle(goal.id)}
          >
            <Text style={styles.goalIcon}>{goal.icon}</Text>
            <Text 
              style={[
                styles.goalText,
                goals.includes(goal.id) && styles.selectedGoalText
              ]}
            >
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={[styles.stepTitle, { marginTop: 32 }]}>
        {lifeStage === 'pregnant' || lifeStage === 'postpartum' ? 'Current Symptoms' : 'Common Symptoms'}
      </Text>
      <Text style={styles.stepDescription}>
        {lifeStage === 'perimenopause'
          ? 'Select symptoms you commonly experience.'
          : lifeStage === 'pregnant' || lifeStage === 'postpartum'
          ? 'Select any symptoms you are currently experiencing.'
          : 'Select any symptoms you commonly experience during your cycle.'}
      </Text>
      
      <View style={styles.symptomsContainer}>
        {[
          { id: 'cramps' as CommonSymptom, label: 'Cramps' },
          { id: 'headache' as CommonSymptom, label: 'Headache' },
          { id: 'backache' as CommonSymptom, label: 'Backache' },
          { id: 'nausea' as CommonSymptom, label: 'Nausea' },
          { id: 'bloating' as CommonSymptom, label: 'Bloating' },
          { id: 'tender_breasts' as CommonSymptom, label: 'Tender Breasts' },
          { id: 'acne' as CommonSymptom, label: 'Acne' },
          { id: 'fatigue' as CommonSymptom, label: 'Fatigue' },
          { id: 'cravings' as CommonSymptom, label: 'Cravings' },
          { id: 'insomnia' as CommonSymptom, label: 'Insomnia' },
          { id: 'mood_swings' as CommonSymptom, label: 'Mood Swings' },
          { id: 'anxiety' as CommonSymptom, label: 'Anxiety' }
        ].map((symptom) => (
          <TouchableOpacity
            key={symptom.id}
            style={[
              styles.symptomButton,
              commonSymptoms.includes(symptom.id) && styles.selectedSymptom
            ]}
            onPress={() => handleSymptomToggle(symptom.id)}
          >
            <Text 
              style={[
                styles.symptomText,
                commonSymptoms.includes(symptom.id) && styles.selectedSymptomText
              ]}
            >
              {symptom.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ConsentCheckbox
          checked={consentAccepted}
          onToggle={() => setConsentAccepted(!consentAccepted)}
          style={styles.consentCheckbox}
        />

        <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.roleToggleContainer}
          onPress={toggleAdminSelection}
        >
          <View style={[styles.roleToggle, isAdminSelected && styles.roleToggleActive]}>
            <View style={[styles.roleToggleCircle, isAdminSelected && styles.roleToggleCircleActive]} />
          </View>
          <Text style={styles.roleToggleText}>I am an administrator</Text>
        </TouchableOpacity>
        
        {isAdminSelected && (
          <View style={styles.adminCodeContainer}>
            <Text style={styles.inputLabel}>Admin Verification Code</Text>
            <View style={styles.adminCodeInputContainer}>
              <TextInput
                style={styles.adminCodeInput}
                value={adminCode}
                onChangeText={setAdminCode}
                placeholder="Enter admin code"
                placeholderTextColor={Colors.inactive}
                secureTextEntry={!showAdminCode}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowAdminCode(!showAdminCode)}
              >
                {showAdminCode ? (
                  <EyeOff size={20} color={Colors.text} />
                ) : (
                  <Eye size={20} color={Colors.text} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
  
  const toggleHealthCondition = (condition: HealthCondition) => {
    setHealthConditions(prev => {
      if (prev.includes(condition)) {
        return prev.filter(c => c !== condition);
      }
      if (condition === 'none') {
        return ['none'];
      }
      return [...prev.filter(c => c !== 'none'), condition];
    });
  };
  
  const renderEthnicityModal = () => (
    <Modal
      visible={showEthnicityModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowEthnicityModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowEthnicityModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Ethnicity</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(ETHNICITY_LABELS) as Ethnicity[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalItem}
                    onPress={() => {
                      setEthnicity(option);
                      setShowEthnicityModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{ETHNICITY_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowEthnicityModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderActivityModal = () => (
    <Modal
      visible={showActivityModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowActivityModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowActivityModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Activity Level</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalItem}
                    onPress={() => {
                      setActivityLevel(option);
                      setShowActivityModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{ACTIVITY_LEVEL_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowActivityModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderDietModal = () => (
    <Modal
      visible={showDietModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDietModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowDietModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Diet Type</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(DIET_TYPE_LABELS) as DietType[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalItem}
                    onPress={() => {
                      setDietType(option);
                      setShowDietModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{DIET_TYPE_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDietModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderSleepModal = () => (
    <Modal
      visible={showSleepModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSleepModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowSleepModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Sleep Pattern</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(SLEEP_PATTERN_LABELS) as SleepPattern[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalItem}
                    onPress={() => {
                      setSleepPattern(option);
                      setShowSleepModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{SLEEP_PATTERN_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSleepModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderStressModal = () => (
    <Modal
      visible={showStressModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowStressModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowStressModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Stress Level</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(STRESS_LEVEL_LABELS) as StressLevel[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalItem}
                    onPress={() => {
                      setStressLevel(option);
                      setShowStressModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{STRESS_LEVEL_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowStressModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderHealthModal = () => (
    <Modal
      visible={showHealthModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowHealthModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowHealthModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Health Conditions</Text>
              <Text style={styles.modalSubtitle}>Select all that apply</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(HEALTH_CONDITION_LABELS) as HealthCondition[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalItem, styles.modalItemCheckbox]}
                    onPress={() => toggleHealthCondition(option)}
                  >
                    <View style={[
                      styles.checkbox,
                      healthConditions.includes(option) && styles.checkboxChecked
                    ]}>
                      {healthConditions.includes(option) && (
                        <Check size={14} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.modalItemText}>{HEALTH_CONDITION_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowHealthModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderContraceptiveModal = () => (
    <Modal
      visible={showContraceptiveModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowContraceptiveModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowContraceptiveModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Contraceptive Method</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(CONTRACEPTIVE_TYPE_LABELS) as ContraceptiveType[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalItem}
                    onPress={() => {
                      setContraceptiveType(option);
                      setShowContraceptiveModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{CONTRACEPTIVE_TYPE_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowContraceptiveModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderClimateModal = () => (
    <Modal
      visible={showClimateModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowClimateModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowClimateModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Climate</Text>
              <ScrollView style={styles.modalScrollView}>
                {(Object.keys(CLIMATE_TYPE_LABELS) as ClimateType[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalItem}
                    onPress={() => {
                      setClimateType(option);
                      setShowClimateModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{CLIMATE_TYPE_LABELS[option]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowClimateModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  

  
  const renderDayModal = () => (
    <Modal
      visible={showDayModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDayModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowDayModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Day</Text>
              <ScrollView style={styles.modalScrollView}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={styles.modalItem}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text style={styles.modalItemText}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDayModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderMonthModal = () => (
    <Modal
      visible={showMonthModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowMonthModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowMonthModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <ScrollView style={styles.modalScrollView}>
                {MONTHS.map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={styles.modalItem}
                    onPress={() => handleSelectMonth(month)}
                  >
                    <Text style={styles.modalItemText}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowMonthModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderYearModal = () => (
    <Modal
      visible={showYearModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowYearModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowYearModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <ScrollView style={styles.modalScrollView}>
                {YEARS.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.modalItem}
                    onPress={() => handleSelectYear(year)}
                  >
                    <Text style={styles.modalItemText}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowYearModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderCycleLengthModal = () => (
    <Modal
      visible={showCycleLengthModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCycleLengthModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowCycleLengthModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Cycle Length</Text>
              <ScrollView style={styles.modalScrollView}>
                {CYCLE_LENGTHS.map((length) => (
                  <TouchableOpacity
                    key={length}
                    style={styles.modalItem}
                    onPress={() => handleSelectCycleLength(length)}
                  >
                    <Text style={styles.modalItemText}>{length} days</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCycleLengthModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderPeriodLengthModal = () => (
    <Modal
      visible={showPeriodLengthModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPeriodLengthModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowPeriodLengthModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Period Length</Text>
              <ScrollView style={styles.modalScrollView}>
                {PERIOD_LENGTHS.map((length) => (
                  <TouchableOpacity
                    key={length}
                    style={styles.modalItem}
                    onPress={() => handleSelectPeriodLength(length)}
                  >
                    <Text style={styles.modalItemText}>{length} days</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPeriodLengthModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderBirthMonthModal = () => (
    <Modal
      visible={showBirthMonthModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowBirthMonthModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowBirthMonthModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Birth Month</Text>
              <ScrollView style={styles.modalScrollView}>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={styles.modalItem}
                    onPress={() => {
                      setBirthMonth((index + 1).toString());
                      setShowBirthMonthModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowBirthMonthModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
  
  const renderBirthYearModal = () => (
    <Modal
      visible={showBirthYearModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowBirthYearModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowBirthYearModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Birth Year</Text>
              <ScrollView style={styles.modalScrollView}>
                {BIRTH_YEARS.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.modalItem}
                    onPress={() => {
                      setBirthYear(year);
                      setShowBirthYearModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowBirthYearModal(false)}
              >
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
          headerShown: true,

          title: 'Onboarding',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Logo size={60} showText={true} />
          <Text style={styles.tagline}>Track your cycle with AI</Text>
        </View>
        
        <View style={styles.stepsIndicator}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <View 
              key={s} 
              style={[
                styles.stepDot,
                s === step && styles.activeStepDot,
                s < step && styles.completedStepDot
              ]}
            />
          ))}
        </View>
        
        {currentStepType === 'lifeStage' && renderLifeStageStep()}
        {currentStepType === 'basicInfo' && renderStep1()}
        {currentStepType === 'lifestyle' && renderStep2()}
        {currentStepType === 'cycleInfo' && renderStep3()}
        {currentStepType === 'cycleDetails' && renderStep4()}
        {currentStepType === 'goalsConsent' && renderStep5()}
        
        <View style={styles.buttonsContainer}>
          {step > 1 && (
            <Button
              title="Back"
              variant="outline"
              onPress={handleBack}
              style={styles.backButton}
              disabled={isLoading}
            />
          )}
          
          <Button
            title={step === totalSteps ? "Complete" : "Next"}
            onPress={handleNext}
            style={[styles.nextButton, step === 1 ? styles.fullWidthButton : undefined] as any}
            disabled={isLoading}
            loading={isLoading && step === totalSteps}
          />
        </View>
        
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>
            We prioritize your privacy. Your data is encrypted and never shared with third parties.
          </Text>
        </View>
      </ScrollView>
      
      
      {renderDayModal()}
      {renderMonthModal()}
      {renderYearModal()}
      {renderCycleLengthModal()}
      {renderPeriodLengthModal()}
      {renderBirthMonthModal()}
      {renderBirthYearModal()}
      {renderEthnicityModal()}
      {renderActivityModal()}
      {renderDietModal()}
      {renderSleepModal()}
      {renderStressModal()}
      {renderHealthModal()}
      {renderContraceptiveModal()}
      {renderClimateModal()}
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },

  tagline: {
    fontSize: 16,
    color: Colors.subtext,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.inactive,
    marginHorizontal: 4,
  },
  activeStepDot: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  completedStepDot: {
    backgroundColor: Colors.primary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalItemCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.subtext,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputHint: {
    fontSize: 13,
    color: Colors.subtext,
    marginTop: 4,
    lineHeight: 18,
  },
  privacyNote: {
    fontSize: 13,
    color: Colors.subtext,
    marginTop: 4,
    fontStyle: 'italic' as const,
    lineHeight: 18,
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
    fontSize: 16,
  },
  dropdownSelectedText: {
    color: Colors.text,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
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
  modalItemText: {
    fontSize: 16,
    color: Colors.text,
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
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedGoal: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalText: {
    color: Colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  selectedGoalText: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  symptomButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedSymptom: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  symptomText: {
    color: Colors.text,
    fontSize: 14,
  },
  selectedSymptomText: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
  fullWidthButton: {
    flex: 1,
    marginLeft: 0,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  roleToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.inactive,
    padding: 2,
    marginRight: 12,
  },
  roleToggleActive: {
    backgroundColor: Colors.primary,
  },
  roleToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  roleToggleCircleActive: {
    marginLeft: 'auto' as const,
  },
  roleToggleText: {
    fontSize: 16,
    color: Colors.text,
  },
  adminCodeContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminCodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminCodeInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 12,
  },
  adminCodeHint: {
    fontSize: 13,
    color: Colors.subtext,
    marginTop: 8,
    lineHeight: 18,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerLabel: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDateText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  privacyContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 19,
  },
  birthDateContainer: {
    flexDirection: 'row',
    marginTop: 8,
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
  consentCheckbox: {
    marginBottom: 24,
  },
  lifeStageContainer: {
    gap: 10,
  },
  lifeStageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  lifeStageCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  lifeStageEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  lifeStageTextWrap: {
    flex: 1,
  },
  lifeStageLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  lifeStageLabelActive: {
    color: Colors.primary,
  },
  lifeStageDesc: {
    fontSize: 13,
    color: Colors.subtext,
    lineHeight: 18,
  },
  lifeStageDescActive: {
    color: Colors.primary,
  },
  lifeStageCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
});
