import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Baby,
  Activity,
  Heart,
  Stethoscope,
  Calendar,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { usePregnancyStore } from '../store/pregnancy-store';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PregnancyCalendarScreen() {
  const { pregnancyProfile, pregnancyDayLogs, appointments, kickCountSessions } = usePregnancyStore();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dueDateStr = pregnancyProfile?.dueDate ?? null;
  const lmpDateStr = pregnancyProfile?.lastPeriodDate ?? null;
  const dueDate = useMemo(() => dueDateStr ? new Date(dueDateStr) : null, [dueDateStr]);
  const lmpDate = useMemo(() => lmpDateStr ? new Date(lmpDateStr) : null, [lmpDateStr]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startOffset = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  }, [currentMonth, currentYear]);

  const logDates = useMemo(() => {
    const set = new Set<string>();
    pregnancyDayLogs.forEach(l => set.add(l.date.split('T')[0]));
    return set;
  }, [pregnancyDayLogs]);

  const appointmentDates = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach(a => map.set(a.date.split('T')[0], a.type));
    return map;
  }, [appointments]);

  const kickDates = useMemo(() => {
    const set = new Set<string>();
    kickCountSessions.forEach(s => set.add(s.date));
    return set;
  }, [kickCountSessions]);

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  }, [currentMonth]);

  const getWeekOfPregnancy = useCallback((date: Date) => {
    if (!lmpDate) return null;
    const diff = date.getTime() - lmpDate.getTime();
    if (diff < 0) return null;
    const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return weeks <= 42 ? weeks : null;
  }, [lmpDate]);

  const formatDateKey = (d: Date) => d.toISOString().split('T')[0];

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

  const isDueDate = (d: Date) =>
    dueDate && d.getDate() === dueDate.getDate() && d.getMonth() === dueDate.getMonth() && d.getFullYear() === dueDate.getFullYear();

  const getSelectedDayInfo = useCallback(() => {
    if (!selectedDate) return null;
    const log = pregnancyDayLogs.find(l => l.date.split('T')[0] === selectedDate);
    const apt = appointments.filter(a => a.date.split('T')[0] === selectedDate);
    const kicks = kickCountSessions.filter(s => s.date === selectedDate);
    const week = lmpDate ? getWeekOfPregnancy(new Date(selectedDate)) : null;
    return { log, appointments: apt, kicks, week };
  }, [selectedDate, pregnancyDayLogs, appointments, kickCountSessions, lmpDate, getWeekOfPregnancy]);

  const dayInfo = getSelectedDayInfo();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Pregnancy Calendar' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNav}>
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthNav}>
            <ChevronRight size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          {DAYS_OF_WEEK.map(day => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }
            const dateKey = formatDateKey(day);
            const hasLog = logDates.has(dateKey);
            const hasAppointment = appointmentDates.has(dateKey);
            const hasKicks = kickDates.has(dateKey);
            const isSelected = selectedDate === dateKey;
            const isTodayDate = isToday(day);
            const isDue = isDueDate(day);
            const _week = getWeekOfPregnancy(day);

            return (
              <TouchableOpacity
                key={dateKey}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isTodayDate && styles.dayCellToday,
                  isDue && styles.dayCellDue,
                ]}
                onPress={() => setSelectedDate(dateKey)}
              >
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isTodayDate && styles.dayNumberToday,
                  isDue && styles.dayNumberDue,
                ]}>
                  {day.getDate()}
                </Text>
                <View style={styles.indicators}>
                  {hasLog && <View style={[styles.indicator, { backgroundColor: Colors.primary }]} />}
                  {hasAppointment && <View style={[styles.indicator, { backgroundColor: '#F59E0B' }]} />}
                  {hasKicks && <View style={[styles.indicator, { backgroundColor: '#EC4899' }]} />}
                </View>
                {isDue && <Text style={styles.dueLabel}>DUE</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>Log</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Appointment</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
            <Text style={styles.legendText}>Kick Count</Text>
          </View>
        </View>

        {selectedDate && dayInfo && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Calendar size={18} color={Colors.primary} />
              <Text style={styles.detailTitle}>
                {new Date(selectedDate).toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              {dayInfo.week && (
                <View style={styles.weekBadge}>
                  <Text style={styles.weekBadgeText}>W{dayInfo.week}</Text>
                </View>
              )}
            </View>

            {dayInfo.log && (
              <View style={styles.detailSection}>
                <Activity size={14} color={Colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Daily Log</Text>
                  <Text style={styles.detailValue}>Mood: {dayInfo.log.mood}</Text>
                  {dayInfo.log.symptoms.length > 0 && (
                    <Text style={styles.detailValue}>Symptoms: {dayInfo.log.symptoms.slice(0, 3).join(', ')}</Text>
                  )}
                </View>
              </View>
            )}

            {dayInfo.appointments.length > 0 && dayInfo.appointments.map(apt => (
              <View key={apt.id} style={styles.detailSection}>
                <Stethoscope size={14} color="#F59E0B" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{apt.type} — {apt.provider}</Text>
                  {apt.notes && <Text style={styles.detailValue}>{apt.notes}</Text>}
                </View>
              </View>
            ))}

            {dayInfo.kicks.length > 0 && dayInfo.kicks.map(kick => (
              <View key={kick.id} style={styles.detailSection}>
                <Heart size={14} color="#EC4899" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Kick Count: {kick.kickCount} kicks</Text>
                </View>
              </View>
            ))}

            {!dayInfo.log && dayInfo.appointments.length === 0 && dayInfo.kicks.length === 0 && (
              <Text style={styles.noDataText}>No data logged for this day</Text>
            )}

            {!dayInfo.log && selectedDate === today.toISOString().split('T')[0] && (
              <TouchableOpacity
                style={styles.logTodayButton}
                onPress={() => router.push('/pregnancy-log' as any)}
              >
                <Text style={styles.logTodayText}>Log Today</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {dueDate && (
          <View style={styles.dueDateCard}>
            <Baby size={20} color="#EC4899" />
            <Text style={styles.dueDateText}>
              Due Date: {dueDate.toLocaleDateString('en-AU', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%' as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
  },
  dayCellDue: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  dayNumberSelected: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  dayNumberToday: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  dayNumberDue: {
    fontWeight: '700' as const,
    color: '#DC2626',
  },
  indicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dueLabel: {
    fontSize: 7,
    fontWeight: '800' as const,
    color: '#DC2626',
    marginTop: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  weekBadge: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  detailSection: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.muted,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  detailValue: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noDataText: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 12,
  },
  logTodayButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
  },
  logTodayText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  dueDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 14,
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#BE123C',
  },
});
