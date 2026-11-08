import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

/**
 * Safe, universal haptic & tactile feedback triggers that work across iOS and Android.
 * - iOS: Leverages Apple's native Taptic Engine via expo-haptics.
 * - Android: Attempts expo-haptics impact/notification, backed by explicit React Native
 *   Vibration patterns ensuring physical feedback on all hardware (including ERM vibrators).
 */
export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light',
) => {
  if (Platform.OS === 'web') return;

  try {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } else {
      // Android: invoke expo-haptics first
      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch {
        // Fallback to direct Vibration
      }

      // Android hardware fallback: guarantees buzz on all Android models (ERM vibrators)
      switch (type) {
        case 'light':
          Vibration.vibrate(20);
          break;
        case 'medium':
          Vibration.vibrate(40);
          break;
        case 'heavy':
          Vibration.vibrate(70);
          break;
        case 'success':
          Vibration.vibrate([0, 40, 60, 45]);
          break;
        case 'warning':
          Vibration.vibrate([0, 60, 40, 60]);
          break;
        case 'error':
          Vibration.vibrate([0, 70, 50, 70, 50, 70]);
          break;
      }
    }
  } catch (_) {
    // Gracefully handle if device vibrator is disabled or unavailable
  }
};
