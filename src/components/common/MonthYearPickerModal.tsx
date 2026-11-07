import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import Button from './Button';

export interface MonthYearValue {
  month: number; // 0-11
  year: number; // e.g. 2024
}

interface MonthYearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (val: MonthYearValue) => void;
  title?: string;
  initialValue?: MonthYearValue | null;
  minYear?: number;
  maxYear?: number;
  maxDate?: MonthYearValue; // Cannot select after this
  minDate?: MonthYearValue; // Cannot select before this
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  title = 'Select Month & Year',
  initialValue,
  minYear = 1980,
  maxYear = new Date().getFullYear(),
  maxDate,
  minDate,
}) => {
  const current = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(
    initialValue?.year ?? current.getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialValue?.month ?? current.getMonth(),
  );

  // Sync state if initialValue changes when opening
  React.useEffect(() => {
    if (visible) {
      if (initialValue) {
        setSelectedYear(initialValue.year);
        setSelectedMonth(initialValue.month);
      } else {
        setSelectedYear(current.getFullYear());
        setSelectedMonth(current.getMonth());
      }
    }
  }, [visible, initialValue]);

  const isMonthDisabled = (mIndex: number): boolean => {
    if (maxDate) {
      if (selectedYear > maxDate.year) return true;
      if (selectedYear === maxDate.year && mIndex > maxDate.month) return true;
    }
    if (minDate) {
      if (selectedYear < minDate.year) return true;
      if (selectedYear === minDate.year && mIndex < minDate.month) return true;
    }
    return false;
  };

  const handlePrevYear = () => {
    if (selectedYear > minYear) {
      setSelectedYear((prev) => prev - 1);
    }
  };

  const handleNextYear = () => {
    if (selectedYear < maxYear) {
      setSelectedYear((prev) => prev + 1);
    }
  };

  const handleConfirm = () => {
    onSelect({ month: selectedMonth, year: selectedYear });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>

          {/* Year selector header with arrows */}
          <View style={styles.yearControl}>
            <TouchableOpacity
              onPress={handlePrevYear}
              disabled={selectedYear <= minYear}
              style={[styles.arrowButton, selectedYear <= minYear && styles.arrowDisabled]}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={selectedYear <= minYear ? colors.inkFaint : colors.ink}
              />
            </TouchableOpacity>
            <Text style={styles.yearLabel}>{selectedYear}</Text>
            <TouchableOpacity
              onPress={handleNextYear}
              disabled={selectedYear >= maxYear}
              style={[styles.arrowButton, selectedYear >= maxYear && styles.arrowDisabled]}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={selectedYear >= maxYear ? colors.inkFaint : colors.ink}
              />
            </TouchableOpacity>
          </View>

          {/* 12-Month Grid */}
          <View style={styles.monthGrid}>
            {MONTH_NAMES_SHORT.map((mName, idx) => {
              const isSelected = selectedMonth === idx;
              const disabled = isMonthDisabled(idx);

              return (
                <TouchableOpacity
                  key={mName}
                  style={[
                    styles.monthCell,
                    isSelected && styles.monthCellSelected,
                    disabled && styles.monthCellDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => setSelectedMonth(idx)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.monthCellText,
                      isSelected && styles.monthCellTextSelected,
                      disabled && styles.monthCellTextDisabled,
                    ]}
                  >
                    {mName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Current Selection Pill */}
          <View style={styles.previewBox}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.previewText}>
              Selected:{' '}
              <Text style={styles.previewHighlight}>
                {MONTH_NAMES_FULL[selectedMonth]} {selectedYear}
              </Text>
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <Button label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button
              label="Select"
              variant="primary"
              onPress={handleConfirm}
              style={{ flex: 1.5 }}
              disabled={isMonthDisabled(selectedMonth)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 31, 21, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.paperBright,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.inkFaint,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  closeButton: {
    padding: 4,
  },
  yearControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paper,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  yearLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  arrowButton: {
    padding: 6,
    borderRadius: 8,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthCell: {
    width: '31%',
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthCellDisabled: {
    backgroundColor: colors.paper,
    opacity: 0.35,
    borderColor: colors.inkFaint,
  },
  monthCellText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  monthCellTextSelected: {
    color: colors.white,
  },
  monthCellTextDisabled: {
    color: colors.inkMuted,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryTint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  previewText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  previewHighlight: {
    fontFamily: fonts.bodyBold,
    color: colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
});
