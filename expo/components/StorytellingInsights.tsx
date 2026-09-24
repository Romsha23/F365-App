import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  Moon,
  Dumbbell,
  Heart,
  BookOpen,
  AlertCircle,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Zap,
  Info,
} from 'lucide-react-native';
import { Card } from '../components/Card';
import Colors from '../constants/colors';
import {
  WeeklyNarrative,
  PatternChange,
  CauseEffectHint,
  ConfidenceResult,
} from '../utils/confidence-scoring';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WeeklyNarrativeCardProps = {
  narrative: WeeklyNarrative;
  confidence: ConfidenceResult;
  onFeedback?: (accurate: boolean) => void;
};

export const WeeklyNarrativeCard: React.FC<WeeklyNarrativeCardProps> = ({
  narrative,
  confidence,
  onFeedback,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const getToneColor = () => {
    switch (narrative.tone) {
      case 'positive': return Colors.success;
      case 'supportive': return Colors.secondary;
      default: return Colors.primary;
    }
  };

  const handleFeedback = useCallback((accurate: boolean) => {
    setFeedbackGiven(true);
    onFeedback?.(accurate);
    
    AsyncStorage.setItem(
      `insight_feedback_${Date.now()}`,
      JSON.stringify({ accurate, timestamp: new Date().toISOString() })
    ).catch(console.error);
  }, [onFeedback]);

  const cardStyle = [styles.narrativeCard, { borderLeftColor: getToneColor() }];
  
  return (
    <Card style={cardStyle as any}>
      <View style={styles.narrativeHeader}>
        <View style={[styles.narrativeIcon, { backgroundColor: getToneColor() + '20' }]}>
          <Sparkles size={20} color={getToneColor()} />
        </View>
        <View style={styles.narrativeHeaderText}>
          <Text style={styles.narrativeHeadline}>{narrative.headline}</Text>
          <Text style={[styles.narrativeConfidence, { color: getToneColor() }]}>
            {confidence.label}
          </Text>
        </View>
      </View>

      <Text style={styles.narrativeBody}>{narrative.body}</Text>
      
      <View style={styles.keyInsightContainer}>
        <Zap size={14} color={Colors.gold} />
        <Text style={styles.keyInsightText}>{narrative.keyInsight}</Text>
      </View>

      {!feedbackGiven && (
        <TouchableOpacity 
          style={styles.feedbackTrigger}
          onPress={() => setShowFeedback(!showFeedback)}
        >
          <MessageCircle size={14} color={Colors.textMuted} />
          <Text style={styles.feedbackTriggerText}>Does this feel accurate?</Text>
          <ChevronRight 
            size={14} 
            color={Colors.textMuted} 
            style={showFeedback ? styles.chevronRotated : undefined}
          />
        </TouchableOpacity>
      )}

      {showFeedback && !feedbackGiven && (
        <View style={styles.feedbackOptions}>
          <TouchableOpacity 
            style={[styles.feedbackButton, styles.feedbackPositive]}
            onPress={() => handleFeedback(true)}
          >
            <ThumbsUp size={16} color={Colors.success} />
            <Text style={[styles.feedbackButtonText, { color: Colors.success }]}>
              Yes, spot on
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.feedbackButton, styles.feedbackNegative]}
            onPress={() => handleFeedback(false)}
          >
            <ThumbsDown size={16} color={Colors.textMuted} />
            <Text style={styles.feedbackButtonText}>Not quite</Text>
          </TouchableOpacity>
        </View>
      )}

      {feedbackGiven && (
        <View style={styles.feedbackThanks}>
          <Heart size={14} color={Colors.primary} />
          <Text style={styles.feedbackThanksText}>
            Thanks! Your feedback helps improve insights.
          </Text>
        </View>
      )}
    </Card>
  );
};

type PatternChangeAlertProps = {
  change: PatternChange;
  style?: any;
};

