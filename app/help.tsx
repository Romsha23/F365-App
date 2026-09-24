import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, TextInput, ActivityIndicator, Platform, Keyboard } from 'react-native';
import { Stack } from 'expo-router';
import { Card } from '../components/Card';
import Colors from '../constants/colors';
import { ChevronRight, Globe, Search, Send, ArrowDown, ArrowUp } from 'lucide-react-native';

export default function HelpScreen() {
  const [activeTab, setActiveTab] = useState<'faq' | 'chat' | 'contact'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<{role: string; content: string}[]>([
    {
      role: 'assistant',
      content: "Hi there! I'm your F365 support assistant. How can I help you today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleVisitWebsite = () => {
    void Linking.openURL('https://f365.app');
  };
  
  const faqs = [
    {
      question: "How accurate are the predictions?",
      answer: "F365 uses AI to analyze your cycle patterns and provide predictions with increasing accuracy over time. The more data you provide, the more accurate the predictions become. Typically, after tracking 3 cycles, predictions reach about 85-90% accuracy."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take your privacy seriously. All your health data is encrypted and stored securely on your device. We do not share your personal information with third parties without your explicit consent."
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can export your cycle data in CSV format from the Profile section. This allows you to share information with healthcare providers or keep a backup of your records."
    },
    {
      question: "How do I set up reminders?",
      answer: "Go to the Profile tab and enable notifications. You can customize reminder types and timing in the Reminders section."
    },
    {
      question: "What should I do if I miss logging a day?",
      answer: "You can go back and add data for previous days by selecting the date on the Calendar tab and adding your information."
    },
    {
      question: "How does the AI assistant work?",
      answer: "Our AI assistant uses advanced natural language processing to answer your questions about menstrual health, cycle tracking, and reproductive wellness. It's trained on medical information but is not a substitute for professional medical advice."
    },
    {
      question: "Can I use F365 for birth control?",
      answer: "While F365 can help track fertility windows, it should not be used as your sole method of birth control. For contraception, please consult with a healthcare provider."
    },
    {
      question: "How do I interpret the symptom patterns?",
      answer: "The app analyzes your logged symptoms over time to identify patterns related to your cycle phases. These insights can help you understand how your body typically responds during different parts of your cycle."
    },
  ];
  
  const filteredFaqs = searchQuery.trim() === '' 
    ? faqs 
    : faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  const toggleFaqExpansion = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = { role: 'user', content: inputText.trim() };
    setChatMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Create the system message with support context
      const systemMessage = {
        role: 'system',
        content: `You are a helpful support assistant for F365, a menstrual cycle tracking app.
        Answer user questions about the app features, account management, data privacy, and general menstrual health information.
        Be friendly, concise, and informative. If you don't know the answer, suggest contacting customer support.
        
        App features include:
        - Period and symptom tracking
        - Cycle predictions and insights
        - Fertility window estimation
        - Health analysis and recommendations
        - Mood and symptom pattern recognition
        - Data export and backup
        - Reminders and notifications
        - Privacy-focused design with local data encryption`
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
            ...chatMessages.slice(-5), // Include last 5 messages for context
            userMessage
          ]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.completion };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting support response:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try emailing our support team at hello@f365.app for assistance." 
      }]);
    } finally {
      setIsLoading(false);
      // Scroll to bottom after new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderFaqTab = () => (
    <>
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.subtext} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search FAQs..."
          placeholderTextColor={Colors.inactive}
        />
      </View>
      
      {filteredFaqs.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found for &ldquo;{searchQuery}&rdquo;</Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredFaqs.map((faq, index) => (
          <Card key={index} style={styles.faqCard}>
            <TouchableOpacity 
              style={styles.faqQuestion}
              onPress={() => toggleFaqExpansion(index)}
            >
              <Text style={styles.question}>{faq.question}</Text>
              {expandedFaqIndex === index ? (
                <ArrowUp size={20} color={Colors.primary} />
              ) : (
                <ArrowDown size={20} color={Colors.subtext} />
              )}
            </TouchableOpacity>
            
            {expandedFaqIndex === index && (
              <Text style={styles.answer}>{faq.answer}</Text>
            )}
          </Card>
        ))
      )}
      
      <Text style={styles.aboutText}>
        F365 is designed to help you track and understand your menstrual cycle.
        While we strive to provide accurate information and predictions, this app
        should not be used as a substitute for professional medical advice.
      </Text>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </>
  );

  const renderChatTab = () => (
    <View style={[styles.chatContainer, Platform.OS === 'android' && { marginBottom: keyboardHeight }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {chatMessages.map((message, index) => (
          <View 
            key={index} 
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text style={[
              styles.messageText,
              message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
            ]}>
              {message.content}
            </Text>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Typing...</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.chatInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your question here..."
          placeholderTextColor={Colors.inactive}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.disabledSendButton
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Send size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContactTab = () => (
    <View style={styles.contactContainer}>
      <Text style={styles.contactText}>
        Need more help? Visit our website for additional resources and support.
      </Text>
      
      <View style={styles.supportOptions}>
        <TouchableOpacity 
          style={[styles.supportOption, { borderBottomWidth: 0 }]}
          onPress={handleVisitWebsite}
        >
          <Globe size={24} color={Colors.primary} />
          <Text style={styles.supportOptionText}>Visit Website</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Help & Support',
        }} 
      />
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => setActiveTab('faq')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'faq' && styles.activeTabText
            ]}
          >
            FAQs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'chat' && styles.activeTabText
            ]}
          >
            Chat Support
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
          onPress={() => setActiveTab('contact')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'contact' && styles.activeTabText
            ]}
          >
            Contact Us
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'chat' ? (
        renderChatTab()
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'faq' && renderFaqTab()}
          {activeTab === 'contact' && renderContactTab()}
        </ScrollView>
      )}
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
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.subtext,
    marginBottom: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  faqCard: {
    marginBottom: 12,
    padding: 16,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  answer: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.subtext,
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    minHeight: 400,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
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
  userMessageText: {
    color: Colors.white,
  },
  assistantMessageText: {
    color: Colors.text,
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
  chatInput: {
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
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: Colors.inactive,
  },
  contactContainer: {
    padding: 8,
  },
  contactText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 24,
  },
  supportOptions: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 24,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  supportOptionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    marginLeft: 16,
  },

});