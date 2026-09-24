import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      const accessToken = params.access_token as string;
      const refreshToken = params.refresh_token as string;
      
      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Session error:', error);
            setError('Invalid or expired reset link. Please request a new one.');
          }
        } catch (err) {
          console.error('Error setting session:', err);
          setError('Failed to verify reset link. Please try again.');
        }
      }
    };
    
    void handlePasswordReset();
  }, [params]);

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleResetPassword = async () => {
    setError('');
    
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('=== RESET PASSWORD START ===');
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (updateError) {
        console.error('Update password error:', updateError);
        setError(updateError.message);
        setIsLoading(false);
        return;
      }
      
      console.log('Password updated successfully');
      setIsSuccess(true);
      
      setTimeout(() => {
        router.replace('/login' as any);
      }, 3000);
      
      console.log('=== RESET PASSWORD COMPLETE ===');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Reset Password' }} />
        <View style={styles.successContainer}>
          <CheckCircle size={80} color="#22c55e" />
          <Text style={styles.successTitle}>Password Reset Successful!</Text>
          <Text style={styles.successText}>
            Your password has been updated. You will be redirected to the login page shortly.
          </Text>
          <Button
            title="Go to Login"
            onPress={() => router.replace('/login' as any)}
            style={styles.successButton}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: true, title: 'Reset Password' }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Logo size={80} showText={true} />
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Please enter your new password. Make sure it&apos;s at least 8 characters long.
          </Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={Colors.inactive}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.subtext} />
                ) : (
                  <Eye size={20} color={Colors.subtext} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.subtext} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.inactive}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.subtext} />
                ) : (
                  <Eye size={20} color={Colors.subtext} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password requirements:</Text>
            <Text style={[
              styles.requirementItem,
              password.length >= 8 && styles.requirementMet
            ]}>
              • At least 8 characters
            </Text>
          </View>
          
          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
          />
          
          <TouchableOpacity 
            onPress={() => router.replace('/login' as any)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.subtext,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 8,
  },
  requirements: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: Colors.subtext,
    marginTop: 4,
  },
  requirementMet: {
    color: '#22c55e',
  },
  submitButton: {
    marginTop: 8,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  errorContainer: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.5)',
  },
  errorText: {
    color: '#9333EA',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: Colors.subtext,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  successButton: {
    minWidth: 200,
  },
});
