import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Animated } from 'react-native';
import { router, Href } from 'expo-router';
import { useUserStore } from '../../store/user-store';
import { useCycleStore } from '../../store/cycle-store';
import { usePregnancyStore } from '../../store/pregnancy-store';
import { Card } from '../../components/Card';
import { PredictionCard } from '../../components/PredictionCard';
import { InsightCard } from '../../components/InsightCard';
import { Button } from '../../components/Button';
import { StreakCard } from '../../components/StreakCard';
import { IrregularityAlertsList } from '../../components/IrregularityAlert';
import Colors from '../../constants/colors';
import { fonts } from '../../constants/theme';
import { formatDate, formatShortDate } from '../../utils/date-utils';
import { Plus, Calendar, Bell, AlertCircle, Heart, Pill, Activity, TrendingUp, Info, Brain, Sparkles, Users, BookOpen, Baby, Stethoscope, Clock, ChevronRight, Footprints, Egg, CircleAlert, Flame, Route } from 'lucide-react-native';
import { getAgeGateResult, getTeenSafeContent } from '../../utils/age-gate';
import { DailyStreakBanner } from '../../components/DailyStreakBanner';
import { LinearGradient } from 'expo-linear-gradient';

import { InsightType, MoodType, FlowIntensity, PredictionsType, PredictionData } from '../../types/cycle';
import { mixpanel, MixpanelEvents } from '../../utils/mixpanel';
import { usePartnerSharingStore } from '../../store/partner-sharing-store';

// Safe date creation function with enhanced error handling
const createSafeDate = (dateString: string | undefined): Date => {
  if (!dateString) {
    return new Date();
  }
  
  try {
    // Handle various date formats
    let normalizedDateString = dateString;
    
    // If it's already an ISO string, use it directly
    if (typeof dateString === 'string' && dateString.includes('T')) {
      normalizedDateString = dateString;
    } else if (typeof dateString === 'string') {
      // If it's just a date string, add time component
      normalizedDateString = dateString.includes('T') ? dateString : dateString + 'T00:00:00.000Z';
    }
    
    const date = new Date(normalizedDateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
      console.warn('Invalid date string:', dateString, 'normalized:', normalizedDateString);
      return new Date();
    }
    return date;
  } catch (error) {
    console.error('Error creating date from string:', dateString, error);
    return new Date();
  }
};

// Convert PredictionsType to PredictionCard format with enhanced error handling
const convertPredictions = (predictions: PredictionsType): PredictionData => {
  try {
    if (!predictions || typeof predictions !== 'object') {
      throw new Error('No predictions provided or invalid format');
    }

    // Use safe date creation for all date fields with validation
    const nextPeriodStart = predictions.nextPeriodDate || new Date(Date.now() + (28 * 24 * 60 * 60 * 1000)).toISOString();
    const averagePeriodLength = typeof predictions.averagePeriodLength === 'number' && predictions.averagePeriodLength >= 3 && predictions.averagePeriodLength <= 7 ? predictions.averagePeriodLength : 5;
    
    // Create safe dates with validation
    const periodStartDate = createSafeDate(nextPeriodStart);
    const nextPeriodEnd = new Date(periodStartDate.getTime() + (averagePeriodLength * 24 * 60 * 60 * 1000)).toISOString();
    
    // Calculate fertile window with safe dates and validation
    const fertileWindowStartDate = new Date(periodStartDate.getTime() - (14 * 24 * 60 * 60 * 1000));
    const fertileWindowEndDate = new Date(periodStartDate.getTime() - (12 * 24 * 60 * 60 * 1000));
    
    const fertileWindowStart = predictions.fertileWindowStart || fertileWindowStartDate.toISOString();
    const fertileWindowEnd = predictions.fertileWindowEnd || fertileWindowEndDate.toISOString();
    const nextOvulationDate = predictions.fertileWindowEnd || fertileWindowEnd;
    
    // Validate all dates before returning
    const validatedPredictions = {
      nextPeriodStart,
      nextPeriodEnd,
      nextFertileWindowStart: fertileWindowStart,
      nextFertileWindowEnd: fertileWindowEnd,
      nextOvulationDate,
      confidence: typeof predictions.confidence === 'number' && predictions.confidence >= 0 && predictions.confidence <= 1 ? predictions.confidence : 0.75,
      periodDays: [],
      fertileWindowDays: [],
      ovulationDay: nextOvulationDate,
    };

    // Additional validation for date consistency
    const startDate = createSafeDate(validatedPredictions.nextPeriodStart);
    const endDate = createSafeDate(validatedPredictions.nextPeriodEnd);
    const fertileStart = createSafeDate(validatedPredictions.nextFertileWindowStart);
    const fertileEnd = createSafeDate(validatedPredictions.nextFertileWindowEnd);

    if (endDate <= startDate || fertileEnd <= fertileStart) {
      console.warn('Date consistency check failed, using fallback');
      throw new Error('Invalid date relationships');
    }

    return validatedPredictions;
  } catch (error) {
    console.error('Error converting predictions:', error);
    
    // Return safe fallback predictions with proper validation
    const today = new Date();
    const nextMonth = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000));
    
    return {
      nextPeriodStart: nextMonth.toISOString(),
      nextPeriodEnd: new Date(nextMonth.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
      nextFertileWindowStart: new Date(nextMonth.getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString(),
      nextFertileWindowEnd: new Date(nextMonth.getTime() - (12 * 24 * 60 * 60 * 1000)).toISOString(),
      nextOvulationDate: new Date(nextMonth.getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString(),
      confidence: 0.5,
      periodDays: [],
      fertileWindowDays: [],
      ovulationDay: new Date(nextMonth.getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString(),
    };
  }
};

const PerimenopauseDiscoveryCard = () => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/perimenopause-dashboard' as any)}
      testID="perimenopause-discovery-card"
    >
      <View style={periStyles.discoveryCard}>
        <LinearGradient
          colors={['#FFFBEB', '#FEF3C7', '#FDE68A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={periStyles.discoveryGradient}
        >
          <View style={periStyles.discoveryIconWrap}>
            <Flame size={24} color="#D97706" />
          </View>
          <View style={periStyles.discoveryContent}>
            <Text style={periStyles.discoveryTitle}>Perimenopause Tracking</Text>
            <Text style={periStyles.discoverySubtitle}>Track hot flashes, mood, sleep & more</Text>
          </View>
          <ChevronRight size={20} color="#D97706" />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const periStyles = StyleSheet.create({
  discoveryCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  discoveryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  discoveryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  discoveryContent: {
    flex: 1,
  },
  discoveryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#92400E',
    marginBottom: 2,
  },
  discoverySubtitle: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
});

const teenStyles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E1B4B',
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6B7280',
    lineHeight: 19,
  },
});

