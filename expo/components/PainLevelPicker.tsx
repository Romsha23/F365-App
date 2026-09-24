import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PainLevel } from '../types/cycle';
import Colors from '../constants/colors';
import { Frown, Meh, Smile } from 'lucide-react-native';

interface PainLevelPickerProps {
  selectedPainLevel: PainLevel;
  onSelectPainLevel: (painLevel: PainLevel) => void;
}

export const PainLevelPicker: React.FC<PainLevelPickerProps> = ({
  selectedPainLevel,
  onSelectPainLevel,
}) => {
  const painLevels: { id: PainLevel; label: string; icon: React.ReactNode; color: string }[] = [
    { 
      id: 'none', 
      label: 'No Pain', 
      icon: <Smile size={28} color={selectedPainLevel === 'none' ? Colors.white : '#4CAF50'} />,
      color: 'rgba(76, 175, 80, 0.12)'
    },
    { 
      id: 'mild', 
      label: 'Mild', 
      icon: <Smile size={28} color={selectedPainLevel === 'mild' ? Colors.white : '#8BC34A'} />,
      color: 'rgba(139, 195, 74, 0.12)'
    },
    { 
      id: 'moderate', 
      label: 'Moderate', 
      icon: <Meh size={28} color={selectedPainLevel === 'moderate' ? Colors.white : '#FFC107'} />,
      color: 'rgba(255, 193, 7, 0.12)'
    },
    { 
      id: 'severe', 
      label: 'Severe', 
      icon: <Frown size={28} color={selectedPainLevel === 'severe' ? Colors.white : '#9333EA'} />,
      color: 'rgba(147, 51, 234, 0.12)'
    },
  ];
  
  const handlePainLevelPress = (painLevel: PainLevel) => {
    onSelectPainLevel(painLevel);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pain Level</Text>
      <View style={styles.painLevelsContainer}>
        {painLevels.map((pain) => (
          <TouchableOpacity
            key={pain.id}
            style={[
              styles.painButton,
              { backgroundColor: pain.color },
              selectedPainLevel === pain.id && styles.selectedPain,
              selectedPainLevel === pain.id && { backgroundColor: getPainColor(pain.id) },
            ]}
            onPress={() => handlePainLevelPress(pain.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              {pain.icon}
            </View>
            <Text
              style={[
                styles.painLabel,
                selectedPainLevel === pain.id && styles.selectedPainLabel,
              ]}
            >
              {pain.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const getPainColor = (painLevel: PainLevel): string => {
  switch (painLevel) {
    case 'none':
      return '#4CAF50';
    case 'mild':
      return '#8BC34A';
    case 'moderate':
      return '#FFC107';
    case 'severe':
      return '#9333EA';
    default:
      return Colors.card;
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.text,
  },
  painLevelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  painButton: {
    width: '23%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedPain: {
    borderColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 8,
  },
  painLabel: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  selectedPainLabel: {
    color: Colors.white,
    fontWeight: 'bold' as const,
  },
});