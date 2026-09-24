import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InsightType } from '../types/cycle';
import { Card } from './Card';
import { formatDate } from '../utils/date-utils';
import Colors from '../constants/colors';
import { AlertCircle, Calendar, Lightbulb, Heart } from 'lucide-react-native';

interface InsightCardProps {
  insight: InsightType;
  onPress: (insight: InsightType) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onPress }) => {
  // Enhanced null checking
  if (!insight || typeof insight !== 'object') {
    console.warn('InsightCard: Invalid insight object received');
    return null;
  }
  
  const handlePress = () => {
    if (onPress && typeof onPress === 'function') {
      onPress(insight);
    }
  };
  
  const getIcon = () => {
    // Safe type checking with fallback
    const insightType = insight?.type || 'tip';
    
    switch (insightType) {
      case 'health':
        return <Heart size={24} color={Colors.primary} />;
      case 'prediction':
        return <Calendar size={24} color={Colors.secondary} />;
      case 'tip':
        return <Lightbulb size={24} color="#FFC107" />;
      case 'alert':
        return <AlertCircle size={24} color={Colors.error} />;
      default:
        return <Lightbulb size={24} color={Colors.primary} />;
    }
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Card style={[styles.card, insight.read ? styles.readCard : undefined] as any}>
        <View style={styles.header}>
          {getIcon()}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{insight?.title || 'Insight'}</Text>
            <Text style={styles.date}>
              {insight?.date ? (() => {
                try {
                  return formatDate(new Date(insight.date));
                } catch (error) {
                  console.warn('Invalid date in insight:', insight.date);
                  return formatDate(new Date());
                }
              })() : formatDate(new Date())}
            </Text>
          </View>
          {!insight?.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.description}>{insight?.description || 'No description available'}</Text>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  readCard: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  date: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});