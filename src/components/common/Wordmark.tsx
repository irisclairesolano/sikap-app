import React from 'react';
import { Image } from 'react-native';

interface WordmarkProps {
  size?: number;
}

export const Wordmark: React.FC<WordmarkProps> = ({ size = 48 }) => {
  // Height is size, width is scaled proportionally (approx 3.5 times the height)
  const height = size;
  const width = size * 3.5;

  return (
    <Image
      source={require('../../../assets/logo/04_Wordmark.png')}
      style={{ width, height }}
      resizeMode="contain"
    />
  );
};
