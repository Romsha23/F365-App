import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlowIntensity } from '../types/cycle';
import Colors from '../constants/colors';
import { Droplets } from 'lucide-react-native';

interface FlowPickerProps {
  selectedFlow: FlowIntensity;
  onSelectFlow: (flow: FlowIntensity) => void;
}

const FLOW_CONFIG: { id: FlowIntensity; label: string; dots: number; accentColor: string; bgTint: string }[] = [
  { id: 'none', label: 'None', dots: 0, accentColor: '#8B8BA3', bgTint: '#F0EEF5' },
  { id: 'spotting', label: 'Spotting', dots: 1, accentColor: '#E8A0BF', bgTint: '#FDF0F5' },
  { id: 'light', label: 'Light', dots: 2, accentColor: '#D97FAD', bgTint: '#FCE8F0' },
  { id: 'medium', label: 'Medium', dots: 3, accentColor: '#C45B92', bgTint: '#FADDE9' },
  { id: 'heavy', label: 'Heavy', dots: 4, accentColor: '#A83279', bgTint: '#F5D0DE' },
];

export const FlowPicker: React.FC<FlowPickerProps> = ({
  selectedFlow,
  onSelectFlow,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flow Intensity</Text>
      <View style={styles.flowsContainer}>
        {FLOW_CONFIG.map((flow) => {
          const isSelected = selectedFlow === flow.id;
          return (
            <TouchableOpacity
              key={flow.id}
              style={[
                styles.flowButton,
                { backgroundColor: flow.bgTint, borderColor: flow.accentColor + '50' },
                isSelected && {
                  borderColor: flow.accentColor,
                  backgroundColor: flow.accentColor + '25',
                },
              ]}
              onPress={() => onSelectFlow(flow.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.flowIconWrap,
                isSelected
                  ? { backgroundColor: flow.accentColor + '30' }
                  : { backgroundColor: flow.accentColor + '18' },
              ]}>
                {flow.dots === 0 ? (
                  <View style={styles.noneIcon}>
                    <View style={[
                      styles.noneLine,
                      { backgroundColor: isSelected ? flow.accentColor : flow.accentColor + '80' },
                    ]} />
                  </View>
                ) : (
                  <Droplets
                    size={20}
                    color={isSelected ? flow.accentColor : flow.accentColor + '90'}
                    strokeWidth={2.2}
                  />
                )}
              </View>

              {flow.dots > 0 && (
                <View style={styles.dotsRow}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < flow.dots
                          ? { backgroundColor: isSelected ? flow.accentColor : flow.accentColor + '70' }
                          : { backgroundColor: isSelected ? flow.accentColor + '25' : flow.accentColor + '20' },
                      ]}
                    />
                  ))}
                </View>
              )}

              <Text
                style={[
                  styles.flowLabel,
                  isSelected && { color: flow.accentColor, fontWeight: '700' as const },
                ]}
                numberOfLines={1}
              >
                {flow.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    fontWeight: 'bold' as const,
    marginBottom: 12,
    color: Colors.text,
  },
  flowsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  flowButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 100,
  },
  flowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  noneIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneLine: {
    width: 18,
    height: 2.5,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flowLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
});
