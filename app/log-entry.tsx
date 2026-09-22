import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useCycleStore } from '../store/cycle-store';
import { useUserStore } from '../store/user-store';
import { usePartnerSharingStore } from '../store/partner-sharing-store';
import { FlowPicker } from '../components/FlowPicker';
import { MoodPicker } from '../components/MoodPicker';
import { SymptomPicker } from '../components/SymptomPicker';
import { DischargePicker } from '../components/DischargePicker';
import { PainLevelPicker } from '../components/PainLevelPicker';
import { CravingsPicker } from '../components/CravingsPicker';
import { SexualActivityPicker } from '../components/SexualActivityPicker';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { FlowIntensity, MoodType, SymptomType, SymptomWithIntensity, DischargeType, PainLevel, CravingType, SexualActivityType } from '../types/cycle';
import { saveSymptomLog } from '../store/symptom-store';
import { supabase } from '../lib/supabase';
import { X, Save, Search, AlertCircle, Calendar, ChevronDown, Lightbulb, Moon, Activity, Droplets, Thermometer, Scale, Pill, Plus, Trash2, Lock } from 'lucide-react-native';
import { formatDateForDisplay } from '../utils/date-utils';
import api from '../utils/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MAX_PAST_DAYS = 45;

function getSelectableMonths(): string[] {
  const today = new Date();
  const earliest = new Date(today);
  earliest.setDate(today.getDate() - MAX_PAST_DAYS);
  const months = new Set<string>();
  const d = new Date(earliest);
  while (d <= today) {
    months.add(MONTHS[d.getMonth()]);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
  }
  months.add(MONTHS[today.getMonth()]);
  return MONTHS.filter(m => months.has(m));
}

function getSelectableYears(): string[] {
  const today = new Date();
  const earliest = new Date(today);
  earliest.setDate(today.getDate() - MAX_PAST_DAYS);
  const years = new Set<string>();
  years.add(earliest.getFullYear().toString());
  years.add(today.getFullYear().toString());
  return Array.from(years).sort();
}

function getDaysForMonth(month: string, year: string): string[] {
  const monthIndex = MONTHS.indexOf(month);
  const y = parseInt(year);
  const daysInMonth = new Date(y, monthIndex + 1, 0).getDate();
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const earliest = new Date();
  earliest.setDate(earliest.getDate() - MAX_PAST_DAYS);
  earliest.setHours(0, 0, 0, 0);

  const days: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const candidate = new Date(y, monthIndex, d);
    if (candidate >= earliest && candidate <= today) {
      days.push(d.toString());
    }
  }
  return days;
}

function isDateInRange(day: string, month: string, year: string): boolean {
  const monthIndex = MONTHS.indexOf(month);
  const candidate = new Date(parseInt(year), monthIndex, parseInt(day));
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const earliest = new Date();
  earliest.setDate(earliest.getDate() - MAX_PAST_DAYS);
  earliest.setHours(0, 0, 0, 0);
  return candidate >= earliest && candidate <= today;
}

