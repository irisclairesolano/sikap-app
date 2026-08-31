/* eslint-disable @typescript-eslint/no-var-requires */
/* global jest */

jest.mock('expo-video', () => {
  const React = require('react');
  return {
    useVideoPlayer: jest.fn(() => ({
      play: jest.fn(),
      pause: jest.fn(),
      loop: false,
    })),
    VideoView: (props) => React.createElement('View', props),
  };
});

jest.mock('expo-av', () => {
  const React = require('react');
  return {
    Video: (props) => React.createElement('View', props),
    ResizeMode: { CONTAIN: 'contain' },
  };
});

jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: (props) => React.createElement('View', props),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: (props) => React.createElement('View', props),
    MaterialIcons: (props) => React.createElement('View', props),
    FontAwesome: (props) => React.createElement('View', props),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});
