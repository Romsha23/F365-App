import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CravingType } from '../types/cycle';
import Colors from '../constants/colors';

interface CravingsPickerProps {
  selectedCravings: CravingType[];
  onSelectCraving: (craving: CravingType) => void;
}

export const CravingsPicker: React.FC<CravingsPickerProps> = ({
  selectedCravings,
  onSelectCraving,
}) => {
  const cravings: { id: CravingType; label: string }[] = [
    { id: 'sweet', label: 'Sweet' },
    { id: 'salty', label: 'Salty' },
    { id: 'chocolate', label: 'Chocolate' },
    { id: 'carbs', label: 'Carbs' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'spicy', label: 'Spicy' },
    { id: 'fatty', label: 'Fatty' },
    { id: 'caffeine', label: 'Caffeine' },
  ];
  
  const handleCravingPress = (craving: CravingType) => {
    onSelectCraving(craving);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cravings</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cravingsContainer}
      >
        {cravings.map((craving) => (
          <TouchableOpacity
            key={craving.id}
            style={[
              styles.cravingButton,
              selectedCravings.includes(craving.id) && styles.selectedCraving,
            ]}
            onPress={() => handleCravingPress(craving.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cravingText,
                selectedCravings.includes(craving.id) && styles.selectedCravingText,
              ]}
            >
              {craving.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
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
  cravingsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  cravingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCraving: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cravingText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedCravingText: {
    color: Colors.white,
    fontWeight: '500',
  },
});