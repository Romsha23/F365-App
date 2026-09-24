import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '../constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Privacy Policy',
          headerBackVisible: true,
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: March 11, 2026</Text>
        
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.paragraph}>
          F365 is operated by ACHS Pty Ltd (ABN 37 679 506 551), registered in Victoria, Australia. We are committed to protecting your privacy in accordance with the Privacy Act 1988 (Cth), the Australian Privacy Principles (APPs), and applicable state and territory legislation. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={styles.sectionTitle}>Regulatory Framework</Text>
        <Text style={styles.paragraph}>
          This policy is governed by the following Australian regulations:
        </Text>
        <Text style={styles.bulletPoint}>• Privacy Act 1988 (Cth) and the 13 Australian Privacy Principles (APPs)</Text>
        <Text style={styles.bulletPoint}>• Notifiable Data Breaches (NDB) scheme under Part IIIC of the Privacy Act</Text>
        <Text style={styles.bulletPoint}>• Australian Consumer Law (ACL) under the Competition and Consumer Act 2010</Text>
        <Text style={styles.bulletPoint}>• Office of the Australian Information Commissioner (OAIC) guidelines</Text>
        <Text style={styles.paragraph}>
          Where applicable, we also consider international frameworks such as the GDPR (for EU users) and CCPA (for California users).
        </Text>
        
        <Text style={styles.sectionTitle}>Information We Collect (APP 3 &amp; APP 5)</Text>
        <Text style={styles.paragraph}>
          Under APP 3, we only collect personal information that is reasonably necessary for our functions and activities. Under APP 5, we notify you at or before the time of collection about what we collect and why. We collect information that you provide directly to us, including:
        </Text>
        <Text style={styles.bulletPoint}>• Personal information (name, email address, age, ethnicity)</Text>
        <Text style={styles.bulletPoint}>• Sensitive health information (menstrual cycle data, pregnancy data, symptoms, mood) — collected only with your explicit consent as required by APP 3.3</Text>
        <Text style={styles.bulletPoint}>• User preferences and settings</Text>
        <Text style={styles.bulletPoint}>• Emergency contact information (if provided)</Text>
        
        <Text style={styles.sectionTitle}>How We Use Your Information (APP 6)</Text>
        <Text style={styles.paragraph}>
          Under APP 6, we only use your personal information for the primary purpose for which it was collected, or for a directly related secondary purpose you would reasonably expect. We use the information we collect to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
        <Text style={styles.bulletPoint}>• Generate personalised insights and predictions using AI</Text>
        <Text style={styles.bulletPoint}>• Send notifications and reminders (with your consent)</Text>
        <Text style={styles.bulletPoint}>• Respond to your comments, questions, and requests</Text>
        <Text style={styles.bulletPoint}>• Analyse anonymous usage patterns and trends (with your consent)</Text>
        
        <Text style={styles.sectionTitle}>Data Storage and Security (APP 11)</Text>
        <Text style={styles.paragraph}>
          Under APP 11, we take reasonable steps to protect your personal information from misuse, interference, loss, unauthorised access, modification, or disclosure. Your health data is stored locally on your device and encrypted. If you choose to back up your data to our servers, we use industry-standard encryption and security measures. Our cloud infrastructure is hosted via Supabase, which may involve data processing in the United States. By using our service, you consent to this cross-border transfer as disclosed under APP 8.
        </Text>

        <Text style={styles.sectionTitle}>Cross-Border Disclosure (APP 8)</Text>
        <Text style={styles.paragraph}>
          Some of your data may be processed by third-party service providers located outside Australia (including in the United States) for the purposes of cloud hosting and AI processing. Under APP 8, we take reasonable steps to ensure these overseas recipients comply with the APPs. We disclose:
        </Text>
        <Text style={styles.bulletPoint}>• Cloud data storage via Supabase (US-based infrastructure)</Text>
        <Text style={styles.bulletPoint}>• AI processing via secure API endpoints</Text>
        <Text style={styles.bulletPoint}>• Payment processing via Stripe (US-based)</Text>
        
        <Text style={styles.sectionTitle}>Sharing Your Information (APP 6 &amp; APP 7)</Text>
        <Text style={styles.paragraph}>
          We do not sell, trade, or otherwise transfer your personally identifiable information to third parties without your consent, except as described below:
        </Text>
        <Text style={styles.bulletPoint}>• With service providers who perform services on our behalf (under contractual obligations to protect your data)</Text>
        <Text style={styles.bulletPoint}>• To comply with legal obligations or lawful requests by Australian authorities</Text>
        <Text style={styles.bulletPoint}>• To protect our rights and safety</Text>
        
        <Text style={styles.sectionTitle}>Your Rights (APP 12 &amp; APP 13)</Text>
        <Text style={styles.paragraph}>
          Under the Australian Privacy Principles, you have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal information (APP 12) — use the Export Data feature in the app</Text>
        <Text style={styles.bulletPoint}>• Request correction of inaccurate information (APP 13) — use the Edit Profile feature</Text>
        <Text style={styles.bulletPoint}>• Request deletion of your data — use the Delete All Data feature in Profile settings</Text>
        <Text style={styles.bulletPoint}>• Withdraw consent for data processing at any time via the Privacy Consent screen</Text>
        <Text style={styles.bulletPoint}>• Opt out of receiving notifications and marketing communications</Text>
        <Text style={styles.bulletPoint}>• Choose not to provide certain information (though this may limit functionality)</Text>

        <Text style={styles.sectionTitle}>Notifiable Data Breaches</Text>
        <Text style={styles.paragraph}>
          In accordance with the Notifiable Data Breaches (NDB) scheme under Part IIIC of the Privacy Act, if we become aware of an eligible data breach that is likely to result in serious harm, we will notify affected individuals and the OAIC as soon as practicable.
        </Text>
        
        <Text style={styles.sectionTitle}>Children&apos;s Privacy</Text>
        <Text style={styles.paragraph}>
          Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete that information promptly.
        </Text>

        <Text style={styles.sectionTitle}>AI Processing &amp; Transparency (APP 1 &amp; APP 5)</Text>
        <Text style={styles.paragraph}>
          F365 uses artificial intelligence to generate health insights, predictions, and personalised recommendations. AI processing of your health data requires separate explicit consent, which you can manage via the Privacy Consent screen. AI-generated content is clearly labelled within the app and is not a substitute for professional medical advice.
        </Text>
        
        <Text style={styles.sectionTitle}>Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page, updating the &quot;Last Updated&quot; date, and where appropriate, sending an in-app notification.
        </Text>

        <Text style={styles.sectionTitle}>Complaints</Text>
        <Text style={styles.paragraph}>
          If you believe we have breached the Australian Privacy Principles or have a complaint about how we handle your personal information:
        </Text>
        <Text style={styles.bulletPoint}>• Contact us first at hello@f365.app</Text>
        <Text style={styles.bulletPoint}>• We will respond within 30 business days</Text>
        <Text style={styles.bulletPoint}>• If unsatisfied, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au or call 1300 363 992</Text>
        
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={styles.paragraph}>
          ACHS Pty Ltd{"\n"}ABN 37 679 506 551{"\n"}Victoria, Australia
        </Text>
        <Text style={styles.contactInfo}>hello@f365.app</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.subtext,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 24,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  contactInfo: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 8,
    marginBottom: 24,
  },
});
