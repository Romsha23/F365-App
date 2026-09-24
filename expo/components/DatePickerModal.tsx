import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import Colors from '../constants/colors';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  selectedDate?: string;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function DatePickerModal({
  visible,
  onClose,
  onSelect,
  selectedDate,
  title = 'Select Date',
  minDate,
  maxDate,
}: DatePickerModalProps) {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const parsedMin = useMemo(() => (minDate ? new Date(minDate) : null), [minDate]);
  const parsedMax = useMemo(() => (maxDate ? new Date(maxDate) : null), [maxDate]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const goToPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  }, [viewMonth]);

  const goToNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  }, [viewMonth]);

  const isDateDisabled = useCallback((day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (parsedMin && date < parsedMin) return true;
    if (parsedMax && date > parsedMax) return true;
    return false;
  }, [viewYear, viewMonth, parsedMin, parsedMax]);

  const handleDayPress = useCallback((day: number) => {
    if (isDateDisabled(day)) return;
    const dateStr = formatDateStr(viewYear, viewMonth, day);
    onSelect(dateStr);
    onClose();
  }, [viewYear, viewMonth, onSelect, onClose, isDateDisabled]);

  const isSelected = useCallback((day: number) => {
    if (!selectedDate) return false;
    return selectedDate === formatDateStr(viewYear, viewMonth, day);
  }, [selectedDate, viewYear, viewMonth]);

  const isToday = useCallback((day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  }, [viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [firstDay, daysInMonth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton} hitSlop={8}>
              <ChevronLeft size={22} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton} hitSlop={8}>
              <ChevronRight size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(wd => (
              <View key={wd} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{wd}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, idx) => (
              <View key={idx} style={styles.dayCell}>
                {day !== null ? (
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      isSelected(day) && styles.dayButtonSelected,
                      isToday(day) && !isSelected(day) && styles.dayButtonToday,
                      isDateDisabled(day) && styles.dayButtonDisabled,
                    ]}
                    onPress={() => handleDayPress(day)}
                    disabled={isDateDisabled(day)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected(day) && styles.dayTextSelected,
                        isToday(day) && !isSelected(day) && styles.dayTextToday,
                        isDateDisabled(day) && styles.dayTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>

          {selectedDate && (
            <View style={styles.selectedPreview}>
              <Text style={styles.selectedPreviewText}>{selectedDate}</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%' as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dayButtonToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  dayTextDisabled: {
    color: Colors.textLight,
  },
  selectedPreview: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.muted,
    borderRadius: 10,
  },
  selectedPreviewText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
