import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CycleData, MoodType } from '../types/cycle';
import Colors from '../constants/colors';

interface MoodChartProps {
  cycles: CycleData[];
}

export const MoodChart: React.FC<MoodChartProps> = ({ cycles }) => {
  // Extract all mood data from cycles
  const moodData: Record<string, number> = {
    happy: 0,
    neutral: 0,
    sad: 0,
    irritated: 0,
    anxious: 0,
    energetic: 0,
    tired: 0,
  };
  
  let totalMoodEntries = 0;
  
  // Count occurrences of each mood
  if (cycles && Array.isArray(cycles)) {
    cycles.forEach(cycle => {
      if (!cycle || !cycle.days || !Array.isArray(cycle.days)) return;
      
      cycle.days.forEach(day => {
        if (day && day.mood) {
          // Safely access mood data
          if (moodData[day.mood] !== undefined) {
            moodData[day.mood]++;
            totalMoodEntries++;
          }
        }
      });
    });
  }
  
  if (totalMoodEntries === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Not enough mood data to display chart</Text>
      </View>
    );
  }
  
  // Convert to percentage and sort by frequency
  const moodPercentages = Object.entries(moodData)
    .map(([mood, count]) => ({
      mood,
      percentage: (count / totalMoodEntries) * 100,
      count,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.percentage - a.percentage);
  
  const getMoodColor = (mood: string): string => {
    switch (mood) {
      case 'happy':
        return '#FFD700'; // Gold
      case 'neutral':
        return '#A0A0A0'; // Gray
      case 'sad':
        return '#6495ED'; // Blue
      case 'irritated':
        return '#9333EA'; // Purple
      case 'anxious':
        return '#9370DB'; // Purple
      case 'energetic':
        return '#32CD32'; // Lime Green
      case 'tired':
        return '#8B4513'; // Brown
      default:
        return Colors.primary;
    }
  };
  
  return (
    <View style={styles.container}>
      {moodPercentages.map(({ mood, percentage, count }) => (
        <View key={mood} style={styles.moodRow}>
          <Text style={styles.moodLabel}>
            {mood.charAt(0).toUpperCase() + mood.slice(1)}
          </Text>
          <View style={styles.barContainer}>
            <View 
              style={[
                styles.bar, 
                { 
                  width: `${percentage}%`,
                  backgroundColor: getMoodColor(mood),
                }
              ]} 
            />
          </View>
          <Text style={styles.percentageLabel}>{Math.round(percentage)}%</Text>
        </View>
      ))}
      
      <Text style={styles.totalEntries}>
        Based on {totalMoodEntries} mood entries
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodLabel: {
    width: 70,
    fontSize: 12,
    color: Colors.text,
    marginRight: 8,
  },
  barContainer: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 8,
  },
  percentageLabel: {
    width: 40,
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'right',
    marginLeft: 8,
  },
  totalEntries: {
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
    marginTop: 16,
  },
});