import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Input as RNEInput } from 'react-native-elements';
import { colors, fonts } from '../../theme';

export type InputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  status?: 'valid' | 'invalid' | null;
  statusText?: string;
  icon?: any;
  rightIcon?: {
    name: string;
    type?: string;
    onPress: () => void;
  };
};

const CustomInput: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry,
  multiline,
  maxLength,
  keyboardType,
  editable,
  status,
  statusText,
  icon,
  rightIcon,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Convert label to sentence case (if requested format is e.g. "FULL NAME")
  const sentenceCaseLabel = label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : '';

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{sentenceCaseLabel}</Text> : null}
      <View style={[
        styles.focusRing,
        isFocused && styles.focusRingActive
      ]}>
        <RNEInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          editable={editable}
          leftIcon={icon ? { type: 'ionicon', name: icon, color: colors.inkMuted, size: 20 } : undefined}
          rightIcon={rightIcon}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          inputStyle={[
            styles.input,
            multiline && styles.inputMultiline,
            status === 'valid' && styles.inputValid,
            status === 'invalid' && styles.inputInvalid,
          ]}
          inputContainerStyle={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            status === 'valid' && styles.containerValid,
            status === 'invalid' && styles.containerInvalid,
          ]}
          containerStyle={styles.container}
          renderErrorMessage={false}
        />
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : statusText ? (
        <Text style={[
          styles.statusText,
          status === 'valid' && styles.statusTextValid,
          status === 'invalid' && styles.statusTextInvalid,
        ]}>
          {statusText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  focusRing: {
    borderRadius: 16,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: 'transparent',
  },
  focusRingActive: {
    borderColor: colors.primaryTint,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.error,
  },
  inputValid: {
    // optional valid state styling
  },
  inputInvalid: {
    // optional invalid state styling
  },
  statusText: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  statusTextValid: {
    color: colors.success,
  },
  statusTextInvalid: {
    color: colors.error,
  },
  inputContainer: {
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1.5, // Override RNE default
  },
  inputContainerFocused: {
    borderColor: colors.primary,
  },
  containerValid: {
    borderColor: colors.success,
  },
  containerInvalid: {
    borderColor: colors.error,
  },
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

export default CustomInput;
