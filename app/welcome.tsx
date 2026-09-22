import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { Logo } from '../components/Logo';
import Colors from '../constants/colors';
import { gradients, fonts } from '../constants/theme';
import { Sparkles, Calendar, TrendingUp } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.replace('/onboarding' as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,

          title: 'Welcome',
        }} 
      />
      
      <LinearGradient
        colors={['#0E0F14', '#1A0F28', '#0E0F14']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Logo size={80} showText={false} />
            <Text style={styles.brandName}>f365</Text>
          </View>
          
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Your Personal{'\n'}Cycle Companion</Text>
            <Text style={styles.heroSubtitle}>
              Track, predict, and understand your cycle with AI-powered insights
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Calendar size={24} color={Colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Smart Tracking</Text>
                <Text style={styles.featureDescription}>
                  Log your cycle, symptoms, and moods effortlessly
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <TrendingUp size={24} color={Colors.accent} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI Predictions</Text>
                <Text style={styles.featureDescription}>
                  Get accurate forecasts for your next period
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Sparkles size={24} color={Colors.secondary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Personal Insights</Text>
                <Text style={styles.featureDescription}>
                  Discover patterns and optimize your wellbeing
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.cosmic}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.privacyText}>
              Your data is private, secure, and never shared
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  brandName: {
    fontSize: 32,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
    letterSpacing: 2,
  },
  heroSection: {
    alignItems: 'center',
    gap: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: fonts.heading.bold,
    color: Colors.foreground,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: fonts.body.regular,
    color: '#B0B0BE',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: fonts.body.semiBold,
    color: Colors.foreground,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: '#A0A0B0',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: fonts.body.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  privacyText: {
    fontSize: 13,
    fontFamily: fonts.body.regular,
    color: '#9A9AAF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