const PregnancyDiscoveryCard = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/pregnancy-setup' as any)}
      testID="pregnancy-discovery-card"
    >
      <Animated.View style={[pregStyles.discoveryCard, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#FDF2F8', '#FCE7F3', '#F5F0FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={pregStyles.discoveryGradient}
        >
          <View style={pregStyles.discoveryIconWrap}>
            <Baby size={28} color="#EC4899" />
          </View>
          <View style={pregStyles.discoveryContent}>
            <Text style={pregStyles.discoveryTitle}>Are you pregnant?</Text>
            <Text style={pregStyles.discoverySubtitle}>Switch to Pregnancy Mode for week-by-week tracking, kick counter, and more</Text>
          </View>
          <ChevronRight size={22} color="#EC4899" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const PregnancyHomeDashboard = () => {
  const {
    pregnancyProfile,
    getCurrentWeek,
    getDaysUntilDue,
    appointments,
    pregnancyDayLogs,
  } = usePregnancyStore();
  const { user } = useUserStore();

  const currentWeek = getCurrentWeek();
  const daysUntilDue = getDaysUntilDue();
  const trimester = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;
  const progressPercent = Math.min(100, Math.round((currentWeek / 40) * 100));

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressAnim]);

  const getWeekDescription = (week: number) => {
    if (week < 4) return 'Your pregnancy journey begins';
    if (week < 8) return "Baby's major organs are forming";
    if (week < 12) return "Baby's heartbeat can be detected";
    if (week < 16) return 'Baby can make facial expressions';
    if (week < 20) return 'You might feel baby move';
    if (week < 24) return 'Baby can hear your voice';
    if (week < 28) return 'Baby is practicing breathing';
    if (week < 32) return 'Baby is gaining weight rapidly';
    if (week < 36) return 'Baby is almost ready';
    return 'Full term - baby can arrive any day!';
  };

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return pregnancyDayLogs.find(log => log.date.split('T')[0] === today);
  };

  const getNextAppointment = () => {
    const now = new Date();
    const upcoming = appointments
      .filter(a => new Date(a.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0];
  };

  const nextAppointment = getNextAppointment();
  const todayLog = getTodayLog();
  const showPostpartumPrompt = daysUntilDue <= 0;

  const getDisplayName = () => {
    if (!user || typeof user !== 'object') return 'Mama';
    if (user.displayName && user.displayName.trim().length > 0) return user.displayName.trim();
    return 'Mama';
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={pregStyles.container}>
      <ScrollView
        style={pregStyles.scrollView}
        contentContainerStyle={pregStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={pregStyles.headerCard}>
          <LinearGradient
            colors={['#FDF2F8', '#FCEEF5', '#F5F0FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={pregStyles.headerGradient}
          >
            <View style={pregStyles.headerTop}>
              <View style={{ flex: 1 }}>
                <Text style={pregStyles.headerGreeting}>Hello, {getDisplayName()}</Text>
                <Text style={pregStyles.headerWeek}>Week {currentWeek} of 40</Text>
                <Text style={pregStyles.headerTrimester}>Trimester {trimester}</Text>
              </View>
              <View style={pregStyles.weekBadge}>
                <Text style={pregStyles.weekBadgeNumber}>{currentWeek}</Text>
                <Text style={pregStyles.weekBadgeLabel}>weeks</Text>
              </View>
            </View>
            <Text style={pregStyles.weekDesc}>{getWeekDescription(currentWeek)}</Text>
          </LinearGradient>
        </View>

        {showPostpartumPrompt && (
          <TouchableOpacity
            style={pregStyles.postpartumPrompt}
            onPress={() => router.push('/postpartum-dashboard' as any)}
            activeOpacity={0.85}
            testID="postpartum-prompt"
          >
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={pregStyles.postpartumGradient}
            >
              <Baby size={24} color="#059669" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={pregStyles.postpartumTitle}>Has your baby arrived?</Text>
                <Text style={pregStyles.postpartumSubtitle}>Switch to Postpartum Mode for recovery tracking</Text>
              </View>
              <ChevronRight size={20} color="#059669" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={pregStyles.progressCard}>
          <View style={pregStyles.progressHeader}>
            <Text style={pregStyles.progressTitle}>Your Journey</Text>
            <Text style={pregStyles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={pregStyles.progressBarBg}>
            <Animated.View style={[pregStyles.progressBarFill, { width: progressWidth }]} />
          </View>
          <View style={pregStyles.statsRow}>
            <View style={pregStyles.statItem}>
              <Text style={pregStyles.statValue}>{daysUntilDue > 0 ? daysUntilDue : 0}</Text>
              <Text style={pregStyles.statLabel}>Days to go</Text>
            </View>
            <View style={pregStyles.statDivider} />
            <View style={pregStyles.statItem}>
              <Text style={pregStyles.statValue}>{Math.max(0, 40 - currentWeek)}</Text>
              <Text style={pregStyles.statLabel}>Weeks left</Text>
            </View>
            <View style={pregStyles.statDivider} />
            <View style={pregStyles.statItem}>
              <Text style={pregStyles.statValue}>{pregnancyProfile?.dueDate?.split('-').slice(1).join('/') || '--'}</Text>
              <Text style={pregStyles.statLabel}>Due date</Text>
            </View>
          </View>
        </View>

        <View style={pregStyles.quickActionsGrid}>
          <TouchableOpacity style={pregStyles.quickAction} onPress={() => router.push('/kick-counter' as any)}>
            <View style={[pregStyles.quickActionIcon, { backgroundColor: '#FDF2F8' }]}>
              <Footprints size={24} color="#EC4899" />
            </View>
            <Text style={pregStyles.quickActionText}>Kick Counter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pregStyles.quickAction} onPress={() => router.push('/contraction-timer' as any)}>
            <View style={[pregStyles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={24} color="#D97706" />
            </View>
            <Text style={pregStyles.quickActionText}>Contractions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pregStyles.quickAction} onPress={() => router.push('/pregnancy-log' as any)}>
            <View style={[pregStyles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
              <Activity size={24} color="#7C3AED" />
            </View>
            <Text style={pregStyles.quickActionText}>Daily Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pregStyles.quickAction} onPress={() => router.push('/pregnancy-appointments' as any)}>
            <View style={[pregStyles.quickActionIcon, { backgroundColor: '#ECFDF5' }]}>
              <Stethoscope size={24} color="#059669" />
            </View>
            <Text style={pregStyles.quickActionText}>Appointments</Text>
          </TouchableOpacity>
        </View>

        {!todayLog && (
          <TouchableOpacity
            style={pregStyles.logPromptCard}
            onPress={() => router.push('/pregnancy-log' as any)}
            activeOpacity={0.85}
          >
            <View style={pregStyles.logPromptIcon}>
              <Plus size={20} color={Colors.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={pregStyles.logPromptTitle}>Log Today</Text>
              <Text style={pregStyles.logPromptSubtitle}>Track symptoms, mood, weight, and kicks</Text>
            </View>
            <ChevronRight size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {nextAppointment && (
          <TouchableOpacity
            style={pregStyles.appointmentCard}
            onPress={() => router.push('/pregnancy-appointments' as any)}
            activeOpacity={0.85}
          >
            <View style={pregStyles.appointmentIcon}>
              <Stethoscope size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={pregStyles.appointmentTitle}>Next Appointment</Text>
              <Text style={pregStyles.appointmentDate}>
                {formatDate(new Date(nextAppointment.date))} - {nextAppointment.type}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.subtext} />
          </TouchableOpacity>
        )}

        <View style={pregStyles.moreSection}>
          <TouchableOpacity
            style={pregStyles.moreCard}
            onPress={() => router.push('/baby-development' as any)}
            activeOpacity={0.85}
          >
            <Baby size={22} color="#EC4899" />
            <Text style={pregStyles.moreCardTitle}>Baby Development</Text>
            <Text style={pregStyles.moreCardSub}>Week-by-week growth info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={pregStyles.moreCard}
            onPress={() => router.push('/pregnancy-calendar' as any)}
            activeOpacity={0.85}
          >
            <Calendar size={22} color="#7C3AED" />
            <Text style={pregStyles.moreCardTitle}>Pregnancy Calendar</Text>
            <Text style={pregStyles.moreCardSub}>Milestones & timeline</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={pregStyles.emergencyCard}
          onPress={() => router.push('/emergency-contacts' as any)}
          activeOpacity={0.85}
        >
          <AlertCircle size={20} color="#DC2626" />
          <Text style={pregStyles.emergencyText}>Emergency Contacts</Text>
          <ChevronRight size={18} color="#DC2626" />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

export default function HomeScreen() {
  const { user } = useUserStore();
  const { isViewer } = usePartnerSharingStore();
  const { mode: pregnancyMode } = usePregnancyStore();
  const { 
    cycles, 
    predictions, 
    insights, 
    currentStreak,
    longestStreak,
    irregularityAlerts,
    generatePredictions, 
    generateInsights, 
    markInsightAsRead, 
    calculateStreak,
    checkForIrregularities,
    dismissAlert,
    aiTip 
  } = useCycleStore();
  const [todayDate, setTodayDate] = useState(new Date());
  const [_selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowIntensity | null>(null);
  const initialLoadRef = useRef(false);
  const [hasError, setHasError] = useState(false);
  const isMountedRef = useRef(false);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [lastLogDate, setLastLogDate] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Set mounted flag
      if (!isMountedRef.current) {
        isMountedRef.current = true;
        // Delay navigation check to next tick to ensure router is ready
        setTimeout(() => {
          if (!user || typeof user !== 'object') {
            console.warn('Invalid user object in useEffect:', user);
            router.replace('/welcome' as Href);
            return;
          }
          
          if (!user.onboarded) {
            router.replace('/onboarding' as Href);
            return;
          }
        }, 100);
      }
      
      // Initialize data only once when component mounts - non-blocking
      const initializeData = async () => {
        if (!initialLoadRef.current) {
          initialLoadRef.current = true;
          
          try {
            // Calculate streak and check for irregularities on mount
            if (cycles && Array.isArray(cycles) && cycles.length > 0) {
              calculateStreak();
              checkForIrregularities();
            }
            
            // Fire off data generation in the background without blocking UI
            if (cycles && Array.isArray(cycles) && cycles.length > 0 && !predictions) {
              generatePredictions().catch(err => {
                console.warn('Prediction generation error:', err);
              });
            }
            
            if (cycles && Array.isArray(cycles) && cycles.length > 0 && (!insights || !Array.isArray(insights) || insights.length === 0)) {
              generateInsights().catch(err => {
                console.warn('Insights generation error:', err);
              });
            }
          } catch (error) {
            console.error('Error initializing data:', error);
          }
        }
      };
      
      void initializeData();
    
      // Update today's date safely with validation
      const timer = setInterval(() => {
        try {
          const newDate = new Date();
          if (!isNaN(newDate.getTime())) {
            setTodayDate(newDate);
          }
        } catch (error) {
          console.error('Error updating today date:', error);
        }
      }, 60000); // Update every minute
    
      // Check if there's data for today and calculate consecutive days
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (cycles && Array.isArray(cycles) && cycles.length > 0) {
          // Collect all logged days
          const allLoggedDays: string[] = [];
          
          for (const cycle of cycles) {
            if (!cycle || typeof cycle !== 'object' || !cycle.days || !Array.isArray(cycle.days)) continue;
            
            cycle.days.forEach(day => {
              if (day && day.date) {
                const dayDateStr = typeof day.date === 'string' ? day.date.split('T')[0] : new Date(day.date).toISOString().split('T')[0];
                if (!allLoggedDays.includes(dayDateStr)) {
                  allLoggedDays.push(dayDateStr);
                }
              }
            });
            
            const todayData = cycle.days.find(day => {
              if (!day || typeof day !== 'object' || !day.date) return false;
              
              try {
                const dayDateStr = typeof day.date === 'string' ? day.date.split('T')[0] : new Date(day.date).toISOString().split('T')[0];
                return dayDateStr === todayStr;
              } catch (dateError) {
                console.warn('Error parsing day date:', day.date, dateError);
                return false;
              }
            });
            
            if (todayData) {
              if (todayData.mood && typeof todayData.mood === 'string') setSelectedMood(todayData.mood as MoodType);
              if (todayData.flow && typeof todayData.flow === 'string') setSelectedFlow(todayData.flow as FlowIntensity);
            }
          }
          
          // Calculate consecutive days
          allLoggedDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          
          if (allLoggedDays.length > 0) {
            setLastLogDate(allLoggedDays[0]);
            
            let streak = 0;
            const checkDate = new Date(today);
            checkDate.setHours(0, 0, 0, 0);
            
            // Check if today or yesterday was logged (allow 1 day gap)
            const todayLogged = allLoggedDays.includes(todayStr);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const yesterdayLogged = allLoggedDays.includes(yesterdayStr);
            
            if (todayLogged || yesterdayLogged) {
              // Start counting from the most recent log
              const startDate = todayLogged ? today : yesterday;
              startDate.setHours(0, 0, 0, 0);
              
              for (let i = 0; i < 365; i++) {
                const dateToCheck = new Date(startDate);
                dateToCheck.setDate(startDate.getDate() - i);
                const dateStr = dateToCheck.toISOString().split('T')[0];
                
                if (allLoggedDays.includes(dateStr)) {
                  streak++;
                } else {
                  break;
                }
              }
            }
            
            setConsecutiveDays(streak);
          }
        }
      } catch (error) {
        console.error('Error checking today data:', error);
        setHasError(true);
      }
    
      return () => {
        clearInterval(timer);
      };
    } catch (error) {
      console.error('Error in useEffect:', error);
      setHasError(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cycles, predictions, insights, generatePredictions, generateInsights]);
  
  const handleAddLog = () => {
    try {
      if (isViewer) {
        Alert.alert('Read-only access', 'Your partner access is view-only.');
        console.warn('[Home] Partner read-only access, blocking log entry');
        return;
      }
      router.push('/log-entry' as Href);
    } catch (error) {
      console.error('Error navigating to log entry:', error);
    }
  };
  
  const handleInsightPress = (insight: InsightType) => {
    try {
      if (insight && insight.id && typeof insight.id === 'string') {
        mixpanel.track(MixpanelEvents.INSIGHT_VIEWED, {
          insightType: insight.type,
          insightTitle: insight.title,
        });
        void markInsightAsRead(insight.id);
        mixpanel.track(MixpanelEvents.INSIGHT_READ, {
          insightType: insight.type,
        });
        mixpanel.incrementUserProperty('Total Insights Read');
      } else {
        console.warn('Invalid insight passed to handleInsightPress:', insight);
      }
    } catch (error) {
      console.error('Error handling insight press:', error);
    }
  };
  
  const getGreeting = () => {
    try {
      const hour = todayDate.getHours();
      if (isNaN(hour)) return 'Hello';
      
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    } catch (error) {
      console.error('Error getting greeting:', error);
      return 'Hello';
    }
  };
  
  const getUnreadInsightsCount = () => {
    try {
      if (!insights || !Array.isArray(insights)) return 0;
      return insights.filter(insight => 
        insight && 
        typeof insight === 'object' && 
        insight.id && 
        !insight.read
      ).length;
    } catch (error) {
      console.error('Error getting unread insights count:', error);
      return 0;
    }
  };


  const handleFlowSelect = (flow: FlowIntensity) => {
    try {
      if (isViewer) {
        Alert.alert('Read-only access', 'Your partner access is view-only.');
        console.warn('[Home] Partner read-only access, blocking flow log');
        return;
      }
      setSelectedFlow(flow);
      mixpanel.track(MixpanelEvents.FLOW_LOGGED, {
        flowIntensity: flow,
        source: 'quick-log',
      });
      router.push({
        pathname: '/log-entry' as any,
        params: { 
          date: new Date().toISOString(),
          preselectedFlow: flow
        }
      });
    } catch (error) {
      console.error('Error handling flow select:', error);
    }
  };
  

  const getCycleDay = () => {
    try {
      if (!cycles || cycles.length === 0 || !predictions) return null;
      
      const lastCycle = cycles[cycles.length - 1];
      if (!lastCycle || !lastCycle.startDate) return null;
      
      const startDate = new Date(lastCycle.startDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysDiff >= 0 ? daysDiff + 1 : null;
    } catch (error) {
      console.error('Error calculating cycle day:', error);
      return null;
    }
  };

  const getMoodSummary = () => {
    try {
      if (!cycles || cycles.length === 0) return { dominant: 'No data', count: 0 };
      
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const moodCounts: Record<string, number> = {};
      
      cycles.forEach(cycle => {
        if (!cycle.days) return;
        cycle.days.forEach(day => {
          const dayDate = new Date(day.date);
          if (dayDate >= last7Days && day.mood) {
            moodCounts[day.mood] = (moodCounts[day.mood] || 0) + 1;
          }
        });
      });
      
      if (Object.keys(moodCounts).length === 0) return { dominant: 'No data', count: 0 };
      
      const dominant = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
      return { dominant: dominant[0], count: dominant[1] };
    } catch (error) {
      console.error('Error calculating mood summary:', error);
      return { dominant: 'No data', count: 0 };
    }
  };

  const getSymptomsSummary = () => {
    try {
      if (!cycles || cycles.length === 0) return [];
      
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const symptomCounts: Record<string, number> = {};
      
      cycles.forEach(cycle => {
        if (!cycle.days) return;
        cycle.days.forEach(day => {
          const dayDate = new Date(day.date);
          if (dayDate >= last7Days && day.symptoms) {
            day.symptoms.forEach((symptom: string) => {
              symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
            });
          }
        });
      });
      
      return Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom, count]) => ({ symptom, count }));
    } catch (error) {
      console.error('Error calculating symptoms summary:', error);
      return [];
    }
  };

  const getDaysUntilNextPeriod = () => {
    try {
      if (!predictions || !predictions.nextPeriodDate) return null;
      const nextPeriod = new Date(predictions.nextPeriodDate);
      const today = new Date();
      const daysDiff = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 0 ? daysDiff : 0;
    } catch (error) {
      console.error('Error calculating days until next period:', error);
      return null;
    }
  };

  const getDaysUntilOvulation = () => {
    try {
      if (!predictions || !predictions.fertileWindowEnd) return null;
      const ovulation = new Date(predictions.fertileWindowEnd);
      const today = new Date();
      const daysDiff = Math.ceil((ovulation.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 0 ? daysDiff : null;
    } catch (error) {
      console.error('Error calculating days until ovulation:', error);
      return null;
    }
  };

  const getFertilityStatus = () => {
    try {
      if (!predictions || !predictions.fertileWindowStart || !predictions.fertileWindowEnd) {
        return { status: 'unknown', daysUntil: null, daysLeft: null };
      }
      
      const today = new Date();
      const fertileStart = new Date(predictions.fertileWindowStart);
      const fertileEnd = new Date(predictions.fertileWindowEnd);
      
      if (today >= fertileStart && today <= fertileEnd) {
        const daysLeft = Math.ceil((fertileEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { status: 'fertile', daysUntil: null, daysLeft };
      } else if (today < fertileStart) {
        const daysUntil = Math.ceil((fertileStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { status: 'upcoming', daysUntil, daysLeft: null };
      } else {
        return { status: 'passed', daysUntil: null, daysLeft: null };
      }
    } catch (error) {
      console.error('Error calculating fertility status:', error);
      return { status: 'unknown', daysUntil: null, daysLeft: null };
    }
  };

  const renderFlowTracker = () => {
    const flows: { id: FlowIntensity; color: string; borderColor: string; textColor: string; label: string }[] = [
      { id: 'none', color: '#F0EEF5', borderColor: '#C8C3D6', textColor: '#6B6580', label: 'None' },
      { id: 'spotting', color: '#FCEEF3', borderColor: '#E8A0BF', textColor: '#B5568A', label: 'Spot' },
      { id: 'light', color: '#FAE4EE', borderColor: '#D97FAD', textColor: '#A8457A', label: 'Light' },
      { id: 'medium', color: '#F5D4E4', borderColor: '#C45B92', textColor: '#993068', label: 'Med' },
      { id: 'heavy', color: '#F0C4D8', borderColor: '#A83279', textColor: '#7E1D5A', label: 'Heavy' },
    ];

    return (
      <Card style={styles.trackerCard}>
        <Text style={styles.trackerTitle}>Today&apos;s Flow</Text>
        <View style={styles.flowContainer}>
          {flows.map(flow => (
            <TouchableOpacity
              key={flow.id}
              style={[
                styles.flowButton,
                { backgroundColor: flow.color, borderColor: flow.borderColor },
                selectedFlow === flow.id && { borderColor: flow.borderColor, borderWidth: 2.5, backgroundColor: flow.borderColor + '30' }
              ]}
              onPress={() => handleFlowSelect(flow.id)}
            >
              <Text style={[styles.flowLabel, { color: flow.textColor }]}>{flow.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    );
  };
  
  // Get display name with enhanced fallback and validation
  const getDisplayName = () => {
    try {
      if (!user || typeof user !== 'object') {
        console.warn('Invalid user object in getDisplayName:', user);
        return 'StarBloom';
      }
      
      if (user.displayName && user.displayName.trim().length > 0) {
        return user.displayName.trim();
      }
      
      return 'LunaSpark';
    } catch (error) {
      console.error('Error getting display name:', error);
      return 'LunaSpark';
    }
  };

  const getWellnessQuote = () => {
    const hour = todayDate.getHours();
    const dayOfWeek = todayDate.getDay();
    const quotes = [
      'Your body knows best — listen to it today.',
      'Every day you track is a gift to future you.',
      'Small steps lead to big insights.',
      'You\'re doing amazing, one day at a time.',
      'Your cycle, your power — own it.',
      'Self-care isn\'t selfish, it\'s essential.',
      'Trust your rhythm, you\'re in tune.',
    ];
    const index = (dayOfWeek + (hour < 12 ? 0 : hour < 18 ? 1 : 2)) % quotes.length;
    return quotes[index];
  };
  
  // Safe date formatting with enhanced error handling
  const getSafeFormattedDate = () => {
    try {
      if (!todayDate || isNaN(todayDate.getTime())) {
        return new Date().toLocaleDateString();
      }
      return formatDate(todayDate);
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toLocaleDateString();
    }
  };
  




  // Error boundary fallback
  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
          <Button 
            title="Retry" 
            onPress={() => {
              setHasError(false);
              initialLoadRef.current = false;
            }}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  const userLifeStage = user?.lifeStage;
  const ageGate = getAgeGateResult(user?.birthMonth, user?.birthYear, user?.lifeStage);
  const showCycleTracking = !userLifeStage || userLifeStage === 'period_tracking' || userLifeStage === 'trying_to_conceive';
  const showFertility = showCycleTracking && !ageGate.isTeen;
  const isPerimenopause = userLifeStage === 'perimenopause';
  const isPostpartum = userLifeStage === 'postpartum' || pregnancyMode === 'postpartum';

  if (pregnancyMode === 'pregnant') {
    return <PregnancyHomeDashboard />;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isPerimenopause ? (
          <PerimenopauseDiscoveryCard />
        ) : isPostpartum ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/postpartum-dashboard' as any)}
            testID="postpartum-discovery-card"
          >
            <View style={[periStyles.discoveryCard, { borderColor: '#D1FAE5' }]}>
              <LinearGradient
                colors={['#ECFDF5', '#D1FAE5', '#A7F3D0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={periStyles.discoveryGradient}
              >
                <View style={[periStyles.discoveryIconWrap, { backgroundColor: 'rgba(5, 150, 105, 0.15)' }]}>
                  <Baby size={24} color="#059669" />
                </View>
                <View style={periStyles.discoveryContent}>
                  <Text style={[periStyles.discoveryTitle, { color: '#065F46' }]}>Postpartum Dashboard</Text>
                  <Text style={[periStyles.discoverySubtitle, { color: '#047857' }]}>Track recovery, mood & baby milestones</Text>
                </View>
                <ChevronRight size={20} color="#059669" />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        ) : (
          <PregnancyDiscoveryCard />
        )}

        <View style={styles.headerCard}>
          <View style={styles.headerCardInner}>
            <View style={styles.headerTop}>
              <View style={styles.headerGreetingArea}>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.name}>{getDisplayName()} ✨</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddLog}
                activeOpacity={0.8}
              >
                <Plus size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.wellnessQuote}>{getWellnessQuote()}</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.date}>{getSafeFormattedDate()}</Text>
              {user?.uniqueId ? (
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText} numberOfLines={1}>ID: {user.uniqueId.replace(/-/g, "").replace(/[^0-9]/g, "").substring(0, 7) || user.uniqueId.substring(0, 7)}</Text>
                </View>
              ) : null}
            </View>

          </View>
        </View>
        
        <IrregularityAlertsList
          alerts={irregularityAlerts}
          onDismiss={dismissAlert}
          maxVisible={3}
        />
        
        {consecutiveDays > 0 && (
          <DailyStreakBanner
            consecutiveDays={consecutiveDays}
            lastLogDate={lastLogDate || undefined}
          />
        )}
        
        {(currentStreak > 0 || longestStreak > 0) && (
          <StreakCard
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            consecutiveDays={consecutiveDays}
          />
        )}
        
        {showCycleTracking && predictions && (
          <View style={styles.statsRow}>
            {getCycleDay() && (
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Cycle Day</Text>
                <Text style={styles.statValue}>{getCycleDay()}</Text>
              </Card>
            )}
            {getDaysUntilNextPeriod() !== null && (
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Next Period</Text>
                <Text style={styles.statValue}>{getDaysUntilNextPeriod()} days</Text>
              </Card>
            )}
            {getDaysUntilOvulation() !== null && (
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Ovulation</Text>
                <Text style={styles.statValue}>{getDaysUntilOvulation()} days</Text>
              </Card>
            )}
          </View>
        )}

        {ageGate.isTeen && (
          <View style={teenStyles.section}>
            <Text style={styles.sectionTitle}>Understand Your Body</Text>
            {getTeenSafeContent(ageGate.ageGroup).tips.map((tip, idx) => (
              <View key={idx} style={teenStyles.tipCard}>
                <Text style={teenStyles.tipTitle}>{tip.title}</Text>
                <Text style={teenStyles.tipDesc}>{tip.description}</Text>
              </View>
            ))}
          </View>
        )}

        {ageGate.canSeeIVF && (userLifeStage === 'trying_to_conceive' || (ageGate.ageGroup === 'mature' || ageGate.ageGroup === 'adult')) && (
          <TouchableOpacity
            style={styles.ivfReadinessCard}
            onPress={() => router.push('/fertility-pathway' as Href)}
            activeOpacity={0.85}
            testID="fertility-pathway-home"
          >
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE', '#BFDBFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ivfReadinessGradient}
            >
              <View style={[styles.ivfReadinessIconWrap, { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
                <Route size={22} color="#2563EB" />
              </View>
              <View style={styles.ivfReadinessContent}>
                <Text style={[styles.ivfReadinessTitle, { color: '#1E40AF' }]}>Your Fertility Pathway</Text>
                <Text style={[styles.ivfReadinessSubtitle, { color: '#3B82F6' }]}>Score, clinics, costs, roadmap & questions</Text>
              </View>
              <ChevronRight size={20} color="#2563EB" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {ageGate.canSeeFertility && !ageGate.canSeeIVF && showFertility && (
          <TouchableOpacity
            style={styles.ivfReadinessCard}
            onPress={() => router.push('/fertility-predictions' as Href)}
            activeOpacity={0.85}
            testID="fertility-predictions-young-adult"
          >
            <LinearGradient
              colors={['#FDF2F8', '#FCE7F3', '#FBCFE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ivfReadinessGradient}
            >
              <View style={[styles.ivfReadinessIconWrap, { backgroundColor: 'rgba(236,72,153,0.15)' }]}>
                <Egg size={22} color="#EC4899" />
              </View>
              <View style={styles.ivfReadinessContent}>
                <Text style={[styles.ivfReadinessTitle, { color: '#9D174D' }]}>Fertility Awareness</Text>
                <Text style={[styles.ivfReadinessSubtitle, { color: '#DB2777' }]}>Track ovulation & fertile window</Text>
              </View>
              <ChevronRight size={20} color="#EC4899" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showFertility && predictions && (() => {
          const fertilityStatus = getFertilityStatus();
          const isFertile = fertilityStatus.status === 'fertile';
          const isUpcoming = fertilityStatus.status === 'upcoming';
          const isPassed = fertilityStatus.status === 'passed';
          
          return (
            <Card style={[
              styles.fertilityCard,
              isFertile ? styles.fertilityCardActive : undefined,
              isUpcoming ? styles.fertilityCardUpcoming : undefined
            ] as any}>
              <View style={styles.fertilityHeader}>
                <View style={[
                  styles.fertilityIconContainer,
                  isFertile && styles.fertilityIconActive,
                  isUpcoming && styles.fertilityIconUpcoming
                ]}>
                  <Heart 
                    size={28} 
                    color={isFertile ? Colors.white : isUpcoming ? '#EC4899' : Colors.primary} 
                    fill={isFertile ? Colors.white : isUpcoming ? '#EC4899' : 'none'}
                  />
                </View>
                <View style={styles.fertilityInfo}>
                  <Text style={[
                    styles.fertilityTitle,
                    isFertile && { color: Colors.white },
                    isUpcoming && { color: Colors.foreground }
                  ]}>
                    {isFertile && '🌟 Peak Fertility Window'}
                    {isUpcoming && '💫 Fertility Window Coming Soon'}
                    {isPassed && '✨ Fertility Window Passed'}
                    {fertilityStatus.status === 'unknown' && 'Fertility Window'}
                  </Text>
                  <Text style={[
                    styles.fertilitySubtitle,
                    isFertile && { color: 'rgba(255, 255, 255, 0.95)' },
                    isUpcoming && { color: Colors.textMuted }
                  ]}>
                    {isFertile && `${fertilityStatus.daysLeft} ${fertilityStatus.daysLeft === 1 ? 'day' : 'days'} of high fertility remaining`}
                    {isUpcoming && `Starting in ${fertilityStatus.daysUntil} ${fertilityStatus.daysUntil === 1 ? 'day' : 'days'}`}
                    {isPassed && 'Next window in upcoming cycle'}
                  </Text>
                </View>
              </View>
              
              {isFertile && (
                <View style={styles.fertilityProgressContainer}>
                  <View style={styles.fertilityProgressBar}>
                    <View 
                      style={[
                        styles.fertilityProgressFill,
                        { 
                          width: `${Math.min(100, Math.max(20, (fertilityStatus.daysLeft || 0) * 25))}%` 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.fertilityProgressText}>
                    Best time for conception
                  </Text>
                </View>
              )}
              
              {isUpcoming && predictions.fertileWindowStart && (
                <View style={styles.fertilityDatesContainer}>
                  <View style={styles.fertilityDateRow}>
                    <Text style={styles.fertilityDateLabel}>Starts:</Text>
                    <Text style={styles.fertilityDateValue}>{formatShortDate(predictions.fertileWindowStart)}</Text>
                  </View>
                  <View style={styles.fertilityDateRow}>
                    <Text style={styles.fertilityDateLabel}>Ends:</Text>
                    <Text style={styles.fertilityDateValue}>{formatShortDate(predictions.fertileWindowEnd)}</Text>
                  </View>
                </View>
              )}

              {isPassed && predictions.fertileWindowStart && (
                <View style={styles.fertilityInfoBox}>
                  <Info size={16} color={Colors.subtext} />
                  <Text style={styles.fertilityInfoText}>
                    Your fertile window typically lasts 5-6 days in each cycle
                  </Text>
                </View>
              )}
            </Card>
          );
        })()}

        {isPerimenopause ? (
          <View style={styles.healthFeaturesSection}>
            <Text style={styles.sectionTitle}>Health & Wellness</Text>
            <View style={styles.healthFeaturesRow}>
              <TouchableOpacity
                style={styles.healthFeatureCard}
                onPress={() => router.push('/perimenopause-symptoms' as Href)}
                activeOpacity={0.85}
                testID="perimenopause-symptoms-home"
              >
                <View style={[styles.healthFeatureIconWrap, { backgroundColor: '#FFFBEB' }]}>
                  <Flame size={22} color="#D97706" />
                </View>
                <Text style={styles.healthFeatureTitle}>Symptom Tracker</Text>
                <Text style={styles.healthFeatureSubtitle}>Hot flashes, sleep, mood & more</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.healthFeatureCard, { borderColor: '#FDE68A' }]}
                onPress={() => router.push('/perimenopause-education' as Href)}
                activeOpacity={0.85}
                testID="perimenopause-education-home"
              >
                <View style={[styles.healthFeatureIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <BookOpen size={22} color="#B45309" />
                </View>
                <Text style={styles.healthFeatureTitle}>Education</Text>
                <Text style={styles.healthFeatureSubtitle}>Understand hormonal changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isPostpartum ? (
          <View style={styles.healthFeaturesSection}>
            <Text style={styles.sectionTitle}>Recovery & Wellness</Text>
            <View style={styles.healthFeaturesRow}>
              <TouchableOpacity
                style={styles.healthFeatureCard}
                onPress={() => router.push('/postpartum-assessment' as Href)}
                activeOpacity={0.85}
                testID="postpartum-assessment-home"
              >
                <View style={[styles.healthFeatureIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Activity size={22} color="#059669" />
                </View>
                <Text style={styles.healthFeatureTitle}>Recovery Check</Text>
                <Text style={styles.healthFeatureSubtitle}>Track your postpartum recovery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.healthFeatureCard, { borderColor: '#D1FAE5' }]}
                onPress={() => router.push('/postpartum-knowledge' as Href)}
                activeOpacity={0.85}
                testID="postpartum-knowledge-home"
              >
                <View style={[styles.healthFeatureIconWrap, { backgroundColor: '#D1FAE5' }]}>
                  <BookOpen size={22} color="#047857" />
                </View>
                <Text style={styles.healthFeatureTitle}>Knowledge Base</Text>
                <Text style={styles.healthFeatureSubtitle}>Postpartum care & guidance</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.healthFeaturesSection}>
            <Text style={styles.sectionTitle}>Health & Fertility</Text>
            <View style={styles.healthFeaturesRow}>
              <TouchableOpacity
                style={styles.healthFeatureCard}
                onPress={() => router.push('/fertility-predictions' as Href)}
                activeOpacity={0.85}
                testID="fertility-predictions-home"
              >
                <View style={[styles.healthFeatureIconWrap, { backgroundColor: '#FCE7F3' }]}>
                  <Egg size={22} color="#EC4899" />
                </View>
                <Text style={styles.healthFeatureTitle}>Fertility Predictions</Text>
                <Text style={styles.healthFeatureSubtitle}>Ovulation tracking & fertile window</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.healthFeatureCard, { borderColor: '#DBEAFE' }]}
                onPress={() => router.push('/pcos-insights' as Href)}
                activeOpacity={0.85}
                testID="pcos-insights-home"
              >
                <View style={[styles.healthFeatureIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <CircleAlert size={22} color="#3B82F6" />
                </View>
                <Text style={styles.healthFeatureTitle}>PCOS Insights</Text>
                <Text style={styles.healthFeatureSubtitle}>Symptom tracking & pattern analysis</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

        {aiTip && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => {
            mixpanel.track(MixpanelEvents.AI_TIP_VIEWED, { tip: aiTip });
          }}>
            <Card style={styles.aiTipCard}>
              <View style={styles.aiTipHeader}>
                <TrendingUp size={20} color={Colors.primary} />
                <Text style={styles.aiTipTitle}>AI Tip of the Day</Text>
              </View>
              <Text style={styles.aiTipText}>{aiTip}</Text>
            </Card>
          </TouchableOpacity>
        )}
        
        {predictions ? (
          <PredictionCard predictions={convertPredictions(predictions)} />
        ) : (
          <Card style={styles.noPredictionsCard}>
            <Text style={styles.noPredictionsText}>
              Add your period data to get personalized predictions.
            </Text>
            <Button 
              title="Log Period" 
              onPress={handleAddLog} 
              style={styles.logButton}
            />
          </Card>
        )}

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Last 7 Days Summary</Text>
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Dominant Mood</Text>
              <Text style={styles.summaryValue}>{getMoodSummary().dominant}</Text>
              <Text style={styles.summarySubtext}>{getMoodSummary().count} days</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Top Symptoms</Text>
              {getSymptomsSummary().length > 0 ? (
                getSymptomsSummary().map((s, i) => (
                  <Text key={i} style={styles.summarySymptom}>
                    • {s.symptom.replace('_', ' ')}
                  </Text>
                ))
              ) : (
                <Text style={styles.summaryValue}>None</Text>
              )}
            </Card>
          </View>
        </View>

        {showCycleTracking && renderFlowTracker()}

        {!isPerimenopause && !ageGate.isTeen && <View style={styles.partnerSection}>
          <Text style={styles.sectionTitle}>For You & Your Partner</Text>
          <View style={styles.partnerCardsRow}>
            <TouchableOpacity
              style={styles.partnerCard}
              onPress={() => router.push('/relationship-dashboard' as Href)}
              activeOpacity={0.85}
              testID="relationship-dashboard-home"
            >
              <View style={styles.partnerIconWrap}>
                <Users size={22} color={Colors.white} />
              </View>
              <Text style={styles.partnerCardTitle}>Relationship Dashboard</Text>
              <Text style={styles.partnerCardSubtitle}>Energy trends • Conflict risk • Stress sync</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.partnerCard, styles.partnerCardAlt]}
              onPress={() => router.push('/partner-education' as Href)}
              activeOpacity={0.85}
              testID="partner-education-home"
            >
              <View style={[styles.partnerIconWrap, styles.partnerIconAlt]}>
                <BookOpen size={22} color={Colors.white} />
              </View>
              <Text style={styles.partnerCardTitle}>Partner Education</Text>
              <Text style={styles.partnerCardSubtitle}>Micro‑insights on PMS, libido, and support</Text>
            </TouchableOpacity>
          </View>
        </View>}

        <TouchableOpacity
          style={styles.moodAICard}
          onPress={() => router.push('/(tabs)/predictive-mood' as Href)}
          activeOpacity={0.8}
        >
          <View style={styles.moodAIHeader}>
            <View style={styles.moodAIIcon}>
              <Brain size={28} color={Colors.white} />
            </View>
            <View style={styles.moodAIInfo}>
              <Text style={styles.moodAITitle}>AI Mood Forecast</Text>
              <Text style={styles.moodAISubtitle}>Predict your mood for the next 7 days</Text>
            </View>
            <Sparkles size={24} color={Colors.primary} />
          </View>
          <View style={styles.moodAICTA}>
            <Text style={styles.moodAICTAText}>View Predictions →</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiInsightsCard}
          onPress={() => router.push('/ai-insights' as Href)}
          activeOpacity={0.8}
        >
          <View style={styles.aiInsightsHeader}>
            <View style={styles.aiInsightsIconContainer}>
              <Sparkles size={24} color={Colors.gold} />
            </View>
            <View style={styles.aiInsightsInfo}>
              <View style={styles.aiInsightsTitleRow}>
                <Text style={styles.aiInsightsTitle}>AI Wellness Insights</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.aiInsightsSubtitle}>Weekly summary • Monthly reflection • What helped</Text>
            </View>
          </View>
          <View style={styles.aiInsightsFeatures}>
            <View style={styles.aiInsightsFeature}>
              <Calendar size={14} color={Colors.accent} />
              <Text style={styles.aiInsightsFeatureText}>This week vs last</Text>
            </View>
            <View style={styles.aiInsightsFeature}>
              <TrendingUp size={14} color={Colors.success} />
              <Text style={styles.aiInsightsFeatureText}>Strongest days</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.quickLogSection}>
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.quickLogRow}>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={() => {
                if (isViewer) {
                  Alert.alert('Read-only access', 'Your partner access is view-only.');
                  console.warn('[Home] Partner read-only access, blocking intimacy log');
                  return;
                }
                router.push({ pathname: '/log-entry' as any, params: { preselectedField: 'intimacy' } });
              }}
            >
              <Heart size={24} color={Colors.primary} />
              <Text style={styles.quickLogText}>Sex</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={() => {
                if (isViewer) {
                  Alert.alert('Read-only access', 'Your partner access is view-only.');
                  console.warn('[Home] Partner read-only access, blocking medication log');
                  return;
                }
                router.push({ pathname: '/log-entry' as any, params: { preselectedField: 'medication' } });
              }}
            >
              <Pill size={24} color={Colors.primary} />
              <Text style={styles.quickLogText}>Medication</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLogButton}
              onPress={() => {
                if (isViewer) {
                  Alert.alert('Read-only access', 'Your partner access is view-only.');
                  console.warn('[Home] Partner read-only access, blocking symptom log');
                  return;
                }
                router.push({ pathname: '/log-entry' as any, params: { preselectedField: 'symptoms' } });
              }}
            >
              <Activity size={24} color={Colors.primary} />
              <Text style={styles.quickLogText}>Symptoms</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Button 
          title="Add Today's Log" 
          onPress={handleAddLog}
          style={styles.addLogButton}
          fullWidth
        />
        
        <View style={styles.insightsHeader}>
          <Text style={styles.sectionTitle}>Your Insights</Text>
          {getUnreadInsightsCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getUnreadInsightsCount()}</Text>
            </View>
          )}
        </View>
        
        {insights && Array.isArray(insights) && insights.length > 0 ? (
          insights
            .filter(insight => insight && typeof insight === 'object' && insight.id) // Pre-filter valid insights
            .slice(0, 3)
            .map((insight, index) => {
              return (
                <InsightCard 
                  key={insight.id || `insight-${index}`} 
                  insight={insight} 
                  onPress={() => handleInsightPress(insight)} 
                />
              );
            })
        ) : (
          <Card style={styles.noInsightsCard}>
            <Text style={styles.noInsightsText}>
              Your personalized insights will appear here as you track your cycle.
            </Text>
          </Card>
        )}
        
        {insights && Array.isArray(insights) && insights.filter(insight => insight && typeof insight === 'object' && insight.id).length > 3 && (
          <Button 
            title="View All Insights" 
            variant="outline"
            onPress={() => router.push('/(tabs)/insights' as Href)}
            style={styles.viewAllButton}
          />
        )}
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              mixpanel.track(MixpanelEvents.CALENDAR_VIEWED);
              router.push('/(tabs)/calendar' as Href);
            }}
            activeOpacity={0.8}
          >
            <Calendar size={24} color={Colors.primary} />
            <Text style={styles.quickActionText}>Calendar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              mixpanel.track(MixpanelEvents.REMINDERS_VIEWED);
              router.push('/reminders' as Href);
            }}
            activeOpacity={0.8}
          >
            <Bell size={24} color={Colors.primary} />
            <Text style={styles.quickActionText}>Reminders</Text>
          </TouchableOpacity>
        </View>

        
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
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DEFF',
    ...Platform.select({
      ios: { shadowColor: '#9333EA', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(147,51,234,0.1)' },
    }),
  },
  headerCardInner: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  headerGreetingArea: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#8B7FA8',
    fontFamily: fonts.body.regular,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 26,
    fontFamily: fonts.heading.bold,
    color: '#2D1B4E',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  wellnessQuote: {
    fontSize: 13,
    color: '#9333EA',
    fontFamily: fonts.body.regular,
    fontStyle: 'italic' as const,
    marginTop: 10,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  headerMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EAFF',
  },
  date: {
    fontSize: 13,
    color: '#8B7FA8',
    fontFamily: fonts.body.regular,
    letterSpacing: 0.3,
  },
  idBadge: {
    maxWidth: 120,
    backgroundColor: '#F5F0FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8DEFF',
  },
  idBadgeText: {
    fontSize: 11,
    color: '#9333EA',
    fontFamily: fonts.body.medium,
    letterSpacing: 0.5,
  },

  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  noPredictionsCard: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DEFF',
  },
  noPredictionsText: {
    fontSize: 16,
    color: Colors.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  logButton: {
    minWidth: 120,
  },
  trackerCard: {
    marginVertical: 12,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E8DEFF',
    borderWidth: 1,
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#9333EA', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 10px rgba(147,51,234,0.08)' },
    }),
  },
  trackerTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: '#2D1B4E',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: '23%',
    backgroundColor: '#F3EEFA',
    borderWidth: 1.5,
    borderColor: '#DDD0EE',
  },
  selectedMoodButton: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    backgroundColor: '#EDE5F8',
  },
  moodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: Colors.text,
    marginTop: 4,
  },
  flowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flowButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    width: '18%',
    borderWidth: 1.5,
    borderColor: '#DDD0EE',
    backgroundColor: '#F3EEFA',
  },
  flowLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  addLogButton: {
    marginVertical: 16,
    marginHorizontal: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.semiBold,
    color: '#2D1B4E',
    letterSpacing: 0.4,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  noInsightsCard: {
    padding: 16,
    marginHorizontal: 16,
  },
  noInsightsText: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
  },
  viewAllButton: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  partnerSection: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  partnerCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  partnerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DEFF',
    minHeight: 128,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  partnerCardAlt: {
    backgroundColor: '#F3EAFA',
    borderColor: '#DDD0EE',
  },
  partnerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  partnerIconAlt: {
    backgroundColor: Colors.accent,
  },
  partnerCardTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 6,
  },
  partnerCardSubtitle: {
    fontSize: 12,
    color: Colors.subtext,
    lineHeight: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    width: '45%',
    borderWidth: 1,
    borderColor: '#E8DEFF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 120,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DEFF',
    borderRadius: 14,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#8B7FA8',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.heading.bold,
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
  aiTipCard: {
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F3EAFA',
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    borderRadius: 14,
  },
  aiTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  aiTipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  summarySection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DEFF',
    borderRadius: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.subtext,
    marginBottom: 6,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  summarySubtext: {
    fontSize: 11,
    color: Colors.subtext,
    marginTop: 2,
  },
  summarySymptom: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  quickLogSection: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  quickLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  quickLogButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3EAFA',
    borderWidth: 1,
    borderColor: '#DDD0EE',
  },
  quickLogText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.subtext,
    marginTop: 8,
    textAlign: 'center',
  },
  fertilityCard: {
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 5,
    borderLeftColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  fertilityCardActive: {
    backgroundColor: Colors.accent,
    borderLeftColor: Colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  fertilityCardUpcoming: {
    backgroundColor: Colors.card,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  fertilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fertilityIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fertilityIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  fertilityIconUpcoming: {
    backgroundColor: Colors.background,
  },
  fertilityInfo: {
    flex: 1,
  },
  fertilityTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  fertilitySubtitle: {
    fontSize: 14,
    color: Colors.subtext,
    lineHeight: 20,
  },
  fertilityProgressContainer: {
    marginTop: 16,
  },
  fertilityProgressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fertilityProgressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 6,
  },
  fertilityProgressText: {
    fontSize: 12,
    color: Colors.white,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.95,
  },
  fertilityDatesContainer: {
    marginTop: 14,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  fertilityDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fertilityDateLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  fertilityDateValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  fertilityInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  fertilityInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.subtext,
    lineHeight: 16,
  },
  moodAICard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#B2E0DC',
    borderTopWidth: 3,
    borderTopColor: '#1A9E90',
    shadowColor: '#1A9E90',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  moodAIHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  moodAIIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodAIInfo: {
    flex: 1,
  },
  moodAITitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  moodAISubtitle: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
  moodAICTA: {
    alignItems: 'flex-end',
  },
  moodAICTAText: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.primary,
  },
  aiInsightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#F5E6C8',
    borderTopWidth: 3,
    borderTopColor: '#D4A017',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  aiInsightsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF6E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiInsightsInfo: {
    flex: 1,
  },
  aiInsightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  aiInsightsTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  premiumBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: Colors.background,
    letterSpacing: 0.5,
  },
  aiInsightsSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
  aiInsightsFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  aiInsightsFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiInsightsFeatureText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: fonts.body.medium,
  },
  healthFeaturesSection: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  healthFeaturesRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 12,
  },
  healthFeatureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    minHeight: 128,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  healthFeatureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  healthFeatureTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  healthFeatureSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    lineHeight: 16,
  },
  ivfReadinessCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ivfReadinessGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
  },
  ivfReadinessIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  ivfReadinessContent: {
    flex: 1,
  },
  ivfReadinessTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#92400E',
    marginBottom: 2,
  },
  ivfReadinessSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: '#B45309',
    lineHeight: 16,
  },
});

const pregStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  discoveryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: { shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(236,72,153,0.15)' },
    }),
  },
  discoveryGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 16,
  },
  discoveryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  discoveryContent: {
    flex: 1,
    marginRight: 8,
  },
  discoveryTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: '#831843',
    marginBottom: 4,
  },
  discoverySubtitle: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#9D174D',
    lineHeight: 18,
    opacity: 0.8,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: { shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(236,72,153,0.12)' },
    }),
  },
  headerGradient: {
    padding: 20,
    borderRadius: 20,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  headerGreeting: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: '#9D174D',
    opacity: 0.7,
  },
  headerWeek: {
    fontSize: 26,
    fontFamily: fonts.heading.bold,
    color: '#831843',
    marginTop: 4,
  },
  headerTrimester: {
    fontSize: 14,
    fontFamily: fonts.body.medium,
    color: '#BE185D',
    marginTop: 2,
  },
  weekBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  weekBadgeNumber: {
    fontSize: 22,
    fontFamily: fonts.heading.bold,
    color: '#BE185D',
  },
  weekBadgeLabel: {
    fontSize: 10,
    fontFamily: fonts.body.medium,
    color: '#9D174D',
    marginTop: -2,
  },
  weekDesc: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: '#9D174D',
    fontStyle: 'italic' as const,
    marginTop: 12,
    lineHeight: 20,
  },
  postpartumPrompt: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  postpartumGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 14,
  },
  postpartumTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#065F46',
  },
  postpartumSubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  progressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.text,
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: fonts.body.bold,
    color: '#EC4899',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#FCE7F3',
    borderRadius: 5,
    overflow: 'hidden' as const,
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%' as const,
    backgroundColor: '#EC4899',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
  statItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#FCE7F3',
  },
  statValue: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: '#831843',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  quickAction: {
    width: '47%' as any,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    }),
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontFamily: fonts.body.semiBold,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  logPromptCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(124,58,237,0.08)' },
    }),
  },
  logPromptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  logPromptTitle: {
    fontSize: 15,
    fontFamily: fonts.body.semiBold,
    color: Colors.text,
  },
  logPromptSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
    marginTop: 2,
  },
  appointmentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  appointmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  appointmentTitle: {
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: '#065F46',
  },
  appointmentDate: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#047857',
    marginTop: 2,
  },
  moreSection: {
    flexDirection: 'row' as const,
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  moreCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    }),
  },
  moreCardTitle: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  moreCardSub: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.subtext,
  },
  emergencyCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
  },
  emergencyText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: '#DC2626',
  },
});