import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Colors from '../constants/colors';
import { Smile, Frown, Heart, Activity } from 'lucide-react-native';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isPredicted: boolean;
  dayData?: {
    mood?: string;
    symptoms?: string[];
    flow?: string;
  };
  onPress: (date: Date) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  isPeriod,
  isFertile,
  isOvulation,
  isPredicted,
  dayData,
  onPress,
}) => {
  const handlePress = () => {
    try {
      if (date && !isNaN(date.getTime())) {
        onPress(date);
      }
    } catch (error) {
      console.error('Error handling calendar day press:', error);
    }
  };

  const getDayStyle = () => {
    if (isPeriod) return isPredicted ? styles.predictedPeriodDay : styles.periodDay;
    if (isOvulation) return styles.ovulationDay;
    if (isFertile) return styles.fertileDay;
    if (isToday) return styles.today;
    return isCurrentMonth ? styles.currentMonth : styles.otherMonth;
  };

  const getDayTextStyle = () => {
    if (isToday) return styles.todayText;
    if (!isCurrentMonth) return styles.otherMonthText;
    if (isPeriod || isOvulation) return styles.highlightedDayText;
    return styles.dayText;
  };

  const getDayNumber = () => {
    try {
      if (!date || isNaN(date.getTime())) return '?';
      return date.getDate().toString();
    } catch {
      return '?';
    }
  };

  const getMoodIcon = () => {
    if (!dayData?.mood) return null;
    const iconSize = 10;
    const iconColor = Colors.white;
    switch (dayData.mood) {
      case 'happy':
      case 'energetic':
        return <Smile size={iconSize} color={iconColor} />;
      case 'sad':
      case 'irritated':
      case 'anxious':
        return <Frown size={iconSize} color={iconColor} />;
      case 'emotional':
        return <Heart size={iconSize} color={iconColor} />;
      default:
        return <Activity size={iconSize} color={iconColor} />;
    }
  };

  const hasSymptoms = dayData?.symptoms && dayData.symptoms.length > 0;
  const hasMood = dayData?.mood !== undefined;

  return (
    <View style={styles.cell}>
      <TouchableOpacity
        style={[styles.dayContainer, getDayStyle()]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayText, getDayTextStyle()]}>
          {getDayNumber()}
        </Text>
        <View style={styles.indicatorsRow}>
          {isPredicted && <View style={styles.predictedIndicator} />}
          {hasMood && <View style={styles.moodIconContainer}>{getMoodIcon()}</View>}
          {hasSymptoms && <View style={styles.symptomIndicator} />}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Outer cell takes exactly 1/7 of the row width
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  // Inner circle — fixed size, centred inside the cell
  dayContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 13,
    color: Colors.text,
  },
  currentMonth: {
    backgroundColor: 'transparent',
  },
  otherMonth: {
    backgroundColor: 'transparent',
  },
  otherMonthText: {
    color: Colors.inactive,
  },
  today: {
    backgroundColor: Colors.secondary,
  },
  todayText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  highlightedDayText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  periodDay: {
    backgroundColor: Colors.error,
  },
  predictedPeriodDay: {
    backgroundColor: Colors.accent,
  },
  fertileDay: {
    backgroundColor: Colors.success,
    opacity: 0.7,
  },
  ovulationDay: {
    backgroundColor: Colors.secondary,
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  predictedIndicator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.white,
    marginHorizontal: 1,
  },
  moodIconContainer: {
    marginHorizontal: 1,
  },
  symptomIndicator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.warning,
    marginHorizontal: 1,
  },
});
