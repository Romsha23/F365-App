import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Check, Sparkles, Heart, Sun } from 'lucide-react-native';
import Colors from '../constants/colors';

type DailyStreakBannerProps = {
  consecutiveDays: number;
  totalLogsThisWeek?: number;
  lastLogDate?: string;
  style?: any;
};

const getStreakMessage = (days: number): { message: string; emoji: string } => {
  if (days === 0) return { message: 'Start your wellness journey today', emoji: '🌱' };
  if (days === 1) return { message: 'Great start! Your first log is complete', emoji: '✨' };
  if (days === 2) return { message: '2 days of self-care logged', emoji: '🌟' };
  if (days === 3) return { message: '3 days in a row! You\'re building a habit', emoji: '💫' };
  if (days === 4) return { message: '4 consecutive days of tracking', emoji: '🌸' };
  if (days === 5) return { message: 'You logged 5 days in a row!', emoji: '🎉' };
  if (days === 6) return { message: '6 days strong! Almost a week', emoji: '💪' };
  if (days === 7) return { message: 'A full week of wellness tracking!', emoji: '🏆' };
  if (days <= 14) return { message: `${days} days of consistent self-care`, emoji: '🌺' };
  if (days <= 30) return { message: `${days} days! You're making this a lifestyle`, emoji: '🌻' };
  return { message: `${days} days of dedicated wellness tracking`, emoji: '💜' };
};

const getEncouragementMessage = (days: number): string => {
  if (days === 0) return 'Every journey begins with a single step';
  if (days < 3) return 'Small steps lead to big changes';
  if (days < 7) return 'Consistency is key to understanding your patterns';
  if (days < 14) return 'Your dedication is inspiring';
  if (days < 30) return 'You\'re gaining valuable insights about yourself';
  return 'You\'ve built a meaningful self-care practice';
};

export const DailyStreakBanner: React.FC<DailyStreakBannerProps> = ({
  consecutiveDays,
  totalLogsThisWeek = 0,
  lastLogDate,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const { message, emoji } = getStreakMessage(consecutiveDays);
  const encouragement = getEncouragementMessage(consecutiveDays);
  const isMilestone = [5, 7, 14, 21, 30, 60, 90, 100].includes(consecutiveDays);

  const renderProgressDots = () => {
    const dots = [];
    const maxDots = 7;
    const filledDots = Math.min(consecutiveDays, maxDots);

    for (let i = 0; i < maxDots; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.progressDot,
            i < filledDots && styles.progressDotFilled,
            i === filledDots - 1 && consecutiveDays > 0 && styles.progressDotCurrent,
          ]}
        >
          {i < filledDots && (
            <Check size={8} color={Colors.white} strokeWidth={3} />
          )}
        </View>
      );
    }
    return dots;
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        isMilestone && styles.milestoneContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        style
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {isMilestone ? (
            <Sparkles size={20} color={Colors.gold} />
          ) : consecutiveDays >= 7 ? (
            <Sun size={20} color={Colors.primary} />
          ) : (
            <Heart size={20} color={Colors.primary} />
          )}
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.message, isMilestone && styles.milestoneMessage]}>
            {message}
          </Text>
        </View>
      </View>

      {consecutiveDays > 0 && (
        <>
          <View style={styles.progressContainer}>
            <View style={styles.progressDots}>
              {renderProgressDots()}
            </View>
            {consecutiveDays >= 7 && (
              <Text style={styles.weekIndicator}>
                +{Math.floor(consecutiveDays / 7)} {consecutiveDays >= 14 ? 'weeks' : 'week'}
              </Text>
            )}
          </View>

          <Text style={styles.encouragement}>{encouragement}</Text>
        </>
      )}

      {consecutiveDays === 0 && lastLogDate && (
        <Text style={styles.lastLogText}>
          Last logged: {new Date(lastLogDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      )}
    </Animated.View>
  );
};

export const CompactStreakIndicator: React.FC<{
  days: number;
  showLabel?: boolean;
}> = ({ days, showLabel = true }) => {
  if (days === 0) return null;

  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactIcon}>
        <Check size={12} color={Colors.white} strokeWidth={3} />
      </View>
      {showLabel && (
        <Text style={styles.compactText}>
          {days} {days === 1 ? 'day' : 'days'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  milestoneContainer: {
    backgroundColor: Colors.gold + '10',
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  milestoneMessage: {
    color: Colors.gold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  progressDotCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  encouragement: {
    fontSize: 13,
    color: Colors.subtext,
    marginTop: 10,
    lineHeight: 18,
  },
  lastLogText: {
    fontSize: 13,
    color: Colors.subtext,
    marginTop: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success + '15',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  compactIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
});
