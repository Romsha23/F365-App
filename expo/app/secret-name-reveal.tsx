import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Sparkles, Shield, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useUserStore } from '../store/user-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PARTICLE_COUNT = 12;

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
    startX: (Math.random() - 0.5) * SCREEN_WIDTH * 0.8,
    startY: (Math.random() - 0.5) * 300,
  }));
}

export default function SecretNameRevealScreen() {
  const { name: rawName } = useLocalSearchParams<{ name: string }>();
  const { user } = useUserStore();
  const nameFromParams = Array.isArray(rawName) ? rawName[0] : rawName;
  const displayName = nameFromParams || user?.displayName || 'StarBloom';

  const fadeIn = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const nameScale = useRef(new Animated.Value(0.3)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(20)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  const [particles] = useState(createParticles);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.delay(400),
    ]).start(() => {
      handleReveal();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReveal = () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setRevealed(true);

    particles.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0);
    });

    Animated.parallel([
      Animated.spring(nameScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(nameOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),

      ...particles.map((p) =>
        Animated.sequence([
          Animated.delay(Math.random() * 200),
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(p.scale, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(p.x, { toValue: p.startX, duration: 800, useNativeDriver: true }),
            Animated.timing(p.y, { toValue: p.startY, duration: 800, useNativeDriver: true }),
          ]),
          Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();

      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(subtitleFade, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(subtitleSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(buttonSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    });
  };

  const handleContinue = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(tabs)');
  };

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.bgPattern}>
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.bgCircle,
              {
                width: 120 + i * 60,
                height: 120 + i * 60,
                borderRadius: 60 + i * 30,
                opacity: 0.04 - i * 0.005,
                top: '40%',
                left: '50%',
                marginLeft: -(60 + i * 30),
                marginTop: -(60 + i * 30),
              },
            ]}
          />
        ))}
      </View>

      {revealed &&
        particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                ],
              },
            ]}
          >
            <Text style={styles.particleEmoji}>
              {['✨', '🌟', '💜', '⭐', '🔮', '💫'][i % 6]}
            </Text>
          </Animated.View>
        ))}

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ translateY: titleSlide }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconRing}>
            <Sparkles size={32} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.preTitle}>Your secret identity is ready</Text>
        <Text style={styles.title}>Meet your alter ego</Text>
      </Animated.View>

      <View style={styles.nameContainer}>
        <Animated.View
          style={[
            styles.glowRing,
            { opacity: glowPulse },
          ]}
        />
        <Animated.View
          style={[
            styles.nameCard,
            {
              opacity: nameOpacity,
              transform: [{ scale: nameScale }],
            },
          ]}
        >
          <Animated.View style={[styles.shimmerOverlay, { opacity: shimmerOpacity }]} />
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.nameSparkle}>✨</Text>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.subtitleContainer,
          { opacity: subtitleFade, transform: [{ translateY: subtitleSlide }] },
        ]}
      >
        <Text style={styles.subtitle}>
          This is how we'll greet you — no real names, just vibes.
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.infoCard,
          { opacity: cardFade, transform: [{ translateY: cardSlide }] },
        ]}
      >
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Shield size={18} color={Colors.primary} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Privacy-first identity</Text>
            <Text style={styles.infoDescription}>
              Your real name is never stored. Only this secret name and a unique ID link to your data — keeping you anonymous and safe.
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonContainer,
          { opacity: buttonFade, transform: [{ translateY: buttonSlide }] },
        ]}
      >
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Let's go, {displayName}</Text>
          <ChevronRight size={20} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          You can change this anytime in your profile settings
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  particle: {
    position: 'absolute',
    top: '42%',
    left: '48%',
    zIndex: 10,
  },
  particleEmoji: {
    fontSize: 20,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(147, 51, 234, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    height: 100,
  },
  glowRing: {
    position: 'absolute',
    width: 240,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(147, 51, 234, 0.12)',
  },
  nameCard: {
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(147, 51, 234, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(147, 51, 234, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  nameText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  nameSparkle: {
    fontSize: 24,
    marginLeft: 10,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 19,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  footerHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 14,
    textAlign: 'center',
  },
});