export const PatternChangeAlert: React.FC<PatternChangeAlertProps> = ({
  change,
  style,
}) => {
  if (!change.detected) return null;

  const getChangeConfig = () => {
    switch (change.type) {
      case 'improvement':
        return {
          icon: TrendingUp,
          color: Colors.success,
          bgColor: Colors.success + '15',
          borderColor: Colors.success + '30',
        };
      case 'decline':
        return {
          icon: TrendingDown,
          color: Colors.secondary,
          bgColor: Colors.secondary + '15',
          borderColor: Colors.secondary + '30',
        };
      case 'shift':
        return {
          icon: Activity,
          color: Colors.gold,
          bgColor: Colors.gold + '15',
          borderColor: Colors.border,
        };
      default:
        return {
          icon: Activity,
          color: Colors.textMuted,
          bgColor: Colors.muted,
          borderColor: Colors.border,
        };
    }
  };

  const config = getChangeConfig();
  const Icon = config.icon;

  return (
    <View style={[
      styles.changeAlert,
      { backgroundColor: config.bgColor, borderColor: config.borderColor },
      style
    ]}>
      <View style={styles.changeAlertHeader}>
        <Icon size={18} color={config.color} />
        <Text style={[styles.changeAlertTitle, { color: config.color }]}>
          {change.magnitude === 'significant' ? 'Notable ' : ''}Pattern Change
        </Text>
      </View>
      <Text style={styles.changeAlertDescription}>{change.description}</Text>
      {change.factors.length > 0 && (
        <View style={styles.changeFactors}>
          {change.factors.slice(0, 2).map((factor, index) => (
            <View key={index} style={styles.changeFactor}>
              <View style={[styles.changeFactorDot, { backgroundColor: config.color }]} />
              <Text style={styles.changeFactorText}>{factor}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

type CauseEffectHintsProps = {
  hints: CauseEffectHint[];
  style?: any;
};

export const CauseEffectHints: React.FC<CauseEffectHintsProps> = ({
  hints,
  style,
}) => {
  if (hints.length === 0) return null;

  const getFactorIcon = (factor: string) => {
    const lowerFactor = factor.toLowerCase();
    if (lowerFactor.includes('sleep')) return Moon;
    if (lowerFactor.includes('exercise') || lowerFactor.includes('physical')) return Dumbbell;
    if (lowerFactor.includes('stress')) return Heart;
    if (lowerFactor.includes('journal')) return BookOpen;
    return Zap;
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return Colors.success;
      case 'medium': return Colors.gold;
      default: return Colors.textMuted;
    }
  };

  return (
    <View style={[styles.causeEffectContainer, style]}>
      <View style={styles.causeEffectHeader}>
        <Info size={16} color={Colors.gold} />
        <Text style={styles.causeEffectTitle}>What May Be Helping</Text>
      </View>
      
      {hints.map((hint, index) => {
        const Icon = getFactorIcon(hint.factor);
        const confidenceColor = getConfidenceColor(hint.confidence);
        
        return (
          <View key={index} style={styles.causeEffectItem}>
            <View style={styles.causeEffectIconContainer}>
              <Icon size={18} color={Colors.primary} />
            </View>
            <View style={styles.causeEffectContent}>
              <Text style={styles.causeEffectNarrative}>{hint.narrative}</Text>
              <View style={styles.causeEffectMeta}>
                <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                <Text style={[styles.causeEffectConfidence, { color: confidenceColor }]}>
                  {hint.confidence === 'high' ? 'Strong signal' : 
                   hint.confidence === 'medium' ? 'Emerging pattern' : 'Early signal'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

type ReflectionPromptProps = {
  question: string;
  context?: string;
  onRespond?: (response: 'yes' | 'no' | 'unsure') => void;
  style?: any;
};

export const ReflectionPrompt: React.FC<ReflectionPromptProps> = ({
  question,
  context,
  onRespond,
  style,
}) => {
  const [responded, setResponded] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  const handleResponse = useCallback((response: 'yes' | 'no' | 'unsure') => {
    setResponded(true);
    setSelectedResponse(response);
    onRespond?.(response);
    
    AsyncStorage.setItem(
      `reflection_${Date.now()}`,
      JSON.stringify({ question, response, timestamp: new Date().toISOString() })
    ).catch(console.error);
  }, [question, onRespond]);

  const getFollowUpMessage = () => {
    switch (selectedResponse) {
      case 'yes':
        return "Great! We'll keep refining your insights based on this.";
      case 'no':
        return "Thanks for letting us know. More data will help us understand your patterns better.";
      case 'unsure':
        return "That's okay! Patterns can take time to recognize.";
      default:
        return "";
    }
  };

  const cardStyle = [styles.reflectionCard, style];
  
  return (
    <Card style={cardStyle as any}>
      <View style={styles.reflectionHeader}>
        <MessageCircle size={18} color={Colors.primary} />
        <Text style={styles.reflectionTitle}>Reflection</Text>
      </View>
      
      <Text style={styles.reflectionQuestion}>{question}</Text>
      
      {context && (
        <Text style={styles.reflectionContext}>{context}</Text>
      )}

      {!responded ? (
        <View style={styles.reflectionOptions}>
          <TouchableOpacity 
            style={[styles.reflectionButton, styles.reflectionButtonYes]}
            onPress={() => handleResponse('yes')}
          >
            <Text style={styles.reflectionButtonTextYes}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reflectionButton, styles.reflectionButtonNo]}
            onPress={() => handleResponse('no')}
          >
            <Text style={styles.reflectionButtonTextNo}>Not really</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reflectionButton, styles.reflectionButtonUnsure]}
            onPress={() => handleResponse('unsure')}
          >
            <Text style={styles.reflectionButtonTextUnsure}>Unsure</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.reflectionFollowUp}>
          <Text style={styles.reflectionFollowUpText}>{getFollowUpMessage()}</Text>
        </View>
      )}
    </Card>
  );
};

type ConfidenceTipProps = {
  confidence: ConfidenceResult;
  style?: any;
};

export const ConfidenceTip: React.FC<ConfidenceTipProps> = ({
  confidence,
  style,
}) => {
  if (!confidence.improvementTip || confidence.level === 'high') return null;

  return (
    <View style={[styles.confidenceTip, style]}>
      <AlertCircle size={14} color={Colors.textMuted} />
      <Text style={styles.confidenceTipText}>{confidence.improvementTip}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  narrativeCard: {
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  narrativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  narrativeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  narrativeHeaderText: {
    flex: 1,
  },
  narrativeHeadline: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  narrativeConfidence: {
    fontSize: 12,
    fontWeight: '500',
  },
  narrativeBody: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  keyInsightContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.gold + '10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  keyInsightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  feedbackTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  feedbackTriggerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textMuted,
  },
  chevronRotated: {
    transform: [{ rotate: '90deg' }],
  },
  feedbackOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  feedbackPositive: {
    backgroundColor: Colors.success + '15',
  },
  feedbackNegative: {
    backgroundColor: Colors.muted,
  },
  feedbackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  feedbackThanks: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  feedbackThanksText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  changeAlert: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  changeAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  changeAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeAlertDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  changeFactors: {
    marginTop: 4,
  },
  changeFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  changeFactorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  changeFactorText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  causeEffectContainer: {
    marginBottom: 16,
  },
  causeEffectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  causeEffectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  causeEffectItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  causeEffectIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  causeEffectContent: {
    flex: 1,
  },
  causeEffectNarrative: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  causeEffectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  causeEffectConfidence: {
    fontSize: 12,
    fontWeight: '500',
  },
  reflectionCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.primary + '08',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  reflectionQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  reflectionContext: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  reflectionOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  reflectionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  reflectionButtonYes: {
    backgroundColor: Colors.success + '15',
  },
  reflectionButtonNo: {
    backgroundColor: Colors.muted,
  },
  reflectionButtonUnsure: {
    backgroundColor: Colors.secondary + '15',
  },
  reflectionButtonTextYes: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  reflectionButtonTextNo: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  reflectionButtonTextUnsure: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  reflectionFollowUp: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reflectionFollowUpText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  confidenceTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.muted,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  confidenceTipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
