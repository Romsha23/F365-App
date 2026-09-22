import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCycleStore } from '../../store/cycle-store';
import { useUserStore } from '../../store/user-store';
import { useSubscriptionStore } from '../../store/subscription-store';
import { SubscriptionPaywall } from '../../components/SubscriptionPaywall';
import { InsightCard } from '../../components/InsightCard';
import { PredictionCard } from '../../components/PredictionCard';
import { Button } from '../../components/Button';
import Colors from '../../constants/colors';
import { RefreshCw, Brain, AlertTriangle, Heart, Calendar, Lightbulb, MessageCircle } from 'lucide-react-native';
import { InsightType, PredictionsType, PredictionData } from '../../types/cycle';

const convertPredictionsToPredictionData = (predictions: PredictionsType): PredictionData => {
  const nextPeriodStart = predictions.nextPeriodDate;
  const nextPeriodEnd = new Date(new Date(nextPeriodStart).getTime() + (predictions.averagePeriodLength * 24 * 60 * 60 * 1000)).toISOString();
  const fertileStart = predictions.fertileWindowStart;
  const fertileEnd = predictions.fertileWindowEnd;
  const ovulationDate = new Date((new Date(fertileStart).getTime() + new Date(fertileEnd).getTime()) / 2).toISOString();
  
  const periodDays: string[] = [];
  const fertileWindowDays: string[] = [];
  
  for (let i = 0; i < predictions.averagePeriodLength; i++) {
    const date = new Date(nextPeriodStart);
    date.setDate(date.getDate() + i);
    periodDays.push(date.toISOString());
  }
  
  const fertileStartDate = new Date(fertileStart);
  const fertileEndDate = new Date(fertileEnd);
  const currentDate = new Date(fertileStartDate);
  
  while (currentDate <= fertileEndDate) {
    fertileWindowDays.push(currentDate.toISOString());
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    nextPeriodStart,
    nextPeriodEnd,
    nextFertileWindowStart: fertileStart,
    nextFertileWindowEnd: fertileEnd,
    nextOvulationDate: ovulationDate,
    confidence: predictions.confidence,
    periodDays,
    fertileWindowDays,
    ovulationDay: ovulationDate
  };
};

