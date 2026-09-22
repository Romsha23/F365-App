import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DischargeType } from '../types/cycle';
import Colors from '../constants/colors';

interface DischargePickerProps {
  selectedDischarge: DischargeType;
  onSelectDischarge: (discharge: DischargeType) => void;
}

export const DischargePicker: React.FC<DischargePickerProps> = ({
  selectedDischarge,
  onSelectDischarge,
}) => {
  const dischargeTypes: { id: DischargeType; label: string; description: string }[] = [
    { id: 'none', label: 'None', description: 'No noticeable discharge' },
    { id: 'sticky', label: 'Sticky', description: 'Thick, white or yellowish' },
    { id: 'creamy', label: 'Creamy', description: 'Lotion-like consistency' },
    { id: 'watery', label: 'Watery', description: 'Clear and slippery' },
    { id: 'egg_white', label: 'Egg White', description: 'Clear, stretchy, slippery' },
    { id: 'brown', label: 'Brown', description: 'Brown or dark discharge' },
  ];
  
  const handleDischargePress = (discharge: DischargeType) => {
    onSelectDischarge(discharge);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cervical Discharge</Text>
      <View style={styles.dischargeContainer}>
        {dischargeTypes.map((discharge) => (
          <TouchableOpacity
            key={discharge.id}
            style={[
              styles.dischargeButton,
              selectedDischarge === discharge.id && styles.selectedDischarge,
            ]}
            onPress={() => handleDischargePress(discharge.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dischargeLabel,
                selectedDischarge === discharge.id && styles.selectedDischargeLabel,
              ]}
            >
              {discharge.label}
            </Text>
            <Text
              style={[
                styles.dischargeDescription,
                selectedDischarge === discharge.id && styles.selectedDischargeDescription,
              ]}
            >
              {discharge.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  dischargeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dischargeButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDischarge: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dischargeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedDischargeLabel: {
    color: Colors.white,
  },
  dischargeDescription: {
    fontSize: 12,
    color: Colors.subtext,
  },
  selectedDischargeDescription: {
    color: Colors.white,
  },
});