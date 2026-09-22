import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Colors from '../constants/colors';
import { fonts } from '../constants/theme';
import { TimelinePrediction } from '../types/mood-prediction';
import { MoodType } from '../types/cycle';
import { Smile, Meh, Frown, AlertCircle, Zap, Cloud } from 'lucide-react-native';

interface MoodTimelineChartProps {
  timeline: TimelinePrediction[];
  onDayPress?: (prediction: TimelinePrediction) => void;
}

const getMoodIcon = (mood: MoodType, size: number = 20) => {
  const iconProps = { size, strokeWidth: 2 };
  
  switch (mood) {
    case 'happy':
      return <Smile {...iconProps} color="#FFD700" />;
    case 'energetic':
      return <Zap {...iconProps} color="#9333EA" />;
    case 'neutral':
      return <Meh {...iconProps} color="#A0A0A0" />;
    case 'sad':
      return <Frown {...iconProps} color="#6495ED" />;
    case 'irritated':
      return <AlertCircle {...iconProps} color="#D946EF" />;
    case 'anxious':
      return <Cloud {...iconProps} color="#9370DB" />;
    default:
      return <Meh {...iconProps} color="#A0A0A0" />;
  }
};

const getMoodColor = (mood: MoodType): string => {
  switch (mood) {
    case 'happy':
      return '#FFD700';
    case 'energetic':
      return '#9333EA';
    case 'neutral':
      return '#A0A0A0';
    case 'sad':
      return '#6495ED';
    case 'irritated':
      return '#D946EF';
    case 'anxious':
      return '#9370DB';
    default:
      return '#A0A0A0';
  }
};

export const MoodTimelineChart: React.FC<MoodTimelineChartProps> = ({ timeline, onDayPress }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48;

  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No mood predictions available</Text>
      </View>
    );
  }

  const labels = timeline.map((_, idx) => `Day ${idx + 1}`);
  const dataPoints = timeline.map(t => t.moodScore);

  const chartData = {
    labels,
    datasets: [
      {
        data: dataPoints,
        color: (opacity = 1) => Colors.primary,
        strokeWidth: 3,
      },
    ],
  };

  const handleDataPointClick = (data: any) => {
    const index = data.index;
    setSelectedIndex(index);
    if (onDayPress && timeline[index]) {
      onDayPress(timeline[index]);
    }
  };

  const selectedPrediction = selectedIndex !== null ? timeline[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>7-Day Mood Forecast</Text>
        <Text style={styles.chartSubtitle}>Tap any point for details</Text>
      </View>

      <LineChart
        data={chartData}
        width={chartWidth}
        height={220}
        chartConfig={{
          backgroundColor: Colors.card,
          backgroundGradientFrom: Colors.card,
          backgroundGradientTo: Colors.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(179, 92, 199, ${opacity})`,
          labelColor: (opacity = 1) => Colors.textMuted,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: Colors.primary,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: Colors.border,
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines
        withVerticalLines={false}
        withHorizontalLines
        withVerticalLabels
        withHorizontalLabels
        fromZero
        segments={5}
        onDataPointClick={handleDataPointClick}
      />

      {selectedPrediction && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <View style={styles.moodIconContainer}>
              {getMoodIcon(selectedPrediction.mood as MoodType, 24)}
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedDate}>
                {new Date(selectedPrediction.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.selectedMood}>{selectedPrediction.mood}</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={[styles.scoreValue, { color: getMoodColor(selectedPrediction.mood as MoodType) }]}>
                {selectedPrediction.moodScore}
              </Text>
            </View>
          </View>
          <View style={styles.confidenceBar}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <View style={styles.confidenceProgress}>
              <View
                style={[
                  styles.confidenceProgressFill,
                  { width: `${selectedPrediction.confidence * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>{Math.round(selectedPrediction.confidence * 100)}%</Text>
          </View>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
          <Text style={styles.legendText}>High Mood (70-100)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#A0A0A0' }]} />
          <Text style={styles.legendText}>Neutral (40-70)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6495ED' }]} />
          <Text style={styles.legendText}>Low Mood (0-40)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: fonts.body.regular,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: fonts.heading.semiBold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  selectedCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedDate: {
    fontSize: 14,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
  },
  selectedMood: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
  scoreValue: {
    fontSize: 24,
    fontFamily: fonts.heading.bold,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontFamily: fonts.body.medium,
    color: Colors.textMuted,
    width: 70,
  },
  confidenceProgress: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: fonts.body.semiBold,
    color: Colors.primary,
    width: 40,
    textAlign: 'right',
  },
  legend: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontFamily: fonts.body.regular,
    color: Colors.textMuted,
  },
});
