import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { TERMS_SECTIONS_EN, TERMS_SECTIONS_TL } from '../../constants/termsOfService';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  visible,
  onClose,
  onAccept,
  showAcceptButton = false,
}) => {
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);

  const sections = language === 'tl' ? TERMS_SECTIONS_TL : TERMS_SECTIONS_EN;
  const title =
    t('terms_of_service') ||
    (language === 'tl' ? 'Mga Tuntunin sa Paggamit' : 'Terms & Conditions');
  const closeLabel = t('close') || (language === 'tl' ? 'Isara' : 'Close');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: bottomInset + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="document-text-outline" size={22} color="#4F46E5" />
            </View>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.body}
            bounces={false}
          >
            {sections.map((s, i) => (
              <View key={i} style={styles.sectionItem}>
                {s.heading ? <Text style={styles.heading}>{s.heading}</Text> : null}
                <Text style={styles.bodyText}>{s.body}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footerActions}>
            {showAcceptButton && onAccept ? (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => {
                  onAccept();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptBtnText}>
                  {language === 'tl' ? 'Naiintindihan at Sumasang-ayon Ako' : 'I Agree & Continue'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.closeFullBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeFullBtnText}>{closeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.ink,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingVertical: 4,
    paddingBottom: 16,
  },
  sectionItem: {
    marginBottom: 18,
  },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 5,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  footerActions: {
    marginTop: 10,
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeFullBtn: {
    backgroundColor: colors.paper,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  closeFullBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.inkSoft,
    letterSpacing: 0.3,
  },
});

export default TermsOfServiceModal;
