import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Colors from '../constants/colors';

const { width, height } = Dimensions.get('window');

const STAR_COUNT = 15;

const starData = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2 + 1,
  duration: Math.random() * 3000 + 2000,
  initialOpacity: Math.random(),
}));

export function CosmicBackground() {
  const opacities = useRef(starData.map(s => new Animated.Value(s.initialOpacity))).current;
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    opacities.forEach((opacity, i) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: starData[i].duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: starData[i].duration,
            useNativeDriver: true,
          }),
        ]).start(() => twinkle());
      };
      twinkle();
    });
  }, [opacities]);

  return (
    <View style={styles.container}>
      {starData.map((star, i) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              opacity: opacities[i],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
  },
  star: {
    position: 'absolute',
    backgroundColor: Colors.foreground,
    borderRadius: 999,
  },
});
