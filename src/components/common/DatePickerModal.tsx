import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import Button from './Button';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (durationText: string) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeInput, setActiveInput] = useState<'start' | 'end'>('start');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
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

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in current month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // First day of current month (0-6)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDatePress = (day: number) => {
    const clickedDate = new Date(year, month, day);

    if (activeInput === 'start') {
      setStartDate(clickedDate);
      if (endDate && clickedDate > endDate) {
        setEndDate(null);
      }
      setActiveInput('end');
    } else {
      if (startDate && clickedDate < startDate) {
        setStartDate(clickedDate);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  const isSelected = (day: number) => {
    const date = new Date(year, month, day);
    if (startDate && date.getTime() === startDate.getTime()) return 'start';
    if (endDate && date.getTime() === endDate.getTime()) return 'end';
    if (startDate && endDate && date > startDate && date < endDate) return 'range';
    return null;
  };

  const calculateDurationText = (): string => {
    if (!startDate) return '';
    if (!endDate) {
      return `Started ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startYear = startDate.getFullYear();

    if (diffDays === 1) {
      return `1 day · ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    if (diffDays < 7) {
      return `${diffDays} days · ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    if (diffDays >= 7 && diffDays < 28) {
      const weeks = Math.round(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} · ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    // Month calculations
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    if (months <= 0) {
      const weeks = Math.round(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} · ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const endYear = endDate.getFullYear();

    if (startYear === endYear) {
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${months + 1} months · ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      }
      return `${months + 1} months · ${startMonth} - ${endMonth} ${startYear}`;
    }

    return `${months + 1} months · ${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  const handleConfirm = () => {
    const text = calculateDurationText();
    if (text) {
      onConfirm(text);
      onClose();
    }
  };

  const renderDays = () => {
    const dayCells = [];

    // Empty cells for first day offset
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days cells
    for (let day = 1; day <= daysInMonth; day++) {
      const selection = isSelected(day);
      const isStart = selection === 'start';
      const isEnd = selection === 'end';
      const isRange = selection === 'range';

      dayCells.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell,
            isStart && styles.startDay,
            isEnd && styles.endDay,
            isRange && styles.rangeDay,
          ]}
          onPress={() => handleDatePress(day)}
        >
          <Text
            style={[
              styles.dayText,
              (isStart || isEnd) && styles.selectedDayText,
              isRange && styles.rangeDayText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>,
      );
    }

    return dayCells;
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header Drag Bar */}
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Dates</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Range display summary */}
            <View style={styles.summaryContainer}>
              <TouchableOpacity
                style={[styles.summaryBox, activeInput === 'start' && styles.summaryBoxActive]}
                onPress={() => setActiveInput('start')}
              >
                <Text style={styles.summaryLabel}>FROM</Text>
                <Text style={styles.summaryValue}>
                  {startDate
                    ? startDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Select start'}
                </Text>
              </TouchableOpacity>

              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.inkMuted}
                style={styles.summaryArrow}
              />

              <TouchableOpacity
                style={[styles.summaryBox, activeInput === 'end' && styles.summaryBoxActive]}
                onPress={() => setActiveInput('end')}
              >
                <Text style={styles.summaryLabel}>TO</Text>
                <Text style={styles.summaryValue}>
                  {endDate
                    ? endDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Select end'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Calendar Controller */}
            <View style={styles.calendarControl}>
              <TouchableOpacity onPress={prevMonth} style={styles.arrowButton}>
                <Ionicons name="chevron-back" size={20} color={colors.ink} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {monthNames[month]} {year}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.arrowButton}>
                <Ionicons name="chevron-forward" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
              <View style={styles.daysHeader}>
                {daysOfWeek.map((d, index) => (
                  <Text key={index} style={styles.dayOfWeekText}>
                    {d}
                  </Text>
                ))}
              </View>
              <View style={styles.daysGrid}>{renderDays()}</View>
            </View>

            {/* Output Preview */}
            {startDate && (
              <View style={styles.durationPreview}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.durationPreviewText}>{calculateDurationText()}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <Button label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button
              label="Confirm"
              variant="primary"
              disabled={!startDate}
              onPress={handleConfirm}
              style={{ flex: 2 }}
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
    backgroundColor: 'rgba(43, 31, 21, 0.4)', // Ink overlaid color
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 38,
    height: 4,
    backgroundColor: colors.inkFaint,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  closeButton: {
    padding: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCream,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  summaryBox: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  summaryBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  summaryLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.inkMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  summaryArrow: {
    marginHorizontal: 16,
  },
  calendarControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.paperCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dayText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  startDay: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  endDay: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  rangeDay: {
    backgroundColor: colors.primarySoft,
  },
  selectedDayText: {
    fontFamily: fonts.bodyBold,
    color: colors.white,
  },
  rangeDayText: {
    color: colors.primaryDark,
    fontFamily: fonts.bodySemiBold,
  },
  durationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryTint,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  durationPreviewText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
