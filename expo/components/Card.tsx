import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = 'default' 
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevatedCard;
      case 'outlined':
        return styles.outlinedCard;
      case 'glass':
        return styles.glassCard;
      default:
        return styles.defaultCard;
    }
  };

  if (variant === 'glass' && Platform.OS !== 'web') {
    return (
      <BlurView intensity={20} tint="dark" style={[styles.card, styles.glassCard, style]}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    backgroundColor: Colors.card,
  },
  defaultCard: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  elevatedCard: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  outlinedCard: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: '#B856D6',
  },
  glassCard: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(21, 21, 30, 0.7)' : 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.5)',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
});