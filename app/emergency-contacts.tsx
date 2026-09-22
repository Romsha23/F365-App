import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Phone,
  Plus,
  Trash2,
  X,
  User,
  Shield,
  AlertTriangle,
  Heart,
  Star,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

const STORAGE_KEY = '@emergency_contacts';

const DEFAULT_EMERGENCY_NUMBERS = [
  { name: 'Emergency Services', phone: '000', description: 'Police, Fire, Ambulance (Australia)' },
  { name: 'PANDA Helpline', phone: '1300 726 306', description: 'Perinatal Anxiety & Depression' },
  { name: 'Lifeline', phone: '13 11 14', description: '24/7 Crisis Support' },
  { name: 'Pregnancy Birth Baby', phone: '1800 882 436', description: 'Free pregnancy support line' },
  { name: 'Health Direct', phone: '1800 022 222', description: 'Nurse triage & health advice' },
];

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [_isLoading, setIsLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void loadContacts();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      console.log('[EmergencyContacts] Loading contacts...');

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const local: EmergencyContact[] = stored ? JSON.parse(stored) : [];

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('user_id', user.id)
            .order('is_primary', { ascending: false });

          if (!error && data && data.length > 0) {
            const merged = data.map((row: any) => ({
              id: row.id,
              name: row.name,
              phone: row.phone,
              relationship: row.relationship || '',
              isPrimary: row.is_primary || false,
            }));
            setContacts(merged);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            console.log('[EmergencyContacts] Loaded from Supabase:', merged.length);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        console.log('[EmergencyContacts] Supabase not available, using local');
      }

      setContacts(local);
      setIsLoading(false);
      console.log('[EmergencyContacts] Loaded from local:', local.length);
    } catch (error) {
      console.error('[EmergencyContacts] Load error:', error);
      setIsLoading(false);
    }
  };

  const saveContact = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a contact name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter a phone number.');
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
      isPrimary,
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('emergency_contacts').insert({
          id: newContact.id,
          user_id: user.id,
          name: newContact.name,
          phone: newContact.phone,
          relationship: newContact.relationship,
          is_primary: newContact.isPrimary,
        });
        console.log('[EmergencyContacts] Synced to Supabase');
      }
    } catch {
      console.log('[EmergencyContacts] Supabase sync skipped');
    }

    setName('');
    setPhone('');
    setRelationship('');
    setIsPrimary(false);
    setShowForm(false);
    console.log('[EmergencyContacts] Contact added:', newContact.name);
  }, [name, phone, relationship, isPrimary, contacts]);

  const deleteContact = useCallback(async (id: string) => {
    Alert.alert('Delete Contact', 'Remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = contacts.filter(c => c.id !== id);
          setContacts(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('emergency_contacts').delete().eq('id', id).eq('user_id', user.id);
            }
          } catch {
            console.log('[EmergencyContacts] Supabase delete skipped');
          }
          console.log('[EmergencyContacts] Contact deleted:', id);
        },
      },
    ]);
  }, [contacts]);

  const callNumber = useCallback((phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    const url = Platform.OS === 'web' ? `tel:${cleaned}` : `tel:${cleaned}`;
    void Linking.canOpenURL(url).then(supported => {
      if (supported) {
        void Linking.openURL(url);
      } else {
        Alert.alert('Cannot make call', `Please call ${phoneNumber} manually.`);
      }
    });
  }, []);

  const primaryContacts = contacts.filter(c => c.isPrimary);
  const otherContacts = contacts.filter(c => !c.isPrimary);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Emergency Contacts' }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.emergencyCard}>
            <AlertTriangle size={20} color="#DC2626" />
            <Text style={styles.emergencyTitle}>In an Emergency</Text>
            <Text style={styles.emergencyText}>
              If you or your baby are in immediate danger, call 000 (Australia) immediately.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Quick Dial — Helplines</Text>
          {DEFAULT_EMERGENCY_NUMBERS.map((num, i) => (
            <TouchableOpacity
              key={i}
              style={styles.helplineCard}
              onPress={() => callNumber(num.phone)}
              activeOpacity={0.7}
            >
              <View style={styles.helplineIcon}>
                <Phone size={16} color={Colors.white} />
              </View>
              <View style={styles.helplineInfo}>
                <Text style={styles.helplineName}>{num.name}</Text>
                <Text style={styles.helplineDesc}>{num.description}</Text>
              </View>
              <Text style={styles.helplinePhone}>{num.phone}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          <View style={styles.personalHeader}>
            <Text style={styles.sectionTitle}>Your Emergency Contacts</Text>
            {!showForm && (
              <TouchableOpacity style={styles.addPill} onPress={() => setShowForm(true)} testID="add-contact">
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.addPillText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {showForm && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>New Contact</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <X size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <User size={16} color={Colors.primary} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Contact name"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Phone size={16} color={Colors.accent} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Heart size={16} color="#EC4899" />
                <TextInput
                  style={styles.input}
                  value={relationship}
                  onChangeText={setRelationship}
                  placeholder="Relationship (e.g. Partner, Doctor)"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryToggle}
                onPress={() => setIsPrimary(!isPrimary)}
              >
                <Star size={16} color={isPrimary ? '#F59E0B' : Colors.textLight} fill={isPrimary ? '#F59E0B' : 'transparent'} />
                <Text style={[styles.primaryToggleText, isPrimary && { color: '#F59E0B', fontWeight: '700' as const }]}>
                  Primary contact
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={saveContact}>
                <Text style={styles.saveButtonText}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          )}

          {primaryContacts.length > 0 && (
            <View style={styles.contactSection}>
              <Text style={styles.contactSectionLabel}>Primary Contacts</Text>
              {primaryContacts.map(contact => (
                <View key={contact.id} style={[styles.contactCard, styles.primaryContactCard]}>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactNameRow}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.contactName}>{contact.name}</Text>
                    </View>
                    {contact.relationship && (
                      <Text style={styles.contactRelation}>{contact.relationship}</Text>
                    )}
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity style={styles.callButton} onPress={() => callNumber(contact.phone)}>
                      <Phone size={16} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteContact(contact.id)}>
                      <Trash2 size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {otherContacts.length > 0 && (
            <View style={styles.contactSection}>
              {primaryContacts.length > 0 && <Text style={styles.contactSectionLabel}>Other Contacts</Text>}
              {otherContacts.map(contact => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.relationship && (
                      <Text style={styles.contactRelation}>{contact.relationship}</Text>
                    )}
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity style={styles.callButton} onPress={() => callNumber(contact.phone)}>
                      <Phone size={16} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteContact(contact.id)}>
                      <Trash2 size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {contacts.length === 0 && !showForm && (
            <View style={styles.emptyState}>
              <Shield size={40} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No Personal Contacts</Text>
              <Text style={styles.emptyText}>
                Add your partner, family, doctor, or midwife for quick access during emergencies.
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emergencyCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#DC2626',
    marginTop: 8,
  },
  emergencyText: {
    fontSize: 13,
    color: '#991B1B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  helplineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  helplineIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineInfo: {
    flex: 1,
  },
  helplineName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  helplineDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  helplinePhone: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  personalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary + '12',
  },
  addPillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  primaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  primaryToggleText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  contactSection: {
    marginBottom: 12,
  },
  contactSectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  primaryContactCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  contactInfo: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  contactRelation: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    paddingHorizontal: 32,
  },
});
