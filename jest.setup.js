/* eslint-disable @typescript-eslint/no-var-requires */
/* global jest */

// Extend default test timeout to prevent slow CI runner timeouts
jest.setTimeout(30000);

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

jest.mock(
  'expo-av',
  () => {
    const React = require('react');
    return {
      Video: (props) => React.createElement('View', props),
      ResizeMode: { CONTAIN: 'contain' },
    };
  },
  { virtual: true },
);

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

jest.mock('expo-blur', () => {
  const React = require('react');
  return {
    BlurView: ({ children, ...props }) => React.createElement('View', props, children),
  };
});

jest.mock('expo-blob', () => {
  return {
    Blob: class MockBlob {
      constructor(parts = [], options = {}) {
        this.parts = parts;
        this.type = options.type || '';
        this.size = 0;
      }
      bytes() {
        return Promise.resolve(new Uint8Array(0));
      }
      arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(0));
      }
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token]' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id'),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
  },
}));
