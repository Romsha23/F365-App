import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { useUserStore } from '../store/user-store';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { Shield, Lock } from 'lucide-react-native';
import { logConsentGiven, logConsentRevoked } from '../utils/audit-logger';

export default function ConsentScreen() {
  const { user, updateUser } = useUserStore();
  
  const [dataProcessingConsent, setDataProcessingConsent] = useState(
    user?.consentGiven ?? true
  );
  const [aiProcessingConsent, setAiProcessingConsent] = useState(
    user?.aiProcessingConsent ?? true
  );
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  
  const handleDataProcessingToggle = (value: boolean) => {
    setDataProcessingConsent(value);
    
    if (value) {
      logConsentGiven(user?.uniqueId || '1', 'data_processing');
    } else {
      logConsentRevoked(user?.uniqueId || '1', 'data_processing');
    }
  };
  
  const handleAiProcessingToggle = (value: boolean) => {
    setAiProcessingConsent(value);
    
    if (value) {
      logConsentGiven(user?.uniqueId || '1', 'ai_processing');
    } else {
      logConsentRevoked(user?.uniqueId || '1', 'ai_processing');
    }
  };
  
  const handleAnalyticsToggle = (value: boolean) => {
    setAnalyticsConsent(value);
    
    if (value) {
      logConsentGiven(user?.uniqueId || '1', 'analytics');
    } else {
      logConsentRevoked(user?.uniqueId || '1', 'analytics');
    }
  };
  
  const handleMarketingToggle = (value: boolean) => {
    setMarketingConsent(value);
    
    if (value) {
      logConsentGiven(user?.uniqueId || '1', 'marketing');
    } else {
      logConsentRevoked(user?.uniqueId || '1', 'marketing');
    }
  };
  
  const handleResearchToggle = (value: boolean) => {
    setResearchConsent(value);
    
    if (value) {
      logConsentGiven(user?.uniqueId || '1', 'research');
    } else {
      logConsentRevoked(user?.uniqueId || '1', 'research');
    }
  };
  
  const handleSaveConsent = () => {
    if (user) {
      updateUser({
        consentGiven: dataProcessingConsent,
        aiProcessingConsent: aiProcessingConsent,
        aiConsentDate: aiProcessingConsent ? new Date().toISOString() : undefined,
      });
    }
    
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Privacy Consent',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Shield size={48} color={Colors.primary} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Your Privacy Matters</Text>
          <Text style={styles.headerDescription}>
            F365 is committed to protecting your health data and privacy.
            Please review and provide your consent for how we process your information.
          </Text>
        </View>
        
        <View style={styles.consentSection}>
          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentTitle}>Data Processing (Required)</Text>
              <Text style={styles.consentDescription}>
                We need to process your cycle and health data to provide our core services.
                This includes storing, analyzing, and generating insights from your data.
              </Text>
            </View>
            <Switch
              value={dataProcessingConsent}
              onValueChange={handleDataProcessingToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentTitle}>AI Processing (Required for AI Features)</Text>
              <Text style={styles.consentDescription}>
                Allow AI to analyze your health data to provide personalized insights, 
                predictions, and chatbot assistance. Your data is processed securely and 
                never shared with third parties.
              </Text>
            </View>
            <Switch
              value={aiProcessingConsent}
              onValueChange={handleAiProcessingToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentTitle}>Anonymous Analytics (Optional)</Text>
              <Text style={styles.consentDescription}>
                Help us improve by allowing anonymous usage analytics.
                No personal or health data is shared.
              </Text>
            </View>
            <Switch
              value={analyticsConsent}
              onValueChange={handleAnalyticsToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentTitle}>Marketing Communications (Optional)</Text>
              <Text style={styles.consentDescription}>
                Receive updates about new features and health tips.
                You can unsubscribe at any time.
              </Text>
            </View>
            <Switch
              value={marketingConsent}
              onValueChange={handleMarketingToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentTitle}>Research Participation (Optional)</Text>
              <Text style={styles.consentDescription}>
                Contribute to women&apos;s health research with anonymized data.
                No personally identifiable information is shared.
              </Text>
            </View>
            <Switch
              value={researchConsent}
              onValueChange={handleResearchToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
        
        <View style={styles.privacyActSection}>
          <Lock size={24} color={Colors.primary} style={styles.privacyActIcon} />
          <Text style={styles.privacyActTitle}>Australian Privacy Act Compliance</Text>
          <Text style={styles.privacyActDescription}>
            F365 is designed to comply with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs). Your health data is classified as sensitive information under APP 3 and requires your explicit consent before collection or processing. Your data is encrypted, stored securely, and never sold to third parties. You can access, export, correct, or delete your data at any time in accordance with APP 12 and APP 13.
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Save Preferences"
            onPress={handleSaveConsent}
            disabled={!dataProcessingConsent}
            style={styles.saveButton}
          />
          
          <TouchableOpacity
            onPress={() => router.push('/privacy-policy' as any)}
            style={styles.privacyLink}
          >
            <Text style={styles.privacyLinkText}>View Full Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  consentSection: {
    marginBottom: 32,
  },
  consentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  consentInfo: {
    flex: 1,
    marginRight: 16,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  consentDescription: {
    fontSize: 14,
    color: Colors.subtext,
    lineHeight: 20,
  },
  privacyActSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  privacyActIcon: {
    marginBottom: 8,
  },
  privacyActTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  privacyActDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    marginBottom: 16,
  },
  privacyLink: {
    padding: 8,
  },
  privacyLinkText: {
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});