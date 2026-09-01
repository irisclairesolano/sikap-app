import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, fonts } from '../../theme';

interface AvatarProps {
  name: string;
  size?: number;
  url?: string | null;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, url }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.4,
          },
        ]}
      >
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
