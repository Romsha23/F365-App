import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCycleStore } from '../../store/cycle-store';
import { useUserStore } from '../../store/user-store';
import { usePregnancyStore } from '../../store/pregnancy-store';
import { CalendarDay } from '../../components/CalendarDay';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import Colors from '../../constants/colors';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react-native';
import * as DateUtils from '../../utils/date-utils';
import { usePartnerSharingStore } from '../../store/partner-sharing-store';

const PregnancyCalendarView = () => {
  const { pregnancyProfile, getCurrentWeek, appointments, pregnancyDayLogs } = usePregnancyStore();
  const currentWeek = getCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const MILESTONES: { week: number; title: string; description: string; color: string }[] = [
    { week: 4, title: 'Implantation', description: 'Baby implants in the uterine wall', color: '#EC4899' },
    { week: 8, title: 'Heartbeat', description: 'Baby\'s heart begins to beat', color: '#EF4444' },
    { week: 12, title: 'First Trimester Done', description: 'Baby is now a fetus!', color: '#F59E0B' },
    { week: 16, title: 'Gender Reveal', description: 'Baby\'s gender may be visible on ultrasound', color: '#8B5CF6' },
    { week: 20, title: 'Halfway!', description: 'You may feel baby\'s first movements', color: '#10B981' },
    { week: 24, title: 'Viability', description: 'Baby could survive outside the womb with help', color: '#3B82F6' },
    { week: 28, title: 'Third Trimester', description: 'Baby can open and close eyes', color: '#6366F1' },
    { week: 32, title: 'Rapid Growth', description: 'Baby is gaining weight fast', color: '#EC4899' },
    { week: 36, title: 'Almost Ready', description: 'Baby is practicing breathing', color: '#F59E0B' },
    { week: 37, title: 'Full Term', description: 'Baby is considered full term', color: '#10B981' },
    { week: 40, title: 'Due Date', description: 'Expected delivery date', color: '#EF4444' },
  ];

  const trimester = selectedWeek <= 13 ? 1 : selectedWeek <= 27 ? 2 : 3;
  const trimesterLabel = trimester === 1 ? 'First Trimester' : trimester === 2 ? 'Second Trimester' : 'Third Trimester';

  const getWeekLogs = (week: number) => {
    if (!pregnancyProfile?.lastPeriodDate) return [];
    const lmpDate = new Date(pregnancyProfile.lastPeriodDate);
    const weekStart = new Date(lmpDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    return pregnancyDayLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate < weekEnd;
    });
  };

  const weekLogs = getWeekLogs(selectedWeek);
  const upcomingAppointments = appointments
    .filter(a => new Date(a.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pregnancy Calendar' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={pregCalStyles.trimesterHeader}>
          <Text style={pregCalStyles.trimesterLabel}>{trimesterLabel}</Text>
          <Text style={pregCalStyles.weekRangeLabel}>Week {selectedWeek} of 40</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pregCalStyles.weekStrip}>
          {Array.from({ length: 40 }, (_, i) => i + 1).map(week => {
            const isPast = week < currentWeek;
            const isCurrent = week === currentWeek;
            const isSelected = week === selectedWeek;
            const hasMilestone = MILESTONES.some(m => m.week === week);
            return (
              <TouchableOpacity
                key={week}
                style={[
                  pregCalStyles.weekChip,
                  isPast && pregCalStyles.weekChipPast,
                  isCurrent && pregCalStyles.weekChipCurrent,
                  isSelected && pregCalStyles.weekChipSelected,
                ]}
                onPress={() => setSelectedWeek(week)}
              >
                <Text style={[
                  pregCalStyles.weekChipText,
                  isPast && pregCalStyles.weekChipTextPast,
                  (isCurrent || isSelected) && pregCalStyles.weekChipTextActive,
                ]}>{week}</Text>
                {hasMilestone && <View style={pregCalStyles.milestoneDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={pregCalStyles.sectionTitle}>Milestones</Text>
        {MILESTONES.filter(m => m.week >= selectedWeek - 2 && m.week <= selectedWeek + 6).map(milestone => (
          <View
            key={milestone.week}
            style={[
              pregCalStyles.milestoneCard,
              milestone.week <= currentWeek && pregCalStyles.milestoneCardDone,
              { borderLeftColor: milestone.color },
            ]}
          >
            <View style={pregCalStyles.milestoneHeader}>
              <View style={[pregCalStyles.milestoneWeekBadge, { backgroundColor: milestone.color + '20' }]}>
                <Text style={[pregCalStyles.milestoneWeekText, { color: milestone.color }]}>Wk {milestone.week}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={pregCalStyles.milestoneTitle}>{milestone.title}</Text>
                <Text style={pregCalStyles.milestoneDesc}>{milestone.description}</Text>
              </View>
              {milestone.week <= currentWeek && (
                <View style={pregCalStyles.checkBadge}>
                  <Text style={pregCalStyles.checkText}>✓</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {upcomingAppointments.length > 0 && (
          <>
            <Text style={pregCalStyles.sectionTitle}>Upcoming Appointments</Text>
            {upcomingAppointments.map(apt => (
              <TouchableOpacity
                key={apt.id}
                style={pregCalStyles.aptCard}
                onPress={() => router.push('/pregnancy-appointments' as any)}
                activeOpacity={0.85}
              >
                <Text style={pregCalStyles.aptType}>{apt.type}</Text>
                <Text style={pregCalStyles.aptDate}>{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                {apt.provider && <Text style={pregCalStyles.aptProvider}>{apt.provider}</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        {weekLogs.length > 0 && (
          <>
            <Text style={pregCalStyles.sectionTitle}>Week {selectedWeek} Logs</Text>
            {weekLogs.map((log, idx) => (
              <View key={idx} style={pregCalStyles.logCard}>
                <Text style={pregCalStyles.logDate}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                {log.symptoms.length > 0 && (
                  <View style={pregCalStyles.logSymptoms}>
                    {log.symptoms.slice(0, 4).map((s, i) => (
                      <View key={i} style={pregCalStyles.logSymptomChip}>
                        <Text style={pregCalStyles.logSymptomText}>{s.replace(/_/g, ' ')}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

export default function CalendarScreen() {
  const { cycles, predictions } = useCycleStore();
  const { user: _user } = useUserStore();
  const { isViewer } = usePartnerSharingStore();
  const { mode: pregnancyMode } = usePregnancyStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedDayData, setSelectedDayData] = useState<any>(null);
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  
  // Month picker
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate array of years (current year - 2 to current year + 2)
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYearNum - 2 + i).toString());
  
  // Generate calendar days for the current month and year
  useEffect(() => {
    try {
      // Make sure we're using the explicitly exported function
      const days = DateUtils.getCalendarDays(currentYear, currentMonth);
      setCalendarDays(days);
    } catch (error) {
      console.error('Error generating calendar days:', error);
      // Fallback to manual generation if the utility function fails
      const days = generateCalendarDays(currentYear, currentMonth);
      setCalendarDays(days);
    }
  }, [currentMonth, currentYear]);
  
  // Manual implementation of getCalendarDays function as fallback
  const generateCalendarDays = (year: number, month: number): Date[] => {
    try {
      // Create a date for the first day of the month
      const firstDay = new Date(year, month, 1);
      
      // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = firstDay.getDay();
      
      // Get the last day of the month
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      // Calculate days needed from previous month to fill the first row
      const daysFromPrevMonth = firstDayOfWeek;
      
      // Calculate total days needed (previous month + current month + next month)
      // We'll always show 6 rows (42 days) for consistency
      const totalDays = 42;
      
      // Calculate days needed from next month
      const daysFromNextMonth = totalDays - daysInMonth - daysFromPrevMonth;
      
      const calendarDays: Date[] = [];
      
      // Add days from previous month
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevMonthYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
      
      for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
        calendarDays.push(new Date(prevMonthYear, prevMonth, i));
      }
      
      // Add days from current month
      for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(new Date(year, month, i));
      }
      
      // Add days from next month
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextMonthYear = month === 11 ? year + 1 : year;
      
      for (let i = 1; i <= daysFromNextMonth; i++) {
        calendarDays.push(new Date(nextMonthYear, nextMonth, i));
      }
      
      return calendarDays;
    } catch (error) {
      console.error('Error generating calendar days:', error);
      // Return an empty array as fallback
      return [];
    }
  };
  
  useEffect(() => {
    updateSelectedDayData();
  }, [selectedDate, cycles]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const updateSelectedDayData = () => {
    if (!cycles || !Array.isArray(cycles)) {
      setSelectedDayData(null);
      return;
    }
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Find if there's data for this day
    for (const cycle of cycles) {
      if (!cycle || !cycle.days || !Array.isArray(cycle.days)) continue;
      
      const dayData = cycle.days.find(day => day && day.date && day.date.split('T')[0] === dateStr);
      if (dayData) {
        setSelectedDayData({
          ...dayData,
          cycleId: cycle.id,
        });
        return;
      }
    }
    
    setSelectedDayData(null);
  };
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleAddLog = () => {
    if (isViewer) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      Alert.alert('Future Date', 'You can only log entries for today or past dates.');
      return;
    }
    router.push({
      pathname: '/log-entry',
      params: { date: selectedDate.toISOString() }
    } as any);
  };
  
  const handleEditLog = () => {
    if (isViewer) {
      Alert.alert('Read-only access', 'Your partner access is view-only.');
      return;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      Alert.alert('Future Date', 'You can only log entries for today or past dates.');
      return;
    }
    router.push({
      pathname: '/log-entry',
      params: { 
        date: selectedDate.toISOString(),
        cycleId: selectedDayData?.cycleId
      }
    } as any);
  };
  
  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setShowMonthYearModal(false);
  };
  
  const handleYearSelect = (year: string) => {
    setCurrentYear(parseInt(year));
    setShowMonthYearModal(false);
  };
  
  const toggleMonthYearModal = () => {
    setShowMonthYearModal(!showMonthYearModal);
  };
  
  const renderWeekdayHeaders = () => {
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
      <View style={styles.weekdayHeader}>
        {weekdays.map((day, index) => (
          <Text key={index} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>
    );
  };
  
  const renderCalendarDays = () => {
    if (!calendarDays || calendarDays.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not load calendar</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.calendarGrid}>
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = DateUtils.isSameDay(date, new Date());
          
          // Get cycle day status
          let isPeriod = false;
          let isFertile = false;
          let isOvulation = false;
          let isPredicted = false;
          let dayData = undefined;
          
          try {
            // Create an array with the predictions object if it exists
            const predictionsArray = predictions ? [predictions] : [];
            const status = DateUtils.getCycleDayStatus(date, cycles, predictionsArray);
            isPeriod = status.isPeriod;
            isFertile = status.isFertile;
            isOvulation = status.isOvulation;
            isPredicted = status.isPredicted;
            
            // Get day data for mood and symptoms
            const dateStr = date.toISOString().split('T')[0];
            for (const cycle of cycles) {
              if (!cycle || !cycle.days || !Array.isArray(cycle.days)) continue;
              const foundDay = cycle.days.find(day => day && day.date && day.date.split('T')[0] === dateStr);
              if (foundDay) {
                dayData = {
                  mood: foundDay.mood,
                  symptoms: foundDay.symptoms || foundDay.symptomsWithIntensity?.map(s => s.id),
                  flow: foundDay.flow,
                };
                break;
              }
            }
          } catch (error) {
            console.error('Error getting cycle day status:', error);
          }
          
          return (
            <CalendarDay
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              isPeriod={isPeriod}
              isFertile={isFertile}
              isOvulation={isOvulation}
              isPredicted={isPredicted}
              dayData={dayData}
              onPress={handleDayPress}
            />
          );
        })}
      </View>
    );
  };
  
  const renderSelectedDayInfo = () => {
    if (!selectedDayData) {
      return (
        <Card style={styles.noDayDataCard}>
          <Text style={styles.noDayDataText}>No data for this day</Text>
          <Button 
            title="Add Log" 
            onPress={handleAddLog}
            style={styles.addLogButton}
          />
        </Card>
      );
    }
    
    const hasFlow = typeof selectedDayData.flow === 'string' && selectedDayData.flow !== 'none' && selectedDayData.flow.length > 0;
    const hasMood = typeof selectedDayData.mood === 'string' && selectedDayData.mood.length > 0;
    const hasSymptoms = Array.isArray(selectedDayData.symptoms) && selectedDayData.symptoms.length > 0;
    const hasNotes = typeof selectedDayData.notes === 'string' && selectedDayData.notes.length > 0;
    
    return (
      <Card style={styles.dayDataCard}>
        <View style={styles.dayDataHeader}>
          <Text style={styles.dayDataTitle}>Day Log</Text>
          <TouchableOpacity onPress={handleEditLog}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>
        {hasFlow ? (
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Flow:</Text>
            <View style={[styles.flowIndicator, getFlowStyle(selectedDayData.flow)]} />
            <Text style={styles.dataValue}>{String(selectedDayData.flow)}</Text>
          </View>
        ) : null}
        {hasMood ? (
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Mood:</Text>
            <Text style={styles.dataValue}>{String(selectedDayData.mood)}</Text>
          </View>
        ) : null}
        {hasSymptoms ? (
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Symptoms:</Text>
            <View style={styles.symptomsContainer}>
              {selectedDayData.symptoms.map((symptom: string, index: number) => (
                <View key={index} style={styles.symptomTag}>
                  <Text style={styles.symptomText}>
                    {String(symptom).split('_').map((word: string) => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {hasNotes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.dataLabel}>Notes:</Text>
            <Text style={styles.notesText}>{String(selectedDayData.notes)}</Text>
          </View>
        ) : null}
      </Card>
    );
  };
  
  const getFlowStyle = (flow: string) => {
    switch (flow) {
      case 'spotting':
        return styles.flowSpotting;
      case 'light':
        return styles.flowLight;
      case 'medium':
        return styles.flowMedium;
      case 'heavy':
        return styles.flowHeavy;
      default:
        return {};
    }
  };
  
  if (pregnancyMode === 'pregnant') {
    return <PregnancyCalendarView />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Calendar',
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleAddLog}
            >
              <Plus size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarContainer}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.monthTitleContainer}
              onPress={toggleMonthYearModal}
            >
              <Text style={styles.monthTitle}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <CalendarIcon size={16} color={Colors.primary} style={styles.calendarIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
              <ChevronRight size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <Modal
            visible={showMonthYearModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowMonthYearModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowMonthYearModal(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Month & Year</Text>
                    
                    <View style={styles.monthsGrid}>
                      {monthNames.map((month, index) => (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.monthItem,
                            currentMonth === index && styles.selectedMonthItem
                          ]}
                          onPress={() => handleMonthSelect(index)}
                        >
                          <Text 
                            style={[
                              styles.monthItemText,
                              currentMonth === index && styles.selectedMonthItemText
                            ]}
                          >
                            {month.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <View style={styles.yearsContainer}>
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.yearItem,
                            currentYear === parseInt(year) && styles.selectedYearItem
                          ]}
                          onPress={() => handleYearSelect(year)}
                        >
                          <Text 
                            style={[
                              styles.yearItemText,
                              currentYear === parseInt(year) && styles.selectedYearItemText
                            ]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.modalCloseButton}
                      onPress={() => setShowMonthYearModal(false)}
                    >
                      <Text style={styles.modalCloseButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          
          {renderWeekdayHeaders()}
          {renderCalendarDays()}
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.legendText}>Period</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Fertile Window</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
            <Text style={styles.legendText}>Ovulation</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.predictedDot]} />
            <Text style={styles.legendText}>Predicted</Text>
          </View>
        </View>
        
        <Text style={styles.selectedDateText}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        
        {renderSelectedDayInfo()}
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
    padding: 16,
    paddingBottom: 32,
  },
  headerButton: {
    marginRight: 16,
  },
  calendarContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flexShrink: 1,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.subtext,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  predictedDot: {
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendText: {
    fontSize: 12,
    color: Colors.subtext,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  noDayDataCard: {
    alignItems: 'center',
    padding: 24,
  },
  noDayDataText: {
    fontSize: 16,
    color: Colors.subtext,
    marginBottom: 16,
  },
  addLogButton: {
    minWidth: 120,
  },
  dayDataCard: {
    padding: 16,
  },
  dayDataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    width: 80,
  },
  dataValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  flowIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  flowSpotting: {
    backgroundColor: '#F5F0FF',
  },
  flowLight: {
    backgroundColor: '#EDE9FE',
  },
  flowMedium: {
    backgroundColor: '#DDD6FE',
  },
  flowHeavy: {
    backgroundColor: '#C4B5FD',
  },
  symptomsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  symptomTag: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  symptomText: {
    fontSize: 12,
    color: Colors.text,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
    fontStyle: 'italic',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthItem: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedMonthItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedMonthItemText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  yearsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  yearItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedYearItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  yearItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedYearItemText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  modalCloseButton: {
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
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
});

const pregCalStyles = StyleSheet.create({
  trimesterHeader: {
    marginBottom: 16,
  },
  trimesterLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  weekRangeLabel: {
    fontSize: 14,
    color: Colors.subtext,
    marginTop: 4,
  },
  weekStrip: {
    paddingBottom: 16,
    paddingHorizontal: 4,
    gap: 6,
  },
  weekChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekChipPast: {
    backgroundColor: '#FCE7F3',
    borderColor: '#FBCFE8',
  },
  weekChipCurrent: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  weekChipSelected: {
    backgroundColor: '#BE185D',
    borderColor: '#BE185D',
  },
  weekChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  weekChipTextPast: {
    color: '#9D174D',
  },
  weekChipTextActive: {
    color: Colors.white,
  },
  milestoneDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EC4899',
    position: 'absolute',
    bottom: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  milestoneCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  milestoneCardDone: {
    opacity: 0.7,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneWeekBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  milestoneWeekText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  milestoneDesc: {
    fontSize: 13,
    color: Colors.subtext,
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  aptCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  aptType: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#065F46',
    textTransform: 'capitalize',
  },
  aptDate: {
    fontSize: 13,
    color: '#047857',
    marginTop: 4,
  },
  aptProvider: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  logCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  logSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  logSymptomChip: {
    backgroundColor: '#FCE7F3',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logSymptomText: {
    fontSize: 12,
    color: '#9D174D',
    textTransform: 'capitalize',
  },
});