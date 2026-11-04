/**
 * ============================================================================
 * MODULE: Push & In-App Notification Hook (src/hooks/usePushNotifications.ts)
 * ============================================================================
 *
 * (a) Screen / Module Role in the SIKAP Mobile App:
 *     Manages OS-level push notification permissions, Android notification
 *     channel configuration, Expo Push Token retrieval, and a dual-channel
 *     foreground alert system (combining an in-app top toast banner with a
 *     local OS status-bar notification).
 *
 * (b) Key State & Hooks Used:
 *     - `usePushNotifications()`: Requests notification permissions on physical
 *       devices, fetches the Expo Push Token (`expoPushToken`), and attaches
 *       foreground notification listeners.
 *     - `subscribeToInAppBanner(listener)`: Pub/Sub observer pattern consumed by
 *       `RootNavigator` to display a floating toast banner at the top of the screen.
 *     - `triggerSystemNotification(...)`: Deduplicated dispatcher invoked by
 *       Pusher WebSocket handlers (`realtime.ts`) to surface real-time events
 *       both inside the app and in the Android/iOS system tray.
 *
 * (c) UI <-> React Query <-> Pusher WebSockets <-> Laravel REST API Data Flow:
 *     1. Token Registration: `usePushNotifications()` retrieves the device's
 *        `ExponentPushToken[...]` and passes it to `RootNavigator`, which
 *        persists it to Laravel via `PUT /api/v1/profile`.
 *     2. Background Delivery: When the app is backgrounded or closed, Laravel
 *        dispatches push payloads through the Expo Push API to the device tray.
 *     3. Foreground Real-Time Delivery: When the app is open, Pusher WebSocket
 *        events (`message.sent`, `notification.sent`) invalidate the React Query
 *        `['notifications']` cache and call `triggerSystemNotification()`,
 *        which deduplicates by `dedupeKey` (`shownNotificationIds`) so users
 *        never see duplicate banners.
 * ============================================================================
 */
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

export interface PushNotificationState {
  expoPushToken?: { data: string };
  notification?: Notifications.Notification;
}

export interface InAppBannerPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// In-memory Pub/Sub registry for the top in-app notification banner in RootNavigator
// and bounded LRU-like Set (`shownNotificationIds`) to prevent duplicate alerts.
type BannerListener = (payload: InAppBannerPayload) => void;
const bannerListeners = new Set<BannerListener>();
const shownNotificationIds = new Set<string>();

export const subscribeToInAppBanner = (listener: BannerListener): (() => void) => {
  bannerListeners.add(listener);
  return () => {
    bannerListeners.delete(listener);
  };
};

// Configure foreground notification display so system tray banners also pop up
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (_) {
  // Ignore in environments where native notification handler is unavailable
}

/**
 * Fires both an OS-level status-bar notification (works in APK builds AND Expo Go)
 * and an in-app top toast banner, deduplicated by `dedupeKey`.
 */
export const triggerSystemNotification = async (
  title: string,
  body: string,
  data: Record<string, any> = {},
  dedupeKey?: string,
): Promise<void> => {
  const key = dedupeKey || `${title}:${body}:${JSON.stringify(data)}`;
  if (shownNotificationIds.has(key)) {
    return;
  }
  shownNotificationIds.add(key);

  // Keep set bounded
  if (shownNotificationIds.size > 200) {
    const firstKey = shownNotificationIds.values().next().value;
    if (firstKey) shownNotificationIds.delete(firstKey);
  }

  // 1. Emit to in-app top banner subscribers
  const bannerPayload: InAppBannerPayload = {
    id: key,
    title,
    body,
    data,
  };
  bannerListeners.forEach((listener) => {
    try {
      listener(bannerPayload);
    } catch (_) {}
  });

  // 2. Schedule immediate OS status-bar / lock-screen notification
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: null,
    });
  } catch (_) {
    // Gracefully ignore if permissions were denied or unsupported in current client
  }
};

const isRunningInExpoGoAndroid = (): boolean => {
  if (Platform.OS !== 'android') return false;
  return (
    Constants.executionEnvironment === 'storeClient' || (Constants as any).appOwnership === 'expo'
  );
};

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<{ data: string } | undefined>(undefined);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined,
  );
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      if (Platform.OS === 'web') return;

      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'SIKAP Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1E40AF',
            sound: 'default',
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          return;
        }

        // Remote push token registration is supported on physical devices outside Android Expo Go
        if (Device.isDevice && !isRunningInExpoGoAndroid()) {
          const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            (Constants as any)?.easConfig?.projectId;
          const tokenResponse = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined,
          );
          if (isMounted && tokenResponse?.data) {
            setExpoPushToken({ data: tokenResponse.data });
          }
        }
      } catch (_) {
        // Safely ignore in Expo Go or simulator environments
      }
    };

    setupNotifications();

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
        if (isMounted) {
          setNotification(notif);
        }
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
        // Handled via notification inbox / deep navigation
      });
    } catch (_) {}

    return () => {
      isMounted = false;
      try {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      } catch (_) {}
    };
  }, []);

  return { expoPushToken, notification };
};
