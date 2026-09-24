import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Heart, Phone, Globe, ChevronDown, ChevronUp, Shield, AlertTriangle } from 'lucide-react-native';
import Colors from '../constants/colors';

type EmergencyResource = {
  country: string;
  countryCode: string;
  resources: {
    name: string;
    phone?: string;
    url?: string;
    description: string;
  }[];
};

const EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    country: 'United States',
    countryCode: 'US',
    resources: [
      { name: '988 Suicide & Crisis Lifeline', phone: '988', description: '24/7 free, confidential support' },
      { name: 'Crisis Text Line', phone: '741741', description: 'Text HOME to 741741' },
      { name: 'National Domestic Violence Hotline', phone: '1-800-799-7233', description: '24/7 support for domestic violence' },
    ],
  },
  {
    country: 'United Kingdom',
    countryCode: 'GB',
    resources: [
      { name: 'Samaritans', phone: '116 123', description: '24/7 emotional support' },
      { name: 'Mind', phone: '0300 123 3393', description: 'Mental health support' },
      { name: 'National Domestic Abuse Helpline', phone: '0808 2000 247', description: '24/7 freephone helpline' },
    ],
  },
  {
    country: 'Canada',
    countryCode: 'CA',
    resources: [
      { name: 'Crisis Services Canada', phone: '1-833-456-4566', description: '24/7 suicide prevention' },
      { name: 'Kids Help Phone', phone: '1-800-668-6868', description: 'For young people' },
    ],
  },
  {
    country: 'Australia',
    countryCode: 'AU',
    resources: [
      { name: 'Lifeline Australia', phone: '13 11 14', description: '24/7 crisis support' },
      { name: 'Beyond Blue', phone: '1300 22 4636', description: 'Anxiety and depression support' },
    ],
  },
  {
    country: 'India',
    countryCode: 'IN',
    resources: [
      { name: 'iCall', phone: '9152987821', description: 'Psychosocial helpline' },
      { name: 'Vandrevala Foundation', phone: '1860-2662-345', description: '24/7 mental health support' },
    ],
  },
  {
    country: 'International',
    countryCode: 'INTL',
    resources: [
      { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/', description: 'Find crisis centers worldwide' },
    ],
  },
];

type CrisisSafetyFooterProps = {
  showEmergencyResources?: boolean;
  showMedicalDisclaimer?: boolean;
  gentleMessage?: string;
  style?: any;
};

export const CrisisSafetyFooter: React.FC<CrisisSafetyFooterProps> = ({
  showEmergencyResources = true,
  showMedicalDisclaimer = true,
  gentleMessage,
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleCallPress = (phone: string) => {
    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`;
    Linking.openURL(phoneUrl).catch(err => console.error('Error opening phone:', err));
  };

  const handleWebPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  return (
    <View style={[styles.container, style]}>
      {gentleMessage && (
        <View style={styles.gentleMessageContainer}>
          <Heart size={16} color={Colors.primary} />
          <Text style={styles.gentleMessageText}>{gentleMessage}</Text>
        </View>
      )}

      {showEmergencyResources && (
        <View style={styles.emergencySection}>
          <TouchableOpacity 
            style={styles.emergencyHeader}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.emergencyTitleRow}>
              <Shield size={18} color={Colors.accent} />
              <Text style={styles.emergencyTitle}>Need support?</Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={20} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          <Text style={styles.emergencySubtitle}>
            You&apos;re not alone. Help is available 24/7.
          </Text>

          {isExpanded && (
            <View style={styles.resourcesContainer}>
              {EMERGENCY_RESOURCES.map((country) => (
                <View key={country.countryCode} style={styles.countrySection}>
                  <TouchableOpacity
                    style={styles.countryHeader}
                    onPress={() => setSelectedCountry(
                      selectedCountry === country.countryCode ? null : country.countryCode
                    )}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryName}>{country.country}</Text>
                    {selectedCountry === country.countryCode ? (
                      <ChevronUp size={16} color={Colors.textMuted} />
                    ) : (
                      <ChevronDown size={16} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  {selectedCountry === country.countryCode && (
                    <View style={styles.resourcesList}>
                      {country.resources.map((resource, index) => (
                        <View key={index} style={styles.resourceItem}>
                          <Text style={styles.resourceName}>{resource.name}</Text>
                          <Text style={styles.resourceDescription}>{resource.description}</Text>
                          {resource.phone && (
                            <TouchableOpacity
                              style={styles.resourceButton}
                              onPress={() => handleCallPress(resource.phone!)}
                              activeOpacity={0.7}
                            >
                              <Phone size={14} color={Colors.accent} />
                              <Text style={styles.resourceButtonText}>{resource.phone}</Text>
                            </TouchableOpacity>
                          )}
                          {resource.url && (
                            <TouchableOpacity
                              style={styles.resourceButton}
                              onPress={() => handleWebPress(resource.url!)}
                              activeOpacity={0.7}
                            >
                              <Globe size={14} color={Colors.accent} />
                              <Text style={styles.resourceButtonText}>Visit website</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {showMedicalDisclaimer && (
        <View style={styles.disclaimerContainer}>
          <AlertTriangle size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            This app is not medical advice. The information provided is for educational and informational purposes only. 
            Always consult with a qualified healthcare provider for medical concerns, especially regarding pregnancy, 
            reproductive health, or mental health conditions.
          </Text>
        </View>
      )}
    </View>
  );
};

export const GentleCrisisMessage: React.FC<{
  message?: string;
  showResources?: boolean;
}> = ({ 
  message = "It's okay to not be okay. Your feelings are valid.", 
  showResources = true 
}) => {
  return (
    <View style={styles.gentleCrisisContainer}>
      <View style={styles.gentleCrisisHeader}>
        <Heart size={20} color={Colors.primary} fill={Colors.primary} />
        <Text style={styles.gentleCrisisTitle}>A gentle reminder</Text>
      </View>
      <Text style={styles.gentleCrisisText}>{message}</Text>
      {showResources && (
        <Text style={styles.gentleCrisisSubtext}>
          If you&apos;re struggling, please reach out to someone you trust or a professional. You deserve support.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  gentleMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  gentleMessageText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  emergencySection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  emergencySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  resourcesContainer: {
    marginTop: 16,
    gap: 8,
  },
  countrySection: {
    backgroundColor: Colors.muted,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  resourcesList: {
    padding: 12,
    paddingTop: 0,
    gap: 12,
  },
  resourceItem: {
    gap: 4,
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  resourceDescription: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    padding: 8,
    backgroundColor: Colors.accent + '15',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  resourceButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.muted,
    borderRadius: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  gentleCrisisContainer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  gentleCrisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  gentleCrisisTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  gentleCrisisText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  gentleCrisisSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
