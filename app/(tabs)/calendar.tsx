import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCycleStore } from '../../store/cycle-store';
import { useUserStore } from '../../store/user-store';
import { usePregnancyStore } from '../../store/pregnancy-store';
import { CalendarDay } from '../../components/CalendarDay';
import { Card } from '../../components/Card';
import Colors from '../../constants/colors';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import * as DateUtils from '../../utils/date-utils';
import { usePartnerSharingStore } from '../../store/partner-sharing-store';

const PregnancyCalendarView = () => {
  const { pregnancyProfile, getCurrentWeek, appointments, pregnancyDayLogs } = usePregnancyStore();
  const currentWeek = getCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const MILESTONES = [
    { week: 4, title: 'Implantation', description: 'Baby implants in the uterine wall', color: '#EC4899' },
    { week: 8, title: 'Heartbeat', description: "Baby's heart begins to beat", color: '#EF4444' },
    { week: 12, title: 'First Trimester Done', description: 'Baby is now a fetus!', color: '#F59E0B' },
    { week: 16, title: 'Gender Reveal', description: "Baby's gender may be visible on ultrasound", color: '#8B5CF6' },
    { week: 20, title: 'Halfway!', description: "You may feel baby's first movements", color: '#10B981' },
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
    return pregnancyDayLogs.filter(log => { const d = new Date(log.date); return d >= weekStart && d < weekEnd; });
  };
  const weekLogs = getWeekLogs(selectedWeek);
  const upcomingAppointments = appointments.filter(a => new Date(a.date) > new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
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
            const isPast = week < currentWeek; const isCurrent = week === currentWeek; const isSelected = week === selectedWeek;
            const hasMilestone = MILESTONES.some(m => m.week === week);
            return (
              <TouchableOpacity key={week} style={[pregCalStyles.weekChip, isPast && pregCalStyles.weekChipPast, isCurrent && pregCalStyles.weekChipCurrent, isSelected && pregCalStyles.weekChipSelected]} onPress={() => setSelectedWeek(week)}>
                <Text style={[pregCalStyles.weekChipText, isPast && pregCalStyles.weekChipTextPast, (isCurrent || isSelected) && pregCalStyles.weekChipTextActive]}>{week}</Text>
                {hasMilestone && <View style={pregCalStyles.milestoneDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={pregCalStyles.sectionTitle}>Milestones</Text>
        {MILESTONES.filter(m => m.week >= selectedWeek - 2 && m.week <= selectedWeek + 6).map(milestone => (
          <View key={milestone.week} style={[pregCalStyles.milestoneCard, milestone.week <= currentWeek && pregCalStyles.milestoneCardDone, { borderLeftColor: milestone.color }]}>
            <View style={pregCalStyles.milestoneHeader}>
              <View style={[pregCalStyles.milestoneWeekBadge, { backgroundColor: milestone.color + '20' }]}><Text style={[pregCalStyles.milestoneWeekText, { color: milestone.color }]}>Wk {milestone.week}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}><Text style={pregCalStyles.milestoneTitle}>{milestone.title}</Text><Text style={pregCalStyles.milestoneDesc}>{milestone.description}</Text></View>
              {milestone.week <= currentWeek && <View style={pregCalStyles.checkBadge}><Text style={pregCalStyles.checkText}>✓</Text></View>}
            </View>
          </View>
        ))}
        {upcomingAppointments.length > 0 && (<>
          <Text style={pregCalStyles.sectionTitle}>Upcoming Appointments</Text>
          {upcomingAppointments.map(apt => (
            <TouchableOpacity key={apt.id} style={pregCalStyles.aptCard} onPress={() => router.push('/pregnancy-appointments' as any)} activeOpacity={0.85}>
              <Text style={pregCalStyles.aptType}>{apt.type}</Text>
              <Text style={pregCalStyles.aptDate}>{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              {apt.provider && <Text style={pregCalStyles.aptProvider}>{apt.provider}</Text>}
            </TouchableOpacity>
          ))}
        </>)}
        {weekLogs.length > 0 && (<>
          <Text style={pregCalStyles.sectionTitle}>Week {selectedWeek} Logs</Text>
          {weekLogs.map((log, idx) => (
            <View key={idx} style={pregCalStyles.logCard}>
              <Text style={pregCalStyles.logDate}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              {log.symptoms.length > 0 && (<View style={pregCalStyles.logSymptoms}>{log.symptoms.slice(0, 4).map((s: string, i: number) => (<View key={i} style={pregCalStyles.logSymptomChip}><Text style={pregCalStyles.logSymptomText}>{s.replace(/_/g, ' ')}</Text></View>))}</View>)}
            </View>
          ))}
        </>)}
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

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYearNum - 2 + i).toString());

  useEffect(() => {
    try { setCalendarDays(DateUtils.getCalendarDays(currentYear, currentMonth)); }
    catch { setCalendarDays(generateCalendarDays(currentYear, currentMonth)); }
  }, [currentMonth, currentYear]);

  const generateCalendarDays = (year: number, month: number): Date[] => {
    try {
      const firstDay = new Date(year, month, 1);
      const dow = firstDay.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: Date[] = [];
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
      for (let i = daysInPrev - dow + 1; i <= daysInPrev; i++) days.push(new Date(prevYear, prevMonth, i));
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const needed = 42 - days.length;
      for (let i = 1; i <= needed; i++) days.push(new Date(nextYear, nextMonth, i));
      return days;
    } catch { return []; }
  };

  useEffect(() => { updateSelectedDayData(); }, [selectedDate, cycles]); // eslint-disable-line

  const updateSelectedDayData = () => {
    if (!Array.isArray(cycles)) { setSelectedDayData(null); return; }
    const ds = selectedDate.toISOString().split('T')[0];
    for (const cycle of cycles) {
      if (!cycle?.days) continue;
      const d = cycle.days.find((day: any) => day?.date?.split('T')[0] === ds);
      if (d) { setSelectedDayData({ ...d, cycleId: cycle.id }); return; }
    }
    setSelectedDayData(null);
  };

  const handlePrevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const handleNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };
  const handleDayPress = (date: Date) => setSelectedDate(date);

  const handleAddLog = () => {
    if (isViewer) { Alert.alert('Read-only access', 'Your partner access is view-only.'); return; }
    const today = new Date(); today.setHours(23, 59, 59, 999);
    if (selectedDate > today) { Alert.alert('Future Date', 'You can only log entries for today or past dates.'); return; }
    router.push({ pathname: '/log-entry', params: { date: selectedDate.toISOString() } } as any);
  };

  const handleEditLog = () => {
    if (isViewer) { Alert.alert('Read-only access', 'Your partner access is view-only.'); return; }
    const today = new Date(); today.setHours(23, 59, 59, 999);
    if (selectedDate > today) { Alert.alert('Future Date', 'You can only log entries for today or past dates.'); return; }
    router.push({ pathname: '/log-entry', params: { date: selectedDate.toISOString(), cycleId: selectedDayData?.cycleId } } as any);
  };

  const handleMonthSelect = (i: number) => { setCurrentMonth(i); setShowMonthYearModal(false); };
  const handleYearSelect = (y: string) => { setCurrentYear(parseInt(y)); setShowMonthYearModal(false); };

  const getFlowStyle = (flow: string) => {
    switch (flow) { case 'spotting': return styles.flowSpotting; case 'light': return styles.flowLight; case 'medium': return styles.flowMedium; case 'heavy': return styles.flowHeavy; default: return {}; }
  };

  if (pregnancyMode === 'pregnant') return <PregnancyCalendarView />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Calendar', headerRight: () => (<TouchableOpacity style={styles.headerBtn} onPress={handleAddLog}><Plus size={24} color={Colors.primary} /></TouchableOpacity>) }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Calendar card */}
        <View style={styles.calCard}>
          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.monthPill} onPress={() => setShowMonthYearModal(true)} activeOpacity={0.75}>
              <Text style={styles.monthPillText}>{monthNames[currentMonth]} {currentYear}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronRight size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekRow}>
            {['S','M','T','W','T','F','S'].map((d, i) => <Text key={i} style={styles.weekLabel}>{d}</Text>)}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isToday = DateUtils.isSameDay(date, new Date());
              let isPeriod = false, isFertile = false, isOvulation = false, isPredicted = false;
              let dayData: any = undefined;
              try {
                const pa = predictions ? [predictions] : [];
                const s = DateUtils.getCycleDayStatus(date, cycles, pa);
                isPeriod = s.isPeriod; isFertile = s.isFertile; isOvulation = s.isOvulation; isPredicted = s.isPredicted;
                const ds = date.toISOString().split('T')[0];
                for (const cycle of cycles) {
                  if (!cycle?.days) continue;
                  const f = cycle.days.find((day: any) => day?.date?.split('T')[0] === ds);
                  if (f) { dayData = { mood: f.mood, symptoms: f.symptoms || f.symptomsWithIntensity?.map((s: any) => s.id), flow: f.flow }; break; }
                }
              } catch {}
              return <CalendarDay key={index} date={date} isCurrentMonth={isCurrentMonth} isToday={isToday} isPeriod={isPeriod} isFertile={isFertile} isOvulation={isOvulation} isPredicted={isPredicted} dayData={dayData} onPress={handleDayPress} />;
            })}
          </View>
        </View>

        {/* Month/Year modal */}
        <Modal visible={showMonthYearModal} transparent animationType="fade" onRequestClose={() => setShowMonthYearModal(false)}>
          <TouchableWithoutFeedback onPress={() => setShowMonthYearModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Month & Year</Text>
                  <View style={styles.monthsGrid}>
                    {monthNames.map((m, i) => (
                      <TouchableOpacity key={m} style={[styles.monthItem, currentMonth === i && styles.monthItemSel]} onPress={() => handleMonthSelect(i)}>
                        <Text style={[styles.monthItemTxt, currentMonth === i && styles.monthItemTxtSel]}>{m.substring(0, 3)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.yearsRow}>
                    {years.map(y => (
                      <TouchableOpacity key={y} style={[styles.yearItem, currentYear === parseInt(y) && styles.yearItemSel]} onPress={() => handleYearSelect(y)}>
                        <Text style={[styles.yearItemTxt, currentYear === parseInt(y) && styles.yearItemTxtSel]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowMonthYearModal(false)}>
                    <Text style={styles.modalDoneTxt}>Done</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Legend */}
        <View style={styles.legendRow}>
          {[
            { color: Colors.error, label: 'Period' },
            { color: Colors.success, label: 'Fertile Window' },
            { color: Colors.secondary, label: 'Ovulation' },
            { color: '#10B981', label: 'Predicted' },
          ].map(({ color, label }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendTxt}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Date heading */}
        <Text style={styles.dateHeading}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Day info */}
        {selectedDayData ? (
          <Card style={styles.dayCard}>
            <View style={styles.dayCardHeader}>
              <Text style={styles.dayCardTitle}>Day Log</Text>
              <TouchableOpacity onPress={handleEditLog}><Text style={styles.editBtn}>Edit</Text></TouchableOpacity>
            </View>
            {typeof selectedDayData.flow === 'string' && selectedDayData.flow !== 'none' && selectedDayData.flow.length > 0 && (
              <View style={styles.dataRow}><Text style={styles.dataLabel}>Flow:</Text><View style={[styles.flowDot, getFlowStyle(selectedDayData.flow)]} /><Text style={styles.dataVal}>{String(selectedDayData.flow)}</Text></View>
            )}
            {typeof selectedDayData.mood === 'string' && selectedDayData.mood.length > 0 && (
              <View style={styles.dataRow}><Text style={styles.dataLabel}>Mood:</Text><Text style={styles.dataVal}>{String(selectedDayData.mood)}</Text></View>
            )}
            {Array.isArray(selectedDayData.symptoms) && selectedDayData.symptoms.length > 0 && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Symptoms:</Text>
                <View style={styles.symptomsWrap}>
                  {selectedDayData.symptoms.map((s: string, i: number) => (
                    <View key={i} style={styles.symptomChip}><Text style={styles.symptomTxt}>{String(s).split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Text></View>
                  ))}
                </View>
              </View>
            )}
            {typeof selectedDayData.notes === 'string' && selectedDayData.notes.length > 0 && (
              <View style={styles.notesWrap}><Text style={styles.dataLabel}>Notes:</Text><Text style={styles.notesTxt}>{String(selectedDayData.notes)}</Text></View>
            )}
          </Card>
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataTxt}>No data for this day</Text>
            <TouchableOpacity style={styles.addLogBtn} onPress={handleAddLog} activeOpacity={0.85}>
              <Text style={styles.addLogTxt}>Add Log</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
  web: { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerBtn: { marginRight: 16 },

  // Calendar card
  calCard: { backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 10, paddingTop: 16, paddingBottom: 8, marginBottom: 14, ...shadow },

  // Month nav
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 2 },
  monthPill: { flex: 1, marginHorizontal: 10, backgroundColor: Colors.muted, borderRadius: 20, paddingVertical: 7, alignItems: 'center' },
  monthPillText: { fontSize: 15, fontWeight: '700', color: Colors.text },

  // Weekday row
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#A0A0B0' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  // Legend
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, columnGap: 12, marginBottom: 14, paddingHorizontal: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendTxt: { fontSize: 12, color: Colors.subtext },

  // Date heading
  dateHeading: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 12 },

  // No-data card
  noDataCard: { backgroundColor: Colors.card, borderRadius: 16, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', ...shadow },
  noDataTxt: { fontSize: 15, color: Colors.subtext, marginBottom: 20 },
  addLogBtn: { backgroundColor: '#E879A0', borderRadius: 30, paddingVertical: 13, paddingHorizontal: 48, alignItems: 'center', minWidth: 160 },
  addLogTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Day-data card
  dayCard: { borderRadius: 16, padding: 16 },
  dayCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayCardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  editBtn: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  dataRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  dataLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, width: 80 },
  dataVal: { fontSize: 14, color: Colors.text, flex: 1 },
  flowDot: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  flowSpotting: { backgroundColor: '#F5F0FF' },
  flowLight: { backgroundColor: '#EDE9FE' },
  flowMedium: { backgroundColor: '#DDD6FE' },
  flowHeavy: { backgroundColor: '#C4B5FD' },
  symptomsWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  symptomChip: { backgroundColor: Colors.muted, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginRight: 5, marginBottom: 5 },
  symptomTxt: { fontSize: 12, color: Colors.text },
  notesWrap: { marginTop: 6 },
  notesTxt: { fontSize: 14, color: Colors.text, marginTop: 4, fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: Colors.background, borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 16, textAlign: 'center' },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  monthItem: { width: '30%', padding: 10, borderRadius: 8, backgroundColor: Colors.card, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  monthItemSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthItemTxt: { fontSize: 13, color: Colors.text },
  monthItemTxtSel: { color: '#fff', fontWeight: '700' },
  yearsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  yearItem: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  yearItemSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearItemTxt: { fontSize: 14, color: Colors.text },
  yearItemTxtSel: { color: '#fff', fontWeight: '700' },
  modalDoneBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 13, alignItems: 'center' },
  modalDoneTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

const pregCalStyles = StyleSheet.create({
  trimesterHeader: { marginBottom: 16 },
  trimesterLabel: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  weekRangeLabel: { fontSize: 14, color: Colors.subtext, marginTop: 4 },
  weekStrip: { paddingBottom: 16, paddingHorizontal: 4, gap: 6 },
  weekChip: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  weekChipPast: { backgroundColor: '#FCE7F3', borderColor: '#FBCFE8' },
  weekChipCurrent: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
  weekChipSelected: { backgroundColor: '#BE185D', borderColor: '#BE185D' },
  weekChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  weekChipTextPast: { color: '#9D174D' },
  weekChipTextActive: { color: Colors.white },
  milestoneDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EC4899', position: 'absolute', bottom: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' as const, color: Colors.text, marginTop: 8, marginBottom: 12 },
  milestoneCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: Colors.border },
  milestoneCardDone: { opacity: 0.7 },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center' },
  milestoneWeekBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  milestoneWeekText: { fontSize: 12, fontWeight: '700' as const },
  milestoneTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  milestoneDesc: { fontSize: 13, color: Colors.subtext, marginTop: 2 },
  checkBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  checkText: { color: Colors.white, fontSize: 14, fontWeight: 'bold' as const },
  aptCard: { backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#D1FAE5' },
  aptType: { fontSize: 15, fontWeight: '600' as const, color: '#065F46', textTransform: 'capitalize' },
  aptDate: { fontSize: 13, color: '#047857', marginTop: 4 },
  aptProvider: { fontSize: 12, color: '#059669', marginTop: 2 },
  logCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  logDate: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  logSymptoms: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  logSymptomChip: { backgroundColor: '#FCE7F3', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  logSymptomText: { fontSize: 12, color: '#9D174D', textTransform: 'capitalize' },
});