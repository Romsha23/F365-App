import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import Colors from '../constants/colors';
import { Heart, Sparkles, Check } from 'lucide-react-native';

type StreakCardProps = {
  currentStreak: number;
  longestStreak: number;
  consecutiveDays?: number;
  style?: any;
};

export const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  longestStreak,
  consecutiveDays = 0,
  style,
}) => {
  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Begin your self-care journey';
    if (streak === 1) return 'A wonderful start to understanding yourself';
    if (streak >= 2 && streak < 4) return 'Building awareness, one day at a time';
    if (streak >= 4 && streak < 7) return 'Your consistency is creating insight';
    if (streak >= 7 && streak < 12) return 'A week of meaningful self-reflection';
    return 'Your dedication to self-care is inspiring';
  };

  const getGentleColor = () => Colors.primary;

  const renderProgressIndicator = () => {
    const days = consecutiveDays || currentStreak;
    const maxDots = 7;
    const filledDots = Math.min(days, maxDots);

    return (
      <View style={styles.progressRow}>
        {Array.from({ length: maxDots }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < filledDots && styles.progressDotFilled,
            ]}
          >
            {i < filledDots && (
              <Check size={10} color={Colors.white} strokeWidth={3} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const cardStyle = [styles.container, style];
  
  return (
    <Card style={cardStyle as any}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Heart size={20} color={getGentleColor()} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Your Wellness Journey</Text>
          <Text style={styles.subtitle}>{getStreakMessage(currentStreak)}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        {consecutiveDays > 0 && (
          <View style={styles.dailyStreakSection}>
            <View style={styles.dailyStreakHeader}>
              <Sparkles size={16} color={Colors.gold} />
              <Text style={styles.dailyStreakText}>
                {consecutiveDays} {consecutiveDays === 1 ? 'day' : 'days'} of logging
              </Text>
            </View>
            {renderProgressIndicator()}
          </View>
        )}

        <View style={styles.streakSection}>
          <View style={styles.streakBox}>
            <Text style={[styles.streakNumber, { color: getGentleColor() }]}>
              {currentStreak}
            </Text>
            <Text style={styles.streakLabel}>Cycles Tracked</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.streakBox}>
            <Text style={styles.longestStreakNumber}>{longestStreak}</Text>
            <Text style={styles.streakLabel}>Personal Best</Text>
          </View>
        </View>
        
        {currentStreak === 0 && consecutiveDays === 0 && (
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationText}>
              Every entry helps you understand your body better. Start whenever you&apos;re ready.
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  content: {
    gap: 16,
  },
  dailyStreakSection: {
    backgroundColor: Colors.gold + '10',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dailyStreakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dailyStreakText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressDotFilled: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  streakSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakBox: {
    flex: 1,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: Colors.subtext,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  longestStreakNumber: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  motivationContainer: {
    backgroundColor: Colors.muted,
    padding: 14,
    borderRadius: 10,
  },
  motivationText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