export default function LogEntryScreen() {
  const params = useLocalSearchParams();
  const { 
    date: dateParam, 
    cycleId: cycleIdParam,
    preselectedMood,
    preselectedFlow
  } = params;
  
  const { 
    cycles, 
    addCycle, 
    addDayData, 
    generatePredictions, 
    generateInsights, 
    aiTip 
  } = useCycleStore();
  const { user } = useUserStore();
  const { isViewer } = usePartnerSharingStore();
  const isReadOnlyPartner = isViewer;
  
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateParam) {
      const parsed = new Date(dateParam as string);
      if (parsed > today) {
        console.log('[LogEntry] Future date blocked:', dateParam, '→ using today');
        return new Date();
      }
      return parsed;
    }
    return new Date();
  });
  const [flow, setFlow] = useState<FlowIntensity>(
    (preselectedFlow as FlowIntensity) || 'none'
  );
  const [mood, setMood] = useState<MoodType | undefined>(
    preselectedMood as MoodType || undefined
  );
  const [moodIntensity, setMoodIntensity] = useState<number>(3);
  const [symptomsWithIntensity, setSymptomsWithIntensity] = useState<SymptomWithIntensity[]>([]);
  const [discharge, setDischarge] = useState<DischargeType>('none');
  const [painLevel, setPainLevel] = useState<PainLevel>('none');
  const [cravings, setCravings] = useState<CravingType[]>([]);
  const [sexualActivity, setSexualActivity] = useState<SexualActivityType | undefined>();
  const [notes, setNotes] = useState('');
  const [emotionalNotes, setEmotionalNotes] = useState('');
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [sleepHours, setSleepHours] = useState<number | undefined>();
  const [exerciseMinutes, setExerciseMinutes] = useState<number | undefined>();
  const [waterIntake, setWaterIntake] = useState<number | undefined>();
  const [temperature, setTemperature] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [cycleId] = useState<string | null>(cycleIdParam as string || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingWithXano, setIsSyncingWithXano] = useState(false);
  const [showSymptomSuggestions, setShowSymptomSuggestions] = useState(false);
  const [suggestedSymptoms, setSuggestedSymptoms] = useState<SymptomType[]>([]);
  const [isAnalyzingSymptoms, setIsAnalyzingSymptoms] = useState(false);
  
  // Date picker state
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(date.getDate().toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[date.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(date.getFullYear().toString());
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  
  useEffect(() => {
    // If we have a date and cycleId, try to load existing data
    if (dateParam && cycleIdParam) {
      const cycle = cycles.find(c => c.id === cycleIdParam);
      if (cycle) {
        const dayData = cycle.days.find(day => 
          day.date.split('T')[0] === new Date(dateParam as string).toISOString().split('T')[0]
        );
        
        if (dayData) {
          if (dayData.flow) setFlow(dayData.flow);
          if (dayData.mood) setMood(dayData.mood);
          if (dayData.moodIntensity) setMoodIntensity(dayData.moodIntensity);
          if (dayData.symptomsWithIntensity) {
            setSymptomsWithIntensity(dayData.symptomsWithIntensity);
          } else if (dayData.symptoms) {
            setSymptomsWithIntensity(dayData.symptoms.map(s => ({
              id: s,
              intensity: 3,
              isCustom: false
            })));
          }
          if (dayData.discharge) setDischarge(dayData.discharge);
          if (dayData.painLevel) setPainLevel(dayData.painLevel);
          if (dayData.cravings) setCravings(dayData.cravings);
          if (dayData.sexualActivity) setSexualActivity(dayData.sexualActivity);
          if (dayData.notes) setNotes(dayData.notes);
          if (dayData.emotionalNotes) setEmotionalNotes(dayData.emotionalNotes);
          if (dayData.stressLevel !== undefined) setStressLevel(dayData.stressLevel);
          if (dayData.sleep !== undefined) setSleepHours(dayData.sleep);
          if (dayData.exercise !== undefined) setExerciseMinutes(dayData.exercise);
          if (dayData.waterIntake !== undefined) setWaterIntake(dayData.waterIntake);
          if (dayData.temperature !== undefined) setTemperature(dayData.temperature.toString());
          if (dayData.weight !== undefined) setWeight(dayData.weight.toString());
          if (dayData.medications) setMedications(dayData.medications);
        }
      }
    }
  }, [dateParam, cycleIdParam, cycles]);
  
  // Update date when date picker values change
  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const monthIndex = MONTHS.indexOf(selectedMonth);
      const newDate = new Date(parseInt(selectedYear), monthIndex, parseInt(selectedDay));
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (newDate > today) {
        console.log('[LogEntry] Future date blocked from picker:', newDate.toISOString());
        setDate(new Date());
        return;
      }
      setDate(newDate);
    }
  }, [selectedDay, selectedMonth, selectedYear]);
  
  const handleFlowChange = (newFlow: FlowIntensity) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    setFlow(newFlow);
    
    if (newFlow === 'medium' || newFlow === 'heavy') {
      const commonPeriodSymptoms: SymptomType[] = ['cramps', 'fatigue', 'bloating'];
      const newSuggestions = commonPeriodSymptoms.filter(s => !symptomsWithIntensity.some(si => si.id === s));
      if (newSuggestions.length > 0) {
        setSuggestedSymptoms(newSuggestions);
        setShowSymptomSuggestions(true);
      }
    }
  };
  
  const handleMoodChange = (newMood: MoodType, intensity: number) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    setMood(newMood);
    setMoodIntensity(intensity);
    
    if (newMood === 'irritated' || newMood === 'sad') {
      const moodRelatedSymptoms: SymptomType[] = ['headache', 'fatigue', 'insomnia'];
      const newSuggestions = moodRelatedSymptoms.filter(s => !symptomsWithIntensity.some(si => si.id === s));
      if (newSuggestions.length > 0) {
        setSuggestedSymptoms(newSuggestions);
        setShowSymptomSuggestions(true);
      }
    }
  };
  
  const handleSymptomSelect = (symptomId: string, intensity: number, isCustom: boolean) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    const existing = symptomsWithIntensity.find(s => s.id === symptomId);
    if (existing) {
      setSymptomsWithIntensity(
        symptomsWithIntensity.map(s => 
          s.id === symptomId ? { ...s, intensity } : s
        )
      );
    } else {
      setSymptomsWithIntensity([
        ...symptomsWithIntensity, 
        { id: symptomId, intensity, isCustom }
      ]);
      setShowSymptomSuggestions(false);
    }
  };
  
  const handleRemoveSymptom = (symptomId: string) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    setSymptomsWithIntensity(symptomsWithIntensity.filter(s => s.id !== symptomId));
  };
  
  const handleDischargeChange = (newDischarge: DischargeType) => {
    setDischarge(newDischarge);
  };
  
  const handlePainLevelChange = (newPainLevel: PainLevel) => {
    setPainLevel(newPainLevel);
    
    if (newPainLevel === 'moderate' || newPainLevel === 'severe') {
      const painRelatedSymptoms: SymptomType[] = ['cramps', 'headache', 'backache'];
      const newSuggestions = painRelatedSymptoms.filter(s => !symptomsWithIntensity.some(si => si.id === s));
      if (newSuggestions.length > 0) {
        setSuggestedSymptoms(newSuggestions);
        setShowSymptomSuggestions(true);
      }
    }
  };
  
  const handleCravingToggle = (craving: CravingType) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    if (cravings.includes(craving)) {
      setCravings(cravings.filter(c => c !== craving));
    } else {
      setCravings([...cravings, craving]);
    }
  };
  
  const handleSelectDay = (day: string) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    if (!isDateInRange(day, selectedMonth, selectedYear)) {
      Alert.alert('Invalid date', 'You can only log entries for the past 45 days.');
      return;
    }
    setSelectedDay(day);
    setShowDayModal(false);
  };
  
  const handleSelectMonth = (month: string) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    setSelectedMonth(month);
    const availDays = getDaysForMonth(month, selectedYear);
    if (!availDays.includes(selectedDay)) {
      setSelectedDay(availDays[availDays.length - 1] || '1');
    }
    setShowMonthModal(false);
  };
  
  const handleSelectYear = (year: string) => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    setSelectedYear(year);
    const availDays = getDaysForMonth(selectedMonth, year);
    if (!availDays.includes(selectedDay)) {
      setSelectedDay(availDays[availDays.length - 1] || '1');
    }
    setShowYearModal(false);
  };
  
  const handleSave = async () => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);
    if (date > now) {
      Alert.alert('Invalid Date', 'You cannot log entries for future dates.');
      return;
    }

    setIsLoading(true);
    
    try {
      const dayData = {
        date: date.toISOString(),
        flow,
        mood,
        moodIntensity,
        symptomsWithIntensity,
        discharge,
        painLevel,
        cravings,
        sexualActivity,
        notes: notes.trim(),
        emotionalNotes: emotionalNotes.trim(),
        stressLevel,
        sleep: sleepHours,
        exercise: exerciseMinutes,
        waterIntake,
        temperature: temperature ? parseFloat(temperature) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        medications: medications.length > 0 ? medications : undefined,
      };
      
      // Sync to database for all users (both authenticated and demo)
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      const userId = supabaseUser?.id || user?.id || 'demo_user';
      
      // Always try to sync to database
      if (userId) {
        try {
          const cycleDay = cycleId ? 
            cycles.find(c => c.id === cycleId)?.days.length || 1 : 1;
          
          // Save symptom log
          await saveSymptomLog(
            userId,
            date.toISOString().split('T')[0],
            cycleDay,
            symptomsWithIntensity,
            mood ? [mood] : [],
            notes.trim(),
            flow,
            discharge,
            painLevel,
            cravings
          );
          console.log('Symptom log saved to Supabase');
          
          // Save mood log to mood_logs table
          if (mood) {
            const moodScoreMap: Record<MoodType, number> = {
              'happy': 80,
              'neutral': 50,
              'sad': 20,
              'irritated': 30,
              'anxious': 25,
              'energetic': 85,
              'tired': 35,
              'emotional': 40
            };
            
            const moodEmojiMap: Record<MoodType, string> = {
              'happy': '😊',
              'neutral': '😐',
              'sad': '😢',
              'irritated': '😠',
              'anxious': '😰',
              'energetic': '⚡',
              'tired': '😴',
              'emotional': '🥺'
            };
            
            const logDate = date.toISOString().split('T')[0];
            console.log('[Supabase] Saving mood log for date:', logDate, 'user:', userId);
            
            const { error: moodError } = await supabase
              .from('mood_logs')
              .upsert({
                user_id: userId,
                mood_score: moodScoreMap[mood] || 50,
                intensity: moodIntensity,
                emoji: moodEmojiMap[mood] || '😐',
                notes: emotionalNotes.trim() || null,
                created_at: date.toISOString(),
                date: logDate,
              }, {
                onConflict: 'user_id,date',
              });
            
            if (moodError) {
              console.log('Non-critical: Mood log sync failed:', moodError.message);
              const { error: insertError } = await supabase
                .from('mood_logs')
                .insert({
                  user_id: userId,
                  mood_score: moodScoreMap[mood] || 50,
                  intensity: moodIntensity,
                  emoji: moodEmojiMap[mood] || '😐',
                  notes: emotionalNotes.trim() || null,
                  created_at: date.toISOString(),
                });
              if (insertError) {
                console.log('Non-critical: Mood log insert also failed:', insertError.message);
              } else {
                console.log('Mood log saved to database (insert fallback)');
              }
            } else {
              console.log('Mood log saved to database for date:', logDate);
            }
          }
          
          // Save lifestyle log (stress level, sleep, exercise, water)
          const lifestyleDate = date.toISOString().split('T')[0];
          console.log('[Supabase] Saving lifestyle log for date:', lifestyleDate, 'user:', userId);
          
          const { error: lifestyleError } = await supabase
            .from('lifestyle_logs')
            .upsert({
              user_id: userId,
              stress_level: stressLevel,
              sleep_hours: sleepHours || null,
              exercise_minutes: exerciseMinutes || null,
              water_intake: waterIntake || null,
              date: lifestyleDate,
              created_at: date.toISOString(),
            }, {
              onConflict: 'user_id,date',
            });
          
          if (lifestyleError) {
            console.log('Non-critical: Lifestyle log upsert failed, trying insert:', lifestyleError.message);
            const { error: insertError } = await supabase
              .from('lifestyle_logs')
              .insert({
                user_id: userId,
                stress_level: stressLevel,
                sleep_hours: sleepHours || null,
                exercise_minutes: exerciseMinutes || null,
                water_intake: waterIntake || null,
                date: lifestyleDate,
                created_at: date.toISOString(),
              });
            if (insertError) {
              console.log('Non-critical: Lifestyle log insert also failed:', insertError.message);
            } else {
              console.log('Lifestyle log saved to database (insert fallback)');
            }
          } else {
            console.log('Lifestyle log saved to database for date:', lifestyleDate);
          }

          if (sexualActivity) {
            const sexDate = date.toISOString().split('T')[0];
            console.log('[Supabase] Saving sexual activity log for date:', sexDate, 'user:', userId);
            const { error: sexError } = await supabase
              .from('sexual_activity_logs')
              .upsert({
                user_id: userId,
                date: sexDate,
                protected: sexualActivity.protected,
                protection_type: sexualActivity.protectionType || null,
                libido: sexualActivity.libido || null,
                comfort: sexualActivity.comfort || null,
                orgasm: sexualActivity.orgasm ?? null,
                notes: sexualActivity.notes || null,
                cycle_phase: getCyclePhaseForDate(date),
                created_at: date.toISOString(),
              }, {
                onConflict: 'user_id,date',
              });
            if (sexError) {
              console.log('Non-critical: Sexual activity log upsert failed, trying insert:', sexError.message);
              const { error: insertErr } = await supabase
                .from('sexual_activity_logs')
                .insert({
                  user_id: userId,
                  date: sexDate,
                  protected: sexualActivity.protected,
                  protection_type: sexualActivity.protectionType || null,
                  libido: sexualActivity.libido || null,
                  comfort: sexualActivity.comfort || null,
                  orgasm: sexualActivity.orgasm ?? null,
                  notes: sexualActivity.notes || null,
                  cycle_phase: getCyclePhaseForDate(date),
                  created_at: date.toISOString(),
                });
              if (insertErr) {
                console.log('Non-critical: Sexual activity insert also failed:', insertErr.message);
              } else {
                console.log('Sexual activity log saved (insert fallback)');
              }
            } else {
              console.log('Sexual activity log saved for date:', sexDate);
            }
          }

        } catch (syncError) {
          console.log('Non-critical: Database sync failed. Data saved locally:', syncError);
        }
      }
      
      // If we have a cycleId, add to existing cycle
      if (cycleId) {
        await addDayData(cycleId, dayData);
      } else {
        // Check if there's a cycle that should include this date
        const existingCycle = findCycleForDate(date);
        
        if (existingCycle) {
          await addDayData(existingCycle.id, dayData);
        } else {
          // Create a new cycle
          const newCycle = {
            id: Date.now().toString(),
            startDate: date.toISOString(),
            days: [dayData],
            userId: user?.id, // Add user ID for XANO
          };
          
          await addCycle(newCycle);
        }
      }
      
      // Generate new predictions and insights
      await generatePredictions();
      await generateInsights();
      
      // Sync with XANO
      await syncWithXano(dayData);
      
      router.back();
    } catch (error) {
      console.error('Error saving log entry:', error);
      Alert.alert(
        "Error",
        "Failed to save your entry. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const syncWithXano = async (dayData: any) => {
    if (!user) return;
    
    setIsSyncingWithXano(true);
    
    try {
      // Try to submit to XANO directly
      if (cycleId) {
        // Find the cycle to get its XANO ID if available
        const cycle = cycles.find(c => c.id === cycleId);
        if (cycle?.xanoId) {
          await api.cycle.updateDayData(cycle.xanoId, dayData.date, dayData);
        }
      } else {
        // This is a new entry, might need to create a new cycle in XANO
        // This is handled by the addCycle function in the cycle store
      }
    } catch (error) {
      console.error('Error syncing with XANO:', error);
      // We don't show an error to the user here since the local save was successful
    } finally {
      setIsSyncingWithXano(false);
    }
  };
  
  const getCyclePhaseForDate = (targetDate: Date): string => {
    const cycle = cycles.find(c => {
      const start = new Date(c.startDate).getTime();
      const diff = (targetDate.getTime() - start) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 35;
    });
    if (!cycle) return 'unknown';
    const dayInCycle = Math.floor((targetDate.getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const avgLength = user?.averageCycleLength || 28;
    const avgPeriod = user?.averagePeriodLength || 5;
    if (dayInCycle <= avgPeriod) return 'menstrual';
    if (dayInCycle <= Math.round(avgLength * 0.45)) return 'follicular';
    if (dayInCycle <= Math.round(avgLength * 0.55)) return 'ovulation';
    return 'luteal';
  };

  const findCycleForDate = (date: Date) => {
    // Look for a cycle that might include this date
    // For simplicity, we'll check if the date is within 10 days of a cycle start
    const dateTime = date.getTime();
    
    return cycles.find(cycle => {
      const cycleStartTime = new Date(cycle.startDate).getTime();
      const daysDiff = Math.abs(dateTime - cycleStartTime) / (1000 * 60 * 60 * 24);
      return daysDiff <= 10;
    });
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  const analyzeSymptoms = async () => {
    if (symptomsWithIntensity.length === 0 && mood === undefined && flow === 'none') {
      Alert.alert(
        "Not Enough Data",
        "Please select at least one symptom, mood, or flow level to analyze."
      );
      return;
    }
    
    setIsAnalyzingSymptoms(true);
    
    try {
      // Create the system message with medical context
      const systemMessage = {
        role: 'system',
        content: `You are a helpful health assistant specialized in menstrual and reproductive health. 
        Based on the user's current symptoms, mood, and flow, suggest other symptoms they might be experiencing.
        Provide 2-3 additional symptoms they might want to track based on common correlations.
        Format your response as a JSON array of symptom IDs from this list: 
        cramps, headache, backache, nausea, bloating, tender_breasts, acne, fatigue, insomnia, spotting, dizziness, constipation, diarrhea.
        Only include symptoms that aren't already in their current list.`
      };
      
      // Create the user message with current symptoms
      const userMessage = {
        role: 'user',
        content: JSON.stringify({
          currentSymptoms: symptomsWithIntensity.map(s => s.id),
          currentMood: mood,
          currentFlow: flow,
          currentPainLevel: painLevel,
          cyclePhase: flow !== 'none' ? 'menstrual' : 'unknown'
        })
      };
      
      // Make the API request
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [systemMessage, userMessage]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Parse the response to get suggested symptoms
      try {
        const suggestedSymptomIds = JSON.parse(data.completion) as SymptomType[];
        const filteredSuggestions = suggestedSymptomIds.filter(
          id => !symptomsWithIntensity.some(si => si.id === id) && ['cramps', 'headache', 'backache', 'nausea', 'bloating', 'tender_breasts', 'acne', 'fatigue', 'insomnia', 'spotting', 'dizziness', 'constipation', 'diarrhea'].includes(id)
        );
        
        if (filteredSuggestions.length > 0) {
          setSuggestedSymptoms(filteredSuggestions);
          setShowSymptomSuggestions(true);
        } else {
          Alert.alert(
            "No Additional Symptoms",
            "Based on your current selections, we don't have additional symptoms to suggest."
          );
        }
      } catch (parseError) {
        console.error('Error parsing symptom suggestions:', parseError);
        Alert.alert(
          "Error",
          "Could not analyze symptoms. Please try again."
        );
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      Alert.alert(
        "Error",
        "Failed to analyze symptoms. Please try again."
      );
    } finally {
      setIsAnalyzingSymptoms(false);
    }
  };
  
  const openDatePicker = () => {
    if (isReadOnlyPartner) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    setShowDateModal(true);
  };
  
  // Day selection modal
  const renderDayModal = () => {
    const availableDays = getDaysForMonth(selectedMonth, selectedYear);
    return (
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
                  {availableDays.map((day) => (
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
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  
  // Month selection modal
  const renderMonthModal = () => {
    const availableMonths = getSelectableMonths();
    return (
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
                  {availableMonths.map((month) => (
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
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  
  // Year selection modal
  const renderYearModal = () => {
    const availableYears = getSelectableYears();
    return (
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
                  {availableYears.map((year) => (
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
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  
  // Date picker modal
  const renderDatePickerModal = () => (
    <Modal
      visible={showDateModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDateModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowDateModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date</Text>
              
              <View style={styles.datePickerContainer}>
                {/* Day Dropdown */}
                <View style={styles.datePickerItem}>
                  <Text style={styles.datePickerLabel}>Day</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setShowDayModal(true);
                      setShowDateModal(false);
                    }}
                  >
                    <Text style={styles.dropdownSelectedText}>
                      {selectedDay}
                    </Text>
                    <ChevronDown size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                
                {/* Month Dropdown */}
                <View style={styles.datePickerItem}>
                  <Text style={styles.datePickerLabel}>Month</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setShowMonthModal(true);
                      setShowDateModal(false);
                    }}
                  >
                    <Text style={styles.dropdownSelectedText}>
                      {selectedMonth}
                    </Text>
                    <ChevronDown size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                
                {/* Year Dropdown */}
                <View style={styles.datePickerItem}>
                  <Text style={styles.datePickerLabel}>Year</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      setShowYearModal(true);
                      setShowDateModal(false);
                    }}
                  >
                    <Text style={styles.dropdownSelectedText}>
                      {selectedYear}
                    </Text>
                    <ChevronDown size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Done</Text>
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
          title: 'Log Entry',
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleSave}
              disabled={isLoading || isSyncingWithXano}
            >
              {isLoading || isSyncingWithXano ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Save size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleCancel}
              disabled={isLoading || isSyncingWithXano}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isReadOnlyPartner && (
          <View style={styles.readOnlyBanner}>
            <Lock size={16} color={Colors.warning} />
            <Text style={styles.readOnlyText}>Read-only partner access — editing is disabled.</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={openDatePicker}
        >
          <Calendar size={20} color={Colors.primary} />
          <Text style={styles.dateText}>{formatDateForDisplay(date)}</Text>
          <ChevronDown size={16} color={Colors.text} />
        </TouchableOpacity>
        
        {aiTip && (
          <View style={styles.aiTipContainer}>
            <View style={styles.aiTipHeader}>
              <Lightbulb size={20} color={Colors.primary} />
              <Text style={styles.aiTipTitle}>AI Health Tip</Text>
            </View>
            <Text style={styles.aiTipText}>{aiTip}</Text>
          </View>
        )}
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Flow & Discharge</Text>
          <FlowPicker selectedFlow={flow} onSelectFlow={handleFlowChange} />
          <DischargePicker selectedDischarge={discharge} onSelectDischarge={handleDischargeChange} />
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <MoodPicker 
            selectedMood={mood} 
            moodIntensity={moodIntensity}
            onSelectMood={handleMoodChange} 
          />
          <PainLevelPicker selectedPainLevel={painLevel} onSelectPainLevel={handlePainLevelChange} />
        </View>
        
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Symptoms & Cravings</Text>
            <TouchableOpacity 
              style={styles.analyzeButton}
              onPress={analyzeSymptoms}
              disabled={isAnalyzingSymptoms}
            >
              {isAnalyzingSymptoms ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <View style={styles.analyzeButtonInner}>
                  <Search size={16} color={Colors.white} />
                  <Text style={styles.analyzeButtonText}>Suggest Symptoms</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {showSymptomSuggestions && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <AlertCircle size={16} color={Colors.primary} />
                <Text style={styles.suggestionsTitle}>Suggested symptoms based on your entries:</Text>
              </View>
              <View style={styles.suggestionsList}>
                {suggestedSymptoms.map((symptom) => {
                  const symptomLabels: Record<SymptomType, string> = {
                    'cramps': 'Cramps',
                    'headache': 'Headache',
                    'migraines': 'Migraines',
                    'backache': 'Backache',
                    'nausea': 'Nausea',
                    'bloating': 'Bloating',
                    'tender_breasts': 'Tender Breasts',
                    'breast_tenderness': 'Breast Tenderness',
                    'acne': 'Acne',
                    'fatigue': 'Fatigue',
                    'insomnia': 'Insomnia',
                    'spotting': 'Spotting',
                    'dizziness': 'Dizziness',
                    'constipation': 'Constipation',
                    'diarrhea': 'Diarrhea',
                    'digestive_issues': 'Digestive Issues'
                  };
                  
                  return (
                    <TouchableOpacity
                      key={symptom}
                      style={styles.suggestionButton}
                      onPress={() => handleSymptomSelect(symptom, 3, false)}
                    >
                      <Text style={styles.suggestionText}>{symptomLabels[symptom] || symptom}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          
          <SymptomPicker 
            selectedSymptoms={symptomsWithIntensity} 
            customSymptoms={[]}
            onSelectSymptom={handleSymptomSelect}
            onAddCustomSymptom={(name) => console.log('Add custom symptom:', name)}
            onRemoveSymptom={handleRemoveSymptom}
          />
          <CravingsPicker selectedCravings={cravings} onSelectCraving={handleCravingToggle} />
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Sexual Activity</Text>
          <SexualActivityPicker 
            sexualActivity={sexualActivity}
            onUpdate={setSexualActivity}
            cyclePhase={getCyclePhaseForDate(date)}
          />
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Lifestyle (Optional)</Text>
          
          <View style={styles.lifestyleGrid}>
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleHeader}>
                <Moon size={16} color={Colors.primary} />
                <Text style={styles.lifestyleLabel} numberOfLines={1}>Sleep</Text>
              </View>
              <View style={styles.lifestyleInputRow}>
                <TextInput
                  style={styles.lifestyleInput}
                  value={sleepHours?.toString() || ''}
                  onChangeText={(text) => setSleepHours(text ? parseInt(text) : undefined)}
                  placeholder="0"
                  placeholderTextColor={Colors.inactive}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.lifestyleUnit} numberOfLines={1}>hrs</Text>
              </View>
            </View>
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleHeader}>
                <Activity size={16} color={Colors.success} />
                <Text style={styles.lifestyleLabel} numberOfLines={1}>Exercise</Text>
              </View>
              <View style={styles.lifestyleInputRow}>
                <TextInput
                  style={styles.lifestyleInput}
                  value={exerciseMinutes?.toString() || ''}
                  onChangeText={(text) => setExerciseMinutes(text ? parseInt(text) : undefined)}
                  placeholder="0"
                  placeholderTextColor={Colors.inactive}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.lifestyleUnit} numberOfLines={1}>min</Text>
              </View>
            </View>
            <View style={styles.lifestyleItem}>
              <View style={styles.lifestyleHeader}>
                <Droplets size={16} color="#3B82F6" />
                <Text style={styles.lifestyleLabel} numberOfLines={1}>Water</Text>
              </View>
              <View style={styles.lifestyleInputRow}>
                <TextInput
                  style={styles.lifestyleInput}
                  value={waterIntake?.toString() || ''}
                  onChangeText={(text) => setWaterIntake(text ? parseInt(text) : undefined)}
                  placeholder="0"
                  placeholderTextColor={Colors.inactive}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.lifestyleUnit} numberOfLines={1}>gl</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.advancedToggle}
            onPress={() => setShowAdvancedFields(!showAdvancedFields)}
          >
            <Text style={styles.sectionTitle}>Advanced Tracking (Optional)</Text>
            <ChevronDown 
              size={20} 
              color={Colors.text} 
              style={{ transform: [{ rotate: showAdvancedFields ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {showAdvancedFields && (
            <View style={styles.advancedContent}>
              <View style={styles.advancedRow}>
                <View style={styles.advancedItem}>
                  <View style={styles.lifestyleHeader}>
                    <Thermometer size={18} color="#9333EA" />
                    <Text style={styles.lifestyleLabel}>Basal Temp</Text>
                  </View>
                  <View style={styles.lifestyleInputRow}>
                    <TextInput
                      style={styles.lifestyleInput}
                      value={temperature}
                      onChangeText={setTemperature}
                      placeholder="98.6"
                      placeholderTextColor={Colors.inactive}
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                    <Text style={styles.lifestyleUnit}>°F</Text>
                  </View>
                </View>
                
                <View style={styles.advancedItem}>
                  <View style={styles.lifestyleHeader}>
                    <Scale size={18} color="#8B5CF6" />
                    <Text style={styles.lifestyleLabel}>Weight</Text>
                  </View>
                  <View style={styles.lifestyleInputRow}>
                    <TextInput
                      style={styles.lifestyleInput}
                      value={weight}
                      onChangeText={setWeight}
                      placeholder="0"
                      placeholderTextColor={Colors.inactive}
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                    <Text style={styles.lifestyleUnit}>lbs</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.medicationsSection}>
                <View style={styles.lifestyleHeader}>
                  <Pill size={18} color="#F59E0B" />
                  <Text style={styles.lifestyleLabel}>Medications Taken</Text>
                </View>
                
                <View style={styles.medicationInputRow}>
                  <TextInput
                    style={styles.medicationInput}
                    value={newMedication}
                    onChangeText={setNewMedication}
                    placeholder="Enter medication name"
                    placeholderTextColor={Colors.inactive}
                    onSubmitEditing={() => {
                      if (newMedication.trim()) {
                        setMedications([...medications, newMedication.trim()]);
                        setNewMedication('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addMedicationButton}
                    onPress={() => {
                      if (newMedication.trim()) {
                        setMedications([...medications, newMedication.trim()]);
                        setNewMedication('');
                      }
                    }}
                  >
                    <Plus size={20} color={Colors.white} />
                  </TouchableOpacity>
                </View>
                
                {medications.length > 0 && (
                  <View style={styles.medicationsList}>
                    {medications.map((med, index) => (
                      <View key={index} style={styles.medicationTag}>
                        <Text style={styles.medicationTagText}>{med}</Text>
                        <TouchableOpacity
                          onPress={() => setMedications(medications.filter((_, i) => i !== index))}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2 size={14} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Stress &amp; Emotional Wellbeing</Text>
          
          <View style={styles.stressLevelContainer}>
            <View style={styles.stressLevelHeader}>
              <Text style={styles.stressLevelLabel}>Stress Level</Text>
              <Text style={styles.stressLevelValue}>{stressLevel}/5</Text>
            </View>
            
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { 
                      width: `${(stressLevel / 5) * 100}%`,
                      backgroundColor: stressLevel <= 2 ? Colors.success : stressLevel <= 3 ? Colors.warning : Colors.error
                    }
                  ]} 
                />
              </View>
              <View style={styles.sliderDots}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.sliderDot,
                      stressLevel >= level && styles.sliderDotActive,
                      { 
                        backgroundColor: stressLevel >= level 
                          ? (level <= 2 ? Colors.success : level <= 3 ? Colors.warning : Colors.error)
                          : Colors.border
                      }
                    ]}
                    onPress={() => setStressLevel(level)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>
            
            <View style={styles.stressLevelLabels}>
              <Text style={styles.stressLevelLabelText}>Low</Text>
              <Text style={styles.stressLevelLabelText}>High</Text>
            </View>
          </View>
          
          <View style={styles.emotionalNotesContainer}>
            <Text style={styles.emotionalNotesLabel}>Emotional Notes (Optional)</Text>
            <TextInput
              style={styles.emotionalNotesInput}
              value={emotionalNotes}
              onChangeText={setEmotionalNotes}
              placeholder="How are you feeling today? What's on your mind?"
              placeholderTextColor={Colors.inactive}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
        
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes here..."
            placeholderTextColor={Colors.inactive}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.buttonsContainer}>
          <Button 
            title="Cancel" 
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
            disabled={isLoading || isSyncingWithXano}
          />
          <Button 
            title={isSyncingWithXano ? "Syncing..." : "Save"} 
            onPress={handleSave}
            loading={isLoading}
            style={styles.saveButton}
            disabled={isLoading || isSyncingWithXano}
          />
        </View>
        
        {isSyncingWithXano && (
          <View style={styles.syncingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.syncingText}>Syncing with server...</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Render modals outside of the ScrollView */}
      {renderDatePickerModal()}
      {renderDayModal()}
      {renderMonthModal()}
      {renderYearModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '22',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  readOnlyText: {
    color: Colors.text,
    fontSize: 12,
    flex: 1,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 8,
  },
  // AI Tip styles
  aiTipContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  aiTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  aiTipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  // Modal styles
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePickerItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerLabel: {
    fontSize: 12,
    color: Colors.subtext,
    marginBottom: 4,
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
  dropdownSelectedText: {
    color: Colors.text,
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: Colors.inactive,
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  analyzeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  suggestionsContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionButton: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  notesContainer: {
    marginVertical: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text,
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    height: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  syncingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.subtext,
  },
  stressLevelContainer: {
    marginBottom: 16,
  },
  stressLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stressLevelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  stressLevelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sliderContainer: {
    marginBottom: 8,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sliderDotActive: {
    borderColor: 'transparent',
  },
  stressLevelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stressLevelLabelText: {
    fontSize: 12,
    color: Colors.subtext,
  },
  emotionalNotesContainer: {
    marginTop: 16,
  },
  emotionalNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emotionalNotesInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    height: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  lifestyleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  lifestyleItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 0,
    overflow: 'hidden' as const,
  },
  lifestyleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 3,
  },
  lifestyleLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  lifestyleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  lifestyleInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    maxWidth: 50,
  },
  lifestyleUnit: {
    fontSize: 10,
    color: Colors.subtext,
    flexShrink: 1,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advancedContent: {
    marginTop: 16,
  },
  advancedRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  advancedItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medicationsSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medicationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  medicationInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addMedicationButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  medicationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medicationTagText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
});