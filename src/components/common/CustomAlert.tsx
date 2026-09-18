import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { sanitizeErrorMessage } from '../../utils/errorSanitizer';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onRequestClose?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onRequestClose,
}) => {
  const cleanTitle = sanitizeErrorMessage(title);
  const cleanMessage = message ? sanitizeErrorMessage(message) : undefined;

  // Contextual icon and background tint
  const lowerTitle = cleanTitle.toLowerCase();
  const hasDestructive = buttons.some((b) => b.style === 'destructive');

  let iconName: keyof typeof Ionicons.glyphMap = 'information-circle-outline';
  let iconColor: string = colors.primary;
  let iconBg: string = colors.peach;

  if (
    hasDestructive ||
    lowerTitle.includes('cancel') ||
    lowerTitle.includes('decline') ||
    lowerTitle.includes('delete')
  ) {
    iconName = 'warning-outline';
    iconColor = colors.error;
    iconBg = '#FEE2E2';
  } else if (
    lowerTitle.includes('error') ||
    lowerTitle.includes('fail') ||
    lowerTitle.includes('invalid')
  ) {
    iconName = 'alert-circle-outline';
    iconColor = colors.error;
    iconBg = '#FEE2E2';
  } else if (
    lowerTitle.includes('success') ||
    lowerTitle.includes('complete') ||
    lowerTitle.includes('confirmed')
  ) {
    iconName = 'checkmark-circle-outline';
    iconColor = colors.success;
    iconBg = '#DCFCE7';
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={28} color={iconColor} />
          </View>
          <Text style={styles.title}>{cleanTitle}</Text>
          {cleanMessage ? <Text style={styles.message}>{cleanMessage}</Text> : null}

          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => (
              <Button
                key={index}
                label={btn.text}
                variant={
                  btn.style === 'destructive'
                    ? 'danger'
                    : btn.style === 'cancel'
                      ? 'ghost'
                      : 'primary'
                }
                style={styles.button}
                onPress={() => {
                  btn.onPress?.();
                  if (!btn.onPress) {
                    onRequestClose?.();
                  }
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 20, 15, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    backgroundColor: colors.paperBright,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 222, 0.85)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
  },
  button: {
    width: '100%',
  },
});

export default CustomAlert;
