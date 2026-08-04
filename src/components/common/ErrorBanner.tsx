import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

interface ErrorBannerProps {
  message: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={20} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.rejected.bg, // use themed error background tint
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.error,
    marginLeft: 8,
    flex: 1,
  },
});
