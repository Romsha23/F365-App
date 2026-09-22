import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MoodType } from '../types/cycle';
import Colors from '../constants/colors';
import { Smile, Frown, Meh, AlertCircle, Heart, Battery, BatteryCharging } from 'lucide-react-native';

interface MoodPickerProps {
  selectedMood?: MoodType;
  moodIntensity?: number;
  onSelectMood: (mood: MoodType, intensity: number) => void;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({
  selectedMood,
  moodIntensity = 3,
  onSelectMood,
}) => {
  const [intensity, setIntensity] = useState<number>(moodIntensity);
  
  useEffect(() => {
    setIntensity(moodIntensity);
  }, [moodIntensity]);
  const moods: { id: MoodType; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'energetic', 
      label: 'Energetic', 
      icon: <BatteryCharging size={24} color={selectedMood === 'energetic' ? Colors.white : '#32CD32'} /> 
    },
    { 
      id: 'happy', 
      label: 'Happy', 
      icon: <Smile size={24} color={selectedMood === 'happy' ? Colors.white : '#FFD700'} /> 
    },
    { 
      id: 'neutral', 
      label: 'Neutral', 
      icon: <Meh size={24} color={selectedMood === 'neutral' ? Colors.white : '#A0A0A0'} /> 
    },
    { 
      id: 'anxious', 
      label: 'Anxious', 
      icon: <Heart size={24} color={selectedMood === 'anxious' ? Colors.white : '#9370DB'} /> 
    },
    { 
      id: 'irritated', 
      label: 'Irritated', 
      icon: <AlertCircle size={24} color={selectedMood === 'irritated' ? Colors.white : '#9333EA'} /> 
    },
    { 
      id: 'sad', 
      label: 'Sad', 
      icon: <Frown size={24} color={selectedMood === 'sad' ? Colors.white : '#6495ED'} /> 
    },
    { 
      id: 'tired', 
      label: 'Tired', 
      icon: <Battery size={24} color={selectedMood === 'tired' ? Colors.white : '#8B4513'} /> 
    },
  ];
  
  const handleMoodPress = (mood: MoodType) => {
    onSelectMood(mood, intensity);
  };
  
  const handleIntensityChange = (newIntensity: number) => {
    setIntensity(newIntensity);
    if (selectedMood) {
      onSelectMood(selectedMood, newIntensity);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your mood</Text>
      <View style={styles.moodsContainer}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodButton,
              selectedMood === mood.id && styles.selectedMood,
            ]}
            onPress={() => handleMoodPress(mood.id)}
            activeOpacity={0.7}
          >
            {mood.icon}
            <Text
              style={[
                styles.moodText,
                selectedMood === mood.id && styles.selectedMoodText,
              ]}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {selectedMood && (
        <View style={styles.intensityContainer}>
          <View style={styles.intensityHeader}>
            <Text style={styles.intensityLabel}>Intensity</Text>
            <Text style={styles.intensityValue}>{intensity}/5</Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View 
                style={[
                  styles.sliderFill, 
                  { 
                    width: `${(intensity / 5) * 100}%`,
                    backgroundColor: Colors.primary
                  }
                ]} 
              />
            </View>
            <View style={styles.sliderDots}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.sliderDot,
                    intensity >= level && styles.sliderDotActive,
                    { 
                      backgroundColor: intensity >= level 
                        ? Colors.primary
                        : Colors.border
                    }
                  ]}
                  onPress={() => handleIntensityChange(level)}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.intensityLabels}>
            <Text style={styles.intensityLabelText}>Low</Text>
            <Text style={styles.intensityLabelText}>High</Text>
          </View>
        </View>
      )}
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
  moodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedMood: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  moodText: {
    fontSize: 13,
    color: Colors.text,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  selectedMoodText: {
    color: Colors.white,
    fontWeight: '500',
  },
  intensityContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  intensityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sliderContainer: {
    marginBottom: 8,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sliderDotActive: {
    borderColor: 'transparent',
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  intensityLabelText: {
    fontSize: 12,
    color: Colors.subtext,
  },
});