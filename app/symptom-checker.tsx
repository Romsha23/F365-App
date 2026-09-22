import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity
} from 'react-native';
import { Stack } from 'expo-router';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { AlertCircle, Stethoscope, Sparkles, AlertTriangle } from 'lucide-react-native';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useCycleStore } from '../store/cycle-store';
import { useUserStore } from '../store/user-store';
import { useSymptomCheckerStore } from '../store/symptom-checker-store';

interface AnalysisResult {
  symptom: string;
  analysis: string;
  timestamp: Date;
}

export default function SymptomCheckerScreen() {
  const [symptomInput, setSymptomInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  
  const { cycles } = useCycleStore();
  const { user } = useUserStore();
  const { history: persistedHistory, addAnalysis } = useSymptomCheckerStore();

  const history: AnalysisResult[] = useMemo(() => 
    persistedHistory.map(h => ({
      symptom: h.symptom,
      analysis: h.analysis,
      timestamp: new Date(h.timestamp),
    })),
  [persistedHistory]);
  
  const { cycleDay, phase } = useMemo(() => {
    if (!cycles || cycles.length === 0) {
      return { cycleDay: null, phase: null };
    }
    
    const latestCycle = cycles[cycles.length - 1];
    if (!latestCycle || !latestCycle.startDate) {
      return { cycleDay: null, phase: null };
    }
    
    const startDate = new Date(latestCycle.startDate);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const day = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    let currentPhase = 'Unknown';
    if (day <= 5) {
      currentPhase = 'Menstrual';
    } else if (day <= 13) {
      currentPhase = 'Follicular';
    } else if (day <= 17) {
      currentPhase = 'Ovulation';
    } else {
      currentPhase = 'Luteal';
    }
    
    return { cycleDay: day, phase: currentPhase };
  }, [cycles]);

  const handleAnalyzeSymptom = async () => {
    if (!symptomInput.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setCurrentAnalysis(null);

    try {
      const contextInfo = `
Current Cycle Information:
- Cycle Day: ${cycleDay || 'Unknown'}
- Current Phase: ${phase || 'Unknown'}
- Average Cycle Length: ${user?.averageCycleLength || 28} days
- Average Period Length: ${user?.averagePeriodLength || 5} days
${user?.commonSymptoms && user.commonSymptoms.length > 0 ? `- Common Symptoms: ${user.commonSymptoms.join(', ')}` : ''}
`;

      const prompt = `You are a menstrual health AI assistant. A user is experiencing the following symptom:

"${symptomInput}"

${contextInfo}

Please provide a comprehensive analysis that includes:
1. **Possible Cycle-Related Causes**: Explain how this symptom might relate to their current menstrual cycle phase
2. **Common Explanations**: What are typical, non-concerning reasons for this symptom
3. **When to See a Doctor**: Clear guidelines on when this symptom requires medical attention
4. **Self-Care Tips**: Practical advice for managing this symptom at home

Important guidelines:
- Be empathetic and informative
- Do not diagnose medical conditions
- Always encourage seeing a healthcare provider for concerning symptoms
- Relate the symptom to menstrual cycle phases when relevant
- Use clear, accessible language
- Format the response in a well-structured, easy-to-read manner

Keep the response concise but thorough (aim for 250-400 words).`;

      const analysisText = await generateText(prompt);

      const result: AnalysisResult = {
        symptom: symptomInput,
        analysis: analysisText,
        timestamp: new Date(),
      };

      setCurrentAnalysis(result);
      addAnalysis(result.symptom, result.analysis);
      setSymptomInput('');
    } catch (error) {
      console.error('Error analyzing symptom:', error);
      setCurrentAnalysis({
        symptom: symptomInput,
        analysis: 'Sorry, I encountered an error analyzing your symptom. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalysis = (result: AnalysisResult) => {
    const sections = result.analysis.split('\n\n');
    
    return (
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Sparkles size={20} color={Colors.primary} />
          <Text style={styles.analysisTitle}>AI Analysis</Text>
        </View>
        
        <View style={styles.symptomBadge}>
          <AlertCircle size={16} color={Colors.primary} />
          <Text style={styles.symptomText}>&quot;{result.symptom}&quot;</Text>
        </View>

        <View style={styles.analysisContent}>
          {sections.map((section, index) => {
            if (section.trim()) {
              const lines = section.split('\n');
              return (
                <View key={index} style={styles.section}>
                  {lines.map((line, lineIndex) => {
                    if (line.includes('**') && line.includes(':')) {
                      const cleanLine = line.replace(/\*\*/g, '');
                      return (
                        <Text key={lineIndex} style={styles.sectionTitle}>
                          {cleanLine}
                        </Text>
                      );
                    }
                    return (
                      <Text key={lineIndex} style={styles.sectionText}>
                        {line}
                      </Text>
                    );
                  })}
                </View>
              );
            }
            return null;
          })}
        </View>

        <View style={styles.disclaimerBox}>
          <AlertTriangle size={16} color={Colors.warning} />
          <Text style={styles.disclaimerText}>
            This is AI-generated information and not medical advice. Always consult a healthcare professional for medical concerns.
          </Text>
        </View>

        <Text style={styles.timestamp}>
          {result.timestamp.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen 
        options={{
          title: 'AI Symptom Checker',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Stethoscope size={24} color={Colors.primary} />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.infoText}>
            Describe any symptom you&apos;re experiencing, and our AI will help you understand possible cycle-related causes and when to seek medical care.
          </Text>
          
          {cycleDay !== null && phase && (
            <View style={styles.cycleInfo}>
              <Text style={styles.cycleInfoLabel}>Current Status</Text>
              <View style={styles.cycleInfoRow}>
                <Text style={styles.cycleInfoText}>Day {cycleDay} • {phase}</Text>
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.inputCard}>
          <Text style={styles.inputLabel}>Describe your symptom</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., I have severe headaches on the left side..."
            placeholderTextColor={Colors.subtext}
            value={symptomInput}
            onChangeText={setSymptomInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isAnalyzing}
          />
          
          <Button
            title={isAnalyzing ? 'Analyzing...' : 'Analyze Symptom'}
            onPress={handleAnalyzeSymptom}
            disabled={!symptomInput.trim() || isAnalyzing}
            loading={isAnalyzing}
            fullWidth
            icon={<Sparkles size={18} color={Colors.white} />}
          />
        </Card>

        {currentAnalysis && (
          <Card style={styles.resultCard}>
            {renderAnalysis(currentAnalysis)}
          </Card>
        )}

        {history.length > 0 && !currentAnalysis && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Analyses</Text>
            {history.map((item, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => setCurrentAnalysis(item)}
                activeOpacity={0.7}
              >
                <Card style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <AlertCircle size={16} color={Colors.primary} />
                    <Text style={styles.historySymptom} numberOfLines={1}>
                      {item.symptom}
                    </Text>
                  </View>
                  <Text style={styles.historyTimestamp}>
                    {item.timestamp.toLocaleString()}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentAnalysis && history.length > 1 && (
          <TouchableOpacity 
            style={styles.viewHistoryButton}
            onPress={() => setCurrentAnalysis(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewHistoryText}>View Analysis History</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 32,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  cycleInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cycleInfoLabel: {
    fontSize: 12,
    color: Colors.subtext,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cycleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cycleInfoText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  inputCard: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    minHeight: 100,
  },
  resultCard: {
    marginBottom: 16,
  },
  analysisContainer: {
    gap: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  symptomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  symptomText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  analysisContent: {
    gap: 12,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'right',
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  historyCard: {
    marginBottom: 8,
    padding: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  historySymptom: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  historyTimestamp: {
    fontSize: 12,
    color: Colors.subtext,
  },
  viewHistoryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewHistoryText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
