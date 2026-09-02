import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, fonts } from '../../theme';

interface AvatarProps {
  name: string;
  size?: number;
  url?: string | null;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, url }) => {
  const [imageError, setImageError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (url && !imageError) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        onError={() => setImageError(true)}
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
