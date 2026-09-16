import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { colors } from '../../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
});
