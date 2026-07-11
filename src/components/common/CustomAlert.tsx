import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../../theme';
import Button from './Button';

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
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => (
              <Button
                key={index}
                label={btn.text}
                variant={btn.style === 'cancel' ? 'ghost' : 'primary'}
                style={[
                  styles.button,
                  btn.style === 'destructive' && {
                    backgroundColor: colors.error,
                    borderColor: colors.error,
                  },
                ]}
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
    backgroundColor: 'rgba(43, 31, 21, 0.6)', // ink overlaid
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    backgroundColor: colors.paper,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
  },
});

export default CustomAlert;
