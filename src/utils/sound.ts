import { Platform } from 'react-native';
import { triggerHaptic } from './haptics';

// Safe require of sound assets
const sentSoundAsset = require('../../assets/sounds/message_sent.wav');
const receivedSoundAsset = require('../../assets/sounds/message_received.wav');

let sentPlayer: any = null;
let receivedPlayer: any = null;

/**
 * Plays a crisp, subtle outgoing sound when a message or image is sent.
 * Safe across all platforms and fails silently on muted or unsupported devices.
 */
export const playMessageSentSound = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'test') return;

  try {
    if (Platform.OS === 'web') {
      if (typeof Audio !== 'undefined') {
        const audio = new Audio(sentSoundAsset);
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
      return;
    }

    const { createAudioPlayer } = require('expo-audio');
    if (!sentPlayer && typeof createAudioPlayer === 'function') {
      sentPlayer = createAudioPlayer(sentSoundAsset);
    }

    if (sentPlayer) {
      if (typeof sentPlayer.seekTo === 'function') {
        try {
          await sentPlayer.seekTo(0);
        } catch (_) {}
      }
      sentPlayer.play();
    }
  } catch (_) {
    // Sound playback not supported or audio session muted
  }
};

/**
 * Plays a gentle incoming chime when a new message is received in chat.
 * Safe across all platforms and fails silently on muted or unsupported devices.
 */
export const playMessageReceivedSound = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'test') return;

  try {
    if (Platform.OS === 'web') {
      if (typeof Audio !== 'undefined') {
        const audio = new Audio(receivedSoundAsset);
        audio.volume = 0.6;
        audio.play().catch(() => {});
      }
      return;
    }

    const { createAudioPlayer } = require('expo-audio');
    if (!receivedPlayer && typeof createAudioPlayer === 'function') {
      receivedPlayer = createAudioPlayer(receivedSoundAsset);
    }

    if (receivedPlayer) {
      if (typeof receivedPlayer.seekTo === 'function') {
        try {
          await receivedPlayer.seekTo(0);
        } catch (_) {}
      }
      receivedPlayer.play();
    }
  } catch (_) {
    // Sound playback not supported or audio session muted
  }
};

/**
 * Combined message haptic + sound feedback utility for unified messaging feel.
 */
export const playMessageFeedback = async (type: 'sent' | 'received'): Promise<void> => {
  if (type === 'sent') {
    triggerHaptic('light');
    await playMessageSentSound();
  } else {
    triggerHaptic('medium');
    await playMessageReceivedSound();
  }
};
