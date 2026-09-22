import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { usePregnancyStore } from '../store/pregnancy-store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { Baby, Calendar, Heart, Scale, Stethoscope, Activity, TrendingUp, Bell } from 'lucide-react-native';
import { formatDate } from '../utils/date-utils';

const PREGNANCY_MILESTONES = [
  { week: 12, title: 'First Trimester Complete', description: 'Baby is now a fetus!' },
  { week: 20, title: 'Halfway There!', description: 'You might feel baby\'s movements' },
  { week: 28, title: 'Third Trimester Begins', description: 'Baby can open and close eyes' },
  { week: 37, title: 'Full Term', description: 'Baby is ready to be born' },
];

export default function PregnancyDashboardScreen() {
  const {
    pregnancyProfile,
    getCurrentWeek,
    getDaysUntilDue,
    appointments,
    pregnancyDayLogs,
  } = usePregnancyStore();

  const currentWeek = getCurrentWeek();
  const daysUntilDue = getDaysUntilDue();
  const trimester = currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3;

  useEffect(() => {
    if (!pregnancyProfile) {
      router.replace('/pregnancy-setup' as any);
    }
  }, [pregnancyProfile]);

  if (!pregnancyProfile) {
    return null;
  }

  const getWeekDescription = (week: number) => {
    if (week < 4) return 'Your pregnancy journey begins';
    if (week < 8) return 'Baby\'s major organs are forming';
    if (week < 12) return 'Baby\'s heartbeat can be detected';
    if (week < 16) return 'Baby can make facial expressions';
    if (week < 20) return 'You might feel baby move';
    if (week < 24) return 'Baby can hear your voice';
    if (week < 28) return 'Baby is practicing breathing';
    if (week < 32) return 'Baby is gaining weight rapidly';
    if (week < 36) return 'Baby is almost ready';
    return 'Full term - baby can arrive any day!';
  };

  const getNextAppointment = () => {
    const now = new Date();
    const upcoming = appointments
      .filter(a => new Date(a.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0];
  };

  const getTodayLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return pregnancyDayLogs.find(log => log.date.split('T')[0] === today);
  };

  const getRecentSymptoms = () => {
    const last7Days = pregnancyDayLogs
      .filter(log => {
        const logDate = new Date(log.date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      })
      .flatMap(log => log.symptoms);

    const symptomCounts: Record<string, number> = {};
    last7Days.forEach(symptom => {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    });

    return Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([symptom]) => symptom);
  };

  const getNextMilestone = () => {
    return PREGNANCY_MILESTONES.find(m => m.week > currentWeek);
  };

  const nextAppointment = getNextAppointment();
  const todayLog = getTodayLog();
  const recentSymptoms = getRecentSymptoms();
  const nextMilestone = getNextMilestone();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pregnancy Dashboard',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.weekText}>Week {currentWeek} • Trimester {trimester}</Text>
          </View>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => router.push('/pregnancy-calendar' as any)}
          >
            <Calendar size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Baby size={32} color={Colors.primary} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Your Pregnancy Journey</Text>
              <Text style={styles.progressWeek}>Week {currentWeek} of 40</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(currentWeek / 40) * 100}%` }]}
            />
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{daysUntilDue}</Text>
              <Text style={styles.progressStatLabel}>Days to go</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{40 - currentWeek}</Text>
              <Text style={styles.progressStatLabel}>Weeks left</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{Math.round((currentWeek / 40) * 100)}%</Text>
              <Text style={styles.progressStatLabel}>Complete</Text>
            </View>
          </View>

          <Text style={styles.weekDescription}>{getWeekDescription(currentWeek)}</Text>
        </Card>

        {!todayLog && (
          <Card style={styles.logCard}>
            <View style={styles.logHeader}>
              <Activity size={24} color={Colors.primary} />
              <Text style={styles.logTitle}>Log Today</Text>
            </View>
            <Text style={styles.logDescription}>
              Track your symptoms, mood, and baby kicks
            </Text>
            <Button
              title="Add Today's Log"
              onPress={() => router.push('/pregnancy-log' as any)}
              style={styles.logButton}
            />
          </Card>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/kick-counter' as any)}
          >
            <Heart size={28} color="#EC4899" />
            <Text style={styles.quickActionText}>Kick Counter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/contraction-timer' as any)}
          >
            <Bell size={28} color="#F59E0B" />
            <Text style={styles.quickActionText}>Contractions</Text>
          </TouchableOpacity>
        </View>

        {nextAppointment && (
          <Card style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Stethoscope size={24} color={Colors.primary} />
              <Text style={styles.appointmentTitle}>Next Appointment</Text>
            </View>
            <Text style={styles.appointmentDate}>
              {formatDate(new Date(nextAppointment.date))}
            </Text>
            <Text style={styles.appointmentType}>{nextAppointment.type}</Text>
            {nextAppointment.provider && (
              <Text style={styles.appointmentProvider}>{nextAppointment.provider}</Text>
            )}
            <Button
              title="View Details"
              variant="outline"
              onPress={() => (router.push as any)(`/appointment/${nextAppointment.id}`)}
              style={styles.appointmentButton}
            />
          </Card>
        )}

        {recentSymptoms.length > 0 && (
          <Card style={styles.symptomsCard}>
            <View style={styles.symptomsHeader}>
              <Scale size={24} color={Colors.primary} />
              <Text style={styles.symptomsTitle}>Recent Symptoms</Text>
            </View>
            <View style={styles.symptomsList}>
              {recentSymptoms.map((symptom, index) => (
                <View key={index} style={styles.symptomChip}>
                  <Text style={styles.symptomText}>
                    {symptom.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {nextMilestone && (
          <Card style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <TrendingUp size={24} color="#10B981" />
              <Text style={styles.milestoneTitle}>Next Milestone</Text>
            </View>
            <Text style={styles.milestoneWeek}>Week {nextMilestone.week}</Text>
            <Text style={styles.milestoneDescription}>{nextMilestone.title}</Text>
            <Text style={styles.milestoneSubtext}>{nextMilestone.description}</Text>
          </Card>
        )}

        <View style={styles.moreActions}>
          <Button
            title="View All Appointments"
            variant="outline"
            onPress={() => router.push('/pregnancy-appointments' as any)}
            style={styles.moreButton}
          />
          <Button
            title="Weekly Development"
            variant="outline"
            onPress={() => router.push('/baby-development' as any)}
            style={styles.moreButton}
          />
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: Colors.subtext,
  },
  weekText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressCard: {
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressInfo: {
    marginLeft: 12,
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  progressWeek: {
    fontSize: 14,
    color: Colors.subtext,
    marginTop: 2,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  progressStatLabel: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 4,
  },
  weekDescription: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logCard: {
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  logDescription: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  logButton: {
    minWidth: 150,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  appointmentCard: {
    padding: 20,
    marginBottom: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: Colors.subtext,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  appointmentProvider: {
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: 12,
  },
  appointmentButton: {
    marginTop: 8,
  },
  symptomsCard: {
    padding: 20,
    marginBottom: 16,
  },
  symptomsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  symptomsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  symptomText: {
    fontSize: 13,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  milestoneCard: {
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1530',
    marginLeft: 8,
  },
  milestoneWeek: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1530',
    marginBottom: 4,
  },
  milestoneSubtext: {
    fontSize: 14,
    color: '#3A3452',
  },
  moreActions: {
    gap: 12,
  },
  moreButton: {
    marginBottom: 8,
  },
});
