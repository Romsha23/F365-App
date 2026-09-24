import { useUserStore } from '../store/user-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export function useAIConsent() {
  const { user } = useUserStore();
  
  const hasAIConsent = !!user?.aiProcessingConsent;
  
  const requireAIConsent = (onGranted?: () => void): boolean => {
    if (hasAIConsent) {
      onGranted?.();
      return true;
    }
    
    Alert.alert(
      'AI Processing Consent Required',
      'To use AI features, you must first grant consent for AI processing of your health data. This allows us to provide personalized insights and assistance while keeping your data secure.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Grant Consent',
          onPress: () => {
            router.push('/consent' as any);
          },
        },
      ]
    );
    
    return false;
  };
  
  return {
    hasAIConsent,
    requireAIConsent,
    consentDate: user?.aiConsentDate,
  };
}
