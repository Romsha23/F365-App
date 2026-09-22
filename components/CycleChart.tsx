import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CycleData } from '../types/cycle';
import Colors from '../constants/colors';
import { getDaysBetween } from '../utils/date-utils';

interface CycleChartProps {
  cycles: CycleData[];
}

export const CycleChart: React.FC<CycleChartProps> = ({ cycles }) => {
  const { width } = Dimensions.get('window');
  const chartWidth = width - 64; // Accounting for padding
  
  // Calculate cycle lengths
  const cycleLengths = [];
  
  if (cycles && Array.isArray(cycles)) {
    for (const cycle of cycles) {
      if (!cycle) continue;
      
      try {
        let length = 0;
        
        if (cycle.endDate) {
          length = getDaysBetween(cycle.startDate, cycle.endDate);
        } else if (cycle.days && Array.isArray(cycle.days) && cycle.days.length > 0) {
          length = cycle.days.length;
        }
            
        if (length > 0 && cycle.startDate) {
          cycleLengths.push({
            id: cycle.id,
            length,
            startDate: new Date(cycle.startDate),
          });
        }
      } catch (error) {
        console.error('Error processing cycle:', error);
      }
    }
  }
  
  // Sort by date
  cycleLengths.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  
  if (cycleLengths.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Not enough cycle data to display chart</Text>
      </View>
    );
  }
  
  const maxLength = Math.max(...cycleLengths.map(c => c.length), 35);
  const barWidth = Math.min(chartWidth / (cycleLengths.length * 2), 30);
  
  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{maxLength}</Text>
          <Text style={styles.axisLabel}>{Math.round(maxLength / 2)}</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>
        
        {/* Chart area */}
        <View style={styles.chart}>
          {/* Horizontal grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: '50%' }]} />
          <View style={[styles.gridLine, { bottom: 0 }]} />
          
          {/* Bars */}
          <View style={styles.barsContainer}>
            {cycleLengths.map((cycle, index) => {
              const barHeight = (cycle.length / maxLength) * 180; // 180 is the chart height
              
              return (
                <View key={cycle.id || index} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight, 
                        width: barWidth,
                        backgroundColor: Colors.primary,
                      }
                    ]} 
                  />
                  <Text style={styles.barLabel}>
                    {cycle.length}d
                  </Text>
                  <Text style={styles.dateLabel}>
                    {cycle.startDate.toLocaleDateString(undefined, { month: 'short' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      
      <Text style={styles.chartLabel}>Cycle Length (days)</Text>
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
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 16,
  },
  yAxis: {
    width: 30,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  axisLabel: {
    fontSize: 10,
    color: Colors.subtext,
  },
  chart: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    paddingTop: 10,
    paddingBottom: 30,
    justifyContent: 'space-around',
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: Colors.subtext,
    marginTop: 2,
    position: 'absolute',
    bottom: -20,
  },
  chartLabel: {
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
  },
});