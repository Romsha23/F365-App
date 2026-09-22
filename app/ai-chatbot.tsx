import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSubscriptionStore } from '../store/subscription-store';
import { useCycleStore } from '../store/cycle-store';
import { SubscriptionPaywall } from '../components/SubscriptionPaywall';
import Colors from '../constants/colors';
import { Send, Bot, User, Sparkles, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useAIConsent } from '../hooks/use-ai-consent';
import { useUserStore } from '../store/user-store';
import { logAIChatInteraction } from '../utils/ai-audit-logger';
import { DisclaimerBanner, MASTER_DISCLAIMER, AIExplanationFooter } from '../components/DisclaimerBanner';
import { ConfidenceIndicator } from '../components/ConfidenceBadge';
import { CrisisSafetyFooter } from '../components/CrisisSafetyFooter';

type MessageType = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const QUICK_SUGGESTIONS = [
  'How am I feeling today based on my cycle?',
  'What symptoms are common in my cycle phase?',
  'When is my next period?',
  'Tips for managing PMS',
  'Am I in my fertile window?',
  'Why do I have cravings?',
];

export default function AIChatbotScreen() {
  const { canAccessFeature } = useSubscriptionStore();
  const { cycles, predictions } = useCycleStore();
  const { requireAIConsent } = useAIConsent();
  const { user } = useUserStore();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);
  const [messageConfidence, setMessageConfidence] = useState<Record<string, number>>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const hasPremium = canAccessFeature('aiInsights');

  useEffect(() => {
    if (hasPremium && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content:
            "Hi! I'm your AI health assistant. I can help you understand your menstrual cycle, symptoms, fertility, and provide personalized health tips based on your tracked data. How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [hasPremium, messages.length]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  if (!hasPremium) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'AI Health Assistant',
            headerStyle: {
              backgroundColor: Colors.background,
            },
          }}
        />
        <SubscriptionPaywall
          feature="AI Health Assistant"
          description="Get personalized health guidance, cycle predictions, and AI-powered insights based on your tracked data. The AI chatbot understands your symptoms, mood, and cycle phase to provide context-aware advice."
        />
      </View>
    );
  }

  const getCycleContext = () => {
    let context = '';
    
    if (cycles && cycles.length > 0) {
      const lastCycle = cycles[cycles.length - 1];
      const startDate = new Date(lastCycle.startDate);
      const today = new Date();
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      context += `Current cycle day: ${daysSinceStart + 1}. `;
      
      const last7Days = cycles.flatMap(c => 
        c.days.filter(day => {
          const dayDate = new Date(day.date);
          const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return dayDate >= sevenDaysAgo;
        })
      );
      
      if (last7Days.length > 0) {
        const recentSymptoms = last7Days
          .flatMap(day => day.symptoms || [])
          .filter((s, i, arr) => arr.indexOf(s) === i)
          .slice(0, 5);
        
        if (recentSymptoms.length > 0) {
          context += `Recent symptoms: ${recentSymptoms.join(', ')}. `;
        }
        
        const recentMoods = last7Days
          .map(day => day.mood)
          .filter(m => m)
          .filter((m, i, arr) => arr.indexOf(m) === i)
          .slice(0, 3);
        
        if (recentMoods.length > 0) {
          context += `Recent moods: ${recentMoods.join(', ')}. `;
        }
      }
    }
    
    if (predictions) {
      const nextPeriod = new Date(predictions.nextPeriodDate);
      const today = new Date();
      const daysUntil = Math.ceil(
        (nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntil > 0) {
        context += `Next period predicted in ${daysUntil} days. `;
      }
      
      const fertileStart = new Date(predictions.fertileWindowStart);
      const fertileEnd = new Date(predictions.fertileWindowEnd);
      
      if (today >= fertileStart && today <= fertileEnd) {
        context += `Currently in fertile window. `;
      }
    }
    
    return context;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    if (!requireAIConsent()) {
      return;
    }

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const cycleContext = getCycleContext();
      
      const systemPrompt = `You are a compassionate women's health AI assistant specializing in menstrual health, reproductive health, and cycle tracking. You provide evidence-based advice while being empathetic and supportive.

Context about the user:
${cycleContext || 'No cycle data available yet.'}

Guidelines:
- Provide clear, actionable health advice
- Be empathetic and supportive
- Reference the user's current cycle phase when relevant
- Explain symptoms in the context of their cycle
- Recommend seeing a doctor for serious concerns
- Keep responses concise (2-3 paragraphs max)
- Use a warm, friendly tone

Remember: You're a health assistant, not a replacement for medical care. Always encourage users to consult healthcare professionals for serious concerns.`;

      const conversationHistory = messages.slice(-5).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      conversationHistory.push({
        role: 'user' as const,
        content: text.trim(),
      });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 30000)
      );

      const result = await Promise.race([
        generateText({
          messages: [
            { role: 'user', content: `[System Instructions]: ${systemPrompt}` },
            ...conversationHistory,
          ] as { role: 'user' | 'assistant'; content: string }[],
        }),
        timeoutPromise,
      ]);

      const aiResponse = result || "I'm having trouble responding right now. Please try again.";
      
      const confidence = cycleContext ? 0.75 : 0.5;

      if (user?.uniqueId) {
        logAIChatInteraction(user.uniqueId, text.trim(), aiResponse.length);
      }

      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessageConfidence(prev => ({ ...prev, [assistantMessage.id]: confidence }));
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (suggestion: string) => {
    if (!requireAIConsent()) {
      return;
    }
    void sendMessage(suggestion);
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hi! I'm your AI health assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'AI Health Assistant',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerRight: () => (
            <TouchableOpacity onPress={startNewConversation} style={styles.headerButton}>
              <Plus size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {!disclaimerDismissed && (
            <DisclaimerBanner
              type="warning"
              message={MASTER_DISCLAIMER}
              dismissible={true}
              onDismiss={() => setDisclaimerDismissed(true)}
              style={styles.topDisclaimer}
            />
          )}
          {messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <View style={styles.messageHeader}>
                  {message.role === 'assistant' ? (
                    <View style={styles.botIcon}>
                      <Bot size={16} color={Colors.primary} />
                    </View>
                  ) : (
                    <View style={styles.userIcon}>
                      <User size={16} color={Colors.white} />
                    </View>
                  )}
                  <Text style={styles.messageRole}>
                    {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                  ]}
                >
                  {message.content}
                </Text>
                {message.role === 'assistant' && message.id !== '1' && (
                  <>
                    <ConfidenceIndicator 
                      confidence={messageConfidence[message.id] || 0.5}
                      dataPoints={cycles.length > 0 ? cycles.flatMap(c => c.days).length : 0}
                      compact={true}
                      style={styles.confidenceBadge}
                    />
                    <AIExplanationFooter style={styles.messageFooter} />
                  </>
                )}
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}

          {messages.length <= 1 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Sparkles size={16} color={Colors.primary} />
                <Text style={styles.suggestionsTitle}>Quick Questions</Text>
              </View>
              {QUICK_SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => handleQuickSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <CrisisSafetyFooter
            showEmergencyResources={true}
            showMedicalDisclaimer={true}
            gentleMessage="Remember: I'm an AI assistant, not a replacement for professional medical care. If you're experiencing a medical emergency or mental health crisis, please reach out to emergency services or a crisis helpline."
          />
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about your cycle..."
            placeholderTextColor={Colors.subtext}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  assistantMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: Colors.primary,
  },
  assistantMessage: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  botIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.subtext,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  assistantMessageText: {
    color: Colors.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.subtext,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 6,
  },
  suggestionButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  topDisclaimer: {
    marginBottom: 16,
  },
  messageFooter: {
    marginTop: 8,
  },
  confidenceBadge: {
    marginTop: 8,
  },
});
