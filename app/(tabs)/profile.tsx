import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch as RNSwitch, TouchableOpacity, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, Href } from 'expo-router';
import { useUserStore } from '../../store/user-store';
import { usePartnerSharingStore } from '../../store/partner-sharing-store';
import { useSubscriptionStore } from '../../store/subscription-store';
import { useCycleStore } from '../../store/cycle-store';
import { usePregnancyStore } from '../../store/pregnancy-store';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import Colors from '../../constants/colors';
import { Bell, Heart, Shield, HelpCircle, LogOut, FileText, Lock, ChevronRight, Download, Key, Crown, Zap, Stethoscope, Video, Bot, TrendingUp, Gift, Users, BookOpen, Baby, Sparkles, Check } from 'lucide-react-native';
import { LIFE_STAGE_OPTIONS } from '@/types/user';

import { logSettingsChange } from '../../utils/audit-logger';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useUserStore();
  const { isViewer } = usePartnerSharingStore();
  const { getSubscriptionInfo, canAccessFeature } = useSubscriptionStore();
  const { cycles } = useCycleStore();
  const { mode: pregnancyMode, setMode: setPregnancyMode } = usePregnancyStore();
  const [showLifeStageModal, setShowLifeStageModal] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    user?.notificationsEnabled || false
  );
  const [emergencyAlertsEnabled, setEmergencyAlertsEnabled] = useState<boolean>(
    user?.emergencyAlertsEnabled || false
  );
  const [insightsEnabled, setInsightsEnabled] = useState<boolean>(
    user?.insightsEnabled || true
  );
  const [dataEncrypted, setDataEncrypted] = useState<boolean>(
    user?.dataEncrypted || true
  );
  
  const isAdmin = user?.role === 'admin';
  const subscriptionInfo = getSubscriptionInfo();
  const isPro = subscriptionInfo.isPro;
  
  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    updateUser({ notificationsEnabled: value });
    logSettingsChange(user?.id || '1', 'notifications');
  };
  
  const handleEmergencyAlertsToggle = (value: boolean) => {
    setEmergencyAlertsEnabled(value);
    updateUser({ emergencyAlertsEnabled: value });
    logSettingsChange(user?.id || '1', 'emergency_alerts');
  };
  


  const handleInsightsToggle = (value: boolean) => {
    if (!isPro && value) {
      Alert.alert(
        "Pro Feature",
        "AI Insights requires a Pro subscription. You can activate Pro using a redemption code.",
        [
          { text: "OK", style: "cancel" },
          { text: "Redeem Code", onPress: () => router.push('/redeem-code' as Href) }
        ]
      );
      return;
    }
    
    setInsightsEnabled(value);
    updateUser({ insightsEnabled: value });
    logSettingsChange(user?.id || '1', 'insights');
  };
  
  const handleEncryptionToggle = (value: boolean) => {
    setDataEncrypted(value);
    updateUser({ dataEncrypted: value });
    logSettingsChange(user?.id || '1', 'data_encryption');
  };
  
  const handleEditProfile = () => {
    if (isViewer) {
      Alert.alert('Read-only access', 'Partner accounts cannot edit profile details.');
      return;
    }
    router.push('/edit-profile' as Href);
  };
  
  const handleManageContacts = () => {
    router.push('/emergency-contacts' as Href);
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleHelp = () => {
    router.push('/help' as Href);
  };
  
  const handleSymptomChecker = () => {
    router.push('/symptom-checker' as Href);
  };
  
  const handleReminders = () => {
    router.push('/reminders' as Href);
  };
  
  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy' as Href);
  };
  
  const handleTermsOfService = () => {
    router.push('/terms-of-service' as Href);
  };
  
  const handleDataExport = () => {
    if (!canAccessFeature('exportData')) {
      Alert.alert(
        "Pro Feature",
        "Data export requires a Pro subscription. You can activate Pro using a redemption code.",
        [
          { text: "OK", style: "cancel" },
          { text: "Redeem Code", onPress: () => router.push('/redeem-code' as Href) }
        ]
      );
      return;
    }
    router.push('/data-export' as Href);
  };
  
  const handlePrivacyConsent = () => {
    router.push('/consent' as Href);
  };

  const handlePartnerSharing = () => {
    router.push('/partner-sharing' as Href);
  };

  const handlePartnerSummary = () => {
    router.push('/partner-summary' as Href);
  };

  const handleRelationshipDashboard = () => {
    router.push('/relationship-dashboard' as Href);
  };

  const handlePartnerEducation = () => {
    router.push('/partner-education' as Href);
  };

  const handleSubscriptionManagement = () => {
    router.push('/subscription-management' as Href);
  };
  
  const handleUpgradeToPro = () => {
    router.push('/subscription' as Href);
  };
  

  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Profile',
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={['#F43F5E', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileAvatar}
            >
              <Text style={styles.avatarText}>{(user?.displayName || 'U').charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.profileName}>{user?.displayName || 'Anonymous User'}</Text>
                {isPro && (
                  <View style={styles.proBadge}>
                    <Crown size={12} color={Colors.white} />
                    <Text style={styles.proText}>Pro</Text>
                  </View>
                )}
              </View>
              <Text style={styles.profileEmail}>{user?.uniqueId || 'ID not available'}</Text>
              {user?.birthYear && user?.country && (
                <Text style={styles.profileDetails}>
                  Born {user.birthMonth}/{user.birthYear} • {user.country}
                </Text>
              )}
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
          
          <Button 
            title="Edit Profile" 
            variant="outline"
            onPress={handleEditProfile}
            style={styles.editButton}
          />
        </Card>
        
        {/* Subscription Status */}
        {!isPro ? (
          <Card style={styles.upgradeCard}>
            <View style={styles.upgradeHeader}>
              <Zap size={24} color={Colors.primary} />
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            </View>
            <Text style={styles.upgradeSubtitle}>
              Unlock AI insights, unlimited tracking, and premium features
            </Text>
            <Button 
              title="Upgrade Now"
              onPress={handleUpgradeToPro}
              style={styles.upgradeButton}
            />
          </Card>
        ) : (
          <Card style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Crown size={24} color={Colors.primary} />
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTitle}>
                  {subscriptionInfo.plan === 'monthly' ? 'Monthly Pro' : 'Yearly Pro'}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {subscriptionInfo.daysRemaining} days remaining
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={handleSubscriptionManagement}
              >
                <Text style={styles.manageButtonText}>Details</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        

        
        <View style={styles.lifeStageCard}>
          <View style={styles.lifeStageHeader}>
            <View style={styles.lifeStageIconWrap}>
              <Sparkles size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.lifeStageTitle}>Life Stage</Text>
              <Text style={styles.lifeStageValue}>
                {LIFE_STAGE_OPTIONS.find((o: typeof LIFE_STAGE_OPTIONS[number]) => o.id === user?.lifeStage)?.label || 'Period & Cycle Tracking'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.lifeStageChangeBtn}
              onPress={() => setShowLifeStageModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.lifeStageChangeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {user?.lifeStage !== 'perimenopause' && <View style={styles.pregnancyModeCard}>
          <View style={styles.pregnancyModeHeader}>
            <View style={styles.pregnancyModeIconWrap}>
              <Baby size={22} color={pregnancyMode === 'pregnant' ? '#EC4899' : Colors.subtext} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.pregnancyModeTitle}>
                {pregnancyMode === 'pregnant' ? 'Pregnancy Mode: ON' : 'Pregnancy Mode'}
              </Text>
              <Text style={styles.pregnancyModeSubtitle}>
                {pregnancyMode === 'pregnant'
                  ? 'Your app is in pregnancy tracking mode'
                  : 'Switch to pregnancy tracking when ready'}
              </Text>
            </View>
            <RNSwitch
              value={pregnancyMode === 'pregnant'}
              onValueChange={(value) => {
                if (value) {
                  router.push('/pregnancy-setup' as Href);
                } else {
                  Alert.alert(
                    'Switch Back',
                    'Return to period tracking mode? Your pregnancy data will be kept.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Switch Back',
                        onPress: () => setPregnancyMode(null),
                      },
                    ]
                  );
                }
              }}
              trackColor={{ false: Colors.inactive, true: '#EC4899' }}
              thumbColor={Colors.white}
            />
          </View>
          {pregnancyMode === 'pregnant' && (
            <View style={styles.pregnancyModeActions}>
              <TouchableOpacity
                style={styles.pregnancyModeAction}
                onPress={() => router.push('/pregnancy-setup' as Href)}
              >
                <Text style={styles.pregnancyModeActionText}>Edit Pregnancy Info</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>}

        {(user?.lifeStage === 'period_tracking' || user?.lifeStage === 'trying_to_conceive' || !user?.lifeStage) && (
          <>
            <Text style={styles.sectionTitle}>Cycle Information</Text>
            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average Cycle Length</Text>
                <Text style={styles.infoValue}>{user?.averageCycleLength || 28} days</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Average Period Length</Text>
                <Text style={styles.infoValue}>{user?.averagePeriodLength || 5} days</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tracked Cycles</Text>
                <Text style={styles.infoValue}>{cycles.length}</Text>
              </View>
              
              {user?.commonSymptoms && user.commonSymptoms.length > 0 && (
                <View style={styles.symptomsContainer}>
                  <Text style={styles.infoLabel}>Common Symptoms</Text>
                  <View style={styles.symptomTags}>
                    {user.commonSymptoms.map((symptom: string) => (
                      <View key={symptom} style={styles.symptomTag}>
                        <Text style={styles.symptomTagText}>
                          {symptom.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </>
        )}
        
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Bell size={20} color={Colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <RNSwitch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Shield size={20} color={Colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Emergency Alerts</Text>
            </View>
            <RNSwitch
              value={emergencyAlertsEnabled}
              onValueChange={handleEmergencyAlertsToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Heart size={20} color={Colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>AI Insights</Text>
              {!isPro && (
                <View style={styles.proFeatureBadge}>
                  <Crown size={12} color={Colors.primary} />
                </View>
              )}
            </View>
            <RNSwitch
              value={insightsEnabled && isPro}
              onValueChange={handleInsightsToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
              disabled={!isPro}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Lock size={20} color={Colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Data Encryption</Text>
            </View>
            <RNSwitch
              value={dataEncrypted}
              onValueChange={handleEncryptionToggle}
              trackColor={{ false: Colors.inactive, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </Card>
        
        <Text style={styles.sectionTitle}>Health Tools</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/ai-chatbot' as any)}
          activeOpacity={0.7}
        >
          <Bot size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>AI Health Assistant</Text>
          {!canAccessFeature('aiChatbot') && (
            <View style={styles.proFeatureBadge}>
              <Crown size={12} color={Colors.primary} />
            </View>
          )}
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/advanced-analytics' as any)}
          activeOpacity={0.7}
        >
          <TrendingUp size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Advanced Analytics</Text>
          {!canAccessFeature('advancedAnalytics') && (
            <View style={styles.proFeatureBadge}>
              <Crown size={12} color={Colors.primary} />
            </View>
          )}
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/telehealth' as any)}
          activeOpacity={0.7}
        >
          <Video size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Telehealth Consultation</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleSymptomChecker}
          activeOpacity={0.7}
        >
          <Stethoscope size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>AI Symptom Checker</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>

        {(user?.lifeStage === 'postpartum' || pregnancyMode === 'postpartum' || pregnancyMode === 'pregnant') && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/postpartum-dashboard' as any)}
            activeOpacity={0.7}
            testID="postpartum-dashboard-link"
          >
            <Baby size={20} color="#059669" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Postpartum Dashboard</Text>
            <ChevronRight size={20} color={Colors.subtext} />
          </TouchableOpacity>
        )}

        {(pregnancyMode === 'pregnant' || user?.lifeStage === 'pregnant') && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/pregnancy-dashboard' as any)}
            activeOpacity={0.7}
            testID="pregnancy-dashboard-link"
          >
            <Baby size={20} color="#EC4899" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Pregnancy Dashboard</Text>
            <ChevronRight size={20} color={Colors.subtext} />
          </TouchableOpacity>
        )}

        {user?.lifeStage === 'perimenopause' && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/perimenopause-dashboard' as any)}
            activeOpacity={0.7}
            testID="perimenopause-dashboard-profile"
          >
            <Sparkles size={20} color="#D97706" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Perimenopause Dashboard</Text>
            <ChevronRight size={20} color={Colors.subtext} />
          </TouchableOpacity>
        )}
        
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleReminders}
          activeOpacity={0.7}
        >
          <Bell size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Reminders & Notifications</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleManageContacts}
          activeOpacity={0.7}
        >
          <Shield size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Emergency Contacts</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleDataExport}
          activeOpacity={0.7}
        >
          <Download size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Export Your Data</Text>
          {!canAccessFeature('exportData') && (
            <View style={styles.proFeatureBadge}>
              <Crown size={12} color={Colors.primary} />
            </View>
          )}
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/redeem-code' as Href)}
          activeOpacity={0.7}
        >
          <Gift size={20} color={Colors.gold} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Redeem Code</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        {isPro && (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleSubscriptionManagement}
            activeOpacity={0.7}
          >
            <Crown size={20} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Manage Subscription</Text>
            <ChevronRight size={20} color={Colors.subtext} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handlePrivacyConsent}
          activeOpacity={0.7}
        >
          <Key size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Privacy Consent</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>

        {isViewer ? (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handlePartnerSummary}
            activeOpacity={0.7}
            testID="partner-summary-link"
          >
            <Users size={20} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Partner Summary</Text>
            <ChevronRight size={20} color={Colors.subtext} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handlePartnerSharing}
            activeOpacity={0.7}
            testID="partner-sharing-link"
          >
            <Users size={20} color={Colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Partner Sharing</Text>
            <ChevronRight size={20} color={Colors.subtext} />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleRelationshipDashboard}
          activeOpacity={0.7}
          testID="relationship-dashboard-link"
        >
          <TrendingUp size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Relationship Dashboard</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handlePartnerEducation}
          activeOpacity={0.7}
          testID="partner-education-link"
        >
          <BookOpen size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Partner Education</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handlePrivacyPolicy}
          activeOpacity={0.7}
        >
          <Lock size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleTermsOfService}
          activeOpacity={0.7}
        >
          <FileText size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleHelp}
          activeOpacity={0.7}
        >
          <HelpCircle size={20} color={Colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuItemText}>Help & Support</Text>
          <ChevronRight size={20} color={Colors.subtext} />
        </TouchableOpacity>
        
<TouchableOpacity 
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.error} style={styles.menuIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>F365 v1.0.0</Text>
        
        <View style={styles.hipaaContainer}>
          <Shield size={16} color={Colors.primary} />
          <Text style={styles.hipaaText}>HIPAA Compliant</Text>
        </View>
        {showLifeStageModal && (
          <View />
        )}
      </ScrollView>

      <Modal
        visible={showLifeStageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLifeStageModal(false)}
      >
        <TouchableOpacity
          style={styles.lifeStageModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLifeStageModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.lifeStageModalContent}>
            <Text style={styles.lifeStageModalTitle}>Change Life Stage</Text>
            <Text style={styles.lifeStageModalSubtitle}>Select your current stage</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {LIFE_STAGE_OPTIONS.map((option: typeof LIFE_STAGE_OPTIONS[number]) => {
                const isSelected = user?.lifeStage === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.lifeStageOption,
                      isSelected && styles.lifeStageOptionActive,
                    ]}
                    onPress={() => {
                      updateUser({ lifeStage: option.id });
                      if (option.id === 'pregnant') {
                        setPregnancyMode('pregnant');
                      } else if (option.id === 'postpartum') {
                        setPregnancyMode('postpartum');
                      } else {
                        setPregnancyMode(null);
                      }
                      setShowLifeStageModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.lifeStageOptionEmoji}>{option.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.lifeStageOptionLabel,
                        isSelected && styles.lifeStageOptionLabelActive,
                      ]}>{option.label}</Text>
                      <Text style={styles.lifeStageOptionDesc}>{option.description}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.lifeStageCheckmark}>
                        <Check size={14} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.lifeStageModalClose}
              onPress={() => setShowLifeStageModal(false)}
            >
              <Text style={styles.lifeStageModalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 32,
  },
  profileCard: {
    padding: 16,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
    overflow: 'hidden' as const,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.subtext,
  },
  profileDetails: {
    fontSize: 14,
    color: Colors.subtext,
    marginTop: 4,
  },
  adminBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  adminBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  upgradeCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
  },
  subscriptionCard: {
    padding: 16,
    marginBottom: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
    marginLeft: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: Colors.subtext,
  },
  manageButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  symptomsContainer: {
    marginTop: 8,
  },
  symptomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  symptomTag: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  symptomTagText: {
    fontSize: 12,
    color: Colors.text,
  },
  settingsCard: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  proFeatureBadge: {
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  logoutButton: {
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },
  versionText: {
    fontSize: 12,
    color: Colors.subtext,
    textAlign: 'center',
    marginTop: 32,
  },
  hipaaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  hipaaText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  pregnancyModeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  pregnancyModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pregnancyModeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pregnancyModeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pregnancyModeSubtitle: {
    fontSize: 13,
    color: Colors.subtext,
    marginTop: 2,
  },
  pregnancyModeActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FCE7F3',
  },
  pregnancyModeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pregnancyModeActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  lifeStageCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  lifeStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifeStageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifeStageTitle: {
    fontSize: 13,
    color: Colors.subtext,
    fontWeight: '500' as const,
  },
  lifeStageValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 2,
  },
  lifeStageChangeBtn: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  lifeStageChangeBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  lifeStageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifeStageModalContent: {
    width: '88%',
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  lifeStageModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  lifeStageModalSubtitle: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  lifeStageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: 8,
  },
  lifeStageOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  lifeStageOptionEmoji: {
    fontSize: 26,
    marginRight: 12,
  },
  lifeStageOptionLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  lifeStageOptionLabelActive: {
    color: Colors.primary,
  },
  lifeStageOptionDesc: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 2,
  },
  lifeStageCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  lifeStageModalClose: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  lifeStageModalCloseText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.subtext,
  },
});