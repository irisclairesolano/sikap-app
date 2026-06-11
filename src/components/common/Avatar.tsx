import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';

interface AvatarProps {
  name: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      }
    ]}>
      <Text style={[
        styles.text,
        {
          fontSize: size * 0.4,
        }
      ]}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  text: {
    fontFamily: fonts.bodyBold,
    color: colors.primaryDark,
  },
});
