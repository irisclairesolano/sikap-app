import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';

interface WordmarkProps {
  size?: number;
}

export const Wordmark: React.FC<WordmarkProps> = ({ size = 48 }) => {
  const dotSize = size * 0.25; // Scale dot based on text size (e.g., 16px for 64px text)
  const dotOffset = size * -0.04; // e.g., -2.5px for 64px

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: size }]}>sikap</Text>
      <View 
        style={[
          styles.dot, 
          { 
            width: dotSize, 
            height: dotSize, 
            borderRadius: dotSize / 2,
            marginLeft: dotOffset,
            marginBottom: dotSize * 0.5,
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  text: {
    fontFamily: fonts.display, // Using Fraunces
    color: colors.ink,
    letterSpacing: -0.04 * 48, // Will be overridden somewhat but it's fine
  },
  dot: {
    backgroundColor: colors.primary,
  },
});
