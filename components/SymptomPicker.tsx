import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { SymptomType, SymptomWithIntensity, CustomSymptom } from '../types/cycle';
import Colors from '../constants/colors';
import { Plus, X } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

interface SymptomPickerProps {
  selectedSymptoms: SymptomWithIntensity[];
  customSymptoms: CustomSymptom[];
  onSelectSymptom: (symptomId: string, intensity: number, isCustom: boolean) => void;
  onAddCustomSymptom: (name: string) => void;
  onRemoveSymptom: (symptomId: string) => void;
}

export const SymptomPicker: React.FC<SymptomPickerProps> = ({
  selectedSymptoms,
  customSymptoms,
  onSelectSymptom,
  onAddCustomSymptom,
  onRemoveSymptom,
}) => {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customSymptomName, setCustomSymptomName] = useState('');
  const [editingSymptomId, setEditingSymptomId] = useState<string | null>(null);
  
  const predefinedSymptoms: { id: SymptomType; label: string }[] = [
    { id: 'cramps', label: 'Cramps' },
    { id: 'headache', label: 'Headache' },
    { id: 'migraines', label: 'Migraines' },
    { id: 'backache', label: 'Backache' },
    { id: 'nausea', label: 'Nausea' },
    { id: 'bloating', label: 'Bloating' },
    { id: 'tender_breasts', label: 'Tender Breasts' },
    { id: 'breast_tenderness', label: 'Breast Tenderness' },
    { id: 'acne', label: 'Acne' },
    { id: 'fatigue', label: 'Fatigue' },
    { id: 'insomnia', label: 'Insomnia' },
    { id: 'spotting', label: 'Spotting' },
    { id: 'dizziness', label: 'Dizziness' },
    { id: 'constipation', label: 'Constipation' },
    { id: 'diarrhea', label: 'Diarrhea' },
    { id: 'digestive_issues', label: 'Digestive Issues' },
  ];
  
  const allSymptoms = [
    ...predefinedSymptoms.map(s => ({ ...s, isCustom: false as const })),
    ...customSymptoms.map(s => ({ id: s.id, label: s.name, isCustom: true as const }))
  ];
  
  const handleSymptomPress = (symptomId: string, isCustom: boolean) => {
    const existing = selectedSymptoms.find(s => s.id === symptomId);
    if (existing) {
      setEditingSymptomId(symptomId);
    } else {
      onSelectSymptom(symptomId, 3, isCustom);
    }
  };
  
  const handleAddCustomSymptom = () => {
    if (!customSymptomName.trim()) {
      Alert.alert('Error', 'Please enter a symptom name');
      return;
    }
    onAddCustomSymptom(customSymptomName.trim());
    setCustomSymptomName('');
    setShowAddCustom(false);
  };
  
  const handleIntensityChange = (symptomId: string, intensity: number, isCustom: boolean) => {
    onSelectSymptom(symptomId, Math.round(intensity), isCustom);
  };
  
  const getSymptomLabel = (symptomId: string): string => {
    const symptom = allSymptoms.find(s => s.id === symptomId);
    return symptom ? symptom.label : symptomId;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Symptoms</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddCustom(true)}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addButtonText}>Add Custom</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.symptomsContainer}
      >
        {allSymptoms.map((symptom) => {
          const selected = selectedSymptoms.find(s => s.id === symptom.id);
          return (
            <TouchableOpacity
              key={symptom.id}
              style={[
                styles.symptomButton,
                selected && styles.selectedSymptom,
              ]}
              onPress={() => handleSymptomPress(symptom.id, symptom.isCustom)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.symptomText,
                  selected && styles.selectedSymptomText,
                ]}
              >
                {symptom.label}
              </Text>
              {selected && (
                <View style={styles.intensityBadge}>
                  <Text style={styles.intensityText}>{selected.intensity}</Text>
                </View>
              )}
              {symptom.isCustom && selected && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onRemoveSymptom(symptom.id);
                  }}
                >
                  <X size={12} color={Colors.white} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {selectedSymptoms.length > 0 && (
        <View style={styles.selectedSymptomsContainer}>
          <Text style={styles.selectedTitle}>Selected Symptoms (tap to adjust intensity)</Text>
          {selectedSymptoms.map((symptom) => (
            <View key={symptom.id} style={styles.symptomSliderContainer}>
              <View style={styles.symptomSliderHeader}>
                <Text style={styles.symptomSliderLabel}>
                  {getSymptomLabel(symptom.id)}
                </Text>
                <View style={styles.intensityLabelContainer}>
                  <Text style={styles.intensityLabel}>
                    Intensity: {symptom.intensity}/5
                  </Text>
                  <TouchableOpacity
                    style={styles.removeIconButton}
                    onPress={() => onRemoveSymptom(symptom.id)}
                  >
                    <X size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={symptom.intensity}
                onValueChange={(value: number) => handleIntensityChange(symptom.id, value, symptom.isCustom)}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Mild</Text>
                <Text style={styles.sliderLabelText}>Moderate</Text>
                <Text style={styles.sliderLabelText}>Severe</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      <Modal
        visible={showAddCustom}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddCustom(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Symptom</Text>
            <TextInput
              style={styles.modalInput}
              value={customSymptomName}
              onChangeText={setCustomSymptomName}
              placeholder="Enter symptom name"
              placeholderTextColor={Colors.inactive}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowAddCustom(false);
                  setCustomSymptomName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalAddButton]}
                onPress={handleAddCustomSymptom}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  symptomsContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  symptomButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  selectedSymptom: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  symptomText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedSymptomText: {
    color: Colors.white,
    fontWeight: '500' as const,
  },
  intensityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  intensityText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  selectedSymptomsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  symptomSliderContainer: {
    marginBottom: 16,
  },
  symptomSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomSliderLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  intensityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityLabel: {
    fontSize: 12,
    color: Colors.subtext,
    marginRight: 8,
  },
  removeIconButton: {
    padding: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderLabelText: {
    fontSize: 11,
    color: Colors.subtext,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalCancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalAddButton: {
    backgroundColor: Colors.primary,
  },
  modalAddText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});