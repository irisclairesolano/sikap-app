import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { TermsOfServiceModal } from './TermsOfServiceModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface LegalConsentCheckboxProps {
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
}

export const LegalConsentCheckbox: React.FC<LegalConsentCheckboxProps> = ({
  checked,
  onChange,
}) => {
  const { language, t } = useLanguage();
  const isTagalog = language === 'tl';

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <View style={styles.consentCard}>
        <TouchableOpacity
          style={styles.checkboxTouch}
          onPress={() => onChange(!checked)}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        <View style={styles.consentTextContainer}>
          <Text style={styles.consentText}>
            {isTagalog ? 'Nabasa at sumasang-ayon ako sa ' : 'I have read and agree to the '}
            <Text style={styles.consentLink} onPress={() => setShowTermsModal(true)}>
              {isTagalog ? 'Mga Tuntunin at Kundisyon' : 'Terms & Conditions'}
            </Text>
            {isTagalog ? ' at ' : ' and '}
            <Text style={styles.consentLink} onPress={() => setShowPrivacyModal(true)}>
              {t('privacy_policy') || (isTagalog ? 'Patakaran sa Privacy' : 'Privacy Policy')}
            </Text>
            .
          </Text>
        </View>
      </View>

      <TermsOfServiceModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        showAcceptButton={true}
        onAccept={() => onChange(true)}
      />

      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        showAcceptButton={true}
        onAccept={() => onChange(true)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.inkMuted,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentTextContainer: {
    flex: 1,
  },
  consentText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  consentLink: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default LegalConsentCheckbox;