// Health Assistant Chat Component
const HealthAssistantChat = ({ isPro }: { isPro: boolean }) => {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    {
      role: 'assistant',
      content: "Hi there! I'm your health assistant. I can answer questions about your cycle, symptoms, and reproductive health. What would you like to know today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { cycles } = useCycleStore();
  const scrollViewRef = useRef<ScrollView>(null);

  if (!isPro) {
    return (
      <SubscriptionPaywall 
        feature="AI Health Assistant"
        description="Chat with your personal AI health assistant to get answers about your cycle, symptoms, and reproductive health. Get 24/7 support with Pro membership."
      />
    );
  }

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = { role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Prepare context about the user's cycle data
      const cycleContext = cycles && Array.isArray(cycles) && cycles.length > 0 
        ? `The user has tracked ${cycles.length} cycles. Their most recent period started on ${cycles[cycles.length-1].startDate}.` 
        : "The user hasn't tracked any cycles yet.";
      
      // Create the system message with medical context
      const systemMessage = {
        role: 'system',
        content: `You are a helpful health assistant specialized in menstrual and reproductive health. 
        Provide accurate, evidence-based information about menstrual cycles, symptoms, and reproductive health.
        Be supportive and informative, but avoid giving specific medical diagnoses.
        Always recommend consulting a healthcare provider for medical concerns.
        
        User context: ${cycleContext}`
      };
      
      // Make the API request
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: [
            systemMessage,
            ...messages.slice(-5), // Include last 5 messages for context
            userMessage
          ]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.completion };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
      // Scroll to bottom after new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Suggested questions the user might want to ask
  const suggestedQuestions = [
    "What causes menstrual cramps?",
    "How can I track my fertile window?",
    "Why is my period irregular?",
    "What symptoms are normal before my period?",
    "How can I manage PMS symptoms?",
    "What foods help with period pain?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <View style={chatStyles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={chatStyles.messagesContainer}
        contentContainerStyle={chatStyles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <View 
            key={index} 
            style={[
              chatStyles.messageBubble,
              message.role === 'user' ? chatStyles.userMessage : chatStyles.assistantMessage
            ]}
          >
            <Text style={[
              chatStyles.messageText,
              { color: message.role === 'user' ? Colors.white : Colors.text }
            ]}>
              {message.content}
            </Text>
          </View>
        ))}
        
        {isLoading && (
          <View style={chatStyles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={chatStyles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>
      
      {messages.length === 1 && (
        <View style={chatStyles.suggestedQuestionsContainer}>
          <Text style={chatStyles.suggestedTitle}>Suggested Questions:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={chatStyles.suggestedQuestionsScroll}
          >
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={chatStyles.suggestedQuestion}
                onPress={() => handleSuggestedQuestion(question)}
              >
                <Text style={chatStyles.suggestedQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={chatStyles.inputContainer}>
        <TextInput
          style={chatStyles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about your cycle or symptoms..."
          placeholderTextColor={Colors.inactive}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity 
          style={[
            chatStyles.sendButton,
            (!inputText.trim() || isLoading) && chatStyles.disabledSendButton
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={chatStyles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={chatStyles.disclaimer}>
        This AI assistant provides general information only, not medical advice.
        Always consult a healthcare provider for medical concerns.
      </Text>
    </View>
  );
};

export default function InsightsScreen() {
  const router = useRouter();
  const { 
    insights, 
    predictions, 
    healthAnalysis,
    generateInsights, 
    generatePredictions,
    generateHealthAnalysis,
    isLoading, 
    error,
    markInsightAsRead
  } = useCycleStore();
  const { user } = useUserStore();
  const { getSubscriptionInfo, canAccessFeature } = useSubscriptionStore();
  const subscriptionInfo = getSubscriptionInfo();
  const isPro = subscriptionInfo.isPro;
  const [activeTab, setActiveTab] = useState('insights');
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadRef = useRef(false);

  // Initialize data when component mounts - fixed to avoid state updates during render
  useEffect(() => {
    const initializeData = async () => {
      if (!initialLoadRef.current) {
        initialLoadRef.current = true;
        
        if (!insights || insights.length === 0) {
          try {
            await generateInsights();
          } catch (error) {
            console.error('Error generating insights:', error);
          }
        }
        
        if (!predictions) {
          try {
            await generatePredictions();
          } catch (error) {
            console.error('Error generating predictions:', error);
          }
        }
      }
    };
    
    initializeData();
  }, [insights, predictions, generateInsights, generatePredictions]);

  // Separate useEffect for health analysis - fixed to avoid state updates during render
  useEffect(() => {
    if (activeTab === 'health' && !healthAnalysis && !isLoading && initialLoadRef.current) {
      const loadHealthData = async () => {
        try {
          await generateHealthAnalysis();
        } catch (error) {
          console.error('Error generating health analysis:', error);
        }
      };
      
      loadHealthData();
    }
  }, [activeTab, healthAnalysis, isLoading, generateHealthAnalysis, initialLoadRef]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'insights') {
        await generateInsights(true);
      } else if (activeTab === 'predictions') {
        await generatePredictions(true);
      } else if (activeTab === 'health') {
        await generateHealthAnalysis();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInsightPress = (insight: InsightType) => {
    // Mark the insight as read
    if (!insight.read) {
      markInsightAsRead(insight.id);
    }
    
    // You could navigate to a detail screen here if needed
    // router.push({
    //   pathname: '/insight-details',
    //   params: { id: insight.id }
    // });
    
    // For now, just show an alert with the full insight
    Alert.alert(
      insight.title,
      insight.description,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderInsightsTab = () => {
    if (!isPro) {
      return (
        <SubscriptionPaywall 
          feature="AI Insights"
          description="Get personalized insights about your cycle patterns, mood correlations, and symptom predictions. Upgrade to Pro to unlock AI-powered insights that help you understand your body better."
        />
      );
    }

    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your cycle data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={Colors.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Try Again" 
            onPress={() => generateInsights(true)}
            style={styles.retryButton}
          />
        </View>
      );
    }

    if (!insights || insights.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Lightbulb size={48} color={Colors.primary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Insights Yet</Text>
          <Text style={styles.emptyText}>
            Continue tracking your cycle to receive personalized insights and recommendations.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {insights.map((insight) => (
          <InsightCard 
            key={insight.id} 
            insight={insight} 
            onPress={() => handleInsightPress(insight)}
          />
        ))}
      </ScrollView>
    );
  };

  const renderPredictionsTab = () => {
    if (!canAccessFeature('advancedAnalytics')) {
      return (
        <SubscriptionPaywall 
          feature="Advanced Predictions"
          description="Access detailed cycle predictions with higher accuracy, fertility tracking, and personalized forecasting. Upgrade to Pro for advanced analytics and prediction features."
        />
      );
    }

    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Calculating predictions...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={Colors.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Try Again" 
            onPress={() => generatePredictions(true)}
            style={styles.retryButton}
          />
        </View>
      );
    }

    if (!predictions) {
      return (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color={Colors.primary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Predictions Yet</Text>
          <Text style={styles.emptyText}>
            Continue tracking your cycle to receive accurate predictions for your next period and fertile window.
          </Text>
        </View>
      );
    }

    const predictionData = convertPredictionsToPredictionData(predictions);
    
    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PredictionCard predictions={predictionData} />
        
        <View style={styles.predictionAccuracy}>
          <Text style={styles.predictionAccuracyTitle}>Prediction Accuracy</Text>
          <View style={styles.accuracyBar}>
            <View 
              style={[
                styles.accuracyFill, 
                { width: `${((predictions.confidence || 0.75) * 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.accuracyText}>
            {Math.round((predictions.confidence || 0.75) * 100)}% confidence
          </Text>
          <Text style={styles.accuracyDescription}>
            This prediction is based on your historical cycle data and patterns. The more data you provide, the more accurate our predictions become.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderHealthTab = () => {
    if (!canAccessFeature('advancedAnalytics')) {
      return (
        <SubscriptionPaywall 
          feature="Health Analysis"
          description="Get comprehensive health analysis including hormonal balance insights, nutritional recommendations, and lifestyle tips tailored to your cycle. Unlock deeper analytics with Pro."
        />
      );
    }

    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing your health data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={Colors.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Try Again" 
            onPress={() => generateHealthAnalysis()}
            style={styles.retryButton}
          />
        </View>
      );
    }

    if (!healthAnalysis) {
      return (
        <View style={styles.emptyContainer}>
          <Heart size={48} color={Colors.primary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Health Analysis Coming Soon</Text>
          <Text style={styles.emptyText}>
            We are preparing your personalized health analysis based on your cycle data.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.healthCard}>
          <Text style={styles.healthCardTitle}>Cycle Health Summary</Text>
          <Text style={styles.healthCardText}>
            {typeof healthAnalysis.cycleSummary === 'object' 
              ? JSON.stringify(healthAnalysis.cycleSummary) 
              : healthAnalysis.cycleSummary || "No cycle summary available."}
          </Text>
        </View>

        {healthAnalysis.potentialConcerns && (
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Potential Health Considerations</Text>
            <Text style={styles.healthCardText}>
              {typeof healthAnalysis.potentialConcerns === 'object'
                ? JSON.stringify(healthAnalysis.potentialConcerns)
                : healthAnalysis.potentialConcerns}
            </Text>
            <Text style={styles.healthDisclaimer}>
              Note: This is not medical advice. Please consult with a healthcare provider for any concerns.
            </Text>
          </View>
        )}

        {healthAnalysis.hormonalBalance && (
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Hormonal Balance</Text>
            <Text style={styles.healthCardText}>
              {typeof healthAnalysis.hormonalBalance === 'object'
                ? JSON.stringify(healthAnalysis.hormonalBalance)
                : healthAnalysis.hormonalBalance}
            </Text>
          </View>
        )}

        {healthAnalysis.nutritionalRecommendations && (
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Nutritional Recommendations</Text>
            <Text style={styles.healthCardText}>
              {typeof healthAnalysis.nutritionalRecommendations === 'object'
                ? JSON.stringify(healthAnalysis.nutritionalRecommendations)
                : healthAnalysis.nutritionalRecommendations}
            </Text>
          </View>
        )}

        {healthAnalysis.lifestyleRecommendations && (
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Lifestyle Recommendations</Text>
            <Text style={styles.healthCardText}>
              {typeof healthAnalysis.lifestyleRecommendations === 'object'
                ? JSON.stringify(healthAnalysis.lifestyleRecommendations)
                : healthAnalysis.lifestyleRecommendations}
            </Text>
          </View>
        )}

        {healthAnalysis.stressManagement && (
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Stress Management</Text>
            <Text style={styles.healthCardText}>
              {typeof healthAnalysis.stressManagement === 'object'
                ? JSON.stringify(healthAnalysis.stressManagement)
                : healthAnalysis.stressManagement}
            </Text>
          </View>
        )}

        {healthAnalysis.fertilityInsights && (
          <View style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>Fertility Insights</Text>
            <Text style={styles.healthCardText}>
              {typeof healthAnalysis.fertilityInsights === 'object'
                ? JSON.stringify(healthAnalysis.fertilityInsights)
                : healthAnalysis.fertilityInsights}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Insights & Predictions',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleRefresh}
              disabled={isLoading || refreshing}
              style={styles.refreshButton}
            >
              <RefreshCw 
                size={20} 
                color={isLoading || refreshing ? Colors.inactive : Colors.primary} 
                style={refreshing ? styles.refreshingIcon : undefined}
              />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          onPress={() => setActiveTab('insights')}
        >
          <Lightbulb 
            size={18} 
            color={activeTab === 'insights' ? Colors.primary : Colors.subtext} 
            style={styles.tabIcon}
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'insights' && styles.activeTabText
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'predictions' && styles.activeTab]}
          onPress={() => setActiveTab('predictions')}
        >
          <Calendar 
            size={18} 
            color={activeTab === 'predictions' ? Colors.primary : Colors.subtext} 
            style={styles.tabIcon}
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'predictions' && styles.activeTabText
            ]}
          >
            Predictions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'health' && styles.activeTab]}
          onPress={() => setActiveTab('health')}
        >
          <Heart 
            size={18} 
            color={activeTab === 'health' ? Colors.primary : Colors.subtext} 
            style={styles.tabIcon}
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'health' && styles.activeTabText
            ]}
          >
            Health
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <MessageCircle 
            size={18} 
            color={activeTab === 'chat' ? Colors.primary : Colors.subtext} 
            style={styles.tabIcon}
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'chat' && styles.activeTabText
            ]}
          >
            Ask AI
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'predictions' && renderPredictionsTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'chat' && <HealthAssistantChat isPro={isPro} />}
      </View>
      
      {user?.insightsEnabled === false && (
        <View style={styles.aiDisabledBanner}>
          <Brain size={20} color={Colors.white} style={styles.aiIcon} />
          <Text style={styles.aiDisabledText}>
            AI insights are currently disabled. Enable them in your profile settings.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  refreshButton: {
    padding: 8,
    marginRight: 16,
  },
  refreshingIcon: {
    opacity: 0.6,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.subtext,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.subtext,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
  },
  predictionAccuracy: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  predictionAccuracyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  accuracyBar: {
    height: 8,
    backgroundColor: Colors.inactive,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  accuracyFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  accuracyDescription: {
    fontSize: 14,
    color: Colors.subtext,
    lineHeight: 20,
  },
  aiDisabledBanner: {
    backgroundColor: Colors.primary,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    marginRight: 8,
  },
  aiDisabledText: {
    color: Colors.white,
    fontSize: 14,
    flex: 1,
  },
  healthCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  healthCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  healthCardText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  healthDisclaimer: {
    fontSize: 12,
    color: Colors.subtext,
    fontStyle: 'italic',
    marginTop: 8,
  },
});

// Separate styles for the chat component to avoid naming conflicts
const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 16,
    backgroundColor: Colors.card,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.subtext,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: Colors.inactive,
  },
  sendButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  suggestedQuestionsContainer: {
    padding: 16,
    backgroundColor: Colors.background,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  suggestedQuestionsScroll: {
    paddingBottom: 8,
  },
  suggestedQuestion: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestedQuestionText: {
    fontSize: 14,
    color: Colors.text,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
    padding: 8,
    fontStyle: 'italic',
  },
});