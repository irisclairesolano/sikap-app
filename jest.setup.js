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
