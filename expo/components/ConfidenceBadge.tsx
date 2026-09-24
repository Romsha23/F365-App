import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react-native';
import Colors from '../constants/colors';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'learning' | 'insufficient';

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  dataPoints?: number;
  minDataPoints?: number;
  showDescription?: boolean;
  style?: any;
};

const getConfidenceConfig = (level: ConfidenceLevel, dataPoints?: number, minDataPoints: number = 14) => {
  switch (level) {
    case 'high':
      return {
        label: 'High confidence',
        description: 'Based on consistent patterns in your data',
        color: Colors.success,
        bgColor: Colors.success + '15',
        borderColor: Colors.success + '30',
        Icon: TrendingUp,
      };
    case 'medium':
      return {
        label: 'Medium confidence',
        description: 'Patterns are emerging, keep tracking for better accuracy',
        color: Colors.gold,
        bgColor: Colors.gold + '15',
        borderColor: Colors.border,
        Icon: Info,
      };
    case 'low':
      return {
        label: 'Still learning your baseline',
        description: `We're building your personalized profile`,
        color: Colors.primary,
        bgColor: Colors.primary + '15',
        borderColor: Colors.primary + '30',
        Icon: HelpCircle,
      };
    case 'learning':
      return {
        label: 'Still learning your baseline',
        description: `${dataPoints || 0} of ${minDataPoints} days tracked`,
        color: Colors.secondary,
        bgColor: Colors.secondary + '15',
        borderColor: Colors.secondary + '30',
        Icon: Info,
      };
    case 'insufficient':
      return {
        label: 'Not enough data yet',
        description: 'Log a few more days to unlock personalized insights',
        color: Colors.textMuted,
        bgColor: Colors.muted,
        borderColor: Colors.border,
        Icon: AlertCircle,
      };
  }
};

export const calculateConfidenceLevel = (
  dataPoints: number,
  minForLow: number = 3,
  minForMedium: number = 14,
  minForHigh: number = 30
): ConfidenceLevel => {
  if (dataPoints < minForLow) return 'insufficient';
  if (dataPoints < minForMedium) return 'learning';
  if (dataPoints < minForHigh) return 'medium';
  return 'high';
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  level,
  dataPoints,
  minDataPoints = 14,
  showDescription = false,
  style,
}) => {
  const config = getConfidenceConfig(level, dataPoints, minDataPoints);
  const { Icon } = config;

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor, borderColor: config.borderColor }, style]}>
      <View style={styles.headerRow}>
        <Icon size={14} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>
      {showDescription && (
        <Text style={styles.description}>{config.description}</Text>
      )}
    </View>
  );
};

export const ConfidenceIndicator: React.FC<{
  confidence: number;
  dataPoints?: number;
  showLabel?: boolean;
  compact?: boolean;
  style?: any;
}> = ({ confidence, dataPoints, showLabel = true, compact = false, style }) => {
  let level: ConfidenceLevel;
  
  if (dataPoints !== undefined && dataPoints < 3) {
    level = 'insufficient';
  } else if (dataPoints !== undefined && dataPoints < 14) {
    level = 'learning';
  } else if (confidence >= 0.75) {
    level = 'high';
  } else if (confidence >= 0.5) {
    level = 'medium';
  } else {
    level = 'low';
  }

  const config = getConfidenceConfig(level, dataPoints);
  const { Icon } = config;

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: config.bgColor }, style]}>
        <Icon size={12} color={config.color} />
        {showLabel && (
          <Text style={[styles.compactLabel, { color: config.color }]}>
            {level === 'high' ? 'High' : level === 'medium' ? 'Medium' : level === 'learning' ? 'Learning' : 'Low'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.indicatorContainer, { borderColor: config.borderColor }, style]}>
      <View style={styles.indicatorHeader}>
        <Icon size={16} color={config.color} />
        <Text style={[styles.indicatorLabel, { color: config.color }]}>{config.label}</Text>
      </View>
      <View style={styles.confidenceBar}>
        <View 
          style={[
            styles.confidenceFill, 
            { 
              width: `${Math.max(10, confidence * 100)}%`,
              backgroundColor: config.color,
            }
          ]} 
        />
      </View>
      <Text style={styles.indicatorDescription}>{config.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  indicatorContainer: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  indicatorLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  confidenceBar: {
    height: 4,
    backgroundColor: Colors.muted,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  indicatorDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
