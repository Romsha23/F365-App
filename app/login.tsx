import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import Colors from '../constants/colors';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/user-store';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { generate7DigitId } from '../types/user';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'login' | 'signup' | 'forgot_password';

/**
 * OAuth redirect URL
 *
 * Web:
 *   http://localhost:xxxx/auth/callback
 *
 * Expo Go:
 *   exp://<IP>:8081/--/auth/callback
 *
 * Development/standalone build:
 *   flo365://auth/callback
 */
const getAuthRedirectUrl = (path = 'auth/callback') => {
  if (Platform.OS === 'web') {
    const normalizedPath = path.startsWith('/')
      ? path
      : `/${path}`;

    return `${window.location.origin}${normalizedPath}`;
  }

  return makeRedirectUri({
    path,
  });
};

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { register, loadMockUser } = useUserStore();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  // =========================
  // EMAIL LOGIN
  // =========================

  const handleEmailLogin = async () => {
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== EMAIL LOGIN START ===');

      const { data: fnData, error: fnError } =
        await supabase.functions.invoke('signin', {
          body: {
            email: email.trim().toLowerCase(),
            password,
          },
        });

      if (fnError) {
        console.error('Signin function error:', fnError);

        setError(
          'Unable to connect. Please check your internet and try again.'
        );

        setIsLoading(false);
        return;
      }

      if (!fnData.success) {
        const msg = fnData.error || 'Login failed';

        if (msg.includes('Invalid login credentials')) {
          setError(
            'Invalid email or password. Please try again.'
          );
        } else if (msg.includes('Email not confirmed')) {
          setError(
            'Please verify your email before logging in. Check your inbox for the verification link.'
          );
        } else {
          setError(msg);
        }

        setIsLoading(false);
        return;
      }

      await supabase.auth.setSession(fnData.session);

      // Give the Supabase client a tick to flush the session to
      // AsyncStorage / localStorage before the tabs layout calls
      // getSession() — prevents the "session found but no user" race
      // condition on web.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      console.log(
        'User logged in:',
        fnData.profile.id,
        'profile username:',
        fnData.profile.username
      );

      useUserStore
        .getState()
        .setAuthId(fnData.profile.id);

      if (fnData.profile.username) {
        useUserStore
          .getState()
          .setProfileUsername(fnData.profile.username);
      }

      const {
        data: profileData,
        error: fetchError,
      } = await supabase.functions.invoke('get-profile', {
        body: {
          userId: fnData.profile.id,
        },
      });

      if (fetchError) {
        console.error(
          'Error fetching user:',
          fetchError
        );
      }

      if (profileData?.profile) {
        const p = profileData.profile;

        console.log(
          'Existing user found:',
          p.id,
          'username:',
          p.username
        );

        const userProfile = {
          id: p.id,
          uniqueId: p.id,
          displayName:
            p.username ||
            fnData.profile.username ||
            undefined,
          email: p.email || undefined,
          role: 'user',
          onboarded: p.onboarded ?? false,
          lifeStage: p.life_stage,
        };

        await register(userProfile);

        if (p.onboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding' as any);
        }
      } else {
        console.log(
          'New user, authId stored:',
          fnData.profile.id
        );

        router.replace('/onboarding' as any);
      }

      console.log('=== EMAIL LOGIN COMPLETE ===');
    } catch (err) {
      console.error('Login error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // EMAIL SIGNUP
  // =========================

  const handleEmailSignup = async () => {
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (!validatePassword(password)) {
      setError(
        'Password must be at least 8 characters long'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== EMAIL SIGNUP START ===');

      const uniqueId = generate7DigitId();

      console.log(
        'Generated unique ID:',
        uniqueId
      );

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,

          options: {
            data: {
              unique_id: uniqueId,
            },

            emailRedirectTo:
              Platform.OS === 'web'
                ? window.location.origin
                : makeRedirectUri({
                    path: 'auth/callback',
                  }),
          },
        });

      if (signUpError) {
        console.error(
          'Sign up error:',
          signUpError
        );

        if (
          signUpError.message.includes(
            'already registered'
          )
        ) {
          setError(
            'An account with this email already exists. Please login instead.'
          );
        } else {
          setError(signUpError.message);
        }

        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log(
          'User created:',
          data.user.id
        );

        if (
          data.user.identities &&
          data.user.identities.length === 0
        ) {
          setError(
            'An account with this email already exists. Please login instead.'
          );

          setIsLoading(false);
          return;
        }

        const {
          data: processData,
          error: processError,
        } =
          await supabase.functions.invoke(
            'process-signup',
            {
              body: {
                userId: data.user.id,
                email: email
                  .trim()
                  .toLowerCase(),
              },
            }
          );

        if (processError) {
          console.warn(
            'Process signup error:',
            processError
          );
        } else {
          console.log(
            'Encrypted profile setup completed, username:',
            processData?.username
          );

          if (processData?.username) {
            useUserStore
              .getState()
              .setProfileUsername(
                processData.username
              );
          }
        }

        setSuccessMessage(
          'Account created successfully! Please check your email to verify your account before logging in.'
        );

        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }

      console.log(
        '=== EMAIL SIGNUP COMPLETE ==='
      );
    } catch (err) {
      console.error(
        'Signup error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // FORGOT PASSWORD
  // =========================

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      console.log(
        '=== FORGOT PASSWORD START ==='
      );

      const resetRedirectUrl =
        Platform.OS === 'web'
          ? `${window.location.origin}/reset-password`
          : makeRedirectUri({
              path: 'reset-password',
            });

      console.log(
        'Reset redirect URL:',
        resetRedirectUrl
      );

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: resetRedirectUrl,
          }
        );

      if (resetError) {
        console.error(
          'Password reset error:',
          resetError
        );

        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        'Password reset email sent! Please check your inbox and follow the instructions to reset your password.'
      );

      console.log(
        '=== FORGOT PASSWORD COMPLETE ==='
      );
    } catch (err) {
      console.error(
        'Forgot password error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // GOOGLE SIGN IN
  // =========================

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      console.log('=== GOOGLE SIGN IN START ===');

      // ─── WEB: standard full-page redirect ────────────────────────────
      if (Platform.OS === 'web') {
        const redirectUrl = getAuthRedirectUrl(); // <origin>/auth/callback
        console.log('[Google/web] redirect URL:', redirectUrl);

        const { data, error: oAuthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account', // always show account picker
            },
          },
        });

        console.log('[Google/web] signInWithOAuth result — url:', data?.url, 'error:', oAuthError);

        if (oAuthError || !data?.url) {
          console.error('[Google/web] OAuth error:', oAuthError);
          setError(oAuthError?.message ?? 'Unable to start Google sign in. Please try again.');
          setIsLoading(false);
          return;
        }

        // Hard-navigate to the Google OAuth URL.
        // The app will re-mount on /auth/callback after sign-in.
        console.log('[Google/web] Navigating to:', data.url);
        window.location.assign(data.url);
        return;
      }

      // ─── NATIVE: use expo-web-browser in-app tab ─────────────────────
      const redirectUrl = getAuthRedirectUrl();
      console.log('[Google/native] redirect URL:', redirectUrl);

      const { data, error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (oAuthError || !data.url) {
        console.error('[Google/native] OAuth error:', oAuthError);
        setError(oAuthError?.message ?? 'Unable to start Google sign in.');
        setIsLoading(false);
        return;
      }

      console.log('Opening Google authentication browser...');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      console.log('=== OAUTH BROWSER RESULT ===');
      console.log('Result type:', result.type);
      console.log('Result URL:', 'url' in result ? result.url : 'No URL');

      if (result.type === 'success' && result.url) {
        const callbackUrl = result.url;
        const url = new URL(callbackUrl);
        const hashParams = new URLSearchParams(url.hash.replace('#', ''));
        const queryParams = url.searchParams;

        const code = queryParams.get('code') || hashParams.get('code');
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');

        console.log('Has OAuth code:', !!code);
        console.log('Has access token:', !!accessToken);
        console.log('Has refresh token:', !!refreshToken);

        if (code) {
          console.log('Exchanging OAuth code for session...');
          const { data: sessionData, error: sessionError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (sessionError) {
            console.error('Session exchange error:', sessionError);
            setError('Failed to complete sign in. Please try again.');
            setIsLoading(false);
            return;
          }

          console.log('OAuth session exchange successful.');

          if (sessionData.user) {
            await handlePostOAuthLogin(sessionData.user);
          } else {
            setError('Google sign in could not find your account.');
          }
        } else if (accessToken && refreshToken) {
          console.log('OAuth tokens received. Setting session...');
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to complete sign in. Please try again.');
            setIsLoading(false);
            return;
          }

          console.log('OAuth token session created successfully.');

          if (sessionData.user) {
            await handlePostOAuthLogin(sessionData.user);
          }
        } else {
          console.error('OAuth callback missing auth parameters. URL:', callbackUrl);
          setError('Google sign in returned without authentication details.');
        }
      } else {
        if (result.type === 'cancel') {
          setError('Google sign in was cancelled.');
        }
        console.log('OAuth browser result:', result);
      }

      console.log('=== GOOGLE SIGN IN COMPLETE ===');
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // POST GOOGLE LOGIN
  // =========================

  const handlePostOAuthLogin = async (
    user: any
  ) => {
    try {
      console.log(
        '=== POST GOOGLE LOGIN START ==='
      );

      useUserStore
        .getState()
        .setAuthId(user.id);

      const {
        data: processData,
        error: processError,
      } =
        await supabase.functions.invoke(
          'process-signup',
          {
            body: {
              userId: user.id,
              email: user.email,
            },
          }
        );

      if (processError) {
        console.warn(
          'OAuth process-signup error:',
          processError
        );
      } else {
        console.log(
          'OAuth encrypted profile setup completed, username:',
          processData?.username
        );

        if (processData?.username) {
          useUserStore
            .getState()
            .setProfileUsername(
              processData.username
            );
        }
      }

      const {
        data: profileData,
        error: fetchError,
      } =
        await supabase.functions.invoke(
          'get-profile',
          {
            body: {
              userId: user.id,
            },
          }
        );

      if (fetchError) {
        console.error(
          'Error fetching user:',
          fetchError
        );
      }

      if (profileData?.profile) {
        const p =
          profileData.profile;

        console.log(
          'Existing OAuth user found:',
          p.id,
          'username:',
          p.username
        );

        await register({
          id: p.id,
          uniqueId: p.id,

          displayName:
            p.username ||
            processData?.username ||
            undefined,

          email:
            user.email ||
            undefined,

          role: 'user',

          onboarded:
            p.onboarded ?? false,

          lifeStage:
            p.life_stage,
        });

        if (p.onboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace(
            '/onboarding' as any
          );
        }
      } else {
        console.log(
          'New OAuth user, redirecting to onboarding...'
        );

        router.replace(
          '/onboarding' as any
        );
      }

      console.log(
        '=== POST GOOGLE LOGIN COMPLETE ==='
      );
    } catch (err) {
      console.error(
        'Post OAuth error:',
        err
      );

      setError(
        'Failed to complete sign in. Please try again.'
      );
    }
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = () => {
    switch (mode) {
      case 'login':
        void handleEmailLogin();
        break;

      case 'signup':
        void handleEmailSignup();
        break;

      case 'forgot_password':
        void handleForgotPassword();
        break;
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';

      case 'signup':
        return 'Create Account';

      case 'forgot_password':
        return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to continue tracking your cycle';

      case 'signup':
        return 'Join us for personalized cycle insights';

      case 'forgot_password':
        return 'Enter your email to receive reset instructions';
    }
  };

  const getButtonTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign In';

      case 'signup':
        return 'Create Account';

      case 'forgot_password':
        return 'Send Reset Link';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? 64 : 0
      }
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sign In',
        }}
      />

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <Logo
            size={80}
            showText={true}
          />

          <Text style={styles.tagline}>
            Your Personal Cycle Companion
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {getTitle()}
          </Text>

          <Text style={styles.subtitle}>
            {getSubtitle()}
          </Text>

          {successMessage ? (
            <View
              style={
                styles.successContainer
              }
            >
              <Text
                style={
                  styles.successText
                }
              >
                {successMessage}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={
                styles.errorContainer
              }
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* EMAIL */}

          <View
            style={
              styles.inputContainer
            }
          >
            <View
              style={
                styles.inputWrapper
              }
            >
              <Mail
                size={20}
                color={Colors.subtext}
                style={
                  styles.inputIcon
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={
                  Colors.inactive
                }
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* PASSWORD */}

          {mode !==
            'forgot_password' && (
            <View
              style={
                styles.inputContainer
              }
            >
              <View
                style={
                  styles.inputWrapper
                }
              >
                <Lock
                  size={20}
                  color={Colors.subtext}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={
                    Colors.inactive
                  }
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  editable={!isLoading}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  style={
                    styles.eyeButton
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      color={
                        Colors.subtext
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        Colors.subtext
                      }
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CONFIRM PASSWORD */}

          {mode === 'signup' && (
            <View
              style={
                styles.inputContainer
              }
            >
              <View
                style={
                  styles.inputWrapper
                }
              >
                <Lock
                  size={20}
                  color={Colors.subtext}
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={
                    Colors.inactive
                  }
                  value={
                    confirmPassword
                  }
                  onChangeText={
                    setConfirmPassword
                  }
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  editable={!isLoading}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  style={
                    styles.eyeButton
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      size={20}
                      color={
                        Colors.subtext
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        Colors.subtext
                      }
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* FORGOT PASSWORD */}

          {mode === 'login' && (
            <TouchableOpacity
              onPress={() =>
                setMode(
                  'forgot_password'
                )
              }
              style={
                styles.forgotPasswordButton
              }
            >
              <Text
                style={
                  styles.forgotPasswordText
                }
              >
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {/* SUBMIT */}

          <Button
            title={getButtonTitle()}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
          />

          {/* GOOGLE */}

          {mode !==
            'forgot_password' && (
            <>
              <View
                style={styles.divider}
              >
                <View
                  style={
                    styles.dividerLine
                  }
                />

                <Text
                  style={
                    styles.dividerText
                  }
                >
                  or continue with
                </Text>

                <View
                  style={
                    styles.dividerLine
                  }
                />
              </View>

              <TouchableOpacity
                style={
                  styles.googleButton
                }
                onPress={
                  handleGoogleSignIn
                }
                disabled={isLoading}
              >
                <Text
                  style={
                    styles.googleIcon
                  }
                >
                  G
                </Text>

                <Text
                  style={
                    styles.googleButtonText
                  }
                >
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* SWITCH MODE */}

          <View
            style={
              styles.switchModeContainer
            }
          >
            {mode === 'login' ? (
              <>
                <Text
                  style={
                    styles.switchModeText
                  }
                >
                  Don't have an account?{' '}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setMode('signup');
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  <Text
                    style={
                      styles.switchModeLink
                    }
                  >
                    Sign up
                  </Text>
                </TouchableOpacity>
              </>
            ) : mode === 'signup' ? (
              <>
                <Text
                  style={
                    styles.switchModeText
                  }
                >
                  Already have an account?{' '}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setMode('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  <Text
                    style={
                      styles.switchModeLink
                    }
                  >
                    Sign in
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.switchModeText
                  }
                >
                  Remember your password?{' '}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setMode('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  <Text
                    style={
                      styles.switchModeLink
                    }
                  >
                    Sign in
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text
            style={styles.footerText}
          >
            By continuing, you agree to our{' '}
            <Text
              style={styles.footerLink}
              onPress={() =>
                router.push(
                  '/terms-of-service' as any
                )
              }
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={styles.footerLink}
              onPress={() =>
                router.push(
                  '/privacy-policy' as any
                )
              }
            >
              Privacy Policy
            </Text>
          </Text>

          <View
            style={
              styles.uniqueIdNote
            }
          >
            <Text
              style={
                styles.uniqueIdNoteText
              }
            >
              🔒 Your privacy matters. We use a unique 7-digit ID instead of your name.
            </Text>
          </View>

          <View
            style={styles.demoContainer}
          >
            <Text
              style={styles.demoTitle}
            >
              Just want to explore?
            </Text>

            <TouchableOpacity
              style={
                styles.demoButton
              }
              onPress={() => {
                loadMockUser();
                router.replace(
                  '/(tabs)'
                );
              }}
              disabled={isLoading}
            >
              <Text
                style={
                  styles.demoButtonText
                }
              >
                Try Demo Mode
              </Text>

              <ArrowRight
                size={18}
                color={Colors.primary}
              />
            </TouchableOpacity>

            <Text
              style={styles.demoNote}
            >
              No account needed. Your data won't be saved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background,
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

  tagline: {
    fontSize: 16,
    color: Colors.subtext,
    marginTop: 12,
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
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      Colors.border,
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

  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },

  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500' as const,
  },

  submitButton: {
    marginTop: 8,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor:
      Colors.border,
  },

  dividerText: {
    marginHorizontal: 16,
    color: Colors.subtext,
    fontSize: 14,
    fontWeight: '500' as const,
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },

  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#4285F4',
    marginRight: 12,
  },

  googleButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },

  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },

  switchModeText: {
    color: Colors.text,
    fontSize: 14,
  },

  switchModeLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },

  errorContainer: {
    backgroundColor:
      'rgba(147, 51, 234, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(147, 51, 234, 0.5)',
  },

  errorText: {
    color: '#9333EA',
    fontSize: 14,
    textAlign: 'center',
  },

  successContainer: {
    backgroundColor:
      'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor:
      'rgba(147, 51, 234, 0.4)',
  },

  successText: {
    color: '#22c55e',
    fontSize: 14,
    textAlign: 'center',
  },

  footer: {
    marginTop: 32,
    paddingBottom: 24,
  },

  footerText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },

  footerLink: {
    color: Colors.primary,
    textDecorationLine:
      'underline',
  },

  uniqueIdNote: {
    marginTop: 16,
    padding: 12,
    backgroundColor:
      'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },

  uniqueIdNoteText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 19,
  },

  demoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor:
      'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      'rgba(147, 51, 234, 0.4)',
    alignItems: 'center',
  },

  demoTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
    marginBottom: 12,
  },

  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor:
      'rgba(139, 92, 246, 0.1)',
    borderRadius: 24,
    gap: 8,
  },

  demoButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },

  demoNote: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 17,
  },
});