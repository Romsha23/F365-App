import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, TextInput, FlatList } from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { COUNTRIES, Country, getCountryByCode, getCountryByName } from '@/constants/countries';

interface CountryPickerProps {
  value: string;
  onSelect: (country: string) => void;
  placeholder?: string;
}

export const CountryPicker = React.memo(function CountryPicker({ value, onSelect, placeholder = 'Select your country' }: CountryPickerProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const displayValue = useMemo(() => {
    if (!value) return '';
    const byCode = getCountryByCode(value);
    if (byCode) return `${byCode.flag} ${byCode.name}`;
    const byName = getCountryByName(value);
    if (byName) return `${byName.flag} ${byName.name}`;
    return value;
  }, [value]);

  const handleSelect = useCallback((country: Country) => {
    onSelect(country.name);
    setVisible(false);
    setSearch('');
  }, [onSelect]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setSearch('');
  }, []);

  const renderItem = useCallback(({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[styles.item, value === item.name && styles.itemSelected]}
      onPress={() => handleSelect(item)}
      testID={`country-${item.code}`}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={[styles.itemText, value === item.name && styles.itemTextSelected]}>{item.name}</Text>
      <Text style={styles.itemCode}>{item.code}</Text>
    </TouchableOpacity>
  ), [value, handleSelect]);

  const keyExtractor = useCallback((item: Country) => item.code, []);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        testID="country-picker-trigger"
      >
        <Text style={displayValue ? styles.triggerText : styles.triggerPlaceholder}>
          {displayValue || placeholder}
        </Text>
        <ChevronDown size={20} color={Colors.text} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modal}>
                <View style={styles.header}>
                  <Text style={styles.title}>Select Country</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <X size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <Search size={18} color={Colors.inactive} />
                  <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search countries..."
                    placeholderTextColor={Colors.inactive}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="country-search-input"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <X size={16} color={Colors.inactive} />
                    </TouchableOpacity>
                  )}
                </View>

                {filtered.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No countries found</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    style={styles.list}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={20}
                    maxToRenderPerBatch={30}
                    windowSize={10}
                    getItemLayout={(_, index) => ({
                      length: 48,
                      offset: 48 * index,
                      index,
                    })}
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triggerText: {
    color: Colors.text,
    fontSize: 14,
    flex: 1,
  },
  triggerPlaceholder: {
    color: Colors.inactive,
    fontSize: 14,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '75%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginLeft: 8,
    paddingVertical: 4,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  itemSelected: {
    backgroundColor: Colors.primary + '15',
  },
  flag: {
    fontSize: 22,
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  itemTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  itemCode: {
    fontSize: 13,
    color: Colors.inactive,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.inactive,
    fontSize: 15,
  },
});
