import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '../constants/colors';

interface LogoProps {
  size?: number;
  showText?: boolean;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  showText = true,
  style 
}) => {
  const fontSize = size * 0.45;
  const textSize = size * 0.6;
  
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#F43F5E', '#9333EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={[styles.letter, { fontSize }]}>f</Text>
      </LinearGradient>
      {showText && (
        <Text style={[styles.text, { fontSize: textSize }]}>f365</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  letter: {
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700' as const,
  },
  text: {
    color: Colors.foreground,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    flexShrink: 0,
  },
});
