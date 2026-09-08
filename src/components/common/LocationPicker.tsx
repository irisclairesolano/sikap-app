import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BARANGAYS_BY_MUNICIPALITY, MUNICIPALITIES } from '../../constants/locations';
import { colors, fonts } from '../../theme';

type LocationPickerProps = {
  municipalityValue: string;
  barangayValue: string;
  onMunicipalityChange: (value: string) => void;
  onBarangayChange: (value: string) => void;
  municipalityError?: string;
  barangayError?: string;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  municipalityValue,
  barangayValue,
  onMunicipalityChange,
  onBarangayChange,
  municipalityError,
  barangayError,
}) => {
  const insets = useSafeAreaInsets();
  const [municipalityModalVisible, setMunicipalityModalVisible] = React.useState(false);
  const [barangayModalVisible, setBarangayModalVisible] = React.useState(false);

  // Memoize barangay options to prevent re-calculation
  const barangayOptions = useMemo(() => {
    return BARANGAYS_BY_MUNICIPALITY[municipalityValue] || [];
  }, [municipalityValue]);

  // Memoize municipality options
  const municipalityOptions = useMemo(() => MUNICIPALITIES, []);

  const handleMunicipalitySelect = useCallback(
    (municipality: string) => {
      onMunicipalityChange(municipality);
      onBarangayChange(''); // Reset barangay when municipality changes
      setMunicipalityModalVisible(false);
    },
    [onMunicipalityChange, onBarangayChange],
  );

  const handleBarangaySelect = useCallback(
    (barangay: string) => {
      onBarangayChange(barangay);
      setBarangayModalVisible(false);
    },
    [onBarangayChange],
  );

  // Memoize modal content to prevent re-rendering
  const renderMunicipalityModal = useMemo(
    () => (
      <Modal
        visible={municipalityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMunicipalityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={() => setMunicipalityModalVisible(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Municipality</Text>
              <TouchableOpacity
                onPress={() => setMunicipalityModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 36) }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {municipalityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionItem}
                  onPress={() => handleMunicipalitySelect(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    ),
    [municipalityModalVisible, municipalityOptions, handleMunicipalitySelect, insets.bottom],
  );

  // Memoize barangay modal content
  const renderBarangayModal = useMemo(
    () => (
      <Modal
        visible={barangayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBarangayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={() => setBarangayModalVisible(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity
                onPress={() => setBarangayModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 36) }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {barangayOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionItem}
                  onPress={() => handleBarangaySelect(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    ),
    [barangayModalVisible, barangayOptions, handleBarangaySelect, insets.bottom],
  );

  return (
    <View style={styles.container}>
      {/* Municipality Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>
          Municipality <Text style={{ color: colors.error }}>*</Text>
        </Text>
        <TouchableOpacity
          style={[styles.pickerButton, municipalityError && styles.pickerButtonError]}
          onPress={() => setMunicipalityModalVisible(true)}
        >
          <Text style={[styles.pickerText, !municipalityValue && styles.pickerPlaceholder]}>
            {municipalityValue || 'Select municipality'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.inkSoft} />
        </TouchableOpacity>
        {municipalityError ? <Text style={styles.errorText}>{municipalityError}</Text> : null}

        {/* Show selected municipality when available */}
        {municipalityValue ? (
          <Text style={styles.selectedValue}>Selected: {municipalityValue}</Text>
        ) : null}
      </View>

      {/* Barangay Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>
          Barangay <Text style={{ color: colors.error }}>*</Text>
        </Text>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            barangayError && styles.pickerButtonError,
            !municipalityValue && styles.pickerButtonDisabled,
          ]}
          onPress={() => {
            if (municipalityValue) {
              setBarangayModalVisible(true);
            }
          }}
          disabled={!municipalityValue}
        >
          <Text
            style={[
              styles.pickerText,
              !barangayValue && styles.pickerPlaceholder,
              !municipalityValue && styles.pickerTextDisabled,
            ]}
          >
            {barangayValue || (municipalityValue ? 'Select barangay' : 'Select municipality first')}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={municipalityValue ? colors.inkSoft : colors.inkFaint}
          />
        </TouchableOpacity>
        {barangayError ? <Text style={styles.errorText}>{barangayError}</Text> : null}

        {/* Show selected barangay when available */}
        {barangayValue ? <Text style={styles.selectedValue}>Selected: {barangayValue}</Text> : null}
      </View>

      {/* Modals */}
      {municipalityModalVisible ? renderMunicipalityModal : null}
      {barangayModalVisible ? renderBarangayModal : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  pickerContainer: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  pickerButtonError: {
    borderColor: colors.error,
  },
  pickerButtonDisabled: {
    backgroundColor: colors.white,
    opacity: 0.6,
    borderColor: colors.inkFaint,
  },
  pickerText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
  pickerPlaceholder: {
    color: colors.inkSoft,
  },
  pickerTextDisabled: {
    color: colors.inkFaint,
  },
  selectedValue: {
    marginTop: 4,
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  optionsList: {
    paddingHorizontal: 20,
    maxHeight: 450,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  optionText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
});

export default LocationPicker;
