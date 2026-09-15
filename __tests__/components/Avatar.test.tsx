import React from 'react';
import { render } from '@testing-library/react-native';
import { Avatar } from '../../src/components/common/Avatar';

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, { testID: 'expo-avatar-image', ...props }),
  };
});

describe('Avatar Component Optimization Tests', () => {
  it('renders initial letter when url is not provided', async () => {
    const { getByText, queryByTestId } = await render(<Avatar name="Maria Santos" size={48} />);
    expect(getByText('M')).toBeTruthy();
    expect(queryByTestId('expo-avatar-image')).toBeNull();
  });

  it('renders expo-image with memory-disk caching and high priority when url is provided', async () => {
    const avatarUrl = 'https://supabase.co/storage/v1/object/sign/government-ids/avatars/1.jpg';
    const { getByTestId, queryByText } = await render(
      <Avatar name="Maria Santos" size={48} url={avatarUrl} />,
    );

    const imageElement = getByTestId('expo-avatar-image');
    expect(imageElement).toBeTruthy();
    expect(imageElement.props.source).toEqual({ uri: avatarUrl });
    expect(imageElement.props.cachePolicy).toBe('memory-disk');
    expect(imageElement.props.priority).toBe('high');
    expect(imageElement.props.transition).toBe(150);
    expect(queryByText('M')).toBeNull();
  });
});
