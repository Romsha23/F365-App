import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PredictionData } from '../types/cycle';
import { Card } from './Card';
import { formatShortDate } from '../utils/date-utils';
import Colors from '../constants/colors';
import { Calendar, Droplet, Heart } from 'lucide-react-native';

interface PredictionCardProps {
  predictions: PredictionData;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ predictions }) => {
  // Enhanced validation for predictions
  if (!predictions || typeof predictions !== 'object') {
    console.warn('PredictionCard: Invalid predictions object received:', predictions);
    return null;
  }
  
  // Validate required fields
  const requiredFields = ['nextPeriodStart', 'nextPeriodEnd', 'nextFertileWindowStart', 'nextFertileWindowEnd', 'nextOvulationDate'];
  const missingFields = requiredFields.filter(field => !predictions[field as keyof PredictionData]);
  
  if (missingFields.length > 0) {
    console.warn('PredictionCard: Missing required fields:', missingFields);
    return null;
  }

  const renderConfidenceBar = () => {
    try {
      const confidence = typeof predictions.confidence === 'number' ? predictions.confidence : 0.75;
      const clampedConfidence = Math.min(Math.max(confidence, 0), 1);
      const widthPercentage = clampedConfidence * 100;
    
    return (
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Prediction Confidence</Text>
        <View style={styles.confidenceBarBackground}>
          <View style={[styles.confidenceBar, { width: `${widthPercentage}%` as any }]} />
        </View>
        <Text style={styles.confidenceText}>{Math.round(clampedConfidence * 100)}%</Text>
      </View>
      );
    } catch (error) {
      console.error('Error rendering confidence bar:', error);
      return (
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Prediction Confidence</Text>
          <View style={styles.confidenceBarBackground}>
            <View style={[styles.confidenceBar, { width: '75%' }]} />
          </View>
          <Text style={styles.confidenceText}>75%</Text>
        </View>
      );
    }
  };

  // Safe date formatting function with better error handling
  const safeFormatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      // Validate the date string first
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string in PredictionCard:', dateString);
        return 'Invalid date';
      }
      
      return formatShortDate(dateString);
    } catch (error) {
      console.error('Error formatting date in PredictionCard:', error, dateString);
      return 'Invalid date';
    }
  };
  
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Cycle Predictions</Text>
      
      <View style={styles.predictionRow}>
        <View style={styles.iconContainer}>
          <Droplet size={20} color={Colors.primary} />
        </View>
        <View style={styles.predictionTextContainer}>
          <Text style={styles.predictionLabel}>Next Period</Text>
          <Text style={styles.predictionValue}>
            {safeFormatDate(predictions.nextPeriodStart)} - {safeFormatDate(predictions.nextPeriodEnd)}
          </Text>
        </View>
      </View>
      
      <View style={styles.predictionRow}>
        <View style={styles.iconContainer}>
          <Heart size={20} color={Colors.secondary} />
        </View>
        <View style={styles.predictionTextContainer}>
          <Text style={styles.predictionLabel}>Fertile Window</Text>
          <Text style={styles.predictionValue}>
            {safeFormatDate(predictions.nextFertileWindowStart)} - {safeFormatDate(predictions.nextFertileWindowEnd)}
          </Text>
        </View>
      </View>
      
      <View style={styles.predictionRow}>
        <View style={styles.iconContainer}>
          <Calendar size={20} color={Colors.secondary} />
        </View>
        <View style={styles.predictionTextContainer}>
          <Text style={styles.predictionLabel}>Ovulation Day</Text>
          <Text style={styles.predictionValue}>
            {safeFormatDate(predictions.nextOvulationDate)}
          </Text>
        </View>
      </View>
      
      {renderConfidenceBar()}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionLabel: {
    fontSize: 14,
    color: Colors.subtext,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: 4,
  },
  confidenceBarBackground: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 4,
    textAlign: 'right',
  },
});