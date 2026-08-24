import React, { useState } from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, View } from 'react-native';
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
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
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
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  onKeyPress?: (e: any) => void;
};

const CustomInput: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry,
  multiline,
  numberOfLines,
  autoCapitalize,
  maxLength,
  keyboardType,
  editable,
  status,
  statusText,
  icon,
  rightIcon,
  onFocus,
  onBlur,
  onSubmitEditing,
  onKeyPress,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const renderLabel = () => {
    if (!label) return null;
    const hasAsterisk = label.endsWith(' *') || label.endsWith('*');
    const cleanLabel = hasAsterisk ? label.replace(/\s*\*$/, '') : label;
    const formattedLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1).toLowerCase();

    return (
      <Text style={styles.label}>
        {formattedLabel}
        {hasAsterisk ? <Text style={{ color: colors.error }}> *</Text> : null}
      </Text>
    );
  };

  return (
    <View style={styles.wrap}>
      {renderLabel()}
      <View style={[styles.focusRing, isFocused && styles.focusRingActive]}>
        <RNEInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          keyboardType={keyboardType}
          editable={editable}
          leftIcon={
            icon ? { type: 'ionicon', name: icon, color: colors.inkMuted, size: 20 } : undefined
          }
          rightIcon={rightIcon}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
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
            editable === false && styles.inputContainerDisabled,
          ]}
          containerStyle={styles.container}
          renderErrorMessage={false}
        />
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : statusText ? (
        <Text
          style={[
            styles.statusText,
            status === 'valid' && styles.statusTextValid,
            status === 'invalid' && styles.statusTextInvalid,
          ]}
        >
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
  inputContainerDisabled: {
    backgroundColor: colors.paperBright,
    borderColor: 'transparent',
    opacity: 0.7,
  },
  container: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

export default CustomInput;
