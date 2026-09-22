import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCycleStore } from '../store/cycle-store';
import { useUserStore } from '../store/user-store';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { FileText, Mail, Download, CheckCircle, Database } from 'lucide-react-native';
import { logExportData } from '../utils/audit-logger';
import { ExportDisclaimerFooter } from '../components/DisclaimerBanner';
import { generateRichDummyData } from '../utils/mock-data';
import { generatePdfHtml } from '../utils/pdf-html-generator';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as MailComposer from 'expo-mail-composer';

export default function DataExportScreen() {
  const { user, updateUser } = useUserStore();
  const { exportData, cycles, predictions, insights, healthAnalysis } = useCycleStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [dummyData, setDummyData] = useState<ReturnType<typeof generateRichDummyData> | null>(null);
  const [isLoadingDummy, setIsLoadingDummy] = useState(false);

  const loadDummyData = () => {
    setIsLoadingDummy(true);
    try {
      const data = generateRichDummyData();
      setDummyData(data);
      Alert.alert(
        'Demo Data Loaded',
        'Rich demonstration data has been loaded. You can now export a comprehensive PDF report with analytics and insights.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error loading dummy data:', error);
      Alert.alert('Error', 'Failed to load demonstration data.');
    } finally {
      setIsLoadingDummy(false);
    }
  };

  const getHtml = () => {
    return generatePdfHtml(
      { cycles, predictions, insights, healthAnalysis, dummyData },
      !!dummyData
    );
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const data = exportData();
      if (Platform.OS === 'web') {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'f365_export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        logExportData(user.id, 'cycle data');
        updateUser({ lastDataExport: new Date().toISOString() });
        Alert.alert("Export Successful", "Your data has been downloaded successfully.");
      } else {
        const FileSystem = await import('expo-file-system');
        const documentDirectory = (FileSystem as any).documentDirectory as string | null;
        if (!documentDirectory) throw new Error('File system not available');
        const fileUri = documentDirectory + 'f365_export.json';
        await (FileSystem as any).writeAsStringAsync(fileUri, data);
        logExportData(user.id, 'cycle data');
        updateUser({ lastDataExport: new Date().toISOString() });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export F365 Data', UTI: 'public.json' });
        } else {
          Alert.alert("Sharing Not Available", "Sharing is not available on this device.");
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert("Export Failed", "There was an error exporting your data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!user) return;
    setIsPdfExporting(true);
    try {
      const html = getHtml();
      if (Platform.OS === 'web') {
        try {
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = url;
          document.body.appendChild(iframe);
          
          iframe.onload = () => {
            try {
              iframe.contentWindow?.print();
            } catch (printErr) {
              console.warn('Iframe print failed, trying download fallback:', printErr);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'f365_report.html';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            setTimeout(() => {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(url);
            }, 2000);
          };
          
          logExportData(user.id, 'pdf report');
          updateUser({ lastDataExport: new Date().toISOString() });
          Alert.alert('PDF Ready', 'Your report is being prepared for printing. Use your browser\'s print dialog to save as PDF.');
        } catch (webErr) {
          console.error('Web PDF export error:', webErr);
          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'f365_report.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          logExportData(user.id, 'pdf report');
          updateUser({ lastDataExport: new Date().toISOString() });
          Alert.alert('Report Downloaded', 'Your report has been downloaded as an HTML file. Open it in your browser and use Print > Save as PDF.');
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        console.log('[PDF Export] File created at:', uri);
        logExportData(user.id, 'pdf report');
        updateUser({ lastDataExport: new Date().toISOString() });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export F365 Report', UTI: 'com.adobe.pdf' });
        } else {
          Alert.alert('PDF Created', 'Your PDF report has been generated successfully.');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert("PDF Export Failed", "There was an error generating your PDF report. Please try again.");
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleEmailReport = async () => {
    if (!user) return;
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setIsPdfExporting(true);
    try {
      const html = getHtml();
      if (Platform.OS === 'web') {
        Alert.alert('Email Not Supported', 'Email functionality is not available on web. Please use the PDF download option instead.');
        setIsPdfExporting(false);
        return;
      }
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Email Not Available', 'Email is not configured on this device. Please set up an email account first.');
        setIsPdfExporting(false);
        return;
      }
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const result = await MailComposer.composeAsync({
        recipients: [email],
        subject: 'Your F365 Health Report',
        body: `Hello,\n\nPlease find attached your F365 health report generated on ${new Date().toLocaleDateString()}.\n\nBest regards,\nF365 Team`,
        attachments: [uri],
      });
      if (result.status === MailComposer.MailComposerStatus.SENT) {
        logExportData(user.id, 'email report');
        updateUser({ lastDataExport: new Date().toISOString() });
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert("Email Failed", "There was an error preparing your email. Please try again.");
    } finally {
      setIsPdfExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Export Your Data',
          headerBackVisible: true,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <Text style={styles.title}>Your Data Privacy</Text>
          <Text style={styles.description}>
            F365 is committed to protecting your privacy and giving you control over your data.
            You can export a copy of all your data at any time.
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Export Options</Text>

        <Card style={styles.exportCard}>
          <View style={styles.exportOption}>
            <View style={styles.exportIconContainer}>
              <FileText size={24} color={Colors.primary} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>PDF Health Report</Text>
              <Text style={styles.exportDescription}>
                Download a beautifully formatted PDF report of your cycle history and predictions.
              </Text>
            </View>
          </View>
          <Button title="Download PDF" onPress={handleExportPdf} disabled={isPdfExporting} style={styles.exportButton} />
          {isPdfExporting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Generating PDF...</Text>
            </View>
          )}
        </Card>

        <Card style={styles.exportCard}>
          <View style={styles.exportOption}>
            <View style={[styles.exportIconContainer, { backgroundColor: Colors.accent + '20' }]}>
              <Mail size={24} color={Colors.accent} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>Email Report</Text>
              <Text style={styles.exportDescription}>
                Send the PDF report directly to your email address.
              </Text>
            </View>
          </View>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email address"
            placeholderTextColor={Colors.subtext}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            title={emailSent ? "Email Sent!" : "Send to Email"}
            onPress={handleEmailReport}
            disabled={isPdfExporting || emailSent}
            style={[styles.exportButton, emailSent ? styles.successButton : undefined] as any}
          />
          {emailSent && (
            <View style={styles.successContainer}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.successText}>Report sent successfully!</Text>
            </View>
          )}
        </Card>

        <Card style={styles.exportCard}>
          <View style={styles.exportOption}>
            <View style={[styles.exportIconContainer, { backgroundColor: Colors.secondary + '20' }]}>
              <Download size={24} color={Colors.secondary} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>Raw Data Export</Text>
              <Text style={styles.exportDescription}>
                Export all your cycle data as a JSON file for backup or analysis.
              </Text>
            </View>
          </View>
          <Button title="Export JSON Data" variant="outline" onPress={handleExportData} disabled={isExporting} style={styles.exportButton} />
          {isExporting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Preparing your data...</Text>
            </View>
          )}
        </Card>

        <Text style={styles.lastExportText}>
          {user?.lastDataExport
            ? `Last export: ${new Date(user.lastDataExport).toLocaleDateString()}`
            : "You haven't exported your data yet"}
        </Text>

        <Card style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Australian Privacy Act Compliance</Text>
          <Text style={styles.privacyText}>
            F365 is designed to comply with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs). Your data is encrypted, stored securely, and handled in accordance with APP 11 (security of personal information). You may access your data (APP 12) or request correction or deletion (APP 13) at any time.
          </Text>
          <Text style={styles.privacyTitle}>How We Use Your Data</Text>
          <Text style={styles.privacyText}>
            Your data is used only to provide you with personalized insights and predictions.
            We do not sell or share your data with third parties without your explicit consent.
          </Text>
          <Button title="View Privacy Policy" variant="outline" onPress={() => router.push('/privacy-policy' as any)} style={styles.privacyButton} />
        </Card>

        <Card style={styles.exportCard}>
          <View style={styles.exportOption}>
            <View style={[styles.exportIconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
              <Database size={24} color="#8B5CF6" />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>Load Demo Data</Text>
              <Text style={styles.exportDescription}>
                Load rich sample data to preview comprehensive PDF reports with analytics, insights, and health analysis.
              </Text>
            </View>
          </View>
          <Button
            title={dummyData ? "Demo Data Loaded ✓" : "Load Demo Data"}
            variant="outline"
            onPress={loadDummyData}
            disabled={isLoadingDummy || !!dummyData}
            style={styles.exportButton}
          />
          {isLoadingDummy && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading demo data...</Text>
            </View>
          )}
          {dummyData && (
            <Text style={styles.demoDataNote}>
              Demo data loaded! Export PDF to see analytics, insights, mood patterns, and symptom trends.
            </Text>
          )}
        </Card>

        <ExportDisclaimerFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  infoCard: { padding: 16, marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold' as const, color: Colors.text, marginBottom: 8 },
  description: { fontSize: 16, color: Colors.text, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' as const, color: Colors.text, marginBottom: 16 },
  exportCard: { padding: 16, marginBottom: 16 },
  exportOption: { flexDirection: 'row' as const, marginBottom: 16 },
  exportIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '20', justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 16 },
  exportInfo: { flex: 1 },
  exportTitle: { fontSize: 16, fontWeight: 'bold' as const, color: Colors.text, marginBottom: 4 },
  exportDescription: { fontSize: 14, color: Colors.subtext, lineHeight: 20 },
  exportButton: { marginTop: 8 },
  successButton: { backgroundColor: Colors.success },
  emailInput: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.text, marginBottom: 8 },
  loadingContainer: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 16 },
  loadingText: { fontSize: 14, color: Colors.subtext, marginLeft: 8 },
  successContainer: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 12 },
  successText: { fontSize: 14, color: Colors.success, marginLeft: 8, fontWeight: '600' as const },
  lastExportText: { fontSize: 12, color: Colors.subtext, textAlign: 'center' as const, marginBottom: 24 },
  privacyCard: { padding: 16, marginTop: 8 },
  privacyTitle: { fontSize: 16, fontWeight: 'bold' as const, color: Colors.text, marginBottom: 8, marginTop: 16 },
  privacyText: { fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: 8 },
  privacyButton: { marginTop: 16 },
  demoDataNote: { fontSize: 13, color: '#8B5CF6', textAlign: 'center' as const, marginTop: 12, fontStyle: 'italic' as const },
});
