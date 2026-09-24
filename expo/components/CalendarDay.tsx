import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Colors from '../constants/colors';

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
  date, isCurrentMonth, isToday, isPeriod, isFertile, isOvulation, isPredicted, dayData, onPress,
}) => {
  const handlePress = () => {
    try {
      if (date && !isNaN(date.getTime())) onPress(date);
    } catch (e) { console.error(e); }
  };

  const getDayNumber = () => {
    try {
      if (!date || isNaN(date.getTime())) return '?';
      return date.getDate().toString();
    } catch { return '?'; }
  };

  const getCircleBg = (): string | undefined => {
    if (isPeriod && !isPredicted) return Colors.error;
    if (isPeriod && isPredicted) return '#F9A8D4';
    if (isOvulation) return Colors.secondary;
    if (isFertile) return Colors.success;
    if (isToday) return Colors.secondary;
    return undefined;
  };

  const circleBg = getCircleBg();
  const hasCircle = !!circleBg;

  const getTextColor = (): string => {
    if (hasCircle) return '#FFFFFF';
    if (!isCurrentMonth) return '#C4B5D1';
    return Colors.text;
  };

  const hasDot = !!(dayData?.symptoms && dayData.symptoms.length > 0) || !!dayData?.mood;

  return (
    <TouchableOpacity style={styles.cell} onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.circle, hasCircle && { backgroundColor: circleBg }]}>
        <Text style={[styles.dayText, { color: getTextColor() }, isToday && !hasCircle && styles.todayText]}>
          {getDayNumber()}
        </Text>
      </View>
      {hasDot ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    width: '14.2857%' as any,
    alignItems: 'center',
    paddingVertical: 3,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text,
  },
  todayText: {
    fontWeight: '700',
    color: Colors.secondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
});