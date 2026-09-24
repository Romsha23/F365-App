import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '../constants/colors';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Terms of Service',
          headerBackVisible: true,
          headerBackTitle: 'Back',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: March 7, 2026</Text>
        
        <Text style={styles.paragraph}>
          Please read these Terms of Service (&quot;Terms&quot;) carefully before using the F365 mobile application (&quot;App&quot;). By accessing or using F365, you agree to be bound by these Terms. If you disagree with any part, you may not access the service.
        </Text>
        
        <Text style={styles.sectionTitle}>1. Description of Service</Text>
        <Text style={styles.paragraph}>
          F365 is a menstrual cycle tracking and wellness application that allows users to log and monitor their menstrual cycles, symptoms, moods, and related health information. The App provides AI-generated predictions, insights, and personalised recommendations based on user-provided data.
        </Text>
        
        <Text style={styles.sectionTitle}>2. Not Medical Advice</Text>
        <Text style={styles.paragraph}>
          F365 is not intended to provide medical advice, diagnosis, or treatment. All content, predictions, and insights — including AI-generated content — are for informational and educational purposes only. Always consult a qualified healthcare provider for medical concerns. Do not disregard professional medical advice or delay seeking it because of information provided by this App.
        </Text>

        <Text style={styles.sectionTitle}>3. AI-Generated Content Disclaimer</Text>
        <Text style={styles.paragraph}>
          F365 uses artificial intelligence to generate predictions, health insights, chatbot responses, and personalised recommendations. You acknowledge and agree that:
        </Text>
        <Text style={styles.bulletPoint}>• AI-generated content may contain inaccuracies, errors, or limitations and should not be relied upon as a sole source of health information.</Text>
        <Text style={styles.bulletPoint}>• AI predictions (cycle dates, fertile windows, mood forecasts) are statistical estimates based on your logged data and are not guaranteed to be accurate.</Text>
        <Text style={styles.bulletPoint}>• The quality of AI insights depends on the completeness and accuracy of data you provide. Incomplete or inaccurate data will result in less reliable outputs.</Text>
        <Text style={styles.bulletPoint}>• F365 shall not be held liable for any decisions made based on AI-generated content, including but not limited to fertility planning, contraception decisions, or health management.</Text>
        <Text style={styles.bulletPoint}>• AI models may be updated periodically, which could change the nature of predictions and insights provided.</Text>

        <Text style={styles.sectionTitle}>4. User Accounts &amp; Responsibilities</Text>
        <Text style={styles.paragraph}>
          You are responsible for safeguarding your account credentials and for all activities under your account. You must notify us immediately of any unauthorised access. You agree to provide accurate, current, and complete information during registration and to keep your profile up to date.
        </Text>

        <Text style={styles.sectionTitle}>5. Acceptable Use &amp; User Conduct Rules</Text>
        <Text style={styles.paragraph}>
          By using F365, you agree to the following rules of conduct. Violation of any of these rules constitutes a breach of these Terms and may result in termination of your account:
        </Text>
        <Text style={styles.subSectionTitle}>5.1 Prohibited Activities</Text>
        <Text style={styles.bulletPoint}>• Providing false, misleading, or fraudulent information during registration or while using the App.</Text>
        <Text style={styles.bulletPoint}>• Attempting to reverse-engineer, decompile, or disassemble the App or its AI systems.</Text>
        <Text style={styles.bulletPoint}>• Using automated tools, bots, or scripts to access, scrape, or interact with the App.</Text>
        <Text style={styles.bulletPoint}>• Sharing, selling, or redistributing your account access or activation codes to third parties.</Text>
        <Text style={styles.bulletPoint}>• Deliberately inputting false health data to manipulate AI predictions or outputs for malicious purposes.</Text>
        <Text style={styles.bulletPoint}>• Using the App to harass, abuse, or send harmful content to other users (e.g., via partner sharing features).</Text>
        <Text style={styles.bulletPoint}>• Attempting to gain unauthorised access to other users&apos; data, accounts, or any part of our systems.</Text>
        <Text style={styles.bulletPoint}>• Using the App for any unlawful purpose or in violation of applicable laws and regulations.</Text>
        <Text style={styles.bulletPoint}>• Intentionally exploiting bugs, glitches, or vulnerabilities in the App rather than reporting them.</Text>
        <Text style={styles.bulletPoint}>• Misrepresenting AI-generated content as professional medical advice to others.</Text>

        <Text style={styles.subSectionTitle}>5.2 Data Integrity</Text>
        <Text style={styles.paragraph}>
          The accuracy of AI-generated insights depends on the integrity of data you provide. While accidental errors are understood, deliberately manipulating data to produce misleading outputs — and then attributing fault to the App — is considered a breach of these Terms.
        </Text>

        <Text style={styles.sectionTitle}>6. User Content &amp; Data</Text>
        <Text style={styles.paragraph}>
          You retain all rights to the data you input into F365. By using our service, you grant us a limited licence to use, store, and process this information solely to provide, maintain, and improve our services. We will not sell your personal health data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The F365 App, including its original content, features, functionality, AI models, branding, and design, is owned by F365 and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>8. Subscription &amp; Activation</Text>
        <Text style={styles.paragraph}>
          Certain premium features require an active subscription or activation code. Subscription terms, pricing, and renewal policies are presented at the time of purchase. Activation codes are single-use and non-transferable unless expressly stated otherwise.
        </Text>

        <Text style={styles.sectionTitle}>9. Termination</Text>
        <Text style={styles.paragraph}>
          We may suspend or terminate your account in the following circumstances:
        </Text>
        <Text style={styles.bulletPoint}>• Violation of any Acceptable Use rules outlined in Section 5 above.</Text>
        <Text style={styles.bulletPoint}>• Repeated or deliberate misuse of AI features, including manipulating data to generate false outputs and blaming the App for inaccurate results.</Text>
        <Text style={styles.bulletPoint}>• Sharing, reselling, or fraudulently using activation codes or subscription access.</Text>
        <Text style={styles.bulletPoint}>• Attempting to access, copy, or exploit other users&apos; personal or health data.</Text>
        <Text style={styles.bulletPoint}>• Using the App in a manner that poses a security risk to our systems or other users.</Text>
        <Text style={styles.bulletPoint}>• Any activity that violates applicable local, national, or international laws.</Text>
        <Text style={styles.paragraph}>
          Before termination, we will make reasonable efforts to notify you and provide an opportunity to remedy the breach where appropriate, except in cases of severe violations (e.g., data theft, fraud) where immediate suspension is necessary to protect our users and systems.
        </Text>
        <Text style={styles.paragraph}>
          Upon termination, you may request a copy of your personal data within 30 days. After this period, your data may be permanently deleted in accordance with our data retention policy.
        </Text>

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          F365 is operated by ACHS Pty Ltd (ABN 37 679 506 551), a small early-stage startup registered in Victoria, Australia. We are a micro-business with limited resources, and our App is provided in good faith as a wellness tool — not as a medical device or professional health service.
        </Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by applicable law, ACHS Pty Ltd, its directors, employees, partners, agents, suppliers, or affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </Text>
        <Text style={styles.bulletPoint}>• Your access to, use of, or inability to access or use the App.</Text>
        <Text style={styles.bulletPoint}>• Any AI-generated content, predictions, or recommendations provided by the App. All insights, predictions, cycle forecasts, mood analyses, health tips, and personalised recommendations within F365 are generated by artificial intelligence and are not reviewed, verified, or endorsed by medical professionals. They are probabilistic estimates — not diagnoses, prescriptions, or guarantees.</Text>
        <Text style={styles.bulletPoint}>• Decisions made based on information provided by the App, including fertility or health-related decisions.</Text>
        <Text style={styles.bulletPoint}>• Unauthorised access to or alteration of your data.</Text>
        <Text style={styles.bulletPoint}>• Software bugs, glitches, downtime, or technical issues. As an early-stage product, the App may contain bugs or imperfections. We work continuously to improve reliability, but the App is provided &quot;as-is&quot; and &quot;as-available.&quot; The existence of software defects does not constitute grounds for compensation claims.</Text>

        <Text style={styles.subSectionTitle}>10.1 Cap on Liability</Text>
        <Text style={styles.paragraph}>
          To the fullest extent permitted by law, our total aggregate liability to you for any and all claims arising out of or relating to the use of the App shall not exceed the amount you have actually paid to ACHS Pty Ltd in the twelve (12) months preceding the claim, or AUD $50, whichever is greater.
        </Text>

        <Text style={styles.subSectionTitle}>10.2 No Exploitation of Software Defects</Text>
        <Text style={styles.paragraph}>
          ACHS Pty Ltd is a minor startup operating with limited resources. Users acknowledge that software may contain bugs, produce unexpected outputs, or experience intermittent issues. You agree not to:
        </Text>
        <Text style={styles.bulletPoint}>• Deliberately exploit, document, or catalogue software bugs or AI inaccuracies for the purpose of building a compensation or legal claim against us.</Text>
        <Text style={styles.bulletPoint}>• Intentionally use the App in a manner designed to produce errors or misleading AI outputs and then attribute fault or liability to the App or ACHS Pty Ltd.</Text>
        <Text style={styles.bulletPoint}>• Make fraudulent, exaggerated, or bad-faith claims for refunds, damages, or compensation based on the inherent limitations of AI-generated content or normal software imperfections.</Text>
        <Text style={styles.paragraph}>
          We encourage responsible bug reporting at hello@f365.app. Genuine reports help us improve. However, weaponising defects for personal gain is a violation of these Terms and may result in account termination.
        </Text>

        <Text style={styles.subSectionTitle}>10.3 Assumption of Risk</Text>
        <Text style={styles.paragraph}>
          By using F365, you expressly acknowledge and accept that: (a) all AI-generated content is algorithmic in nature and may be inaccurate; (b) you bear sole responsibility for any decisions made based on App content; (c) the App is not a substitute for professional medical, psychological, or relationship advice; and (d) ACHS Pty Ltd shall not be held responsible for outcomes arising from reliance on AI-generated insights.
        </Text>

        <Text style={styles.paragraph}>
          Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including the Australian Consumer Law or equivalent consumer protection legislation in your jurisdiction.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. Material changes will be communicated at least 30 days before they take effect via in-app notification or email. Continued use of the App after changes take effect constitutes acceptance of the updated Terms.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law &amp; Jurisdiction</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by and construed in accordance with the laws of the State of Victoria, Australia. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Victoria, Australia, unless otherwise required by mandatory consumer protection laws in your country of residence.
        </Text>
        <Text style={styles.paragraph}>
          F365 is operated by ACHS Pty Ltd (ABN 37 679 506 551), a business registered in Victoria, Australia. Australian Consumer Law (ACL) applies to all users within Australia, and nothing in these Terms is intended to exclude, restrict, or modify rights that cannot be excluded under the ACL or equivalent state and territory legislation.
        </Text>

        <Text style={styles.sectionTitle}>13. Consumer Rights &amp; Complaints</Text>
        <Text style={styles.paragraph}>
          We are committed to fair dealing and compliance with consumer protection laws in all jurisdictions where our App is available. Nothing in these Terms is intended to override your statutory rights.
        </Text>

        <Text style={styles.subSectionTitle}>13.1 Global Consumer Rights</Text>
        <Text style={styles.paragraph}>
          Regardless of your location, you have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Receive services as described and of acceptable quality.</Text>
        <Text style={styles.bulletPoint}>• Access, correct, or delete your personal data (subject to applicable data protection laws such as the Australian Privacy Act 1988, GDPR, CCPA, or equivalent in your jurisdiction).</Text>
        <Text style={styles.bulletPoint}>• Cancel your subscription and receive a proportionate refund where services have not been delivered as promised.</Text>
        <Text style={styles.bulletPoint}>• Lodge a complaint and receive a timely response.</Text>

        <Text style={styles.subSectionTitle}>13.2 Australia</Text>
        <Text style={styles.paragraph}>
          Under the Australian Consumer Law (ACL), our services come with guarantees that cannot be excluded. You are entitled to a replacement or refund for a major failure and compensation for any other reasonably foreseeable loss or damage. If the failure does not amount to a major failure, you are entitled to have the service corrected within a reasonable time.
        </Text>
        <Text style={styles.paragraph}>
          To lodge a complaint or dispute in Australia:
        </Text>
        <Text style={styles.bulletPoint}>• Contact us first at hello@f365.app with your complaint details.</Text>
        <Text style={styles.bulletPoint}>• If unresolved, you may contact the Australian Competition &amp; Consumer Commission (ACCC) at accc.gov.au or call 1300 302 502.</Text>
        <Text style={styles.bulletPoint}>• You may also contact your state or territory fair trading office or consumer affairs agency.</Text>

        <Text style={styles.subSectionTitle}>13.3 India</Text>
        <Text style={styles.paragraph}>
          Under the Consumer Protection Act, 2019, you have the right to be protected against unfair trade practices and to seek redress for deficient services. AI-generated content in this App is provided &quot;as-is&quot; and is clearly labelled as AI-generated; it does not constitute professional advice.
        </Text>
        <Text style={styles.paragraph}>
          To lodge a complaint or dispute in India:
        </Text>
        <Text style={styles.bulletPoint}>• Contact us first at hello@f365.app with your complaint details.</Text>
        <Text style={styles.bulletPoint}>• If unresolved, you may file a complaint with the appropriate Consumer Disputes Redressal Commission (District, State, or National) depending on the value of your claim.</Text>
        <Text style={styles.bulletPoint}>• You may also use the National Consumer Helpline (NCH) at 1800-11-4000 or file online at consumerhelpline.gov.in.</Text>
        <Text style={styles.bulletPoint}>• Complaints related to data or privacy may be directed to the relevant authority under the Digital Personal Data Protection Act, 2023.</Text>

        <Text style={styles.subSectionTitle}>13.4 New Zealand</Text>
        <Text style={styles.paragraph}>
          Under the Consumer Guarantees Act 1993, services must be carried out with reasonable care and skill, be fit for purpose, and be completed within a reasonable time. These guarantees apply to digital services including this App.
        </Text>
        <Text style={styles.paragraph}>
          To lodge a complaint or dispute in New Zealand:
        </Text>
        <Text style={styles.bulletPoint}>• Contact us first at hello@f365.app with your complaint details.</Text>
        <Text style={styles.bulletPoint}>• If unresolved, you may contact the Commerce Commission at comcom.govt.nz.</Text>
        <Text style={styles.bulletPoint}>• You may also seek resolution through the Disputes Tribunal (for claims up to $30,000) or the relevant District Court.</Text>
        <Text style={styles.bulletPoint}>• For privacy-related complaints, contact the Office of the Privacy Commissioner at privacy.org.nz.</Text>

        <Text style={styles.subSectionTitle}>13.5 How to File a Complaint</Text>
        <Text style={styles.paragraph}>
          We take complaints seriously and will engage in good faith to resolve genuine issues. For all complaints, we require the following process to be followed before any external escalation:
        </Text>
        <Text style={styles.bulletPoint}>1. Email us at hello@f365.app with the subject line &quot;Formal Complaint.&quot; You must include: your registered account email, a clear and specific description of the issue, any relevant screenshots or evidence, and the resolution you are seeking.</Text>
        <Text style={styles.bulletPoint}>2. We will acknowledge your complaint within 7 business days.</Text>
        <Text style={styles.bulletPoint}>3. We aim to resolve complaints within 30 business days. Complex matters may require additional time, and we will keep you informed of progress.</Text>
        <Text style={styles.bulletPoint}>4. If you are not satisfied with our response after completing steps 1–3, you may escalate to the relevant consumer protection authority in your jurisdiction as outlined above.</Text>

        <Text style={styles.subSectionTitle}>13.6 Good Faith &amp; Fair Dealing</Text>
        <Text style={styles.paragraph}>
          ACHS Pty Ltd is an early-stage startup building F365 with limited resources and in good faith. We ask that all users engage with us in the same spirit. You acknowledge that:
        </Text>
        <Text style={styles.bulletPoint}>• F365 is a wellness tool powered by AI. All insights, predictions, recommendations, mood analyses, and health tips are generated by artificial intelligence algorithms — not by doctors, therapists, or certified professionals. AI outputs are inherently probabilistic and may be inaccurate.</Text>
        <Text style={styles.bulletPoint}>• As a small startup, we are continuously improving the App. The presence of software bugs, UI imperfections, or AI inaccuracies does not indicate negligence or a breach of duty and does not entitle users to compensation.</Text>
        <Text style={styles.bulletPoint}>• Filing frivolous, vexatious, or bad-faith complaints — including complaints designed to extract financial compensation by exploiting known software limitations or AI inaccuracies — is a breach of these Terms. We reserve the right to terminate accounts engaged in such conduct.</Text>
        <Text style={styles.bulletPoint}>• Rogue or malicious behaviour, including publicly defaming the App or business based on mischaracterised AI outputs, threatening legal action as leverage for refunds or compensation beyond what is paid, or coordinating complaint campaigns — will be treated as a material breach of these Terms.</Text>
        <Text style={styles.paragraph}>
          We are committed to building a quality product and treating our users fairly. We ask only that you extend the same courtesy to us.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at:
        </Text>
        <Text style={styles.paragraph}>
          ACHS Pty Ltd{"\n"}ABN 37 679 506 551{"\n"}Victoria, Australia
        </Text>
        <Text style={styles.contactInfo}>hello@f365.app</Text>
        <Text style={styles.contactInfo}>f365.app</Text>
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
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 28,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    marginTop: 20,
  },
  paragraph: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 14,
  },
  bulletPoint: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  contactInfo: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 8,
    marginBottom: 32,
  },
});
